const express = require("express");
const router = express.Router();
const PaymentLink = require("../model/PaymentLink");
const User = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const axios = require('axios')


router.post("/getPaymentLinks/", auth, async (req, res) => {
  const params = req.body;
  const storeId = params["storeId"];
  const userId = params["userId"];
  const page = params["page"];
  const limit = params["limit"];
  const searchKey = params["searchKey"];

  console.log("============= getPaymentLinks  111 =================");
  console.log(params);

  var matchCondition = {};

  if (!isNull(storeId) && storeId !== undefined) {
    matchCondition["storeId"] = storeId;
  }

  if (!isNull(userId) && userId !== undefined) {
    matchCondition["userId"] = userId;
  }

  console.log(matchCondition);

  try {
    const paymentLinks = PaymentLink.aggregate(
      [
        {
          $match: matchCondition
        },
        { $set: { userId: { $toObjectId: "$userId" } } },
        { $set: { storeId: { $toObjectId: "$storeId" } } },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "app-users",
            localField: 'userId',
            foreignField: '_id',
            as: "user"
          },
        },
        { "$unwind": "$user" },
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
              { "store.name": { "$regex": searchKey, "$options": "i" } },
              { "store.email": { "$regex": searchKey, "$options": "i" } },
            ],
          },
        }
      ]
    );

    const options = {
      page: page,
      limit: limit
    };

    PaymentLink.aggregatePaginate(paymentLinks, options, function (err, results) {
      if (err) {
        console.log(err);
        return Handler(res, err);
      }
      else {
        return res.status(200).send({ "success": true, "data": results });
      }
    });

  } catch (err) {
    console.log(err);
    return Handler(res, err);
  }
});

router.get("/get/", auth, async (req, res) => {
  console.log("===========razora pay status =================");
  const { id, status, paymentLinkId } = req.query;
  console.log(req.query);
  try {
    const response = await axios.get(process.env.RZRPAY_URL + "/" + id, {
      auth: {
        username: process.env.RZRPAY_KEY_ID,
        password: process.env.RZRPAY_KEY_SECRET
      }
    });

    const data = await response.data;

    console.log("updated stats: " + data["status"]);
    console.log("paymentLinkId: " + paymentLinkId);

    if (data["status"] != status) { 
      PaymentLink.findByIdAndUpdate(paymentLinkId, { "paymentData": data }, async (err, doc, any) => {
        console.log("===dupate error============");
        console.log(err);
      });
    }

    return res.status(200).send({ "success": true, "data": data });

  } catch (err) {
    console.log(err);
    return Handler(res, err);
  }
});


const install = app => app.use("/api/v1/payment_link", router);

module.exports = {
  install
};
