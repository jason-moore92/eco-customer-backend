const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const Cart = require("../model/Cart");
const User = require("../model/User");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");

router.post("/add/", async (req, res, next) => {
  const params = req.body;
  const userId = params["userId"];
  const storeId = params["storeId"];
  const category = params["category"];
  const objectId = params["objectId"];
  const quantity = params["quantity"];
  try {
    const query = { userId: userId, storeId: storeId, category: category, objectId: objectId };
    const options = { new: true, upsert: true };
    params["updatedAt"] = Date.now();
    Cart.findOneAndUpdate(query, params, options, (err, doc, any) => {
      if (err) {
        return res.status(500).send({ "success": false, "message": message.apiError });
      }
      return res.status(200).send({ "success": true, "data": doc });
    });
  } catch (err) {
    return next(err);
  }
});



router.get("/getCartData/", async (req, res, next) => {
  const { userId, storeId, } = req.query;

  const match = { userId: userId };
  if (storeId !== "" && storeId !== undefined) {
    match["storeId"] = storeId;
  }


  Cart.find


  try {
    const carts = await Cart.aggregate(
      [
        {
          $match: match
        },
        { $sort: { storeId: -1, updatedAt: -1, } },
        { $set: { objectId: { $toObjectId: "$objectId" } } },
        { $set: { storeId: { $toObjectId: "$storeId" } } },
        {
          $lookup:
          {
            from: "stores",
            localField: 'storeId',
            foreignField: '_id',
            as: "stores"
          },
        },
        {
          $lookup:
          {
            from: "products",
            localField: 'objectId',
            foreignField: '_id',
            as: "products"
          },
        },
        {
          $lookup:
          {
            from: "services",
            localField: 'objectId',
            foreignField: '_id',
            as: "services"
          },
        },
        { $sort: { "stores.name": -1} },
      ]
    );
    


    return res.status(200).send({ "success": true, "data": carts });

    
    
    // const options = {
    //   page: page,
    //   limit: limit
    // };

    Cart.aggregatePaginate(carts, options, function (err, results) {
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







const install = app => app.use("/api/v1/cart", router);

module.exports = {
  install
};
