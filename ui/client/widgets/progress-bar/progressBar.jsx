
ProgressBar = React.createClass({
  render() {
    var counts = this.props.counts;
    var label =
          (counts && counts.succeeded || 0) +
          "/" +
          (counts && counts.num || "?") +
          (counts && counts.running ? (" (" + counts.running + " running)") : "");

    return <div className="progress">
      <span className="progress-label">{label}</span>
      <div className="bar bar-completed" style={{width: ((counts && (counts.succeeded / counts.num) || "") * 100) + '%'}}></div>
      <div className="bar bar-running" style={{width: ((counts && (counts.running / counts.num) || "") * 100) + '%'}}></div>
    </div>;
  }
});
