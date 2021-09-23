const express = require("express");
const router = express.Router();
var Handler = require('../Utiles/Handler');
const ScratchCard = require("../model/ScratchCard");
const ScratchCardValues = require("../model/ScratchCardValues");
const auth = require("../middlewares/auth");
const { convert, transact } = require("../Utiles/rewardPoints");
const { trademantriStore } = require("../Utiles/store");

router.post("/getAll/", auth, async (req, res, next) => {
  const params = req.params;
  try {
    const {page = 1, limit = 50} = params;
    let loggedInUserId = req.currentUserId;

    let scratchCards = await ScratchCard.find({
      userId: loggedInUserId
    }, null, {
        page, limit
    });

    return res.status(200).send({ "data": scratchCards });
  
  } catch (err) {
    return next(err);
  }
});

router.get("/stats/", auth, async (req, res, next) => {
  const params = req.params;
  try {
    let loggedInUserId = req.currentUserId;

    let scratchCards = await ScratchCard.find({
      userId: loggedInUserId
    });

    //TODO:: rather using collection here use 4 agg queries to get stats.
    let stats = {
      total: scratchCards.length,
      scratched: scratchCards.filter(s => s.status === 'scratched').length,
      not_scratched: scratchCards.filter(s => s.status === 'not_scratched').length,
      total_amount: scratchCards.filter(s => s.status === 'scratched').map(s => s.amount).reduce((a,b) => a+b, 0)
    };
    
    return res.status(200).send({ "data": stats });
  
  } catch (err) {
    return next(err);
  }
});

router.get("/details/", auth, async (req, res, next) => {
  const params = req.query;
  try {
    const {scratchCardId, orderId} = params;
    let loggedInUserId = req.currentUserId;

    if(!scratchCardId && !orderId){
      return res.status(422).send({ "message": "Either scratchCardId or orderId is required." });
    }

    let scratchCard;

    if(scratchCardId){
      scratchCard = await ScratchCard.findOne({
        userId: loggedInUserId,
        _id: scratchCardId
      });  
    }

    if(orderId){
      scratchCard = await ScratchCard.findOne({
        userId: loggedInUserId,
        orderId: orderId
      });  
    }

    if(!scratchCard){
      return res.status(422).send({ "message": "Entity not present."})

    }
    return res.status(200).send({ "data": scratchCard });
  
  } catch (err) {
    return next(err);
  }
});

router.post("/update/", auth, async (req, res, next) => {
  const params = req.body;
  try {
    const { scratchCardId, orderId} = params;

    if (!scratchCardId && !orderId) {
      return res.status(422).send({ "message": "Either scratchCardId or orderId is required." });
    }

    params["updatedAt"] = Date.now();

    var updatedScratchCard = await ScratchCard.findByIdAndUpdate(params["_id"],  params, { new: true })
    return res.status(200).send({ "success": true, "data": updatedScratchCard });


  } catch (err) {
    return next(err);
  }
});

router.get("/scratch/:scratchCardId", auth, async (req, res, next) => {
  const params = req.params;
  try {
    const {scratchCardId} = params;
    let loggedInUserId = req.currentUserId;

    if(!scratchCardId){
      return res.status(422).send({ "success": false, "message": "ScratchCardId is required." });
    }

    let scratchCard = await ScratchCard.findOne({
      userId: loggedInUserId,
      _id: scratchCardId
    });

    if(!scratchCard){
      return res.status(422).send({ "success": false,"message": "Entity not present."})
    }

    if(scratchCard.status === 'scratched'){
      return res.status(422).send({
        "success": true, "message": "This card is already scratched.",
        "data": scratchCard,
     })
    }


    //TODO:: once again check if connected order is completed or not.
    let updatedScratchCard ;

    if(!scratchCard.scratchCardConfigId){
      //Means:: amout zero fixed due to over limit for the user.
      updatedScratchCard = await ScratchCard.findByIdAndUpdate(scratchCard.id, {
        status: "scratched"
       }, {new: true})
      return res.status(200).send({ "success": true,"data": updatedScratchCard });
    }

    let scratchCardValue = await ScratchCardValues.findOne({
      scratchCardConfigId: scratchCard.scratchCardConfigId,
      used: false
    }, null, {
      sort: {
        createdAt: 'desc'
      }
    })

    console.log(scratchCardValue)
    let store = await trademantriStore();

    if(scratchCardValue){
      await ScratchCardValues.findByIdAndUpdate(scratchCardValue._id, {
        used: true
      });


      let points = await convert(store._id, scratchCardValue.amount, 'redeem', 'rewardPoints');
  
      updatedScratchCard = await ScratchCard.findByIdAndUpdate(scratchCard._id, {
        scratchCardValueId: scratchCardValue.id,
        amount: scratchCardValue.amount,
        amountInPoints: points,
        status: "scratched"
       }, {new: true});
    }
    else{
      updatedScratchCard = await ScratchCard.findByIdAndUpdate(scratchCard._id, {
        amount: 0,
        amountInPoints: 0,
        status: "scratched"
       }, {new: true});
    }

    if(updatedScratchCard && updatedScratchCard.amountInPoints){
      let tranDetails = {
        title : "Scratch Card Points Earned",
        body : `You earned ${updatedScratchCard.amountInPoints} reward points for scratch card gifted for order number ${updatedScratchCard.orderId}`,
        createAt : Date.now(),
        rewardPoints : updatedScratchCard.amountInPoints,
        type : "Allocated"
      };
      await transact(tranDetails, loggedInUserId,  store._id);
    }

    return res.status(200).send({ "success": true,"data": updatedScratchCard });
  
  } catch (err) {
    return next(err);
  }
});

const install = app => app.use("/api/v1/scratch_card", router);

module.exports = {
  install
};
