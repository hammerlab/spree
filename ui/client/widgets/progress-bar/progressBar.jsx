
ProgressBar = React.createClass({
  render() {
    var counts = this.props.counts;
    if (!counts) {
      return null;
    }
    var running = counts.running || 0;
    var succeeded = counts.succeeded || 0;
    var total = Math.max(running + succeeded, counts.num);
    var label =
          (counts.succeeded || 0) +
          "/" +
          (total || "?") +
          (counts.running ? (" (" + counts.running + " running)") : "");

    return <div className="progress">
      <span className="progress-label">{label}</span>
      <div className="bar bar-completed" style={{width: (((succeeded / total) || 0) * 100) + '%'}}></div>
      <div className="bar bar-running" style={{width: (((running / total) || 0) * 100) + '%'}}></div>
    </div>;
  }
});
