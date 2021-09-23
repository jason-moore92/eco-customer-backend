const express = require("express");
const router = express.Router();
const AWS = require('aws-sdk');
const dns = require('dns');
const AppUser = require('../model/AppUser')
const { sendMessageToDevice } = require('../Utiles/sendPushNotification');
const auth = require("../middlewares/auth");
var emailHelper = require('../Utiles/emailHelper')
const axios = require("axios");
var AWSXRay = require('aws-xray-sdk');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const resolveUrl = async (url) => {
  return new Promise(
    (resolve, reject) => {
      dns.resolve(url, (err) => {
        if (err) {
          reject(err)
        }
        resolve();
      })
    }
  );
}

router.get("/status", async (req, res, next) => {
  let statues = {
    'storage': "Not working",
    'internet': "Not connected",
  };

  try {
    let storageResponse = await s3.getObject({
      Bucket: process.env.STORE_PROFILE_BUCKET_NAME,
      Key: "connectivity.txt"
    }).promise();
    statues['storage'] = storageResponse.Body.toString();
  }
  catch (err) {
    console.log(err);
  }

  try {
    let resolved = await resolveUrl("www.google.com");
    statues['internet'] = "Connected";
  }
  catch (err) {
    console.log(err);
  }

  return res.send(statues);
});

router.post("/testPush", auth, async (req, res, next) => {

  const { title, body, ...rest } = req.body;

  let user = await AppUser.findById(req.currentUserId);

  let tokens = user.status.filter(s => s.fcmToken).map(s => s.fcmToken);

  let result = await sendMessageToDevice(tokens, title, body, {
    "data": rest,
  });

  return res.send({
    "message": "Push triggered",
    result
  });
});

router.post("/testEmail", auth, async (req, res, next) => {

  const { title, body } = req.body;

  await emailHelper("pavan@trademantri.com", title, null, body);

  return res.send({
    "message": "Email triggered"
  });
});

router.get("/testException", auth, async (req, res, next) => {

  try {
    throw new Error("Testing Exception");

    return res.send({
      "message": "Exception triggered"
    });
  } catch (err) {
    next(err)
  }
});

router.post("/testOutgoing", auth, async (req, res, next) => {
  const data = req.body;
  try {

    let response = await axios.post("http://2f9ae412094b.ngrok.io", data);

    return res.send({
      "data": response.data
    });
  } catch (err) {
    next(err)
  }
});

router.get("/testPdf", auth, async (req, res, next) => {

  try {
    
    return res.send({
      "message": "Exception triggered"
    });
  } catch (err) {
    next(err)
  }
});

router.get("/testXray", auth, async (req, res, next) => {

  try {
    var segment = AWSXRay.getSegment();
    segment.addAnnotation('page', 'directory');

    let newSubSegment = segment.addNewSubsegment("sub1");

    let response = await axios.post("http://google.com", data);

    newSubSegment.addAnnotation("google_response", response.status);
    newSubSegment.close();
  

    return res.send({
      "message": "Xray triggered"
    });
  } catch (err) {
    next(err)
  }
});

const install = app => app.use("/api/v1", router);

module.exports = {
  install
};
