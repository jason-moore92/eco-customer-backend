var message = require('../localization/en.json');

module.exports = function (err,req,res, next) {
    try {
        if (err.type && err.type == "ICICI_exception") {
            return res.send(err.metadata);
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log(err);
        }
        if (err.code == undefined) {
            err.code = 500;
            err.message = message.apiError;
        }
        // Sends error to user
        res.status(500).json({
            "success": false,
            "message": message.apiError
        })
    } catch (error) {
        res.status(500).json({
            "success": false,
            "message": message.apiError
        })
    }
    
}