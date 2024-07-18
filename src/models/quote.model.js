const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  products: Array,
  customerInfo: Object,
  platform:String,
  status: String,
  salesforceId: String
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;