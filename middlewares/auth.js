const jwt = require("jsonwebtoken");
var AWSXRay = require('aws-xray-sdk');
const AppUser = require("../model/AppUser");
var message = require('../localization/en.json')

const jwtVerify = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err)
      }
      resolve(decoded);
    })
  });
}

const auth = async (req, res, next) => {
  const bearerHeader = req.headers['authorization'];


  if (!bearerHeader) {
    return res.status(408).send({ "success": false, "message": message.invalid_token_408 })
  }

  const bearer = bearerHeader.split(' ');
  const bearerToken = bearer[1];

  try {
    let decoded = await jwtVerify(bearerToken, process.env.JWT_KEY);
    req.currentUserId = decoded["id"];
    try {
      AWSXRay.getSegment().setUser(decoded["id"]);
    } catch (err) {
    }
    req.user = await AppUser.findById(decoded["id"]);
    return next();
  }
  catch (err) {
    console.log(err);
    if (err.toString().includes("expired")) {
      return res.status(401).send({ "success": false, "message": "jwt expired" })
    } else {
      return res.status(408).send({ "success": false, "message": message.invalid_token_408 })
    }
  }
};

module.exports = auth;
