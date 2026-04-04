const nodemailer = require('nodemailer');

// Configure the SMTP transporter to connect to a local server without authentication
// We default to port 1025 which is standard for testing tools like Mailpit or MailHog.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT, 10) || 1025,
  secure: false, // true for 465, false for other ports
  ignoreTLS: true,
  // Notice there's no 'auth' section, as requested for local testing
});

/**
 * Sends an email using the unauthenticated local SMTP server.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @returns {Promise<any>}
 */
async function sendEmail(to, subject, text, html = '') {
  try {
    const info = await transporter.sendMail({
      from: '"Vivid Logic System" <noreply@vividlogic.local>',
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  transporter,
  sendEmail
};
