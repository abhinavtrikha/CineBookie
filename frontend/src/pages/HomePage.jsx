import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import MovieCard from '../components/MovieCard';
import './HomePage.css';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/movies').then(res => {
      setMovies(res.data.movies.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/movies');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="live-dot" /> Instant Cinema Booking Platform
            </div>
            <h1 className="hero-title">
              Experience Cinema<br />
              <span className="hero-highlight">At Its Finest</span>
            </h1>
            <p className="hero-subtitle">
              Discover now-playing blockbusters, pick the best seats in the theatre with live seating maps, and receive instant digital tickets.
            </p>

            {/* Quick Hero Search */}
            <form className="hero-search-bar" onSubmit={handleHeroSearch}>
              <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search movies, languages or genres..."
                aria-label="Search movies, languages or genres"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary hero-search-btn">
                Find Movies
              </button>
            </form>

            <div className="hero-actions">
              <Link to="/movies" className="btn btn-secondary">
                <Icon name="film" /> Browse All Movies
              </Link>
              <Link to="/register" className="btn btn-ghost">
                Create Account →
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-glow" />
            <div className="film-frame film-frame-back">
              <span className="film-frame-label">CINEMA</span>
              <span className="film-frame-number">01</span>
            </div>
            <div className="film-frame film-frame-front">
              <div className="film-frame-top">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="ticket-mark">
                <svg viewBox="0 0 72 72" fill="none">
                  <path d="M14 22h44v9a7 7 0 0 0 0 14v9H14v-9a7 7 0 0 0 0-14v-9Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M36 25v3m0 5v3m0 5v3m0 5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="m25 39 7 6 15-17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="film-frame-caption">YOUR NIGHT, YOUR SEAT</span>
              <span className="film-frame-title">The show<br />starts here.</span>
              <span className="film-frame-subtitle">PICK A FILM · FIND YOUR SEAT</span>
              <div className="film-frame-bottom">
                <span>ADMIT ONE</span>
                <span>CB · 2026</span>
              </div>
            </div>
            <span className="hero-art-spark hero-art-spark-one" />
            <span className="hero-art-spark hero-art-spark-two" />
          </div>
        </div>
      </section>

      {/* Trust & Stats Ticker */}
      <section className="stats-ticker-section">
        <div className="container stats-ticker-wrap">
          <div className="ticker-item">
            <span className="ticker-icon"><Icon name="bolt" size={24} /></span>
            <div>
              <strong>Instant Confirmation</strong>
              <p className="text-muted">Direct seat reservation without delay</p>
            </div>
          </div>
          <div className="ticker-item">
            <span className="ticker-icon"><Icon name="chair" size={24} /></span>
            <div>
              <strong>Live Interactive Seatmap</strong>
              <p className="text-muted">Choose standard or premium recliner seats</p>
            </div>
          </div>
          <div className="ticker-item">
            <span className="ticker-icon"><Icon name="phone" size={24} /></span>
            <div>
              <strong>Digital E-Tickets</strong>
              <p className="text-muted">Paperless QR codes and printable tickets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="now-showing container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Now Showing in Theatres</h2>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>Select a movie to explore showtimes and book your seats</p>
          </div>
          <Link to="/movies" className="see-all">
            View All Movies →
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading featured releases...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <h3>No movies available</h3>
            <p>Check back soon for new movie releases.</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Features Showcase */}
      <section className="features-section container">
        <div className="features-header text-center">
          <h2 className="section-title">Why Book With CineBookie?</h2>
          <p className="text-muted">Designed from the ground up for a fast, frictionless moviegoing experience.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Icon name="masks" size={38} /></div>
            <h3>Curated Catalogue</h3>
            <p>Browse films by genre, language, duration, and showtimes across multiple premier cinema multiplexes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Icon name="chair" size={38} /></div>
            <h3>Interactive Seating</h3>
            <p>Select your preferred row and seats with real-time seat locks to prevent double-booking collisions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Icon name="ticket" size={38} /></div>
            <h3>Instant E-Tickets</h3>
            <p>Instant unique booking ID with printable passes, verification codes, and calendar integration.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Icon name="card" size={38} /></div>
            <h3>Seamless Sandbox Payments</h3>
            <p>Simulate card payments, UPI transfers, and net banking with full transaction tracking and cancellation.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand-wrap">
            <div className="footer-brand"><Icon name="film" /> CineBookie</div>
            <p className="footer-note">
              Online Movie Ticket Booking System (OMTBS) — Professional Cinema Demonstration Platform
            </p>
          </div>
          <div className="footer-links">
            <Link to="/movies">Movies</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <p className="footer-copyright text-muted">
            © {new Date().getFullYear()} CineBookie. All movie information and assets for demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
