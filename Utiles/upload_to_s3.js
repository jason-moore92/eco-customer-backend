const AWS = require('aws-sdk');
var fs = require('fs');

const s3 = new AWS.S3({
    accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY
});

const base64ImageUploadToS3 = async (base64, bucketName ,path) => {
    const base64Data = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    
    const type = base64.split(';')[0].split('/')[1];

    const params = {
        Bucket: bucketName, // pass your bucket name
        Key: `${path}.${type}`, // type is not required
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: `image/${type}` // required. Notice the back ticks
    }

    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;
    } catch (error) {
        console.log(error)
    }

    return location;

    // To delete, see: https://gist.github.com/SylarRuby/b3b1430ca633bc5ffec29bbcdac2bd52
}


const pdfUploadToS3 = async (pdfContent, bucketName, path) => {

    const params = {
        Bucket: bucketName, // pass your bucket name
        Key: `${path}.pdf`, // type is not required
        Body: pdfContent,
        ACL: 'public-read',
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
    }

    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;
    } catch (error) {
        console.log(error)
    }

    return location;

    // To delete, see: https://gist.github.com/SylarRuby/b3b1430ca633bc5ffec29bbcdac2bd52
}

const deleteObject = async (bucketName,url) => {
    try {
        console.log(url);
        if (!url) {
            return console.log('No url found to delete 😢');
        }
        // see: https://gist.github.com/SylarRuby/b60eea29c1682519e422476cc5357b60
        console.log("===================delete Start==============================================");
        console.log(url);
        const splitOn = `https://${bucketName.toLowerCase()}.${process.env.AWS_REGION.toLowerCase()}.s3.amazonaws.com/`;
        console.log(splitOn);
        const Key = url.split(splitOn)[0]; // The `${userId}.${type}`
        console.log(Key);
        const params = {
            Bucket: bucketName,
            Key, // required
        };
        const data = await s3.deleteObject(params).promise();
        console.log("---------------  delete s3 Object Success--------------------------");

    } catch (error) {
        console.log("---------------  delete s3 Object error--------------------------");
        console.log(url);
        console.log(error);
    }

    return;
}

module.exports = { base64ImageUploadToS3, pdfUploadToS3, deleteObject};