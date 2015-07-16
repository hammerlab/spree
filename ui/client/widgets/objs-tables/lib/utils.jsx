
unsetShowAll = function(cookiePrefix) {
  return () => {
    Cookie.set(cookiePrefix + "-showAll", false);
  };
};

setShowAll = function(cookiePrefix) {
  return () => {
    Cookie.set(cookiePrefix + "-showAll", true);
  };
};
