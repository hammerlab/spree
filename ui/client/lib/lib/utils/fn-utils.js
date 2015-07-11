
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

//makeCmpFn = function(key) {
//  var fn = null;
//  if (typeof key == 'function') {
//    fn = key;
//  } else if (typeof key == 'string') {
//    fn = acc(key);
//  } else {
//    throw new Error("Can't sort by: " + key);
//  }
//  return function(a, b) {
//    var fna = fn(a);
//    var fnb = fn(b);
//    if (fna < fnb || fna === undefined) return -1;
//    if (fna > fnb || fnb === undefined) return 1;
//    return 0;
//  }
//};

