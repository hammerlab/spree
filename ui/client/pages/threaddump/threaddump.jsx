
// Executors Page
Router.route("/a/:_appId/executors/:_execId/threadDump", {
  waitOn: function() {
    return [
      Meteor.subscribe('app', this.params._appId),
      Meteor.subscribe('executor-thread-dumps', this.params._appId, this.params._execId)
    ];
  },
  action: function() {
    this.render("threadDumpPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        execId: this.params._execId,
        threads: ExecutorThreadDumps.find().fetch(),
        executorsTab: 1
      }
    });
  },
  name: 'threads'
});

// Thread display box, takes 'thread' and 'isGloballyCollapsed' as props
ThreadTraceBox = React.createClass({
  getInitialState() {
    return {
      isCollapsed: this.props.isGloballyCollapsed
    };
  },
  componentWillReceiveProps(nextProps) {
    this.setState({isCollapsed: nextProps.isGloballyCollapsed});
  },
  toggleBody() {
    this.setState({isCollapsed: !this.state.isCollapsed});
  },
  render() {
    var header = "Thread " + this.props.thread.threadId + ": " + this.props.thread.threadName +
      " (" + this.props.thread.threadState + ")";
    return <div className="accordion-group">
      <div className="accordion-header">
        <a href="#" onClick={this.toggleBody} className="accordion-toggle">{header}</a>
      </div>
      <div className={"accordion-body" + ((this.state.isCollapsed) ? " hidden" : "")}>
        <pre>{this.props.thread.stackTrace}</pre>
      </div>
    </div>;
  }
})

ThreadDumpList = React.createClass({
  getInitialState() {
    return {
      isGloballyCollapsed: true
    };
  },
  toggleGlobal() {
    this.setState({isGloballyCollapsed: !this.state.isGloballyCollapsed})
  },
  render() {
    var globallyCollapsed = this.state.isGloballyCollapsed;
    var components = this.props.threads.map(function(thread) {
      return <ThreadTraceBox key={thread.threadId} thread={thread}
        isGloballyCollapsed={globallyCollapsed} />;
    });

    return <div>
      <div className="accordion-global-toggle">
        <a href="#" onClick={this.toggleGlobal}>
          {(globallyCollapsed) ? "Expand All" : "Collapse All"}</a>
      </div>
      {components}
    </div>;
  }
});

Template.threadDumpPage.helpers({
  setTitle: function(data) {
    if (data && data.appId && data.execId) {
      document.title = "Thread dump for executor " + data.execId;
    }
  },
  getThreadDumpList: function(threads) {
    return {component: ThreadDumpList, threads: threads};
  }
});
