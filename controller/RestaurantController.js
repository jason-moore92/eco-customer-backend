const express = require("express");
const router = express.Router();
const Restaurant = require("../model/Restaurant");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')

//TODO:: remove total file
router.get("/getRestaurants", async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({});
    return res.send(restaurants);
  } catch (err) {
    return next(err);
  }
});

router.post("/add", async (req, res, next) => {
  const restaurant = new Restaurant();
  const { name,  image } = req.body;
  if (!name || !image )
    return res.status(400).send(message.insufficient_error_400);
  try {

    restaurant.name = req.body.name;
    restaurant.image = req.body.image;

    if(req.body.address ){
      restaurant.address = req.body.address;
    } else {
      restaurant.address = "";
    }
    if(req.body.latitude ){
      restaurant.latitude = req.body.latitude;
    } else {
      restaurant.latitude = "";
    }
    if(req.body.longitude ){
      restaurant.longitude = req.body.longitude;
    } else {
      restaurant.longitude = "";
    }
    console.log(restaurant);
    const restaurantData = await Restaurant.create(restaurant);
    return res.status(200).send(restaurantData);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.put("/update/:id", async (req, res, next) => {

  const { name,  image } = req.body;
  if (!name ||  !image)
    return res.status(400).send(message.insufficient_error_400);
  try {
    if (await Restaurant.findOne({ _id: req.params.id })){

      Restaurant.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true } , function (err, Product) {

      });
      const restaurantData =  await Restaurant.findOne({_id : req.params.id});
      res.send(restaurantData);
    }
    // const Product = await Products.create(req.body);

  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.delete("/delete/:id", async (req, res, next) => {
  try {
    if (await Restaurant.findOne({ _id: req.params.id })){

      Restaurant.findOneAndRemove({ _id: req.params.id },  function (error, response){
        return res.status(200).send(message.success);
      });

    }
  } catch (err) {
    return res.status(500).send(message.query_error);
  }
});

const install = app => app.use("/api/v1/restaurant", router);

module.exports = {
  install
};
