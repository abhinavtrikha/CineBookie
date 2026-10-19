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

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editShow, setEditShow] = useState(null);
  const [form, setForm] = useState({
    movie_id: '',
    theatre_id: '',
    screen_id: '',
    show_date: new Date().toISOString().split('T')[0],
    show_time: '18:30'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/shows'),
        api.get('/movies'),
        api.get('/theatres')
      ]);
      setShows(showsRes.data.shows);
      setMovies(moviesRes.data.movies);
      setTheatres(theatresRes.data.theatres);
      if (theatresRes.data.theatres.length > 0) {
        loadScreensForTheatre(theatresRes.data.theatres[0].id);
      }
    } catch (err) {
      setError('Failed to load shows data.');
    } finally {
      setLoading(false);
    }
  };

  const loadScreensForTheatre = async (theatreId) => {
    try {
      const res = await api.get(`/theatres/${theatreId}/screens`);
      setScreens(res.data.screens);
      if (res.data.screens.length > 0) {
        setForm(prev => ({ ...prev, theatre_id: theatreId, screen_id: res.data.screens[0].id }));
      }
    } catch (err) {}
  };

  useEffect(() => { loadData(); }, []);

  const handleTheatreChange = (theatreId) => {
    setForm(prev => ({ ...prev, theatre_id: theatreId }));
    loadScreensForTheatre(theatreId);
  };

  const openAdd = () => {
    setEditShow(null);
    setForm({
      movie_id: movies[0]?.id || '',
      theatre_id: theatres[0]?.id || '',
      screen_id: screens[0]?.id || '',
      show_date: new Date().toISOString().split('T')[0],
      show_time: '18:30'
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditShow(s);
    setForm({
      movie_id: s.movie_id,
      theatre_id: s.theatre_id,
      screen_id: s.screen_id,
      show_date: s.show_date?.split('T')[0] || s.show_date,
      show_time: s.show_time?.substring(0, 5) || '18:30'
    });
    if (s.theatre_id) loadScreensForTheatre(s.theatre_id);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.movie_id || !form.screen_id || !form.show_date || !form.show_time) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        movie_id: parseInt(form.movie_id),
        screen_id: parseInt(form.screen_id),
        show_date: form.show_date,
        show_time: form.show_time
      };

      if (editShow) {
        await api.put(`/shows/${editShow.id}`, payload);
        setSuccess('Show updated successfully!');
      } else {
        await api.post('/shows', payload);
        setSuccess('Show scheduled successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save show.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, movieTitle, time) => {
    if (!confirm(`Delete show for "${movieTitle}" at ${formatTime(time)}?`)) return;
    try {
      await api.delete(`/shows/${id}`);
      setShows(prev => prev.filter(s => s.id !== id));
      setSuccess('Show deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete show.');
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div className="page-header" style={{ paddingBottom: 0 }}>
          <h1 className="page-title">Show Schedules</h1>
          <p className="page-subtitle">Manage showtimes and screenings (FR-15, FR-16, FR-17)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Schedule Show</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Movie</th>
                <th>Theatre & Screen</th>
                <th>Show Date</th>
                <th>Show Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shows.map(show => (
                <tr key={show.id}>
                  <td>{show.id}</td>
                  <td style={{ fontWeight: 600 }}>{show.movie_title}</td>
                  <td>
                    {show.theatre_name} · <span className="text-muted">{show.screen_name}</span>
                  </td>
                  <td>
                    {new Date(show.show_date).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatTime(show.show_time)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(show)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(show.id, show.movie_title, show.show_time)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shows.length === 0 && (
            <div className="empty-state">
              <h3>No shows scheduled</h3>
              <p>Schedule your first show by clicking "+ Schedule Show".</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Show Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editShow ? 'Edit Show' : 'Schedule New Show'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Movie *</label>
                <select
                  className="form-input"
                  value={form.movie_id}
                  onChange={e => setForm({ ...form, movie_id: e.target.value })}
                  required
                >
                  <option value="">Select Movie</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.language})</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Theatre *</label>
                  <select
                    className="form-input"
                    value={form.theatre_id}
                    onChange={e => handleTheatreChange(e.target.value)}
                    required
                  >
                    <option value="">Select Theatre</option>
                    {theatres.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Screen *</label>
                  <select
                    className="form-input"
                    value={form.screen_id}
                    onChange={e => setForm({ ...form, screen_id: e.target.value })}
                    required
                  >
                    <option value="">Select Screen</option>
                    {screens.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.total_seats} seats)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Show Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.show_date}
                    onChange={e => setForm({ ...form, show_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Show Time (HH:MM) *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.show_time}
                    onChange={e => setForm({ ...form, show_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
