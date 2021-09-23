const Order = require("../model/Order");
const AppUser = require("../model/AppUser");
var message = require('../localization/notification_en.json');
const { sendMessageToDevice } = require('../Utiles/sendPushNotification');
const { getAppUserPushTokens } = require("../Utiles/user_helpers");
var moment = require("moment");
const { isNull } = require('lodash');
var handlebars = require('handlebars');


/**
 * remind to payment after accepted.
 */
const handler = async (args) => {
    console.log("Started: cron-remind-accepted-payments");
    let lastDay = moment().subtract(1, 'day').format('YYYY-MM-DD');
    let last3Day = moment().subtract(3, 'days').format('YYYY-MM-DD');
    let days = [lastDay, last3Day];
    console.log(days)

    let orders = await Order.aggregate([
        {
            "$match": {
                status: "order_accepted",
                payStatus: false,
                payAtStore: false,
                cashOnDelivery: false,
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
        return { "status": "Success", "message": "No accepted non-paid orders to send notification." };
    }

    if (orders.length > 500) {
        //TODO:: Invoke same lambda with args like pageNumber or batch,
        return { "status": "Success" };
    }

    let messageContent = message["order"]["order_pay"]["user"];
    let title = messageContent["title"];
    let bodyTemplate = handlebars.compile(messageContent["body"]);

    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        let tokens = await getAppUserPushTokens(order.userId);

        let body = bodyTemplate({ orderId: order.orderId });

        if (tokens.length != 0) {
            console.log(`Sending: ${title}, ${body} to userId ${order.userId}`);
            await sendMessageToDevice(tokens, title, body, {
                "type": "order_pay",
                "userId": order.userId,
                "storeId": order.storeId,
            });
        }
    }

    console.log("Completed: cron-remind-accepted-payments");
    return {
        "status": "Success",
        "message": "Notifications sent."
    }
}

module.exports = handler;