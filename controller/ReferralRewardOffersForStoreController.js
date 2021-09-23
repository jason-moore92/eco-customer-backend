const express = require("express");
const router = express.Router();
const ReferralRewardOffersForStore = require("../model/ReferralRewardOffersForStore");
const ReferralRewardOfferTypeRules = require("../model/ReferralRewardOfferTypeRules");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
var { referralRewardOffersConfirmForStoreHandler } = require('../Utiles/referralRewardOffersConfirmHandler');

/**
 * Used when customer adding the form details (not link)
 */
router.post("/add/", auth, async (req, res, next) => {
  let user = await User.findById(req.currentUserId);

  const params = req.body;
  const referredByUserId = req.currentUserId;
  const storeId = params["storeId"];
  const referredBy = user.referralCode; 
  const appliedFor = params["appliedFor"];
  const storeName = params["storeName"];
  const storeMobile = params["storeMobile"];
  const storeAddress = params["storeAddress"];

  try {
    var referralRewardOfferTypeRules = await ReferralRewardOfferTypeRules.findOne({
      activeReferralOffer: true,
      validityStartDate: { $lt: Date.now() },
      validityEndDate: { $gte: Date.now() },
      appliedFor: appliedFor,
    });

    if (referralRewardOfferTypeRules) {
      var referralRewardOffersForStore = await ReferralRewardOffersForStore.create({
        referredByUserId: referredByUserId,
        referredBy: referredBy,
        storeId: storeId,
        storeName: storeName,
        storeMobile: storeMobile,
        storeAddress: storeAddress,
        status: "pending",
        rulesId: referralRewardOfferTypeRules["_id"],
        referralOfferType: referralRewardOfferTypeRules.referralOfferType,
        appliedFor: appliedFor,
        referredByUserRewardPoints: referralRewardOfferTypeRules["referredByUserRewardPoints"],
        referralUserRewardPoints: referralRewardOfferTypeRules["referralUserRewardPoints"],
        referredByUserAmount: referralRewardOfferTypeRules["referredByUserAmount"],
        referralUserAmount: referralRewardOfferTypeRules["referralUserAmount"],
        minimumFirstOrder: referralRewardOfferTypeRules["minimumFirstOrder"],
        maximumorder: referralRewardOfferTypeRules["maximumorder"],
        isReferralUserRegistred: false,
        isReferralLoggedIn: false,
        isReferralMadeFirstOrder: false,
      });
      if (referralRewardOffersForStore) {
        return res.status(200).send({ "success": true, "data": referralRewardOffersForStore });
      } else {
        return res.status(500).send({ "success": false, "message": "Something was wrong" });
      }
    }
    
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/get/", auth, async (req, res, next) => {
  const params = req.query;
  const storeName = params["storeName"];
  const storeMobile = params["storeMobile"];

  const match = {
    referredByUserId: req.currentUserId
  };

  if (!isNull(storeName) && storeName !== undefined) { 
    match["storeName"] = storeName;
  }
  if (!isNull(storeMobile) && storeMobile !== undefined) {
    match["storeMobile"] = storeMobile;
  }

  try {
    var referralRewardOffersForStore = await ReferralRewardOffersForStore.findOne(match);
      if (referralRewardOffersForStore) {
        return res.status(200).send({ "success": true, "data": referralRewardOffersForStore });
      } else {
        return res.status(200).send({ "success": true });
      }

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.post("/update/", auth, async (req, res, next) => {
//   const params = req.body;
//   //TODO:: check req.currentUserId with model.referredByUserId

//   console.log("======== referral store update ==========");
//   console.log(params["_id"]);
//   console.log(params["storeId"]);
//   console.log(params["currentReferralOfferType"]);
//   console.log(params["referredBy"]);

//   var result = await referralRewardOffersConfirmForStoreHandler(
//     params["_id"],
//     params["storeId"],
//     params["currentReferralOfferType"],
//     params["referredBy"]
//   );

//   console.log("===============result=======================");
//   console.log(result);

//   if (result) { 
//     return res.status(200).send({ "success": true});
//   } { 
//     return res.status(500).send({ "success": false });

//   }

// });

router.get("/getList/", auth, async (req, res, next) => {
  const params = req.query;
  const referredByUserId =req.currentUserId;
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];

  console.log(params);

  try {
    const referralRewardOffersForStore = ReferralRewardOffersForStore.aggregate(
      [
        {
          $match: {
            "referredByUserId": referredByUserId,
          }
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
        {
          $match: {
            $or: [
              { "store.name": { "$regex": searchKey, "$options": "i" } },
            ],
          },
        },
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    ReferralRewardOffersForStore.aggregatePaginate(referralRewardOffersForStore, options, function (err, results) {
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

const install = app => app.use("/api/v1/referralRewardOffersForStore", router);

module.exports = {
  install
};
