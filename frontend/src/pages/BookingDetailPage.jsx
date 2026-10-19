import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(res => { setBooking(res.data.booking); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Booking not found.'); setLoading(false); });
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${id}/cancel`);
      setBooking(prev => ({ ...prev, booking_status: 'cancelled' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (error && !booking) return (
    <div className="container" style={{padding:'60px 20px', textAlign:'center'}}>
      <h2>{error}</h2>
      <Link to="/bookings" className="btn btn-secondary" style={{marginTop:'16px'}}>Back to Bookings</Link>
    </div>
  );

  return (
    <div className="container" style={{paddingTop:'32px', paddingBottom:'60px'}}>
      <Link to="/bookings" className="back-link text-muted" style={{display:'inline-block', marginBottom:'20px', fontSize:'0.9rem'}}>
        ← Back to My Bookings
      </Link>

      <h1 className="page-title" style={{marginBottom:'24px'}}>Booking Details</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {booking && (
        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'20px', maxWidth:'600px'}}>
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
              <div>
                <h2 style={{marginBottom:'6px'}}>{booking.movie_title}</h2>
                <p className="text-muted" style={{fontSize:'0.88rem'}}>{booking.genre} · {booking.language} · {booking.duration_mins} min</p>
              </div>
              <span className={`badge badge-${booking.booking_status}`}>{booking.booking_status}</span>
            </div>

            <div className="divider" />

            <div style={{display:'flex', flexDirection:'column', gap:'12px', margin:'16px 0'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Booking Ref</span>
                <span style={{fontFamily:'monospace', color:'var(--color-accent)', fontWeight:700}}>{booking.booking_ref}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Theatre</span>
                <span style={{fontWeight:600, fontSize:'0.9rem'}}>{booking.theatre_name}, {booking.city}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Screen</span>
                <span style={{fontWeight:600, fontSize:'0.9rem'}}>{booking.screen_name}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Date & Time</span>
                <span style={{fontWeight:600, fontSize:'0.9rem', textAlign:'right'}}>
                  {new Date(booking.show_date).toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'long', year:'numeric'})}
                  {' · '}{formatTime(booking.show_time)}
                </span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Seats</span>
                <span style={{fontWeight:600, fontSize:'0.9rem'}}>
                  {booking.seats && booking.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
                </span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="text-muted" style={{fontSize:'0.88rem'}}>Payment</span>
                <span className={booking.payment_status === 'paid' ? 'text-success' : 'text-warning'} style={{fontWeight:600, fontSize:'0.9rem', textTransform:'capitalize'}}>
                  {booking.payment_status}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'16px'}}>
              <span style={{fontWeight:700}}>Total Amount</span>
              <span className="text-primary" style={{fontWeight:800, fontSize:'1.4rem'}}>₹{parseFloat(booking.total_amount).toFixed(2)}</span>
            </div>

            {booking.booking_status === 'confirmed' && (
              <div style={{marginTop:'20px'}}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
