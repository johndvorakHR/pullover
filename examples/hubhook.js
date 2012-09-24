var hook = require('hubhook')(),
    pullover = require('../')('/tmp/repos');

var http = require('http');

http.createServer(function (req, res) {
  if (req.method === 'POST' && req.url === '/api/webhooks/git') {
    return hook.handle(req, res);
  }
  res.statusCode = 404;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({
    error: 404,
    message: 'not_found',
    hints: 'POST to /api/webhooks/git'
  }, true, 2));
}).listen(7005);

hook.on('payload', function (payload) {
  pullover.pull(payload, function (err) {
    console.log(err || 'success!');
  });
});
