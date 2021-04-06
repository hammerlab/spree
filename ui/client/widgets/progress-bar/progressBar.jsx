
ProgressBar = React.createClass({
  render() {
    var label = this.props.label;
    var running = 0;
    var succeeded = 0;
    var failed = 0;
    var total = 0;
    if (label) {
      succeeded = this.props.used;
      total = Math.max(succeeded, this.props.total || 0);
    } else {
      var counts = this.props.counts;
      if (!counts) {
        return null;
      }
      running = counts.running || 0;
      succeeded = counts.succeeded || 0;
      failed = counts.failed || 0;
      var skipped = counts.skipped || 0;
      total = Math.max(running + succeeded + failed, counts.num - skipped);
      var clauses = [];
      if (counts.running) clauses.push(counts.running + " running");
      if (failed) clauses.push(failed + " failed");
      if (skipped) clauses.push(skipped + " skipped");
      label =
            (counts.succeeded || 0) +
            "/" +
            (total || "?") +
            (clauses.length ? (" (" + clauses.join(", ") + ")") : "");
    }
    var successPercent = parseInt(((succeeded / total) || 0) * 100);
    var failurePercent = parseInt(((failed / total) || 0) * 100);
    var runningPercent = parseInt(((running / total) || 0) * 100);
    return <div className="progress">
      <span className="progress-label">{label}</span>
      <div className="progress-bar progress-bar-completed" style={{width: successPercent + '%'}}></div>
      {failed ? <div className="progress-bar progress-bar-failed" style={{width: failurePercent + '%'}}></div> : null}
      {running ? <div className="progress-bar progress-bar-running" style={{width: runningPercent + '%'}}></div> : null}
    </div>;
  }
});
