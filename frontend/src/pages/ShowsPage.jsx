import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './ShowsPage.css';

// Fix UTC timezone issue: format using local calendar components
function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;

    const weekdayShort = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
    const dayNumber = d.getDate();
    const monthShort = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    const isToday = i === 0;

    days.push({
      iso,
      weekday: weekdayShort,
      dayNumber,
      month: monthShort,
      isToday,
      label: isToday ? 'TODAY' : weekdayShort
    });
  }
  return days;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function groupShowsByTheatre(shows) {
  const map = {};
  for (const show of shows) {
    const key = show.theatre_id;
    if (!map[key]) {
      map[key] = {
        theatre: {
          id: show.theatre_id,
          name: show.theatre_name,
          city: show.city
        },
        shows: []
      };
    }
    map[key].shows.push(show);
  }
  return Object.values(map);
}

export default function ShowsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const days = useMemo(() => getNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState(days[0].iso);
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then(res => setMovie(res.data.movie))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/shows', { params: { movie_id: id, date: selectedDate } })
      .then(res => {
        setShows(res.data.shows);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load show schedules for this date.');
        setLoading(false);
      });
  }, [id, selectedDate]);

  // Extract unique cities from shows for filtering
  const cities = useMemo(() => {
    const set = new Set();
    shows.forEach(s => { if (s.city) set.add(s.city); });
    return ['All', ...Array.from(set)];
  }, [shows]);

  const filteredShows = useMemo(() => {
    if (selectedCity === 'All') return shows;
    return shows.filter(s => s.city === selectedCity);
  }, [shows, selectedCity]);

  const theatreGroups = useMemo(() => groupShowsByTheatre(filteredShows), [filteredShows]);

  const handleSelectShow = (showId) => {
    if (!user) {
      navigate('/login', {
        state: { from: { pathname: `/shows/${showId}/seats` } }
      });
      return;
    }
    navigate(`/shows/${showId}/seats`);
  };

  return (
    <div className="shows-page container">
      {/* Movie info top banner */}
      <div className="shows-header-banner">
        <Link to={`/movies/${id}`} className="back-link">
          ← Back to Movie Details
        </Link>
        {movie && (
          <div className="shows-movie-header">
            <div>
              <h1 className="page-title">{movie.title}</h1>
              <div className="shows-movie-meta">
                <span className="badge badge-genre">{movie.genre}</span>
                <span className="badge badge-language">{movie.language}</span>
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>⏱ {movie.duration_mins} mins</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>UA 13+</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Ribbon Picker */}
      <div className="date-picker-wrap card">
        <div className="date-picker-header">
          <span className="date-picker-title"><Icon name="calendar" /> Select Screening Date:</span>
          {cities.length > 2 && (
            <div className="city-filter-wrap">
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>City:</span>
              <select
                className="form-input city-select"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="date-ribbon">
          {days.map(day => {
            const isSelected = selectedDate === day.iso;
            return (
              <button
                key={day.iso}
                className={`date-ribbon-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedDate(day.iso)}
                type="button"
              >
                <span className="ribbon-weekday">{day.label}</span>
                <span className="ribbon-day">{day.dayNumber}</span>
                <span className="ribbon-month">{day.month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

      {/* Shows List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Finding available showtimes...</p>
        </div>
      ) : theatreGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="masks" size={48} /></div>
          <h3>No screenings available on this date</h3>
          <p>There are no scheduled showtimes for the selected date. Please pick another date above.</p>
        </div>
      ) : (
        <div className="theatre-groups">
          <div className="theatre-groups-info text-muted">
            Available at <strong>{theatreGroups.length}</strong> {theatreGroups.length === 1 ? 'cinema location' : 'cinema locations'}:
          </div>

          {theatreGroups.map(group => (
            <div key={group.theatre.id} className="theatre-group card">
              <div className="theatre-header">
                <div>
                  <h3 className="theatre-name"><Icon name="building" size={18} /> {group.theatre.name}</h3>
                  <p className="theatre-city text-muted"><Icon name="pin" size={15} /> {group.theatre.city} · M-Ticket Available · F&B Counter</p>
                </div>
                <span className="theatre-info-badge">English / Hindi Subtitles</span>
              </div>

              <div className="divider" style={{ margin: '14px 0 18px' }} />

              <div className="show-times">
                {group.shows.map(show => (
                  <button
                    key={show.id}
                    className="show-time-btn"
                    onClick={() => handleSelectShow(show.id)}
                    title={`Click to select seats for ${formatTime(show.show_time)} at ${show.screen_name}`}
                    type="button"
                  >
                    <span className="show-time">{formatTime(show.show_time)}</span>
                    <span className="show-screen">{show.screen_name}</span>
                    <span className="show-tag">Available</span>
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
