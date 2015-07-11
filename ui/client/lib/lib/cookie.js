
Cookie = {
  get: function(key) {
    try {
      return JSON.parse(ReactiveCookie.get(key));
    } catch(err) {
      return null;
    }
  },
  set: function(key, val) {
    return ReactiveCookie.set(key, JSON.stringify(val));
  },
  clear: ReactiveCookie.clear
};
