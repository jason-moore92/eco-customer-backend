const express = require("express");
const router = express.Router();
const Coupons = require("../model/coupons");
const Users = require('../model/AppUser')
const Products = require('../model/Product')
const Services = require('../model/Service')
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
var ObjectId = require('mongoose').Types.ObjectId;
const Store = require("../model/Store");
const { getStorePipeline } = require("../controller/StoreController");

router.post("/getCoupons", async (req, res, next) => {
  var params = req.body;
  var storeId = params["storeId"];
  var userId = params["userId"];
  var productCategories = params["productCategories"];
  var servicesCategories = params["servicesCategories"];
  var productIds = params["productIds"];
  var serviceIds = params["serviceIds"];
  var usageLimits = params["usageLimits"];
  var page = params["page"];
  var status = params["status"];
  var limit = params["limit"];
  var searchKey = params["searchKey"];

  console.log("========= getCoupons =============");
  console.log(params);

  var matchCondition = {
    "storeId": storeId,
    enabled: true,
  };
  var endDateCondition = [
    {
      "name": { $ne: null }
    },
  ];

  var checkoutORCondition = [
    {
      "name": { $ne: null },
      "eligibility": "for_customer",
    },
  ];

  if (status == "Active") {
    /// coupon date validation
    matchCondition["startDate"] = { $lt: new Date() };
    endDateCondition = [];
    endDateCondition.push(
      {
        "endDate": {
          "$exists": true,
          "$ne": null,
          $gte: new Date(),
        }
      },
      {
        "endDate": {
          "$exists": true,
          "$eq": null,
        }
      },
      {
        "endDate": {
          "$exists": false,
        }
      }
    );
    ////////////////////////////

    // /// customerEligibility condition
    // if (userId !== undefined && !isNull(userId)) {
    //   checkoutORCondition = [];

    //   checkoutORCondition.push({
    //     "customerEligibility":"Everyone",
    //   });
    //   checkoutORCondition.push({
    //     "customerEligibility": "Specific_Customers",
    //     "specificCustomers": userId,
    //   });
    // }
    // ////////////////////////////
  }
  if (status == "Future") {
    matchCondition["startDate"] = { $gte: new Date() };
  }
  if (status == "Expired") {
    matchCondition["startDate"] = { $lt: new Date() };
    matchCondition["endDate"] = {
      "$exists": true,
      "$ne": null,
      $lt: new Date(),
    }
  }

  if (searchKey !== undefined)
    matchCondition["discountCode"] = { "$regex": searchKey, "$options": "i" };

  console.log("======== checkoutORCondition ===========");
  console.log(matchCondition);
  console.log(endDateCondition);
  
  console.log(checkoutORCondition);
  console.log("========-----------===========");

  var pipeline = [];

  pipeline.push(
    {
      $match: matchCondition
    },
  );

  pipeline.push(
    {
      $match: {
        $or: endDateCondition,
      },
    },
  );

  pipeline.push(
    {
      $match: {
        $or: checkoutORCondition,
      },
    },
  );

  pipeline.push(
    { $sort: { updatedAt: -1 } },
  );

  try {
    const coupons = Coupons.aggregate( pipeline );

    const options = {
      page: page,
      limit: limit
    };

    Coupons.aggregatePaginate(coupons, options,async function (err, results) {
      if (err) {
        console.log(err);
        next(err)
      }
      else {
        for (let index = 0; index < results["docs"].length; index++) {
          var couponData = results["docs"][index];
          var users = [];
          /// specificCustomers
          for (let k = 0; k < couponData["specificCustomers"].length; k++) {
            var userId = couponData["specificCustomers"][k];
            var user = await Users.findById(userId);
            users.push(user);
          }
          results["docs"][index]["specificCustomers"] = users;
          ///////////////////////////////////////////////////////////

          /// applied Product and services
          var products = [];
          for (let k = 0; k < couponData["appliedData"]["appliedItems"]["products"].length; k++) {
            var productId = couponData["appliedData"]["appliedItems"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["appliedData"]["appliedItems"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["appliedData"]["appliedItems"]["services"].length; k++) {
            var serviceId = couponData["appliedData"]["appliedItems"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["appliedData"]["appliedItems"]["services"] = services;
          ///////////////////////////////////////////////////////////

          /// discout BOGO Product and services
          var products = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["buy"]["products"].length; k++) {
            var productId = couponData["discountData"]["customerBogo"]["buy"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["discountData"]["customerBogo"]["buy"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["buy"]["services"].length; k++) {
            var serviceId = couponData["discountData"]["customerBogo"]["buy"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["discountData"]["customerBogo"]["buy"]["services"] = services;

          var products = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["get"]["products"].length; k++) {
            var productId = couponData["discountData"]["customerBogo"]["get"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["discountData"]["customerBogo"]["get"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["get"]["services"].length; k++) {
            var serviceId = couponData["discountData"]["customerBogo"]["get"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["discountData"]["customerBogo"]["get"]["services"] = services;
          ///////////////////////////////////////////////////////////

        }
        return res.status(200).send({ "success": true, "data": results });
      }
    });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.post("/getCouponsByStoreCategory/", auth, async (req, res, next) => {
  const params = req.body;
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];
  const userId = req.currentUserId;
  params["searchKey"] = "";

  var storePipeline = getStorePipeline(params);
  var stores = await Store.aggregate(storePipeline);

  var storeIds = [];

  for (let index = 0; index < stores.length; index++) {
    var store = stores[index];
    storeIds.push(store["_id"].toString());
  }

  var matchCondition = {};

  matchCondition["storeId"] = { $in: storeIds };
  matchCondition["enabled"] = true;

  var endDateCondition = [
    {
      "name": { $ne: null }
    },
  ];

  var checkoutORCondition = [
    {
      "name": { $ne: null },
      "eligibility": "for_customer",
    },
  ];

    /// coupon date validation
    matchCondition["startDate"] = { $lt: new Date() };
    endDateCondition = [];
    endDateCondition.push(
      {
        "endDate": {
          "$exists": true,
          "$ne": null,
          $gte: new Date(),
        }
      },
      {
        "endDate": {
          "$exists": true,
          "$eq": null,
        }
      },
      {
        "endDate": {
          "$exists": false,
        }
      }
    );
    ////////////////////////////

    // /// customerEligibility condition
    // if (userId !== undefined && !isNull(userId)) {
    //   checkoutORCondition = [];

    //   checkoutORCondition.push({
    //     "customerEligibility": "Everyone",
    //   });
    //   checkoutORCondition.push({
    //     "customerEligibility": "Specific_Customers",
    //     "specificCustomers": userId,
    //   });
    // }
    // ////////////////////////////

  if (searchKey !== undefined)
    matchCondition["discountCode"] = { "$regex": searchKey, "$options": "i" };

  var pipeline = [];

  pipeline.push(
    {
      $match: matchCondition
    },
  );

  pipeline.push(
    {
      $match: {
        $or: endDateCondition,
      },
    },
  );

  pipeline.push(
    {
      $match: {
        $or: checkoutORCondition,
      },
    },
  );

  pipeline.push(
    { $sort: { updatedAt: -1 } },
  );
  pipeline.push(
    { $set: { storeId: { $toObjectId: "$storeId" } } },
  );
  pipeline.push(
    {
      $lookup:
      {
        from: "stores",
        localField: 'storeId',
        foreignField: '_id',
        as: "store"
      },
    },
  );
  pipeline.push(
    { "$unwind": "$store" },
  );

  try {
    const coupons = Coupons.aggregate(pipeline);

    const options = {
      page: page,
      limit: limit
    };

    Coupons.aggregatePaginate(coupons, options, async function (err, results) {
      if (err) {
        console.log(err);
        next(err)
      }
      else {
        for (let index = 0; index < results["docs"].length; index++) {
          var couponData = results["docs"][index];
          var users = [];
          /// specificCustomers
          for (let k = 0; k < couponData["specificCustomers"].length; k++) {
            var userId = couponData["specificCustomers"][k];
            var user = await Users.findById(userId);
            users.push(user);
          }
          results["docs"][index]["specificCustomers"] = users;
          ///////////////////////////////////////////////////////////

          /// applied Product and services
          var products = [];
          for (let k = 0; k < couponData["appliedData"]["appliedItems"]["products"].length; k++) {
            var productId = couponData["appliedData"]["appliedItems"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["appliedData"]["appliedItems"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["appliedData"]["appliedItems"]["services"].length; k++) {
            var serviceId = couponData["appliedData"]["appliedItems"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["appliedData"]["appliedItems"]["services"] = services;
          ///////////////////////////////////////////////////////////

          /// discout BOGO Product and services
          var products = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["buy"]["products"].length; k++) {
            var productId = couponData["discountData"]["customerBogo"]["buy"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["discountData"]["customerBogo"]["buy"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["buy"]["services"].length; k++) {
            var serviceId = couponData["discountData"]["customerBogo"]["buy"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["discountData"]["customerBogo"]["buy"]["services"] = services;

          var products = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["get"]["products"].length; k++) {
            var productId = couponData["discountData"]["customerBogo"]["get"]["products"][k];
            var product = await Products.findById(productId);
            products.push({ "orderQuantity": 1, "data": product });
          }
          results["docs"][index]["discountData"]["customerBogo"]["get"]["products"] = products;

          var services = [];
          for (let k = 0; k < couponData["discountData"]["customerBogo"]["get"]["services"].length; k++) {
            var serviceId = couponData["discountData"]["customerBogo"]["get"]["services"][k];
            var service = await Services.findById(serviceId);
            services.push({ "orderQuantity": 1, "data": service });
          }
          results["docs"][index]["discountData"]["customerBogo"]["get"]["services"] = services;
          ///////////////////////////////////////////////////////////

        }
        return res.status(200).send({ "success": true, "data": results });
      }
    });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});


router.get("/get", auth, async (req, res, next) => {
  try {
    const couponData = await Coupons.aggregate([
      {
        $match: {
          "_id": ObjectId(req.query.couponId),
        }
      },
      { $set: { storeId: { $toObjectId: "$storeId" } } },
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
    ]);

    /// specificCustomers
    var users = [];
    for (let k = 0; k < couponData[0]["specificCustomers"].length; k++) {
      var userId = couponData[0]["specificCustomers"][k];
      var user = await Users.findById(userId);
      users.push(user);
    }
    couponData[0]["specificCustomers"] = users;
    ///////////////////////////////////////////////////////////

    /// applied Product and services
    var products = [];
    for (let k = 0; k < couponData[0]["appliedData"]["appliedItems"]["products"].length; k++) {
      var productId = couponData[0]["appliedData"]["appliedItems"]["products"][k];
      var product = await Products.findById(productId);
      products.push({ "orderQuantity": 1, "data": product });
    }
    couponData[0]["appliedData"]["appliedItems"]["products"] = products;

    var services = [];
    for (let k = 0; k < couponData[0]["appliedData"]["appliedItems"]["services"].length; k++) {
      var serviceId = couponData[0]["appliedData"]["appliedItems"]["services"][k];
      var service = await Services.findById(serviceId);
      services.push({ "orderQuantity": 1, "data": service });
    }
    couponData[0]["appliedData"]["appliedItems"]["services"] = services;
    ///////////////////////////////////////////////////////////

    /// discout BOGO Product and services
    var products = [];
    for (let k = 0; k < couponData[0]["discountData"]["customerBogo"]["buy"]["products"].length; k++) {
      var productId = couponData[0]["discountData"]["customerBogo"]["buy"]["products"][k];
      var product = await Products.findById(productId);
      products.push({ "orderQuantity": 1, "data": product });
    }
    couponData[0]["discountData"]["customerBogo"]["buy"]["products"] = products;

    var services = [];
    for (let k = 0; k < couponData[0]["discountData"]["customerBogo"]["buy"]["services"].length; k++) {
      var serviceId = couponData[0]["discountData"]["customerBogo"]["buy"]["services"][k];
      var service = await Services.findById(serviceId);
      services.push({ "orderQuantity": 1, "data": service });
    }
    couponData[0]["discountData"]["customerBogo"]["buy"]["services"] = services;

    var products = [];
    for (let k = 0; k < couponData[0]["discountData"]["customerBogo"]["get"]["products"].length; k++) {
      var productId = couponData[0]["discountData"]["customerBogo"]["get"]["products"][k];
      var product = await Products.findById(productId);
      products.push({ "orderQuantity": 1, "data": product });
    }
    couponData[0]["discountData"]["customerBogo"]["get"]["products"] = products;

    var services = [];
    for (let k = 0; k < couponData[0]["discountData"]["customerBogo"]["get"]["services"].length; k++) {
      var serviceId = couponData[0]["discountData"]["customerBogo"]["get"]["services"][k];
      var service = await Services.findById(serviceId);
      services.push({ "orderQuantity": 1, "data": service });
    }
    couponData[0]["discountData"]["customerBogo"]["get"]["services"] = services;
    ///////////////////////////////////////////////////////////

    return res.status(200).send({ "success": true, "data": couponData });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/coupons", router);

module.exports = {
  install
};
