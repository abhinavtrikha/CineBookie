import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import './PaymentPage.css';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'card', subtitle: 'Visa, Mastercard, RuPay' },
  { id: 'upi', label: 'UPI / QR Code', icon: 'phone', subtitle: 'Google Pay, PhonePe, Paytm' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank', subtitle: 'All Major Indian Banks' },
];

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Card mock state
  const [cardData, setCardData] = useState({
    name: 'DEMO CUSTOMER',
    number: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvv: '•••'
  });

  // Net banking mock state
  const [selectedBank, setSelectedBank] = useState('HDFC');

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then(res => {
        setBooking(res.data.booking);
        setLoading(false);
      })
      .catch(() => {
        setError('Booking reservation not found or expired.');
        setLoading(false);
      });
  }, [bookingId]);

  const handlePay = async () => {
    setProcessing(true);
    setError('');

    // If sandbox failure is enabled, we pass simulate_failure
    const payload = {
      payment_method: paymentMethod,
      simulate_failure: simulateFailure
    };

    try {
      await api.post(`/bookings/${bookingId}/pay`, payload);
      navigate(`/bookings/${bookingId}/confirmation`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (simulateFailure
          ? 'Payment Declined: Transaction simulation failed per test setting.'
          : 'Payment failed to process. Please try again or choose another method.')
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Initializing secure payment gateway...</p>
      </div>
    );
  }

  return (
    <div className="payment-page container">
      {/* Step Bar */}
      <div className="step-bar card" style={{ maxWidth: '600px', margin: '0 auto 28px', padding: '16px 24px' }}>
        <div className="step-item completed">
          <span className="step-circle"><Icon name="check" size={15} /></span>
          <span className="step-text">Seats</span>
        </div>
        <div className="step-line active" />
        <div className="step-item completed">
          <span className="step-circle"><Icon name="check" size={15} /></span>
          <span className="step-text">Review</span>
        </div>
        <div className="step-line active" />
        <div className="step-item active">
          <span className="step-circle">3</span>
          <span className="step-text">Payment</span>
        </div>
        <div className="step-line" />
        <div className="step-item">
          <span className="step-circle">4</span>
          <span className="step-text">Ticket</span>
        </div>
      </div>

      <div className="payment-layout">
        {/* Payment Gateway Form */}
        <div className="payment-form card">
          <div className="payment-header">
            <div>
              <h1 className="payment-title">Secure Checkout</h1>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Complete payment to issue your verified digital cinema ticket.
              </p>
            </div>
            <span className="sandbox-badge">Sandbox Demo Mode</span>
          </div>

          <h3 className="payment-section-label">Select Payment Channel</h3>
          <div className="payment-methods">
            {PAYMENT_METHODS.map(method => (
              <label
                key={method.id}
                className={`payment-method-option ${paymentMethod === method.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span className="method-icon"><Icon name={method.icon} size={25} /></span>
                <div style={{ flex: 1 }}>
                  <div className="method-label">{method.label}</div>
                  <div className="method-subtitle text-muted">{method.subtitle}</div>
                </div>
                <span className="method-check">{paymentMethod === method.id ? '●' : '○'}</span>
              </label>
            ))}
          </div>

          {/* CARD PAYMENT INTERFACE */}
          {paymentMethod === 'card' && (
            <div className="method-content">
              {/* Virtual Mock Card Visual */}
              <div className="virtual-card">
                <div className="virtual-card-top">
                  <span className="card-chip"><Icon name="card" size={15} /> CHIP</span>
                  <span className="card-network">VISA</span>
                </div>
                <div className="virtual-card-number">{cardData.number}</div>
                <div className="virtual-card-bottom">
                  <div>
                    <span className="card-sub-label">CARD HOLDER</span>
                    <span className="card-sub-val">{booking?.user_name?.toUpperCase() || cardData.name}</span>
                  </div>
                  <div>
                    <span className="card-sub-label">EXPIRES</span>
                    <span className="card-sub-val">{cardData.expiry}</span>
                  </div>
                </div>
              </div>

              <div className="card-form-grid">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    className="form-input"
                    type="text"
                    readOnly
                    value="4242 •••• •••• 4242"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expiry (MM/YY)</label>
                    <input className="form-input" type="text" readOnly value="12/28" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input className="form-input" type="text" readOnly value="123" />
                  </div>
                </div>
              </div>
              <div className="alert alert-info" style={{ fontSize: '0.82rem', marginTop: '10px' }}>
                <Icon name="info" size={16} /> Sandbox Mode: Test card details pre-filled. No real credit card or bank is charged.
              </div>
            </div>
          )}

          {/* UPI PAYMENT INTERFACE */}
          {paymentMethod === 'upi' && (
            <div className="method-content upi-content">
              <div className="upi-qr-box">
                {/* Simulated QR Code SVG */}
                <svg className="qr-code-svg" viewBox="0 0 100 100" width="120" height="120">
                  <rect width="100" height="100" fill="#ffffff" rx="8" />
                  <rect x="10" y="10" width="25" height="25" fill="#000000" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#000000" />
                  <rect x="65" y="10" width="25" height="25" fill="#000000" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#000000" />
                  <rect x="10" y="65" width="25" height="25" fill="#000000" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#000000" />
                  <rect x="45" y="15" width="10" height="15" fill="#000000" />
                  <rect x="40" y="45" width="20" height="10" fill="#000000" />
                  <rect x="65" y="45" width="25" height="10" fill="#000000" />
                  <rect x="45" y="65" width="10" height="25" fill="#000000" />
                  <rect x="65" y="65" width="15" height="15" fill="#000000" />
                </svg>
                <div className="upi-qr-text">
                  <p style={{ fontWeight: 700 }}>Scan QR using any UPI App</p>
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                    Google Pay · PhonePe · Paytm · BHIM
                  </p>
                  <span className="upi-id-pill">cinebookie@sandbox</span>
                </div>
              </div>
              <div className="alert alert-info" style={{ fontSize: '0.82rem', marginTop: '12px' }}>
                <Icon name="info" size={16} /> Sandbox Mode: Simply click "Complete Payment" below to simulate successful instant UPI clearance.
              </div>
            </div>
          )}

          {/* NET BANKING INTERFACE */}
          {paymentMethod === 'netbanking' && (
            <div className="method-content">
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Popular Indian Banks:
              </label>
              <div className="bank-options-grid">
                {[
                  { id: 'HDFC', name: 'HDFC Bank', icon: 'building' },
                  { id: 'SBI', name: 'State Bank of India', icon: 'bank' },
                  { id: 'ICICI', name: 'ICICI Bank', icon: 'building' },
                  { id: 'AXIS', name: 'Axis Bank', icon: 'building' },
                ].map(bank => (
                  <button
                    key={bank.id}
                    type="button"
                    className={`bank-btn ${selectedBank === bank.id ? 'active' : ''}`}
                    onClick={() => setSelectedBank(bank.id)}
                  >
                    <Icon name={bank.icon} size={18} />
                    <span>{bank.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sandbox Payment Error Simulation Tester (per SRS FR-34 requirement) */}
          <div className="sandbox-test-toggle">
            <label className="test-toggle-label">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={e => setSimulateFailure(e.target.checked)}
              />
              <span>Simulate Payment Failure (SRS FR-34 Validation Test)</span>
            </label>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '2px', paddingLeft: '22px' }}>
              Check this box to verify system behavior when bank payment fails.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '16px' }}>
              <Icon name="warning" /> <span>{error}</span>
            </div>
          )}

          <div className="payment-actions">
            <button
              className="btn btn-primary btn-full btn-lg pay-submit-btn"
              onClick={handlePay}
              disabled={processing}
              type="button"
            >
              {processing
                ? 'Verifying & Authorizing...'
                : `Complete Payment: ₹${booking ? parseFloat(booking.total_amount).toFixed(2) : '...'}`}
            </button>
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: '10px' }}
              onClick={() => navigate(-1)}
              disabled={processing}
              type="button"
            >
              Cancel & Return to Review
            </button>
          </div>
        </div>

        {/* Right Order Summary Column */}
        {booking && (
          <div className="payment-summary card">
            <h3 className="summary-title">Reservation Summary</h3>
            <p className="summary-movie">{booking.movie_title}</p>
            <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '14px' }}>
              <Icon name="pin" size={15} /> {booking.theatre_name} · {booking.screen_name}
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              <Icon name="calendar" size={15} /> {booking.show_date ? new Date(booking.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </p>

            <div className="divider" />

            <div className="summary-seats">
              {booking.seats && booking.seats.map(s => (
                <div key={`${s.row_label}${s.seat_number}`} className="summary-seat-row">
                  <span>
                    Seat <strong>{s.row_label}{s.seat_number}</strong> ({s.seat_type})
                  </span>
                  <span>₹{parseFloat(s.price).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="summary-total-row">
              <strong>Total Amount</strong>
              <strong className="text-primary" style={{ fontSize: '1.3rem' }}>
                ₹{parseFloat(booking.total_amount).toFixed(2)}
              </strong>
            </div>

            <div className="security-badges">
              <div className="sec-item"><Icon name="lock" size={16} /> 256-Bit SSL Encryption</div>
              <div className="sec-item"><Icon name="shield" size={16} /> Instant Seat Hold Lock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
