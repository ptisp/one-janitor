var events = require('events'),
  sys = require('sys'),
  Client = require('ssh2').Client;

var Host = function(passphrase,address, port) {
  this.address = address;
  this.port = port || 22;
  this.passphrase = passphrase;
};

sys.inherits(Host, events.EventEmitter);

Host.prototype.scanVMs = function(cb) {
  var self = this;

  var lvs = '';

  var conn = new Client();
  conn.on('ready', function() {
    conn.exec('virsh list --all | tail -n +3 | head -n -1', function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        conn.end();
        self.processVMs(lvs, cb);
      }).on('data', function(data) {
        lvs += data.toString();
      });
    });
  }).connect({
    host: self.address,
    port: self.port,
    username: process.env.JUSER || 'root',
    privateKey: require('fs').readFileSync(process.env.HOME + '/.ssh/id_rsa'),
    passphrase: self.passphrase
  });
};

Host.prototype.processVMs = function(data, cb) {

  var lines = data.split('\n');
  var output = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].toString();
    line = line.replace(/ +(?= )/g,'');

    if(line && line.length > 0) {
      var aux = line.toString().split(' ');
      aux.shift();
      aux.shift();
      aux.pop();

      var v = aux[0].split('-')[1];
      output.push(v);
    }
  }

  if(cb) cb(output);
};

Host.prototype.scanLVs = function(cb) {
  var self = this;

  var lvs = '';

  var conn = new Client();
  conn.on('ready', function() {
    conn.exec('lvscan', function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        conn.end();
        self.processLVs(lvs, cb);
      }).on('data', function(data) {
        lvs += data.toString();
      });
    });
  }).connect({
    host: self.address,
    port: self.port,
    username: process.env.JUSER || 'root',
    privateKey: require('fs').readFileSync(process.env.HOME + '/.ssh/id_rsa'),
    passphrase: self.passphrase
  });
};

Host.prototype.processLVs = function(data, cb) {
  var lines = data.split('\n');
  var output = {};

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if(line.toString().indexOf('vg-one') >= 0) {
      var aux = line.toString().split('\'');
      aux.pop();

      aux[0] = aux[0].trim().toLowerCase();

      aux[1] = aux[1].trim();
      var aux2 = aux[1].toString().split('/');
      if(aux2[2] !== 'vg-one') {
        var aux3 = aux2[3].split('-');
        if(!output[aux3[2]]) {
          output[aux3[2]] = {};
          output[aux3[2]].status = aux[0];
          output[aux3[2]].paths = [];
        }
        output[aux3[2]].paths.push(aux[1]);
      }
    }
  }

  if(cb) cb(output);
};

module.exports = Host;
