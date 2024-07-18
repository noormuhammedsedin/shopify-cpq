const express = require('express');
const router = express.Router();
const axios = require('axios');
const Quote = require("../models/quote.model");
require('dotenv').config();
const SHOP = process.env._SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env._ACCESS_TOKEN;

const graphClient = axios.create({
  baseURL: `https://${SHOP}/admin/api/2023-04/graphql.json`,
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
  }
});

const toGlobalId = (variantId) => {
  return Buffer.from(`gid://shopify/ProductVariant/${variantId}`).toString('base64');
};

router.post('/:quoteId', async (req, res) => {
  const quoteId = req.params.quoteId;
  try {
    const quote = await Quote.findOne({ salesforceId: quoteId });
    if (!quote) {
      return res.status(404).send('Quote not found');
    }

    if (quote.status !== 'Approved') {
      return res.status(400).send('Quote is not approved');
    }

    const orderData = {
      query: `
        mutation createOrder($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          email: quote.customerInfo.email,
          shippingAddress: {
            firstName: quote.customerInfo.first_name,
            lastName: quote.customerInfo.last_name,
            // address1: quote.customerInfo.address,
            phone: quote.customerInfo.phone,
          },
          lineItems: quote.products.map(product => ({
            variantId: toGlobalId(product.parent.variant_id),
            quantity: 1,
          })).concat(
            quote.products.flatMap(product => product.components.map(component => ({
              variantId: toGlobalId(component.id),
              quantity: 1,
              customAttributes: [{
                key: component.title,
                value: `${component.price / 100}`
              }]
            })))
          )
        }
      }
    };

    const shopifyResponse = await graphClient.post('', orderData);
    const { draftOrderCreate } = shopifyResponse.data.data;

    if (draftOrderCreate.userErrors.length > 0) {
      return res.status(400).json({ errors: draftOrderCreate.userErrors });
    }

    const draftOrderId = draftOrderCreate.draftOrder.id;
    // Send invoice email for the draft order
    const invoiceData = {
      query: `
        mutation draftOrderInvoiceSend($id: ID!) {
          draftOrderInvoiceSend(id: $id) {
            draftOrder {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        id: draftOrderId,
      }
    };

    const invoiceResponse = await graphClient.post('', invoiceData);
    const { draftOrderInvoiceSend } = invoiceResponse.data.data;

    if (draftOrderInvoiceSend.userErrors.length > 0) {
      console.error('Error sending invoice email:', draftOrderInvoiceSend.userErrors);
    }

    res.status(201).json({ message: 'Draft order created successfully', draftOrderId });

  } catch (error) {
    console.error('Error converting quote to order:', error.message);
  }
});

module.exports = router;

