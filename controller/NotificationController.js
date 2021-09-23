const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const Notification = require("../model/Notification");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");
const DeliveryUser = require("../model/DeliveryUser");

router.get("/getNotificationData", auth, async (req, res, next) => {
  var {  status, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;
  try {
    const orders = Notification.aggregate(
      [
        {
          $match: {
            userId: userId,
            // status: status,
          }
        },
        { $set: { id: { $toObjectId: "$data.storeId" } } },
        // { $set: { deliveryUserId: { $toObjectId: "$data.deliveryUserId" } } },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "stores",
            localField: 'id',
            foreignField: '_id',
            as: "store"
          },
        },
        { "$unwind": "$store" },
        // {
        //   $lookup:
        //   {
        //     from: "delivery-users",
        //     localField: 'deliveryUserId',
        //     foreignField: '_id',
        //     as: "deliveryUser"
        //   },
        // },
        // { "$unwind": "$deliveryUser" },
        {
          $match: {
            $or: [
              { "store.name": { "$regex": searchKey, "$options": "i" } },
              { "body": { "$regex": searchKey, "$options": "i" } },
              { "title": { "$regex": searchKey, "$options": "i" } },
            ],
          },
        },
        {
          "$addFields": {
            "storeName": '$store.name'
          }
        },
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    Notification.aggregatePaginate(orders, options, async function (err, results) {
      if (err) {
        console.log(err);
        return next(err);
      }
      else {

        for (let index = 0; index < results["docs"].length; index++) {
          const notificationData = results["docs"][index];
          if (!isNull(notificationData["data"]["deliveryUserId"]) && notificationData["data"]["deliveryUserId"] !== undefined) {
            var deliveryUser = await DeliveryUser.findById(notificationData["data"]["deliveryUserId"]);
            results["docs"][index]["deliveryUser"] = deliveryUser;
          }
        }
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// router.get("/getNotificationDataForStore", async (req, res, next) => {
//   var { storeId, status, searchKey, page, limit } = req.query;

//   try {
//     const orders = Notification.aggregate(
//       [
//         {
//           $match: {
//             storeId: storeId,
//             // status: status,
//           }
//         },
//         { $set: { id: { $toObjectId: "$data.userId" } } },
//         { $sort: { updatedAt: -1 } },
//         {
//           $lookup:
//           {
//             from: "app-users",
//             localField: 'id',
//             foreignField: '_id',
//             as: "user"
//           },
//         },
//         { "$unwind": "$user" },
//         {
//           $match: {
//             $or: [
//               { "user.firstName": { "$regex": searchKey, "$options": "i" } },
//               { "user.lastName": { "$regex": searchKey, "$options": "i" } },
//               { "body": { "$regex": searchKey, "$options": "i" } },
//               { "title": { "$regex": searchKey, "$options": "i" } },
//             ],
//           },
//         },
//       ]
//     );

//     const options = {
//       page: page,
//       limit: limit
//     };

//     Notification.aggregatePaginate(orders, options, function (err, results) {
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


const addNotification = async (userId, storeId, type, data, title, body) => {
  try {
    var notification = await Notification.create({
      userId: userId,
      storeId: storeId,
      type: type,
      data: data,
      title: title,
      body: body,
    });
    return true;
  } catch (error) {
    console.log("___________________ notification error ____________________________");
    console.log(error);
    return false;

  }
}


const install = app => app.use("/api/v1/notification", router);

module.exports = {
  install,
  addNotification
};
