const express = require("express");
const router = express.Router();
const RewardPoint = require("../model/RewardPoint");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')

router.get("/getRewardPoint/:storeId", async (req, res, next) => {
  try {
    RewardPoint.findOne({ storeId: req.params.storeId }, (err, data) => {
      if (err) {
        return res.status(500).send({ "success": false, "message": message.apiError});
      }
      console.log();
      return res.status(200).send({ "success": true, "data": data });

    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/rewardPoint", router);

module.exports = {
  install
};
