
Template.test.helpers({
  num: function() {
    var r = Test.find().count() + ", " + new Date();
    console.log(r);
    return r;
  }
  //now: function() {
  //  var unused = Test.findOne();
  //  return new Date();
  //}
});
