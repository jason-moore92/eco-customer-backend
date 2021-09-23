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
    const { discountCode = "DISCOUNT150" } = args;

    let from = moment("2021-08-01");
    from.startOf('hour').format();
    let to = moment("2021-08-09");
    to.endOf('hour').format();

    let users = await AppUser.find({
        created_at: {
            "$gte": from,
            "$lt": to
        }
    });
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
            continue;
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

    return {
        "status": "Success",
        "message": `Notifications sent to ${users.length}.`
    }
}

module.exports = handler;