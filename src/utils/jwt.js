const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '30d';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '60d';

const generateToken = (user) => {
    const payload = { id: user._id, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

const generateRefreshToken = (user) => {
    const payload = { id: user._id, role: user.role };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken };
