import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './ShowsPage.css';

function groupShowsByTheatre(shows) {
  const map = {};
  for (const show of shows) {
    const key = show.theatre_id;
    if (!map[key]) {
      map[key] = { theatre: { id: show.theatre_id, name: show.theatre_name, city: show.city }, shows: [] };
    }
    map[key].shows.push(show);
  }
  return Object.values(map);
}

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    days.push({ iso, label });
  }
  return days;
}

function formatTime(timeStr) {
  // timeStr is HH:MM:SS or HH:MM
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function ShowsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].iso);
  const [error, setError] = useState('');
  const days = getNext7Days();

  useEffect(() => {
    api.get(`/movies/${id}`).then(res => setMovie(res.data.movie)).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    api.get('/shows', { params: { movie_id: id, date: selectedDate } })
      .then(res => { setShows(res.data.shows); setLoading(false); })
      .catch(() => { setError('Failed to load shows.'); setLoading(false); });
  }, [id, selectedDate]);

  const theatreGroups = groupShowsByTheatre(shows);

  const handleSelectShow = (showId) => {
    if (!user) { navigate('/login'); return; }
    navigate(`/shows/${showId}/seats`);
  };

  return (
    <div className="shows-page container">
      <div className="page-header">
        {movie && (
          <div className="shows-movie-header">
            <Link to={`/movies/${id}`} className="back-link text-muted">← Back</Link>
            <h1 className="page-title">{movie.title}</h1>
            <div className="shows-movie-meta">
              <span className="badge badge-genre">{movie.genre}</span>
              <span className="badge badge-language">{movie.language}</span>
              <span className="text-muted" style={{fontSize:'0.9rem'}}>{movie.duration_mins} min</span>
            </div>
          </div>
        )}
      </div>

      {/* Date selector */}
      <div className="date-selector">
        {days.map(day => (
          <button
            key={day.iso}
            className={`date-btn ${selectedDate === day.iso ? 'active' : ''}`}
            onClick={() => setSelectedDate(day.iso)}
          >
            {day.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading shows...</p></div>
      ) : theatreGroups.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:'3rem', marginBottom:'16px'}}>🎭</div>
          <h3>No shows available</h3>
          <p>No shows scheduled for this date. Try another date.</p>
        </div>
      ) : (
        <div className="theatre-groups">
          {theatreGroups.map(group => (
            <div key={group.theatre.id} className="theatre-group card">
              <div className="theatre-header">
                <div>
                  <h3 className="theatre-name">{group.theatre.name}</h3>
                  <p className="theatre-city text-muted">{group.theatre.city}</p>
                </div>
              </div>
              <div className="show-times">
                {group.shows.map(show => (
                  <button
                    key={show.id}
                    className="show-time-btn"
                    onClick={() => handleSelectShow(show.id)}
                  >
                    <span className="show-time">{formatTime(show.show_time)}</span>
                    <span className="show-screen text-muted">{show.screen_name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
