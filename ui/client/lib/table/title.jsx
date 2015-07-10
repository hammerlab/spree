
TableTitle = React.createClass({
  render() {
    var start = this.props.opts && this.props.opts.skip || 0;
    var size = this.props.opts && this.props.opts.limit || 100;
    var pageControls = {
      optsKey: this.props.optsKey,
      start: start,
      size: size,
      end: start + size,
      sort: this.props.opts && this.props.opts.sort,
      total: this.props.total
    };
    return <div className="title-container">
      <h4 id={this.props.titleId} className="title">
        <span className="title-label">{this.props.title}</span>
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
