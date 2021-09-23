const express = require("express");
const router = express.Router();
const ContactUs = require("../model/ContactUs");
var Handler = require('../Utiles/Handler');
const auth = require("../middlewares/auth");

router.post("/add/", auth, async (req, res, next) => {
  try {
    let params = req.body;
    const userId = req.currentUserId;
    params.userId = userId;

    const contactUsRequest = await ContactUs.create(params);

    return res.send({ "success": true, "data": contactUsRequest });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


const install = app => app.use("/api/v1/contactUsRequest", router);
module.exports = {
  install
};
