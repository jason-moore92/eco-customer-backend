var nodemailer = require('nodemailer');
let aws = require("@aws-sdk/client-ses");
const EmailHistory = require("../model/EmailHistory")


const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY    
    }
});


const prepareTransport = () => {
    const smtpTransport = nodemailer.createTransport({
        SES: { ses, aws },
    });

    return smtpTransport;
}

const checkToAddress = async (mailAddress) => {

    let history = await EmailHistory.findOne({
        email: mailAddress,
        type: {
            $in: ["Bounce", "Complaint"]
        }
    });

    return !history;
}

module.exports = async (toMail, subject, text, html, attachments) => {

    let canSend = await checkToAddress(toMail);

    if(!canSend){
        console.log("Sending mail to bounced address", {
            toMail, subject
        });
        return "Bounced mail address";
    }

    var smtpTrans = prepareTransport();

    let mailOptions = {};

    if (html) {

        mailOptions = {
            to: toMail,
            from: process.env["SENDER_EMAIL_ADDRESS"],
            subject: subject,
            html: html,
            attachments: attachments
        };

    }

    if (text) {
        mailOptions = {
            to: toMail,
            from: process.env["SENDER_EMAIL_ADDRESS"],
            subject: subject,
            text: text

        };
    }

    return new Promise(
        (resolve, reject) => {
            smtpTrans.sendMail(mailOptions, function (err, info) {
                if (err) {
                    reject(err)
                }
                resolve(info);
            });
        }
    );
}
