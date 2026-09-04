const QRCode = require('qrcode');

const generateQRCode = async (payload) => {
  try {
    const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(jsonStr, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    throw error;
  }
};

const generateTicketQR = async (bookingCode) => {
  return generateQRCode(bookingCode);
};

module.exports = { generateQRCode, generateTicketQR };
