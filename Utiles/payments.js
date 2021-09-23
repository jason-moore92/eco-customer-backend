// const model = require('../models/payments')
// const Stores = require('../models/stores')
// const utils = require('../middleware/utils')
// const db = require('../middleware/db')
// const auth = require('../middleware/auth')
// const communicator = require('../middleware/communication')
// const fs = require("fs")
// var moment = require('moment')
var crypto = require('crypto');
const Order = require("../model/Order");
const PaymentLink = require("../model/PaymentLink");
const axios = require('axios')


/********************
 * Public functions *
 ********************/

const makeRazorPayCall = async (orderData) => {
  var customerInfo = {
    "name": orderData["user"]["firstName"] + " " + orderData["user"]["lastName"],
  }

  if (orderData["user"]["verified"] === true) {
    customerInfo["email"] = orderData["user"]["email"];
  }
  if (orderData["user"]["phoneVerified"] === true) {
    customerInfo["contact"] = orderData["user"]["mobile"];
  }

  var notify = {
    "sms": orderData["user"]["phoneVerified"] === true,
    "email": orderData["user"]["verified"] === true
  }


  addDays = (date, days) => {
    const copy = new Date(Number(date))
    copy.setDate(date.getDate() + days)
    return copy
  }
  var date = new Date();
  var newDate = parseInt(addDays(date, 2) / 1000);
  console.log(newDate)
  var reference_id = await crypto.randomBytes(5).toString('hex', 0);

  try {
    var request = {
      "amount": parseInt((parseFloat(orderData["paymentDetail"]["toPay"]) * 100).toString()),
      "currency": "INR",
      "accept_partial": "false",
      "expire_by": newDate,
      "reference_id": `TMPL-${reference_id}`,
      "description": `Payment link generated for the order ${orderData["orderId"]}`,
      "customer": customerInfo,
      "notify": notify,
      "reminder_enable": true,
      "notes": {
        "policy_name": "Jeevan Bima"
      },
      "callback_url": "https://trademantri.page.link/test",
      "callback_method": "get"
    };

    const response = await axios.post(process.env.RZRPAY_URL, request, {
      auth: {
        username: process.env.RZRPAY_KEY_ID,
        password: process.env.RZRPAY_KEY_SECRET
      }
    });
    const data = await response.data;
    console.log(`______________ makeRazorPayCall success __________________`);
    await PaymentLink.create(data);
    orderData["paymentApiData"] = {
      "id": data["id"],
      "reference_id": data["reference_id"],
      "short_url": data["short_url"],
      "status": data["status"],
    };
    await Order.findByIdAndUpdate(orderData["_id"], orderData);
    return data;
  } catch (error) {
    console.log(`______________ makeRazorPayCall error __________________`);
    console.error(error);
  }
}

module.exports = { makeRazorPayCall };

