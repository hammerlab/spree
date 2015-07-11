
TableTitle = React.createClass({
  render() {
    var start = this.props.opts && this.props.opts.skip || 0;
    var size = this.props.opts && this.props.opts.limit || 100;
    var total = this.props.total;
    if (total === undefined) {
      if (this.props.totalCollection) {
        var countRecord = window[this.props.totalCollection].findOne();
        if (countRecord) {
          total = countRecord.count;
        } else {
          console.error("No count record found for collection:", this.props.totalCollection);
        }
      }
    }
    total = total || 0;
    var end = Math.min(total, start + size);
    var pageControls = {
      optsKey: this.props.optsKey,
      start: start,
      size: size,
      end: end,
      sort: this.props.opts && this.props.opts.sort,
      total: total
    };

    var titlePageInfo =
          !this.props.hideRowCount &&
          (
                ' (' +
                (
                      this.props.paginate ?
                            (
                                  (end < total || start > 0) ?
                                        ((total ?
                                                    ((start+1 == end) ? end : ((start+1) + '-' + end)) :
                                                    0
                                        ) + ' of ' + total) :
                                        end
                            ) :
                            this.props.numRows
                ) +
                ')'
          );

    return <div className="title-container">
      <h4 id={this.props.titleId} className="title">
        <span className="title-label">{
          this.props.title + (titlePageInfo ? titlePageInfo : '')
        }</span>
        {
          this.props.tableHidden ? null :
                <TableSettings {...this.props} />
        }
        <span className="toggle-collapsed" onClick={this.props.toggleCollapsed}>{this.props.tableHidden ? "▸" : "▾"}</span>
      </h4>
      {
        this.props.rightTitle ?
              <span className="right-title">{this.props.rightTitle}</span> :
              null
      }
      <TablePageControls {...pageControls} showSettingsGear={this.props.showSettingsGear} />
    </div>;
  }
});
