const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const DeliveryAddress = require("../model/DeliveryAddress");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");

router.post("/add/", auth, async (req, res, next) => {
  let params = req.body;
  try {
    const userId = req.currentUserId;
    params.userId = userId;

    const deliveryAddress = await DeliveryAddress.create(req.body);
    return res.status(200).send({ "success": true, "data": deliveryAddress });
  } catch (err) {
    return next(err);
  }
});

router.put("/update/:id", auth, async (req, res, next) => {
  try {
    let params = req.body;
    const userId = req.currentUserId;
    params.userId = userId;

    DeliveryAddress.findOneAndUpdate({ _id: req.params.id, userId: userId },params, { new: true } , function (err, data) {
      if(err){
        res.status(500).send({ "success": false, "message": message.apiError });
      }
      return res.status(200).send({ "success": true, "data": data });

    });
  } catch (err) {
    return next(err);
  }
});



router.get("/getDeliveryAddressData",auth, async (req, res, next) => {
  const userId = req.currentUserId;
  try {
    const deliveryAddress = await DeliveryAddress.find({ userId: userId });
    return res.status(200).send({ "success": true, "data": deliveryAddress });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/deliveryAddress", router);

module.exports = {
  install
};
