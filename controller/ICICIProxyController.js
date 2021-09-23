const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const icici = require("../Utiles/icici");

router.post("/proxy/", auth, async (req, res, next) => {
  const { method, params } = req.body;
  try {
    const response = await icici[method](params);
    return res.send(response);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

const install = app => app.use("/api/v1/icici", router);

module.exports = {
  install
};
