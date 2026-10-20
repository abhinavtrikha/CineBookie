import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import './MovieDetailPage.css';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const navigate = useNavigate();
  const posterFallback = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80';

  useEffect(() => {
    setLoading(true);
    api.get(`/movies/${id}`)
      .then(res => {
        setMovie(res.data.movie);
        setLoading(false);
      })
      .catch(() => {
        setError('Movie not found or no longer in theatres.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading film details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>{error || 'Movie not found'}</h2>
        <p className="text-muted" style={{ margin: '12px 0 24px' }}>
          The requested movie could not be located in our cinema system.
        </p>
        <Link to="/movies" className="btn btn-secondary">
          ← Back to Movies Catalogue
        </Link>
      </div>
    );
  }

  const releaseDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Now Showing';

  const rating = (7.9 + ((movie.id * 3) % 18) / 10).toFixed(1);

  return (
    <div className="movie-detail">
      {/* Dynamic Backdrop */}
      <div className="detail-backdrop">
        <img
          src={movie.poster_url || posterFallback}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.target.src = posterFallback; }}
        />
        <div className="backdrop-overlay" />
      </div>

      <div className="detail-content container">
        <Link to="/movies" className="back-link">
          ← Back to Movies
        </Link>

        <div className="detail-layout">
          {/* Left Poster */}
          <div className="detail-poster">
            <img
              src={movie.poster_url || posterFallback}
              alt={movie.title}
              onError={(e) => { e.target.src = posterFallback; }}
            />
            <button
              className="trailer-btn"
              onClick={() => setShowTrailerModal(true)}
              type="button"
            >
              ▶ Watch Trailer
            </button>
          </div>

          {/* Right Info */}
          <div className="detail-info">
            <div className="title-row">
              <h1 className="detail-title">{movie.title}</h1>
              <div className="rating-pill">
                <Icon name="star" size={16} className="star-icon" />
                <strong>{rating}</strong>
                <span className="vote-count text-muted">/10 · 12.4K votes</span>
              </div>
            </div>

            <div className="detail-badges">
              <span className="badge badge-genre">{movie.genre}</span>
              <span className="badge badge-language">{movie.language}</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>UA 13+</span>
              <span className="badge" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--color-accent)' }}>IMAX 2D / 3D</span>
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{movie.duration_mins} mins</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Release Date</span>
                <span className="meta-value">{releaseDate}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Sound Mix</span>
                <span className="meta-value">Dolby Atmos 7.1</span>
              </div>
            </div>

            <div className="detail-desc">
              <h3>About the Film</h3>
              <p className="text-muted">
                {movie.description ||
                  `Experience ${movie.title} on the silver screen with superior acoustics and crystal-clear visual projection. Book your tickets now to secure optimal viewing angles.`}
              </p>
            </div>

            <div className="detail-actions">
              <button
                onClick={() => navigate(`/movies/${id}/shows`)}
                className="btn btn-primary btn-lg book-main-cta"
              >
                <Icon name="ticket" /> Select Showtimes & Theatres →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className="modal-overlay" onClick={() => setShowTrailerModal(false)}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trailer-modal-header">
              <h3>Official Trailer — {movie.title}</h3>
              <button className="close-trailer-btn" onClick={() => setShowTrailerModal(false)}>×</button>
            </div>
            <div className="trailer-video-placeholder">
              <div className="play-pulse">▶</div>
              <p style={{ marginTop: '16px', fontWeight: 600 }}>Simulated Cinema Trailer Player</p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Full HD 1080p · Dolby Digital 5.1 Stereo Preview</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
