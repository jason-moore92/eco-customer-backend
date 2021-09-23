const AppUser = require("../model/AppUser");
const Order = require("../model/Order");
var message = require('../localization/notification_en.json');
const { sendMessageToDevice } = require('../Utiles/sendPushNotification');
var moment = require("moment");
var handlebars = require('handlebars');
const { getAppUserPushTokens } = require("../Utiles/user_helpers");


/**
 * Remind user that he has added cart items but not ordered.
 */
const handler = async (args = {}) => {
    console.log("Started: cron-remind-order-after-register");

    const { discountCode = "DISCOUNT150" } = args;
    // register next day and 2 days next

    let lastDay = moment().subtract(1, 'day').format('YYYY-MM-DD');
    let last3Day = moment().subtract(3, 'days').format('YYYY-MM-DD');
    let days = [lastDay, last3Day];
    console.log(days)

    let users = await AppUser.aggregate([
        {
            "$addFields": {
                "createdDate": {
                    "$dateToString": { 
                        "format": "%Y-%m-%d", 
                        "date": "$created_at" 
                    } 
                }
            }
        },
        {
            "$match": {
                "createdDate": {
                    "$in": days
                },
                // "email": "katakampavan.btech@gmail.com"
            }

        }
    ]);
    //TODO:: Need to optimize the query with itself getting the orders count zero users.

    if (users.length == 0) {
        return { "status": "Success", "message": "No users to send notification." };
    }

    let messageContent = message["order"]["make_order_after_register"]["user"];
    let title = messageContent["title"];
    let bodyTemplate = handlebars.compile(messageContent["body"]);

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        let ordersCount = await Order.where("userId", user._id).count();
        if(ordersCount >= 1){
            return;
        }
        let tokens = await getAppUserPushTokens(user._id);
        let body = bodyTemplate({ discountCode });

        if (tokens.length!=0){
            console.log(`Sending: ${title}, ${body} to userId ${user._id}`);
            await sendMessageToDevice(tokens, title, body, {
                "type": "make_order",
                "userId": user._id
            });
        }
    }

    console.log("Completed: cron-remind-order-after-register");
    return {
        "status": "Success",
        "message": `Notifications sent to ${users.length}.`
    }
}

module.exports = handler;