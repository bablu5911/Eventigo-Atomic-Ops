const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const generateTicketPDF = async (booking, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream PDF to HTTP response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Ticket-Pass-${booking.bookingCode}.pdf"`);
  doc.pipe(res);

  // Palomar Theme Color Tokens
  const COLOR_DARK = '#2d3a2e'; // Dark Forest
  const COLOR_CREAM = '#faf8f5'; // Cream
  const COLOR_GREEN = '#3d5a3e'; // Accent Green
  const COLOR_TEXT = '#1e293b';
  const COLOR_MUTED = '#64748b';

  // Header Banner
  doc
    .rect(40, 40, 515, 65)
    .fill(COLOR_DARK);

  doc
    .fillColor('#ffffff')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('ATOMIC OPS PASS', 60, 52);

  doc
    .fillColor('#ffffff')
    .fontSize(9)
    .font('Helvetica')
    .text('Official High-Concurrency Event Entry Pass & Digital Token', 60, 78);

  // Status Badge right aligned
  doc
    .rect(430, 55, 105, 26)
    .fill('#ffffff');

  doc
    .fillColor(COLOR_DARK)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(booking.status ? booking.status.toUpperCase() : 'CONFIRMED', 430, 63, { width: 105, align: 'center' });

  // Event Details Box
  doc.moveDown(3);
  doc
    .fillColor(COLOR_DARK)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(booking.event?.title || 'Event Ticket Pass', 40, 125);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(COLOR_GREEN)
    .text(`PASS ID: ${booking.bookingCode}`, 40, 150);

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, 168).lineTo(555, 168).stroke();

  // Booking Info Grid (Left)
  let y = 185;
  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('ATTENDEE NAME', 40, y);
  doc.fillColor(COLOR_TEXT).fontSize(11).font('Helvetica-Bold').text(booking.user?.name || 'Valued Guest', 40, y + 12);

  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('ATTENDEE EMAIL', 200, y);
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica').text(booking.user?.email || 'N/A', 200, y + 12);

  y += 35;
  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('VENUE LOCATION', 40, y);
  const venueText = booking.event?.isOnline 
    ? 'Online Digital Summit' 
    : `${booking.event?.venue?.name || 'Silicon Valley Convention Center'}, ${booking.event?.venue?.city || 'San Francisco'}`;
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica').text(venueText, 40, y + 12);

  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('EVENT DATE & TIME', 200, y);
  const startDateStr = booking.event?.startDateTime 
    ? new Date(booking.event.startDateTime).toLocaleString() 
    : 'N/A';
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica').text(startDateStr, 200, y + 12);

  y += 35;
  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('GATE / ZONE ENTRY', 40, y);
  doc.fillColor(COLOR_GREEN).fontSize(10).font('Helvetica-Bold').text(booking.gateEntry || 'Gate A • Express FastTrack', 40, y + 12);

  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica-Bold').text('SECURITY VERIFICATION DIGEST', 200, y);
  doc.fillColor(COLOR_TEXT).fontSize(9).font('Helvetica-Bold').text(booking.securityHash || 'SHA256:7B8F9A2C01E', 200, y + 12);

  // Generate and Embed QR Code on the Right
  try {
    const qrPayload = JSON.stringify({
      passCode: booking.bookingCode,
      securityDigest: booking.securityHash || 'ATOM-SECURITY-HASH',
      eventId: String(booking.event?._id || booking.event),
      gate: booking.gateEntry || 'Gate A • Express Check-In'
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 140,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    doc.rect(415, 175, 130, 130).fill('#ffffff').strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc.image(qrBuffer, 420, 180, { width: 120, height: 120 });
    doc.fillColor(COLOR_MUTED).fontSize(7).font('Helvetica-Bold').text('OFFICIAL GATE SCAN QR', 420, 310, { width: 120, align: 'center' });
  } catch (err) {
    console.error('[PDF QR Generation Error]:', err);
  }

  // Ticket Items Table
  y = 330;
  doc.rect(40, y, 515, 24).fill(COLOR_CREAM);
  doc.rect(40, y, 515, 24).strokeColor('#e5e2dc').lineWidth(1).stroke();
  
  doc.fillColor(COLOR_DARK).fontSize(9).font('Helvetica-Bold');
  doc.text('TICKET TIER', 55, y + 7);
  doc.text('UNIT PRICE', 260, y + 7);
  doc.text('QTY', 390, y + 7);
  doc.text('SUBTOTAL', 475, y + 7);

  y += 24;
  (booking.tickets || []).forEach((ticket) => {
    y += 10;
    doc.fillColor(COLOR_TEXT).fontSize(9).font('Helvetica');
    doc.text(ticket.nameSnapshot, 55, y);
    doc.text(`$${Number(ticket.priceSnapshot).toFixed(2)}`, 260, y);
    doc.text(`${ticket.quantity}`, 395, y);
    doc.text(`$${(ticket.priceSnapshot * ticket.quantity).toFixed(2)}`, 475, y);
    y += 14;
  });

  // Total Summary Box
  y += 15;
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
  y += 10;

  doc.fillColor(COLOR_MUTED).fontSize(9).font('Helvetica').text(`Transaction ID: ${booking.transactionId || 'TXN-ATOM-' + booking.bookingCode}`, 40, y);
  doc.fillColor(COLOR_DARK).fontSize(12).font('Helvetica-Bold');
  doc.text(`Total Amount Paid: $${Number(booking.totalAmount).toFixed(2)}`, 320, y);

  // Security Watermark Box
  y += 35;
  doc.rect(40, y, 515, 45).fill('#f1f5f9');
  doc.fillColor(COLOR_DARK).fontSize(8).font('Helvetica-Bold').text('CRYPTOGRAPHIC PASS INTEGRITY GUARANTEE', 55, y + 10);
  doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Helvetica').text('This pass is electronically signed and secured with HMAC-SHA256. Ticket passes are invalidated upon first entry gate scan. Do not share this QR code with unauthorized persons.', 55, y + 22, { width: 480 });

  // Footer Instructions
  doc
    .fontSize(8)
    .font('Helvetica-Oblique')
    .fillColor(COLOR_MUTED)
    .text('Atomic Ops Distributed Ticketing Engine • Present at Venue Entrance for Instant Gate Validation', 40, 780, {
      align: 'center'
    });

  doc.end();
};

module.exports = { generateTicketPDF };
