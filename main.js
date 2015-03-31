var Janitor = require('./lib/janitor'),
  prompt = require('prompt');

console.log('OpenNebula Janitor');

prompt.get([{
  name: 'password',
  hidden: true
}], function(err, result) {
  if (err) throw err;
  var jarvis = new Janitor(result.password);
  jarvis.start();
});
