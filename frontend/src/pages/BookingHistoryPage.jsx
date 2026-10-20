import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const posterFallback = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80';

  useEffect(() => {
    setLoading(true);
    api.get('/bookings')
      .then(res => {
        setBookings(res.data.bookings);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load your booking history.');
        setLoading(false);
      });
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        b.movie_title?.toLowerCase().includes(q) ||
        b.booking_ref?.toLowerCase().includes(q) ||
        b.theatre_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, search]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Retrieving your ticket reservations...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      <div className="page-header" style={{ paddingBottom: '16px' }}>
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track your upcoming movies, past screenings, and digital passes</p>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

      {/* Filter and Search Ribbon */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
            <button
              key={status}
              type="button"
              className={`chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status === 'all' ? 'All Bookings' : status}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '220px', flex: '1', maxWidth: '360px' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '8px 14px', fontSize: '0.88rem' }}
            placeholder="Search by movie or booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="ticket" size={52} /></div>
          <h3>No bookings found</h3>
          <p className="text-muted">
            {bookings.length === 0
              ? 'You have not made any movie bookings yet.'
              : 'No reservations match your current search and status filters.'}
          </p>
          <Link to="/movies" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Browse Movies Now →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map(booking => (
            <Link
              key={booking.id}
              to={`/bookings/${booking.id}`}
              style={{ display: 'block' }}
            >
              <div
                className="card card-hover"
                style={{
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'center',
                  padding: '20px 24px',
                  flexWrap: 'wrap'
                }}
              >
                <img
                  src={booking.poster_url || posterFallback}
                  alt={booking.movie_title}
                  onError={(e) => { e.target.src = posterFallback; }}
                  style={{
                    width: '70px',
                    height: '95px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}
                />

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{booking.movie_title}</h3>
                    <span className={`badge badge-${booking.booking_status}`}>
                      {booking.booking_status}
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '6px' }}>
                    <Icon name="building" size={15} /> {booking.theatre_name}, {booking.city} · <Icon name="screen" size={15} /> {booking.screen_name}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    <Icon name="calendar" size={15} /> {booking.show_date ? new Date(booking.show_date).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    }) : ''} · <Icon name="clock" size={15} /> {formatTime(booking.show_time)}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '120px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '6px' }}>
                    {booking.booking_ref}
                  </div>
                  <div className="text-primary" style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '4px' }}>
                    ₹{parseFloat(booking.total_amount).toFixed(2)}
                  </div>
                  <span className="btn btn-ghost btn-sm" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                    View Pass →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
