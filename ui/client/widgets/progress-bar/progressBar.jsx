
ProgressBar = React.createClass({
  render() {
    var label = this.props.label;
    var running = 0;
    var succeeded = 0;
    if (label) {
      succeeded = this.props.used / this.props.total;
    } else {
      var counts = this.props.counts;
      if (!counts) {
        return null;
      }
      running = counts.running || 0;
      succeeded = counts.succeeded || 0;
      var total = Math.max(running + succeeded, counts.num);
      label =
            (counts.succeeded || 0) +
            "/" +
            (total || "?") +
            (counts.running ? (" (" + counts.running + " running)") : "");
    }
    return <div className="progress">
      <span className="progress-label">{label}</span>
      <div className="bar bar-completed" style={{width: (((succeeded / total) || 0) * 100) + '%'}}></div>
      {running ? <div className="bar bar-running" style={{width: (((running / total) || 0) * 100) + '%'}}></div> : null}
    </div>;
  }
});
