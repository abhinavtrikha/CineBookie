import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const [imgError, setImgError] = useState(false);
  const posterFallback = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80';

  // Compute a deterministic rating based on movie id for visual richness
  const rating = (7.8 + ((movie.id * 3) % 18) / 10).toFixed(1);

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-poster">
        <img
          src={!imgError && movie.poster_url ? movie.poster_url : posterFallback}
          alt={movie.title}
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
          width="400"
          height="600"
        />
        <div className="movie-rating-badge">
          <Icon name="star" size={14} className="rating-star" /> {rating}
        </div>
        <div className="movie-poster-overlay">
          <span className="btn btn-primary btn-sm book-overlay-btn">
            <Icon name="ticket" size={16} /> Book Tickets
          </span>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title" title={movie.title}>{movie.title}</h3>
        <div className="movie-meta">
          <span className="badge badge-genre">{movie.genre}</span>
          <span className="badge badge-language">{movie.language}</span>
        </div>
        <div className="movie-sub-info">
          <span className="movie-duration text-muted"><Icon name="clock" size={14} /> {movie.duration_mins} mins</span>
          <span className="movie-format text-muted">2D · 4DX</span>
        </div>
      </div>
    </Link>
  );
}
