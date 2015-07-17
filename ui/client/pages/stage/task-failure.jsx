
StackTrace = React.createClass({
  render() {
    return <div className="stack-trace">
      {this.props.stack.map((s) => {
        return <div>
          {s.DeclaringClass}.{s.MethodName} {s.FileName}:{s.LineNumber}
        </div>;
      })}
    </div>;
  }
});
TaskEnd = React.createClass({
  render() {
    if (this.props.reason === 'FetchFailed') {
      var bma = this.props.BlockManagerAddress;
      return <span>
        Fetch failed, {bma.Host}:{bma.Port} ({bma.ExecutorID}): {this.props.Message}.
        Shuffle {this.props.ShuffleID}, map {this.props.MapID}, reduce {this.props.ReduceID}.
      </span>;
    } else if (this.props.reason === 'ExceptionFailure') {
      return <div>
        <div>{this.props.ClassName}: {this.props.Description}.</div>
        <div>{this.props.FullStackTrace}</div>
        <StackTrace stack={this.props.StackTrace} />
      </div>;
    } else if (this.props.reason === 'ExecutorLostFailure') {
      var executor = StageExecutors.findOne({ execId: this.props.ExecutorID });
      return <div>
        {this.props.reason}: {this.props.ExecutorID} ({executor ? (executor.host + ':' + executor.port) : '???'})
      </div>;
    } else {
      return JSON.stringify(this.props);
    }
  }
});

