# Spree
Spree is a live-updating web UI for Spark built with [Meteor][] and [React][].

![Screencast of a Spark job running and UI updating along with it](http://f.cl.ly/items/3r0C1J1Z1v472s1u1F14/Screen%20Recording%202015-07-06%20at%2001.31%20PM.gif)

*Left: Spree pages showing all jobs and stages, updating in real-time; right: a `spark-shell` running a simple job; see [the Screencast gallery in this repo](https://github.com/hammerlab/spree/blob/master/screencasts.md) for more examples.*

## Features!
Spree is a complete rewrite of [Spark's web UI](https://spark.apache.org/docs/1.4.0/spark-standalone.html#monitoring-and-logging), providing several notable benefits…

### Real-time Updating
All data on all pages updates in real-time, thanks to [Meteor][] magic.

### Persistence, Scalability
Spree offers a unified interface to past- and currently-running Spark applications, combining functionality that is currently spread across Spark's web UI and "history server".

It persists all information about Spark applications to MongoDB, allowing for archival storage that is easily query-able and solves various Spark-history-server issues, e.g. slow load-times, caching problems, etc.

Pagination and sorting are delegated to Mongo for graceful handling of arbitrarily large stages, RDDs, etc., which makes for a cleaner scalability story than Spark's current usage of textual event-log files and in-memory maps on the driver as ad-hoc databases.

### Usability
Spree includes several usability improvements, including:

#### Toggle-able Columns
All tables allow easy customization of displayed columns:

![](https://camo.githubusercontent.com/f8f3250e144bd8f15a23e40fc02619664a5023e1/687474703a2f2f662e636c2e6c792f6974656d732f3034303033693035316432363278334f324f32452f53637265656e2532305265636f7264696e67253230323031352d30372d3036253230617425323030322e3332253230504d2e676966)

#### Collapsible Tables
Additionally, whole tables can be collapsed/uncollapsed for easy access to content that would otherwise be "below the fold":

![](http://f.cl.ly/items/0t3J3n2w3a07181F0u36/Screen%20Recording%202015-07-17%20at%2004.55%20PM.gif)

#### Persistent Preferences/State
Finally, all client-side state is stored in cookies for persistence across refreshes / sessions, including:
* sort-column and direction, 
* table collapsed/uncollapsed status, 
* table columns' shown/hidden status,
* pages' displaying one table with "all" records vs. separate tables for "running", "succeeded", "failed" records, etc.

### Extensibility, Modularity
Spree is easy to fork/customize without worrying about changing everyones' Spark UI experience, managing custom Spark builds with bespoke UI changes, etc.

It also includes two useful standalone modules for exporting/persisting data from Spark applications:

* The [`json-relay`][] module broadcasts all Spark events over a network socket.
* The [`slim`][] module aggregates stats about running Spark jobs and persists them to indexed Mongo collections.

These offer potentially-useful alternatives to Spark's [`EventLoggingListener`][] and event-log files, respectively (Spark's extant tools for exporting and persisting historical data about past and current Spark applications).

## Usage
Spree has three components, each in its own subdirectory:

* [`ui`][]: a web-app that displays the contents of a Mongo database populated with information about running Spark applications.
* [`slim`][]: a Node server that receives events about running Spark applications, aggregates statistics about them, and writes them to Mongo for Spree to read/display.
* [`json-relay`][]: a [`SparkListener`][] that serializes [`SparkListenerEvent`s](https://github.com/apache/spark/blob/658814c898bec04c31a8e57f8da0103497aac6ec/core/src/main/scala/org/apache/spark/scheduler/SparkListener.scala#L32-L128) to JSON and sends them to a listening [`slim`][] process.

The latter two are linked in this repo as `git` submodules, so you'll want to have cloned with `git clone --recursive` (or run `git submodule update`) in order for them to be present.

Following are instructions for configuring/running them:

### Start Spree
First, run a Spree app using [Meteor][]:

```
git clone --recursive git@github.com:hammerlab/spree.git
cd spree/ui   # the Spree Meteor app lives in ui/ in this repo.
meteor        # run it
```

You can now see your (presumably empty) Spree dashboard at [http://localhost:3000](http://localhost:3000):

![](http://f.cl.ly/items/243L322B1v0G082j3X0O/Screen%20Shot%202015-07-20%20at%2012.20.38%20PM.png)

If you don't have `meteor` installed, see "Installing Meteor" below.

### Start `slim`
Next, install and run `slim`:

```
npm install -g slim.js
slim
```

[`slim`][] is a Node server that receives events from [`JsonRelay`][] and writes them to the Mongo instance that Spree is watching. 

By default, `slim` listens for events on `localhost:8123` and writes to a Mongo at `localhost:3001`, which is the default Mongo URL for a Spree started as above.

### Run Spark with [`JsonRelay`][]
Finally, download a `JsonRelay` JAR:
```
wget https://repo1.maven.org/maven2/org/hammerlab/spark-json-relay/1.0.0/spark-json-relay-1.0.0.jar
```

…and tell Spark to send events to it by passing the following arguments to `spark-{shell,submit}`:

```
  # Include JsonRelay on the driver's classpath
  --driver-class-path /path/to/json-relay-1.0.0.jar
  
  # Register your JsonRelay as a SparkListener
  --conf spark.extraListeners=org.apache.spark.JsonRelay
  
  # Point it at your `slim` instance; default: localhost:8123
  --conf spark.slim.host=…
  --conf spark.slim.port=…
```

## Comparison to Spark UI
Below is a journey through Spark JIRAs past, present, and future, comparing the current state of Spree with Spark's web UI.

### ~Fixed JIRAs
I believe the following are resolved or worked around by Spree:
* Live updating: [SPARK-5106](https://issues.apache.org/jira/browse/SPARK-5106).
* Scalability / Pagination: [SPARK-2015](https://issues.apache.org/jira/browse/SPARK-2015), [SPARK-2016](https://issues.apache.org/jira/browse/SPARK-2016), [SPARK-2017](https://issues.apache.org/jira/browse/SPARK-2017), [SPARK-4598](https://issues.apache.org/jira/browse/SPARK-4598).
* Customizability / Usability: [SPARK-1301](https://issues.apache.org/jira/browse/SPARK-1301), [SPARK-4024](https://issues.apache.org/jira/browse/SPARK-4024), [SPARK-6541](https://issues.apache.org/jira/browse/SPARK-6541).
* Other: [SPARK-9195](https://issues.apache.org/jira/browse/SPARK-9195).


### Missing Functionality
Functionality known to be present in the existing Spark web UI / history server and missing from Spree:
* Most viz covered by [SPARK-6942](https://issues.apache.org/jira/browse/SPARK-6942), including:
  * RDD DAG viz ([SPARK-6943](https://issues.apache.org/jira/browse/SPARK-6943)).
  * Event timeline viz (jobs: [SPARK-3468](https://issues.apache.org/jira/browse/SPARK-3468), stages: [SPARK-7296](https://issues.apache.org/jira/browse/SPARK-7296)).
* Executor thread-dumps.
* Streaming UI.

### Future Nice-to-haves
A motley collection of open Spark-UI JIRAs that might be well-suited for fixing in Spree:
* [SPARK-1622](https://issues.apache.org/jira/browse/SPARK-1622): expose input splits
* [SPARK-1832](https://issues.apache.org/jira/browse/SPARK-1832): better use of warning colors
* [SPARK-2533](https://issues.apache.org/jira/browse/SPARK-2533): summary stats about locality-levels
* [SPARK-3682](https://issues.apache.org/jira/browse/SPARK-3682): call out anomalous/concerning/spiking stats, e.g. heavy spilling.
* [SPARK-3957](https://issues.apache.org/jira/browse/SPARK-3957): distinguish/separate RDD- vs. non-RDD-storage.
* [SPARK-4072](https://issues.apache.org/jira/browse/SPARK-4072): better support for streaming blocks.
* Control spark application / driver from Spree:
  * [SPARK-4411](https://issues.apache.org/jira/browse/SPARK-4411): Job kill links
* [SPARK-4906](https://issues.apache.org/jira/browse/SPARK-4906): unpersist applications in `slim` that haven't been heard from in a while.
* [SPARK-7729](https://issues.apache.org/jira/browse/SPARK-7729): display executors' killed/active status.
* [SPARK-8469](https://issues.apache.org/jira/browse/SPARK-8469): page-able viz?
* Various duration-confusion clarification/bug-fixing:
  * [SPARK-8950](https://issues.apache.org/jira/browse/SPARK-8950): "scheduler delay time"-calculation bug
  * [SPARK-8778](https://issues.apache.org/jira/browse/SPARK-8778): "scheduler delay" mismatch between event timeline, task list.
* [SPARK-4800](https://issues.apache.org/jira/browse/SPARK-4800): preview/sample RDD elements.

## Notes / Implementation Details / FAQ
### BYO Mongo
Meteor (hence Spree) spins up its own Mongo instance by default, typically at port 3001.

For a variety of reasons, you may want to point Spree and Slim at a different Mongo instance. The handy `ui/start` script makes this easy:

```
$ ui/start -h <mongo host> -p <mongo port> -d <mongo db> --port <meteor port>
```

Either way, Meteor will print out the URL of the Mongo instance it's using when it starts up, and display it in the top right of all pages, e.g.:

![Screenshot of Spree nav-bar showing Mongo-instance URL](http://f.cl.ly/items/0f3Q441H2G1q1X0j1j3G/Screen%20Shot%202015-06-16%20at%2012.22.53%20AM.png)

**Important:** for Spree to update in real-time, your Mongo instance needs to have a "replica set" initialized, per [this Meteor forum thread](https://forums.meteor.com/t/polling-for-external-mongo-changes/4151).

Meteor's default mongo instance will do this, but otherwise you'll need to set it up yourself. It should be as simple as:
* adding the `--replSet=rs0` flag to your `mongod` command (where `rs0` is a dummy name for the replica set), and
* running `rs.initialize()` from a mongo shell connected to that `mongod` server.

Now your Spark jobs will write events to the Mongo instance of your choosing, and Spree will display them to you in real-time!

### Installing Meteor
Meteor can be installed, per [their docs](https://www.meteor.com/install), by running:
```
curl https://install.meteor.com/ | sh
```

### Installing Spree and Slim sans `sudo`

#### Meteor
By default, Meteor will install itself in `~/.meteor` and attempt to put an additional helper script at `/usr/local/bin/meteor`.

It's ok to skip the latter if/when it prompts you for your root password by `^C`ing out of the script.

#### Slim
`npm install -g slim.js` may require superuser privileges; if this is a problem, you can either:
* Install locally with `npm`, e.g. in your home directory:
  ```
  cd ~
  npm install slim.js
  cd ~/node_modules/slim.js
  ./slim
  ```
* Run `slim` from the sources in this repository:
  ```
  cd slim  # from the root of this repository; make sure you `git clone --recursive`
  npm install
  ./slim
  ```

### More Screencasts
See [the screencast gallery in this repo](https://github.com/hammerlab/spree/blob/master/screencasts.md) for more GIFs showing Spree in action!

### Questions / Comments?
Please [file issues](https://github.com/hammerlab/spree/issues)!

[`ui`]: https://github.com/hammerlab/spree/tree/master/ui
[Meteor]: https://www.meteor.com/
[React]: https://facebook.github.io/react/
[`slim`]: https://github.com/hammerlab/slim
[`json-relay`]: https://github.com/hammerlab/spark-json-relay
[`JsonRelay`]: https://github.com/hammerlab/spark-json-relay
[`SparkListener`]: https://github.com/apache/spark/blob/658814c898bec04c31a8e57f8da0103497aac6ec/core/src/main/scala/org/apache/spark/scheduler/SparkListener.scala#L137
[`EventLoggingListener`]: https://github.com/apache/spark/blob/658814c898bec04c31a8e57f8da0103497aac6ec/core/src/main/scala/org/apache/spark/scheduler/EventLoggingListener.scala
