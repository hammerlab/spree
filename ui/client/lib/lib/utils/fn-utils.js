
identity = function(x) { return x; };

acc = function(key) {
  if (!key) {
    return identity;
  }
  if (typeof key == 'string') {
    return acc(key.split('.'));
  }
  return key.reduce(function(soFar, next) {
    return function(x) {
      var sf = soFar(x);
      return sf ? sf[next] : undefined;
    };
  }, function(x) { return x; });
};

function getKeys(o) {
  var keys = [];
  for (var k in o) keys.push(k);
  return keys;
}

function arrEq(a1, a2) {
  if (a1.length != a2.length) return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] != a2[i]) return false;
  }
  return true;
}

function sameKeys(o1, o2) {
  if (!o1 && !o2) return true;
  if (!o1 || !o2) return false;
  return arrEq(getKeys(o1), getKeys(o2));
}

