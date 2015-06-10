
var colls = require('./collections');
var deq = require('deep-equal');

var l = require('./log').l;

module.exports.RUNNING = 0;
module.exports.FAILED = 1;
module.exports.SUCCEEDED = 2;
module.exports.SKIPPED = 3;


var upsertOpts = { upsert: true, returnOriginal: false };
var upsertCb = function(event) {
  return function(err, val) {
    if (err) {
      l.error("ERROR (" + event + "): ", err);
    } else {
      l.info("Added " + event + ": ", val);
    }
  }
};


function addSetProp(clazz, className) {
  clazz.prototype.set = function(key, val, allowExtant) {
    if (typeof key == 'string') {
      if (val === undefined) return this;
      if (key in this.propsObj) {
        if (!deq(this.propsObj[key], val)) {
          if (!allowExtant) {
            throw new Error(
                  "Attempting to set " + key + " to " + val + " on " + className + " with existing val " + this.propsObj[key]
            );
          }
          this.propsObj[key] = val;
          this.toSyncObj[key] = val;
          this.dirty = true;
        }
      } else {
        this.propsObj[key] = val;
        this.toSyncObj[key] = val;
        this.dirty = true;
      }
    } else if (typeof key == 'object') {
      for (k in key) {
        this.set(k, key[k]);
      }
    } else {
      throw new Error("Invalid " + className + ".set() argument: " + key);
    }
    return this;
  }
}

function addIncProp(clazz) {
  clazz.prototype.inc = function(key, i) {
    return this.set(key, (this.get(key) || 0) + i, true);
  };
}

function addDecProp(clazz) {
  clazz.prototype.dec = function(key, i) {
    return this.set(key, (this.get(key) || 0) - i, true);
  };
}

function addGetProp(clazz) {
  clazz.prototype.get = function(key) {
    return this.propsObj[key];
  }
}

function addUpsert(clazz, className, collectionName) {
  clazz.prototype.upsert = function() {
    if (!this.dirty) return this;
    colls[collectionName].findOneAndUpdate(
          this.findObj,
          { $set: this.toSyncObj },
          upsertOpts,
          upsertCb(className)
    );
    this.toSyncObj = {};
    this.dirty = false;
    return this;
  };
}

module.exports.mixinMongoMethods = function(clazz, className, collectionName) {
  addSetProp(clazz, className);
  addIncProp(clazz);
  addDecProp(clazz);
  addGetProp(clazz);
  addUpsert(clazz, className, collectionName);
};
