const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET /api/shows - List shows with optional filters
router.get('/', async (req, res) => {
  try {
    const { movie_id, theatre_id, date } = req.query;
    let q = `
      SELECT sh.*, 
             m.title as movie_title, m.genre, m.language, m.duration_mins, m.poster_url,
             sc.name as screen_name, sc.total_seats,
             t.id as theatre_id, t.name as theatre_name, t.city
      FROM shows sh
      JOIN movies m ON m.id = sh.movie_id
      JOIN screens sc ON sc.id = sh.screen_id
      JOIN theatres t ON t.id = sc.theatre_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (movie_id) {
      q += ` AND sh.movie_id = $${idx}`;
      params.push(movie_id);
      idx++;
    }
    if (theatre_id) {
      q += ` AND t.id = $${idx}`;
      params.push(theatre_id);
      idx++;
    }
    if (date) {
      q += ` AND sh.show_date = $${idx}`;
      params.push(date);
      idx++;
    } else {
      q += ` AND sh.show_date >= CURRENT_DATE`;
    }

    q += ' ORDER BY sh.show_date, sh.show_time';
    const result = await pool.query(q, params);
    res.json({ shows: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// GET /api/shows/:id - Single show details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sh.*, 
             m.title as movie_title, m.genre, m.language, m.duration_mins, m.poster_url, m.description,
             sc.name as screen_name, sc.total_seats,
             t.id as theatre_id, t.name as theatre_name, t.city, t.location
      FROM shows sh
      JOIN movies m ON m.id = sh.movie_id
      JOIN screens sc ON sc.id = sh.screen_id
      JOIN theatres t ON t.id = sc.theatre_id
      WHERE sh.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    res.json({ show: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// POST /api/shows - Admin: create show
router.post('/', authenticate, requireAdmin, [
  body('movie_id').isInt({ min: 1 }).withMessage('Valid movie ID required'),
  body('screen_id').isInt({ min: 1 }).withMessage('Valid screen ID required'),
  body('show_date').isDate().withMessage('Valid date required'),
  body('show_time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be in HH:MM format'),
  validate
], async (req, res) => {
  const { movie_id, screen_id, show_date, show_time } = req.body;
  try {
    // Validate movie and screen exist
    const movieCheck = await pool.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
    if (movieCheck.rows.length === 0) return res.status(404).json({ error: 'Movie not found' });
    const screenCheck = await pool.query('SELECT id FROM screens WHERE id = $1', [screen_id]);
    if (screenCheck.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });

    const result = await pool.query(
      'INSERT INTO shows (movie_id, screen_id, show_date, show_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [movie_id, screen_id, show_date, show_time]
    );
    res.status(201).json({ show: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A show already exists on this screen at that date and time' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// PUT /api/shows/:id - Admin: update show
router.put('/:id', authenticate, requireAdmin, [
  body('show_date').optional().isDate(),
  body('show_time').optional().matches(/^\d{2}:\d{2}$/),
  validate
], async (req, res) => {
  const { id } = req.params;
  const { movie_id, screen_id, show_date, show_time } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM shows WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    const cur = existing.rows[0];
    const result = await pool.query(
      'UPDATE shows SET movie_id=$1, screen_id=$2, show_date=$3, show_time=$4 WHERE id=$5 RETURNING *',
      [movie_id || cur.movie_id, screen_id || cur.screen_id, show_date || cur.show_date, show_time || cur.show_time, id]
    );
    res.json({ show: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Show conflict: screen already booked at that time' });
    console.error(err);
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// DELETE /api/shows/:id - Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM shows WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    res.json({ message: 'Show deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete show' });
  }
});

module.exports = router;
