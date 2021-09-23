const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const AppliedJob = require("../model/AppliedJob");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");
var fcmNotificationHandler = require('../Utiles/fcmNotificationHandler');
var notificationDBHandler = require('../Utiles/notificationDBHandler');

router.post("/add", auth, async (req, res, next) => {
  try {
    var alreayJob = await AppliedJob.findOne({
      "jobId": req.body["jobId"],
      "storeId": req.body["storeId"],
      "userId": req.body["userId"],
    });

    if (alreayJob)
      return res.status(400).send({ "success": false, "message": "already_exist" });

    var appliedJob = await AppliedJob.create(req.body);

     fcmNotificationHandler(
      "job_posting", // notiType
      "applied", // status
      appliedJob["userId"], // userId
      appliedJob["storeId"], // storeId
      {
        id: appliedJob["_id"],
        userId: appliedJob["userId"],
        storeId: appliedJob["storeId"],
      }, // data
     );
    
    notificationDBHandler(
      "job_posting", // notiType
      "applied", // status
      appliedJob["userId"], // userId
      appliedJob["storeId"], // storeId
      {
        id: appliedJob["_id"],
        userId: appliedJob["userId"],
        storeId: appliedJob["storeId"],
      }, 
    );

    return res.status(200).send({ "success": true, "data": appliedJob });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/get", async (req, res, next) => {
  console.log('============ get job detail ===============');
  console.log(req.query.jobId);
  try {
    const jobPosting = await AppliedJob.aggregate([
      {
        $match: {
          "_id": ObjectId(req.query.jobId),
        }
      },
      { $set: { storeId: { $toObjectId: "$storeId" } } },
      { $set: { jobId: { $toObjectId: "$jobId" } } },
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
          from: "store-job-postings",
          localField: 'jobId',
          foreignField: '_id',
          as: "jobPosting"
        },
      },
      { "$unwind": "$jobPosting" },
    ]);

    return res.status(200).send({ "success": true, "data": jobPosting });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/checkApplied", async (req, res, next) => {
  var { jobId, storeId, userId} = req.query;
  try {
    var appliedJob = await AppliedJob.findOne({
      "jobId": jobId,
      "storeId": storeId,
      "userId": userId,
    });

    return res.status(200).send({ "success": true, "data": appliedJob });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getAll", auth, async (req, res, next) => {
  console.log('============ get all ===============');
  var {status, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;


  try {
    const jobPosting = AppliedJob.aggregate([
      {
        $match: {
          "userId": userId,
        }
      },
      { $set: { storeId: { $toObjectId: "$storeId" } } },
      { $set: { jobId: { $toObjectId: "$jobId" } } },
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
          from: "store-job-postings",
          localField: 'jobId',
          foreignField: '_id',
          as: "jobPosting"
        },
      },
      { "$unwind": "$jobPosting" },
      // {
      //   "$addFields": {
      //     "jobTitle": "$jobPosting.jobTitle"
      //   }
      // },
      {
        $match: { "jobPosting.jobTitle": { "$regex": searchKey, "$options": "i" } },
      }
    ]);

    const options = {
      page: page,
      limit: limit
    };

    AppliedJob.aggregatePaginate(jobPosting, options, function (err, results) {
      if (err) {
        next(err)
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


const install = app => app.use("/api/v1/applied_jobs", router);

module.exports = {
  install,
};
