import './MovieCard.css';
import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const posterFallback = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80`;

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card card-hover">
      <div className="movie-poster">
        <img
          src={movie.poster_url || posterFallback}
          alt={movie.title}
          onError={(e) => { e.target.src = posterFallback; }}
          loading="lazy"
        />
        <div className="movie-poster-overlay">
          <span className="btn btn-primary btn-sm">Book Tickets</span>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="badge badge-genre">{movie.genre}</span>
          <span className="badge badge-language">{movie.language}</span>
        </div>
        <p className="movie-duration text-muted">{movie.duration_mins} min</p>
      </div>
    </Link>
  );
}
