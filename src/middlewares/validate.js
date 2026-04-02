const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
    const result = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (result.error) {
        const message = result.error.details.map((d) => d.message).join(', ');
        return next(new ApiError(400, message));
    }
    req.body = result.value;
    next();
};

module.exports = validate;
