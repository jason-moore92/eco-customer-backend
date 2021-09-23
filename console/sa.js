
// const serviceAccount = require('../serviceAccountKey.json');
const serviceAccount = {};

const handler = async (args = {}) => {
    let data = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');
    return {
        "status": "Success",
        "message": "Console success",
        data
    };
}

module.exports = handler;