/**
 * Regex pattern to detect GPS coordinates in messages.
 * Matches patterns like: 40.7128, -74.0060 or 40.7128°N 74.0060°W
 * Also matches decimal degrees with high precision that likely represent coordinates.
 */
const COORDINATE_PATTERNS = [
  // Standard lat,lng format: 40.7128, -74.0060
  /[-+]?\d{1,3}\.\d{4,},\s*[-+]?\d{1,3}\.\d{4,}/g,
  // Degree format: 40.7128°N
  /\d{1,3}\.\d{3,}°[NSEW]/gi,
  // DMS format: 40°42'46"N
  /\d{1,3}°\d{1,2}['′]\d{1,2}["″][NSEW]/gi,
  // Google Maps style: @40.7128,-74.0060
  /@[-+]?\d{1,3}\.\d{4,},[-+]?\d{1,3}\.\d{4,}/g,
  // Plus codes
  /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}/g,
];

/**
 * Check if a message contains GPS coordinates
 * @param {string} content - Message content to check
 * @returns {boolean} - True if coordinates detected
 */
function containsCoordinates(content) {
  if (!content || typeof content !== 'string') return false;
  return COORDINATE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(content);
  });
}

/**
 * Calculate approximate distance string from H3 cells
 * @param {string} h3Index1 - First H3 index
 * @param {string} h3Index2 - Second H3 index
 * @returns {string} - Fuzzy distance string
 */
function getFuzzyDistance(h3Index1, h3Index2) {
  const h3 = require('h3-js');
  try {
    const gridDistance = h3.gridDistance(h3Index1, h3Index2);
    if (gridDistance === 0) return '~50m';
    if (gridDistance === 1) return '~150m';
    if (gridDistance === 2) return '~300m';
    if (gridDistance === 3) return '~450m';
    return '~500m+';
  } catch {
    return '~500m';
  }
}

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get age range string from age
 * @param {number} age
 * @returns {string}
 */
function getAgeRange(age) {
  if (age < 20) return '18-19';
  if (age < 25) return '20-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  return '40+';
}

module.exports = {
  containsCoordinates,
  getFuzzyDistance,
  generateOTP,
  isValidEmail,
  getAgeRange,
};
