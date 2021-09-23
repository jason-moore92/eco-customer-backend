const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const Promocode = require("../model/Promocode");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");

router.get("/getPromocodeData/:category", auth, async (req, res, next) => {
  const category = req.params.category
  try {
    Promocode.find(
      { 
        $and: [
          { activepromocode: true },
          { $or: [{ "categoriesAppliedFor.category": category }, { "categoriesAppliedFor.category": "ALL" }] },
          {
            validityStartDate: {
              $lt: Date.now(),
            }
          },
          {
            validityEndDate: {
              $gte: Date.now(),
            }
          },
          {
            $or: [
              { "userIds": { $eq: null } },
              { "userIds": { $eq: [] } },
              { "userIds": { $elemMatch: { $eq: req.currentUserId} } }
            ]
          }
        ]
       },
      function (err, result) {
        if (err) {
            console.log(err);
          return res.status(500).send({ "success": false, "data": message.apiError });
        } else {
          return res.status(200).send({ "success": true, "data": result });
        }
      }
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/promocode", router);

module.exports = {
  install
};
