import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => { setStats(res.data.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Movies', value: stats.movies, icon: '🎬', link: '/admin/movies', color: '#e84393' },
    { label: 'Theatres', value: stats.theatres, icon: '🏛️', link: '/admin/theatres', color: '#f5a623' },
    { label: 'Upcoming Shows', value: stats.upcomingShows, icon: '🎭', link: '/admin/shows', color: '#27c97a' },
    { label: 'Confirmed Bookings', value: stats.confirmedBookings, icon: '🎟️', link: '/admin/bookings', color: '#5b9cf6' },
    { label: 'Customers', value: stats.customers, icon: '👥', link: '#', color: '#a78bfa' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: '💰', link: '/admin/bookings', color: '#fb923c' },
  ] : [];

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of CineBookie system</p>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="stats-grid">
          {statCards.map(card => (
            <Link key={card.label} to={card.link} className="stat-card card card-hover">
              <div className="stat-icon" style={{color:card.color}}>{card.icon}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label text-muted">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="admin-quick-links">
        <h2 style={{marginBottom:'20px'}}>Quick Actions</h2>
        <div className="quick-links-grid">
          <Link to="/admin/movies" className="quick-link card card-hover">
            <span style={{fontSize:'2rem'}}>🎬</span>
            <div>
              <h3>Manage Movies</h3>
              <p className="text-muted">Add, edit, or remove movies</p>
            </div>
          </Link>
          <Link to="/admin/theatres" className="quick-link card card-hover">
            <span style={{fontSize:'2rem'}}>🏛️</span>
            <div>
              <h3>Manage Theatres</h3>
              <p className="text-muted">Add theatres, screens, and seats</p>
            </div>
          </Link>
          <Link to="/admin/shows" className="quick-link card card-hover">
            <span style={{fontSize:'2rem'}}>📅</span>
            <div>
              <h3>Schedule Shows</h3>
              <p className="text-muted">Create and manage showtimes</p>
            </div>
          </Link>
          <Link to="/admin/bookings" className="quick-link card card-hover">
            <span style={{fontSize:'2rem'}}>📋</span>
            <div>
              <h3>View Bookings</h3>
              <p className="text-muted">All customer booking records</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
