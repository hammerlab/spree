SVGGraph = React.createClass({
  render() {
    return <svg>{"GRAPH"}</svg>;
  }
});

GraphRootElement = React.createClass({
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
      if (this.data.graph) {
        console.log(this.data.graph);
        return <div><SVGGraph /></div>;
      } else {
        var msg = "No visualization information available for this " + this.props.appId +
          ", stage " + this.props.stageId + ", its visualization data may have been cleaned up.";
        return <div><b>{msg}</b></div>;
      }
    } else {
      return <span></span>;
    }
  }
});

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
    var link = <span className="link-collapsed" onClick={this.handleClick}>
      <span className="link-toggle">{(this.state.toggle) ? "▾" : "▸"} </span>
      <span>{this.props.name}</span>
    </span>;

    if (this.state.toggle) {
      return <div>{link}<GraphRootElement appId={appId} stageId={stageId} /></div>;
    } else {
      return <div>{link}</div>;
    }
  }
});
