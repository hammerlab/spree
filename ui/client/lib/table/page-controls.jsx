
TablePageControls = React.createClass({
  shouldComponentUpdate(newProps, newState) {
    return newProps.showSettingsGear == this.props.showSettingsGear;
  },
  prevPage() {
    Cookie.set(
          this.props.optsKey,
          {
            skip:  Math.max(0, this.props.start - this.props.size),
            limit:  this.props.size,
            sort:  this.props.sort
          }
    );
  },
  nextPage() {
    Cookie.set(
          this.props.optsKey,
          {
            skip:  this.props.end,
            limit:  this.props.size,
            sort:  this.props.sort
          }
    );
  },
  firstPage() {
    Cookie.set(
          this.props.optsKey,
          {
            skip: 0,
            limit: this.props.size,
            sort: this.props.sort
          }
    );
  },
  lastPage() {
    Cookie.set(
          this.props.optsKey,
          {
            skip: this.props.size * Math.floor((this.props.total - 1) / this.props.size),
            limit: this.props.size, sort: this.props.sort
          }
    );
  },
  onPageClick(idx) {
    return function() {
      var newOpts = {};
      newOpts.skip = this.props.size * idx;
      newOpts.limit = this.props.size;
      newOpts.sort = this.props.sort;
      Cookie.set(this.props.optsKey, newOpts);
    }
  },
  render() {
    var pageIdx = parseInt(this.props.start / this.props.size);
    var maxPageIdx = parseInt(Math.ceil(this.props.total / this.props.size));
    var pageLinkIdxs = [];
    var maxNumPageLinks = 5;
    var pageLinksWindow = parseInt(maxNumPageLinks / 2);
    if (maxPageIdx <= maxNumPageLinks) {
      for (var i = 0; i < maxPageIdx; i++) {
        pageLinkIdxs.push(i);
      }
    } else {
      var n = 0;
      for (var i = Math.min(maxPageIdx - maxNumPageLinks, Math.max(0, pageIdx - pageLinksWindow));
           i < Math.min(maxPageIdx, pageIdx + pageLinksWindow) || n < maxNumPageLinks;
           i++, n++) {
        pageLinkIdxs.push(i);
      }
    }
    var pageLinks = pageLinkIdxs.map(function(idx) {
      var content = <div key={idx} className="page-idx">{idx + 1}</div>;
      return idx == pageIdx ?
            content :
            <a key={idx} className="page-link" onClick={this.onPageClick(idx).bind(this)}>{content}</a>;
    }.bind(this));
    return (this.props.total && this.props.total > this.props.size) ?
          <span className="page-controls">
            {this.props.start ? <span className="double-left left" onClick={this.firstPage}></span> : null}
            {this.props.start ? <span className="single-left left" onClick={this.prevPage}>️</span> : null}
            {pageLinks.length ? pageLinks : null}
            {(this.props.end < this.props.total) ? <span className="single-right right" onClick={this.nextPage}>️︎</span> : null }
            {(this.props.end < this.props.total) ? <span className="double-right right" onClick={this.lastPage}>︎</span> : null }
          </span> :
          null;
  }
});
