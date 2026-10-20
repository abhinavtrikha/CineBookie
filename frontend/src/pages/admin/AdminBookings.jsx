import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icon';
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
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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
    try {
      const res = await api.get(`/bookings/${id}`);
      setSelectedBooking(res.data.booking);
    } catch (err) {
      setError('Failed to load booking details.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${cancelTarget.id}/cancel`);
      setSuccess(`Booking ${cancelTarget.booking_ref} cancelled and seats released.`);
      if (selectedBooking && selectedBooking.id === cancelTarget.id) {
        setSelectedBooking(prev => ({ ...prev, booking_status: 'cancelled' }));
      }
      setCancelTarget(null);
      loadBookings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'all' || b.booking_status === filterStatus;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      b.booking_ref?.toLowerCase().includes(q) ||
      b.user_name?.toLowerCase().includes(q) ||
      b.movie_title?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div>
          <h1 className="page-title">Customer Bookings & Transactions</h1>
          <p className="page-subtitle">Track all reservations, tickets, and audit trails (FR-35 to FR-38)</p>
        </div>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
      {success && <div className="alert alert-success"><Icon name="check" /> <span>{success}</span></div>}

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Status:</span>
          {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
            <button
              key={status}
              type="button"
              className={`chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading reservations...</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Guest</th>
                <th>Movie Title</th>
                <th>Cinema & Screen</th>
                <th>Show Timing</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {b.booking_ref}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{b.user_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{b.user_email}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{b.movie_title}</td>
                  <td>
                    {b.theatre_name} · <span className="text-muted">{b.screen_name}</span>
                  </td>
                  <td>
                    {new Date(b.show_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    {' '}{formatTime(b.show_time)}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    ₹{parseFloat(b.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge badge-${b.booking_status}`}>
                      {b.booking_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(b.id)} type="button">
                        Inspect
                      </button>
                      {b.booking_status === 'confirmed' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setCancelTarget(b)}
                          type="button"
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
            <h2 className="modal-title">Reservation Audit Record</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Booking Reference:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {selectedBooking.booking_ref}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Guest Customer:</span>
                <span style={{ fontWeight: 600 }}>{selectedBooking.user_name} ({selectedBooking.user_email})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Movie Title:</span>
                <span style={{ fontWeight: 700 }}>{selectedBooking.movie_title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Cinema Venue:</span>
                <span>{selectedBooking.theatre_name}, {selectedBooking.city} ({selectedBooking.screen_name})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Screening Date & Time:</span>
                <span style={{ fontWeight: 600 }}>
                  {new Date(selectedBooking.show_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{formatTime(selectedBooking.show_time)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Booked Seats:</span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>
                  {selectedBooking.seats && selectedBooking.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Payment Status:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 700 }} className={selectedBooking.payment_status === 'paid' ? 'text-success' : 'text-warning'}>
                  ● {selectedBooking.payment_status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Reservation Status:</span>
                <span className={`badge badge-${selectedBooking.booking_status}`}>
                  {selectedBooking.booking_status}
                </span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total Amount Paid:</span>
                <span className="text-primary" style={{ fontWeight: 900, fontSize: '1.45rem' }}>
                  ₹{parseFloat(selectedBooking.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)} type="button">Close</button>
              {selectedBooking.booking_status === 'confirmed' && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    const target = selectedBooking;
                    setSelectedBooking(null);
                    setCancelTarget(target);
                  }}
                  type="button"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: 'var(--color-error)' }}>
              Cancel Booking {cancelTarget.booking_ref}?
            </h2>
            <p style={{ marginBottom: '14px', lineHeight: 1.6 }}>
              Are you sure you want to cancel this booking for <strong>"{cancelTarget.movie_title}"</strong> (Guest: {cancelTarget.user_name})?
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              All reserved seats will be released back into available inventory immediately.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Dismiss
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
