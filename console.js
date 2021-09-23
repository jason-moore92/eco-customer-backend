require("dotenv").config();
const minimist = require('minimist');
const consoleSetup = require("./console/setup");

const mongoose = require("./middlewares/mongo/mongoose");

mongoose.connect().then((client) => {
    console.log("Connected to db");
});


const run = async () => {
    let cmd = "test";
    let  args = minimist(process.argv.slice(2));

    if(args["_"] && args["_"].length){
        cmd = args["_"][0];
    }
    
    let event = {
        cmd,
        args: args
    };

    let result = await consoleSetup(event);
    console.log( JSON.stringify(result,null,10));
}

/**
 * Crons list
 * 1. cron-remind-accepted-payments
 * 2. cron-remind-pickup
 */

run()
    .catch((err) => {
        console.error(err)
    }).finally(() => {
        process.exit();
    });
