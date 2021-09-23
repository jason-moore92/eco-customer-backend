const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

router.get("/",  (req, res, next) => {
  return res.send({ message: "Everything ok in the GET method for root" });
});

router.post("/", (req, res, next) => {
  return res.send({ message: "Everything ok in the POST method for root" });
});

const install = app => app.use("/", router);

module.exports = {
  install
};
