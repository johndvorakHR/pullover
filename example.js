var hook = require('./hook')(),
    pullover = require('./pullover')('/tmp/repos');

var http = require('http');

http.createServer(function (req, res) {
  if (req.url === '/api/webhooks/git') {
    return hook.handle(req, res);
  }
  res.end('lolno');
}).listen(7005);

hook.on('payload', function (payload) {
  pullover.pull(payload, function (err) {
    console.log(err || 'success!');
  });
});
