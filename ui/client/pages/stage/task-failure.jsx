
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
    if (this.props.Reason === 'FetchFailed') {
      var bma = this.props.BlockManagerAddress;
      return <span>
        Fetch failed, {bma.Host}:{bma.Port} ({bma.ExecutorID}): {this.props.Message}.
        Shuffle {this.props.ShuffleID}, map {this.props.MapID}, reduce {this.props.ReduceID}.
      </span>;
    } else if (this.props.Reason === 'ExceptionFailure') {
      return <div>
        <div>{this.props.ClassName}: {this.props.Description}.</div>
        <div>{this.props.FullStackTrace}</div>
        <StackTrace stack={this.props.StackTrace} />
      </div>;
    } else if (this.props.Reason === 'ExecutorLostFailure') {
      var executor = StageExecutors.findOne({ execId: this.props.ExecutorID });
      return <div>
        {this.props.Reason}: {this.props.ExecutorID} ({executor ? (executor.host + ':' + executor.port) : '???'})
      </div>;
    } else {
      return <div>{JSON.stringify(this.props)}</div>;
    }
  }
});

