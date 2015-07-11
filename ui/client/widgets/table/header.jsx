
function getKey(o) {
  for (k in o) return k;
}

TableHeader = React.createClass({
  onClick(e) {
    if (this.props.clientSort) {
      var extantSort = Cookie.get(this.props.tableSortKey);
      var newSort =
            (extantSort && extantSort.id == this.props.id) ?
            {id: this.props.id, dir: -extantSort.dir} :
            {id: this.props.id, dir: this.props.defaultSort || 1};

      Cookie.set(this.props.tableSortKey, newSort);
    } else {

      var extantOpts = Cookie.get(this.props.tableOptsKey) || {};
      var extantSort = extantOpts.sort;

      var newSort = {};
      newSort[this.props.sortKey] =
            (extantSort && (this.props.sortKey in extantSort)) ?
                  -extantSort[this.props.sortKey] :
                  (this.props.defaultSort || 1);

      var newOpts = jQuery.extend(extantOpts, {sort: newSort});
      Cookie.set(this.props.tableOptsKey, newOpts);
    }
  },
  isCurrentSort() {
    if (this.props.clientSort) {
      var extantSort = Cookie.get(this.props.tableSortKey);
      return extantSort && extantSort.id == this.props.id ? extantSort.dir : 0;
    } else {
      var opts = Cookie.get(this.props.tableOptsKey) || {};
      var sort = opts.sort;
      return sort && getKey(sort) == this.props.sortKey ? sort[this.props.sortKey] : 0;
    }
  },
  render() {
    var opts = Cookie.get(this.props.tableOptsKey) || {};
    var sort = opts.sort;
    var isCurrentSort = this.isCurrentSort();
    return <th onClick={this.onClick}>
      {
        this.props.label +
        (
              (isCurrentSort == 1) ?
                    ' ▴' :
                    ((isCurrentSort == -1) ?
                          ' ▾' :
                          ''
                    )
        )
      }
    </th>
  }
});


