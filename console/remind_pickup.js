const Order = require("../model/Order");
var message = require('../localization/notification_en.json');
const { sendMessageToDevice } = require('../Utiles/sendPushNotification');
var moment = require("moment");
var handlebars = require('handlebars');
const { getAppUserPushTokens } = require("../Utiles/user_helpers");


/**
 * Remind to pickup if its ready.
 */
const handler = async (args) => {
    console.log("Started: cron-remind-pickup");

    let lastDay = moment().subtract(1, 'day').format('YYYY-MM-DD');
    let last3Day = moment().subtract(3, 'days').format('YYYY-MM-DD');
    let days = [lastDay, last3Day];
    console.log(days)

    let orders = await Order.aggregate([
        {
            "$match": {
                status: "pickup_ready",
                payStatus: true,
                orderType: "Pickup",
            }
        },
        {
            "$addFields": {
                "updatedDate": {
                    "$dateToString": { 
                        "format": "%Y-%m-%d", 
                        "date": "$updatedAt" 
                    } 
                }
            }
        },
        {
            "$match": {
                "updatedDate": {
                    "$in": days
                }
            }

        }
    ]);

    if (orders.length == 0) {
        return { "status": "Success", "message": "No pickup ready orders to send notification." };
    }

    if (orders.length > 500) {
        //TODO:: Invoke same lambda with args like pageNumber or batch,
        return { "status": "Success" };
    }

    let messageContent = message["order"]["pickup_order"]["user"];
    let title = messageContent["title"];
    let bodyTemplate = handlebars.compile(messageContent["body"]);


    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        let tokens = await getAppUserPushTokens(cart.userId);

        let body = bodyTemplate({ orderId: order.orderId, storeName: store.name });

        if (tokens.length != 0) {
            console.log(`Sending: ${title}, ${body} to userId ${order.userId}`);
            await sendMessageToDevice(tokens, title, body, {
                "type": "pickup_order",
                "userId": order.userId,
                "storeId": order.storeId,
            });
        }
    }

    console.log("Completed: cron-remind-pickup");
    return {
        "status": "Success",
        "message": "Notifications sent."
    }
}

module.exports = handler;