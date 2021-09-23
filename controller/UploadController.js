var Handler = require('../Utiles/Handler')

const express = require("express");
const router = express.Router();
var fs = require('fs-extra');
var formidable = require('formidable');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY
});


router.post('/file_upload_to_s3',  function(req, res, next)  {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var bucketName="";
        var bucketName;
        
        if (fields["bucketName"] == "PROFILE_BUCKET_NAME"){
            bucketName = process.env.PROFILE_BUCKET_NAME;
        } else if (fields["bucketName"] == "ORDER_BUCKET_NAME") {
            bucketName = process.env.ORDER_BUCKET_NAME;
        } else if (fields["bucketName"] == "STORE_PROFILE_BUCKET_NAME") {
            bucketName = process.env.STORE_PROFILE_BUCKET_NAME;
        } else if (fields["bucketName"] == "KYC_DOCS_BUCKET_NAME") {
            bucketName = process.env.KYC_DOCS_BUCKET_NAME;
        } else if (fields["bucketName"] == "BARGAIN_BUCKET_NAME") {
            bucketName = process.env.BARGAIN_BUCKET_NAME;
        } else if (fields["bucketName"] == "REVERSE_AUCTION_BUCKET_NAME") {
            bucketName = process.env.REVERSE_AUCTION_BUCKET_NAME;
        } else if (fields["bucketName"] == "STORE_CONFIG_BUCKET_NAME") {
            bucketName = process.env.STORE_CONFIG_BUCKET_NAME;
        } 
        
        try {
            fs.readFile(files.file.path, (err, data) => {
                if (err) throw err;
                const params = {
                    Bucket: bucketName, // pass your bucket name
                    Key: fields["directoryName"] + files.file.name, // file will be saved as testBucket/contacts.csv
                    Body: data,
                    correctClockSkew: true,
                };
                s3.upload(params, function(s3Err, data) {
                    if (s3Err) throw s3Err
                    // console.log(`File uploaded successfully at ${data.Location}`)
                    res.send(data.Location);
                });
            });
        } catch (err) {
            return next(err);
        }
    });

});



const install = app => app.use("/api/v1/upload", router);

module.exports = {
    install
};
