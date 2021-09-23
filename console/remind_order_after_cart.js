const Cart = require("../model/Cart");
var message = require('../localization/notification_en.json');
const { sendMessageToDevice } = require('../Utiles/sendPushNotification');
var moment = require("moment");
var handlebars = require('handlebars');
const { getAppUserPushTokens } = require("../Utiles/user_helpers");


/**
 * Remind user that he has added cart items but not ordered.
 */
const handler = async (args) => {
    console.log("Started: cron-remind-order-after-cart");
    let lastDay = moment().subtract(1, 'day').format('YYYY-MM-DD');
    let last3Day = moment().subtract(3, 'days').format('YYYY-MM-DD');
    let days = [lastDay, last3Day];
    console.log(days)

    //Note:: updatedAt is any one of today-1 and today-3

    let carts = await Cart.aggregate([
        {
            "$match": {
                status: "",
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

    if (carts.length == 0) {
        return { "status": "Success", "message": "No carts to send notification." };
    }

    let messageContent = message["order"]["make_order_after_cart"]["user"];
    let title = messageContent["title"];
    let body = messageContent["body"];

    for (let i = 0; i < carts.length; i++) {
        const cart = carts[i];
        let tokens = await getAppUserPushTokens(cart.userId);

        if (tokens.length != 0) {
            console.log(`Sending: ${title}, ${body} to userId ${cart.userId}`);
            await sendMessageToDevice(tokens, title, body, {
                "type": "make_order",
                "userId": cart.userId,
                "storeId": cart.storeId,
            });
        }
    }

    console.log("Completed: cron-remind-order-after-cart");
    return {
        "status": "Success",
        "message": "Notifications sent."
    }
}

module.exports = handler;