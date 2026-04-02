const Joi = require('joi');

const addTankSchema = Joi.object({
    type: Joi.string().required(),
    capacity: Joi.number().positive().required(),
    lastCleanedAt: Joi.date().required(),
    nextDueDate: Joi.date().required(),
    location: Joi.string().optional(),
});

module.exports = { addTankSchema };
