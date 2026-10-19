import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import MovieCard from '../components/MovieCard';
import './HomePage.css';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies').then(res => {
      setMovies(res.data.movies.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <div className="hero-text">
            <h1 className="hero-title">
              Book Movie Tickets<br />
              <span className="hero-highlight">Instantly Online</span>
            </h1>
            <p className="hero-subtitle">
              Browse the latest movies, choose your seats, and confirm your booking in minutes.
            </p>
            <div className="hero-actions">
              <Link to="/movies" className="btn btn-primary btn-lg">
                🎬 Browse Movies
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section container">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Browse Movies</h3>
            <p>Discover latest releases across all genres and languages.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🪑</div>
            <h3>Choose Your Seat</h3>
            <p>Interactive seat map with real-time availability.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3>Instant Confirmation</h3>
            <p>Get a unique booking ID the moment your payment clears.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Booking History</h3>
            <p>Access all your current and past bookings anytime.</p>
          </div>
        </div>
      </section>

      {/* Now Showing */}
      <section className="now-showing container">
        <div className="section-header">
          <h2>Now Showing</h2>
          <Link to="/movies" className="see-all">See All →</Link>
        </div>
        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Loading movies...</p></div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <h3>No movies available</h3>
            <p>Check back soon for new releases.</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p className="footer-brand">🎬 CineBookie</p>
          <p className="footer-note">
            Online Movie Ticket Booking System — Demonstration Application
          </p>
          <p className="footer-note text-muted" style={{fontSize:'0.8rem', marginTop:'8px'}}>
            All movie data shown is for demonstration purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
