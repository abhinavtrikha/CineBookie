import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './ReviewPage.css';

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingReviewPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(res => { setBooking(res.data.booking); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.error || 'Booking not found.');
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading booking...</p></div>;
  if (error || !booking) return (
    <div className="container" style={{padding:'60px 20px', textAlign:'center'}}>
      <h2>{error || 'Booking not found'}</h2>
    </div>
  );

  return (
    <div className="review-page container">
      <div className="review-card card">
        <h1 className="review-title">Review Your Booking</h1>
        <p className="text-muted" style={{marginBottom:'28px'}}>Please review your booking details before proceeding to payment.</p>

        <div className="review-section">
          <h3 className="review-section-title">Movie Details</h3>
          <div className="review-row">
            <span className="review-label">Movie</span>
            <span className="review-value">{booking.movie_title}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Language</span>
            <span className="review-value">{booking.language}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Genre</span>
            <span className="review-value">{booking.genre}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="review-section">
          <h3 className="review-section-title">Show Details</h3>
          <div className="review-row">
            <span className="review-label">Theatre</span>
            <span className="review-value">{booking.theatre_name}, {booking.city}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Screen</span>
            <span className="review-value">{booking.screen_name}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Date</span>
            <span className="review-value">
              {new Date(booking.show_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="review-row">
            <span className="review-label">Time</span>
            <span className="review-value">{formatTime(booking.show_time)}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="review-section">
          <h3 className="review-section-title">Seats</h3>
          <div className="review-seats">
            {booking.seats.map(seat => (
              <div key={`${seat.row_label}${seat.seat_number}`} className="seat-chip">
                <span className="seat-chip-label">{seat.row_label}{seat.seat_number}</span>
                <span className="seat-chip-type">{seat.seat_type}</span>
                <span className="seat-chip-price">₹{parseFloat(seat.price).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="review-total">
          <span>Total Amount</span>
          <span className="total-amount text-primary">₹{parseFloat(booking.total_amount).toFixed(2)}</span>
        </div>

        <div className="alert alert-info" style={{marginTop:'20px'}}>
          <strong>Booking ID:</strong> {booking.booking_ref}<br/>
          <strong>Status:</strong> Pending payment
        </div>

        <div className="review-actions">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/bookings/${bookingId}/pay`)}
          >
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
