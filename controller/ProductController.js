const express = require("express");
const router = express.Router();
const Product = require("../model/Product");
const Store = require("../model/Store");
const { getStorePipeline} = require("../controller/StoreController");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
//TODO:: check if all are public
router.get("/getProductCategories/:storeIds", async (req, res, next) => {
  try {
    const storeIds = req.params["storeIds"].split(',');
    const productCategories = await Product.aggregate(
      [
        {
          $match: {
            "storeId": { $in: storeIds },
            "isDeleted": false,
            "listonline":true,
          }
        },
        {
          $group:
          {
            _id: "$category",
            productCount: { $sum: 1 }
          }
        },
      ]
    );

    res.send({ "success": true, "data": productCategories });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getProductBrands/:storeIds", async (req, res, next) => {
  try {
    const storeIds = req.params["storeIds"].split(',');
    const productCategories = await Product.aggregate(
      [
        {
          $match: { "storeId": { $in: storeIds } }
        },
        {
          $group:
          {
            _id: "$brand",
            productCount: { $sum: 1 }
          }
        },
      ]
    );

    res.send({ "success": true, "data": productCategories });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getProduct/:id", async (req, res, next) => {
  try {
    var product = await Product.findById(req.params["id"]);

    res.send({ "success": true, "data": product });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.post("/update/", async (req, res, next) => {
//   const params = req.body;
//   try {
//     console.log()
//     var product = await Product.findByIdAndUpdate(params["_id"], params, { upsert: true });
//     res.send({ "success": true, "data": product });

//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.post("/getProducts/", async (req, res, next) => {
  const params = req.body;
  const storeIds = params["storeIds"];
  const categories = [];
  const brands = [];
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];
  const isDeleted = params["isDeleted"];
  const listonline = params["listonline"];

  console.log("============= getProducts  111 =================");
  console.log(params);

  for (let index = 0; index < params["categories"].length; index++) {
    const category = params["categories"][index];
    if (category != 'ALL') { 
      categories.push(category);
    }
  }

  if (!isNull(params["brands"]) && params["brands"] !== undefined) {
    for (let index = 0; index < params["brands"].length; index++) {
      const brand = params["brands"][index];
      if (brand != 'ALL') {
        brands.push(brand);
      }
    }
  }


  var matchCondition = { "storeId": { $in: storeIds }};
  
  if (categories.length !== 0)
    matchCondition["category"] = { $in: categories };
  
  if (brands.length !== 0)
    matchCondition["brand"] = { $in: brands };
  
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

  console.log(listonline !== "null");
  console.log(matchCondition);

  try {
    const products = Product.aggregate(
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

    Product.aggregatePaginate(products, options, function (err, results) {
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

router.post("/getProductsByStoreCategory/", auth, async (req, res, next) => {
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
    const products = Product.aggregate(
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

    Product.aggregatePaginate(products, options, function (err, results) {
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


const install = app => app.use("/api/v1/product", router);

module.exports = {
  install
};
