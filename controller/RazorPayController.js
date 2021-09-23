const express = require("express");
const router = express.Router();
var Handler = require('../Utiles/Handler');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const axios = require('axios')


router.post("/orders/",auth, async (req, res, next) => {

  try {
    const response = await axios.post(`${process.env.RZRPAY_BASE}/orders`, req.body, {
      auth: {
        username: process.env.RZRPAY_KEY_ID,
        password: process.env.RZRPAY_KEY_SECRET
      }
    });
    if(response.status == 200){
      return res.send(response.data);  
    }
    else{
      return Handler(res, {message: "razorpay error"});  
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/razorpay", router);

module.exports = {
  install
};
