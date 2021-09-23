const message = require('../localization/notification_en.json');
const { addNotification } = require('../controller/NotificationController');
const { addDeliveryUserNotification } = require('../controller/DeliveryUserNotificationController');

const notificationDBHandler = async (notiType, status, userId, storeId, data) => {
    console.log("--------     notificationDBHandler start     ------");

    try {
        var userMessageData = message[notiType][status]["user"];
        var storeMessageData = message[notiType][status]["store"];
        var deliveryUserMessageData = message[notiType][status]["delivery-user"];
        data["userId"] = userId;
        data["storeId"] = storeId;

        if (userMessageData !== undefined) {
            userMessageData = JSON.parse(JSON.stringify(message[notiType][status]["user"]));
            if (notiType == "order" && status == "reward_point_earned") {
                userMessageData.body = userMessageData.body.replace("rewardPointsEarnedPerOrder", data["rewardPointsEarnedPerOrder"]);
            }
            
            await addNotification(
                userId,
                "",
                notiType,
                data,
                userMessageData.title,
                userMessageData.body
            );
        }

        if (storeMessageData !== undefined) {
            storeMessageData = JSON.parse(JSON.stringify(message[notiType][status]["store"]));
            if (notiType == "order" && status == "reward_point_earned") {
                storeMessageData.body = storeMessageData.body.replace("rewardPointsEarnedPerOrder", data["rewardPointsEarnedPerOrder"]);
            }
            await addNotification(
                "",
                storeId,
                notiType,
                data,
                storeMessageData.title,
                storeMessageData.body
            );
        }

        if (deliveryUserMessageData !== undefined) {
            deliveryUserMessageData = JSON.parse(JSON.stringify(message[notiType][status]["delivery-user"]));

            if (status === "delivery_ready" && !isNull(data["deliveryPartnerDetails"]) && data["deliveryPartnerDetails"] !== undefined) {
                    var deliveryUsers = await DeliveryUser.find();

                for (let index = 0; index < deliveryUsers.length; index++) {
                    var deliveryUser = deliveryUsers[index];

                    if (isNull(deliveryUser["deliveryPartnerIds"]) || deliveryUser["deliveryPartnerIds"] == undefined) continue;

                    if (!deliveryUser["deliveryPartnerIds"].includes(data["deliveryPartnerDetails"]["deliveryPartnerId"]))
                        continue;
                    
                    await addDeliveryUserNotification(
                        data["deliveryUserId"],
                        notiType,
                        data,
                        deliveryUserMessageData.title,
                        deliveryUserMessageData.body
                    );
                }
            }

            // await addDeliveryUserNotification(
            //     data["deliveryUserId"],
            //     notiType,
            //     data,
            //     deliveryUserMessageData.title,
            //     deliveryUserMessageData.body
            // );
        }
    } catch (error) {
        console.log("--------     notificationDBHandler error     ------");
        console.log(error);
        console.log("------------------------------------------");
    }
    console.log("--------     notificationDBHandler end     ------");
}

module.exports = notificationDBHandler;
