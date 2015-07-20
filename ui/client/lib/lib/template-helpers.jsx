
Template.registerHelper("setTitle", function(title) {
  document.title = title;
  return null;
});

Template.registerHelper("log", function(something) {
  console.log.apply(console, Array.prototype.slice.call(arguments, 0, arguments.length - 1));
});

Template.registerHelper("formatTime", formatTime);
Template.registerHelper("formatDateTime", formatDateTime);
Template.registerHelper("formatBytes", formatBytes);
Template.registerHelper("formatDuration", formatDuration);

Template.registerHelper("orZero", function(n) { return n || 0; });
Template.registerHelper("orDash", function(n) { return n || '-'; });
Template.registerHelper("orEmpty", function(n) { return n || {}; });

Template.registerHelper('first', function(data) { return data[0]; });
Template.registerHelper('second', function(data) { return data[1]; });

Template.registerHelper('nonEmptyObject', (o) => { return !jQuery.isEmptyObject(o); });
