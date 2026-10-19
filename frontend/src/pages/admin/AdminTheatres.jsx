import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './Admin.css';

const EMPTY_FORM = { name: '', location: '', city: '' };

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTheatre, setEditTheatre] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTheatres = () => {
    api.get('/theatres')
      .then(res => {
        setTheatres(res.data.theatres);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load theatres.');
        setLoading(false);
      });
  };

  useEffect(() => { loadTheatres(); }, []);

  const openAdd = () => {
    setEditTheatre(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTheatre(t);
    setForm({ name: t.name, location: t.location, city: t.city });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.city) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editTheatre) {
        await api.put(`/theatres/${editTheatre.id}`, form);
        setSuccess('Theatre updated successfully!');
      } else {
        await api.post('/theatres', form);
        setSuccess('Theatre added successfully!');
      }
      setShowModal(false);
      loadTheatres();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This will also remove its screens and shows.`)) return;
    try {
      await api.delete(`/theatres/${id}`);
      setTheatres(prev => prev.filter(t => t.id !== id));
      setSuccess('Theatre deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div className="page-header" style={{ paddingBottom: 0 }}>
          <h1 className="page-title">Theatres</h1>
          <p className="page-subtitle">Manage cinema locations and venues (FR-11, FR-12)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Theatre</button>
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
                <th>Theatre Name</th>
                <th>City</th>
                <th>Location / Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theatres.map(theatre => (
                <tr key={theatre.id}>
                  <td>{theatre.id}</td>
                  <td style={{ fontWeight: 600 }}>{theatre.name}</td>
                  <td><span className="badge badge-language">{theatre.city}</span></td>
                  <td>{theatre.location}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/admin/screens?theatre_id=${theatre.id}`} className="btn btn-ghost btn-sm">
                        Screens
                      </Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(theatre)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(theatre.id, theatre.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {theatres.length === 0 && (
            <div className="empty-state">
              <h3>No theatres found</h3>
              <p>Add your first cinema theatre to get started.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editTheatre ? 'Edit Theatre' : 'Add New Theatre'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Theatre Name *</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="e.g. CineMax Multiplex"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  name="city"
                  className="form-input"
                  placeholder="e.g. Delhi, Mumbai, Bengaluru"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address / Location *</label>
                <textarea
                  name="location"
                  className="form-input"
                  rows={3}
                  placeholder="Street address, mall name, etc."
                  value={form.location}
                  onChange={handleChange}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Theatre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
