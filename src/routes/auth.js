const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
    signup,
    login,
    refreshSession,
    logout,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const {
    signupSchema,
    loginSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require('../validators/authValidator');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many password reset requests from this IP, please try again later',
});

router.post('/signup', validate(signupSchema), signup);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshSession);
router.post('/logout', auth, logout);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
