const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY
});

const pdfUploadToS3 = async (pdfContent, bucketName ,path) => {

    const params = {
        Bucket: bucketName, // pass your bucket name
        Key: `${path}.pdf`, // type is not required
        Body: pdfContent,
        ACL: 'public-read',
        ContentType :'application/pdf',
        ContentDisposition : 'inline',
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

module.exports = pdfUploadToS3;