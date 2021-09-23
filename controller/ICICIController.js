const express = require("express");
const router = express.Router();
const { processCallback } = require("../Utiles/icici");

router.post("/callback/", async (req, res, next) => {
  const data = req.rawBody;
  try {
    console.log({data});
    const response = await processCallback(data);
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
