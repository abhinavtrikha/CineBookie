import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import './SeatSelectionPage.css';

const MAX_SEATS_ALLOWED = 8;

function groupSeatsByRow(seats) {
  const rows = {};
  for (const seat of seats) {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  }
  for (const row of Object.values(rows)) {
    row.sort((a, b) => a.seat_number - b.seat_number);
  }
  return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/shows/${showId}`),
      api.get(`/seats/show/${showId}`)
    ]).then(([showRes, seatsRes]) => {
      setShow(showRes.data.show);
      setSeats(seatsRes.data.seats);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load seating configuration.');
      setLoading(false);
    });
  }, [showId]);

  const toggleSeat = (seat) => {
    if (!seat.is_available) return;
    setError('');

    const isAlreadySelected = selected.some(s => s.id === seat.id);
    if (!isAlreadySelected && selected.length >= MAX_SEATS_ALLOWED) {
      setError(`You can select a maximum of ${MAX_SEATS_ALLOWED} seats per booking.`);
      return;
    }

    setSelected(prev =>
      isAlreadySelected
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handleClearSelection = () => {
    setSelected([]);
    setError('');
  };

  const totalAmount = useMemo(() => {
    return selected.reduce((sum, s) => sum + parseFloat(s.price), 0);
  }, [selected]);

  const seatRows = useMemo(() => groupSeatsByRow(seats), [seats]);

  const handleProceed = async () => {
    if (selected.length === 0) {
      setError('Please choose at least one seat to continue.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await api.post('/bookings', {
        show_id: parseInt(showId),
        seat_ids: selected.map(s => s.id)
      });
      navigate(`/bookings/${res.data.booking.id}/review`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reserve seats. Some seats may have just been booked. Please choose other seats.');
      // Refresh seat layout to sync updated availability
      api.get(`/seats/show/${showId}`).then(res => setSeats(res.data.seats)).catch(() => {});
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading real-time theatre seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>{error || 'Showtime not found'}</h2>
        <Link to="/movies" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="seat-page container">
      {/* Top Show Info Bar */}
      <div className="seat-show-info card">
        <div>
          <Link to={`/movies/${show.movie_id}/shows`} className="back-link" style={{ marginBottom: '8px' }}>
            ← Change Showtime / Cinema
          </Link>
          <h1 className="seat-movie-title">{show.movie_title}</h1>
          <p className="text-muted" style={{ fontSize: '0.92rem' }}>
            <Icon name="building" size={17} /> <strong>{show.theatre_name}</strong> ({show.city}) · <Icon name="screen" size={17} /> {show.screen_name} · <Icon name="calendar" size={17} />{' '}
            {new Date(show.show_date).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short'
            })}{' '}
            at <strong>{formatTime(show.show_time)}</strong>
          </p>
        </div>
        {selected.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearSelection} type="button">
            Clear Selection ({selected.length})
          </button>
        )}
      </div>

      {/* Screen Indicator */}
      <div className="screen-indicator-wrap">
        <div className="screen-curve" />
        <div className="screen-glow" />
        <p className="screen-text">ALL EYES THIS WAY · CINEMA SCREEN</p>
      </div>

      {/* Seat Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-seat available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat premium" />
          <span>Premium Recliner</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat booked" />
          <span>Unavailable</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error seat-error-alert">
          <Icon name="warning" /> <span>{error}</span>
        </div>
      )}

      {/* Interactive Seat Matrix */}
      <div className="seat-grid-container">
        <div className="seat-grid">
          {seatRows.map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="seat-row">
              <span className="row-label">{rowLabel}</span>
              <div className="seats-in-row">
                {rowSeats.map(seat => {
                  const isSelected = selected.some(s => s.id === seat.id);
                  let cls = 'seat';
                  if (!seat.is_available) {
                    cls += ' booked';
                  } else if (isSelected) {
                    cls += ' selected';
                  } else if (seat.seat_type === 'premium') {
                    cls += ' premium available';
                  } else if (seat.seat_type === 'vip') {
                    cls += ' vip available';
                  } else {
                    cls += ' available';
                  }

                  return (
                    <button
                      key={seat.id}
                      className={cls}
                      onClick={() => toggleSeat(seat)}
                      disabled={!seat.is_available}
                      title={`Seat ${rowLabel}${seat.seat_number} — ₹${seat.price} (${seat.seat_type})`}
                      aria-label={`Seat ${rowLabel}${seat.seat_number}, ${seat.seat_type}, ₹${seat.price}, ${seat.is_available ? 'available' : 'booked'}`}
                      type="button"
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
              <span className="row-label">{rowLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Booking Action Bar */}
      <div className="seat-summary-bar">
        <div className="container seat-summary-inner">
          <div className="summary-left">
            {selected.length === 0 ? (
              <div>
                <p style={{ fontWeight: 600 }}>No seats chosen yet</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Tap available seats above to reserve (Max {MAX_SEATS_ALLOWED} tickets)
                </p>
              </div>
            ) : (
              <div>
                <div className="selected-chips">
                  {selected.map(s => (
                    <span key={s.id} className="selected-seat-chip">
                      {s.row_label}{s.seat_number} <span className="chip-price">₹{s.price}</span>
                    </span>
                  ))}
                </div>
                <p className="summary-subtext text-muted">
                  {selected.length} seat{selected.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          <div className="summary-right">
            <div className="total-display">
              <span className="total-label text-muted">Total Price</span>
              <span className="total-amount text-primary">₹{totalAmount.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary btn-lg proceed-btn"
              onClick={handleProceed}
              disabled={selected.length === 0 || booking}
              type="button"
            >
              {booking ? 'Reserving Seats...' : 'Proceed to Review →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
