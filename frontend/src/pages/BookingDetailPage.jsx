import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/${id}`)
      .then(res => {
        setBooking(res.data.booking);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Booking not found.');
        setLoading(false);
      });
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      await api.post(`/bookings/${id}/cancel`);
      setBooking(prev => ({ ...prev, booking_status: 'cancelled' }));
      setShowCancelModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyRef = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.booking_ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Retrieving ticket details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>{error}</h2>
        <Link to="/bookings" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px', maxWidth: '720px' }}>
      <Link to="/bookings" className="back-link">
        ← Back to My Bookings
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Ticket Details</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Official Cinema Reservation Record</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => window.print()}
          type="button"
        >
          <Icon name="printer" /> Print Ticket
        </button>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

      {booking && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>{booking.movie_title}</h2>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                {booking.genre} · {booking.language} · {booking.duration_mins} min
              </p>
            </div>
            <span className={`badge badge-${booking.booking_status}`} style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              {booking.booking_status}
            </span>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Booking Reference</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 800, fontSize: '1.05rem' }}>
                  {booking.booking_ref}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  style={{ fontSize: '0.75rem', background: 'var(--color-bg3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '4px' }}
                >
                  <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Cinema Theatre</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{booking.theatre_name}, {booking.city}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Auditorium / Screen</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{booking.screen_name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Date & Showtime</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-light)' }}>
                {new Date(booking.show_date).toLocaleDateString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                })} · {formatTime(booking.show_time)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Seats Allocated</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {booking.seats && booking.seats.map(s => (
                  <span
                    key={`${s.row_label}${s.seat_number}`}
                    style={{
                      background: 'rgba(232, 67, 147, 0.15)',
                      border: '1px solid rgba(232, 67, 147, 0.35)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    {s.row_label}{s.seat_number}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ fontSize: '0.9rem' }}>Payment Status</span>
              <span className={booking.payment_status === 'paid' ? 'text-success' : 'text-warning'} style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                ● {booking.payment_status}
              </span>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total Amount Paid</span>
            <span className="text-primary" style={{ fontWeight: 900, fontSize: '1.6rem' }}>
              ₹{parseFloat(booking.total_amount).toFixed(2)}
            </span>
          </div>

          {booking.booking_status === 'confirmed' && (
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                Cancellation policy: Cancellations release seats immediately.
              </p>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                type="button"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* Styled Cancellation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: 'var(--color-error)' }}>
              <Icon name="warning" /> Cancel Booking?
            </h2>
            <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
              Are you sure you want to cancel your booking for <strong>{booking?.movie_title}</strong> (Ref: {booking?.booking_ref})?
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              Your seats ({booking?.seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ')}) will be released and made available for other cinema guests immediately.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
