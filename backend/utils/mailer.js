const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Atomic Ops" <noreply@atomicops.com>',
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('[Mailer Error]:', error);
    }
  }

  // Fallback to console mock for development
  console.log(`\n========================================`);
  console.log(`[EMAIL SENT]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Content: ${html}`);
  console.log(`========================================\n`);
  return true;
};

module.exports = { sendEmail, sendMockEmail: sendEmail };
