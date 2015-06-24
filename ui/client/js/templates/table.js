

Template.table.events({
  'click th': function(e, t) {
    var sortKey = this.table + '-sort';
    var prevSort = Session.get(sortKey);
    if (prevSort && prevSort[0] == this.id) {
      Session.set(sortKey, [prevSort[0], -prevSort[1]]);
    } else {
      Session.set(sortKey, [this.id, -1]);
    }
  }
});


