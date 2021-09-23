const express = require("express");
const router = express.Router();
const Announcements = require("../model/announcement");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
var ObjectId = require('mongoose').Types.ObjectId;

router.post("/getAnnouncements", async (req, res, next) => {
  const params = req.body;
  const storeId = params["storeId"];
  const city = params["city"];
  const category = params["category"];
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];

  console.log(params);

  var matchCondition = {};
  if (storeId !== undefined && !isNull(storeId)) { 
    matchCondition["storeId"] = storeId;
  }
  matchCondition["datetobeposted"] = { $lte: new Date() };
  matchCondition["announcementto"] = "CUSTOMERS_ONLY";
  matchCondition["active"] = true;

  if (searchKey !== undefined)
    matchCondition["title"] = { "$regex": searchKey, "$options": "i" };

  var cityCondition = [
    {
      "city": { $ne: "" }
    },
  ];

  if (city !== undefined && !isNull(city)) {
    cityCondition = [];
    cityCondition.push(
      {
        "city": "ALL"
      },
      {
        "city": city,
      },
    );
  }

  var categoryCondition = {
    "store.name": { $ne: "" }
  }

  if (category !== undefined && !isNull(category)) {
    categoryCondition = {
      "store.subType": category
    };
  }

  console.log(matchCondition);
  console.log(categoryCondition);

  console.log(cityCondition);

  try {
    const announcements = Announcements.aggregate(
      [
        {
          $match: matchCondition
        },
        {
          $match: {
            $or: cityCondition,
          },
        },
        { $set: { couponId: { $toObjectId: "$couponId" } } },
        { $set: { storeId: { $toObjectId: "$storeId" } } },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "coupons",
            localField: 'couponId',
            foreignField: '_id',
            as: "coupon"
          },
        },
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
          $match: categoryCondition
        }
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    Announcements.aggregatePaginate(announcements, options, function (err, results) {
      if (err) {
        console.log(err);
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

router.get("/get", auth, async (req, res, next) => {
  const params = req.query;
  const announcementId = params["announcementId"];
  try {
    const announcement = await Announcements.findById(announcementId);
    return res.status(200).send({ "success": true, "data": announcement });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getCategories", auth, async (req, res, next) => {
  var matchCondition = {};
  matchCondition["datetobeposted"] = { $lte: new Date() };
  matchCondition["announcementto"] = "CUSTOMERS_ONLY";
  matchCondition["active"] = true;

  try {
    const announcements = await Announcements.aggregate(
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
        {
          $group:
          {
            _id: "$store.subType",
            storeCount: { $sum: 1 }
          }
        },
        {
          $lookup:
          {
            from: 'categories',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'category'
          }
        },
        { "$unwind": "$category" },
        { $sort: { "category.categoryDesc": 1 } },
      ]
    );

    return res.status(200).send({ "success": true, "data": announcements });


  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getWithStore", auth, async (req, res, next) => {
  try {
    const announcements = await Announcements.aggregate([
      {
        $match: {
          "_id": ObjectId(req.query.announcementId),
        }
      },
      { $set: { storeId: { $toObjectId: "$storeId" } } },
      { $set: { couponId: { $toObjectId: "$couponId" } } },
      {
        $lookup:
        {
          from: "coupons",
          localField: 'couponId',
          foreignField: '_id',
          as: "coupon"
        },
      },
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
    return res.status(200).send({ "success": true, "data": announcements });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/announcements", router);

module.exports = {
  install
};
