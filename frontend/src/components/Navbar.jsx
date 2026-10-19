import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎬</span>
          <span className="brand-name">CineBookie</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/movies" className="nav-link" onClick={() => setMenuOpen(false)}>Movies</Link>

          {!user && (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}

          {user && user.role === 'customer' && (
            <>
              <Link to="/bookings" className="nav-link" onClick={() => setMenuOpen(false)}>My Bookings</Link>
              <div className="nav-user">
                <span className="user-name">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
              </div>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/movies" className="nav-link" onClick={() => setMenuOpen(false)}>Movies</Link>
              <Link to="/admin/theatres" className="nav-link" onClick={() => setMenuOpen(false)}>Theatres</Link>
              <Link to="/admin/shows" className="nav-link" onClick={() => setMenuOpen(false)}>Shows</Link>
              <Link to="/admin/bookings" className="nav-link" onClick={() => setMenuOpen(false)}>Bookings</Link>
              <div className="nav-user">
                <span className="user-name admin-badge">Admin</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
              </div>
            </>
          )}
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
