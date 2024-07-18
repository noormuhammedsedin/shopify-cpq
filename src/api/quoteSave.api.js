const express = require('express');
const router = express.Router();
const axios = require('axios');
const Quote = require("../models/quote.model");
require('dotenv').config();
const END_POINT = process.env.END_POINT;
const TOKEN = process.env.TOKEN;

router.post('/', async (req, res) => {
  try {
    const { products, customerInfo, platform } = req.body;
    const quote = new Quote({ products, customerInfo, platform, status: 'submitted' });
    await quote.save();
    const transformedProduct = {
      parent: {
        id: products.parent.id,
        variant_id: products.parent.variant_id,
        title: products.parent.title,
        image: products.parent.image,
        price: products.parent.price / 100,
      },
      components: products.components
    };
    const transformedProductsArray = [transformedProduct];
  
    const salesforceQuoteData = {
      quoteData: {
        products: transformedProductsArray,
        customerInfo: customerInfo,
        platform: platform,
        status: "submitted"
      }
    };
    try {
      const salesforceResponse = await axios.post(`${END_POINT}/services/apexrest/createQuoteAndLineItems`, salesforceQuoteData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      const responseData = typeof salesforceResponse.data === 'string'
        ? JSON.parse(salesforceResponse.data)
        : salesforceResponse.data;
      if (responseData && responseData.quoteId) {
        quote.salesforceId = responseData.quoteId;
        await quote.save();

        return res.status(201).json({ message: 'Quote submitted successfully', data: responseData });
      } else {
        console.error('Salesforce response does not contain quoteId:', responseData);
        return res.status(500).send('Invalid response from Salesforce');
      }

    } catch (error) {
      console.error('Error sending data to Salesforce:', error.response ? error.response.data : error.message);
      return res.status(500).send('Error sending data to Salesforce');
    }

  } catch (error) {
    console.error('Error submitting quote:', error.response ? error.response.data : error.message);
    return res.status(500).send('Error submitting quote');
  }
});

module.exports = router;



