const pdf = require('html-pdf');

const pdfToBuffer = (invoiceHtml, options) => {
    return new Promise((resolve, reject) => {
        pdf.create(invoiceHtml, options).toBuffer((err, pdfBuffer) => {
            if(err){
                reject(err);
            }
            resolve(pdfBuffer);
        });
    });
}

const pdfToFile = (invoiceHtml, options, filePath) => {
    return new Promise((resolve, reject) => {
        pdf.create(invoiceHtml, options).toFile(filePath, (err, pdfData) => {
            if(err){
                reject(err);
            }
            resolve(pdfData);
        });
    });
}

module.exports = {
    pdfToBuffer,
    pdfToFile
}