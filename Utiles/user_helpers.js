const AppUser = require("../model/AppUser")
const { isNull } = require('lodash');

//TODO:: cache results
const getAppUserPushTokens = async (userId) => {
    let user = await AppUser.findOne({
        _id: userId
    });

    return extractTokens(user);
}

const extractTokens = (user) => {
    let tokens = [];

    for (let index = 0; index < user.status.length; index++) {
        var element = user.status[user.status.length - 1 - index];
        if (!isNull(element["fcmToken"]) && element["fcmToken"] !== "") {
            tokens.push(element["fcmToken"]);
        }
    }

    return tokens;
}

module.exports = {
    getAppUserPushTokens,
    extractTokens
}