const test = require("./test");
const remindAcceptedPayments = require("./remind_accepted_payments");
const remindPickup = require("./remind_pickup");
const remindOrderAfterCart = require("./remind_order_after_cart");
const remindOrderAfterRegister = require("./remind_order_after_register");
const remindOrderAfterRegisterPast = require("./remind_order_after_register_past");
const icici = require("./icici");
const iciciFT = require("./icici_ft");
const syncUser = require("./sync_user");
const dynamicLinks = require("./dynamic_links");
const email = require("./email");
const sms = require("./sms");
const sa = require("./sa");

const setup = async (event, context) => {
    let consoleResult = null;
    //TODO:: before cron execute.

    if(event.resources && event.resources[0] && event.source == "aws.events"){
        if (event.resources[0].includes('cron-test')) {
            consoleResult = await test();
        }
    
        if (event.resources[0].includes('cron-remind-accepted-payments')) {
            consoleResult = await remindAcceptedPayments();
        }
    
        if (event.resources[0].includes('cron-remind-pickup')) {
            consoleResult = await remindPickup();
        }
        
        if (event.resources[0].includes('cron-remind-order-after-cart')) {
            consoleResult = await remindOrderAfterCart();
        }

        if (event.resources[0].includes('cron-remind-order-after-register')) {
            consoleResult = await remindOrderAfterRegister();
        }
    }

    if(event.cmd){
        if(event.cmd == "test"){
            consoleResult = await test(event.args);
        }
        if (event.cmd == "remind-accepted-payments") {
            consoleResult = await remindAcceptedPayments();
        }
    
        if (event.cmd == "remind-pickup") {
            consoleResult = await remindPickup();
        }
        
        if (event.cmd == "remind-order-after-cart") {
            consoleResult = await remindOrderAfterCart();
        }

        if (event.cmd == "remind-order-after-register") {
            consoleResult = await remindOrderAfterRegister();
        }

        if (event.cmd == "remind-order-after-register-past") {
            consoleResult = await remindOrderAfterRegisterPast();
        }

        if (event.cmd == "icici") {
            consoleResult = await icici();
        }

        if (event.cmd == "icici_ft") {
            consoleResult = await iciciFT();
        }

        if (event.cmd == "sync_user") {
            consoleResult = await syncUser(event.args);
        }

        if (event.cmd == "dynamic_links") {
            consoleResult = await dynamicLinks(event.args);
        }

        if (event.cmd == "email") {
            consoleResult = await email(event.args);
        }

        if (event.cmd == "sms") {
            consoleResult = await sms(event.args);
        }

        if (event.cmd == "sa") {
            consoleResult = await sa(event.args);
        }
    }

    //TODO:: after cron execute.

    return consoleResult;
}

module.exports = setup;