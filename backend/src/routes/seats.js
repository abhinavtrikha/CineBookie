const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET /api/seats/screen/:screenId - All seats for a screen
router.get('/screen/:screenId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM seats WHERE screen_id = $1 ORDER BY row_label, seat_number',
      [req.params.screenId]
    );
    res.json({ seats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

// GET /api/seats/show/:showId - Seat layout with availability for a show
router.get('/show/:showId', async (req, res) => {
  try {
    // Get show's screen
    const showResult = await pool.query(
      'SELECT screen_id FROM shows WHERE id = $1',
      [req.params.showId]
    );
    if (showResult.rows.length === 0) return res.status(404).json({ error: 'Show not found' });

    const screenId = showResult.rows[0].screen_id;

    // Get all seats for the screen
    const seatsResult = await pool.query(
      'SELECT * FROM seats WHERE screen_id = $1 ORDER BY row_label, seat_number',
      [screenId]
    );

    // Get booked seat IDs for this show (only confirmed bookings)
    const bookedResult = await pool.query(
      `SELECT bs.seat_id FROM booking_seats bs
       JOIN bookings b ON b.id = bs.booking_id
       WHERE bs.show_id = $1 AND b.booking_status IN ('confirmed', 'pending')`,
      [req.params.showId]
    );
    const bookedSeatIds = new Set(bookedResult.rows.map(r => r.seat_id));

    const seats = seatsResult.rows.map(seat => ({
      ...seat,
      is_available: !bookedSeatIds.has(seat.id)
    }));

    res.json({ seats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seat layout' });
  }
});

// POST /api/seats - Admin: add seats to a screen
router.post('/', authenticate, requireAdmin, [
  body('screen_id').isInt({ min: 1 }).withMessage('Valid screen ID required'),
  body('row_label').trim().notEmpty().withMessage('Row label required'),
  body('seat_number').isInt({ min: 1 }).withMessage('Seat number must be positive'),
  body('seat_type').optional().isIn(['standard', 'premium', 'vip']).withMessage('Invalid seat type'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  validate
], async (req, res) => {
  const { screen_id, row_label, seat_number, seat_type, price } = req.body;
  try {
    const screenCheck = await pool.query('SELECT id FROM screens WHERE id = $1', [screen_id]);
    if (screenCheck.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });

    const result = await pool.query(
      'INSERT INTO seats (screen_id, row_label, seat_number, seat_type, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [screen_id, row_label.toUpperCase(), seat_number, seat_type || 'standard', price]
    );
    res.status(201).json({ seat: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Seat already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create seat' });
  }
});

// POST /api/seats/bulk - Admin: bulk add seats to a screen
router.post('/bulk', authenticate, requireAdmin, [
  body('screen_id').isInt({ min: 1 }),
  body('rows').isArray({ min: 1 }),
  body('seats_per_row').isInt({ min: 1 }),
  body('seat_type').optional().isIn(['standard', 'premium', 'vip']),
  body('price').isFloat({ min: 0 }),
  validate
], async (req, res) => {
  const { screen_id, rows, seats_per_row, seat_type, price } = req.body;
  const client = await pool.connect();
  try {
    const screenCheck = await client.query('SELECT id FROM screens WHERE id = $1', [screen_id]);
    if (screenCheck.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });

    await client.query('BEGIN');
    let count = 0;
    for (const row of rows) {
      for (let n = 1; n <= seats_per_row; n++) {
        await client.query(
          'INSERT INTO seats (screen_id, row_label, seat_number, seat_type, price) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [screen_id, row.toUpperCase(), n, seat_type || 'standard', price]
        );
        count++;
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ message: `${count} seats created` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create seats' });
  } finally {
    client.release();
  }
});

// PUT /api/seats/:id - Admin: update seat
router.put('/:id', authenticate, requireAdmin, [
  body('seat_type').optional().isIn(['standard', 'premium', 'vip']),
  body('price').optional().isFloat({ min: 0 }),
  validate
], async (req, res) => {
  const { id } = req.params;
  const { seat_type, price } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM seats WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Seat not found' });
    const cur = existing.rows[0];
    const result = await pool.query(
      'UPDATE seats SET seat_type=$1, price=$2 WHERE id=$3 RETURNING *',
      [seat_type || cur.seat_type, price !== undefined ? price : cur.price, id]
    );
    res.json({ seat: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update seat' });
  }
});

// DELETE /api/seats/:id - Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM seats WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Seat not found' });
    res.json({ message: 'Seat deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete seat' });
  }
});

module.exports = router;
