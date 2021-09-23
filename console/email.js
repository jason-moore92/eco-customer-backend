
const mailer = require('../Utiles/emailHelper');

const handler = async (args = {}) => {

    const {  to = "pavan@trademantri.com", subject = "Test - sahaya services" } = args;

    let mailResult = await mailer(to, subject, null, "<h2>Dummy text</h2><br><br><p>something</p>");
    return {
        "status": "Success",
        "message": "Console success",
        "mailResult": {
            "envelope": mailResult.envelope,
            "messageId": mailResult.messageId,
            "response": mailResult.response
        }
    };
}

module.exports = handler;