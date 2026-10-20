import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const getUserInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <svg className="brand-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M8 15.5h24v17H8v-17Z" fill="url(#brand-body)" />
            <path d="m8 13.5 21.7-7 2.3 7H8Z" fill="url(#brand-top)" />
            <path d="m13 12 5-6m4 4 5-6" stroke="#171522" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 21h3m5 0h3m5 0h2" stroke="#fff" strokeOpacity=".82" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="brand-body" x1="8" y1="15" x2="32" y2="33" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF65B3" />
                <stop offset="1" stopColor="#E84393" />
              </linearGradient>
              <linearGradient id="brand-top" x1="8" y1="7" x2="32" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF65B3" />
                <stop offset="1" stopColor="#F5A623" />
              </linearGradient>
            </defs>
          </svg>
          <span className="brand-name">CineBookie</span>
        </Link>

        <div id="primary-navigation" className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink
            to="/movies"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Movies
          </NavLink>

          {!user && (
            <div className="nav-auth-buttons">
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          )}

          {user && user.role === 'customer' && (
            <>
              <NavLink
                to="/bookings"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon name="ticket" size={18} /> My Bookings
              </NavLink>
              <div className="nav-user">
                <div className="user-avatar" title={user.name}>
                  {getUserInitial(user.name)}
                </div>
                <span className="user-name">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm logout-btn">
                  Sign Out
                </button>
              </div>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <div className="admin-nav-group">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/movies"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Movies
                </NavLink>
                <NavLink
                  to="/admin/theatres"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Theatres
                </NavLink>
                <NavLink
                  to="/admin/screens"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Screens
                </NavLink>
                <NavLink
                  to="/admin/shows"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Shows
                </NavLink>
                <NavLink
                  to="/admin/bookings"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Bookings
                </NavLink>
              </div>
              <div className="nav-user">
                <span className="admin-badge">Admin</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm logout-btn">
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        <button
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
