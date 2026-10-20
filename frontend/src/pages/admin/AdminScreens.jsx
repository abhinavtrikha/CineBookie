import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icon';
import './Admin.css';

export default function AdminScreens() {
  const [searchParams] = useSearchParams();
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState(searchParams.get('theatre_id') || '');
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [screenForm, setScreenForm] = useState({ name: '', total_seats: 60 });
  const [activeScreenSeats, setActiveScreenSeats] = useState(null);
  const [seatsList, setSeatsList] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/theatres')
      .then(res => {
        setTheatres(res.data.theatres);
        if (!selectedTheatreId && res.data.theatres.length > 0) {
          setSelectedTheatreId(res.data.theatres[0].id.toString());
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load theatres.');
        setLoading(false);
      });
  }, []);

  const loadScreens = (theatreId) => {
    if (!theatreId) return;
    setLoading(true);
    api.get(`/theatres/${theatreId}/screens`)
      .then(res => {
        setScreens(res.data.screens);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load screens.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedTheatreId) {
      loadScreens(selectedTheatreId);
    }
  }, [selectedTheatreId]);

  const openAddScreen = () => {
    setScreenForm({ name: `Screen ${screens.length + 1}`, total_seats: 60 });
    setError('');
    setShowModal(true);
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!screenForm.name || !screenForm.total_seats) {
      setError('Screen name and total seats are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/screens', {
        theatre_id: parseInt(selectedTheatreId),
        name: screenForm.name,
        total_seats: parseInt(screenForm.total_seats)
      });
      const newScreen = res.data.screen;
      // Auto-generate standard seats for the screen
      const total = parseInt(screenForm.total_seats);
      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      const seatsPerRow = Math.ceil(total / rows.length);
      await api.post('/seats/bulk', {
        screen_id: newScreen.id,
        rows: rows,
        seats_per_row: seatsPerRow,
        seat_type: 'standard',
        price: 150
      });

      setSuccess(`Screen "${newScreen.name}" created with standard seat layout!`);
      setShowModal(false);
      loadScreens(selectedTheatreId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create screen.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/screens/${deleteTarget.id}`);
      setScreens(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (activeScreenSeats?.id === deleteTarget.id) setActiveScreenSeats(null);
      setSuccess(`Screen "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete screen.');
    }
  };

  const handleViewSeats = async (screen) => {
    setActiveScreenSeats(screen);
    setSeatLoading(true);
    try {
      const res = await api.get(`/seats/screen/${screen.id}`);
      setSeatsList(res.data.seats);
    } catch (err) {
      setError('Failed to load seats for screen.');
    } finally {
      setSeatLoading(false);
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div>
          <h1 className="page-title">Screens & Seat Configurations</h1>
          <p className="page-subtitle">Manage screens and seating layouts (FR-13, FR-14)</p>
        </div>
        {selectedTheatreId && (
          <button className="btn btn-primary" onClick={openAddScreen} type="button">
            + Add New Screen
          </button>
        )}
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
      {success && <div className="alert alert-success"><Icon name="check" /> <span>{success}</span></div>}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Selected Cinema Multiplex:</label>
          <select
            className="form-input"
            value={selectedTheatreId}
            onChange={e => setSelectedTheatreId(e.target.value)}
          >
            {theatres.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading screens...</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Screen ID</th>
                <th>Auditorium Name</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => (
                <tr key={screen.id}>
                  <td>{screen.id}</td>
                  <td style={{ fontWeight: 700 }}><Icon name="screen" size={16} /> {screen.name}</td>
                  <td>{screen.total_seats} seats</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewSeats(screen)}
                        type="button"
                      >
                        Inspect Seats
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(screen)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {screens.length === 0 && (
            <div className="empty-state">
              <h3>No screens found for this multiplex</h3>
              <p>Click "+ Add New Screen" to configure screens and seat layouts.</p>
            </div>
          )}
        </div>
      )}

      {/* Seats Layout Drawer */}
      {activeScreenSeats && (
        <div className="card" style={{ marginTop: '32px', border: '1px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Seating Layout: {activeScreenSeats.name}</h2>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Configured: {seatsList.length} seats / Max Capacity: {activeScreenSeats.total_seats}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveScreenSeats(null)} type="button">
              Close Preview
            </button>
          </div>

          {seatLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : seatsList.length === 0 ? (
            <div className="empty-state">
              <p>No seats generated yet for this screen.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto', padding: '16px', background: 'var(--color-bg3)', borderRadius: 'var(--radius-md)' }}>
              {seatsList.map(seat => (
                <div
                  key={seat.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: seat.seat_type === 'premium' ? 'var(--color-seat-premium)' : 'var(--color-seat-available)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minWidth: '52px'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{seat.row_label}{seat.seat_number}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)' }}>₹{seat.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Screen Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">Add Screen / Auditorium</h2>
            {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
            <form onSubmit={handleCreateScreen}>
              <div className="form-group">
                <label className="form-label">Screen Name *</label>
                <input
                  className="form-input"
                  value={screenForm.name}
                  onChange={e => setScreenForm({ ...screenForm, name: e.target.value })}
                  placeholder="e.g. Screen 1, Audi 2, IMAX"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Seats *</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  className="form-input"
                  value={screenForm.total_seats}
                  onChange={e => setScreenForm({ ...screenForm, total_seats: e.target.value })}
                  required
                />
              </div>
              <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                Standard seating (Rows A-F) with standard price (₹150) will be automatically generated.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Screen & Seats'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: 'var(--color-error)' }}>
              Delete "{deleteTarget.name}"?
            </h2>
            <p style={{ marginBottom: '14px', lineHeight: 1.6 }}>
              Deleting this screen will also permanently remove all of its configured seats and show schedules.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
