const express = require("express");
const router = express.Router();
const User = require("../model/AppUser");
const ReferralRewardOfferTypeRules = require("../model/ReferralRewardOfferTypeRules");
const ReferralRewardOffers = require("../model/ReferralRewardOffers");
var { referralRewardOffersConfirmHandler } = require('../Utiles/referralRewardOffersConfirmHandler');

// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
var async = require('async');
var crypto = require('crypto');
var Handler = require('../Utiles/Handler')
var emailHelper = require('../Utiles/emailHelper')
var message = require('../localization/en.json')
var readHTMLFile = require('../Utiles/readHTMLFile')
const admin = require("../Utiles/firebase_admin");

var handlebars = require('handlebars');
const { isNull } = require("lodash");
var { deleteObject } = require('../Utiles/upload_to_s3')
var formidable = require('formidable');
var fs = require('fs-extra');
const AWS = require('aws-sdk');
const RewardPointHistory = require("../model/RewardPointHistory");
const { syncUser, getLoginUrl, getLoginUrlJWT } = require("../Utiles/community")

const sms = require('../Utiles/sms');


const createUserToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || 86400,
  });
};

const s3 = new AWS.S3({
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY
});

router.post("/login", async (req, res, next) => {
  const { email, password, fcmToken, isPhoneNumber } = req.body;
  if (!email || !password)
    return res.status(400).send({ "success": false, "message": message.insufficient_error_400 });;
  try {
    if (isPhoneNumber) {
      var user = await User.findOne({ mobile: email }).select("password");
      if (!user) {
        return res.status(409).send({ "success": false, "message": message.auth_error_409 });
      }
    } else {
      var user = await User.findOne({ email: { "$regex": email, "$options": "i" } }).select("password");
      if (!user) {
        return res.status(404).send({ "success": false, "message": message.non_exist_account_404 });
      }
    }

    // const pass_ok = await bcrypt.compare(password, user.password);
    const pass_ok = bcrypt.compareSync(password, user.password);
    console.log(pass_ok);

    if (!pass_ok) {
      if (isPhoneNumber) {
        return res.status(409).send({ "success": false, "message": message.auth_error_409 });
      } else {
        return res.status(401).send({ "success": false, "message": message.auth_error_401 });
      }
    }

    user = await User.findById(user.id);

    if (isNull(user.status) || user.status.length === 0) {
      user.status = [];
      user.status.push({
        fcmToken: fcmToken,
        status: "login",
        jwtToken: createUserToken(user.id),
      })
    } else {
      var isTokenExist = false;
      for (let index = 0; index < user.status.length; index++) {
        const element = user.status[index];
        if (element["fcmToken"] === fcmToken) {
          element["jwtToken"] = createUserToken(user.id);
          element["status"] = "login";
          isTokenExist = true;
          break;
        }
      }

      if (isTokenExist !== true) {
        user.status.push({
          fcmToken: fcmToken,
          status: "login",
          jwtToken: createUserToken(user.id),
        });
      }
    }


    await User.findOneAndUpdate({ _id: user.id }, user, { new: true }, function (err, userInfo) { });

    const data = await User.findOne({ _id: user.id });
    if (!data)
      return res.status(401).send({ "success": false, "message": message.auth_error_401 });
    if (isPhoneNumber) {
      if (!data.phoneVerified)
        return res.status(410).send({ "success": false, "message": message.non_verified_account_410 });
    } else {
      if (!data.verified)
        return res.status(402).send({ "success": false, "message": message.non_verified_account_402 });
    }
    referralRewardOffersConfirmHandler(data["_id"], "SignUpAndLogin");

    return res.status(200).send({ "success": true, "data": data });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


router.post("/register", async (req, res, next) => {
  const user = new User();
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send(message.insufficient_error_400);
  try {
    var result1 = await User.find({ $or: [{ email: { "$regex": email, "$options": "i" } }, { mobile: req.body.mobile }] })

    if (result1.length !== 0)
      return res.status(403).send({ "success": false, "message": message.account_already_exist_403 });

    if (req.body.email) {
      user.email = req.body.email;
    } else {
      user.email = "";
    }
    if (req.body.firstName) {
      user.firstName = req.body.firstName;
    } else {
      user.firstName = "";
    }
    if (req.body.lastName) {
      user.lastName = req.body.lastName;
    } else {
      user.lastName = "";
    }
    if (req.body.mobile) {
      user.mobile = req.body.mobile;
    } else {
      user.mobile = "";
    }
    if (req.body.referredBy) {
      user.referredBy = req.body.referredBy;
    } else {
      user.referredBy = "";
    }
    if (req.body.password) {
      user.password = req.body.password;
    } else {
      user.password = "";
    }
    if (req.body.role) {
      user.role = req.body.role;
    } else {
      user.role = "";
    }
    if (req.body.role) {
      user.role = req.body.role;
    } else {
      user.role = "";
    }

    var jwtToken = createUserToken(user.id);

    user.status = [];
    user.status.push({
      fcmToken: req.body.fcmToken,
      status: "logout",
      jwtToken: jwtToken,
    })


    user.referralCode = crypto.randomBytes(6).toString('hex', 0);

    user.emailVerifyToken = crypto.randomBytes(32).toString('hex', 0);
    user.emailVerifyTokenExpires = Date.now() + process.env.EMAIL_VERIFY_EXPIRES * 1000;

    var userData = await User.create(user);

    ///
    /// find referal rewardPoint rule
    ///
    if (user.referredBy !== "") {
      var referralRewardOfferTypeRules = await ReferralRewardOfferTypeRules.findOne({
        activeReferralOffer: true,
        validityStartDate: { $lt: Date.now() },
        validityEndDate: { $gte: Date.now() },
        appliedFor: req.body.appliedFor,// TODO:: It should be fixed and not from req.
      });
      if (referralRewardOfferTypeRules) {
        var referralRewardOffers = await ReferralRewardOffers.create({
          referredByUserId: req.body.referredByUserId,
          referralUserId: userData["_id"],
          status: "pending",
          rulesId: referralRewardOfferTypeRules["_id"],
          referralOfferType: referralRewardOfferTypeRules.referralOfferType,
          appliedFor: req.body.appliedFor, // TODO:: It should be fixed and not from req.
          referredByUserRewardPoints: referralRewardOfferTypeRules["referredByUserRewardPoints"],
          referralUserRewardPoints: referralRewardOfferTypeRules["referralUserRewardPoints"],
          referredByUserAmount: referralRewardOfferTypeRules["referredByUserAmount"],
          referralUserAmount: referralRewardOfferTypeRules["referralUserAmount"],
          minimumFirstOrder: referralRewardOfferTypeRules["minimumFirstOrder"],
          maximumorder: referralRewardOfferTypeRules["maximumorder"],
          isReferralUserRegistred: false,
          isReferralLoggedIn: false,
          isReferralMadeFirstOrder: false,
        });
        if (referralRewardOffers) {
          referralRewardOffersConfirmHandler(userData["_id"], "SignUpOnly");
        }
      }
    }
    ////////////////

    /// send verify link via email
    let html = await readHTMLFile("./public/email_template/welcome.html");

    var template = handlebars.compile(html);
    var verifyLink = req.protocol + '://' + req.get('host') + '/api\/v1\/user' + "\/verify?token=" + userData['emailVerifyToken'] + "&email=" + userData['email'];
    var replacements = {
      username: user.firstName + " " + user.lastName,
      email: user.email,
      verifyLink: verifyLink,
      Company_Name: process.env.Company_Name,
      Company_Address: process.env.Company_Address,
      Company_Area: process.env.Company_Area,
      Company_City: process.env.Company_City,
      Company_State: process.env.Company_State,
      Company_Zip: process.env.Company_Zip,
    };
    var htmlToSend = template(replacements);
    var subject = 'Account Verification';

    await emailHelper(user.email, subject, "", htmlToSend);
    await syncUser(user);
    return res.status(200).send({ "success": true, "data": userData });

  } catch (err) {
    console.error(err);
    next(err);
  }
});


/**
 * Resend email verification link
 * Alias: initiate email verification
 */
router.post("/resend_verify_link", async (req, res, next) => {
  console.log(req.body)
  const { email } = req.body;
  if (!email)
    return res.status(400).send(message.insufficient_error_400);
  try {
    var user = await User.findOne({ email }).select("+emailVerifyToken");
    if (!user)
      return res.status(401).send({ "success": false, "message": message.auth_error_401 });

    let newToken = crypto.randomBytes(32).toString('hex', 0);
    let emailVerifyTokenExpires = Date.now() + process.env.EMAIL_VERIFY_EXPIRES * 1000;

    user.emailVerifyToken = newToken;
    user.emailVerifyTokenExpires = emailVerifyTokenExpires;

    await user.save();

    /// send verify link via email
    let html = await readHTMLFile("./public/email_template/welcome.html");
    var template = handlebars.compile(html);
    var verifyLink = req.protocol + '://' + req.get('host') + '/api\/v1\/user' + "\/verify?token=" + newToken + "&email=" + user.email;
    var replacements = {
      username: user.firstName + " " + user.lastName,
      email: user.email,
      verifyLink: verifyLink,
      Company_Name: process.env.Company_Name,
      Company_Address: process.env.Company_Address,
      Company_Area: process.env.Company_Area,
      Company_City: process.env.Company_City,
      Company_State: process.env.Company_State,
      Company_Zip: process.env.Company_Zip,
    };
    var htmlToSend = template(replacements);
    var subject = 'Account Verification';

    await emailHelper(user.email, subject, "", htmlToSend);
    return res.status(200).send({ "success": true });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


/**
 * Email verification
 */
router.get('/verify', async (req, res, next) => {
  const { email, token } = req.query;
  try {
    if (!email || !token) {
      return res.status(422).send({ success: false, message: "Email and Token are required." });
    }

    let user = await User.findOne({ email: email }).select("+emailVerifyToken");

    if (!user) {
      let html = await readHTMLFile("./public/email_template/verify_failed.html");

      var template = handlebars.compile(html);
      var replacements = {
        title: message.non_exist_account_404,
        Suppert_Email: process.env.Suppert_Email,
        Company_Name: process.env.Company_Name,
        Company_Address: process.env.Company_Address,
        Company_Area: process.env.Company_Area,
        Company_City: process.env.Company_City,
        Company_State: process.env.Company_State,
        Company_Zip: process.env.Company_Zip,
      };
      var htmlToSend = template(replacements);

      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      return res.send(htmlToSend);
    }
    if (user.verified) {
      let html = await readHTMLFile("./public/email_template/verify_failed.html");
      var template = handlebars.compile(html);
      var replacements = {
        title: message.account_already_verified,
        Suppert_Email: process.env.Suppert_Email,
        Company_Name: process.env.Company_Name,
        Company_Address: process.env.Company_Address,
        Company_Area: process.env.Company_Area,
        Company_City: process.env.Company_City,
        Company_State: process.env.Company_State,
        Company_Zip: process.env.Company_Zip,
      };
      var htmlToSend = template(replacements);

      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      return res.send(htmlToSend);

    }

    if (user.emailVerifyToken != token) {
      let html = await readHTMLFile("./public/email_template/verify_failed.html");
      var template = handlebars.compile(html);
      var replacements = {
        title: message.email_token_mismatch,
        Suppert_Email: process.env.Suppert_Email,
        Company_Name: process.env.Company_Name,
        Company_Address: process.env.Company_Address,
        Company_Area: process.env.Company_Area,
        Company_City: process.env.Company_City,
        Company_State: process.env.Company_State,
        Company_Zip: process.env.Company_Zip,
      };
      var htmlToSend = template(replacements);

      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      return res.send(htmlToSend);

    }

    var difference = user.emailVerifyTokenExpires - new Date(); // difference in milliseconds

    if (difference < 1000) {
      let html = await readHTMLFile("./public/email_template/verify_failed.html");
      var template = handlebars.compile(html);
      var replacements = {
        title: message.expired_token,
        resendVerification: true,
        Suppert_Email: process.env.Suppert_Email,
        Company_Name: process.env.Company_Name,
        Company_Address: process.env.Company_Address,
        Company_Area: process.env.Company_Area,
        Company_City: process.env.Company_City,
        Company_State: process.env.Company_State,
        Company_Zip: process.env.Company_Zip,
      };
      var htmlToSend = template(replacements);

      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      return res.send(htmlToSend);
    }


    user.verified = true;
    user.save(async (err) => {
      if (err) {
        let html = await readHTMLFile("./public/email_template/verify_failed.html");
        var template = handlebars.compile(html);
        var replacements = {
          title: message.verified_failed,
          Suppert_Email: process.env.Suppert_Email,
          Company_Name: process.env.Company_Name,
          Company_Address: process.env.Company_Address,
          Company_Area: process.env.Company_Area,
          Company_City: process.env.Company_City,
          Company_State: process.env.Company_State,
          Company_Zip: process.env.Company_Zip,
        };
        var htmlToSend = template(replacements);

        res.statusCode = 200;
        res.setHeader('Content-type', 'text/html');
        return res.send(htmlToSend);

      } else {
        let html = await readHTMLFile("./public/email_template/verify_success.html");

        var template = handlebars.compile(html);
        var replacements = {
          email: user.email,
          Company_Name: process.env.Company_Name,
          Company_Address: process.env.Company_Address,
          Company_Area: process.env.Company_Area,
          Company_City: process.env.Company_City,
          Company_State: process.env.Company_State,
          Company_Zip: process.env.Company_Zip,
        };
        var htmlToSend = template(replacements);

        res.statusCode = 200;
        res.setHeader('Content-type', 'text/html');
        return res.send(htmlToSend);
      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }

});

/**
 * Resend mobile verification link
 * Alias: initiate mobile verification
 */
router.post("/initiateMobileVerification", async (req, res, next) => {
  const { mobile } = req.body;
  if (!mobile)
    return res.status(400).send(message.insufficient_error_400);
  try {
    var user = await User.findOne({ mobile }).select("+mobileVerifyToken");
    if (!user)
      return res.status(401).send({ "success": false, "message": message.non_exist_account_404 });

    var otp = Math.random();
    otp = otp * 1000000;
    if (otp < 100000) {
      otp = 1000000 - otp;
    }
    otp = parseInt(otp);

    let mobileVerifyTokenExpires = Date.now() + process.env.MOBILE_VERIFY_EXPIRES * 1000;

    user.mobileVerifyToken = otp;
    user.mobileVerifyTokenExpires = mobileVerifyTokenExpires;

    await user.save();

    //TODO:: For now using the approved template, we may use different one
    let smsContent = `TRADEMANTRI: Your OTP is ${otp} and it is valid for another one hour. Do not share this with any one for security reasons`;
    await sms.send(user.mobile, smsContent);

    return res.status(200).send({ "success": true });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * Mobile verification
 */
 router.post('/verifyMobileVerification', async (req, res, next) => {
  const { mobile, token } = req.body;
  try {
    if (!mobile || !token) {
      return res.status(422).send({ success: false, message: "Mobile and Token are required." });
    }

    let user = await User.findOne({ mobile: mobile }).select("+mobileVerifyToken");

    if (!user) {
      return res.status(422).send({success: false, message: "No use found."});
    }

    if (user.phoneVerified) {
      return res.status(422).send({success: false ,message: "Your mobile is alredy verified."});
    }

    if (user.mobileVerifyToken != token) {
      return res.status(422).send({success: false, message: "Invalid otp."});
    }

    var difference = user.mobileVerifyTokenExpires - new Date(); // difference in milliseconds

    if (difference < 1000) {
      return res.status(422).send({success: false, message: "OTP is expired. Try again."});
    }

    user.phoneVerified = true;
    await user.save();

    return res.send({success: true, message: "Mobile verified successfully."})

  } catch (err) {
    console.error(err);
    next(err);
  }

});

/**
 * Forgot password via email.
 */
router.get('/forgot/:email', async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).send({ "success": false, "message": message.non_exist_account_404 });
    }
    var otp = Math.random();
    otp = otp * 1000000;
    if (otp < 100000) {
      otp = 1000000 - otp;
    }
    otp = parseInt(otp);

    user.otp = otp;
    user.otpExpires = Date.now() + process.env.JWT_EXPIRES_IN_OTP * 1000;


    await user.save();

    let html = await readHTMLFile("./public/email_template/otp.html");
    var template = handlebars.compile(html);
    var replacements = {
      username: user.firstName + " " + user.lastName,
      otp: otp,
      Suppert_Email: process.env.Suppert_Email,
      Company_Name: process.env.Company_Name,
      Company_Address: process.env.Company_Address,
      Company_Area: process.env.Company_Area,
      Company_City: process.env.Company_City,
      Company_State: process.env.Company_State,
      Company_Zip: process.env.Company_Zip,
    };
    var htmlToSend = template(replacements);
    var subject = 'OTP for Reset Password';

    await emailHelper(user.email, subject, "", htmlToSend);
    return res.status(200).send({ "success": true });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * Forgot password via email.
 */
router.post('/verify_otp/', async function (req, res, next) {
  const { email, otp, newPassword, newPasswordConfirmation } = req.body;
  try {

    if (!newPassword || !newPasswordConfirmation) {
      return res.status(422).send({ "success": false, "message": "New password and its confirmation is required." });
    }

    if (newPassword != newPasswordConfirmation) {
      return res.status(422).send({ "success": false, "message": "Password confirmation mismatch." });
    }

    let user = await User.findOne({ email: email }).select('+otp').select("password");

    if (!user) {
      return res.status(404).send({ "success": false, "message": message.non_exist_account_404 });
    }

    var difference = user.otpExpires - new Date(); // difference in milliseconds

    if (difference < 1000) {
      return res.status(405).send({ "success": false, "message": message.exipired_otp_405 });
    }

    if (otp.toString() !== user.otp.toString()) {
      return res.status(406).send({ "success": false, "message": message.not_math_otp_406 });
    }

    user.password = newPassword;
    user.verified = true;
    await user.save();

    return res.status(200).send({ "success": true, "message": "Password reset successfully." });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/changePassword/', auth, async (req, res, next) => {
  const { email, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ email: email }).select("password");
    if (!user)
      return res.status(404).send({ "success": false, "message": message.non_exist_account_404 });

    if (oldPassword !== undefined && !isNull(oldPassword)) {
      const pass_ok = bcrypt.compareSync(oldPassword, user.password);

      if (!pass_ok)
        return res.status(407).send({ "success": false, "message": message.auth_wrong_password_407 })
    }

    user.password = newPassword
    user.save(function (err) {
      if (err) {
        return res.status(500).send({ "success": true, "message": err.message });
      } else {
        return res.status(200).send({ "success": true });
      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post("/update", auth, async (req, res, next) => {
  try {
    var form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      var user = JSON.parse(fields["data"]);

      let userUpdatableColumns = ["firstName", "lastName", "mobile", "isNotifiable"];

      let updatableUser = Object.keys(user)
        .filter(key => userUpdatableColumns.includes(key))
        .reduce((obj, key) => {
          obj[key] = user[key];
          return obj;
        }, {});


      console.log("--------------------------");
      console.log(user["isNewPhoneNumber"]);
      console.log("--------------------------");

      let hasUser = await User.findOne({ _id: req.currentUserId });

      if (hasUser) {

        if (Object.keys(files).length !== 0) {
          if (user["imageUrl"] !== "") {
            deleteObject(process.env.PROFILE_BUCKET_NAME, user["imageUrl"]);
          }
          fs.readFile(files.image.path, (err, data) => {
            if (err) throw err;
            const params = {
              Bucket: process.env.PROFILE_BUCKET_NAME, // pass your bucket name
              Key: `avatar/${files.image.name}`, // file will be saved as testBucket/contacts.csv
              Body: data,
              correctClockSkew: true,
            };
            s3.upload(params, async (s3Err, data) => {
              if (s3Err) throw s3Err
              // console.log(`File uploaded successfully at ${data.Location}`)
              console.log(data.Location);
              user["imageUrl"] = data.Location;
              if (user["isNewPhoneNumber"]) {
                var result1 = await User.find({ mobile: user["mobile"] });
                if (result1.length !== 0) {
                  return res.status(411).send({ "success": false, "message": message.phoneNumber_error_411 });
                }
              }
              User.findOneAndUpdate({ _id: req.currentUserId }, user, { new: true }, function (err, result) {
                res.status(200).send({ "success": true, "data": result });
              });
            });
          });
        } else {
          user["imageUrl"] = "";
          if (user["isNewPhoneNumber"]) {
            var result1 = await User.find({ mobile: user["mobile"] });
            if (result1.length !== 0) {
              return res.status(411).send({ "success": false, "message": message.phoneNumber_error_411 });
            }
          }
          let updatedUser = await User.findOneAndUpdate({ _id: req.currentUserId }, updatableUser, { new: true });
          await syncUser(updatedUser);
          res.status(200).send({ "success": true, "data": updatedUser });
        }

      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});


router.get("/logout", auth, async (req, res, next) => {
  var { fcmToken } = req.query;

  try {
    const user = await User.findById(req.currentUserId);

    for (let index = 0; index < user.status.length; index++) {
      const element = user.status[index];
      if (element["fcmToken"] === fcmToken) {
        element["jwtToken"] = "";
        element["status"] = "logout";
        break;
      }
    }

    User.findOneAndUpdate({ _id: user.id }, user, { new: true }, function (err, userInfo) { });

    return res.status(200).send({ "success": true });
  } catch (err) {
    return next(err);
  }
});



router.get("/getRefferedUser/", auth, async (req, res, next) => {
  let user = await User.findById(req.currentUserId);
  try {
    const users = await User.findOne({ referredBy: user.referredBy });
    return res.send(users);
  } catch (err) {
    return next(err);
  }
});

router.get("/otherCreds", auth, async (req, res, next) => {

  let creds = {};
  try {
    const user = await User.findById(req.currentUserId);

    let fbClaims = {
      role: "customer",
      firstName: user.firstName,
      lastName: user.lastName,
    };


    let fbToken = await admin.auth().createCustomToken(user._id.toString(), fbClaims);

    creds["firebase"] = {
      "token": fbToken
    };


    if (!user.community || !user.community.id) {
      await syncUser(user);
    }

    creds["community"] = await getLoginUrlJWT(user);

    //TODO Need to add s3 creds as well.

    return res.status(200).send(creds);
  } catch (err) {
    return next(err);
  }
});

router.get("/community", async (req, res, next) => {
  return res.send("Please use APP to access community page.");
});

// router.get("/Userbytypelist/:type", async (req, res, next) => {
//   try {
//     const users = await Users.findOne({ type_user: req.params.type });
//     return res.send(users);
//   } catch (err) {
//     return res.status(500).send({ error: "User query error!" });
//   }
// });

// router.delete("/User_Del/:id", async (req, res, next) => {
//   try {
//     if (await Users.findOne({ _id: req.params.id })) {
//       // const user = await Users.findOneAndUpdate(req.body);
//       // return res.status(200).send({ user });

//       Users.findOneAndRemove({ _id: req.params.id }, function (error, response) {
//         return res.status(200).send({ error: "user removed successfully!" });
//       });

//     }
//   } catch (err) {
//     return res.status(500).send({ error: "User query error!" });
//   }
// });





const install = app => app.use("/api/v1/user", router);

module.exports = {
  install
};
