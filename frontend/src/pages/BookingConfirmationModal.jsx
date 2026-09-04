import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThermalTicketPrinter from '../components/ThermalTicketPrinter';

/**
 * BookingConfirmationModal
 * Wraps ThermalTicketPrinter to display physical thermal receipt ticket
 * after checkout or on booking confirmation.
 */
export default function BookingConfirmationModal({ isOpen, onClose, booking }) {
  const navigate = useNavigate();

  if (!isOpen || !booking) return null;

  return (
    <ThermalTicketPrinter
      booking={booking}
      onFinish={() => {
        if (onClose) onClose();
        navigate('/my-bookings');
      }}
      onClose={onClose}
    />
  );
}
