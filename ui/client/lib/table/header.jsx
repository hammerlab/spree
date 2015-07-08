
function getKey(o) {
  for (k in o) return k;
}

TableHeader = React.createClass({
  onClick(e) {
    var extantOpts = Cookie.get(this.props.tableOptsKey) || {};
    var extantSort = extantOpts.sort;

    var newSort = {};
    newSort[this.props.sortKey] =
          (extantSort && (this.props.sortKey in extantSort)) ?
                -extantSort[this.props.sortKey] :
                (this.props.defaultSort || 1);

    var newOpts = jQuery.extend(extantOpts, { sort: newSort });
    Cookie.set(this.props.tableOptsKey, extantOpts);
  },
  render() {
    var opts = Cookie.get(this.props.tableOptsKey) || {};
    var sort = opts.sort;
    var isCurrentSort = sort && getKey(sort) == this.props.sortKey;
    return <th onClick={this.onClick}>{this.props.label + (isCurrentSort ? (sort[this.props.sortKey] == 1 ? ' ▴' : ' ▾') : '')}</th>
  }
});


