const express = require("express");
const router = express.Router();
const ReferralRewardOffers = require("../model/ReferralRewardOffers");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");


router.get("/getList/", auth, async (req, res, next) => {
  const params = req.query;
  const referredByUserId = req.currentUserId;
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];

  console.log(params);

  try {
    const referralRewardOffers = ReferralRewardOffers.aggregate(
      [
        {
          $match: {
            "referredByUserId": referredByUserId,
          }
        },
        { $set: { referralUserId: { $toObjectId: "$referralUserId" } } },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "app-users",
            localField: 'referralUserId',
            foreignField: '_id',
            as: "user"
          },
        },
        { "$unwind": "$user" },
        {
          $match: {
            $or: [
              { "user.firstName": { "$regex": searchKey, "$options": "i" } },
              { "user.lastName": { "$regex": searchKey, "$options": "i" } },
            ],
          },
        },
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    ReferralRewardOffers.aggregatePaginate(referralRewardOffers, options, function (err, results) {
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


const install = app => app.use("/api/v1/referralRewardOffers", router);

module.exports = {
  install
};
