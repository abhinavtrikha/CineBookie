import { useState, useEffect } from 'react';
import api from '../api/axios';
import MovieCard from '../components/MovieCard';
import './MoviesPage.css';

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation'];
const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [error, setError] = useState('');

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (genre !== 'All') params.genre = genre;
      if (language !== 'All') params.language = language;
      const res = await api.get('/movies', { params });
      setMovies(res.data.movies);
    } catch (err) {
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovies(); }, [genre, language]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  return (
    <div className="movies-page container">
      <div className="page-header">
        <h1 className="page-title">Movies</h1>
        <p className="page-subtitle">Browse and book tickets for now showing films</p>
      </div>

      {/* Search & Filters */}
      <div className="movies-filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search movies by title or genre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Genre</label>
            <div className="filter-chips">
              {GENRES.map(g => (
                <button
                  key={g}
                  className={`chip ${genre === g ? 'active' : ''}`}
                  onClick={() => setGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Language</label>
            <div className="filter-chips">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  className={`chip ${language === l ? 'active' : ''}`}
                  onClick={() => setLanguage(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading movies...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:'3rem', marginBottom:'16px'}}>🎬</div>
          <h3>No movies found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="results-count text-muted">{movies.length} movie{movies.length !== 1 ? 's' : ''} found</p>
          <div className="movies-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        </>
      )}
    </div>
  );
}
