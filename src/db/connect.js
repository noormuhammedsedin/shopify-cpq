const mongoose = require("mongoose");
require('dotenv').config();
const mogoUrl=process.env.MONGO_URL
const connect = async () => {
  try {
    await mongoose.connect(mogoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

module.exports = connect;
