const express = require("express");
const router = express.Router();
const Cart = require("../model/Cart");
var Handler = require('../Utiles/Handler')
var message = require('../localization/en.json')

router.post("/add", async (req, res, next) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id)
    return res.status(400).send(message.insufficient_error_400);
  try {
    const cart = await Cart.create(req.body);
    return res.status(200).send(cart);
  } catch (err) {
    console.error(err);
    next(err);
  }
});


router.get("/:userId", async (req, res, next) => {
  try {
    const carts = await Cart.find({ user_id: req.params.userId });
    return res.send(carts);
  } catch (err) {
    return next(err);
  }
});

router.delete("/delete/:id", async (req, res, next) => {
  try {
    if (await Cart.findOne({ _id: req.params.id })) {
      Cart.findOneAndRemove({ _id: req.params.id }, function (error, response) {
        return res.status(200).send(message.remove_success);
      });
    }
  } catch (err) {
    return res.status(500).send(message.query_error);
  }
});

const install = app => app.use("/api/v1/cart", router);

module.exports = {
  install
};
