const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const Order = require("../model/Order");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");
const RewardPoint = require("../model/RewardPoint");
const RewardPointHistory = require("../model/RewardPointHistory");
const rewardPointUtils = require("../Utiles/rewardPoints");
var crypto = require('crypto');
var randomstring = require("randomstring");
var handlebars = require('handlebars');
var emailHelper = require('../Utiles/emailHelper')
var dateFormat = require('dateformat');
var { base64ImageUploadToS3, pdfUploadToS3, deleteObject } = require('../Utiles/upload_to_s3')
var { sendMessageToDevice, sendMessageToTopic } = require('../Utiles/sendPushNotification')
var pdf = require('html-pdf');
var fs = require('fs');
var QRCode = require('qrcode')
var exotelApi = require('../middlewares/exotel_api')
var fcmNotificationHandler = require('../Utiles/fcmNotificationHandler');
var notificationDBHandler = require('../Utiles/notificationDBHandler');
var { getWeek, getWeekYear } = require('../Utiles/date_helper');
// var { makeRazorPayCall } = require('../Utiles/payments');
var ScratchCard = require('../model/ScratchCard');
var ScratchCardConfig = require('../model/ScratchCardConfig');
var { referralRewardOffersConfirmHandler } = require('../Utiles/referralRewardOffersConfirmHandler');
const storeUtils = require("../Utiles/store");

let { pdfToBuffer } = require("../Utiles/pdf_helper");

const stateInfo = [
  {
    "value": "AN",
    "key": "Andaman and Nicobar Islands"
  },
  {
    "value": "AP",
    "key": "Andhra Pradesh"
  },
  {
    "value": "AR",
    "key": "Arunachal Pradesh"
  },
  {
    "value": "AS",
    "key": "Assam"
  },
  {
    "value": "BR",
    "key": "Bihar"
  },
  {
    "value": "CG",
    "key": "Chandigarh"
  },
  {
    "value": "CH",
    "key": "Chhattisgarh"
  },
  {
    "value": "DH",
    "key": "Dadra and Nagar Haveli"
  },
  {
    "value": "DD",
    "key": "Daman and Diu"
  },
  {
    "value": "DL",
    "key": "Delhi"
  },
  {
    "value": "GA",
    "key": "Goa"
  },
  {
    "value": "GJ",
    "key": "Gujarat"
  },
  {
    "value": "HR",
    "key": "Haryana"
  },
  {
    "value": "HP",
    "key": "Himachal Pradesh"
  },
  {
    "value": "JK",
    "key": "Jammu and Kashmir"
  },
  {
    "value": "JH",
    "key": "Jharkhand"
  },
  {
    "value": "KA",
    "key": "Karnataka"
  },
  {
    "value": "KL",
    "key": "Kerala"
  },
  {
    "value": "LD",
    "key": "Lakshadweep"
  },
  {
    "value": "MP",
    "key": "Madhya Pradesh"
  },
  {
    "value": "MH",
    "key": "Maharashtra"
  },
  {
    "value": "MN",
    "key": "Manipur"
  },
  {
    "value": "ML",
    "key": "Meghalaya"
  },
  {
    "value": "MZ",
    "key": "Mizoram"
  },
  {
    "value": "NL",
    "key": "Nagaland"
  },
  {
    "value": "OR",
    "key": "Odisha"
  },
  {
    "value": "PY",
    "key": "Puducherry"
  },
  {
    "value": "PB",
    "key": "Punjab"
  },
  {
    "value": "RJ",
    "key": "Rajasthan"
  },
  {
    "value": "SK",
    "key": "Sikkim"
  },
  {
    "value": "TN",
    "key": "Tamil Nadu"
  },
  {
    "value": "TS",
    "key": "Telangana"
  },
  {
    "value": "TR",
    "key": "Tripura"
  },
  {
    "value": "UK",
    "key": "Uttarakhand"
  },
  {
    "value": "UP",
    "key": "Uttar Pradesh"
  },
  {
    "value": "WB",
    "key": "West Bengal"
  }
];

const orderConfrimHtmlTemplate = async (orderData, user) => {
  try {
    var html = fs.readFileSync("./public/email_template/order_confirm_email.html", { encoding: 'utf-8' });

    handlebars.registerHelper('totalPrice', function (price, promocodeDiscount, couponDiscount, couponQuantity) {
      if (price === undefined)
        return "";
      return ((price - promocodeDiscount - couponDiscount) * couponQuantity).toFixed(2);
    })

    handlebars.registerHelper('toFix2', function (value) {
      try {
        return value.toFixed(2);

      } catch (error) {
        return value;
      }
    })

    handlebars.registerHelper('isdefined', function (value) {
      return value !== undefined;
    });

    handlebars.registerHelper("if", function (couponQuantity, options) {
      if (couponQuantity !== 0) {
        return options.fn(this);
      }
    });

    var redeemRewardValue = 0;
    var tradeRedeemRewardValue = 0;
    if (orderData["redeemRewardData"]["sumRewardPoint"] !== 0 || orderData["redeemRewardData"]["tradeSumRewardPoint"] !== 0) {
      redeemRewardValue = orderData["redeemRewardData"]["redeemRewardValue"];
      tradeRedeemRewardValue = orderData["redeemRewardData"]["tradeRedeemRewardValue"];
    }

    var toPay = 0;
    toPay = orderData["paymentDetail"]["toPay"] - redeemRewardValue - tradeRedeemRewardValue;
    var totalItemPrice = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalTaxAfterDiscount"]
      - orderData["paymentDetail"]["totalCouponDiscount"] - orderData["paymentDetail"]["totalPromocodeDiscount"];
    totalItemPrice = totalItemPrice.toFixed(2);

    var template = handlebars.compile(html);
    var replacements = {
      orderId: orderData["orderId"],
      orderStatus: message.order_status[orderData["status"]],
      // sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy, h:MM TT"),
      sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy"),
      //////////////////////////////////////////
      totalQuantity: orderData["paymentDetail"]["totalQuantity"],
      totalItemPrice: totalItemPrice,
      totalTaxAfterDiscount: orderData["paymentDetail"]["totalTaxAfterDiscount"],
      couponCode: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountCode"],
      promoCode: orderData["promocode"] === undefined || isNull(orderData["promocode"]) ? "" : orderData["promocode"]["promocodeCode"],
      totalCouponDiscount: orderData["paymentDetail"]["totalCouponDiscount"],
      totalPromocodeDiscount: orderData["paymentDetail"]["totalPromocodeDiscount"],
      deliveryChargeBeforeDiscount: orderData["paymentDetail"]["deliveryChargeBeforeDiscount"],
      deliveryDiscount: orderData["paymentDetail"]["deliveryDiscount"],
      tip: orderData["paymentDetail"]["tip"],
      redeemRewardValue: redeemRewardValue,
      tradeRedeemRewardValue: tradeRedeemRewardValue === 0 ? "" : tradeRedeemRewardValue,
      toPayLabel: orderData["paymentDetail"]["toPay"] === 0 ? "" : "Customer To Pay:",
      toPay: orderData["paymentDetail"]["toPay"] === 0 ? "" : "₹ " + toPay,

      taxHidden: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "hidden" : "show",
      couponHidden: orderData["coupon"] === undefined || isNull(orderData["coupon"]) || orderData["paymentDetail"]["totalCouponDiscount"] === 0 ? "hidden" : "show",
      promocodeHidden: orderData["promocode"] === undefined || isNull(orderData["promocode"]) || orderData["paymentDetail"]["totalPromocodeDiscount"] === 0 ? "hidden" : "show",
      deliveryHidden: orderData["paymentDetail"]["deliveryChargeBeforeDiscount"] === 0 ? "hidden" : "show",
      tipHidden: orderData["paymentDetail"]["tip"] === 0 ? "hidden" : "show",
      redeemHidden: redeemRewardValue === 0 ? "hidden" : "show",
      tradeRedeemHidden: tradeRedeemRewardValue === 0 ? "hidden" : "show",
      //////////////////////////////////////////
      senderName: user.firstName + " " + user.lastName,
      Company_Address: process.env.Company_Address,
      Company_City: process.env.Company_City,
      Company_State: process.env.Company_State,
      Company_Zip: process.env.Company_Zip,
      storeName: orderData["store"]["name"],
      storeAddress: orderData["store"]["address"],
      Company_Link: process.env.Company_Link,
      storePhone: orderData["store"]["mobile"],
      products: orderData["products"],
      services: orderData["services"],
      bogoProducts: orderData["bogoProducts"],
      bogoServices: orderData["bogoServices"],
      bogoHidden: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" && (orderData["bogoProducts"].length !== 0 || orderData["bogoServices"].length !== 0) ? "nnn" : "hidden",
      bogoBuyQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["buy"]["quantity"] : 0,
      bogoGetQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["get"]["quantity"] : 0,
      bogoString: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountType"] === "BOGO" && orderData["coupon"]["discountData"]["customerBogo"]["get"]["type"] === "Free" ? "Free" : orderData["coupon"]["discountData"]["customerBogo"]["get"]["percentValue"] + " % OFF",
      storeCategoryDesc: orderData["storeCategoryDesc"],
      orderCategory: orderData["category"],
      orderType: orderData["orderType"],
      pickupTimeHidden: isNull(orderData["pickupDateTime"]) || orderData["pickupDateTime"] === undefined ? "hidden" : "nnn",
      pickupDateTime: dateFormat(Date.parse(orderData["pickupDateTime"]), "mm/dd/yyyy"),
      deliveryAddressHidden: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "hidden" : "nnn",
      deliveryAddress: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "" : orderData["deliveryAddress"]["address"]["address"],
      deliveryPartnerNameHidden: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "hidden" : "nnn",
      deliveryPartnerName: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "" : orderData["deliveryPartnerDetails"]["deliveryPartnerName"],
      serviceTimeHidden: isNull(orderData["serviceDateTime"]) || orderData["serviceDateTime"] === undefined ? "hidden" : "nnn",
      serviceDateTime: dateFormat(Date.parse(orderData["serviceDateTime"]), "mm/dd/yyyy"),
      qrcodeImgUrl: orderData["qrcodeImgUrl"],
      originHidden: orderData["paymentDetail"]["totalItemPrice"] === orderData["paymentDetail"]["totalOriginPrice"] ? "hidden" : "unhidden",
      totalOriginPrice: (orderData["paymentDetail"]["totalOriginPrice"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalOriginPrice"]),
      totalTaxBeforePromocode: (orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalTaxBeforePromocode"]),
      totalAmountStore: orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + (orderData["paymentDetail"]["totalOriginPrice"] + orderData["paymentDetail"]["totalTaxBeforePromocode"] - redeemRewardValue).toFixed(2),

    };
    var htmlToSend = template(replacements);
    // var subject = 'Order Confirmation';
    // emailHelper(orderData["email"], subject, "", htmlToSend);
    return htmlToSend;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const orderConfrimHtmlForStoreTemplate = async (orderData, user) => {
  try {
    var html = fs.readFileSync("./public/email_template/order_confirm_email_store.html", { encoding: 'utf-8' });

    handlebars.registerHelper('totalPrice', function (price, promocodeDiscount, couponDiscount, couponQuantity) {
      if (price === undefined)
        return "";
      return ((price - promocodeDiscount - couponDiscount) * couponQuantity).toFixed(2);
    })

    handlebars.registerHelper('toFix2', function (value) {
      try {
        return value.toFixed(2);

      } catch (error) {
        return value;
      }
    })

    handlebars.registerHelper('isdefined', function (value) {
      return value !== undefined;
    });

    handlebars.registerHelper("if", function (couponQuantity, options) {
      if (couponQuantity !== 0) {
        return options.fn(this);
      }
    });

    var redeemRewardValue = 0;
    var tradeRedeemRewardValue = 0;
    if (orderData["redeemRewardData"]["sumRewardPoint"] !== 0 || orderData["redeemRewardData"]["tradeSumRewardPoint"] !== 0) {
      redeemRewardValue = orderData["redeemRewardData"]["redeemRewardValue"];
      // tradeRedeemRewardValue = orderData["redeemRewardData"]["tradeRedeemRewardValue"];
    }

    var toPay = 0;
    toPay = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalCouponDiscount"] - redeemRewardValue;
    var totalItemPrice = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalCouponDiscount"]
      - orderData["paymentDetail"]["totalTaxAfterCouponDiscount"];
    totalItemPrice = totalItemPrice.toFixed(2);

    var template = handlebars.compile(html);
    var replacements = {
      orderId: orderData["orderId"],
      orderStatus: message.order_status[orderData["status"]],
      // sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy, h:MM TT"),
      sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy"),
      //////////////////////////////////////////
      totalQuantity: orderData["paymentDetail"]["totalQuantity"],
      totalItemPrice: totalItemPrice,
      totalTaxAfterCouponDiscount: orderData["paymentDetail"]["totalTaxAfterCouponDiscount"],
      couponCode: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountCode"],
      totalCouponDiscount: orderData["paymentDetail"]["totalCouponDiscount"],
      redeemRewardValue: redeemRewardValue,
      // tradeRedeemRewardValue: tradeRedeemRewardValue === 0 ? "" : "TradeMantri Redeem Reward Value: ₹ " + tradeRedeemRewardValue,
      toPayLabel: orderData["paymentDetail"]["toPay"] === 0 ? "" : "Customer To Pay:",
      toPay: orderData["paymentDetail"]["toPay"] === 0 ? "" : "₹ " + toPay,

      taxHidden: orderData["paymentDetail"]["totalTaxAfterCouponDiscount"] === 0 ? "hidden" : "show",
      couponHidden: orderData["coupon"] === undefined || isNull(orderData["coupon"]) || orderData["paymentDetail"]["totalCouponDiscount"] === 0 ? "hidden" : "show",
      redeemHidden: redeemRewardValue === 0 ? "hidden" : "show",
      //////////////////////////////////////////
      senderName: user.firstName + " " + user.lastName,
      Company_Address: process.env.Company_Address,
      Company_City: process.env.Company_City,
      Company_State: process.env.Company_State,
      Company_Zip: process.env.Company_Zip,
      storeName: orderData["store"]["name"],
      storeAddress: orderData["store"]["address"],
      Company_Link: process.env.Company_Link,
      storePhone: orderData["store"]["mobile"],
      products: orderData["products"],
      services: orderData["services"],
      bogoProducts: orderData["bogoProducts"],
      bogoServices: orderData["bogoServices"],
      bogoHidden: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" && (orderData["bogoProducts"].length !== 0 || orderData["bogoServices"].length !== 0) ? "nnn" : "hidden",
      bogoBuyQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["buy"]["quantity"] : 0,
      bogoGetQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["get"]["quantity"] : 0,
      bogoString: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountType"] === "BOGO" && orderData["coupon"]["discountData"]["customerBogo"]["get"]["type"] === "Free" ? "Free" : orderData["coupon"]["discountData"]["customerBogo"]["get"]["percentValue"] + " % OFF",
      storeCategoryDesc: orderData["storeCategoryDesc"],
      orderCategory: orderData["category"],
      orderType: orderData["orderType"],
      pickupTimeHidden: isNull(orderData["pickupDateTime"]) || orderData["pickupDateTime"] === undefined ? "hidden" : "nnn",
      pickupDateTime: dateFormat(Date.parse(orderData["pickupDateTime"]), "mm/dd/yyyy"),
      deliveryAddressHidden: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "hidden" : "nnn",
      deliveryAddress: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "" : orderData["deliveryAddress"]["address"]["address"],
      deliveryPartnerNameHidden: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "hidden" : "nnn",
      deliveryPartnerName: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "" : orderData["deliveryPartnerDetails"]["deliveryPartnerName"],
      serviceTimeHidden: isNull(orderData["serviceDateTime"]) || orderData["serviceDateTime"] === undefined ? "hidden" : "nnn",
      serviceDateTime: dateFormat(Date.parse(orderData["serviceDateTime"]), "mm/dd/yyyy"),
      qrcodeImgUrl: orderData["qrcodeImgUrl"],
      originHidden: orderData["paymentDetail"]["totalItemPrice"] === orderData["paymentDetail"]["totalOriginPrice"] ? "hidden" : "unhidden",
      totalOriginPrice: (orderData["paymentDetail"]["totalOriginPrice"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalOriginPrice"]),
      totalTaxBeforePromocode: (orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalTaxBeforePromocode"]),
      totalAmountStore: orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + (orderData["paymentDetail"]["totalOriginPrice"] + orderData["paymentDetail"]["totalTaxBeforePromocode"] - redeemRewardValue).toFixed(2),

      // tradeRedeemRewardPointHidden: tradeRedeemRewardValue === 0 ? "hidden" : "unhidden",
      // tradeRedeemRewardPoint: tradeRedeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["tradeRedeemRewardPoint"],
      // tradeRedeemRewardValue1idden: tradeRedeemRewardValue === 0 ? "hidden" : "unhidden",
      // tradeRedeemRewardValue1: tradeRedeemRewardValue === 0 ? "" : "₹ " + tradeRedeemRewardValue,

      redeemRewardPointHidden: redeemRewardValue === 0 ? "hidden" : "unhidden",
      redeemRewardPoint: redeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["redeemRewardPoint"],
      redeemRewardValue1idden: redeemRewardValue === 0 ? "hidden" : "unhidden",
      redeemRewardValue1: redeemRewardValue === 0 ? "" : "₹ " + redeemRewardValue,
    };
    var htmlToSend = template(replacements);
    // var subject = 'Order Confirmation';
    // emailHelper(orderData["email"], subject, "", htmlToSend);
    return htmlToSend;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const invoiceHtmlTemplate = async (orderData, user) => {
  try {
    var html = fs.readFileSync("./public/email_template/invoice_template/index.html", { encoding: 'utf-8' });

    handlebars.registerHelper('totalPrice', function (price, promocodeDiscount, couponDiscount, couponQuantity) {
      if (price === undefined)
        return "";
      return ((price - promocodeDiscount - couponDiscount) * couponQuantity).toFixed(2);
    })

    handlebars.registerHelper('toFix2', function (value) {
      try {
        return value.toFixed(2);

      } catch (error) {
        return value;
      }
    })

    handlebars.registerHelper('productIndex', function (index, id) {
      var length = 0
      for (let index = 0; index < orderData["products"].length; index++) {
        const product = orderData["products"][index];
        if (parseFloat(product["couponQuantity"].toString()) != 0) {
          length = length + 1;
        }

        if (id == product["data"]["_id"]) {
          return length;
        }
      }
      return index + 1;
    })

    handlebars.registerHelper('serviceIndex', function (index, id) {
      var productLength = 0;
      for (let index = 0; index < orderData["products"].length; index++) {
        const product = orderData["products"][index];
        if (parseFloat(product["couponQuantity"].toString()) != 0) {
          productLength = productLength + 1;
        }
      }

      var length = 0
      for (let index = 0; index < orderData["services"].length; index++) {
        const service = orderData["services"][index];
        if (parseFloat(service["couponQuantity"].toString()) != 0) {
          length = length + 1;
        }

        if (id == service["data"]["_id"]) {
          return productLength + length;
        }
      }

      return productLength + index + 1;
    })

    handlebars.registerHelper("if", function (couponQuantity, options) {
      if (couponQuantity !== 0) {
        return options.fn(this);
      }
    });

    var redeemRewardValue = 0;
    var tradeRedeemRewardValue = 0;
    if (orderData["redeemRewardData"]["sumRewardPoint"] !== 0 || orderData["redeemRewardData"]["tradeSumRewardPoint"] !== 0) {
      redeemRewardValue = orderData["redeemRewardData"]["redeemRewardValue"];
      tradeRedeemRewardValue = orderData["redeemRewardData"]["tradeRedeemRewardValue"];
    }

    var toPay = 0;
    toPay = orderData["paymentDetail"]["toPay"] - redeemRewardValue - tradeRedeemRewardValue;
    var totalItemPrice = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalTaxAfterDiscount"]
      - orderData["paymentDetail"]["totalCouponDiscount"];
    totalItemPrice = totalItemPrice.toFixed(2);

    var template = handlebars.compile(html);
    var replacements = {
      storeName: orderData["store"]["name"],
      storeAddress: orderData["store"]["address"],
      storePhone: orderData["store"]["mobile"],
      currencySymbol: "₹ Rupee",
      // sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy, h:MM TT"),
      sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy"),
      senderName: user.firstName + " " + user.lastName,
      senderEmail: user.email,
      senderPhone: user.mobile,
      storeCategoryDesc: orderData["storeCategoryDesc"],
      orderCategory: orderData["category"],
      orderType: orderData["orderType"],
      pickupTimeHidden: isNull(orderData["pickupDateTime"]) || orderData["pickupDateTime"] === undefined ? "hidden" : "nnn",
      pickupDateTime: dateFormat(Date.parse(orderData["pickupDateTime"]), "mm/dd/yyyy"),
      deliveryAddressHidden: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "hidden" : "nnn",
      deliveryAddress: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "" : orderData["deliveryAddress"]["address"]["address"],
      deliveryPartnerNameHidden: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "hidden" : "nnn",
      deliveryPartnerName: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "" : orderData["deliveryPartnerDetails"]["deliveryPartnerName"],
      serviceTimeHidden: isNull(orderData["serviceDateTime"]) || orderData["serviceDateTime"] === undefined ? "hidden" : "nnn",
      serviceDateTime: dateFormat(Date.parse(orderData["serviceDateTime"]), "mm/dd/yyyy"),
      qrcodeImgUrl: orderData["qrcodeImgUrl"],
      orderId: orderData["orderId"],
      orderStatus: message.order_status[orderData["status"]],
      invoiceId: orderData["invoiceId"],
      gstNumber: isNull(orderData["store"]["gstIn"]) || orderData["store"]["gstIn"] === undefined ? orderData["store"]["gstIn"] : "",
      pan: isNull(orderData["store"]["pan"]) || orderData["store"]["pan"] === undefined ? orderData["store"]["pan"] : "",
      products: orderData["products"],
      services: orderData["services"],
      bogoProducts: orderData["bogoProducts"],
      bogoServices: orderData["bogoServices"],
      bogoHidden: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" && (orderData["bogoProducts"].length !== 0 || orderData["bogoServices"].length !== 0) ? "nnn" : "hidden",
      bogoBuyQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["buy"]["quantity"] : 0,
      bogoGetQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["get"]["quantity"] : 0,
      bogoString: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountType"] === "BOGO" && orderData["coupon"]["discountData"]["customerBogo"]["get"]["type"] === "Free" ? "Free" : orderData["coupon"]["discountData"]["customerBogo"]["get"]["percentValue"] + " % OFF",
      //////////////////////////////////////////
      totalQuantity: orderData["paymentDetail"]["totalQuantity"],
      totalItemPrice: totalItemPrice,
      totalTaxAfterDiscount: orderData["paymentDetail"]["totalTaxAfterDiscount"],
      taxType: orderData["paymentDetail"]["taxType"],
      cgstValue: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][0]["value"],
      SGST_IGST: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][1]["type"],
      SGST_IGST_Value: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][1]["value"],
      couponCode: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountCode"],
      promoCode: orderData["promocode"] === undefined || isNull(orderData["promocode"]) ? "" : orderData["promocode"]["promocodeCode"],
      totalCouponDiscount: orderData["paymentDetail"]["totalCouponDiscount"],
      totalPromocodeDiscount: orderData["paymentDetail"]["totalPromocodeDiscount"],
      deliveryChargeBeforeDiscount: orderData["paymentDetail"]["deliveryChargeBeforeDiscount"],
      deliveryDiscount: orderData["paymentDetail"]["deliveryDiscount"],
      tip: orderData["paymentDetail"]["tip"],
      redeemRewardValue: redeemRewardValue,
      redeemRewardPoint: redeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["redeemRewardPoint"],
      tradeRedeemRewardValue: tradeRedeemRewardValue === 0 ? "" : tradeRedeemRewardValue,
      tradeRedeemRewardPoint: tradeRedeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["tradeRedeemRewardPoint"],
      toPayLabel: orderData["paymentDetail"]["toPay"] === 0 ? "" : "Customer To Pay:",
      toPay: orderData["paymentDetail"]["toPay"] === 0 ? "" : toPay,

      taxHidden: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "hidden" : "show",
      couponHidden: orderData["coupon"] === undefined || isNull(orderData["coupon"]) || orderData["paymentDetail"]["totalCouponDiscount"] === 0 ? "hidden" : "show",
      promocodeHidden: orderData["promocode"] === undefined || isNull(orderData["promocode"]) || orderData["paymentDetail"]["totalPromocodeDiscount"] === 0 ? "hidden" : "show",
      deliveryHidden: orderData["paymentDetail"]["deliveryChargeBeforeDiscount"] === 0 ? "hidden" : "show",
      tipHidden: orderData["paymentDetail"]["tip"] === 0 ? "hidden" : "show",
      redeemHidden: redeemRewardValue === 0 ? "hidden" : "show",
      tradeRedeemHidden: tradeRedeemRewardValue === 0 ? "hidden" : "nn",
      //////////////////////////////////////////
      firstName: user.firstName,
      Company_Link: process.env.Company_Link,
      originHidden: orderData["paymentDetail"]["totalItemPrice"] === orderData["paymentDetail"]["totalOriginPrice"] ? "hidden" : "unhidden",
      totalOriginPrice: (orderData["paymentDetail"]["totalOriginPrice"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalOriginPrice"]),
      totalTaxBeforePromocode: (orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalTaxBeforePromocode"]),
      totalAmountStore: orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + (orderData["paymentDetail"]["totalOriginPrice"] + orderData["paymentDetail"]["totalTaxBeforePromocode"] - redeemRewardValue).toFixed(2),

    };
    var htmlToSend = template(replacements);

    return htmlToSend;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const invoiceHtmlForStoreTemplate = async (orderData, user) => {
  try {
    var html = fs.readFileSync("./public/email_template/invoice_template/index_store.html", { encoding: 'utf-8' });

    handlebars.registerHelper('totalPrice', function (price, promocodeDiscount, couponDiscount, couponQuantity) {
      if (price === undefined)
        return "";
      return ((price - promocodeDiscount - couponDiscount) * couponQuantity).toFixed(2);
    })


    handlebars.registerHelper('toFix2', function (value) {
      try {
        return value.toFixed(2);

      } catch (error) {
        return value;
      }
    })

    handlebars.registerHelper('productIndex', function (index, id) {
      var length = 0
      for (let index = 0; index < orderData["products"].length; index++) {
        const product = orderData["products"][index];
        if (parseFloat(product["couponQuantity"].toString()) != 0) {
          length = length + 1;
        }

        if (id == product["data"]["_id"]) {
          return length;
        }
      }
      return index + 1;
    })

    handlebars.registerHelper('serviceIndex', function (index, id) {
      var productLength = 0;
      for (let index = 0; index < orderData["products"].length; index++) {
        const product = orderData["products"][index];
        if (parseFloat(product["couponQuantity"].toString()) != 0) {
          productLength = productLength + 1;
        }
      }

      var length = 0
      for (let index = 0; index < orderData["services"].length; index++) {
        const service = orderData["services"][index];
        if (parseFloat(service["couponQuantity"].toString()) != 0) {
          length = length + 1;
        }

        if (id == service["data"]["_id"]) {
          return productLength + length;
        }
      }

      return productLength + index + 1;
    })

    handlebars.registerHelper("if", function (couponQuantity, options) {
      if (couponQuantity !== 0) {
        return options.fn(this);
      }
    });

    var redeemRewardValue = 0;
    var tradeRedeemRewardValue = 0;
    if (orderData["redeemRewardData"]["sumRewardPoint"] !== 0 || orderData["redeemRewardData"]["tradeSumRewardPoint"] !== 0) {
      redeemRewardValue = orderData["redeemRewardData"]["redeemRewardValue"];
      // tradeRedeemRewardValue = orderData["redeemRewardData"]["tradeRedeemRewardValue"];
    }

    var toPay = 0;
    toPay = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalCouponDiscount"] - redeemRewardValue;
    var totalItemPrice = orderData["paymentDetail"]["totalOriginPrice"] - orderData["paymentDetail"]["totalCouponDiscount"]
      - orderData["paymentDetail"]["totalTaxAfterCouponDiscount"];
    totalItemPrice = totalItemPrice.toFixed(2);

    var template = handlebars.compile(html);
    var replacements = {
      storeName: orderData["store"]["name"],
      storeAddress: orderData["store"]["address"],
      storePhone: orderData["store"]["mobile"],
      currencySymbol: "₹ Rupee",
      // sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy, h:MM TT"),
      sendDate: dateFormat(Date.now(), "dddd, mmmm dS, yyyy"),
      senderName: user.firstName + " " + user.lastName,
      senderEmail: user.email,
      senderPhone: user.mobile,
      storeCategoryDesc: orderData["storeCategoryDesc"],
      orderCategory: orderData["category"],
      orderType: orderData["orderType"],
      pickupTimeHidden: isNull(orderData["pickupDateTime"]) || orderData["pickupDateTime"] === undefined ? "hidden" : "nnn",
      pickupDateTime: dateFormat(Date.parse(orderData["pickupDateTime"]), "mm/dd/yyyy"),
      deliveryAddressHidden: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "hidden" : "nnn",
      deliveryAddress: isNull(orderData["deliveryAddress"]) || orderData["deliveryAddress"] === undefined || Object.keys(orderData["deliveryAddress"]).length === 0 ? "" : orderData["deliveryAddress"]["address"]["address"],
      deliveryPartnerNameHidden: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "hidden" : "nnn",
      deliveryPartnerName: isNull(orderData["deliveryPartnerDetails"]) || orderData["deliveryPartnerDetails"] === undefined || Object.keys(orderData["deliveryPartnerDetails"]).length === 0 ? "" : orderData["deliveryPartnerDetails"]["deliveryPartnerName"],
      serviceTimeHidden: isNull(orderData["serviceDateTime"]) || orderData["serviceDateTime"] === undefined ? "hidden" : "nnn",
      serviceDateTime: dateFormat(Date.parse(orderData["serviceDateTime"]), "mm/dd/yyyy"),
      qrcodeImgUrl: orderData["qrcodeImgUrl"],
      orderId: orderData["orderId"],
      orderStatus: message.order_status[orderData["status"]],
      invoiceId: orderData["invoiceId"],
      gstNumber: isNull(orderData["store"]["gstIn"]) || orderData["store"]["gstIn"] === undefined ? orderData["store"]["gstIn"] : "",
      pan: isNull(orderData["store"]["pan"]) || orderData["store"]["pan"] === undefined ? orderData["store"]["pan"] : "",
      products: orderData["products"],
      services: orderData["services"],
      bogoProducts: orderData["bogoProducts"],
      bogoServices: orderData["bogoServices"],
      bogoHidden: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" && (orderData["bogoProducts"].length !== 0 || orderData["bogoServices"].length !== 0) ? "nnn" : "hidden",
      bogoBuyQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["buy"]["quantity"] : 0,
      bogoGetQuantity: orderData["coupon"] !== undefined && !isNull(orderData["coupon"]) && orderData["coupon"]["discountType"] === "BOGO" ? orderData["coupon"]["discountData"]["customerBogo"]["get"]["quantity"] : 0,
      bogoString: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountType"] === "BOGO" && orderData["coupon"]["discountData"]["customerBogo"]["get"]["type"] === "Free" ? "Free" : orderData["coupon"]["discountData"]["customerBogo"]["get"]["percentValue"] + " % OFF",
      //////////////////////////////////////////
      totalQuantity: orderData["paymentDetail"]["totalQuantity"],
      totalItemPrice: totalItemPrice,
      totalTaxAfterCouponDiscount: orderData["paymentDetail"]["totalTaxAfterCouponDiscount"],
      taxType: orderData["paymentDetail"]["taxType"],
      cgstValue: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][0]["value"],
      SGST_IGST: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][1]["type"],
      SGST_IGST_Value: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "" : orderData["paymentDetail"]["taxBreakdown"][1]["value"],
      couponCode: orderData["coupon"] === undefined || isNull(orderData["coupon"]) ? "" : orderData["coupon"]["discountCode"],
      totalCouponDiscount: orderData["paymentDetail"]["totalCouponDiscount"],
      redeemRewardValue: redeemRewardValue,
      redeemRewardPoint: redeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["redeemRewardPoint"],
      // tradeRedeemRewardValue: tradeRedeemRewardValue === 0 ? "" : "TradeMantri Redeem Reward Value: ₹ " + tradeRedeemRewardValue,
      // tradeRedeemRewardPoint: tradeRedeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["tradeRedeemRewardPoint"],
      toPayLabel: orderData["paymentDetail"]["toPay"] === 0 ? "" : "Customer To Pay:",
      toPay: orderData["paymentDetail"]["toPay"] === 0 ? "" : toPay,

      taxHidden: orderData["paymentDetail"]["totalTaxAfterDiscount"] === 0 ? "hidden" : "show",
      couponHidden: orderData["paymentDetail"]["totalCouponDiscount"] === 0 ? "hidden" : "show",
      redeemHidden: redeemRewardValue === 0 ? "hidden" : "show",
      // tradeRedeemHidden: tradeRedeemRewardValue === 0 ? "hidden" : "nn",
      //////////////////////////////////////////
      toPay: toPay,
      firstName: user.firstName,
      Company_Link: process.env.Company_Link,
      originHidden: orderData["paymentDetail"]["totalItemPrice"] === orderData["paymentDetail"]["totalOriginPrice"] ? "hidden" : "unhidden",
      totalOriginPrice: (orderData["paymentDetail"]["totalOriginPrice"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalOriginPrice"]),
      totalTaxBeforePromocode: (orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + orderData["paymentDetail"]["totalTaxBeforePromocode"]),
      totalAmountStore: orderData["paymentDetail"]["totalTaxBeforePromocode"] === 0 ? "" : "₹ " + (orderData["paymentDetail"]["totalOriginPrice"] + orderData["paymentDetail"]["totalTaxBeforePromocode"] - redeemRewardValue).toFixed(2),
      redeemRewardPointHidden: redeemRewardValue === 0 ? "hidden" : "unhidden",
      redeemRewardPoint: redeemRewardValue === 0 ? "" : orderData["redeemRewardData"]["redeemRewardPoint"],
    };
    var htmlToSend = template(replacements);

    return htmlToSend;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const rewardPointHandler = async (storeId, userId, orderId, status, rewardPointsEarnedPerOrder, redeemRewardPoint, tradeRedeemRewardPoint) => {
  console.log("_______ reward point start ____________");

  try {

    if (rewardPointsEarnedPerOrder != 0 && !isNull(rewardPointsEarnedPerOrder)) {

      if (status === "order_completed") {
        let tranDetails = {
          title: "Reward Points Earned",
          body: `You earned ${rewardPointsEarnedPerOrder} reward points from store_name on Date for the order ${orderId}`,
          createAt: Date.now(),
          rewardPoints: rewardPointsEarnedPerOrder,
          type: "Allocated"
        };
        await rewardPointUtils.transact(tranDetails, userId, storeId);
      }

      if (status === "order_cancelled" || status === "order_rejected") {
        let tranDetails = {
          title: "Reward Points Cancelled",
          body: `You cancelled your order on Date, so the ${rewardPointsEarnedPerOrder} reward points you got from the order ${orderId} are reduced for this stores reward points`,
          createAt: Date.now(),
          rewardPoints: rewardPointsEarnedPerOrder,
          type: "Cancelled"
        };
        await rewardPointUtils.transact(tranDetails, userId, storeId);
      }

    }

    /// redeem
    if (!isNull(redeemRewardPoint) && redeemRewardPoint !== undefined) {

      if (status === "order_cancelled") {
        let tranDetails = {
          title: "Cancelled Redemption of reward points",
          body: `The reward points have been allocated back as the order ${orderId} with store store_name is cancelled`,
          createAt: Date.now(),
          rewardPoints: redeemRewardPoint,
          type: "Cancelled"
        };
        await rewardPointUtils.refund(tranDetails, userId, storeId);
      }

      if (status === "order_rejected") {
        let tranDetails = {
          title: "Rejected Redemption of reward points",
          body: `The reward points have been allocated back as the order ${orderId} with store store_name is rejected`,
          createAt: Date.now(),
          rewardPoints: redeemRewardPoint,
          type: "Rejected"
        };
        await rewardPointUtils.refund(tranDetails, userId, storeId);
      }

    }

    if (tradeRedeemRewardPoint != 0 && tradeRedeemRewardPoint !== undefined) {
      let tmStoreId = await storeUtils.ensureStoreId();
      if (status === "order_cancelled") {
        let tranDetails = {
          title: `Cancelled Redemption of ${process.env.ROOT_STORE_NAME} Store reward points`,
          body: `The reward points have been allocated back as the order ${orderId} with store ${process.env.ROOT_STORE_NAME} is cancelled`,
          createAt: Date.now(),
          rewardPoints: redeemRewardPoint,
          type: "Cancelled"
        };
        await rewardPointUtils.transact(tranDetails, userId, tmStoreId);
      }

      if (status === "order_rejected") {
        let tranDetails = {
          title: `Rejected Redemption of ${process.env.ROOT_STORE_NAME} Store reward points`,
          body: `The reward points have been allocated back as the order ${orderId} with store ${process.env.ROOT_STORE_NAME} is rejected`,
          createAt: Date.now(),
          rewardPoints: redeemRewardPoint,
          type: "Rejected"
        };
        await rewardPointUtils.transact(tranDetails, userId, tmStoreId);
      }
    }


  } catch (error) {
    console.log("____________reward point error_________________");
    console.log(error);
  }
}

const redeemHandler = async (storeId, userId, orderId, sumRewardPoint, redeemRewardPoint, tradeSumRewardPoint, tradeRedeemRewardPoint) => {
  try {
    //TODO:: why sumRewardPoint and tradeSumRewardPoint is calculating over app and why not backend.
    if (sumRewardPoint != 0) {
      let tranDetails = {
        title: "Individual Store Reward Points Redeemed",
        body: `Reward points redeemRewardPoint has been redeemed for the order ${orderId} with store store_name`,
        createAt: Date.now(),
        rewardPoints: redeemRewardPoint,
        type: "Redeemed"
      };
      await rewardPointUtils.transact(tranDetails, userId, storeId);
    }

    if (tradeSumRewardPoint != 0) {
      let tmStoreId = await storeUtils.ensureStoreId();

      let tranDetails = {
        title: `${process.env.ROOT_STORE_NAME} Store Reward Points Redeemed`,
        body: `Reward points tradeRedeemRewardPoint has been redeemed for the order ${orderId} with store ${process.env.ROOT_STORE_NAME}`,
        createAt: Date.now(),
        rewardPoints: tradeRedeemRewardPoint,
        type: "Redeemed"
      };
      await rewardPointUtils.transact(tranDetails, userId, tmStoreId);
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
}


const sendEmail = async (orderData, subject) => {
  try {
    console.log("______start new confirm email__________");
    var orderConfirmHtml = await orderConfrimHtmlTemplate(orderData, orderData["user"]);
    console.log("______ order confirm html comvert 1 finished__________");

    await emailHelper(
      orderData["user"]["email"],
      subject, "",
      orderConfirmHtml,
      [{
        filename: orderData["invoicePdfUrl"].split('/').pop(),
        contentType: 'application/pdf',
        path: orderData["invoicePdfUrl"]
      }]
    );

    var orderConfirmHtmlForStore = await orderConfrimHtmlForStoreTemplate(orderData, orderData["user"]);
    await emailHelper(
      orderData["store"]["email"],
      subject, "",
      orderConfirmHtmlForStore,
      [{
        filename: orderData["invoicePdfUrlForStore"].split('/').pop(),
        contentType: 'application/pdf',
        path: orderData["invoicePdfUrlForStore"]
      }]
    );
  } catch (err) {

  }
}

router.post("/add/", auth, async (req, res, next) => {
  console.log("-------------- add order -------------------");
  const { storeId } = req.body;
  const userId = req.currentUserId;

  if (!userId || !storeId)
    return res.status(400).send({ "success": false, "message": message.insufficient_error_400 });

  try {
    var qrCodeData = await QRCode.toDataURL(req.body["qrCodeData"]);
    const qrcodeImgUrl = await base64ImageUploadToS3(
      qrCodeData,
      process.env.ORDER_BUCKET_NAME,
      "Oder-QR-Codes/" + req.body["orderId"],
    );
    req.body["qrcodeImgUrl"] = qrcodeImgUrl;


    var user = await User.findById(userId);
    var store = await Store.findById(storeId);

    req.body["user"] = user;
    req.body["store"] = store;
    req.body["userId"] = userId;

    //////// stateCode and storecode ///////////////
    if (isNull(store.stateCode) || store.stateCode === undefined || store.stateCode === "") {
      console.log("-------------- stateCode handler -------------------");
      var stateCode = "";
      for (let index = 0; index < stateInfo.length; index++) {
        const stateData = stateInfo[index];
        if (stateData["key"] == store["state"]) {
          stateCode = stateData["value"];
          break;
        }
      }
      store.stateCode = stateCode;
      store.storeCode = randomstring.generate({ length: 6, charset: 'alphabetic' }).toUpperCase();

      await store.save();
      var store = await Store.findById(storeId);
      req.body["store"] = store;
    }

    //////// invoice number ///////////////
    var invoiceId = dateFormat(Date.now(), "yyyy");
    if (store.stateCode !== "") {
      invoiceId = invoiceId + "-" + store.stateCode;
    }
    invoiceId = invoiceId + "-" + store.storeCode;

    var orderCountInfo = await Order.aggregate([
      {
        $match: {
          "storeId": storeId,
        }
      },
      {
        $group: {
          _id: "$storeId",
          totalOrderCount: { $sum: 1 },
        }
      }
    ]);

    var totalOrderCount = 0;
    if (orderCountInfo.length !== 0) {
      totalOrderCount = orderCountInfo[0]["totalOrderCount"]
    }

    invoiceId = invoiceId + "-" + totalOrderCount;

    req.body["invoiceId"] = invoiceId;
    //////////////////////////////////////


    /// invoiceHtml part
    var invoiceHtml = await invoiceHtmlTemplate(req.body, user);
    var invoiceHtmlForStore = await invoiceHtmlForStoreTemplate(req.body, user);

    var options = {
      format: 'A4',
      header: { height: "10mm" },
      footer: { height: "5mm" },
      margin: "0",
      phantomPath: process.env.PHANTOM_PATH
    };
    let pdfBuffer = await pdfToBuffer(invoiceHtml, options);

    let pdfBufferForStore = await pdfToBuffer(invoiceHtmlForStore, options);

    var pdfUrl = await pdfUploadToS3(
      pdfBuffer,
      process.env.ORDER_BUCKET_NAME,
      "OrderInvoices/" + req.body["orderId"] + "_for_customer",
    );
    var pdfUrlForStore = await pdfUploadToS3(
      pdfBufferForStore,
      process.env.ORDER_BUCKET_NAME,
      "OrderInvoices/" + req.body["orderId"] + "_for_store",
    );

    req.body["invoicePdfUrl"] = pdfUrl;
    req.body["invoicePdfUrlForStore"] = pdfUrlForStore;

    // var rewardPoint = await RewardPoint.findOne({ storeId: storeId });
    // if (rewardPoint) {
    //   if (
    //     (isNull(rewardPoint["validity"]["endDate"]) || Date.parse(rewardPoint["validity"]["endDate"]) > Date.now())
    //     && (isNull(rewardPoint["validity"]["startDate"]) || Date.parse(rewardPoint["validity"]["startDate"]) < Date.now())
    //   ) {
    //     req.body["rewardPointData"] = {
    //       "id": rewardPoint["_id"],
    //       "buy": rewardPoint["buy"],
    //       "redeem": rewardPoint["redeem"],
    //       "minOrderAmount": rewardPoint["minOrderAmount"],
    //       "maxRewardsPerOrder": rewardPoint["maxRewardsPerOrder"],
    //     }
    //   }
    // }

    var order = await Order.create(req.body);
    order = await Order.findOne({
      "orderId": order["orderId"],
      "userId": order["userId"],
      "storeId": order["storeId"],
    });
    req.body["_id"] = order["_id"];

    ///
    if (req.body["redeemRewardData"]["sumRewardPoint"] !== 0 || req.body["redeemRewardData"]["tradeSumRewardPoint"] !== 0) {
      await redeemHandler(
        storeId,
        userId,
        req.body["orderId"],
        req.body["redeemRewardData"]["sumRewardPoint"],
        req.body["redeemRewardData"]["redeemRewardPoint"],
        req.body["redeemRewardData"]["tradeSumRewardPoint"],
        req.body["redeemRewardData"]["tradeRedeemRewardPoint"],
      );
    }

    console.log("______email send start __________");

    var subject = 'Your order is confirmed with store ' + req.body["store"]["name"] + '. Order Id : ' + req.body["orderId"];
    sendEmail(req.body, subject);

    await fcmNotificationHandler(
      "order", // notiType
      "order_placed", // status
      user["_id"], // userId
      storeId, // storeId
      {
        id: order["_id"],
        orderId: order["orderId"],
        userId: order["userId"],
        storeId: storeId,
        status: "order_placed",
      }, // data
    );

    await notificationDBHandler(
      "order", // notiType
      "order_placed", // status
      user["_id"], // userId
      storeId, // storeId
      {
        id: order["_id"],
        orderId: order["orderId"],
        userId: order["userId"],
        storeId: storeId,
        status: "order_placed",
      }, // data
    );

    console.log("______finsish__________");


    if (order["status"] === "order_accepted") {
      // exotelApi("order_accepted", orderData["user"]["mobile"]);

    } else {
      await exotelApi("order_placed", req.body["store"]["mobile"], true);
    }

    // referralRewardOffersConfirmHandler(data["_id"], "SignUpAndMakeFirstOrder");

    return res.send({ "success": true, "data": order });
    /////
  } catch (err) {
    console.error("------- add order error  ---------");
    console.error(err);
    next(err);
  }
});

//TODO:: Need to check if this can be bypassed for paid status.
// router.post("/changeStatus/", auth, async (req, res, next) => {
//   const { orderId, status, storeId } = req.body;
//   const userId = req.currentUserId;
//   try {
//     var order = await Order.findById(orderId);
//     var user = await User.findById(userId);
//     var store = await Store.findById(storeId);

//     if (order.status === status) {
//       if (status === 'order_completed') {
//         return res.status(422).send({ success: false, message: "Order is already completed." });
//       } else {
//         return res.status(422).send({ success: false, message: "Order is already in  provided status" });
//       }
//     }

//     order["user"] = user;
//     order["store"] = store;
//     order["status"] = status;
//     order["updatedAt"] = Date.now();

//     let originalRes = updateOrder(order, status, false, res);



//     return originalRes;

//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });

// TODO:: one order one payment check need to be done.
//Note:: Need to revisit to change logic.
router.post("/update/", auth, async (req, res, next) => {
  try {
    const { orderData, status, changedStatus, signature } = req.body;

    if (orderData.userId != req.currentUserId) {
      return res.status(422).send({ "success": false, message: "Entity not belongs to you." });
    }

    if (status === "order_paid" && !isNull(orderData["paymentApiData"]) && orderData["paymentApiData"] !== undefined) {
      const hmac = crypto.createHmac('sha256', process.env.RZRPAY_KEY_SECRET);
      hmac.update(`${orderData["paymentApiData"]["orderId"]}|${orderData["paymentApiData"]["paymentId"]}`);
      let generatedSignature = hmac.digest('hex');

      if (generatedSignature != signature) {
        return res.status(422).send({ "success": false, message: "Razorpay signature doesn't match" });
        //TODO:: Alert to admin as important issue.
      }
    }

    var user = await User.findById(orderData.userId);
    var store = await Store.findById(orderData.storeId);


    orderData["status"] = status;
    orderData["user"] = user;
    orderData["store"] = store;

    console.log(status);
    console.log(changedStatus);


    if (status == "order_accepted" && changedStatus === true) {
      console.log("______start new confirm email__________");
      var orderConfirmHtml = await orderConfrimHtmlTemplate(orderData, orderData["user"]);
      console.log("______ order confirm html comvert 1 finished__________");
      /// invoid part
      var invoiceHtml = await invoiceHtmlTemplate(orderData, orderData["user"]);
      console.log("______ invoice html comvert 2 finish__________");

      var options = {
        format: 'A4',
        header: { height: "10mm" },
        footer: { height: "5mm" },
        margin: "0",
        phantomPath: process.env.PHANTOM_PATH
      };
      let pdfBuffer = await pdfToBuffer(invoiceHtml, options);

      var pdfUrl = await pdfUploadToS3(
        pdfBuffer,
        process.env.ORDER_BUCKET_NAME,
        "OrderInvoices/" + orderData["orderId"],
      );
      console.log("______ upload s3 __________");

      var subject = "You order is accepted by " + orderData["store"]["name"] + " based on the products and services available at store";

      await emailHelper(
        orderData["user"]["email"],
        subject, "",
        orderConfirmHtml,
        [{
          filename: pdfUrl.split('/').pop(),
          contentType: 'application/pdf',
          path: pdfUrl
        }]
      );

      await emailHelper(
        orderData["store"]["email"],
        subject, "",
        orderConfirmHtml,
        [{
          filename: pdfUrl.split('/').pop(),
          contentType: 'application/pdf',
          path: pdfUrl
        }]
      );


      console.log("______email send finish__________");

      orderData["invoicePdfUrl"] = pdfUrl;

      updateOrder(orderData, status, changedStatus, res);
    } else {
      updateOrder(orderData, status, changedStatus, res);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

const updateOrder = async (orderData, status, changedStatus, res) => {
  console.log("__________ update order data _______________");
  try {
    /// rewardPointsEarnedPerOrder
    var rewardPointsEarnedPerOrder;
    if (orderData["rewardPointData"]) {
      if (status === "order_completed" && orderData["paymentDetail"]["totalPrice"] >= orderData["rewardPointData"]["minOrderAmount"]) {
        rewardPointsEarnedPerOrder = Math.floor((orderData["paymentDetail"]["totalPrice"] / orderData["rewardPointData"]["buy"]["value"]) * orderData["rewardPointData"]["buy"]["rewardPoints"]);
        if (rewardPointsEarnedPerOrder > orderData["rewardPointData"]["maxRewardsPerOrder"]) {
          rewardPointsEarnedPerOrder = orderData["rewardPointData"]["maxRewardsPerOrder"];
        }
        orderData["paymentDetail"]["rewardPointsEarnedPerOrder"] = rewardPointsEarnedPerOrder;
      }
    }
    /////////////////////////


    if (status === "order_paid") {
      orderData["payStatus"] = true;
    }

    if (status === "order_completed") {
      orderData["completeDateTime"] = Date.now();
    }

    if (status === "pickup_ready" || status === "delivery_ready") {
      orderData["pickupDeliverySatus"] = true;
    }

    Order.findByIdAndUpdate(orderData["_id"], orderData, { new: true, upsert: true }, async (err, doc, any) => {
      if (err) {
        next(err);
        return;
      }
      // if (status === "order_accepted") {
      //   makeRazorPayCall(orderData);
      // }

      //////////////////////////////////////////////
      if ((status === "order_completed" || status === "order_cancelled" || status === "order_rejected")) {
        await rewardPointHandler(
          orderData["storeId"],
          orderData["userId"],
          orderData["orderId"],
          status,
          rewardPointsEarnedPerOrder,
          orderData["redeemRewardData"]["redeemRewardPoint"],
          orderData["redeemRewardData"]["tradeRedeemRewardPoint"]
        );
      }

      if (status === "order_cancelled") {
        var subject = `Your order ${orderData["orderId"]} with store ${orderData["store"]["name"]} is Cancelled`;
        sendEmail(orderData, subject)
      }

      if (status === "order_rejected") {
        var subject = `Your order ${orderData["orderId"]} with store ${orderData["store"]["name"]} is Rejected`;
        sendEmail(orderData, subject)
      }
      /////////////////////////////////////////

      /// notification collection for order
      var notificationStatus;
      if (status === "order_accepted" && changedStatus === true) {
        notificationStatus = "order_accepted_changed";
      } else if (status === "order_accepted" && changedStatus === false) {
        notificationStatus = "order_accepted_nochanged";
      } else {
        notificationStatus = status;
      }

      await fcmNotificationHandler(
        "order", // notiType
        notificationStatus, // status
        orderData["userId"], // userId
        orderData["storeId"], // storeId
        {
          id: orderData["_id"],
          orderId: orderData["orderId"],
          userId: orderData["userId"],
          storeId: orderData["storeId"],
          status: status,
          deliveryPartnerDetails: orderData["deliveryPartnerDetails"],
          rewardPointsEarnedPerOrder: rewardPointsEarnedPerOrder,
        }, // data
      );

      await notificationDBHandler(
        "order", // notiType
        notificationStatus, // status
        orderData["userId"], // userId
        orderData["storeId"], // storeId
        {
          id: orderData["_id"],
          orderId: orderData["orderId"],
          userId: orderData["userId"],
          storeId: orderData["storeId"],
          status: status,
          deliveryPartnerDetails: orderData["deliveryPartnerDetails"],
          rewardPointsEarnedPerOrder: rewardPointsEarnedPerOrder,
        }, // data
      );


      /// notification collection for reward point part
      if (orderData["rewardPointData"]) {
        if (status === "order_completed" && orderData["paymentDetail"]["totalPrice"] >= orderData["rewardPointData"]["minOrderAmount"]) {
          notificationStatus = "reward_point_earned";
        } else if (status === "order_rejected") {
          notificationStatus = "reward_point_cancelled";
        } else if (status === "order_cancelled") {
          notificationStatus = "reward_point_cancelled";
        } else {
          notificationStatus = "";
        }

        if (notificationStatus !== "") {
          await fcmNotificationHandler(
            "order", // notiType
            notificationStatus, // status
            orderData["userId"], // userId
            orderData["storeId"], // storeId
            {
              id: orderData["_id"],
              orderId: orderData["orderId"],
              userId: orderData["userId"],
              storeId: orderData["storeId"],
              status: status,
              rewardPointsEarnedPerOrder: rewardPointsEarnedPerOrder,
            }, // data
          );

          await notificationDBHandler(
            "order", // notiType
            notificationStatus, // status
            orderData["userId"], // userId
            orderData["storeId"], // storeId
            {
              id: orderData["_id"],
              orderId: orderData["orderId"],
              userId: orderData["userId"],
              storeId: orderData["storeId"],
              status: status,
              rewardPointsEarnedPerOrder: rewardPointsEarnedPerOrder,
            }, // data
          );
        }


      }
      /// ---------- notification collection end -------------------------


      if (status === "order_accepted") {
        // exotelApi("order_accepted", orderData["user"]["mobile"]);
      }

      if (status === 'order_completed') {
        let from = new Date();
        from.setHours(0, 0, 0, 0)
        let to = new Date();
        to.setHours(23, 59, 59, 0)
        let todayScratchCardConfig = await ScratchCardConfig.findOne({
          "createdAt": {
            "$gte": from,
            "$lt": to
          }
        }, null, {
          sort: {
            createdAt: "desc"
          }
        });
        if (todayScratchCardConfig) {
          let issuedScratchCard;
          if (todayScratchCardConfig.userLimit) {

            let ordersByUser = await Order.find({
              "createdAt": {
                "$gte": from,
                "$lt": to
              },
              status: "order_completed",
              userId: orderData["userId"],
            });

            if (todayScratchCardConfig.userLimit >= ordersByUser.length) {
              issuedScratchCard = await ScratchCard.create({
                userId: orderData["userId"],
                scratchCardConfigId: todayScratchCardConfig.id,
                orderId: orderData["_id"],
              });

            } else {
              // please fix this part
              issuedScratchCard = await ScratchCard.create({
                userId: orderData["userId"],
                amount: 0,
                orderId: orderData["_id"],
              });
            }

          } else {
            issuedScratchCard = await ScratchCard.create({
              userId: req.currentUserId,
              scratchCardConfigId: todayScratchCardConfig.id,
              orderId: orderData["_id"],
            });
          }


          if (issuedScratchCard) {

            let updatedOrder = await Order.findByIdAndUpdate(orderData["_id"], {
              scratchCardId: issuedScratchCard.id
            })

            await fcmNotificationHandler(
              "scratch_card", // notiType
              "create", // status
              orderData["userId"], // userId
              orderData["storeId"], // storeId
              {
                id: orderData["_id"],
                orderId: orderData["orderId"],
                userId: orderData["userId"],
                storeId: orderData["storeId"],
                scratchCardId: issuedScratchCard.id,
                status: "create",
              }, // data
            );
            await notificationDBHandler(
              "scratch_card", // notiType
              "create", // status
              orderData["userId"], // userId
              orderData["storeId"], // storeId
              {
                id: orderData["_id"],
                orderId: orderData["orderId"],
                userId: orderData["userId"],
                storeId: orderData["storeId"],
                scratchCardId: issuedScratchCard.id,
                status: "create",
              }, // data
            );
          }
        }
      }

      return res.send({ "success": true, "data": orderData });

    });

  } catch (err) {
    console.log("--------------- order accept ------------------");
    console.error(err);
    next(err);
  }
}

router.get("/getOrderData/", auth, async (req, res, next) => {
  const { storeId, status, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;

  var match = {};
  if (storeId !== "" && storeId !== undefined) {
    match["storeId"] = storeId;
  }

  if (userId !== "" && userId !== undefined) {
    match["userId"] = userId;
  }

  if (status !== "all") {
    match["status"] = status;
  }

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $set: { userId: { $toObjectId: "$userId" } } },
    { $set: { scratchCardId: { $toObjectId: "$scratchCardId" } } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup:
      {
        from: "stores",
        localField: 'storeId',
        foreignField: '_id',
        as: "store"
      },
    },
    { "$unwind": "$store" },
    {
      $lookup:
      {
        from: "scratch_cards",
        localField: 'scratchCardId',
        foreignField: '_id',
        as: "scratchCard"
      },
    },
  ];


  try {
    if (userId === "" || userId === undefined) {
      pipeline.push({
        $lookup:
        {
          from: "app-users",
          localField: 'userId',
          foreignField: '_id',
          as: "user"
        },
      });
      pipeline.push({ "$unwind": "$user" });
    }

    pipeline.push({
      $match: {
        $or: [
          { "store.name": { "$regex": searchKey, "$options": "i" } },
          { "store.mobile": { "$regex": searchKey, "$options": "i" } },
          { "user.firstName": { "$regex": searchKey, "$options": "i" } },
          { "user.lastName": { "$regex": searchKey, "$options": "i" } },
          { "user.mobile": { "$regex": searchKey, "$options": "i" } },
          { "orderId": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    });

    const orders = Order.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    Order.aggregatePaginate(orders, options, function (err, results) {
      if (err) {
        console.log(err);
        return next(err);
      }
      else {
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getStoreInvoices/", auth, async (req, res, next) => {
  const { searchKey, page, limit } = req.query;
  const userId = req.currentUserId;

  var match = {};
  match["userId"] = userId;
  match["initiatedBy"] = "Store";
  match["category"] = "InvoiceFromStore";

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup:
      {
        from: "stores",
        localField: 'storeId',
        foreignField: '_id',
        as: "store"
      },
    },
    { "$unwind": "$store" },
    {
      $match: {
        $or: [
          { "store.name": { "$regex": searchKey, "$options": "i" } },
          { "store.mobile": { "$regex": searchKey, "$options": "i" } },
          { "store.email": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    }

  ];


  try {
    const orders = Order.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    Order.aggregatePaginate(orders, options, function (err, results) {
      if (err) {
        next(err)
      }
      else {
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getScratchCardData/", auth, async (req, res, next) => {
  const { storeId, searchKey, page, limit } = req.query;
  console.log(req.query);
  const userId = req.currentUserId;

  var match = {};
  if (storeId !== "" && storeId !== undefined) {
    match["storeId"] = storeId;
  }

  if (userId !== "" && userId !== undefined) {
    match["userId"] = userId;
  }


  const pipeline = [
    {
      $match: match
    },
    {
      $match: {
        "status": "order_completed",
        "scratchCardId": {
          "$exists": true,
          "$ne": null,
        },
      },
    },
    {
      $match: {
        "status": "order_completed",
        "scratchCardId": {
          "$exists": true,
          "$ne": "",
        },
      },
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $set: { userId: { $toObjectId: "$userId" } } },
    { $set: { scratchCardId: { $toObjectId: "$scratchCardId" } } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup:
      {
        from: "stores",
        localField: 'storeId',
        foreignField: '_id',
        as: "store"
      },
    },
    { "$unwind": "$store" },
    {
      $lookup:
      {
        from: "scratch_cards",
        localField: 'scratchCardId',
        foreignField: '_id',
        as: "scratchCard"
      },
    },
  ];


  try {
    if (userId === "" || userId === undefined) {
      pipeline.push({
        $lookup:
        {
          from: "app-users",
          localField: 'userId',
          foreignField: '_id',
          as: "user"
        },
      });
      pipeline.push({ "$unwind": "$user" });
    }

    pipeline.push({
      $match: {
        $or: [
          { "store.name": { "$regex": searchKey, "$options": "i" } },
          { "store.mobile": { "$regex": searchKey, "$options": "i" } },
          { "user.firstName": { "$regex": searchKey, "$options": "i" } },
          { "user.lastName": { "$regex": searchKey, "$options": "i" } },
          { "user.mobile": { "$regex": searchKey, "$options": "i" } },
          { "orderId": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    });

    const orders = Order.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    Order.aggregatePaginate(orders, options, function (err, results) {
      if (err) {
        console.log(err);
        return next(err);
      }
      else {
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getOrderDataByCategory/", auth, async (req, res, next) => {
  const { storeCategoryId, page, limit } = req.query;
  const userId = req.currentUserId;

  var match = {};
  match["userId"] = userId;
  match["storeCategoryId"] = storeCategoryId;

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $set: { userId: { $toObjectId: "$userId" } } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup:
      {
        from: "stores",
        localField: 'storeId',
        foreignField: '_id',
        as: "store"
      },
    },
    { "$unwind": "$store" },
    {
      $lookup:
      {
        from: "app-users",
        localField: 'userId',
        foreignField: '_id',
        as: "user"
      },
    },
    { "$unwind": "$user" }
  ];

  try {
    const orders = Order.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    Order.aggregatePaginate(orders, options, function (err, results) {
      if (err) {
        console.log(err);
        return next(err);
      }
      else {
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getOrder", auth, async (req, res, next) => {
  const { storeId, orderId } = req.query;
  const userId = req.currentUserId;
  try {
    const order = await Order.aggregate(
      [
        {
          $match: {
            "orderId": orderId,
            "storeId": storeId,
            "userId": userId,
          }
        },
        { $set: { storeId: { $toObjectId: "$storeId" } } },
        { $set: { userId: { $toObjectId: "$userId" } } },
        { $set: { scratchCardId: { $toObjectId: "$scratchCardId" } } },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "stores",
            localField: 'storeId',
            foreignField: '_id',
            as: "store"
          },
        },
        { "$unwind": "$store" },
        {
          $lookup:
          {
            from: "app-users",
            localField: 'userId',
            foreignField: '_id',
            as: "user"
          },
        },
        { "$unwind": "$user" },
        {
          $lookup:
          {
            from: "scratch_cards",
            localField: 'scratchCardId',
            foreignField: '_id',
            as: "scratchCard"
          },
        },
      ]
    );
    return res.status(200).send({ "success": true, "data": order });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getDashboardDataByStore/:storeId", async (req, res, next) => {
//   try {
//     var totalOrderInfo = await Order.aggregate(
//       [
//         {
//           $match: {
//             'status': {
//               $nin: ["order_rejected", "order_cancelled"],
//             },
//             'storeId': req.params.storeId,
//           }
//         },
//         {
//           $group: {
//             _id: "$storeId",
//             totalOrderCount: { $sum: 1 },
//             totalPrice: { $sum: "$paymentDetail.toPay" },
//             totalQuantity: { $sum: "$paymentDetail.totalQuantity" }
//           }
//         }
//       ]
//     );

//     var totalCancelledOrderInfo = await Order.aggregate(
//       [
//         {
//           $match: {
//             'status': {
//               $in: ["order_cancelled"],
//             },
//             'storeId': req.params.storeId,
//           }
//         },
//         {
//           $group: {
//             _id: "$storeId",
//             totalCancelledOrderCount: { $sum: 1 },
//           }
//         }
//       ]
//     );

//     var totalRejectedOrderInfo = await Order.aggregate(
//       [
//         {
//           $match: {
//             'status': {
//               $in: ["order_rejected"],
//             },
//             'storeId': req.params.storeId,
//           }
//         },
//         {
//           $group: {
//             _id: "$storeId",
//             totalRejectedOrderCount: { $sum: 1 },
//           }
//         }
//       ]
//     );

//     const year = new Date().getFullYear();
//     const month = new Date().getMonth();
//     const day = new Date().getDate();
//     const todaysDate = new Date(year, month, day);
//     const tomorrowDate = new Date(year, month, day + 1);

//     var todayOrderInfo = await Order.aggregate(
//       [
//         {
//           $match: {
//             'status': {
//               $nin: ["order_rejected", "order_cancelled"],
//             },
//             'storeId': req.params.storeId,
//             "updatedAt": { "$gte": todaysDate, "$lte": tomorrowDate }
//           }
//         },
//         {
//           $group: {
//             _id: "$storeId",
//             todayOrderCount: { $sum: 1 },
//             todayPrice: { $sum: "$paymentDetail.toPay" },
//             todayQuantity: { $sum: "$paymentDetail.totalQuantity" }
//           }
//         }
//       ]
//     );

//     const data = {
//       totalOrderCount: 0,
//       totalPrice: 0,
//       totalQuantity: 0,
//       totalRejectedOrderCount: 0,
//       totalCancelledOrderCount: 0,
//       todayOrderCount: 0,
//       todayPrice: 0,
//       todayQuantity: 0,
//     };

//     if (totalOrderInfo.length !== 0) {
//       data["totalOrderCount"] = totalOrderInfo[0]["totalOrderCount"];
//       data["totalPrice"] = totalOrderInfo[0]["totalPrice"];
//       data["totalQuantity"] = totalOrderInfo[0]["totalQuantity"];
//     }
//     if (totalRejectedOrderInfo.length !== 0) {
//       data["totalRejectedOrderCount"] = totalRejectedOrderInfo[0]["totalRejectedOrderCount"];
//     }
//     if (totalCancelledOrderInfo.length !== 0) {
//       data["totalCancelledOrderCount"] = totalCancelledOrderInfo[0]["totalCancelledOrderCount"];
//     }
//     if (todayOrderInfo.length !== 0) {
//       data["todayOrderCount"] = todayOrderInfo[0]["todayOrderCount"];
//       data["todayPrice"] = todayOrderInfo[0]["todayPrice"];
//       data["todayQuantity"] = todayOrderInfo[0]["todayQuantity"];
//     }

//     return res.status(200).send({ "success": true, "data": data });
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.get("/getDashboardDataByUser", auth, async (req, res, next) => {
  var { storeCategoryId } = req.query;
  const userId = req.currentUserId;

  var match = {};
  match["userId"] = userId;

  if (storeCategoryId !== "" && storeCategoryId !== undefined) {
    match["storeCategoryId"] = storeCategoryId;
  }

  try {
    var totalOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'status': {
              $nin: ["order_rejected", "order_cancelled"],
            },
          }
        },
        {
          $match: match
        },
        {
          $group: {
            _id: "$userId",
            totalOrderCount: { $sum: 1 },
            totalPrice: { $sum: "$paymentDetail.toPay" },
            totalQuantity: { $sum: "$paymentDetail.totalQuantity" }
          }
        }
      ]
    );

    var totalCancelledOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'status': {
              $in: ["order_cancelled"],
            },
          }
        },
        {
          $match: match
        },
        {
          $group: {
            _id: "$userId",
            totalCancelledOrderCount: { $sum: 1 },
          }
        }
      ]
    );

    var totalRejectedOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'status': {
              $in: ["order_rejected"],
            },
          }
        },
        {
          $match: match
        },
        {
          $group: {
            _id: "$userId",
            totalRejectedOrderCount: { $sum: 1 },
          }
        }
      ]
    );

    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const day = new Date().getDate();
    const todaysDate = new Date(year, month, day);
    const tomorrowDate = new Date(year, month, day + 1);

    var todayOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'status': {
              $nin: ["order_rejected", "order_cancelled"],
            },
            "updatedAt": { "$gte": todaysDate, "$lte": tomorrowDate }
          }

        },
        {
          $match: match
        },
        {
          $group: {
            _id: "$userId",
            todayOrderCount: { $sum: 1 },
            todayPrice: { $sum: "$paymentDetail.toPay" },
            todayQuantity: { $sum: "$paymentDetail.totalQuantity" }
          }
        }
      ]
    );

    const data = {
      totalOrderCount: 0,
      totalPrice: 0,
      totalQuantity: 0,
      totalRejectedOrderCount: 0,
      totalCancelledOrderCount: 0,
      todayOrderCount: 0,
      todayPrice: 0,
      todayQuantity: 0,
    };

    if (totalOrderInfo.length !== 0) {
      data["totalOrderCount"] = totalOrderInfo[0]["totalOrderCount"];
      data["totalPrice"] = totalOrderInfo[0]["totalPrice"];
      data["totalQuantity"] = totalOrderInfo[0]["totalQuantity"];
    }
    if (totalRejectedOrderInfo.length !== 0) {
      data["totalRejectedOrderCount"] = totalRejectedOrderInfo[0]["totalRejectedOrderCount"];
    }
    if (totalCancelledOrderInfo.length !== 0) {
      data["totalCancelledOrderCount"] = totalCancelledOrderInfo[0]["totalCancelledOrderCount"];
    }
    if (todayOrderInfo.length !== 0) {
      data["todayOrderCount"] = todayOrderInfo[0]["todayOrderCount"];
      data["todayPrice"] = todayOrderInfo[0]["todayPrice"];
      data["todayQuantity"] = todayOrderInfo[0]["todayQuantity"];
    }

    return res.status(200).send({ "success": true, "data": data });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getGraphDataByStore/", async (req, res, next) => {
//   var { storeId, filter, } = req.query;

//   var year = new Date().getFullYear();
//   var month = new Date().getMonth();
//   var day = new Date().getDate();
//   var endDateDate = new Date(year, month, day + 1);
//   var startDate;

//   console.log(filter);
//   console.log(storeId);

//   if (filter === "day")
//     startDate = new Date(year, month, day - 6);
//   if (filter === "month")
//     startDate = new Date(year, month - 7, day);
//   if (filter === "week")
//     startDate = new Date(year, month, day - 49);

//   try {
//     var totalOrderInfo = await Order.aggregate(
//       [
//         {
//           $match: {
//             'status': {
//               $nin: ["order_rejected", "order_cancelled"],
//             },
//             'storeId': storeId,
//             "updatedAt": { "$gte": startDate, "$lte": endDateDate }
//           }
//         },
//         { $sort: { updatedAt: 1 } },
//         {
//           "$project": {
//             "id": "$_id",
//             "orderId": "$orderId",
//             "storeId": "$storeId",
//             "userId": "$userId",
//             "PaymentDetail": "$paymentDetail",
//             "updatedAt": "$updatedAt",
//           }
//         }
//       ]
//     );
//     return res.status(200).send({ "success": true, "data": totalOrderInfo });
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.get("/getGraphDataByUser/", auth, async (req, res, next) => {
  var { filter, storeCategoryId } = req.query;
  const userId = req.currentUserId;

  var year = new Date().getFullYear();
  var month = new Date().getMonth();
  var day = new Date().getDate();
  var endDateDate = new Date(year, month, day + 1);
  var startDate;


  if (filter === "day")
    startDate = new Date(year, month, day - 6);
  if (filter === "month")
    startDate = new Date(year, month - 7, day);
  if (filter === "week")
    startDate = new Date(year, month, day - 49);

  var match = {};

  match["status"] = {
    $nin: ["order_rejected", "order_cancelled"],
  };
  match["userId"] = userId;
  match["updatedAt"] = { "$gte": startDate, "$lte": endDateDate };

  if (storeCategoryId !== "" && storeCategoryId !== undefined) {
    match["storeCategoryId"] = storeCategoryId;
  }


  try {
    var totalOrderInfo = await Order.aggregate(
      [
        {
          $match: match
        },
        { $sort: { updatedAt: 1 } },
        {
          "$project": {
            "id": "$_id",
            "orderId": "$orderId",
            "storeId": "$storeId",
            "userId": "$userId",
            "PaymentDetail": "$paymentDetail",
            "updatedAt": "$updatedAt",
          }
        }
      ]
    );
    return res.status(200).send({ "success": true, "data": totalOrderInfo });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getCategoryOrderDataByUser", auth, async (req, res, next) => {
  const userId = req.currentUserId;

  try {
    var totalOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'status': {
              $nin: ["order_rejected", "order_cancelled"],
            },
            'userId': userId,
          }
        },
        {
          $group: {
            "_id": "$storeCategoryId",
            totalOrderCount: { $sum: 1 },
            totalPrice: { $sum: "$paymentDetail.toPay" },
            totalQuantity: { $sum: "$paymentDetail.totalQuantity" }
          }
        },
        {
          "$project": {
            "userId": "$_id.userId",
            "storeCategoryId": "$_id.storeCategoryId",
            "totalOrderCount": "$totalOrderCount",
            "totalPrice": "$totalPrice",
            "totalQuantity": "$totalQuantity",
          }
        },
        {
          $lookup:
          {
            from: 'categories',
            localField: "_id",
            foreignField: 'categoryId',
            as: 'category'
          }
        },
        { "$unwind": "$category" },
        { $sort: { "category.categoryDesc": 1 } },
      ]
    );

    return res.status(200).send({ "success": true, "data": totalOrderInfo });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getCouponUsage", auth, async (req, res, next) => {
  var { storeId, couponId } = req.query;
  const userId = req.currentUserId;

  try {
    var totalOrderInfo = await Order.aggregate(
      [
        {
          $match: {
            'storeId': storeId,
            'coupon._id': couponId,
            'userId': userId,
          }
        },
        {
          $match: {
            $and: [
              { "status": { $ne: "order_cancelled" } },
              { "status": { $ne: "order_rejected" } },
            ],
          },
        },
        {
          $group:
          {
            _id: "$userId",
            couponCount: { $sum: 1 }
          }
        },
      ]
    );

    return res.status(200).send({ "success": true, "data": totalOrderInfo });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/order", router);
module.exports = {
  install
};
