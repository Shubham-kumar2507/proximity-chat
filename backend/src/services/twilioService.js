const config = require('../config');

let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!config.twilio.accountSid || !config.twilio.authToken) return null;
  // Lazy require so dev works without twilio package install failure in tests
  try {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  } catch {
    console.warn('Twilio SDK not installed. Phone OTP will use dev logs.');
    return null;
  }
  return twilioClient;
}

/**
 * @param {string} phone E.164 format e.g. +14155552671
 * @param {string} message
 */
async function sendSms(phone, message) {
  const client = getTwilioClient();
  if (!client) {
    console.log(`📱 [DEV] SMS to ${phone}: ${message}`);
    return { sid: 'dev-sms', status: 'queued' };
  }
  return client.messages.create({
    body: message,
    from: config.twilio.phoneNumber,
    to: phone,
  });
}

module.exports = { sendSms, getTwilioClient };
