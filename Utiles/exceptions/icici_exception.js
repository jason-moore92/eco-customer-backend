function ICICIException(message, metadata) {
    const error = new Error(message);
    error.type = "ICICI_exception";
    error.metadata = metadata;
    return error;
}

ICICIException.prototype = Object.create(Error.prototype);
module.exports = ICICIException;