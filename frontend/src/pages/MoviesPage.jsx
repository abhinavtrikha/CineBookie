import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import Icon from '../components/Icon';
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
  const [sortBy, setSortBy] = useState('default');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const fetchMovies = async () => {
        setLoading(true);
        setError('');
        try {
          const params = {};
          if (search.trim()) params.search = search.trim();
          if (genre !== 'All') params.genre = genre;
          if (language !== 'All') params.language = language;
          const res = await api.get('/movies', { params, signal: controller.signal });
          setMovies(res.data.movies);
        } catch {
          if (!controller.signal.aborted) {
            setError('Failed to load movies. Please try again.');
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      fetchMovies();
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, genre, language]);

  const handleResetFilters = () => {
    setSearch('');
    setGenre('All');
    setLanguage('All');
    setSortBy('default');
  };

  const hasActiveFilters = search.trim() !== '' || genre !== 'All' || language !== 'All';

  // Client-side sorting for instantaneous response
  const sortedMovies = useMemo(() => {
    const list = [...movies];
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'title-desc') {
      return list.sort((a, b) => b.title.localeCompare(a.title));
    }
    if (sortBy === 'duration-asc') {
      return list.sort((a, b) => a.duration_mins - b.duration_mins);
    }
    if (sortBy === 'duration-desc') {
      return list.sort((a, b) => b.duration_mins - a.duration_mins);
    }
    return list;
  }, [movies, sortBy]);

  return (
    <div className="movies-page container">
      <div className="page-header">
        <h1 className="page-title">Explore Movies</h1>
        <p className="page-subtitle">Catch the latest blockbusters and critically acclaimed releases</p>
      </div>

      {/* Search & Filters */}
      <div className="movies-filters">
        <div className="search-sort-bar">
          <div className="search-input-wrap">
            <Icon name="search" size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search movies by title, genre, or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => setSearch('')}
                title="Clear search"
                type="button"
              >
                ×
              </button>
            )}
          </div>

          <div className="sort-wrap">
            <label className="sort-label">Sort by:</label>
            <select
              className="form-input sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="default">Featured</option>
              <option value="title-asc">Title (A to Z)</option>
              <option value="title-desc">Title (Z to A)</option>
              <option value="duration-asc">Duration (Shortest)</option>
              <option value="duration-desc">Duration (Longest)</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Genre</label>
            <div className="filter-chips">
              {GENRES.map(g => (
                <button
                  key={g}
                  className={`chip ${genre === g ? 'active' : ''}`}
                  onClick={() => setGenre(g)}
                  type="button"
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
                  type="button"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="active-filters-bar">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Active Filters:</span>
            {search && <span className="active-pill">Keyword: "{search}"</span>}
            {genre !== 'All' && <span className="active-pill">Genre: {genre}</span>}
            {language !== 'All' && <span className="active-pill">Language: {language}</span>}
            <button className="reset-filters-btn" onClick={handleResetFilters} type="button">
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Fetching movies catalogue...</p>
        </div>
      ) : sortedMovies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="film" size={52} /></div>
          <h3>No movies found</h3>
          <p>We couldn't find any movies matching your current search or filters.</p>
          {hasActiveFilters && (
            <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={handleResetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="results-header">
            <p className="results-count text-muted">
              Showing <strong>{sortedMovies.length}</strong> {sortedMovies.length === 1 ? 'movie' : 'movies'}
            </p>
          </div>
          <div className="movies-grid">
            {sortedMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
