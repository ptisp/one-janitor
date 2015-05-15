var Host = require('./host'),
  OpenNebula = require('opennebula'),
  async = require('async'),
  colors = require('colors'),
  conf = require('../conf');

var Janitor = function(passphrase) {
  this.passphrase = passphrase;
  this.one = new OpenNebula(process.env.ONE_CREDENTIALS, process.env.ONE_HOST);
  this.conf = {
    'hypervisors': []
  };
};

Janitor.prototype.loadHypervisors = function(callback) {
  console.log('Loading HVs...'.green);

  var self = this;

  this.one.getHosts(function(err, hvs) {
    for (var i = 0; i < hvs.length; i++) {
      var aux = hvs[i];
      var hv = {
        'id': aux.ID
      };

      var ip = aux.NAME;
      if(isPrivateIP(ip)) {
        ip = conf.hypervisors['' + hv.id].address;
      }

      hv.address = ip;
      hv.instance = new Host(self.passphrase, ip, process.env.JPORT);

      self.conf.hypervisors.push(hv);
      console.log('HV %s loaded!'.green, hv.address);
    }
    if (callback) callback();
  });

  function isPrivateIP(ip) {
    var parts = ip.split('.');
    if (parts[0] === '10' ||
      (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
      (parts[0] === '192' && parts[1] === '168')) {
      return true;
    }
    return false;
  }
};

Janitor.prototype.loadLVs = function(callback) {
  async.mapSeries(this.conf.hypervisors, function(hv, cb) {
    hv.instance.scanVMs(function(output) {
      hv.virsh = output;
      console.log('Virsh loaded on HV %s with %s VMs'.yellow, hv.address, hv.virsh.length);
      hv.instance.scanLVs(function(output) {
        hv.lvs = output;
        console.log('LVs loaded on HV %s with %s volumes'.yellow, hv.address, Object.keys(hv.lvs).length);
        cb();
      });
    });
  }, function(err, result) {
    if (callback) callback();
  });
};

Janitor.prototype.loadVMs = function(callback) {
  var self = this;
  async.mapSeries(this.conf.hypervisors, function(hv, cb) {
    var host = self.one.getHost(parseInt(hv.id));
    host.info(function(err, data) {
      hv.vms = data.HOST.VMS.ID;
      console.log('VMs loaded on HV %s with %s VMs'.yellow, hv.address, hv.vms.length);
      cb();
    });
  }, function(err, result) {
    if (callback) callback();
  });
};

Janitor.prototype.start = function(callback) {
  var self = this;
  async.waterfall([
    function(cb) {
      self.loadHypervisors(cb);
    },
    function(cb) {
      self.loadLVs(cb);
    },
    function(cb) {
      self.loadVMs(cb);
    }
  ], function(err, result) {
    self.verify();
    if (callback) callback();
  });
};

Janitor.prototype.verify = function(callback) {
  console.log('Running health check on LVM...'.green);
  this.verifyLVs();
  console.log('Running health check on VMs...'.green);
  this.verifyVMs();
  console.log('FINISHED!'.blue);
};

Janitor.prototype.verifyLVs = function() {
  for (var i = 0; i < this.conf.hypervisors.length; i++) {
    var hv = this.conf.hypervisors[i];

    for (var vmid in hv.lvs) {
      if (hv.lvs.hasOwnProperty(vmid)) {
        var lvs = hv.lvs[vmid];
        if (hv.vms.indexOf(vmid) < 0 && lvs.status == 'active') {
          console.log('VM %s has LV active on HV %s.'.red, vmid, hv.address);
        }
      }
    }
  }

  var hvv = this.conf.hypervisors[0];
  for (var vid in hvv.lvs) {
    if (hvv.lvs.hasOwnProperty(vid)) {
      var found = false;
      for (var z = 0; z < this.conf.hypervisors.length; z++) {
        if (this.conf.hypervisors[z].vms.indexOf(vid) >= 0) {
          found = true;
        }
      }
      if (found === false) {
        console.log('Found LV %s without owner.'.red, hvv.lvs[vid].paths[0]);
      }
    }
  }
};

Janitor.prototype.verifyVMs = function() {
  for (var i = 0; i < this.conf.hypervisors.length; i++) {
    var hv = this.conf.hypervisors[i];

    for (var y = 0; y < hv.virsh.length; y++) {
      var vmid = hv.virsh[y];

      if (hv.vms.indexOf(vmid) < 0) {
        console.log('VM %s is active on HV %s in the virt layer.'.red, vmid, hv.address);
      }
    }

    if (hv.virsh.length != hv.vms.length) {
      console.log('VMs length not matching on HV ' + hv.address);
    }
  }
};

module.exports = Janitor;
