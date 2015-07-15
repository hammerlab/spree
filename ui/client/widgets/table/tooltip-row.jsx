
TableSettingsTooltipRow = React.createClass({
  getCheckbox() {
    return $(this.getDOMNode()).find('input.tooltip-checkbox');
  },
  setCookie(b) {
    var columnCookieMap = Cookie.get(this.props.tableColumnsKey) || {};
    columnCookieMap[this.props.id] = b;
    Cookie.set(this.props.tableColumnsKey, columnCookieMap);
  },
  onClick(e) {
    var checkbox = this.getCheckbox();
    var newValue = !checkbox.prop('checked');
    this.setCookie(newValue);
    e.stopPropagation();
  },
  onCheckboxClick(e) {
    e.stopPropagation();
  },
  onCheckboxChange(e) {
    var checkbox = this.getCheckbox();
    var newValue = checkbox.prop('checked');
    this.setCookie(newValue);
  },
  render() {
    return <div key={this.props.id} className="tooltip-row" onClick={this.onClick}>
      <input
            className="tooltip-checkbox"
            type="checkbox"
            onChange={this.onCheckboxChange}
            checked={this.props.canDisplay}
            onClick={this.onCheckboxClick} />
      <span className={"tooltip-label" + (this.props.nonEmpty ? '' : ' empty')}>{this.props.label}</span>
    </div>;
  }
});

