import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import './ConfirmationPage.css';

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(res => { setBooking(res.data.booking); setLoading(false); })
      .catch(() => { setError('Booking not found.'); setLoading(false); });
  }, [bookingId]);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  if (error || !booking) return (
    <div className="container" style={{padding:'60px 20px', textAlign:'center'}}>
      <h2>{error}</h2>
      <Link to="/movies" className="btn btn-primary" style={{marginTop:'16px'}}>Browse Movies</Link>
    </div>
  );

  const isConfirmed = booking.booking_status === 'confirmed';

  return (
    <div className="confirmation-page container">
      <div className="confirmation-card card">
        {isConfirmed ? (
          <div className="success-icon">✅</div>
        ) : (
          <div className="error-icon">❌</div>
        )}
        <h1 className="conf-title">
          {isConfirmed ? 'Booking Confirmed!' : 'Booking Not Confirmed'}
        </h1>
        <p className="conf-subtitle text-muted">
          {isConfirmed
            ? 'Your tickets have been booked successfully.'
            : `Booking status: ${booking.booking_status}`
          }
        </p>

        {isConfirmed && (
          <div className="ticket">
            <div className="ticket-header">
              <span className="ticket-brand">🎬 CineBookie</span>
              <span className="badge badge-confirmed">Confirmed</span>
            </div>

            <div className="ticket-main">
              <h2 className="ticket-movie">{booking.movie_title}</h2>
              <div className="ticket-details">
                <div className="ticket-row">
                  <span className="ticket-label">Booking ID</span>
                  <span className="ticket-value ticket-ref">{booking.booking_ref}</span>
                </div>
                <div className="ticket-row">
                  <span className="ticket-label">Theatre</span>
                  <span className="ticket-value">{booking.theatre_name}, {booking.city}</span>
                </div>
                <div className="ticket-row">
                  <span className="ticket-label">Screen</span>
                  <span className="ticket-value">{booking.screen_name}</span>
                </div>
                <div className="ticket-row">
                  <span className="ticket-label">Date & Time</span>
                  <span className="ticket-value">
                    {new Date(booking.show_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{formatTime(booking.show_time)}
                  </span>
                </div>
                <div className="ticket-row">
                  <span className="ticket-label">Seats</span>
                  <span className="ticket-value seats-list">
                    {booking.seats && booking.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
                  </span>
                </div>
                <div className="ticket-row">
                  <span className="ticket-label">Booked By</span>
                  <span className="ticket-value">{booking.user_name}</span>
                </div>
              </div>
            </div>

            <div className="ticket-footer">
              <div className="ticket-amount">
                <span className="ticket-label">Total Paid</span>
                <span className="ticket-price text-primary">₹{parseFloat(booking.total_amount).toFixed(2)}</span>
              </div>
              <div className="ticket-barcode">||||||||||||||||||||</div>
            </div>
          </div>
        )}

        <div className="conf-actions">
          <Link to="/bookings" className="btn btn-secondary">View All Bookings</Link>
          <Link to="/movies" className="btn btn-primary">Book More Tickets</Link>
        </div>
      </div>
    </div>
  );
}
