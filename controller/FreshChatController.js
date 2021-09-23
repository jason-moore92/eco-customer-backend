const express = require("express");
const router = express.Router();
const AppUser = require("../model/AppUser");
var Handler = require('../Utiles/Handler');
const auth = require("../middlewares/auth");


router.post("/updateRestoreId", auth, async (req, res, next) => {
  const { restoreId } = req.body;

  try {
    const userId = req.currentUserId;
    await AppUser.findByIdAndUpdate(userId, {
      freshChat: {restoreId}
    });
    return res.send({success: true, message: "RestoreId is updated successfully."});
  } catch (err) {
    console.error(err);
    next(err);
  }
});

const install = app => app.use("/api/v1/freshChat", router);

module.exports = {
  install
};
