
const StoreRewardPointHistory = require("../model/StoreRewardPointHistory");
const storeUtils = require("./store")


const ensureWallet = async (senderId, receiverId) => {
    senderId = await storeUtils.ensureStoreId(senderId);
    receiverId = await storeUtils.ensureStoreId(receiverId);

    let wallet = await StoreRewardPointHistory.findOne({
        sendStoreId: senderId,
        receiveStoreId: receiverId,
    })

    if(!wallet){
        wallet = await StoreRewardPointHistory.create({
            sendStoreId: senderId,
            receiveStoreId: receiverId,
            rewardPoints: 0,
            history: []
        });
    }
    return wallet;
}

const transact = async (tranDetails,senderId,receiverId) => {

    let wallet = await ensureWallet(senderId, receiverId);

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

    return await StoreRewardPointHistory.findOneAndUpdate({
        sendStoreId: wallet.sendStoreId,
        receiveStoreId: wallet.receiveStoreId
    }, {
        rewardPoints: newRewardPoints,
        history: newHistory
    },  {new: true});
}

const refund = async (tranDetails,senderId,receiverId) => {

    let wallet = await ensureWallet(senderId, receiverId);

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

    return await StoreRewardPointHistory.findOneAndUpdate({
        sendStoreId: wallet.sendStoreId,
        receiveStoreId: wallet.receiveStoreId
    }, {
        rewardPoints: newRewardPoints,
        history: newHistory
    },  {new: true});
}


module.exports = {
    ensureWallet,
    transact,
    refund
}