var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    spawn = require('child_process').spawn;

// Lets me reuse some logic without copy-paste.
var pushover = require('pushover');

// Can take args analogous to pushover, OR a pushover object itself.
var Pullover = module.exports = function (repoDir, opts) {
  if (!(this instanceof Pullover)) {
    return new Pullover(repoDir, opts);
  }

  if (typeof opts === 'undefined') {
    if (typeof repoDir === 'string') {
      opts = {
        repoDir: repoDir
      };
    }
    else {
      opts = repoDir;
    }
  }

  this.repoDir = opts.repoDir;
  if (!this.repoDir) {
    throw Error('This won\'t work without a `repoDir` to use.');
  }

  // same as pushover
  this.autoCreate = opts.autoCreate === false ? false : true;

  // not the same.
  this.checkout = true;

  // easiest not to attempt reuse.
  this.pushover = pushover(this.repoDir, {
    autoCreate: this.autoCreate,
    checkout: this.checkout
  });

};
util.inherits(Pullover, EventEmitter);

Pullover.prototype.pull = function (opts, cb) {
  // A good chunk of this is adopted from pushover().create
  var self = this,
      pushover = this.pushover;

  if (!opts
      || typeof opts === 'function'
      || !opts.repository && (!opts.repo || !opts.remote)) {
    throw new Error(
      'you need to define either `remote.repository.url` or ' +
      'both remote and repo'
    );
  };

  // github-style hook payload
  if (opts.repository && opts.repository.url) {
    opts.repo = url.parse(opts.repository.url).path.substr(1);
    opts.remote = opts.repository.url + '.git';
  }

  if (!opts.branch) opts.branch = 'master';
  if (!cb) cb = function () {};

  if (/\.\.|^\//.test(opts.repo)) {
    return cb(new Error('invalid repo name'));
  }

  fs.stat(path.join(this.repoDir, opts.repo + '.git'),  function (err, stat) {
    if (err && self.autoCreate) {
      return pushover.create(opts.repo, next);
    }
    next(err);
  });

  function next (err) {
    if (err) {
      return cb(err);
    } 

    git([ 'remote', 'add', 'origin', opts.remote ], function (_) {
      // ignore the error since the origin might already exist
      git([ 'fetch', 'origin' ], function (err) {
        if (err) return cb(err);
        git([ 'reset', '--hard', 'origin/' + opts.branch ], cb);
      });
    });
  }

  function git (cmd, cb) {
    var dir = path.join(self.repoDir, opts.repo);
    var ps = spawn('git', cmd, {
      cwd: dir
    });
        
    var err = [];
    ps.stderr.on('data', function (data) {
      err.push(data.toString());
    });

    onexit(ps, function (code) {
      err = err.join('');
      if (code) {
        return cb(new Error(err || util.format('`git` exit code %d', code)));
      }
      cb(null);
    });
  }
};

// Borrowed from pushover. Waits for all 3 events to occur before calling back.
function onexit(ps, cb) {
  var pending = 3,
      code, sig;
    
  function onend () {
    if (--pending === 0) {
      cb(code, sig);
    }
  }

  ps.on('exit', function (c, s) {
    code = c;
    sig = s;
  });
  ps.on('exit', onend);
  ps.stdout.on('end', onend);
  ps.stderr.on('end', onend);
};
