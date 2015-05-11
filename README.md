# spruit
Spark UI built with MeteorJS. Updates in real-time from a MongoDB store populated by [`Spear`][]:

![](http://f.cl.ly/items/3i3b442d2x15272b3j38/Screen%20Recording%202015-05-11%20at%2003.10%20PM.gif)

*Top: a `spark-shell` running a simple job. Bottom: `spruit` UI showing its progress*

## Usage
First, use [`Spear`][] to write Spark events to a Mongo database you've set up.

**Important:** for Spruit to update in real-time, you need to initialize a "replica set" in your MongoDB, per [this Meteor forum thread](https://forums.meteor.com/t/polling-for-external-mongo-changes/4151); this should be as simple as:
* adding the `--replSet=rs0` flag to your `mongod` command (where `rs0` is a dummy name for the replica set), and
* running `rs.initialize()` from a mongo shell connected to that `mongod` server.

Having done this, you can start `spruit` after initializing some env vars related to your mongo server:

```
$ export MONGO_URL=mongodb://<host>:<port>/<spark app ID>
$ export MONGO_OPLOG_URL=mongodb://<host>:<port>/local
$ meteor
```

You can now see your (probably blank) `spruit` dashboard at http://localhost:3000!


[`Spear`]: https://github.com/hammerlab/spear
