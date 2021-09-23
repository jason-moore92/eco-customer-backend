const moment = require("moment");

const handler = async (args) => {
    console.log(args);
    console.log(moment());
    return {
        "status": "Success",
        "message": "Console success"
    };
}

module.exports = handler;