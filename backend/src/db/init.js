require('dotenv').config();
const pool = require('./pool');

async function initDB() {
  const isSqlite = pool.driver === 'sqlite';
  const idType = isSqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY';

  const schema = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id ${idType},
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Movies table
  CREATE TABLE IF NOT EXISTS movies (
    id ${idType},
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    language VARCHAR(100) NOT NULL,
    duration_mins INTEGER NOT NULL CHECK (duration_mins > 0),
    release_date DATE NOT NULL,
    description TEXT,
    poster_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Theatres table
  CREATE TABLE IF NOT EXISTS theatres (
    id ${idType},
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Screens table
  CREATE TABLE IF NOT EXISTS screens (
    id ${idType},
    theatre_id INTEGER NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theatre_id, name)
  );

  -- Seats table
  CREATE TABLE IF NOT EXISTS seats (
    id ${idType},
    screen_id INTEGER NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    row_label VARCHAR(5) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (seat_type IN ('standard', 'premium', 'vip')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    UNIQUE(screen_id, row_label, seat_number)
  );

  -- Shows table
  CREATE TABLE IF NOT EXISTS shows (
    id ${idType},
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    screen_id INTEGER NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screen_id, show_date, show_time)
  );

  -- Bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id ${idType},
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    show_id INTEGER NOT NULL REFERENCES shows(id),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Booking seats junction table
  CREATE TABLE IF NOT EXISTS booking_seats (
    id ${idType},
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    show_id INTEGER NOT NULL REFERENCES shows(id),
    UNIQUE(seat_id, show_id)
  );

  -- Payments table
  CREATE TABLE IF NOT EXISTS payments (
    id ${idType},
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    payment_method VARCHAR(50) DEFAULT 'card',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `;

  // Split into individual statements if SQLite
  if (isSqlite) {
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
  } else {
    const client = await pool.connect();
    try {
      await client.query(schema);
    } finally {
      client.release();
    }
  }

  console.log(`Database schema initialized successfully using ${pool.driver}`);
}

if (require.main === module) {
  initDB()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Initialization error:', err);
      process.exit(1);
    });
}

module.exports = { initDB };
