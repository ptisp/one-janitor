var Host = require('./host'),
  OpenNebula = require('opennebula'),
  conf = require('../conf'),
  async = require('async'),
  colors = require('colors');

var Janitor = function(passphrase) {
  this.passphrase = passphrase;
  this.one = new OpenNebula(process.env.ONE_CREDENTIALS, process.env.ONE_HOST);
};

Janitor.prototype.loadHypervisors = function() {
  console.log('Loading HVs...'.green);
  for (var i = 0; i < conf.hypervisors.length; i++) {
    var hv = conf.hypervisors[i];
    hv.instance = new Host(this.passphrase, hv.address);
  }
};

Janitor.prototype.loadLVs = function(callback) {
  async.mapSeries(conf.hypervisors, function(hv, cb) {
    hv.instance.scanVMs(function(output) {
      hv.virsh = output;
      console.log('Virsh loaded on HV %s'.green, hv.address);
      hv.instance.scanLVs(function(output) {
        hv.lvs = output;
        console.log('LVs loaded on HV %s'.green, hv.address);
        cb();
      });
    });
  }, function(err, result) {
    if(callback) callback();
  });
};

Janitor.prototype.loadVMs = function(callback) {
  var self = this;
  async.mapSeries(conf.hypervisors, function(hv, cb) {
    var host = self.one.getHost(parseInt(hv.id));
    host.info(function(err, data) {
      hv.vms = data.HOST.VMS.ID;
      console.log('VMs loaded on HV %s'.green, hv.address);
      cb();
    });
  }, function(err, result) {
    if(callback) callback();
  });
};

Janitor.prototype.start = function(callback) {
  var self = this;

  this.loadHypervisors();

  async.waterfall([
    function(cb) {
      self.loadLVs(cb);
    }, function(cb) {
      self.loadVMs(cb);
    }
  ], function(err, result) {
    self.verify();
    if(callback) callback();
  });
};

Janitor.prototype.verify = function(callback) {
  console.log('Health verification on LVM state running...'.green);
  this.verifyLVs();
  console.log('Health verification on VMs state running...'.green);
  this.verifyVMs();
  console.log('FINISHED!'.blue);
};

Janitor.prototype.verifyLVs = function() {
  for (var i = 0; i < conf.hypervisors.length; i++) {
    var hv = conf.hypervisors[i];

    for (var vmid in hv.lvs) {
      if (hv.lvs.hasOwnProperty(vmid)) {
        var lvs = hv.lvs[vmid];
        if(hv.vms.indexOf(vmid) < 0 && lvs.status == 'active') {
          console.log('VM %s has LV active on HV %s.'.red, vmid, hv.address);
        }
      }
    }
  }
};

Janitor.prototype.verifyVMs = function() {
  for (var i = 0; i < conf.hypervisors.length; i++) {
    var hv = conf.hypervisors[i];

    for (var y = 0; y < hv.virsh.length; y++) {
      var vmid = hv.virsh[y];

      if(hv.vms.indexOf(vmid) < 0) {
        console.log('VM %s is active on HV %s in the virt layer.'.red, vmid, hv.address);
      }
    }

    if(hv.virsh.length != hv.vms.length) {
      console.log('VMs length not matching on HV ' + hv.address);
    }
  }
};

module.exports = Janitor;