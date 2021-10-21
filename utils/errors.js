const responseCodes = require('./responseCodes');

class HttpError extends Error {

    constructor({statusCode, message, name, data}) {
        super();

        this.statusCode = statusCode;
        this.name = name;
        this.message = message;
        this.data = data;
    }
}

class HttpBadRequest extends HttpError {
    constructor(data) {
        super({statusCode: responseCodes.BAD_REQUEST, message: "Bad Request", name: "HttpBadRequest", data});
    }
}

class HttpNotFound extends HttpError {
    constructor(data) {
        super({statusCode: responseCodes.NOT_FOUND, message: "Not Found", name: "HttpNotFound", data});
    }
}

class HttpInternalServerError extends HttpError {
    constructor(data) {
        super({statusCode: responseCodes.INTERNAL_SERVER_ERROR, message: "Internal Server Error", name: "HttpInternalServerError", data});
    }
}

module.exports = {HttpError, HttpBadRequest, HttpNotFound, HttpInternalServerError};