const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const BargainRequest = require("../model/BargainRequest");
const Store = require("../model/Store");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
var { addNotification } = require('./NotificationController');
var { sendMessageToDevice, sendMessageToTopic } = require('../Utiles/sendPushNotification')
var exotelApi = require('../middlewares/exotel_api')
var fcmNotificationHandler = require('../Utiles/fcmNotificationHandler');
var notificationDBHandler = require('../Utiles/notificationDBHandler');

router.post("/add/", auth, async (req, res, next) => {
  let params = req.body;
  if(!params.storeId){
    return res.status(422).send({message: "StoreId is required."});
  }
  const userId = req.currentUserId;
  params.userId = userId;
  try {
    var bargainRequest = await BargainRequest.create(params);


    await fcmNotificationHandler(
      "bargain", // notiType
      "requested", // status
      bargainRequest["userId"], // userId
      bargainRequest["storeId"], // storeId
      {
        id: bargainRequest["_id"],
        bargainRequestId: bargainRequest["bargainRequestId"],
      }, // data
    );

    await notificationDBHandler(
      "bargain", // notiType
      "requested", // status
      bargainRequest["userId"], // userId
      bargainRequest["storeId"], // storeId
      {
        id: bargainRequest["_id"],
        bargainRequestId: bargainRequest["bargainRequestId"],
      }, // data
    );

    let storeData = await Store.findById(bargainRequest.storeId);

    if (storeData.mobile) {
      await exotelApi("create_bargain_request", storeData.mobile, true);
    }

    return res.status(200).send({ "success": true, "data": bargainRequest });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getBargainRequestData/", auth, async (req, res, next) => {
  const { storeId, status, searchKey, page, limit } = req.query;

  const userId = req.currentUserId;

  var match = {};
  if (storeId !== "" && storeId !== undefined) {
    match["storeId"] = storeId;
  }

  if (userId !== "" && userId !== undefined) {
    match["userId"] = userId;
  }

  if (status !== "all") {
    match["status"] = status;
  }

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $set: { userId: { $toObjectId: "$userId" } } },
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
  ];

  try {
    if (userId === "" || userId === undefined) {
      pipeline.push({
        $lookup:
        {
          from: "app-users",
          localField: 'userId',
          foreignField: '_id',
          as: "user"
        },
      });
      pipeline.push({ "$unwind": "$user" });
    }

    pipeline.push({
      $match: {
        $or: [
          { "store.name": { "$regex": searchKey, "$options": "i" } },
          { "store.mobile": { "$regex": searchKey, "$options": "i" } },
          { "user.firstName": { "$regex": searchKey, "$options": "i" } },
          { "user.lastName": { "$regex": searchKey, "$options": "i" } },
          { "user.mobile": { "$regex": searchKey, "$options": "i" } },
          { "bargainRequestId": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    });

    const bargainRequests = BargainRequest.aggregate(
      pipeline
    );

    const options = {
      page: page,
      limit: limit
    };

    BargainRequest.aggregatePaginate(bargainRequests, options, function (err, results) {
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
 * Using for counteroffer, cancel etc
 * TODO:: need to whitelist the status updated by customer.
 */
router.post("/update/", auth, async (req, res, next) => {
  try {
    const { bargainRequestData, status, subStatus, toWhome } = req.body;
    const userId = req.currentUserId;

    if (status !== "customer_new_message" && status !== "store_new_message" && status !== "quantity_updated") {
      bargainRequestData["status"] = status;
      bargainRequestData["subStatus"] = subStatus;
    }
    bargainRequestData["updatedAt"] = Date.now();

    BargainRequest.findOneAndUpdate({
      "userId": userId,
      "_id": bargainRequestData["_id"]
    }, bargainRequestData, { new: true }, async (err, doc, any) => {
      if (err) {
        next(err);
        return;
      }

      var notificationStatus;

      if (status === "requested" && subStatus === "user_counter_offer") {
        notificationStatus = "user_counter_offer";
      } else {
        notificationStatus = status;
      }

      await fcmNotificationHandler(
        "bargain", // notiType
        notificationStatus, // status
        bargainRequestData["userId"], // userId
        bargainRequestData["storeId"], // storeId
        {
          id: bargainRequestData["_id"],
          bargainRequestId: bargainRequestData["bargainRequestId"],
        }, // data
      );

      await notificationDBHandler(
        "bargain", // notiType
        notificationStatus, // status
        bargainRequestData["userId"], // userId
        bargainRequestData["storeId"], // storeId
        {
          id: bargainRequestData["_id"],
          bargainRequestId: bargainRequestData["bargainRequestId"],
        }, // data
      );


      return res.send({ "success": true });

    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/get/", auth, async (req, res, next) => {
  const { storeId, bargainRequestId } = req.query;
  const userId = req.currentUserId;

  var match = {};
  match["storeId"] = storeId;
  match["userId"] = userId;
  match["bargainRequestId"] = bargainRequestId;

  const pipeline = [
    {
      $match: match
    },
    { $set: { storeId: { $toObjectId: "$storeId" } } },
    { $set: { userId: { $toObjectId: "$userId" } } },
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
      $lookup:
      {
        from: "app-users",
        localField: 'userId',
        foreignField: '_id',
        as: "user"
      },
    },
    { "$unwind": "$user" }
  ];

  try {
    const bargainRequests = await BargainRequest.aggregate(
      pipeline
    );
    return res.status(200).send({ "success": true, "data": bargainRequests });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getTotalBargainByStore", async (req, res, next) => {
//   const { storeId } = req.query;

//   var match = {};
//   match["storeId"] = storeId;

//   const pipeline = [
//     {
//       $match: match
//     },
//     {
//       $group: {
//         _id: "$storeId",
//         totalCount: { $sum: 1 },
//       }
//     }
//   ];

//   try {
//     const bargainRequests = await BargainRequest.aggregate(
//       pipeline
//     );
//     return res.status(200).send({ "success": true, "data": bargainRequests });

//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// });

router.get("/getTotalBargainByUser", auth, async (req, res, next) => {
  const { userId } = req.currentUserId;

  var match = {};
  match["userId"] = userId;

  const pipeline = [
    {
      $match: match
    },
    {
      $group: {
        _id: "$userId",
        totalCount: { $sum: 1 },
      }
    }
  ];

  try {
    const bargainRequests = await BargainRequest.aggregate(
      pipeline
    );
    return res.status(200).send({ "success": true, "data": bargainRequests });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/bargain_request", router);

module.exports = {
  install
};
