const Joi = require('joi');

const createBookingSchema = Joi.object({
    tankId: Joi.string().required(),
    date: Joi.date().required(),
    address: Joi.string().min(5).required(),
    notes: Joi.string().allow('', null),
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'assigned', 'in_progress', 'completed', 'verified').required(),
    beforeImages: Joi.array().items(Joi.string().uri()).optional(),
    afterImages: Joi.array().items(Joi.string().uri()).optional(),
});

module.exports = { createBookingSchema, updateStatusSchema };
