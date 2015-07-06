
TableTitle = React.createClass({
  render() {
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
    </div>;
  }
});

