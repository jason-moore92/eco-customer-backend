const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const Cart = require("../model/Cart");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");

router.post("/add/", auth, async (req, res, next) => {
  let params = req.body;
  const userId = req.currentUserId;
  params.userId = userId;
  try {
    const id = params["id"];
    const options = { new: true, upsert: true };
    params["createdAt"] = Date.now();
    params["updatedAt"] = Date.now();
    if (isNull(id)) {
      var cart = await Cart.create(params);
      return res.status(200).send({ "success": true, "data": cart });
    } else {
      if (params["products"].length === 0 && params["services"].length === 0) {
        Cart.findOneAndDelete({ _id: id, userId: userId }, (err, doc, any) => {
          if (err) {
            return res.status(500).send({ "success": false, "message": message.apiError });
          }
          return res.status(200).send({ "success": true, "data": doc, "message": "deleted" });
        });
      } else {
        Cart.findOneAndUpdate({ _id: id, userId: userId }, params, options, (err, doc, any) => {
          if (err) {
            return res.status(500).send({ "success": false, "message": message.apiError });
          }
          return res.status(200).send({ "success": true, "data": doc });
        });
      }
    }



  } catch (err) {
    return next(err);
  }
});



router.get("/getCartData/", auth,  async (req, res, next) => {
  const { status, } = req.query;
  const userId = req.currentUserId;

  getCartData(req, res, userId, status);
});

const getCartData = async (req, res, userId, status) => {
  const match = { userId: userId, status: status };

  try {
    const carts = await Cart.aggregate(
      [
        {
          $match: match
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
        {
          $lookup:
          {
            from: "products",
            localField: 'products.id',
            foreignField: '_id',
            as: "productList"
          },
        },
        {
          $lookup:
          {
            from: "services",
            localField: 'services.id',
            foreignField: '_id',
            as: "serviceList"
          },
        },
        { $sort: { "updatedAt": -1 } },

      ]
    );

    return res.status(200).send({ "success": true, "data": carts });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};



router.post("/backup/", auth, async (req, res, next) => {
  var { cartDataList, lastDeviceToken,  status } = req.body;
  const userId = req.currentUserId;
  console.log("==== cart backup =====");

  try {
    for (let index = 0; index < cartDataList.length; index++) {
      var newCartData = cartDataList[index];
      newCartData["userId"] = userId;
      var oldCartData = await Cart.findOne({ "userId": newCartData["userId"], "storeId": newCartData["storeId"] });
      if (oldCartData) {
        if (oldCartData["lastDeviceToken"] == lastDeviceToken){
          console.log("==== update cart  =====");
          console.log(newCartData["products"].length);
          console.log(newCartData["services"].length);
          if (newCartData["products"].length == 0 && newCartData["services"].length == 0) {
            console.log("====reomve  =====");
            await Cart.remove({ "userId": newCartData["userId"], "storeId": newCartData["storeId"] });
          } else {
            newCartData["lastDeviceToken"] = lastDeviceToken;
            await Cart.findOneAndUpdate({ "userId": newCartData["userId"], "storeId": newCartData["storeId"] }, newCartData);
          }
        } else {
          oldCartData["lastDeviceToken"] = lastDeviceToken;
          await Cart.findOneAndUpdate({ "userId": newCartData["userId"], "storeId": newCartData["storeId"] }, oldCartData);

        }
      } else {
        console.log("==== new cart  =====");
        await Cart.create(newCartData);
      }
    }

    getCartData(req, res, userId, status);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

//  Not using anywhere.
// router.put("/setStatus/", auth, async (req, res, next) => {
//   const { id, status, } = req.body;
//   console.log(id);
//   console.log(status);
//   try {
//     Cart.findOne({ _id: id }, function (err, cart, next) {
//       if (err) {
//         return res.status(400).send({ "success": true, "message": err.message });
//       }
//       cart.status = status;
//       cart.save();
//       return res.status(200).send({ "success": true, "data": cart });
//     });

//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });







const install = app => app.use("/api/v1/cart", router);

module.exports = {
  install
};
