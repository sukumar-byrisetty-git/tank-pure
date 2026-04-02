const Joi = require('joi');

const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[!@#$%^&*]/, 'special character')
    .required()
    .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)',
    });

const signupSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: passwordSchema,
    role: Joi.string().valid('customer', 'worker', 'admin', 'superadmin').default('customer'),
    phone: Joi.string().regex(/^\+?[0-9]{9,15}$/).optional().messages({
        'string.pattern.base': 'Phone must be a valid phone number',
    }),
    address: Joi.string().max(500).optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
    token: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

module.exports = {
    signupSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
