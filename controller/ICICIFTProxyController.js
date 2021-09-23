const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const iciciFT = require("../Utiles/icici_ft");

router.post("/proxy/", auth, async (req, res, next) => {
  const { method, params, transferType } = req.body;
  try {
    const response = await iciciFT[method](params, transferType);
    return res.send(response);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/iciciFT", router);

module.exports = {
  install
};
