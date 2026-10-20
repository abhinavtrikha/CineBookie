import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import './ReviewPage.css';

function formatTime(timeStr) {
  if (!timeStr) return '';
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

  // Promo code state
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then(res => {
        setBooking(res.data.booking);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Booking reservation not found.');
        setLoading(false);
      });
  }, [bookingId]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (code === 'CINE50') {
      const disc = Math.round(parseFloat(booking.total_amount) * 0.5);
      setDiscount(disc);
      setCouponSuccess('CINE50 applied: 50% discount!');
    } else if (code === 'FLAT50') {
      const disc = Math.min(50, parseFloat(booking.total_amount));
      setDiscount(disc);
      setCouponSuccess('FLAT50 applied: ₹50 discount!');
    } else {
      setCouponError('Invalid promo code. Try CINE50 or FLAT50.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>{error || 'Booking not found'}</h2>
        <Link to="/movies" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Movies
        </Link>
      </div>
    );
  }

  const baseAmount = parseFloat(booking.total_amount);
  const finalAmount = Math.max(0, baseAmount - discount);

  return (
    <div className="review-page container">
      <div className="review-card card">
        {/* Step Progression Bar */}
        <div className="step-bar">
          <div className="step-item completed">
            <span className="step-circle"><Icon name="check" size={15} /></span>
            <span className="step-text">Seats</span>
          </div>
          <div className="step-line active" />
          <div className="step-item active">
            <span className="step-circle">2</span>
            <span className="step-text">Review</span>
          </div>
          <div className="step-line" />
          <div className="step-item">
            <span className="step-circle">3</span>
            <span className="step-text">Payment</span>
          </div>
          <div className="step-line" />
          <div className="step-item">
            <span className="step-circle">4</span>
            <span className="step-text">Ticket</span>
          </div>
        </div>

        <h1 className="review-title">Review Your Reservation</h1>
        <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.92rem' }}>
          Please verify your cinema, showtime, and seat details before confirming payment.
        </p>

        {/* Film & Theatre Section */}
        <div className="review-section">
          <h3 className="review-section-title">Film & Screening</h3>
          <div className="review-row">
            <span className="review-label">Movie Title</span>
            <span className="review-value" style={{ fontWeight: 800 }}>{booking.movie_title}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Language & Format</span>
            <span className="review-value">{booking.language} · {booking.genre} · 2D</span>
          </div>
          <div className="review-row">
            <span className="review-label">Cinema Multiplex</span>
            <span className="review-value">{booking.theatre_name}, {booking.city}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Auditorium / Screen</span>
            <span className="review-value">{booking.screen_name}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Date & Time</span>
            <span className="review-value" style={{ color: 'var(--color-primary-light)' }}>
              {new Date(booking.show_date).toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
              })} · {formatTime(booking.show_time)}
            </span>
          </div>
        </div>

        <div className="divider" />

        {/* Selected Seats Section */}
        <div className="review-section">
          <h3 className="review-section-title">Reserved Seats ({booking.seats ? booking.seats.length : 0})</h3>
          <div className="review-seats">
            {booking.seats && booking.seats.map(seat => (
              <div key={`${seat.row_label}${seat.seat_number}`} className="seat-chip">
                <span className="seat-chip-label">{seat.row_label}{seat.seat_number}</span>
                <span className="seat-chip-type">({seat.seat_type})</span>
                <span className="seat-chip-price">₹{parseFloat(seat.price).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Promo Code Box */}
        <div className="promo-box">
          <form className="promo-form" onSubmit={handleApplyCoupon}>
            <input
              type="text"
              className="form-input promo-input"
              placeholder="Promo code (e.g. CINE50)"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 16px' }}>
              Apply
            </button>
          </form>
          {couponError && <p className="promo-msg text-error">{couponError}</p>}
          {couponSuccess && <p className="promo-msg text-success">{couponSuccess}</p>}
        </div>

        <div className="divider" />

        {/* Cost Breakdown */}
        <div className="price-breakdown">
          <div className="breakdown-row">
            <span className="text-muted">Tickets Subtotal</span>
            <span>₹{baseAmount.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="breakdown-row text-success">
              <span>Promo Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="breakdown-row">
            <span className="text-muted">Convenience Fee & GST</span>
            <span className="text-success" style={{ fontWeight: 600 }}>Waived (₹0.00)</span>
          </div>
          <div className="review-total">
            <span>Total Payable Amount</span>
            <span className="total-amount text-primary">₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="booking-ref-note alert alert-info">
          <Icon name="lock" />
          <span>Temporary Hold Ref: <strong>{booking.booking_ref}</strong> · Status: Pending Payment</span>
        </div>

        <div className="review-actions">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} type="button">
            ← Change Seats
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/bookings/${bookingId}/pay`)}
            type="button"
          >
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
