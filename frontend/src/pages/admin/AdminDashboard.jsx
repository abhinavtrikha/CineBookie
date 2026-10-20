import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icon';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => {
        setStats(res.data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Active Movies', value: stats.movies, icon: 'film', link: '/admin/movies', color: '#e84393' },
    { label: 'Cinema Multiplexes', value: stats.theatres, icon: 'building', link: '/admin/theatres', color: '#f5a623' },
    { label: 'Upcoming Shows', value: stats.upcomingShows, icon: 'calendar', link: '/admin/shows', color: '#27c97a' },
    { label: 'Total Confirmed Bookings', value: stats.confirmedBookings, icon: 'ticket', link: '/admin/bookings', color: '#5b9cf6' },
    { label: 'Registered Customers', value: stats.customers, icon: 'users', link: '/admin/bookings', color: '#a78bfa' },
    { label: 'Gross Box-Office Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: 'revenue', link: '/admin/bookings', color: '#fb923c' },
  ] : [];

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">Cinema Operations Hub</h1>
        <p className="page-subtitle">Real-time system overview, ticket analytics, and inventory management</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Compiling box office statistics...</p>
        </div>
      ) : (
        <div className="stats-grid">
          {statCards.map(card => (
            <Link key={card.label} to={card.link} className="stat-card card card-hover">
              <div className="stat-icon" style={{ color: card.color }}><Icon name={card.icon} size={28} /></div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label text-muted">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Action Portals */}
      <div className="admin-quick-links">
        <h2 style={{ fontSize: '1.35rem', marginBottom: '20px', fontWeight: 800 }}>Quick Administration</h2>
        <div className="quick-links-grid">
          <Link to="/admin/movies" className="quick-link card card-hover">
            <span className="quick-link-icon"><Icon name="film" size={24} /></span>
            <div>
              <h3>Catalogue Management</h3>
              <p className="text-muted">Add new release titles, update runtimes, or edit descriptions</p>
            </div>
          </Link>

          <Link to="/admin/theatres" className="quick-link card card-hover">
            <span className="quick-link-icon"><Icon name="building" size={24} /></span>
            <div>
              <h3>Theatres & Venues</h3>
              <p className="text-muted">Register cinema locations, screens, and seat layouts</p>
            </div>
          </Link>

          <Link to="/admin/shows" className="quick-link card card-hover">
            <span className="quick-link-icon"><Icon name="calendar" size={24} /></span>
            <div>
              <h3>Show Scheduling</h3>
              <p className="text-muted">Schedule movie screenings across audis and dates</p>
            </div>
          </Link>

          <Link to="/admin/bookings" className="quick-link card card-hover">
            <span className="quick-link-icon"><Icon name="clipboard" size={24} /></span>
            <div>
              <h3>Customer Reservations</h3>
              <p className="text-muted">Audit guest bookings, verify payments, and process cancellations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
