import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    api.get('/admin/bookings')
      .then(res => {
        setBookings(res.data.bookings);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load bookings.');
        setLoading(false);
      });
  };

  useEffect(() => { loadBookings(); }, []);

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/bookings/${id}`);
      setSelectedBooking(res.data.booking);
    } catch (err) {
      setError('Failed to load booking details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (id, ref) => {
    if (!confirm(`Cancel booking ${ref}? This will release the booked seats.`)) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      setSuccess(`Booking ${ref} cancelled and seats released.`);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => ({ ...prev, booking_status: 'cancelled' }));
      }
      loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'all' || b.booking_status === filterStatus;
    const matchesSearch = !search ||
      b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
      b.user_name.toLowerCase().includes(search.toLowerCase()) ||
      b.movie_title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div className="page-header" style={{ paddingBottom: 0 }}>
          <h1 className="page-title">Booking Records</h1>
          <p className="page-subtitle">Track all customer reservations and transactions (FR-35 to FR-38)</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by Booking ID, customer or movie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Status:</span>
          {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
            <button
              key={status}
              className={`chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Theatre / Screen</th>
                <th>Show Timing</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>
                    {b.booking_ref}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.user_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{b.user_email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.movie_title}</td>
                  <td>
                    {b.theatre_name} · <span className="text-muted">{b.screen_name}</span>
                  </td>
                  <td>
                    {new Date(b.show_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    {' '}{formatTime(b.show_time)}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    ₹{parseFloat(b.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge badge-${b.booking_status}`}>
                      {b.booking_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(b.id)}>
                        Details
                      </button>
                      {b.booking_status === 'confirmed' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(b.id, b.booking_ref)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <div className="empty-state">
              <h3>No bookings found</h3>
              <p>No customer reservations matching your filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
          <div className="modal">
            <h2 className="modal-title">Booking Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Booking Reference:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {selectedBooking.booking_ref}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Customer:</span>
                <span>{selectedBooking.user_name} ({selectedBooking.user_email})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Movie:</span>
                <span style={{ fontWeight: 600 }}>{selectedBooking.movie_title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Cinema & Screen:</span>
                <span>{selectedBooking.theatre_name}, {selectedBooking.city} ({selectedBooking.screen_name})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Date & Time:</span>
                <span>
                  {new Date(selectedBooking.show_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{formatTime(selectedBooking.show_time)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Booked Seats:</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedBooking.seats && selectedBooking.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Payment Status:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selectedBooking.payment_status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Booking Status:</span>
                <span className={`badge badge-${selectedBooking.booking_status}`}>
                  {selectedBooking.booking_status}
                </span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Total Paid:</span>
                <span className="text-primary" style={{ fontWeight: 800, fontSize: '1.3rem' }}>
                  ₹{parseFloat(selectedBooking.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
              {selectedBooking.booking_status === 'confirmed' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancel(selectedBooking.id, selectedBooking.booking_ref)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
