const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET /api/theatres - All theatres
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM theatres ORDER BY city, name');
    res.json({ theatres: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch theatres' });
  }
});

// GET /api/theatres/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM theatres WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Theatre not found' });
    res.json({ theatre: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch theatre' });
  }
});

// GET /api/theatres/:id/screens - Screens of a theatre
router.get('/:id/screens', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM screens WHERE theatre_id = $1 ORDER BY name',
      [req.params.id]
    );
    res.json({ screens: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch screens' });
  }
});

// POST /api/theatres - Admin
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Theatre name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  validate
], async (req, res) => {
  const { name, location, city } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO theatres (name, location, city) VALUES ($1, $2, $3) RETURNING *',
      [name, location, city]
    );
    res.status(201).json({ theatre: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create theatre' });
  }
});

// PUT /api/theatres/:id - Admin
router.put('/:id', authenticate, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  validate
], async (req, res) => {
  const { id } = req.params;
  const { name, location, city } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM theatres WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Theatre not found' });
    const cur = existing.rows[0];
    const result = await pool.query(
      'UPDATE theatres SET name=$1, location=$2, city=$3 WHERE id=$4 RETURNING *',
      [name || cur.name, location || cur.location, city || cur.city, id]
    );
    res.json({ theatre: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update theatre' });
  }
});

// DELETE /api/theatres/:id - Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM theatres WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Theatre not found' });
    res.json({ message: 'Theatre deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete theatre' });
  }
});

module.exports = router;
