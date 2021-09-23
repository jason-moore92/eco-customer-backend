const express = require("express");
const router = express.Router();
const ReferralRewardOfferTypeRules = require("../model/ReferralRewardOfferTypeRules");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");


router.get("/get/", async (req, res, next) => {
  try {
    const referralRewardOfferTypeRules = await ReferralRewardOfferTypeRules.find({
      activeReferralOffer: true,
      validityStartDate: { $lt: Date.now() },
      validityEndDate: { $gte: Date.now() },
    });
    console.log(referralRewardOfferTypeRules);

    return res.status(200).send({ "success": true, "data": referralRewardOfferTypeRules });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/referralRewardOfferTypeRules", router);

module.exports = {
  install
};
