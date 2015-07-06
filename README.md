# Spree
Spree is a live-updating web UI for Spark built with [MeteorJS](https://www.meteor.com/).

![Screencast of a Spark job running and UI updating along with it](http://f.cl.ly/items/3r0C1J1Z1v472s1u1F14/Screen%20Recording%202015-07-06%20at%2001.31%20PM.gif)

*Left: `spree` pages showing all jobs and stages; right: a `spark-shell` running a simple job.*

## Usage
Spree has three components:

* [`ui`][]: a web-app that displays the contents of a Mongo database populated with information about running Spark applications.
* [`slim`][]: a Node server that receives events about running Spark applications, aggregates statistics about them, and writes them to Mongo for `spree` to read/display.
* [`spark-json-relay`][]: a [`SparkListener`][] that serializes [`SparkListenerEvent`s](https://github.com/apache/spark/blob/658814c898bec04c31a8e57f8da0103497aac6ec/core/src/main/scala/org/apache/spark/scheduler/SparkListener.scala#L32-L128) to JSON and sends them to a listening [`slim`][] process.

The latter two are linked in this repo as `git` submodules, so you'll want to have cloned with `git clone --recursive` (or run `git submodule update`) in order for them to be present.

Following are instructions for configuring/running them:

### Start `spree`
First, run a `spree` app using [Meteor][]:

```
$ cd ui   # directory that the Spree Meteor app lives in
$ meteor
```

You can now see your (presumably empty) `spree` dashboard at [http://localhost:3000](http://localhost:3000).

### Start `slim`
Next, run a `slim` process:

```
$ cd slim && node server.js
```

[`slim`][] is a Node server that receives events from Spark/`spark-json-relay` and writes them to the Mongo instance that Spree is watching. 

By default, `slim` listens for events on `localhost:8123` and writes to a Mongo at `localhost:3001`, which is the default Mongo URL for a `spree` started as above.


### Build [`spark-json-relay`][]
Build a [`spark-json-relay`][] JAR from within this repo:

```
$ cd json-relay && mvn -pl client package -DskipTests
```

A shaded JAR can then be found at `json-relay/client/target/json-relay-client-with-deps-1.0-SNAPSHOT.jar`.


### Configure Spark to use `spark-json-relay`
Finally, we'll tell Spark to send events to `spark-json-relay` by passing arguments like the following to `spark-{shell,submit}`:

```
  # Include Spear on the driver's classpath
  --driver-class-path /path/to/spree/json-relay/client/target/json-relay-client-with-deps-1.0-SNAPSHOT.jar
  
  # Register your JSON relay as a SparkListener
  --conf spark.extraListeners=org.apache.spark.JsonRelay
  
  # Point it at your `slim` instance
  --conf spark.slim.host=…
  --conf spark.slim.port=…
```

## Notes

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

Now your Spark jobs will write events to the Mongo instance of your choosing, and `spree` will display them to you in real-time!

[`ui`]: https://github.com/hammerlab/spree/tree/master/ui
[Meteor]: https://www.meteor.com/
[MeteorJS]: https://www.meteor.com/
[`slim`]: https://github.com/hammerlab/slim
[`spark-json-relay`]: https://github.com/hammerlab/spark-json-relay
[`SparkListener`]: https://github.com/apache/spark/blob/658814c898bec04c31a8e57f8da0103497aac6ec/core/src/main/scala/org/apache/spark/scheduler/SparkListener.scala#L137
