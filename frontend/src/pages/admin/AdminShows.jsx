import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icon';
import './Admin.css';

function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [theatreFilter, setTheatreFilter] = useState('all');

  const [form, setForm] = useState({
    movie_id: '',
    theatre_id: '',
    screen_id: '',
    show_date: getTodayLocalDate(),
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
      show_date: getTodayLocalDate(),
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
      setError('Please fill in all required fields.');
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
        setSuccess('Show schedule updated successfully!');
      } else {
        await api.post('/shows', payload);
        setSuccess('Show scheduled successfully!');
      }
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save show.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shows/${deleteTarget.id}`);
      setShows(prev => prev.filter(s => s.id !== deleteTarget.id));
      setSuccess(`Show for "${deleteTarget.movie_title}" deleted.`);
      setDeleteTarget(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete show.');
    }
  };

  const filteredShows = useMemo(() => {
    return shows.filter(s => {
      const matchesTheatre = theatreFilter === 'all' || s.theatre_id.toString() === theatreFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        s.movie_title?.toLowerCase().includes(q) ||
        s.theatre_name?.toLowerCase().includes(q) ||
        s.screen_name?.toLowerCase().includes(q);
      return matchesTheatre && matchesSearch;
    });
  }, [shows, theatreFilter, search]);

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div>
          <h1 className="page-title">Screening Schedules</h1>
          <p className="page-subtitle">Assign movies to auditoriums, dates, and times (FR-15 to FR-17)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          + Schedule New Show
        </button>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
      {success && <div className="alert alert-success"><Icon name="check" /> <span>{success}</span></div>}

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by movie title, theatre, or screen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Theatre:</span>
          <select
            className="form-input"
            value={theatreFilter}
            onChange={e => setTheatreFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Multiplexes</option>
            {theatres.map(t => (
              <option key={t.id} value={t.id.toString()}>{t.name} ({t.city})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading show schedules...</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Show ID</th>
                <th>Movie Title</th>
                <th>Theatre Venue</th>
                <th>Auditorium</th>
                <th>Screening Date</th>
                <th>Show Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShows.map(show => (
                <tr key={show.id}>
                  <td>{show.id}</td>
                  <td style={{ fontWeight: 700 }}>{show.movie_title}</td>
                  <td><Icon name="building" size={16} /> {show.theatre_name} ({show.city})</td>
                  <td><span className="badge" style={{ background: 'var(--color-bg3)', color: '#fff' }}>{show.screen_name}</span></td>
                  <td>
                    {new Date(show.show_date).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    ⏱ {formatTime(show.show_time)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(show)} type="button">
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(show)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredShows.length === 0 && (
            <div className="empty-state">
              <h3>No shows found</h3>
              <p>Schedule your first screening by clicking "+ Schedule New Show".</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Show Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editShow ? 'Edit Show Schedule' : 'Schedule Movie Screening'}</h2>
            {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
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
                  <label className="form-label">Theatre Multiplex *</label>
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
                  <label className="form-label">Auditorium / Screen *</label>
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
                  <label className="form-label">Screening Date *</label>
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
                  {saving ? 'Saving...' : 'Save Screening'}
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
              Delete Showtime?
            </h2>
            <p style={{ marginBottom: '14px', lineHeight: 1.6 }}>
              Delete screening for <strong>"{deleteTarget.movie_title}"</strong> at {deleteTarget.theatre_name} ({formatTime(deleteTarget.show_time)})?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete Showtime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
