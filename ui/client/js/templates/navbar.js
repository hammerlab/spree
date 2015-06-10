
MongoUrl = new Mongo.Collection('mongoUrl');

Meteor.subscribe('mongoUrl');

function fullMongoUrl() {
  var url = MongoUrl.findOne();
  return url && url.url || "";
}
function mongoUrl() {
  var url = MongoUrl.findOne();
  return url && url.shortUrl || "";
}
Template.registerHelper("mongoUrl", mongoUrl);

Template.navbar.events({
  'click .navbar-text': function(e) {
    prompt("Copy the mongo URL below", fullMongoUrl());
  }
});
