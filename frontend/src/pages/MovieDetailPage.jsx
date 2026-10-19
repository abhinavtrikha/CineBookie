import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './MovieDetailPage.css';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const posterFallback = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80`;

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then(res => { setMovie(res.data.movie); setLoading(false); })
      .catch(() => { setError('Movie not found.'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading movie...</p></div>;
  if (error || !movie) return <div className="container" style={{padding:'60px 20px', textAlign:'center'}}><h2>{error}</h2><Link to="/movies" className="btn btn-secondary" style={{marginTop:'16px'}}>Back to Movies</Link></div>;

  const releaseDate = new Date(movie.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/movies/${id}/shows`);
  };

  return (
    <div className="movie-detail">
      <div className="detail-backdrop">
        <img src={movie.poster_url || posterFallback} alt="" aria-hidden="true" onError={e => { e.target.src = posterFallback; }} />
        <div className="backdrop-overlay" />
      </div>

      <div className="detail-content container">
        <div className="detail-layout">
          <div className="detail-poster">
            <img src={movie.poster_url || posterFallback} alt={movie.title} onError={e => { e.target.src = posterFallback; }} />
          </div>
          <div className="detail-info">
            <Link to="/movies" className="back-link text-muted">← Back to Movies</Link>
            <h1 className="detail-title">{movie.title}</h1>
            <div className="detail-badges">
              <span className="badge badge-genre">{movie.genre}</span>
              <span className="badge badge-language">{movie.language}</span>
            </div>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{movie.duration_mins} minutes</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Release Date</span>
                <span className="meta-value">{releaseDate}</span>
              </div>
            </div>
            {movie.description && (
              <div className="detail-desc">
                <h3>About the Film</h3>
                <p className="text-muted">{movie.description}</p>
              </div>
            )}
            <div className="detail-actions">
              <button onClick={handleBooking} className="btn btn-primary btn-lg">
                🎟️ Book Tickets
              </button>
            </div>
            {!user && (
              <p className="text-muted" style={{fontSize:'0.85rem', marginTop:'12px'}}>
                <Link to="/login" className="text-primary">Sign in</Link> to book tickets
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
