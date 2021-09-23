var admin = require("firebase-admin");

let serviceAccount  = Buffer.from(process.env.FIREBASE_SA, 'base64').toString();

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount))
});

module.exports = admin;