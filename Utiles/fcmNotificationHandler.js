var message = require('../localization/notification_en.json');
const { addNotification } = require('../controller/NotificationController');
const { getFCMTokenByStoreUserId } = require('../controller/PushSubscriptionController');
const { sendMessageToDevice, sendMessageToTopic } = require('./sendPushNotification');
const User = require("../model/AppUser");
const Store = require("../model/Store");
const DeliveryUser = require("../model/DeliveryUser");
const { isNull } = require('lodash');

var fcmNotificationHandler = async (notiType, status, userId, storeId, data) => {
    try {
        var user;
        if (userId !== ""  )  { 
            user = await User.findById(userId);
        }

        var store;
        if (storeId !== "") {
            store = await Store.findById(storeId);
        }

        console.log("--------     fcmNotificationHandler start " + status+"    ------");
        
        var userMessageData = message[notiType][status]["user"];
        var storeMessageData = message[notiType][status]["store"];
        var deliveryUserMessageData = message[notiType][status]["delivery-user"];

        if (userMessageData !== undefined) {
            userMessageData = JSON.parse(JSON.stringify(message[notiType][status]["user"]));
            if (notiType == "order" && status == "reward_point_earned") {
                userMessageData.body = userMessageData.body.replace("rewardPointsEarnedPerOrder", data["rewardPointsEarnedPerOrder"]);
            }
            if (notiType === "reverse_auction") {
                userMessageData.body = userMessageData.body.replace("reverseAuctionId", data["reverseAuctionId"]);
            }
            if (notiType === "bargain") {
                userMessageData.body = userMessageData.body.replace("bargainRequestId", data["bargainRequestId"]);
            }
            if (notiType === "order") {
                userMessageData.body = userMessageData.body.replace("orderId", data["orderId"]);
            }

            if (notiType === "referral_rewardpoint") {
                userMessageData.body = userMessageData.body.replace("referralUserAmount", data["referralUserAmount"]);
                userMessageData.body = userMessageData.body.replace("referralUserRewardPoints", data["referralUserRewardPoints"]);
                userMessageData.body = userMessageData.body.replace("referredByUserAmount", data["referredByUserAmount"]);
                userMessageData.body = userMessageData.body.replace("referredByUserRewardPoints", data["referredByUserRewardPoints"]);
            }
            if (!isNull(store) && store !== undefined) { 
                userMessageData.body = userMessageData.body.replace("store_name", store["name"]);
            }
            if (!isNull(user) && user !== undefined) {
                userMessageData.body = userMessageData.body.replace("user_name", user["firstName"] + " " + user["lastName"]);
            }
        }

        if (storeMessageData !== undefined) {
            storeMessageData = JSON.parse(JSON.stringify(message[notiType][status]["store"]));
            if (notiType == "order" && status == "reward_point_earned") {
                storeMessageData.body = storeMessageData.body.replace("rewardPointsEarnedPerOrder", data["rewardPointsEarnedPerOrder"]);
            }
            if (notiType === "reverse_auction") {
                storeMessageData.body = storeMessageData.body.replace("reverseAuctionId", data["reverseAuctionId"]);
            }
            if (notiType === "bargain") {
                storeMessageData.body = storeMessageData.body.replace("bargainRequestId", data["bargainRequestId"]);
            }
            if (notiType === "order") {
                storeMessageData.body = storeMessageData.body.replace("orderId", data["orderId"]);
            }

            if (notiType === "job_posting" && !isNull(user) && user !== undefined) {
                storeMessageData.body = storeMessageData.body.replace("applicant_name", user["firstName"] + " " + user["lastName"]);
            }

            if (!isNull(store) && store !== undefined) {
                storeMessageData.body = storeMessageData.body.replace("store_name", store["name"]);
            }
            if (!isNull(user) && user !== undefined) {
                storeMessageData.body = storeMessageData.body.replace("user_name", user["firstName"] + " " + user["lastName"]);
            }

        }

        if (deliveryUserMessageData !== undefined) {
            deliveryUserMessageData = JSON.parse(JSON.stringify(message[notiType][status]["delivery-user"]));
            
            if (notiType === "reverse_auction") {
                deliveryUserMessageData.body = deliveryUserMessageData.body.replace("reverseAuctionId", data["reverseAuctionId"]);
            }
            if (notiType === "bargain") {
                deliveryUserMessageData.body = deliveryUserMessageData.body.replace("bargainRequestId", data["bargainRequestId"]);
            }
            if (notiType === "order") {
                deliveryUserMessageData.body = deliveryUserMessageData.body.replace("orderId", data["orderId"]);
            }

            if (!isNull(store) && store !== undefined) {
                deliveryUserMessageData.body = deliveryUserMessageData.body.replace("store_name", store["name"]);
            }
            if (!isNull(user) && user !== undefined) {
                deliveryUserMessageData.body = deliveryUserMessageData.body.replace("user_name", user["firstName"] + " " + user["lastName"]);
            }

        }

        /// user notification part
        if (userMessageData !== undefined) {
            console.log("================ user messsage ================");
            var tokens = [];
            for (let index = 0; index < user.status.length; index++) {
                var element = user.status[user.status.length - 1 - index];
                if (!isNull(element["fcmToken"]) && element["fcmToken"] !== undefined && element["fcmToken"] !== "") {
                    tokens.push(element["fcmToken"]);
                } else {
                    console.log("====user=====" + element["fcmToken"] + "=============");
                }
            }
            if (tokens.length!=0){
                await sendMessageToDevice(tokens, userMessageData.title, userMessageData.body, {
                    "type": notiType,
                    "data": data,
                    "userId": userId,
                    "storeId": storeId,
                });
            }
            
        }

        /// store notification part
        if (storeMessageData !== undefined) {
            console.log("================ store messsage ================");
            var tokens = [];
            for (let i = 0; i < store["representatives"].length; i++) {
                var storeUserId = store["representatives"][i];
                var storeTokenData = await getFCMTokenByStoreUserId(storeUserId);
                if (storeTokenData.length !== 0) {
                    for (let index = 0; index < storeTokenData.length; index++) {
                        var tokenData = storeTokenData[storeTokenData.length - 1 - index];
                        if (!isNull(tokenData["token"]) && tokenData["token"] !== undefined && tokenData["token"] !== "") {
                            tokens.push(tokenData["token"]);
                        } else { 
                            console.log("=====store====" + tokenData["token"]+"=============");

                        }
                    }
                }
            }
            if (tokens.length != 0) {
                await sendMessageToDevice(tokens, storeMessageData.title, storeMessageData.body, {
                    "type": notiType,
                    "data": data,
                    "userId": userId,
                    "storeId": storeId,
                });
            }
        }

        /// delivery user notification part
        if (deliveryUserMessageData !== undefined) {
            console.log("================ delivery messsage ================");
            if (status === "delivery_ready" && !isNull(data["deliveryPartnerDetails"]) && data["deliveryPartnerDetails"] !== undefined ) { 
                var deliveryUsers = await DeliveryUser.find();

                for (let index = 0; index < deliveryUsers.length; index++) {
                    var deliveryUser = deliveryUsers[deliveryUsers.length - 1 - index];

                    if (isNull(deliveryUser["deliveryPartnerIds"]) || deliveryUser["deliveryPartnerIds"] == undefined) continue;

                    if (!deliveryUser["deliveryPartnerIds"].includes(data["deliveryPartnerDetails"]["deliveryPartnerId"]))
                        continue;

                    var tokens = [];
                    for (let index = 0; index < deliveryUser.status.length; index++) {
                        var element = deliveryUser.status[deliveryUser.status.length - 1 - index];
                        if (!isNull(element["fcmToken"]) && element["fcmToken"] !== undefined && element["fcmToken"] !== "") {
                            tokens.push(element["fcmToken"]);
                        } else {
                            console.log("===delivery======" + element["fcmToken"] + "=============");
                        }
                    }
                    if (tokens.length != 0) {
                        await sendMessageToDevice(tokens, userMessageData.title, userMessageData.body, {
                            "type": notiType,
                            "data": data,
                            "userId": userId,
                            "storeId": storeId,
                        });
                    }
                }
            }

            // sendMessageToTopic(
            //     "delivery-user",
            //     deliveryUserMessageData.title,
            //     deliveryUserMessageData.body,
            //     {
            //         "type": notiType,
            //         "orderStatus": "delivery_ready",
            //         "data": data,
            //         "userId": userId,
            //         "storeId": storeId,
            //     },
            // );
        }
    } catch (error) {
        console.log("--------     fcmNotificationHandler error     ------");
        console.log(error);
        console.log("------------------------------------------");
    }
    console.log("--------     fcmNotificationHandler end     ------");
}

module.exports = fcmNotificationHandler;
