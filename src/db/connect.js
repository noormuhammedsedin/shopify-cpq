const mongoose = require("mongoose");
require('dotenv').config();
const mogoUrl= "mongodb+srv://noormuhammed:d8TAwWKJ6KZObG3p@cluster0.vxwvvvm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
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
