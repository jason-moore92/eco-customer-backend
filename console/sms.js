
const sms = require('../Utiles/sms');

const handler = async (args = {}) => {

    let {  to = "8008227427", message  } = args;

    if(!message){
        message = "TRADEMANTRI: Your OTP is 9999 and it is valid for another one hour. Do not share this with any one for security reasons";
    }

    let result = await sms.send(to, message);
    return {
        "status": "Success",
        "message": "Console success",
        result
    };
}

module.exports = handler;