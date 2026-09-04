const bookingService = require('../services/bookingService');
const { generateTicketPDF } = require('../utils/pdfGenerator');

const createBooking = async (req, res) => {
  const result = await bookingService.createBooking(req.user.id, req.body);
  const bookingObj = result.booking && result.booking.toObject ? result.booking.toObject() : { ...result.booking };
  bookingObj.qrCodeUrl = result.qrCodeUrl;
  res.status(201).json({
    success: true,
    booking: bookingObj,
    qrCodeUrl: result.qrCodeUrl
  });
};

const getUserBookings = async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.id);
  res.status(200).json({
    success: true,
    bookings
  });
};

const getBookingById = async (req, res) => {
  const result = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    booking: result.booking,
    qrCodeUrl: result.qrCodeUrl
  });
};

const downloadTicketPDF = async (req, res) => {
  const result = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
  await generateTicketPDF(result.booking, res);
};

const cancelBooking = async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    booking
  });
};

const verifyCheckIn = async (req, res) => {
  const { bookingCode, eventId, admitCount } = req.body;
  const result = await bookingService.verifyCheckIn(bookingCode, req.user.id, req.user.role, eventId, admitCount);
  res.status(200).json({
    success: true,
    message: result.alreadyAttended ? 'Pass already attended' : 'Check-in verified successfully',
    booking: result,
    result: result
  });
};

const processEarlyExit = async (req, res) => {
  const { bookingCode, eventId, exitCount, minutesEarly } = req.body;
  const result = await bookingService.processEarlyExit(
    bookingCode,
    req.user.id,
    req.user.role,
    eventId,
    exitCount,
    minutesEarly
  );
  res.status(200).json({
    success: result.success || result.valid,
    result
  });
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  downloadTicketPDF,
  cancelBooking,
  verifyCheckIn,
  processEarlyExit
};
