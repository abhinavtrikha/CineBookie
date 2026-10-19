const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

// All routes here require admin authentication

// GET /api/admin/stats - Dashboard stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [movies, theatres, shows, bookings, users] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM movies'),
      pool.query('SELECT COUNT(*) FROM theatres'),
      pool.query("SELECT COUNT(*) FROM shows WHERE show_date >= CURRENT_DATE"),
      pool.query("SELECT COUNT(*) FROM bookings WHERE booking_status = 'confirmed'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'")
    ]);

    const revenue = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE booking_status = 'confirmed'"
    );

    res.json({
      stats: {
        movies: parseInt(movies.rows[0].count),
        theatres: parseInt(theatres.rows[0].count),
        upcomingShows: parseInt(shows.rows[0].count),
        confirmedBookings: parseInt(bookings.rows[0].count),
        customers: parseInt(users.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/bookings - All bookings
router.get('/bookings', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, 
             u.name as user_name, u.email as user_email,
             sh.show_date, sh.show_time,
             m.title as movie_title,
             t.name as theatre_name, t.city,
             sc.name as screen_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN shows sh ON sh.id = b.show_id
      JOIN movies m ON m.id = sh.movie_id
      JOIN screens sc ON sc.id = sh.screen_id
      JOIN theatres t ON t.id = sc.theatre_id
      ORDER BY b.created_at DESC
      LIMIT 200
    `);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
