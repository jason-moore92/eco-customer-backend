const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const StoreJobPosting = require("../model/StoreJobPosting");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull, stubFalse } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const Store = require("../model/Store");
const AppliedJob = require("../model/AppliedJob");

router.get("/getAll", async (req, res, next) => {
  console.log('============ get all ===============');
  var { storeId, userId, latitude, longitude, distance ,status, searchKey, page, limit } = req.query;
  console.log(userId);

  var pipeline = [];

  if (!isNull(latitude) && latitude !== undefined && latitude !== "null" && !isNull(longitude) && longitude !== undefined && longitude !== "null") { 
    pipeline.push(
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: "distance",
          key: 'location',
          maxDistance: parseInt(distance.toString()) * 1000,
          // includeLocs: "dist.location",
          spherical: true,
        }
      },
    );
    pipeline.push({ $sort: { "distance": 1 } },);
  }

  var mathch = {
    "status": "open",
    "listonline": true,
  };
  
  if (!isNull(storeId) && storeId !== "" && storeId !== undefined) { 
    mathch["storeId"] = storeId;
  }

  pipeline.push({
    $match: mathch
  });

  pipeline.push({ $sort: { updatedAt: -1 } },);
  pipeline.push({
    $match: {
      $or: [
        { "jobTitle": { "$regex": searchKey, "$options": "i" } },
      ],
    },
  });
  pipeline.push({ $set: { storeId: { $toObjectId: "$storeId" } } });
  pipeline.push({
    $lookup:
    {
      from: "stores",
      localField: 'storeId',
      foreignField: '_id',
      as: "store"
    },
  });
  pipeline.push({ "$unwind": "$store" });

  try {
    const jobPosting = StoreJobPosting.aggregate(pipeline);

    const options = {
      page: page,
      limit: limit
    };

    StoreJobPosting.aggregatePaginate(jobPosting, options, async function (err, results) {
      if (err) {
        next(err)
      }
      else {
        for (let index = 0; index < results["docs"].length; index++) {
          var jobData = results["docs"][index];
          var appliedJob = await AppliedJob.findOne({
            "jobId": jobData["_id"],
            "storeId": jobData["storeId"],
            "userId": userId,
          });
          results["docs"][index]["appliedJob"] = appliedJob;
        }
        return res.status(200).send({ "success": true, "data": results });
      }
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


router.get("/get", auth, async (req, res, next) => {
  try {
    const jobPosting = await StoreJobPosting.aggregate([
        {
          $match: {
            "_id": ObjectId(req.query.jobId),
            "storeId": req.query.storeId,
          }
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
      ]
    );
    return res.status(200).send({ "success": true, "data": jobPosting });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/store_job_posings", router);

module.exports = {
  install,
};
