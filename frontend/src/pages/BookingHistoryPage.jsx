import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings')
      .then(res => { setBookings(res.data.bookings); setLoading(false); })
      .catch(() => { setError('Failed to load bookings.'); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading bookings...</p></div>;

  return (
    <div className="container" style={{paddingTop:'32px', paddingBottom:'60px'}}>
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Your booking history</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:'3rem', marginBottom:'16px'}}>🎟️</div>
          <h3>No bookings yet</h3>
          <p>Browse movies and book your first ticket!</p>
          <Link to="/movies" className="btn btn-primary" style={{marginTop:'20px'}}>Browse Movies</Link>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {bookings.map(booking => (
            <Link
              key={booking.id}
              to={`/bookings/${booking.id}`}
              style={{display:'block'}}
            >
              <div className="card card-hover" style={{display:'flex', gap:'20px', alignItems:'center'}}>
                {booking.poster_url && (
                  <img
                    src={booking.poster_url}
                    alt={booking.movie_title}
                    style={{width:'60px', height:'80px', objectFit:'cover', borderRadius:'8px', flexShrink:0}}
                  />
                )}
                <div style={{flex:1}}>
                  <h3 style={{marginBottom:'6px'}}>{booking.movie_title}</h3>
                  <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'8px'}}>
                    {booking.theatre_name}, {booking.city} · {booking.screen_name}
                  </p>
                  <p className="text-muted" style={{fontSize:'0.88rem'}}>
                    {booking.show_date ? new Date(booking.show_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {formatTime(booking.show_time)}
                  </p>
                </div>
                <div style={{textAlign:'right', flexShrink:0}}>
                  <p className="text-primary" style={{fontWeight:700, fontSize:'1.1rem', marginBottom:'6px'}}>
                    ₹{parseFloat(booking.total_amount).toFixed(2)}
                  </p>
                  <span className={`badge badge-${booking.booking_status}`}>
                    {booking.booking_status}
                  </span>
                  <p className="text-muted" style={{fontSize:'0.78rem', marginTop:'4px'}}>{booking.booking_ref}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
