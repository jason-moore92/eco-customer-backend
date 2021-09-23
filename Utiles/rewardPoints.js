
const RewardPointHistory = require("../model/RewardPointHistory");
const RewardPoint = require("../model/RewardPoint");
const storeUtils = require("./store")


const ensureWallet = async (userId, storeId) => {
    storeId = await storeUtils.ensureStoreId(storeId);

    let wallet = await RewardPointHistory.findOne({
        userId: userId,
        storeId: storeId,
    })

    if(!wallet){
        wallet = await RewardPointHistory.create({
            userId: userId,
            storeId: storeId,
            rewardPoints: 0,
            history: []
        });
    }
    return wallet;
}

const transact = async (tranDetails,userId,storeId) => {

    let wallet = await ensureWallet(userId, storeId);

    if(!tranDetails.rewardPoints){
        return;
    }

    let newRewardPoints = wallet.rewardPoints;
    let newHistory = wallet.history;

    if(tranDetails.type === 'Allocated'){
        newRewardPoints = newRewardPoints + tranDetails.rewardPoints;
    }

    if(tranDetails.type === 'Redeemed' || tranDetails.type === 'Cancelled' || tranDetails.type === 'Rejected'){
        newRewardPoints = newRewardPoints - tranDetails.rewardPoints;
    }

    if(wallet.rewardPoints == newRewardPoints){
        return;
    }

    newHistory.push(tranDetails);

    return await RewardPointHistory.findOneAndUpdate({
        userId: wallet.userId,
        storeId: wallet.storeId
    }, {
        rewardPoints: newRewardPoints,
        history: newHistory
    },  {new: true});
}

const refund = async (tranDetails,userId,storeId) => {

    let wallet = await ensureWallet(userId, storeId);

    if(!tranDetails.rewardPoints){
        return;
    }

    let newRewardPoints = wallet.rewardPoints;
    let newHistory = wallet.history;

    if(tranDetails.type === 'Allocated'){
        newRewardPoints = newRewardPoints - tranDetails.rewardPoints;
    }

    if(tranDetails.type === 'Redeemed' || tranDetails.type === 'Cancelled' || tranDetails.type === 'Rejected'){
        newRewardPoints = newRewardPoints + tranDetails.rewardPoints;
    }

    if(wallet.rewardPoints == newRewardPoints){
        return;
    }

    newHistory.push(tranDetails);

    return await RewardPointHistory.findOneAndUpdate({
        userId: wallet.userId,
        storeId: wallet.storeId
    }, {
        rewardPoints: newRewardPoints,
        history: newHistory
    },  {new: true});
}

const convert = async (storeId, amount, usage = 'redeem', to = 'rewardPoints') => {

    let rewardPoint = await RewardPoint.findOne({
        storeId: storeId
    });

    let config = rewardPoint[usage];

    let configRewardPoints = config.rewardPoints;
    let configValue = config.value;

    if(to == 'value'){
        return (amount * configValue) /configRewardPoints;
    }

    if(to == 'rewardPoints'){
        return (amount * configRewardPoints) /configValue;
    }
}

module.exports = {
    ensureWallet,
    transact,
    refund,
    convert
}