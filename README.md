# spruit
Spark UI built with MeteorJS. Updates in real-time from a MongoDB store populated by [`Spear`][]:

![](http://f.cl.ly/items/1U1Y0x003p0Q1S1J0j3B/spark.gif)

*Top/Middle: `spruit` pages showing all jobs and the details of one running job; bottom: a `spark-shell` running a simple job.*

## Usage

### Start Spruit
Simply run:
```
$ meteor
```

You can now see your (presumably blank) `spruit` dashboard at [http://localhost:3000](http://localhost:3000).

You can also use the handy `./start` script to start Meteor pointing at an existing Mongo instance:

```
$ ./start -h <mongo host> -p <mongo port> -d <mongo db> --port <meteor port>
```

Either way, Meteor will print out the URL of the Mongo instance it's using when it starts up.

### Build [`Spear`][]
[`Spear`][] writes Spark events to a Mongo database that Spruit can then read/display.

You can build `Spear` from within this repo:

```
$ cd .submodules/spear && sbt assembly
```

You'll need to have cloned with `git clone --recursive` or run `git submodule update` in order to have `.submodules/spear` cloned.

### Configure [`Spear`][]

Per [the Spear README](https://github.com/hammerlab/spear/blob/master/README.md), include the following arguments to your Spark commands:
```
  # Include Spear on the driver's classpath
  --driver-class-path /path/to/spear-with-dependencies-1.0.0-SNAPSHOT.jar
  
  # Register Spear as a SparkListener
  --conf spark.extraListeners=org.hammerlab.spear.Spear
  
  # Point it at your Mongo instance
  --conf spear.host=<mongo host>
  --conf spear.port=<mongo port>
  --conf spear.db=<mongo db name>
```

**Important:** for Spruit to update in real-time, your Mongo instance needs to have a "replica set" initialized, per [this Meteor forum thread](https://forums.meteor.com/t/polling-for-external-mongo-changes/4151); Meteor's default mongo configuration will have this, but otherwise you'll need to set it up yourself. It should be as simple as:
* adding the `--replSet=rs0` flag to your `mongod` command (where `rs0` is a dummy name for the replica set), and
* running `rs.initialize()` from a mongo shell connected to that `mongod` server.

Now your Spark jobs will write events to the Mongo instance of your choosing, and `spruit` will display them to you in real-time!


[`Spear`]: https://github.com/hammerlab/spear
