const sendMockEmail = async ({ to, subject, html }) => {
  console.log(`\n========================================`);
  console.log(`[MOCK EMAIL SENT]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Content Snippet: ${html.substring(0, 120)}...`);
  console.log(`========================================\n`);
  return true;
};

module.exports = { sendMockEmail };
