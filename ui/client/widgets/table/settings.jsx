
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
      <div className="settings-container-abs">
        {
              this.props.showSettingsGear ?
              <img
                    className='gear'
                    src='/img/gear.png'
                    width="21"
                    height="20"
              />
                    : null
              }
        <div className="settings-tooltip-container">
          <div className={'settings-tooltip' + (this.props.visible ? '' : ' hidden')}>
            {
                  this.props.settings.map((setting) => {
                        var id = setting.id;
                        return <TableSettingsTooltipRow
                              key={id}
                              id={id}
                              label={setting.label}
                              displayed={(id in this.props.displayedMap)}
                              nonEmpty={(id in this.props.nonEmptyMap)}
                              canDisplay={(id in this.props.canDisplayMap)}
                              tableColumnsKey={this.props.tableColumnsKey}
                        />;
                        })
                  }
          </div>
        </div>
      </div>
    </div>
  }
});
