const express = require("express");
const router = express.Router();
const PushSubscription = require("../model/PushSubscription");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
var formidable = require('formidable');
var fs = require('fs-extra');
const auth = require("../middlewares/auth");



router.post("/add", auth, async (req, res, next) => {
  try {
    var {  fcmToken } = req.body;
    const userId = req.currentUserId;

    var pushSubscription = await PushSubscription.findOne({ userId: userId });
    if (pushSubscription) {
      var isNew = true;
      for (let index = 0; index < pushSubscription.tokens.length; index++) {
        const tokenData = pushSubscription.tokens[index];
        if (fcmToken === tokenData.token) {
          isNew = false;
        }
      }

      if (isNew) {
        pushSubscription.tokens.push(
          {
            "active": true,
            "token": fcmToken,
            "vendor": "FCMTOKEN"
          },
        );
        await PushSubscription.findOneAndUpdate({ userId: userId }, {
          userId: userId,
          tokens: pushSubscription.tokens
        });
      }
      return res.status(200).send({ "success": true });

    } else {
      var newPushSubscription = await PushSubscription.create({
        userId: userId,
        tokens: [
          {
            "active": true,
            "token": fcmToken,
            "vendor": "FCMTOKEN"
          },
        ]
      });

      return res.status(200).send({ "success": true, "data": newPushSubscription });

    }


  } catch (err) {
    console.error(err);
    next(err);
  }
});

const getFCMTokenByStoreUserId = async (userId) => {
  try {
    var pushSubscription = await PushSubscription.findOne({ userId: userId });
    if (pushSubscription) {
      return pushSubscription.tokens;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }

}

//TODO:: not used anywhere
// router.get("/getFCMTokenByStoreUserId/:storeId", async (req, res, next) => {
//   var result = getFCMTokenByStoreUserId(req.params["storeId"]);
//   return res.status(200).send({ "success": true, "data": results });
// });

const install = app => app.use("/api/v1/push_subscription", router);

module.exports = {
  install, getFCMTokenByStoreUserId
};
