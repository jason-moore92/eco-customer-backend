const express = require("express");
const router = express.Router();
const DeliveryPartner = require("../model/DeliveryPartner");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');

//TODO:: ask abhi, to what and where exactly using
// no userId in model.
router.get("/get/:zipCode", auth, async (req, res, next) => {
  try {
    console.log(req.params["zipCode"]);
    const deliveryPartners = await DeliveryPartner.aggregate(
      [
        {
          $match: {
            "servicingAreas.zipCode": req.params["zipCode"],
            enabled: true,
          }
        },
      ]
    );

    return res.status(200).send({ "success": true, "data": deliveryPartners });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getById/:id", auth, async (req, res, next) => {
  try {
    console.log(req.params["id"]);
    const deliveryPartners = await DeliveryPartner.findById(req.params["id"]);

    return res.status(200).send({ "success": true, "data": deliveryPartners });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

router.get("/getDeliveryPartnerData", auth, async (req, res, next) => {
  var { zipCode, searchKey, page, limit } = req.query;

  try {
    const orders = DeliveryPartner.aggregate(
      [
        {
          $match: {
            "servicingAreas.zipCode": zipCode,
            enabled: true,
          }
        },
        {
          $match: {
            $or: [
              { "name": { "$regex": searchKey, "$options": "i" } },
            ],
          },
        },
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    DeliveryPartner.aggregatePaginate(orders, options, function (err, results) {
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

const install = app => app.use("/api/v1/delivery_partners", router);

module.exports = {
  install
};
