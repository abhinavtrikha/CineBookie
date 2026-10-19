import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import './Admin.css';

export default function AdminScreens() {
  const [searchParams] = useSearchParams();
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState(searchParams.get('theatre_id') || '');
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create screen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScreen = async (screenId, name) => {
    if (!confirm(`Delete "${name}" and all its seats and shows?`)) return;
    try {
      await api.delete(`/screens/${screenId}`);
      setScreens(prev => prev.filter(s => s.id !== screenId));
      if (activeScreenSeats?.id === screenId) setActiveScreenSeats(null);
      setSuccess('Screen deleted successfully.');
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
        <div className="page-header" style={{ paddingBottom: 0 }}>
          <h1 className="page-title">Screens & Seats</h1>
          <p className="page-subtitle">Manage screens and seating layouts (FR-13, FR-14)</p>
        </div>
        {selectedTheatreId && (
          <button className="btn btn-primary" onClick={openAddScreen}>+ Add Screen</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Cinema Theatre:</label>
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
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Screen ID</th>
                <th>Screen Name</th>
                <th>Total Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => (
                <tr key={screen.id}>
                  <td>{screen.id}</td>
                  <td style={{ fontWeight: 600 }}>{screen.name}</td>
                  <td>{screen.total_seats} seats</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewSeats(screen)}
                      >
                        View Seats
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteScreen(screen.id, screen.name)}
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
              <h3>No screens found for this theatre</h3>
              <p>Click "+ Add Screen" to configure screens and seat layouts.</p>
            </div>
          )}
        </div>
      )}

      {/* Seats Layout Drawer / Modal */}
      {activeScreenSeats && (
        <div className="card" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Seat Layout: {activeScreenSeats.name}</h2>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Total Configured Seats: {seatsList.length} / Capacity: {activeScreenSeats.total_seats}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveScreenSeats(null)}>
              Close
            </button>
          </div>

          {seatLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : seatsList.length === 0 ? (
            <div className="empty-state">
              <p>No seats generated yet for this screen.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto', padding: '12px', background: 'var(--color-bg3)', borderRadius: 'var(--radius-md)' }}>
              {seatsList.map(seat => (
                <div
                  key={seat.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: seat.seat_type === 'premium' ? 'var(--color-seat-premium)' : 'var(--color-seat-available)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minWidth: '50px'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{seat.row_label}{seat.seat_number}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>₹{seat.price}</div>
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
            <h2 className="modal-title">Add Screen to Theatre</h2>
            {error && <div className="alert alert-error">{error}</div>}
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
                Note: Standard seating (Rows A-F) with default pricing (₹150 standard) will be automatically initialized.
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
    </div>
  );
}
