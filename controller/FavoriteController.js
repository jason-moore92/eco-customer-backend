const express = require("express");
const router = express.Router();
const Favorite = require("../model/Favorite");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");


router.get("/get/", auth, async (req, res, next) => {
  try {
    // const favorite = await Favorite.find({ userId: req.currentUserId });
    console.log("=========get favorite============");
    console.log(req.currentUserId);
    const favorites = await Favorite.aggregate(
      [
        {
          $match: {
            userId: req.currentUserId,
          }
        },
        { $set: { id: { $toObjectId: "$id" } } },
        {
          $lookup:
          {
            from: "products",
            localField: 'id',
            foreignField: '_id',
            as: "products"
          },
        },
        {
          $lookup:
          {
            from: "services",
            localField: 'id',
            foreignField: '_id',
            as: "services"
          },
        },
        {
          $lookup:
          {
            from: "stores",
            localField: 'id',
            foreignField: '_id',
            as: "stores"
          },
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
      ]
    );
    return res.status(200).send({ "success": true, "data": favorites });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getFavoriteData/",auth, async (req, res, next) => {
  const { category, searchKey, page, limit } = req.query;
  const userId = req.currentUserId;

  console.log(req.query);


  const pipeline = [
    {
      $match: {
        userId: req.currentUserId,
        category: category,
      }
    },
    { $set: { id: { $toObjectId: "$id" } } },
    { $sort: { createdAt: -1 } },
    {
      $lookup:
      {
        from: category,
        localField: 'id',
        foreignField: '_id',
        as: "data"
      },
    },
    { "$unwind": "$data" },
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
      $match: {
        $or: [
          { "data.name": { "$regex": searchKey, "$options": "i" } },
          { "data.title": { "$regex": searchKey, "$options": "i" } },
          { "data.jobTitle": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    },
  ];

  if (category === "announcements") { 
    pipeline.push(
      { $set: { couponId: { $toObjectId: "$data.couponId" } } },
    );
    pipeline.push(
      {
        $lookup:
        {
          from: "coupons",
          localField: 'couponId',
          foreignField: '_id',
          as: "coupon"
        },
      },
    );
  }

  try {
    const favorites = Favorite.aggregate( pipeline );


    const options = {
      page: page,
      limit: limit
    };

    Favorite.aggregatePaginate(favorites, options, function (err, results) {
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


router.post("/setFavorite/", auth, async (req, res, next) => {
  const params = req.body;
  const userId = req.currentUserId;
  const storeId = params["storeId"];
  const id = params["id"];
  const category = params["category"];
  const isFavorite = params["isFavorite"];
  try {
    if (isFavorite === true) {
      const favorite = await Favorite.create({ userId: userId, userId: storeId, id: id, category: category });
      return res.status(200).send({ "success": true, "data": favorite });
    } else {
      Favorite.findOneAndRemove({ userId: userId, userId: storeId, id: id, category: category }, function (err, response) {
        if (err) {
          return res.status(500).send({ "success": false, "message": message.apiError });
        }
        return res.status(200).send({ "success": true, "data": response });
      });
    }
  } catch (err) {
    return next(err);
  }
});

router.post("/backup/", auth, async (req, res, next) => {
  var favoriteData = req.body;
  console.log("----------  favoriteData ----------------------");
  try {
    const userId = req.currentUserId;
    Object.keys(favoriteData).forEach(async (category) => {
      var favorites = favoriteData[category];
      for (let index = 0; index < favorites.length; index++) {
        var data = favorites[index];

        if(data["userId"] == userId){
          if (data["isFavorite"]==true){
            await Favorite.findOneAndUpdate(
              { userId: data["userId"], id: data["id"], category: data["category"] }, 
              data, 
              { new: true, upsert: true },
            );
          }else{
            await Favorite.findOneAndRemove({ userId: data["userId"], id: data["id"], category: data["category"] });
          }  
        }else{
          //In general we should thorw auth error, but it is bulk so just skipping.
        }
      }
    });
    return res.status(200).send({ "success": true});
  } catch (err) {
    return next(err);
  }
});




const install = app => app.use("/api/v1/favorite", router);

module.exports = {
  install
};
