const express = require("express");
const router = express.Router();
const StoreReview = require("../model/StoreReview");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')
const auth = require("../middlewares/auth");


router.get("/getStoreReview", auth ,async (req, res, next) => {
  try {
    StoreReview.findOne({ userId: req.query.userId, storeId: req.query.storeId}, (err, data) => {
      if (err) {
        return res.status(500).send({ "success": false, "message": message.apiError});
      }
      return res.status(200).send({ "success": true, "data": data });

    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getReviewList", async (req, res, next) => {
  try {
    const params = req.query;
    const storeId = params["storeId"];
    const page = params["page"];
    const limit = params["limit"];

    const storeReview = StoreReview.aggregate(
      [
        {
          $match: { storeId: storeId }
        },
        { $sort: { updatedAt: -1 } },
      ]
    );
    const options = {
      page: page,
      limit: limit
    };

    StoreReview.aggregatePaginate(storeReview, options, function (err, results) {
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

router.get("/getAverageRating/:storeId", async (req, res, next) => {
  try {
    const averageRatingData = await StoreReview.aggregate(
      [
        {
          $match: { storeId: req.params.storeId }
        },
        {
          $group:
          {
            _id: "$storeId",
            totalCount: { $sum: 1 },
            totalRating: { $sum: "$rating" }
          }
        },
      ]
    );
    res.send({ "success": true, "data": averageRatingData });

  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.put("/update/:id", auth, async (req, res, next) => {
  const { storeId ,title, review, rating } = req.body;
  const userId = req.currentUserId;
  console.log("_______________update__________________");
  console.log(req.params.id);

  if (await StoreReview.findOne({ _id: req.params.id })) {
    StoreReview.findOneAndUpdate(
      { _id: req.params.id },
      {
        userId: userId,
        storeId: storeId,
        title: title,
        review: review,
        rating: rating,
        updatedAt: Date.now(),
      }, { new: true } ,
      async (err, data)=> {
        if (err) {
          res.status(500).send({ "success": false, "message": message.apiError });
        }
        const newData = await StoreReview.findOne({ _id: req.params.id });
        res.status(200).send({ "success": true, "data": newData });
      }
    );
  }
});


router.post("/add",auth,  async (req, res, next) => {
  const {  storeId, title, review, rating } = req.body;
  const userId = req.currentUserId;
  const storeReview = new StoreReview();

  storeReview.userId = userId;
  storeReview.storeId = storeId;
  storeReview.title = title;
  storeReview.review = review;
  storeReview.rating = rating;

  try {
    const storeReviewData = await StoreReview.create(storeReview);
    return res.status(200).send({ "success": true, "data": storeReviewData });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/store_review", router);

module.exports = {
  install
};
