var EventEmitter = require('events').EventEmitter,
    util = require('util');

var qs = require('querystring');

var Hook = module.exports = function () {
  if (!(this instanceof Hook)) {
    return new Hook();
  }
};
util.inherits(Hook, EventEmitter);

Hook.prototype.handle = function (req, res) {
  var payload = [],
      self = this;
  try {
    req.on('data', function (data) {
      payload.push(data.toString());
    });
    req.on('end', function () {
      self.emit('payload', JSON.parse(qs.parse(payload.join('')).payload));
      res.end(JSON.stringify({ ok: true }) + '\n');
    });
  }
  catch (err) {
    if (!self.listeners('error')) {
      return self.emit('error', err);
    }
    throw err;
  }
};

Hook.handle = function (req, res) {
  return new Hook().handle(req, res);
};
