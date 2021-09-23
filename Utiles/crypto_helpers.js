const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
var aesjs = require('aes-js');

const encryptWithRsaPublicKey = async (toEncrypt, pathOrENV, isFile = false) => {
    let publicKey;
    if (isFile) {
        const absolutePath = path.resolve(pathOrENV);
        publicKey = fs.readFileSync(absolutePath, "utf8");
    } else {
        publicKey = Buffer.from(process.env[pathOrENV], 'base64')
    }
    const buffer = Buffer.from(toEncrypt);
    const encrypted = crypto.publicEncrypt({
        key: publicKey.toString(),
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString("base64");
};

const decryptWithRsaPrivateKey = async (toDecrypt, pathOrENV, isFile = false) => {
    let privateKey;
    if (isFile) {
        const absolutePath = path.resolve(pathOrENV);
        privateKey = fs.readFileSync(absolutePath, "utf8");
    } else {
        privateKey = Buffer.from(process.env[pathOrENV], 'base64')
    }
    const buffer = Buffer.from(toDecrypt, "base64");
    const decrypted = crypto.privateDecrypt({
        key: privateKey.toString(),
        passphrase: "",
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return decrypted.toString("utf8");
};

const encryptAES = async (data, key, iv) => {
    key = Buffer.from(key);
    iv = Buffer.from(iv);
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv.slice(0, 16));
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

const decryptAES = async (encrypted, key, iv) => {
    key = Buffer.from(key);

    if (!iv) {

        // const aescbc = new aesjs.ModeOfOperation.cbc(aesjs.utils.utf8.toBytes(key), "");
        // let _decryptedText = aescbc.decrypt(Buffer.from(encrypted, "base64"));
        // _decryptedText = aesjs.utils.utf8.fromBytes(_decryptedText);
        // var start = _decryptedText.indexOf(':');
        // _decryptedText = _decryptedText.substr(start,  _decryptedText.length);
        // _decryptedText = '{"success"' + _decryptedText;
        // let _decryptedJson = JSON.stringify(_decryptedText)
        // _decryptedJson = JSON.stringify(_decryptedText.split(/\r/).join("").split(/\n/).join("").split(/\t/).join("").split("\u0006").join("").split(" ").join("").split("\u000f").join("").split("\u0002").join(""));
        // _decryptedJson = JSON.parse(JSON.parse(_decryptedJson).toString())

        const aescbc = new aesjs.ModeOfOperation.cbc(aesjs.utils.utf8.toBytes(key), "");
        let _decryptedText = aescbc.decrypt(Buffer.from(encrypted, "base64"));
        _decryptedText = aesjs.utils.utf8.fromBytes(_decryptedText);
        var start = _decryptedText.indexOf(':');
        _decryptedText = _decryptedText.substr(start,  _decryptedText.length);
        _decryptedText = '{"success"' + _decryptedText;
        var end = _decryptedText.indexOf('}');
        _decryptedText = _decryptedText.substr(0,  end+1);
        let _decryptedJson = JSON.stringify(_decryptedText)
        _decryptedJson = JSON.stringify(_decryptedText.split(/\r/).join("").split(/\n/).join("").split(/\t/).join("").split("\u0006").join("").split(" ").join("").split("\u000f").join("").split("\u0002").join(""));
        _decryptedJson = JSON.parse(JSON.parse(_decryptedJson).toString())

        return JSON.stringify(_decryptedJson); //Note:: this is because we are parsing at using level
    }
    iv = Buffer.from(iv);

    const cipher = crypto.createDecipheriv('aes-128-cbc', key, iv.slice(0, 16));
    let decrypted = cipher.update(encrypted);
    decrypted += cipher.final();
    return decrypted;
}

const generateCryptoRandom = async (size = 16) => {
    return new Promise((resolve, reject) => {
        crypto.pseudoRandomBytes(size, (err, dataBuffer) => {
            if (err) {
                reject(err);
            }
            resolve(dataBuffer.toString('hex'));
        });
    });
}

module.exports = {
    encryptWithRsaPublicKey,
    decryptWithRsaPrivateKey,
    encryptAES,
    decryptAES,
    generateCryptoRandom
}