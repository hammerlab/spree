SVGGraphElement = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    const subscription = Meteor.subscribe('stage-page-graph', this.props.appId, this.props.stageId);
    return {
      ready: subscription.ready(),
      graph: Graphs.findOne({appId: this.props.appId, stageId: this.props.stageId})
    };
  },
  render() {
    if (this.data.ready) {
      console.log(this.data.graph);
      return <pre>{"Found, data is printed in console"}</pre>;
    } else {
      return <span></span>;
    }
  }
})

DAGVisualization = React.createClass({
  getInitialState() {
    return {
      toggle: false
    };
  },
  handleClick() {
    this.setState({toggle: !this.state.toggle});
  },
  render() {
    var appId = this.props.stageAttempt.appId;
    var stageId = this.props.stageAttempt.stageId;
    console.log("DAG for ", appId, stageId);
    var link = <a href="#" onClick={this.handleClick}>
      <span>{(this.state.toggle) ? "▾" : "▸"} </span>
      <span>{this.props.name}</span>
    </a>;

    if (this.state.toggle) {
      return <div>{link}<SVGGraphElement appId={appId} stageId={stageId} /></div>;
    } else {
      return <div>{link}</div>;
    }
  }
});
