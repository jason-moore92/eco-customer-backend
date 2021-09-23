const express = require("express");
const router = express.Router();
const Category = require("../model/Category");
const Store = require("../model/Store");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')

router.get("/getCategories", async (req, res, next) => {
  try {
    const params = req.query;
    console.log("========== getCategories ===========");
    console.log(params);
    console.log(params["type"]);
    const location = { lat: parseFloat(params["lat"]), lng: parseFloat(params["lng"]) };
    const types = params["type"].split(',');
    const distance = params["distance"];
    var searchKey = params["searchKey"];

    if (searchKey === undefined) { 
      searchKey = "";
    }
    

    const categories = await Store.aggregate(
      [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [location["lng"], location["lat"]] },
            distanceField: "distance",
            key: 'location',
            maxDistance: parseInt(distance.toString()) * 1000,
            // includeLocs: "dist.location",
            spherical: true,
          }
        },
        {
          $match: { 
            "type": { $in: types }, 
            "enabled": { $eq: true },
          }
        },
        {
          $match: { "name": { "$regex": searchKey, "$options": "i"  }}
        },
        {
          $group:
          {
            _id: "$subType",
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
        { $sort: { storeCount: -1, "category.categoryDesc": 1 } },

      ]
    );

    return res.send({ "success": true, "data": categories });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


router.get("/getAll", async (req, res, next) => {
  try {
    const categories = await Category.find({});
    return res.send({ "success": true, "data": categories });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});



const install = app => app.use("/api/v1/category", router);

module.exports = {
  install
};
