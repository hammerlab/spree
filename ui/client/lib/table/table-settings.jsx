
TableSettings = React.createClass({
  getMeteorData() {
    return {
      columnCookieMap: Cookie.get(this.props.tableColumnsKey)
    };
  },
  render() {
    return <div
          className="settings-container"
          onMouseEnter={(e) => { this.props.showSettingsFn(true); }}
          onMouseLeave={(e) => { this.props.showSettingsFn(false); }}>
      {
        this.props.showSettingsGear ?
              <img
                    className='gear'
                    src='/img/gear.png'
                    width="20"
                    height="20"
                    /> :
              null
      }
      <div className="settings-tooltip-container">
        <div className={'settings-tooltip' + (this.props.visible ? '' : ' hidden')}>
          {
            this.props.settings.map((c) => {
              return <TableSettingsTooltipRow
                    key={c.id}
                    column={c}
                    displayed={(c.id in this.props.displayedMap)}
                    nonEmpty={(c.id in this.props.nonEmptyMap)}
                    canDisplay={(c.id in this.props.canDisplayMap)}
                    tableColumnsKey={this.props.tableColumnsKey}
                    />;
            })
          }
        </div>
      </div>
    </div>
  }
});
