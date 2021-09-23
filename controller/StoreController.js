const express = require("express");
const router = express.Router();
const Store = require("../model/Store");
const DeliveryPartners = require("../model/DeliveryPartner");
const { getFCMTokenByStoreUserId } = require('../controller/PushSubscriptionController');
var Handler = require('../Utiles/Handler');
const { isNull } = require("lodash");
const auth = require("../middlewares/auth");

const getStorePipeline =  (params) => {
  const location = { lat: parseFloat(params["lat"]), lng: parseFloat(params["lng"]) };
  const types = params["type"].split(',');
  const subType = params["categoryId"];
  const distance = params["distance"];
  const page = params["page"];
  const limit = params["limit"];
  const isPaginated = params["isPaginated"];
  const searchKey = params["searchKey"];


  var match = {
    "type": { $in: types },
    "enabled": { $eq: true },
  }

  if (!isNull(subType) && subType !== undefined && subType.toString() !== "null") {
    match["subType"] = { $eq: subType };
  }

  var pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [location["lng"], location["lat"]] },
        distanceField: "distance",
        key: 'location',
        maxDistance: parseInt(distance.toString()) * 1000,
        // includeLocs: "dist.location",
        spherical: true,
      }
    },
    {
      $match: match,
    },
    { $sort: { "distance": 1, "name": 1, } },
    {
      $match: {
        $or: [
          // { "profile.ownerInfo.firstName": { "$regex": searchKey, "$options": "i" } },
          // { "profile.ownerInfo.firstName": { "$regex": searchKey, "$options": "i" } },
          { "name": { "$regex": searchKey, "$options": "i" } },
        ],
      },
    }
  ];
  return pipeline;
};


router.get("/getStores", async (req, res, next) => {
  try {
    const params = req.query;
    const subType = params["categoryId"];
    const location = { lat: parseFloat(params["lat"]), lng: parseFloat(params["lng"]) };
    const distance = params["distance"];
    const types = params["type"].split(',');
    const page = params["page"];
    const limit = params["limit"];
    const isPaginated = params["isPaginated"];
    const searchKey = params["searchKey"];


    const stores = Store.aggregate(getStorePipeline(params));

    if (isPaginated==="true"){
      const options = {
        page: page,
        limit: limit
      };

      Store.aggregatePaginate(stores, options, function (err, results) {
        if (err) {
          console.log(err);
          return next(err);
        }
        else {
          return res.status(200).send({ "success": true, "data": results });
        }
      });
    }else{
      var reslt = await stores.exec();
      return res.status(200).send({ "success": true, "data": reslt });
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
});



router.get("/get/:id", async (req, res, next) => {
  try {
    console.log("-----------------------");
    console.log(req.params.id);

    var store = await Store.findById(req.params.id);

    if (store) {
      if (!isNull(store["deliveryInfo"])
        && store["deliveryInfo"] !== undefined
        && !isNull(store["deliveryInfo"]["deliveryPartnerId"])
        && store["deliveryInfo"]["deliveryPartnerId"] !== undefined 
        && store["deliveryInfo"]["deliveryPartnerId"] !== "") {
        var deliveryPartner = await DeliveryPartners.findById(store["deliveryInfo"]["deliveryPartnerId"]);
        if (deliveryPartner) {
          store["deliveryPartner"] = deliveryPartner;
        }
      }
      return res.status(200).send({ "success": true, "data": store });
    } else {
      return res.status(500).send({ "success": false, "data": "No Store Data" });
    }

    // const store =await  Store.aggregate(
    //   [
    //     {
    //       $match: { _id: id }
    //     },
    //     // { $set: { deliveryPartnerId: { $toObjectId: "$deliveryInfo.deliveryPartnerId" } } },
    //     // {
    //     //   $lookup:
    //     //   {
    //     //     from: "deliverypartners",
    //     //     localField: 'deliveryPartnerId',
    //     //     foreignField: '_id',
    //     //     as: "deliveryPartner"
    //     //   },
    //     // },
    //   ]
    // );

    // const storeData = await Store.findOne({ _id: req.params.id });
    // return res.status(200).send({ "success": true, "data": store });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

//TODO:: Need to remove this after chat migrated to new plan.
router.get("/getStoreTokens/:id", auth, async (req, res, next) => {
  try {
    console.log("-----------------------");
    console.log(req.params.id);

    var store = await Store.findById(req.params.id);

    if (store) {
      var tokens = [];
      for (let i = 0; i < store["representatives"].length; i++) {
        var storeUserId = store["representatives"][i];
        console.log(storeUserId);
        console.log("===========================");
        var storeTokenData = await getFCMTokenByStoreUserId(storeUserId);
        console.log(storeTokenData);
        console.log("===========================");
        if (storeTokenData.length !== 0) {
          for (let index = 0; index < storeTokenData.length; index++) {
            var tokenData = storeTokenData[storeTokenData.length - 1 - index];
            if (!isNull(tokenData["token"]) && tokenData["token"] !== "") {
              tokens.push(tokenData["token"]);
            } else {
              console.log("=====store====" + tokenData["token"] + "=============");
            }
          }
        }
      }
      return res.status(200).send({ "success": true, "data": tokens });
    } else {
      return res.status(500).send({ "success": false, "data": "No Token Data" });
    }

  } catch (err) {
    console.error(err);
    next(err);
  }
});

// router.put("/update/:id", async (req, res, next) => {
//   try {
//     Store.findOneAndUpdate({ _id: req.params.id }, req.body, function (err, Product) {
//     });
//     const storeData = await Store.findOne({ _id: req.params.id });
//     return res.status(200).send({ "success": true, "data": storeData });

//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });

// router.post("/update/:id", async (req, res, next) => {
//   console.log("===============");
//   try {
//     var form = new formidable.IncomingForm();
//     form.parse(req, async (err, fields, files) => {
//       var store = JSON.parse(fields["data"]);

//       if (await Store.findOne({ _id: req.params.id })) {

//         if (Object.keys(files).length !== 0) {
//           if (store["profile"]["image"] != "") {
//             deleteObject(process.env.STORE_PROFILE_BUCKET_NAME, store["profile"]["image"]);
//           }
//           fs.readFile(files.image.path, (err, data) => {
//             if (err) throw err;
//             const params = {
//               Bucket: process.env.STORE_PROFILE_BUCKET_NAME, // pass your bucket name
//               Key: `store_image/${files.image.name}`, // file will be saved as testBucket/contacts.csv
//               Body: data,
//               correctClockSkew: true,
//             };
//             s3.upload(params, async (s3Err, data1) => {
//               if (s3Err) throw s3Err
//               // console.log(`File uploaded successfully at ${data.Location}`)
//               console.log("---------------old------------------------")
//               console.log(store["profile"]["image"]);
//               console.log("--------------------------------------------")
//               store["profile"]["image"] = data1.Location;
//               Store.findOneAndUpdate({ _id: req.params.id }, store, {new: true} ,function (err, store1) {
//                 res.status(200).send({ "success": true, "data": store });
//               });
//             });
//           });
//         } else {
//           // store["profile"]["image"] = "";
//           Store.findOneAndUpdate({ _id: req.params.id }, store, { new: true } , function (err, user) {
//             res.status(200).send({ "success": true, "data": store });
//           });
//         }

//       }
//     });

//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });



// router.delete("/delete/:id", async (req, res, next) => {
//   try {
//     if (await Store.findOne({ _id: req.params.id })) {

//       Store.findOneAndRemove({ _id: req.params.id }, function (error, response) {
//         return res.status(200).send(message.success);
//       });

//     }
//   } catch (err) {
//     return res.status(500).send(message.query_error);
//   }
// });

const install = app => app.use("/api/v1/store", router);

module.exports = {
  install,
  getStorePipeline,
};
