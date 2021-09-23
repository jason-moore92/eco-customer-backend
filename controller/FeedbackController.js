const express = require("express");
const router = express.Router();
const Feedback = require("../model/Feedback");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')
const auth = require("../middlewares/auth");


router.get("/", async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const feedback = await Feedback.findOne({ userId: userId });
    return res.status(200).send({ "success": true, "data": feedback });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.post("/add", auth, async (req, res, next) => {
  const feedback = new Feedback();
  try {
    const userId = req.currentUserId;
    feedback.userId = userId;
    if (req.body.ratingValue) {
      feedback.ratingValue = req.body.ratingValue;
    } else {
      feedback.ratingValue = 0;
    }
    if (req.body.feedbackText) {
      feedback.feedbackText = req.body.feedbackText;
    } else {
      feedback.feedbackText = "";
    }
    const feedbackData = await Feedback.create(feedback);
    return res.status(200).send({ "success": true, "data": feedbackData });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.put("/update/:id", auth, async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    if (await Feedback.findOne({ _id: req.params.id, userId: userId })) {

      Feedback.findOneAndUpdate({ _id: req.params.id, userId: userId }, req.body, { new: true }, function (err, Product) {

      });
      const feedbackData = await Feedback.findOne({ _id: req.params.id });
      res.send({ "success": true, "data": feedbackData });
    }
    // const Product = await Products.create(req.body);

  } catch (err) {
    console.error(err);
    next(err);
  }
});

const install = app => app.use("/api/v1/feedback", router);

module.exports = {
  install
};
