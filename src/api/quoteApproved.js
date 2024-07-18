const express = require('express');
const router = express.Router();
const axios = require('axios');
const Quote = require("../models/quote.model");
require('dotenv').config();

router.post("/",async(req,res)=>{
  const{approvalStatus,quoteName,quoteId}=req.body;
  const pendingQuotes = await Quote.findOne({salesforceId:quoteId});
  
  [pendingQuotes].forEach(async (quote) => {
    try {
      if (approvalStatus === 'Approved') {
        quote.status = 'Approved';
        await quote.save();
        // Create draft order in Shopify
        if(quote.platform==="Shopify"){
          await axios.post(`https://shopify-cpq-1.onrender.com/convert-quote-to-order/${quote?.salesforceId}`, {
            products: quote.products,
            customerInfo: quote.customerInfo
          });
        }
        else{
          console.log("Platform not supported")
        }
      }
    } catch (error) {
      console.error(`Error checking status for quote ${quote?.salesforceId}:`, error.response ? error.response.data : error.message);
    }
  });
})

module.exports = router;