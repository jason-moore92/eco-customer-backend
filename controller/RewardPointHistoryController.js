const express = require("express");
const router = express.Router();
const RewardPointHistory = require("../model/RewardPointHistory");
const Order = require("../model/Order");
const User = require("../model/AppUser");
const RewardPoint = require("../model/RewardPoint");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const rewardPointUtils = require("../Utiles/rewardPoints");


//Note:: copied with logic change
router.get("/sumRewardPoints/", auth , async (req, res, next) => {
  const params = req.query;
  const userId = req.currentUserId;
  const storeId = params["storeId"];

  var matchCondition = {};
  var key;
  if (userId !== undefined && userId !== ""){
    matchCondition["userId"] = userId;
    key = "$userId";
  }

  if (storeId !== undefined && storeId !== "") {
    matchCondition["storeId"] = storeId;
    key = "$storeId";
  }

  try {
    const result = await RewardPointHistory.aggregate(
      [
        {
          $match: matchCondition
        },
        {
          $group:
          {
            _id: key,
            sum: { $sum: "$rewardPoints" },
          }
        },
      ]
    );
    
    return res.status(200).send({ "success": true, "data": result });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getRewardPointsByUser", auth, async (req, res, next) => {
  const params = req.query;
  const userId = req.currentUserId;
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];

  var matchCondition = { userId: userId };
  var searchCondition = {};
  if (searchKey !== undefined){
    searchCondition["store.name"] = { "$regex": searchKey, "$options": "i" };
  }

  try {
    const products = RewardPointHistory.aggregate(
      [
        {
          $match: matchCondition
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
        { $sort: { "store.name": -1 } },
        {
          $match: searchCondition
        },
        {
          $set: {
            "history": {
              $reverseArray: "$history"
            }
          }
        },

      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    RewardPointHistory.aggregatePaginate(products, options, function (err, results) {
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

// router.get("/getRewardPointsByStore", async (req, res, next) => {
//   const params = req.query;
//   const storeId = params["storeId"];
//   const page = params["page"];
//   const limit = params["limit"];
//   const searchKey = params["searchKey"];

//   var matchCondition = { storeId: storeId };
//   var searchCondition = { };
//   if (searchKey !== undefined)
//     searchCondition = {
//       $or: [
//         { "user.firstName": { "$regex": searchKey, "$options": "i" } },
//         { "user.lastName": { "$regex": searchKey, "$options": "i" } },
//       ],
//     };
    

//   try {
//     const products = RewardPointHistory.aggregate(
//       [
//         {
//           $match: matchCondition
//         },
//         { $set: { userId: { $toObjectId: "$userId" } } },
//         {
//           $lookup:
//           {
//             from: "app-users",
//             localField: 'userId',
//             foreignField: '_id',
//             as: "user"
//           },
//         },
//         { "$unwind": "$user" },
//         { $sort: { "user.firstName": -1 } },
//         {
//           $match: searchCondition
//         },
//       ]
//     );

//     const options = {
//       page: page,
//       limit: limit
//     };

//     RewardPointHistory.aggregatePaginate(products, options, function (err, results) {
//       if (err) {
//         console.log(err);
//         return next(err);
//       }
//       else {
//         return res.status(200).send({ "success": true, "data": results });
//       }
//     });

//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.post("/redeem", auth, async (req, res, next) => {
  const params = req.body;
  const storeId = params["storeId"];
  const userId = req.currentUserId;
  const id = params["id"];
  const orderId = params["orderId"];
  const sumRewardPoint = params["sumRewardPoint"];
  const redeemRewardPoint = params["redeemRewardPoint"];
  const redeemValue = params["redeemValue"];

  try {

    let tranDetails = {
      title: "Reward Points Redeemed",
      body: "Reward points redeemRewardPoint has been redeemed for the order OrderId with store store_name",
      createAt: Date.now(),
      rewardPoints: redeemRewardPoint,
      type: "Redeemed",
    };

    await rewardPointUtils.transact(tranDetails, userId, storeId);

    var order = await Order.findById(id);

    order["redeemRewardData"]["redeemRewardValue"] = redeemValue;
    order["redeemRewardData"]["redeemRewardPoint"] = redeemRewardPoint;
    
    await Order.findByIdAndUpdate(id, order);

    return res.status(200).send({ "success": true});
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/reward_points", router);

module.exports = {
  install
};
