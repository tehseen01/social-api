// db.js
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectDB = async (url) => {
  console.log("connected");
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connectDB;
