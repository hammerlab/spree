
TableHeader = React.createClass({
  onClick(e) {
    var extantSort = Cookie.get(this.props.tableSortKey);
    var newSort =
          (extantSort && extantSort.id == this.props.id) ?
          { id: this.props.id, dir: -extantSort.dir } :
          { id: this.props.id, dir: this.props.defaultSort || 1 };

    Cookie.set(this.props.tableSortKey, newSort);
  },
  render() {
    var extantSort = Cookie.get(this.props.tableSortKey);
    var isCurrentSort = extantSort && extantSort.id == this.props.id;
    return <th onClick={this.onClick}>{this.props.label + (isCurrentSort ? (extantSort.dir == 1 ? ' ▴' : ' ▾') : '')}</th>
  }
});


