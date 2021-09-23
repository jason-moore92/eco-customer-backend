const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const ReverseAuction = require("../model/ReverseAuction");
const ReverseAuctionStoreID = require("../model/ReverseAuctionStoreID");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");
var { addNotification } = require('./NotificationController');
var { sendMessageToDevice, sendMessageToTopic } = require('../Utiles/sendPushNotification')
var exotelApi = require('../middlewares/exotel_api')
var fcmNotificationHandler = require('../Utiles/fcmNotificationHandler');
var notificationDBHandler = require('../Utiles/notificationDBHandler');

router.post("/add/", auth, async (req, res, next) => {
  let params = req.body;
  const userId = req.currentUserId;
  params.userId = userId;
  try {
    var reverseAuction = await ReverseAuction.create(params);
    for (let i = 0; i < params["storeIds"].length; i++) {
      await ReverseAuctionStoreID.create({
        "reverseAuctionId": reverseAuction["_id"],
        "storeId": params["storeIds"][i],
        "storeOffer": "",
      });

      await fcmNotificationHandler(
        "reverse_auction", // notiType
        "requested", // status
        reverseAuction["userId"], // userId
        params["storeIds"][i], // storeId
        { 
          id: reverseAuction["_id"],
          reverseAuctionId: reverseAuction["reverseAuctionId"],
        }, // data
      ) ;

      await notificationDBHandler(
        "reverse_auction", // notiType
        "requested", // status
        reverseAuction["userId"], // userId
        params["storeIds"][i], // storeId
        {
          id: reverseAuction["_id"],
          reverseAuctionId: reverseAuction["reverseAuctionId"],
        }, // data
      );
    }

    // for (let index = 0; index < params["storePhoneNumbers"].length; index++) {
    //   const storePhoneNumber = params["storePhoneNumbers"][index];

    //   await exotelApi("create_reverse_auction", storePhoneNumber, true);

    // }

    return res.status(200).send({ "success": true, "data": reverseAuction });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.post("/enableReverseAuction/", async (req, res, next) => {
//   const { id, isEnabled, sendNotificationToStore } = req.body;

//   try {
//     var reverseAuction = await ReverseAuction.findByIdAndUpdate(id, { isEnabled: isEnabled });
//     if (sendNotificationToStore === true) {
//       var storeIds = Object.keys(reverseAuction["storeBiddingPriceList"]);
      
//       for (let i = 0; i < storeIds.length; i++) {
      
//         fcmNotificationHandler(
//           "reverse_auction", // notiType
//           "requested", // status
//           reverseAuction["userId"], // userId
//           storeIds[i], // storeId
//           {
//             id: reverseAuction["_id"],
//             reverseAuctionId: reverseAuction["reverseAuctionId"],
//           }, // data
//         );

//         notificationDBHandler(
//           "reverse_auction", // notiType
//           "requested", // status
//           reverseAuction["userId"], // userId
//           storeIds[i], // storeId
//           {
//             id: reverseAuction["_id"],
//             reverseAuctionId: reverseAuction["reverseAuctionId"],
//           }, // data
//         );
//       }
//     }

//     return res.status(200).send({ "success": true, "data": reverseAuction });
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });


router.get("/getAuctionStoreData/", auth, async (req, res, next) => {
  const { reverseAuctionId, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;

  let reverseAuction = ReverseAuction.findOne({
    userId: userId,
    "_id": reverseAuctionId
  });

  if(!reverseAuction){
    return res.status(422).send({message: "Entity not belongs to you"});
  }


  const storeIdList = req.query["storeIdList"].split(',');

  var match = {
    "reverseAuctionId": reverseAuctionId,
    "storeId": { $in: storeIdList },
  };

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $sort: { "offerPrice": 1 } },
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
  ];

  try {
    const reverseAuctions = ReverseAuctionStoreID.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    ReverseAuctionStoreID.aggregatePaginate(reverseAuctions, options, function (err, results) {
      if (err) {
        console.log(err);
        return next(err);
      }
      else {
      console.log(results)

        return res.status(200).send({ "success": true, "data": results });
      }
    });


  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getReverseAuctionDataByStore/", async (req, res, next) => {
//   const { storeId, userId, status, searchKey, page, limit } = req.query;

//   var match = {};
//   if (storeId !== "" && storeId !== undefined) {
//     match["storeId"] = storeId;
//   }

//   if (userId !== "" && userId !== undefined) {
//     match["reverse_auction.userId"] = userId;
//   }

//   if (status !== "all" && status !== "past") {
//     match["reverse_auction.status"] = status;
//   }
//   if (status === "past") {
//     match["reverse_auction.biddingEndDateTime"] = { $lt: new Date() };
//   } else if (status !== "all" && status !== "past") {
//     match["reverse_auction.biddingEndDateTime"] = { $gte: new Date() };
//   }

//   const pipeline = [
//     { $set: { reverseAuctionId: { $toObjectId: "$reverseAuctionId" } } },
//     {
//       $lookup:
//       {
//         from: "reverse_auction_bids",
//         localField: 'reverseAuctionId',
//         foreignField: '_id',
//         as: "reverse_auction"
//       },
//     },
//     { "$unwind": "$reverse_auction" },
//     {
//       $match: match
//     },
//     { $set: { "userId": { $toObjectId: "$reverse_auction.userId" } } },
//     {
//       $lookup:
//       {
//         from: "app-users",
//         localField: 'userId',
//         foreignField: '_id',
//         as: "user"
//       },
//     },
//     { "$unwind": "$user" },
//     {
//       $match: {
//         $or: [
//           { "user.firstName": { "$regex": searchKey, "$options": "i" } },
//           { "user.lastName": { "$regex": searchKey, "$options": "i" } },
//           { "user.mobile": { "$regex": searchKey, "$options": "i" } },
//           { "reverse_auction.reverseAuctionId": { "$regex": searchKey, "$options": "i" } },
//         ],
//       },
//     },
//     { $sort: { "reverse_auction.updatedAt": -1 } }
//   ];

//   try {


//     const reverseAuctions = ReverseAuctionStoreID.aggregate(
//       pipeline
//     );

//     const options = {
//       page: page,
//       limit: limit
//     };

//     ReverseAuctionStoreID.aggregatePaginate(reverseAuctions, options, function (err, results) {
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

router.get("/getReverseAuctionDataByUser/", auth, async (req, res, next) => {
  const {  status, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;

  var match = {};
  match["userId"] = userId;

  if (status !== "all" && status !== "past") {
    match["status"] = status;
  }
  if (status === "past") {
    match["biddingEndDateTime"] = { $lt: new Date() };
  } else if (status !== "all" && status !== "past") {
    match["biddingEndDateTime"] = { $gte: new Date() };
  }

  const pipeline = [
    {
      $match: match
    },
    { $sort: { updatedAt: -1 } },

  ];

  try {

    pipeline.push({
      $match: {
        $or: [
          { "store.name": { "$regex": searchKey, "$options": "i" } },
          { "store.mobile": { "$regex": searchKey, "$options": "i" } },
          { "reverseAuctionId": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    });

    const reverseAuctions = ReverseAuction.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    ReverseAuction.aggregatePaginate(reverseAuctions, options, function (err, results) {
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

/**
 * TODO:: whitelist the status changes
 */
router.post("/update/", auth, async (req, res, next) => {
  try {
    const { reverseAuctionData, storeOfferData, status, storeName, userName } = req.body;
    const userId = req.currentUserId;
    reverseAuctionData.userId = userId;

    if (status !== "change_end_date") {
      reverseAuctionData["status"] = status;
    }
    reverseAuctionData["updatedAt"] = Date.now();

    ReverseAuction.findByIdAndUpdate({
      userId: userId, 
      "_id": reverseAuctionData["_id"]
    }, reverseAuctionData, { new: true } , async (err, doc, any) => {
      if (err) {
        next(err);
        return;
      }

      if (status === "store_offer") {
        var reverseAuctionStoreID = await ReverseAuctionStoreID.findOne({ reverseAuctionId: reverseAuctionData["_id"], storeId: storeOfferData["storeId"] });

        if (isNull(reverseAuctionStoreID["history"]) || reverseAuctionStoreID["history"] === undefined) {
          reverseAuctionStoreID["history"] = [];
        }

        reverseAuctionStoreID["history"].push({
          "offerPrice": storeOfferData["offerPrice"],
          "message": storeOfferData["message"],
          "historyMessage": "historyMessage",
          "updateDate": Date.now(),
        });

        await ReverseAuctionStoreID.findByIdAndUpdate(
          reverseAuctionStoreID["_id"],
          {
            "offerPrice": storeOfferData["offerPrice"],
            "message": storeOfferData["message"],
            history: reverseAuctionStoreID["history"],
          }
        );
      }

        if (reverseAuctionData["storeBiddingPriceList"] !== undefined && !isNull(reverseAuctionData["storeBiddingPriceList"])){
          var storeIds = Object.keys(reverseAuctionData["storeBiddingPriceList"]);
          for (let i = 0; i < storeIds.length; i++) {
            var notificationStatus;
            notificationStatus = status;

            if (status == "accepted" && reverseAuctionData["acceptedStoreId"] === storeIds[i] ){
              notificationStatus = "accepted";
            } else if (status == "accepted" && reverseAuctionData["acceptedStoreId"] !== storeIds[i]) {
              notificationStatus = "rejected";
            }
            await fcmNotificationHandler(
              "reverse_auction", // notiType
              notificationStatus, // status
              reverseAuctionData["userId"], // userId
              storeIds[i], // storeId
              {
                id: reverseAuctionData["_id"],
                reverseAuctionId: reverseAuctionData["reverseAuctionId"],
              }, // data
            );
            await notificationDBHandler(
              "reverse_auction", // notiType
              notificationStatus, // status
              reverseAuctionData["userId"], // userId
              storeIds[i], // storeId
              {
                id: reverseAuctionData["_id"],
                reverseAuctionId: reverseAuctionData["reverseAuctionId"],
              }, // data
            );
          }
        }
     
      return res.send({ "success": true });

    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/get/", auth, async (req, res, next) => {
  var { storeId, reverseAuctionId } = req.query;
  const userId = req.currentUserId;
  var match = {};
  match["reverse_auction.userId"] = userId;
  match["reverse_auction.reverseAuctionId"] = reverseAuctionId;
  const pipeline = [
    {
      $match: { "storeId": storeId }
    },
    { $set: { "reverseAuctionId": { $toObjectId: "$reverseAuctionId" } } },
    {
      $lookup:
      {
        from: "reverse_auction_bids",
        localField: 'reverseAuctionId',
        foreignField: '_id',
        as: "reverse_auction"
      },
    },
    { "$unwind": "$reverse_auction" },
    {
      $match: match
    },
    { $set: { "userId": { $toObjectId: "$reverse_auction.userId" } } },
    {
      $lookup:
      {
        from: "app-users",
        localField: 'userId',
        foreignField: '_id',
        as: "user"
      },
    },
    { "$unwind": "$user" },
  ];

  try {

    const reverseAuctions = await ReverseAuctionStoreID.aggregate(
      pipeline
    );
    return res.status(200).send({ "success": true, "data": reverseAuctions });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getTotalReverseAuctionByStore", async (req, res, next) => {
//   var { storeId } = req.query;

//   const pipeline = [
//     {
//       $match: { 
//         "storeId": storeId,
//         "offerPrice": {
//           "$exists": true,
//           "$ne": null
//         }
//       },
//     },
//     {
//       "$group": {
//         "_id": {
//           "storeId": "$storeId",
//           "reverseAuctionId": "$reverseAuctionId"
//         },
//         totalCount: { $sum: 1 },
//       },
//     },
//   ];

//   try {
//     const reverseAuctions = await ReverseAuctionStoreID.aggregate(
//       pipeline
//     );
//     return res.status(200).send({ "success": true, "data": reverseAuctions });
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.get("/getTotalReverseAuctionByUser", auth, async (req, res, next) => {
  const userId = req.currentUserId;

  const pipeline = [
    {
      $match: {
        "userId": userId,
        "storeBiddingPriceList": {
          "$exists": true,
          "$ne": null
        }
      },
    },
    {
      "$group": {
        "_id": {
          "userId": "$userId",
        },
        totalCount: { $sum: 1 },
      },
    },
  ];

  try {
    const reverseAuctions = await ReverseAuction.aggregate(
      pipeline
    );
    return res.status(200).send({ "success": true, "data": reverseAuctions });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/reverse_auction", router);

module.exports = {
  install
};
