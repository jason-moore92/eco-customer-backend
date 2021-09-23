const express = require("express");
const router = express.Router();
var Handler = require('../Utiles/Handler');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");
const axios = require('axios')


//TODO:: Need to modify in future either get tokens from userId or storeId, not from the req.
router.post("/sendMessage/",auth, async (req, res, next) => {
  console.log("=========== sendMessage  =========");

  try {
    const response = await axios.post(`${process.env.FCM_BASE_API}/send`, req.body, {
     headers: {
       "Authorization": `key=${process.env.FCM_SERVER_KEY}`
     }
    });
    if(response.status == 200){
      console.log(response.data);
      return res.send(response.data);  
    }
    else{
      return Handler(res, {message: "fcm error"});  
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
});


const install = app => app.use("/api/v1/fcm", router);

module.exports = {
  install
};
