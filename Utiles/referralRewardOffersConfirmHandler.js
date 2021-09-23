const { addNotification } = require('../controller/NotificationController');
const { getFCMTokenByStoreUserId } = require('../controller/PushSubscriptionController');
const { sendMessageToDevice, sendMessageToTopic } = require('./sendPushNotification');
const User = require("../model/AppUser");
const Store = require("../model/Store");
const DeliveryUser = require("../model/DeliveryUser");
const { isNull } = require('lodash');
const ReferralRewardOffers = require("../model/ReferralRewardOffers");
const ReferralRewardOffersForStore = require("../model/ReferralRewardOffersForStore");
const RewardPointHistory = require("../model/RewardPointHistory");
const StoreRewardPointHistory = require("../model/StoreRewardPointHistory");
var fcmNotificationHandler = require('../Utiles/fcmNotificationHandler');
var notificationDBHandler = require('../Utiles/notificationDBHandler');
var notificaionString = require('../localization/notification_en.json');
const rewardPointUtils = require("../Utiles/rewardPoints");
const rewardPointStoreUtils = require("../Utiles/rewardPointsStore");
const storeUtils = require("../Utiles/store");

const referralRewardOffersConfirmHandler = async (referralUserId, referralOfferType) => {
    try {
        var referralRewardOffers = await ReferralRewardOffers.findOne({
            referralUserId: referralUserId,
            status: "pending",
        });
        if (referralRewardOffers) {
            var status = "pending";
            if (referralRewardOffers["referralOfferType"] == referralOfferType) {
                status = "confirmed";
            }

            await ReferralRewardOffers.findByIdAndUpdate(referralRewardOffers["_id"], {
                status: status,
                isReferralUserRegistred: true,
                isReferralLoggedIn: referralOfferType === "SignUpAndLogin" || referralOfferType === "SignUpAndFirstOrder" ? true : false,
                isReferralMadeFirstOrder: referralOfferType === "SignUpAndFirstOrder" ? true : false,
            });

            if (status == "pending") return;

            let tmStoreId = await storeUtils.ensureStoreId();

            var userMessageData = notificaionString["referral_rewardpoint"]["referred_for_friend"]["user"];
            var title = userMessageData["title"];
            var body = userMessageData["body"];
            body = body.replace("referralUserAmount", referralRewardOffers["referralUserAmount"]);
            body = body.replace("referralUserRewardPoints", referralRewardOffers["referralUserRewardPoints"]);
            body = body.replace("referredByUserAmount", referralRewardOffers["referredByUserAmount"]);
            body = body.replace("referredByUserRewardPoints", referralRewardOffers["referredByUserRewardPoints"]);

            let tranDetails = {
                title: title,
                body: body,
                createAt: Date.now(),
                rewardPoints: referralRewardOffers["referredByUserRewardPoints"],
                type: "Allocated", //previously it was "Referral Reward Points",
            };
            await rewardPointUtils.transact(tranDetails, referralRewardOffers["referredByUserId"], tmStoreId);
            //////////////////////////////////////

            /// referralUserId reward point handerler

            userMessageData = notificaionString["referral_rewardpoint"]["referral_for_friend"]["user"];
            title = userMessageData["title"];
            body = userMessageData["body"];
            body = body.replace("referralUserAmount", referralRewardOffers["referralUserAmount"]);
            body = body.replace("referralUserRewardPoints", referralRewardOffers["referralUserRewardPoints"]);
            body = body.replace("referredByUserAmount", referralRewardOffers["referredByUserAmount"]);
            body = body.replace("referredByUserRewardPoints", referralRewardOffers["referredByUserRewardPoints"]);

            tranDetails = {
                title: title,
                body: body,
                createAt: Date.now(),
                rewardPoints: referralRewardOffers["referralUserRewardPoints"],
                type: "Allocated", //previously it was "Referral Reward Points",
            };
            await rewardPointUtils.transact(tranDetails, referralRewardOffers["referralUserId"], tmStoreId);
            //////////////////////////////////////

            /// notification handler
            await fcmNotificationHandler(
                "referral_rewardpoint", // notiType
                "referred_for_friend", // status
                referralRewardOffers["referredByUserId"], // userId
                "", // storeId
                referralRewardOffers, // data
            );

            await fcmNotificationHandler(
                "referral_rewardpoint", // notiType
                "referral_for_friend", // status
                referralRewardOffers["referralUserId"], // userId
                "", // storeId
                referralRewardOffers, // data
            );

            await notificationDBHandler(
                "referral_rewardpoint", // notiType
                "referred_for_friend", // status
                referralRewardOffers["referredByUserId"], // userId
                "", // storeId
                referralRewardOffers, // data
            );

            await notificationDBHandler(
                "referral_rewardpoint", // notiType
                "referral_for_friend", // status
                referralRewardOffers["referralUserId"], // userId
                "", // storeId
                referralRewardOffers, // data
            );
        }
    } catch (error) {
        console.log("========= referralRewardOffersConfirmHandler error ===================");
        console.log(error);
    }

};

const referralRewardOffersConfirmForStoreHandler = async (id, storeId, referralOfferType, referredBy) => {
    try {
        console.log("============ referralRewardOffersConfirmForStoreHandler ================");
        console.log(id);
        console.log(storeId);
        console.log(referralOfferType);
        console.log(referredBy);
        console.log("======================================");
        var referralRewardOffersForStore;
        if (!isNull(id) && id !== undefined) {
            referralRewardOffersForStore = await ReferralRewardOffersForStore.findById(id);
        } else {
            referralRewardOffersForStore = await ReferralRewardOffersForStore.findOne({ storeId: storeId, referredBy: referredBy });
        }

        console.log(referralRewardOffersForStore);
        console.log("======================================");
        if (!isNull(referralRewardOffersForStore) && referralRewardOffersForStore !== undefined && referralRewardOffersForStore["status"] === "pending") {
            var status = "pending";
            if (referralRewardOffersForStore["referralOfferType"] == referralOfferType) {
                status = "confirmed";
            }

            await ReferralRewardOffersForStore.findByIdAndUpdate(referralRewardOffersForStore["_id"], {
                storeId: storeId,
                status: status,
                isReferralUserRegistred: true,
                isReferralLoggedIn: referralOfferType === "SignUpAndLogin" || referralOfferType === "SignUpAndFirstOrder" ? true : false,
                isReferralMadeFirstOrder: referralOfferType === "SignUpAndFirstOrder" ? true : false,
            });

            if (status == "pending") return true;

            let tmStoreId = await storeUtils.ensureStoreId();

            /// referredByUserId reward point handerler

            var userMessageData = notificaionString["referral_rewardpoint"]["referred_for_store"]["user"];
            var title = userMessageData["title"];
            var body = userMessageData["body"];
            body = body.replace("referralUserAmount", referralRewardOffersForStore["referralUserAmount"]);
            body = body.replace("referralUserRewardPoints", referralRewardOffersForStore["referralUserRewardPoints"]);
            body = body.replace("referredByUserAmount", referralRewardOffersForStore["referredByUserAmount"]);
            body = body.replace("referredByUserRewardPoints", referralRewardOffersForStore["referredByUserRewardPoints"]);

           let  tranDetails = {
                title: title,
                body: body,
                createAt: Date.now(),
                rewardPoints: referralRewardOffersForStore["referredByUserRewardPoints"],
                type: "Allocated", //previously it was "Referral Reward Points",
            };
            await rewardPointUtils.transact(tranDetails, referralRewardOffersForStore["referredByUserId"], tmStoreId);
            //////////////////////////////////////

            /// store reward point handerler


            userMessageData = notificaionString["referral_rewardpoint"]["referral_for_store"]["store"];
            title = userMessageData["title"];
            body = userMessageData["body"];
            body = body.replace("referralUserAmount", referralRewardOffersForStore["referralUserAmount"]);
            body = body.replace("referralUserRewardPoints", referralRewardOffersForStore["referralUserRewardPoints"]);
            body = body.replace("referredByUserAmount", referralRewardOffersForStore["referredByUserAmount"]);
            body = body.replace("referredByUserRewardPoints", referralRewardOffersForStore["referredByUserRewardPoints"]);

             tranDetails = {
                title: title,
                body: body,
                createAt: Date.now(),
                rewardPoints: referralRewardOffersForStore["referralUserRewardPoints"],
                type: "Allocated", //previously it was "Referral Reward Points",
            };
            await rewardPointStoreUtils.transact(tranDetails, tmStoreId, storeId);
            //////////////////////////////////////

            /// notification handler
            await fcmNotificationHandler(
                "referral_rewardpoint", // notiType
                "referred_for_store", // status
                referralRewardOffersForStore["referredByUserId"], // userId
                storeId, // storeId
                referralRewardOffersForStore, // data
            );

            await fcmNotificationHandler(
                "referral_rewardpoint", // notiType
                "referral_for_store", // status
                "", // userId
                storeId, // storeId
                referralRewardOffersForStore, // data
            );

            await notificationDBHandler(
                "referral_rewardpoint", // notiType
                "referred_for_store", // status
                referralRewardOffersForStore["referredByUserId"], // userId
                storeId, // storeId
                referralRewardOffersForStore, // data
            );

            await notificationDBHandler(
                "referral_rewardpoint", // notiType
                "referral_for_store", // status
                "", // userId
                storeId, // storeId
                referralRewardOffersForStore, // data
            );
        }
        return true;
    } catch (error) {
        console.log("========= referralRewardOffersConfirmHandler error ===================");
        console.log(error);
        return false;
    }

};

module.exports = { referralRewardOffersConfirmHandler, referralRewardOffersConfirmForStoreHandler };
