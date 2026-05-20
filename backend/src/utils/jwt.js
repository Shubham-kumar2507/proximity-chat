const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const JWT_SECRET = config.jwtSecret;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * @param {{userId: string, email: string}} payload
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign({ ...payload, tokenType: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * @param {{userId: string, email: string}} payload
 * @returns {{token: string, jti: string}}
 */
function generateRefreshToken(payload) {
  const jti = uuidv4();
  const token = jwt.sign({ ...payload, tokenType: 'refresh', jti }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { token, jti };
}

/**
 * @param {string} token
 * @returns {any}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyAccessToken(token) {
  const decoded = verifyToken(token);
  if (decoded.tokenType !== 'access') throw new Error('Invalid access token');
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = verifyToken(token);
  if (decoded.tokenType !== 'refresh') throw new Error('Invalid refresh token');
  return decoded;
}

function getRefreshKey(userId, jti) {
  return `refresh:${userId}:${jti}`;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshKey,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
  generateToken: generateAccessToken,
};
