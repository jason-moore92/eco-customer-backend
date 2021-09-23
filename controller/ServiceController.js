const express = require("express");
const router = express.Router();
const Service = require("../model/Service");
const Store = require("../model/Store");
const { getStorePipeline } = require("../controller/StoreController");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");

router.get("/getServiceCategories/:storeIds", async (req, res, next) => {
  try {
    const storeIds = req.params["storeIds"].split(',');
    const serviceCategories = await Service.aggregate(
      [
        {
          $match: {
            "storeId": { $in: storeIds },
            "isDeleted": false,
          }
        },
        {
          $match: {
            isDeleted: false,
            listonline: true,
          }
        },
        {
          $group:
          {
            _id: "$category",
            serviceCount: { $sum: 1 }
          }
        },
      ]
    );
    res.send({ "success": true, "data": serviceCategories });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getServiceProvided/:storeIds", async (req, res, next) => {
  try {
    console.log("-------getServiceProvided---------");
    const storeIds = req.params["storeIds"].split(',');
    console.log(storeIds);
    const serviceCategories = await Service.aggregate(
      [
        {
          $match: { "storeId": { $in: storeIds } }
        },
        {
          $match: {
            isDeleted: false,
            listonline: true,
          }
        },
        {
          $group:
          {
            _id: "$provided",
            serviceCount: { $sum: 1 }
          }
        },
      ]
    );
    res.send({ "success": true, "data": serviceCategories });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getService/:id", async (req, res, next) => {
  try {
    var service = await Service.findById(req.params["id"]);

    res.send({ "success": true, "data": service });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.post("/update/", async (req, res, next) => {
//   const params = req.body;
//   try {
//     var service = await Service.findByIdAndUpdate(params["_id"], params, { upsert: true });
//     res.send({ "success": true, "data": service });

//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.post("/getServices/", async (req, res, next) => {
  const params = req.body;
  const storeIds = params["storeIds"];
  const categories = [];
  const provideds = [];
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];
  const isDeleted = params["isDeleted"];
  const listonline = params["listonline"];

  for (let index = 0; index < params["categories"].length; index++) {
    const category = params["categories"][index];
    if (category != 'ALL') {
      categories.push(category);
    }
  }
  if (!isNull(params["provideds"]) && params["provideds"] !== undefined) { 
    for (let index = 0; index < params["provideds"].length; index++) {
      const provided = params["provideds"][index];
      if (provided != 'ALL') {
        provideds.push(provided);
      }
    }
  }
  

  var matchCondition = { "storeId": { $in: storeIds } };

  
  if (provideds.length !== 0)
    matchCondition["provided"] = { $in: provideds };
  
  if (categories.length !== 0)
    matchCondition["category"] = { $in: categories };
  
  if (searchKey !== undefined)
    matchCondition["name"] = { "$regex": searchKey, "$options": "i" };
  

  if (listonline !== undefined && !isNull(listonline))
    matchCondition["listonline"] = listonline;
  else
    matchCondition["listonline"] = true;

  if (isDeleted !== undefined && !isNull(isDeleted))
    matchCondition["isDeleted"] = isDeleted;
  else
    matchCondition["isDeleted"] = false;
  
  console.log("============= getServices  111 =================");
  console.log(params);
  console.log(matchCondition);


  try {
    const services = Service.aggregate(
      [
        {
          $match: matchCondition
        },
        { $sort: { updatedAt: -1 } },
      ]
    );
    
    const options = {
      page: page,
      limit: limit
    };

    Service.aggregatePaginate(services, options, function (err, results) {
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

router.post("/getServicesByStoreCategory/",auth, async (req, res, next) => {
  const params = req.body;
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];
  const isDeleted = params["isDeleted"];
  const listonline = params["listonline"];
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

  if (searchKey !== undefined)
    matchCondition["name"] = { "$regex": searchKey, "$options": "i" };

  if (listonline !== undefined && !isNull(listonline))
    matchCondition["listonline"] = listonline;
  else
    matchCondition["listonline"] = true;

  if (isDeleted !== undefined && !isNull(isDeleted))
    matchCondition["isDeleted"] = isDeleted;
  else
    matchCondition["isDeleted"] = false;


  try {
    const services = Service.aggregate(
      [
        {
          $match: matchCondition
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
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    Service.aggregatePaginate(services, options, function (err, results) {
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


const install = app => app.use("/api/v1/service", router);

module.exports = {
  install
};
