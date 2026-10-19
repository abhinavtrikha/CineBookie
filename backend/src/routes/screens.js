const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET /api/screens/:id - Single screen details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, t.name as theatre_name, t.city
      FROM screens s
      JOIN theatres t ON t.id = s.theatre_id
      WHERE s.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });
    res.json({ screen: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch screen' });
  }
});

// POST /api/screens - Admin: create screen
router.post('/', authenticate, requireAdmin, [
  body('theatre_id').isInt({ min: 1 }).withMessage('Valid theatre ID required'),
  body('name').trim().notEmpty().withMessage('Screen name is required'),
  body('total_seats').isInt({ min: 1 }).withMessage('Total seats must be a positive integer'),
  validate
], async (req, res) => {
  const { theatre_id, name, total_seats } = req.body;
  try {
    // Verify theatre exists
    const theatreCheck = await pool.query('SELECT id FROM theatres WHERE id = $1', [theatre_id]);
    if (theatreCheck.rows.length === 0) return res.status(404).json({ error: 'Theatre not found' });

    const result = await pool.query(
      'INSERT INTO screens (theatre_id, name, total_seats) VALUES ($1, $2, $3) RETURNING *',
      [theatre_id, name, total_seats]
    );
    res.status(201).json({ screen: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Screen name already exists in this theatre' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create screen' });
  }
});

// PUT /api/screens/:id - Admin: update screen
router.put('/:id', authenticate, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('total_seats').optional().isInt({ min: 1 }),
  validate
], async (req, res) => {
  const { id } = req.params;
  const { name, total_seats } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM screens WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });
    const cur = existing.rows[0];
    const result = await pool.query(
      'UPDATE screens SET name=$1, total_seats=$2 WHERE id=$3 RETURNING *',
      [name || cur.name, total_seats || cur.total_seats, id]
    );
    res.json({ screen: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update screen' });
  }
});

// DELETE /api/screens/:id - Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM screens WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Screen not found' });
    res.json({ message: 'Screen deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete screen' });
  }
});

module.exports = router;
