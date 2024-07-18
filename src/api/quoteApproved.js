const express = require('express');
const router = express.Router();
const axios = require('axios');
const Quote = require("../models/quote.model");
require('dotenv').config();

router.post("/",async(req,res)=>{
  const{approvalStatus,quoteName,quoteId}=req.body;
  console.log("Approval Status",approvalStatus);
  const pendingQuotes = await Quote.findOne({salesforceId:quoteId});
  
  [pendingQuotes].forEach(async (quote) => {
    try {
      if (approvalStatus === 'Approved') {
        quote.status = 'Approved';
        await quote.save();
        // Create draft order in Shopify
        if(quote.platform==="Shopify"){
          await axios.post(`http://localhost:3000/convert-quote-to-order/${quote?.salesforceId}`, {
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