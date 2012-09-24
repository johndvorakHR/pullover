# pullover
## Pull git repos. A counterpart to pushover.

## install:

```
$ npm install pullover
```

## example:

```js
var hook = require('hubhook')(), // listen to github post-commit hooks.
    pullover = require('../')('/tmp/repos');

var http = require('http');

// server for listening for git post-commit hook action
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

// payload
hook.on('payload', function (payload) {

  // pullover can parse github-style payloads automagically.
  pullover.pull(payload, function (err) {
    console.log(err || 'success!');
  });
});
```

## API

var pullover = require('pullover')

### var p = pullover(repoDir, opts={autoCreate:true})
### var p = pullover(pushover)

Create a new pullover object from the directory `repoDir`.
`repoDir` should be entirely empty except for git repo directories.

By default, repository targets will be created if they don't exist. You can
disable that behavior with `opts.autoCreate`.

Unlike in pushover, all repos are checked-out instead of being bare, at least
until someone figures out the "pull" alternative for bare repos for me.

pullover can also accept a pushover, in which case it uses the same
configuration (minus checkout).

### p.pull(remoteUrl, repoName, <cb>)
### p.pull(payload)

Pull from `remoteUrl` repository and store in `repoName`. Optionally get a
callback `cb(err)` to be notified when the repository was created.

Optionally, pass in a
[github-style "payload" object](https://help.github.com/articles/post-receive-hooks)
and pullover will intelligently deduce the repo name and git
url from the payload object.

## tests:

```
$ npm test
```

## license:

MIT/X11.
