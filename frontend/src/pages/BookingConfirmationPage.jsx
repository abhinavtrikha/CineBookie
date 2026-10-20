import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';
import './ConfirmationPage.css';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then(res => {
        setBooking(res.data.booking);
        setLoading(false);
      })
      .catch(() => {
        setError('Booking details could not be found.');
        setLoading(false);
      });
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRef = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.booking_ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddToCalendar = () => {
    if (!booking) return;
    try {
      const datePart = booking.show_date.split('T')[0];
      const timePart = booking.show_time.length === 5 ? `${booking.show_time}:00` : booking.show_time;
      const startDateTime = new Date(`${datePart}T${timePart}`);
      const durationMins = booking.duration_mins ? parseInt(booking.duration_mins, 10) : 150;
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

      const formatDateForICS = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const seatsText = (booking.seats || []).map(s => `${s.row_label}${s.seat_number}`).join(', ');

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CineBookie//Movie Ticket//EN',
        'BEGIN:VEVENT',
        `SUMMARY:Movie: ${booking.movie_title}`,
        `DESCRIPTION:Screening at ${booking.theatre_name}\\nScreen: ${booking.screen_name}\\nSeats: ${seatsText}\\nBooking Ref: ${booking.booking_ref}`,
        `LOCATION:${booking.theatre_name}, ${booking.city}`,
        `DTSTART:${formatDateForICS(startDateTime)}`,
        `DTEND:${formatDateForICS(endDateTime)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MovieTicket_${booking.booking_ref}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading confirmed digital ticket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>{error || 'Booking not found'}</h2>
        <Link to="/movies" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Browse Movies
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.booking_status === 'confirmed';

  return (
    <div className="confirmation-page container">
      <div className="confirmation-card card">
        {/* Celebration header */}
        {isConfirmed ? (
          <div className="conf-status-wrap">
            <div className="success-icon-badge"><Icon name="check" size={32} /></div>
            <h1 className="conf-title">Booking Confirmed!</h1>
            <p className="conf-subtitle text-muted">
              Your tickets are reserved and payment has been verified. Present this digital ticket at the cinema.
            </p>
          </div>
        ) : (
          <div className="conf-status-wrap">
            <div className="error-icon-badge"><Icon name="warning" size={30} /></div>
            <h1 className="conf-title">Booking Not Confirmed</h1>
            <p className="conf-subtitle text-muted">
              Current status: <strong style={{ textTransform: 'capitalize' }}>{booking.booking_status}</strong>
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="ticket" id="printable-ticket">
            <div className="ticket-header">
              <div className="ticket-brand">
                <span><Icon name="film" /> CineBookie</span>
                <span className="ticket-format-tag">DIGITAL E-TICKET</span>
              </div>
              <span className="badge badge-confirmed"><Icon name="check" size={14} /> VERIFIED PASS</span>
            </div>

            <div className="ticket-main">
              <div className="ticket-movie-title-wrap">
                <h2 className="ticket-movie">{booking.movie_title}</h2>
                <div className="ticket-badges-row">
                  <span className="badge badge-genre">{booking.genre || 'Cinema'}</span>
                  <span className="badge badge-language">{booking.language || 'Original'}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>2D · Dolby</span>
                </div>
              </div>

              <div className="ticket-divider-notch" />

              <div className="ticket-details-grid">
                <div className="ticket-detail-cell">
                  <span className="ticket-label">BOOKING ID</span>
                  <div className="ticket-ref-copy">
                    <span className="ticket-ref">{booking.booking_ref}</span>
                    <button
                      className="copy-ref-btn"
                      onClick={handleCopyRef}
                      title="Copy Reference ID"
                      type="button"
                    >
                      <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="ticket-detail-cell">
                  <span className="ticket-label">CINEMA THEATRE</span>
                  <span className="ticket-val">{booking.theatre_name}, {booking.city}</span>
                </div>

                <div className="ticket-detail-cell">
                  <span className="ticket-label">AUDITORIUM / SCREEN</span>
                  <span className="ticket-val">{booking.screen_name}</span>
                </div>

                <div className="ticket-detail-cell">
                  <span className="ticket-label">DATE & TIME</span>
                  <span className="ticket-val" style={{ color: 'var(--color-primary-light)' }}>
                    {new Date(booking.show_date).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })} · {formatTime(booking.show_time)}
                  </span>
                </div>

                <div className="ticket-detail-cell wide">
                  <span className="ticket-label">ALLOCATED SEATS</span>
                  <div className="ticket-seats-list">
                    {booking.seats && booking.seats.map(s => (
                      <span key={`${s.row_label}${s.seat_number}`} className="ticket-seat-pill">
                        {s.row_label}{s.seat_number}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="ticket-detail-cell">
                  <span className="ticket-label">CARDHOLDER / NAME</span>
                  <span className="ticket-val">{booking.user_name}</span>
                </div>

                <div className="ticket-detail-cell">
                  <span className="ticket-label">TRANSACTION STATUS</span>
                  <span className="ticket-val text-success" style={{ textTransform: 'capitalize' }}>
                    ● {booking.payment_status} (Online)
                  </span>
                </div>
              </div>
            </div>

            <div className="ticket-footer">
              <div className="ticket-amount">
                <span className="ticket-label">TOTAL PAID</span>
                <span className="ticket-price text-primary">₹{parseFloat(booking.total_amount).toFixed(2)}</span>
              </div>

              {/* Cinema Ticket Barcode Graphic */}
              <div className="ticket-barcode-wrap" title={`Barcode Ref: ${booking.booking_ref}`}>
                <div className="barcode-bars">
                  || | ||| || |||| | ||| |||| || | || ||| || ||||
                </div>
                <span className="barcode-number">{booking.booking_ref}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Ticket Action Buttons */}
        {isConfirmed && (
          <div className="ticket-action-toolbar">
            <button className="btn btn-secondary" onClick={handlePrint} type="button">
              <Icon name="printer" /> Print / Save PDF
            </button>
            <button className="btn btn-secondary" onClick={handleAddToCalendar} type="button">
              <Icon name="calendar" /> Add to Calendar (.ics)
            </button>
          </div>
        )}

        <div className="conf-actions" style={{ marginTop: '24px' }}>
          <Link to="/bookings" className="btn btn-secondary">
            View My Bookings
          </Link>
          <Link to="/movies" className="btn btn-primary">
            Book Another Film →
          </Link>
        </div>
      </div>
    </div>
  );
}
