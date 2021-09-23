const mongoose = require("mongoose");

let cachedPromise = null;

const connect = async () => {
  // const url = `mongodb://${process.env.MONGODB_USER}:${
  //   process.env.MONGODB_PASS
  // }@${process.env.MONGODB_URL}`;

  /// local
  // const url = 'mongodb://localhost/' + process.env.MONGODB_NAME;
  // const options = {
  //   useNewUrlParser: true,
  //   useCreateIndex: true,
  //   useUnifiedTopology: true,
  //   useFindAndModify: false
  // };

  /// cloud
  const url = process.env.MONGODB_URL;
  const options = {
    // reconnectTries: 60,
    // reconnectInterval: 1000,
    poolSize: 10,
    useNewUrlParser: true,
    useUnifiedTopology: true, 
    useCreateIndex: true
  };

  console.log("____________  mongoose connection start __________________")

  
  mongoose.set("useCreateIndex", true);

  mongoose.connection.on("error", err => {
    console.log("Database connection error: " + err);
    mongoose.Collection.createIndex
  });
  mongoose.connection.on("disconnected", () => {
    console.log("Application disconnected from the database!");
  });
  mongoose.connection.on("connected", () => {
    console.log("Application connected to the database!");
  });

  if(!cachedPromise){
    cachedPromise = mongoose.connect(url, options)
  }

  const client = await cachedPromise;
  console.log("Connected to MongoDB server");  
  return client;
};

module.exports = {
  connect
};
