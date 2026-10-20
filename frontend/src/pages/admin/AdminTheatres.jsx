import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icon';
import './Admin.css';

const EMPTY_FORM = { name: '', location: '', city: '' };

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTheatre, setEditTheatre] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTheatres = () => {
    setLoading(true);
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
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/theatres/${deleteTarget.id}`);
      setTheatres(prev => prev.filter(t => t.id !== deleteTarget.id));
      setSuccess(`"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    }
  };

  const filteredTheatres = useMemo(() => {
    if (!search.trim()) return theatres;
    const q = search.trim().toLowerCase();
    return theatres.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    );
  }, [theatres, search]);

  return (
    <div className="admin-page container">
      <div className="admin-header-bar">
        <div>
          <h1 className="page-title">Cinema Multiplexes</h1>
          <p className="page-subtitle">Manage cinema venues and locations (FR-11, FR-12)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          + Add New Theatre
        </button>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
      {success && <div className="alert alert-success"><Icon name="check" /> <span>{success}</span></div>}

      <div className="card" style={{ marginBottom: '20px', padding: '12px 18px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by theatre name, city, or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '380px' }}
        />
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading theatres...</p></div>
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
              {filteredTheatres.map(theatre => (
                <tr key={theatre.id}>
                  <td>{theatre.id}</td>
                  <td style={{ fontWeight: 700 }}><Icon name="building" size={16} /> {theatre.name}</td>
                  <td><span className="badge badge-language">{theatre.city}</span></td>
                  <td>{theatre.location}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/admin/screens?theatre_id=${theatre.id}`} className="btn btn-ghost btn-sm">
                        Configure Screens
                      </Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(theatre)} type="button">
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(theatre)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTheatres.length === 0 && (
            <div className="empty-state">
              <h3>No theatres found</h3>
              <p>Add your first cinema theatre or modify your search filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editTheatre ? 'Edit Cinema Venue' : 'Register New Cinema Venue'}</h2>
            {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Theatre Name *</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="e.g. CineMax Multiplex, PVR ICON"
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
                  placeholder="e.g. Delhi, Mumbai, Bengaluru, Chennai"
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: 'var(--color-error)' }}>
              Delete "{deleteTarget.name}"?
            </h2>
            <p style={{ marginBottom: '14px', lineHeight: 1.6 }}>
              Deleting this cinema will permanently delete all associated auditoriums, screens, seat layouts, and show schedules.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete Theatre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
