const Joi = require('joi');

const createReviewSchema = Joi.object({
    bookingId: Joi.string().required(),
    workerId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().optional().allow(''),
});

module.exports = { createReviewSchema };
