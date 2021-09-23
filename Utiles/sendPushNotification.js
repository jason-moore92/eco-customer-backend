
const admin = require("./firebase_admin");

const sendMessageToDevice = async (token, title, body, data) => {

    const options = {
        priority: "high",
    };

    const notificationPayload = {
        data: {
            title: title,
            body: body,
            data: data === undefined ? "" : JSON.stringify(data),
        },
    }

    return await admin.messaging().sendToDevice(token, notificationPayload, options)
        // .then(success => {
        //     console.log('____success__device__');
        //     return true;
        // }).catch(error => {
        //     console.log('___failed__________');
        //     console.log(notificationPayload);
        //     console.log(error);
        //     return false;
        // });
}

const sendMessageToTopic = async (topic, title, body, data) => {

    const options = {
        priority: "high",
    };

    const notificationPayload = {
        data: {
            title: title,
            body: body,
            data: data === undefined ? "" : JSON.stringify(data),
        },
    }

   return await admin.messaging().sendToTopic(topic, notificationPayload, options)
        // .then(success => {
        //     console.log('____success____');
        //     console.log(notificationPayload);
        //     return true;
        // }).catch(error => {
        //     console.log('___failed__4444________');
        //     console.log(error);
        //     return false;
        // });
}

module.exports = { sendMessageToDevice, sendMessageToTopic };
