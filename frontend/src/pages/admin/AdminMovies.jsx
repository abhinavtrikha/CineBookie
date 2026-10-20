import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icon';
import './Admin.css';

const EMPTY_FORM = {
  title: '',
  genre: '',
  language: '',
  duration_mins: '',
  release_date: '',
  description: '',
  poster_url: ''
};

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [deleteMovieTarget, setDeleteMovieTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMovies = () => {
    setLoading(true);
    api.get('/movies')
      .then(res => {
        setMovies(res.data.movies);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch movies catalogue.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const openAdd = () => {
    setEditMovie(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMovie(m);
    setForm({
      title: m.title,
      genre: m.genre,
      language: m.language,
      duration_mins: m.duration_mins,
      release_date: m.release_date?.split('T')[0] || '',
      description: m.description || '',
      poster_url: m.poster_url || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.genre || !form.language || !form.duration_mins || !form.release_date) {
      setError('All required fields marked with * must be filled.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editMovie) {
        await api.put(`/movies/${editMovie.id}`, form);
        setSuccess(`"${form.title}" updated successfully!`);
      } else {
        await api.post('/movies', form);
        setSuccess(`"${form.title}" added to movie catalogue!`);
      }
      setShowModal(false);
      loadMovies();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Please check form values.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteMovieTarget) return;
    try {
      await api.delete(`/movies/${deleteMovieTarget.id}`);
      setMovies(prev => prev.filter(m => m.id !== deleteMovieTarget.id));
      setSuccess(`"${deleteMovieTarget.title}" deleted.`);
      setDeleteMovieTarget(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    }
  };

  const filteredMovies = useMemo(() => {
    if (!search.trim()) return movies;
    const q = search.trim().toLowerCase();
    return movies.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.genre.toLowerCase().includes(q) ||
      m.language.toLowerCase().includes(q)
    );
  }, [movies, search]);

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div>
          <h1 className="page-title">Movie Catalogue</h1>
          <p className="page-subtitle">Add, update, or remove movies showing in cinemas (FR-7 to FR-10)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          + Add New Movie
        </button>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
      {success && <div className="alert alert-success"><Icon name="check" /> <span>{success}</span></div>}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '12px 18px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by title, genre, or language..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '380px' }}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading catalogue...</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Runtime</th>
                <th>Release Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map(movie => (
                <tr key={movie.id}>
                  <td>
                    <img
                      src={movie.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&q=80'}
                      alt={movie.title}
                      style={{ width: '42px', height: '58px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ fontWeight: 700 }}>{movie.title}</td>
                  <td><span className="badge badge-genre">{movie.genre}</span></td>
                  <td><span className="badge badge-language">{movie.language}</span></td>
                  <td>{movie.duration_mins} min</td>
                  <td>
                    {new Date(movie.release_date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(movie)} type="button">
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteMovieTarget(movie)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMovies.length === 0 && (
            <div className="empty-state">
              <h3>No movies found</h3>
              <p>Try searching for a different title or add a new movie above.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: '580px' }}>
            <h2 className="modal-title">{editMovie ? 'Edit Movie Details' : 'Add New Movie to Catalogue'}</h2>
            {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  name="title"
                  className="form-input"
                  placeholder="e.g. Inception, Interstellar"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <input
                    name="genre"
                    className="form-input"
                    placeholder="e.g. Sci-Fi, Action"
                    value={form.genre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Language *</label>
                  <input
                    name="language"
                    className="form-input"
                    placeholder="e.g. English, Hindi"
                    value={form.language}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Duration (minutes) *</label>
                  <input
                    name="duration_mins"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 148"
                    value={form.duration_mins}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Release Date *</label>
                  <input
                    name="release_date"
                    type="date"
                    className="form-input"
                    value={form.release_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Synopsis / Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  rows={3}
                  placeholder="Enter a brief plot synopsis..."
                  value={form.description}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Poster Image URL</label>
                <input
                  name="poster_url"
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={form.poster_url}
                  onChange={handleChange}
                />
              </div>

              {form.poster_url && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={form.poster_url}
                    alt="Preview"
                    style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Poster preview</span>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editMovie ? 'Update Movie' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteMovieTarget && (
        <div className="modal-overlay" onClick={() => setDeleteMovieTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: 'var(--color-error)' }}>
              Delete "{deleteMovieTarget.title}"?
            </h2>
            <p style={{ marginBottom: '14px', lineHeight: 1.6 }}>
              Deleting this film will also permanently delete all show schedules and seat associations linked with it.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteMovieTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete Movie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
