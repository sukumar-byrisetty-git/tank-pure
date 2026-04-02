const ApiError = require('../utils/apiError');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const ROLES = require('../constants/roles');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const createSessionTokens = async (user) => {
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ token: refreshTokenHash });
    await user.save();

    return { accessToken, refreshToken };
};

const signup = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
        logger.warn('Signup failed: duplicate email', { email });
        throw new ApiError(409, 'Email already registered');
    }

    if (role === ROLES.SUPERADMIN) {
        throw new ApiError(403, 'Cannot sign up as superadmin via public endpoint');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, phone, address });

    const { accessToken, refreshToken } = await createSessionTokens(user);
    logger.info('New user signed up', { id: user._id, email: user.email, role: user.role });

    res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: { accessToken, refreshToken },
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password refreshTokens');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new ApiError(401, 'Invalid credentials');

    const { accessToken, refreshToken } = await createSessionTokens(user);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: { accessToken, refreshToken } });
};

const refreshSession = async (req, res) => {
    const { token } = req.body;
    if (!token) throw new ApiError(400, 'Refresh token is required');

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch (err) {
        logger.warn('Invalid refresh token', err);
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(payload.id).select('+refreshTokens');
    if (!user) throw new ApiError(401, 'Invalid refresh token');

    const foundIndex = await Promise.all(user.refreshTokens.map(async (rt) => ({
        match: await bcrypt.compare(token, rt.token),
        id: rt._id,
    }))).then((items) => items.find((i) => i.match));

    if (!foundIndex) {
        throw new ApiError(401, 'Invalid refresh token');
    }

    // rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((rt) => rt._id.toString() !== foundIndex.id.toString());
    const { accessToken, refreshToken } = await createSessionTokens(user);
    res.json({ accessToken, refreshToken });
};

const logout = async (req, res) => {
    const { token } = req.body;
    if (!token) throw new ApiError(400, 'Refresh token is required');

    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (!user) throw new ApiError(401, 'Not authenticated');

    const remainingTokens = [];
    for (const rt of user.refreshTokens) {
        const match = await bcrypt.compare(token, rt.token);
        if (!match) remainingTokens.push(rt);
    }

    user.refreshTokens = remainingTokens;
    await user.save();

    res.json({ message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({ message: 'If the email exists, a reset token has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save();

    logger.info('Password reset token created', { userId: user._id });
    return res.json({ message: 'Password reset token generated', resetToken });
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new ApiError(400, 'Token and new password required');

    const candidates = await User.find({ passwordResetExpires: { $gt: Date.now() } }).select('+passwordResetToken');
    let user = null;
    for (const candidate of candidates) {
        if (candidate.passwordResetToken && await bcrypt.compare(token, candidate.passwordResetToken)) {
            user = candidate;
            break;
        }
    }

    if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ message: 'Password reset successful' });
};

module.exports = { signup, login, refreshSession, logout, forgotPassword, resetPassword };
