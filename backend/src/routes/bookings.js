const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

// Helper: generate short booking reference
function generateBookingRef() {
  return 'CB' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

// GET /api/bookings - Customer: get own bookings (Admin: get all)
router.get('/', authenticate, async (req, res) => {
  try {
    let q;
    let params;
    if (req.user.role === 'admin') {
      q = `
        SELECT b.*, 
               u.name as user_name, u.email as user_email,
               sh.show_date, sh.show_time,
               m.title as movie_title,
               t.name as theatre_name, t.city
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        JOIN shows sh ON sh.id = b.show_id
        JOIN movies m ON m.id = sh.movie_id
        JOIN screens sc ON sc.id = sh.screen_id
        JOIN theatres t ON t.id = sc.theatre_id
        ORDER BY b.created_at DESC
      `;
      params = [];
    } else {
      q = `
        SELECT b.*, 
               sh.show_date, sh.show_time,
               m.title as movie_title, m.poster_url,
               t.name as theatre_name, t.city,
               sc.name as screen_name
        FROM bookings b
        JOIN shows sh ON sh.id = b.show_id
        JOIN movies m ON m.id = sh.movie_id
        JOIN screens sc ON sc.id = sh.screen_id
        JOIN theatres t ON t.id = sc.theatre_id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [req.user.id];
    }
    const result = await pool.query(q, params);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id - Get single booking details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, 
             sh.show_date, sh.show_time,
             m.title as movie_title, m.genre, m.language, m.duration_mins, m.poster_url,
             t.name as theatre_name, t.city, t.location,
             sc.name as screen_name,
             u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN shows sh ON sh.id = b.show_id
      JOIN movies m ON m.id = sh.movie_id
      JOIN screens sc ON sc.id = sh.screen_id
      JOIN theatres t ON t.id = sc.theatre_id
      JOIN users u ON u.id = b.user_id
      WHERE b.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const booking = result.rows[0];
    // Check authorization: customer can only see own booking
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get booked seats for this booking
    const seatsResult = await pool.query(`
      SELECT s.row_label, s.seat_number, s.seat_type, s.price
      FROM booking_seats bs
      JOIN seats s ON s.id = bs.seat_id
      WHERE bs.booking_id = $1
      ORDER BY s.row_label, s.seat_number
    `, [req.params.id]);

    res.json({ booking: { ...booking, seats: seatsResult.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /api/bookings - Create a new booking (initiate)
router.post('/', authenticate, [
  body('show_id').isInt({ min: 1 }).withMessage('Valid show ID required'),
  body('seat_ids').isArray({ min: 1 }).withMessage('At least one seat must be selected'),
  body('seat_ids.*').isInt({ min: 1 }),
  validate
], async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can book tickets' });
  }

  const { show_id, seat_ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify show exists and is in the future
    const showResult = await client.query(
      `SELECT sh.*, sc.id as screen_id 
       FROM shows sh JOIN screens sc ON sc.id = sh.screen_id 
       WHERE sh.id = $1`,
      [show_id]
    );
    if (showResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Show not found' });
    }
    const show = showResult.rows[0];

    // 2. Verify all seats belong to the show's screen
    const seatInPlaceholders = seat_ids.map((_, i) => `$${i + 1}`).join(',');
    const seatCheck = await client.query(
      `SELECT id, price, seat_type FROM seats WHERE id IN (${seatInPlaceholders}) AND screen_id = $${seat_ids.length + 1}`,
      [...seat_ids, show.screen_id]
    );
    if (seatCheck.rows.length !== seat_ids.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'One or more seats are invalid for this show' });
    }

    // 3. Check seat availability - prevent concurrent duplicate bookings
    const bookedInPlaceholders = seat_ids.map((_, i) => `$${i + 2}`).join(',');
    const bookedCheck = await client.query(
      `SELECT bs.seat_id FROM booking_seats bs
       JOIN bookings b ON b.id = bs.booking_id
       WHERE bs.show_id = $1 AND bs.seat_id IN (${bookedInPlaceholders})
       AND b.booking_status IN ('confirmed', 'pending')`,
      [show_id, ...seat_ids]
    );
    if (bookedCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'One or more selected seats are no longer available' });
    }

    // 4. Calculate total
    const totalAmount = seatCheck.rows.reduce((sum, seat) => sum + parseFloat(seat.price), 0);

    // 5. Create booking record
    const bookingRef = generateBookingRef();
    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_ref, user_id, show_id, total_amount, payment_status, booking_status)
       VALUES ($1, $2, $3, $4, 'pending', 'pending') RETURNING *`,
      [bookingRef, req.user.id, show_id, totalAmount]
    );
    const booking = bookingResult.rows[0];

    // 6. Reserve seats in booking_seats
    for (const seatId of seat_ids) {
      await client.query(
        'INSERT INTO booking_seats (booking_id, seat_id, show_id) VALUES ($1, $2, $3)',
        [booking.id, seatId, show_id]
      );
    }

    // 7. Create pending payment record
    await client.query(
      'INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, $3)',
      [booking.id, totalAmount, 'pending']
    );

    await client.query('COMMIT');

    res.status(201).json({
      booking: {
        ...booking,
        seats: seatCheck.rows
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

// POST /api/bookings/:id/pay - Process payment
router.post('/:id/pay', authenticate, [
  body('payment_method').notEmpty().withMessage('Payment method required'),
  // In a real system, card tokens etc. would be passed here
  validate
], async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get booking with lock
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult.rows[0];

    // Authorization
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.booking_status === 'confirmed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking is already confirmed' });
    }
    if (booking.booking_status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking has been cancelled' });
    }

    // SANDBOX PAYMENT SIMULATION
    // In this development environment, we simulate payment processing.
    // Payment simulation: succeeds by default, but allows testing payment failure per FR-34
    const paymentSuccess = payment_method !== 'fail' && !req.body.simulate_failure;

    if (paymentSuccess) {
      // Update payment record
      await client.query(
        `UPDATE payments SET status='success', payment_method=$1 WHERE booking_id=$2`,
        [payment_method, id]
      );
      // Confirm booking
      const updatedBooking = await client.query(
        `UPDATE bookings SET payment_status='paid', booking_status='confirmed' WHERE id=$1 RETURNING *`,
        [id]
      );
      await client.query('COMMIT');
      res.json({
        booking: updatedBooking.rows[0],
        message: 'Payment successful. Booking confirmed!'
      });
    } else {
      // Payment failed
      await client.query(
        `UPDATE payments SET status='failed', payment_method=$1 WHERE booking_id=$2`,
        [payment_method, id]
      );
      await client.query(
        `UPDATE bookings SET payment_status='failed', booking_status='cancelled' WHERE id=$1`,
        [id]
      );
      // Release seats: delete booking_seats
      await client.query('DELETE FROM booking_seats WHERE booking_id=$1', [id]);
      await client.query('COMMIT');
      res.status(402).json({ error: 'Payment failed. Seats have been released.' });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Payment processing failed' });
  } finally {
    client.release();
  }
});

// POST /api/bookings/:id/cancel - Cancel a booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult.rows[0];

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.booking_status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    // Cancel booking and release seats
    await client.query(
      `UPDATE bookings SET booking_status='cancelled' WHERE id=$1`,
      [id]
    );
    await client.query('DELETE FROM booking_seats WHERE booking_id=$1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    client.release();
  }
});

module.exports = router;
