const express = require("express");
const router = express.Router();
const ProductItemReview = require("../model/ProductItemReview");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')
const auth = require("../middlewares/auth");

router.get("/getProductItemReview", auth, async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    ProductItemReview.findOne(
      { itemId: req.query.itemId, userId: userId, type: req.query.type,  },
      (err, data) => {
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
    const itemId = params["itemId"];
    const type = params["type"];
    const page = params["page"];
    const limit = params["limit"];

    const productItemReview = ProductItemReview.aggregate(
      [
        {
          $match: { itemId: itemId, type: type, approve:true },
        },
        { $sort: { updatedAt: -1 } },
      ]
    );
    const options = {
      page: page,
      limit: limit
    };

    ProductItemReview.aggregatePaginate(productItemReview, options, function (err, results) {
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

router.get("/getAverageRating/", async (req, res, next) => {
  const params = req.query;
  try {
    const averageRatingData = await ProductItemReview.aggregate(
      [
        {
          $match: { itemId: params.itemId, type: params.type, approve: true },
        },
        {
          $group:
          {
            _id: "$itemId",
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
  const { itemId, type ,title, review, rating } = req.body;
  const userId = req.currentUserId;
  console.log("_______________update__________________");
  console.log(req.params.id);
  console.log(req.body);

  if (await ProductItemReview.findOne({ _id: req.params.id })) {
    ProductItemReview.findOneAndUpdate(
      { _id: req.params.id },
      req.body, { new: true } ,
      async (err, data)=> {
        if (err) {
          res.status(500).send({ "success": false, "message": message.apiError });
        }
        const newData = await ProductItemReview.findOne({ _id: req.params.id });
        res.status(200).send({ "success": true, "data": newData });
      }
    );
  }
});


router.post("/add", auth, async (req, res, next) => {
  const {  itemId, type, title, review, rating } = req.body;
  const userId = req.currentUserId;

  const productItemReview = new ProductItemReview();

  productItemReview.userId = userId;
  productItemReview.itemId = itemId;
  productItemReview.type = type;
  productItemReview.title = title;
  productItemReview.review = review;
  productItemReview.rating = rating;

  try {
    const productItemReviewData = await ProductItemReview.create(productItemReview);
    return res.status(200).send({ "success": true, "data": productItemReviewData });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/product_item_review", router);

module.exports = {
  install
};
