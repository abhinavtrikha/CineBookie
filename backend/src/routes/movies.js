const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// GET /api/movies - List all movies (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search, genre, language } = req.query;
    let q = 'SELECT * FROM movies WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      q += ` AND (LOWER(title) LIKE $${idx} OR LOWER(genre) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (genre) {
      q += ` AND LOWER(genre) = $${idx}`;
      params.push(genre.toLowerCase());
      idx++;
    }
    if (language) {
      q += ` AND LOWER(language) = $${idx}`;
      params.push(language.toLowerCase());
      idx++;
    }

    q += ' ORDER BY release_date DESC, id DESC';
    const result = await pool.query(q, params);
    res.json({ movies: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id - Get single movie
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json({ movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// POST /api/movies - Admin: create movie
router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('genre').trim().notEmpty().withMessage('Genre is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('duration_mins').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('release_date').isDate().withMessage('Valid release date required'),
  validate
], async (req, res) => {
  const { title, genre, language, duration_mins, release_date, description, poster_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO movies (title, genre, language, duration_mins, release_date, description, poster_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, genre, language, duration_mins, release_date, description || null, poster_url || null]
    );
    res.status(201).json({ movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create movie' });
  }
});

// PUT /api/movies/:id - Admin: update movie
router.put('/:id', authenticate, requireAdmin, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('duration_mins').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  body('release_date').optional().isDate().withMessage('Valid release date required'),
  validate
], async (req, res) => {
  const { id } = req.params;
  const { title, genre, language, duration_mins, release_date, description, poster_url } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    const cur = existing.rows[0];
    const result = await pool.query(
      `UPDATE movies SET title=$1, genre=$2, language=$3, duration_mins=$4, release_date=$5, description=$6, poster_url=$7
       WHERE id=$8 RETURNING *`,
      [
        title || cur.title,
        genre || cur.genre,
        language || cur.language,
        duration_mins || cur.duration_mins,
        release_date || cur.release_date,
        description !== undefined ? description : cur.description,
        poster_url !== undefined ? poster_url : cur.poster_url,
        id
      ]
    );
    res.json({ movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

// DELETE /api/movies/:id - Admin: delete movie
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

module.exports = router;
