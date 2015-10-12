
redirectToAppUrl = (key) => {
  return () => {
    var app = Applications.findOne();
    if (!app) return;
    var appId = app.id;
    Router.go(key, {_appId: appId});
  };
};

Meteor.startup(() => {
  var keyListener = new Keypress.Listener();

  keyListener.simple_combo("shift s", function() {
    console.log("You pressed shift and s");
  });

  keyListener.sequence_combo("g a", function() {
    Router.go("/");
  }, true);

  [
    ['j', 'jobs'],
    ['s', 'stages'],
    ['t', 'rdds'],
    ['n', 'environment'],
    ['e', 'executors']
  ].forEach((a) => {
    keyListener.sequence_combo("g " + a[0], redirectToAppUrl(a[1]), true);
    keyListener.simple_combo(a[0], redirectToAppUrl(a[1]));
  });

});
