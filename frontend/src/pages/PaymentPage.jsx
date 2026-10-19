import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './PaymentPage.css';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'upi', label: 'UPI Payment', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
];

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(res => { setBooking(res.data.booking); setLoading(false); })
      .catch(() => { setError('Booking not found.'); setLoading(false); });
  }, [bookingId]);

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await api.post(`/bookings/${bookingId}/pay`, { payment_method: paymentMethod });
      navigate(`/bookings/${bookingId}/confirmation`);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading payment...</p></div>;

  return (
    <div className="payment-page container">
      <div className="payment-layout">
        {/* Payment Form */}
        <div className="payment-form card">
          <h1 className="payment-title">Complete Payment</h1>
          <p className="text-muted" style={{marginBottom:'28px'}}>
            This is a <strong>sandbox payment environment</strong>. No real money will be charged.
          </p>

          <h3 className="payment-section-label">Select Payment Method</h3>
          <div className="payment-methods">
            {PAYMENT_METHODS.map(method => (
              <label key={method.id} className={`payment-method-option ${paymentMethod === method.id ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span className="method-icon">{method.icon}</span>
                <span className="method-label">{method.label}</span>
              </label>
            ))}
          </div>

          {paymentMethod === 'card' && (
            <div className="card-form">
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input className="form-input" type="text" placeholder="•••• •••• •••• ••••" maxLength={19} readOnly value="4242 4242 4242 4242" />
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Expiry</label>
                  <input className="form-input" type="text" placeholder="MM/YY" readOnly value="12/28" />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">CVV</label>
                  <input className="form-input" type="text" placeholder="•••" maxLength={3} readOnly value="123" />
                </div>
              </div>
              <div className="alert alert-info" style={{marginTop:'4px', fontSize:'0.82rem'}}>
                Sandbox mode: pre-filled test card details. Click Pay to confirm booking.
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="form-group" style={{marginTop:'16px'}}>
              <label className="form-label">UPI ID</label>
              <input className="form-input" type="text" placeholder="yourname@upi" readOnly value="demo@sandbox" />
              <div className="alert alert-info" style={{marginTop:'8px', fontSize:'0.82rem'}}>Sandbox mode: click Pay to confirm.</div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="form-group" style={{marginTop:'16px'}}>
              <label className="form-label">Select Bank</label>
              <select className="form-input">
                <option>Demo Bank (Sandbox)</option>
              </select>
              <div className="alert alert-info" style={{marginTop:'8px', fontSize:'0.82rem'}}>Sandbox mode: click Pay to confirm.</div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{marginTop:'20px'}}
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? 'Processing payment...' : `Pay ₹${booking ? parseFloat(booking.total_amount).toFixed(2) : '...'}`}
          </button>
          <button className="btn btn-ghost btn-full" style={{marginTop:'10px'}} onClick={() => navigate(-1)} disabled={processing}>
            Cancel
          </button>
        </div>

        {/* Order summary */}
        {booking && (
          <div className="payment-summary card">
            <h3 className="summary-title">Order Summary</h3>
            <p className="summary-movie">{booking.movie_title}</p>
            <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'16px'}}>
              {booking.theatre_name} · {booking.show_date ? new Date(booking.show_date).toLocaleDateString('en-IN', {day:'numeric', month:'short'}) : ''}
            </p>
            <div className="divider" />
            <div className="summary-seats">
              {booking.seats && booking.seats.map(s => (
                <div key={`${s.row_label}${s.seat_number}`} className="summary-seat-row">
                  <span>{s.row_label}{s.seat_number} ({s.seat_type})</span>
                  <span>₹{parseFloat(s.price).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="summary-total-row">
              <strong>Total</strong>
              <strong className="text-primary">₹{parseFloat(booking.total_amount).toFixed(2)}</strong>
            </div>
            <p className="text-muted" style={{fontSize:'0.8rem', marginTop:'12px'}}>Booking Ref: {booking.booking_ref}</p>
          </div>
        )}
      </div>
    </div>
  );
}
