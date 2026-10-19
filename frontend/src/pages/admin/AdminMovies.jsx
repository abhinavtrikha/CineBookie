import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

const EMPTY_FORM = { title: '', genre: '', language: '', duration_mins: '', release_date: '', description: '', poster_url: '' };

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMovies = () => {
    api.get('/movies').then(res => { setMovies(res.data.movies); setLoading(false); });
  };

  useEffect(() => { loadMovies(); }, []);

  const openAdd = () => { setEditMovie(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (m) => {
    setEditMovie(m);
    setForm({
      title: m.title, genre: m.genre, language: m.language,
      duration_mins: m.duration_mins, release_date: m.release_date?.split('T')[0] || '',
      description: m.description || '', poster_url: m.poster_url || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.genre || !form.language || !form.duration_mins || !form.release_date) {
      setError('All required fields must be filled.'); return;
    }
    setSaving(true); setError('');
    try {
      if (editMovie) {
        await api.put(`/movies/${editMovie.id}`, form);
        setSuccess('Movie updated!');
      } else {
        await api.post('/movies', form);
        setSuccess('Movie added!');
      }
      setShowModal(false);
      loadMovies();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will also delete all associated shows.`)) return;
    try {
      await api.delete(`/movies/${id}`);
      setMovies(prev => prev.filter(m => m.id !== id));
      setSuccess('Movie deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div className="page-header" style={{paddingBottom:0}}>
          <h1 className="page-title">Movies</h1>
          <p className="page-subtitle">Manage movie catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Movie</button>
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
                <th>Title</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Release Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map(movie => (
                <tr key={movie.id}>
                  <td style={{fontWeight:600}}>{movie.title}</td>
                  <td><span className="badge badge-genre">{movie.genre}</span></td>
                  <td><span className="badge badge-language">{movie.language}</span></td>
                  <td>{movie.duration_mins} min</td>
                  <td>{new Date(movie.release_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</td>
                  <td>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(movie)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(movie.id, movie.title)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movies.length === 0 && <div className="empty-state"><h3>No movies found</h3></div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input name="title" className="form-input" value={form.title} onChange={handleChange} required />
              </div>
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <input name="genre" className="form-input" value={form.genre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Language *</label>
                  <input name="language" className="form-input" value={form.language} onChange={handleChange} required />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Duration (mins) *</label>
                  <input name="duration_mins" type="number" min="1" className="form-input" value={form.duration_mins} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Release Date *</label>
                  <input name="release_date" type="date" className="form-input" value={form.release_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-input" rows={3} value={form.description} onChange={handleChange} style={{resize:'vertical'}} />
              </div>
              <div className="form-group">
                <label className="form-label">Poster URL</label>
                <input name="poster_url" type="url" className="form-input" placeholder="https://..." value={form.poster_url} onChange={handleChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Movie'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
