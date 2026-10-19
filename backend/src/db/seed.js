require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@cinebookie.com', adminHash, 'admin']);

    // Create demo customer
    const custHash = await bcrypt.hash('customer123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Demo Customer', 'customer@cinebookie.com', custHash, 'customer']);

    // Seed movies (demonstration data)
    const movies = [
      {
        title: 'Galactic Odyssey',
        genre: 'Sci-Fi',
        language: 'English',
        duration_mins: 148,
        release_date: '2026-09-15',
        description: 'A thrilling journey across the cosmos as humanity faces its greatest challenge yet.',
        poster_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&q=80'
      },
      {
        title: 'The Last Samurai Returns',
        genre: 'Action',
        language: 'English',
        duration_mins: 135,
        release_date: '2026-10-01',
        description: 'An epic tale of honour, betrayal, and redemption set in feudal Japan.',
        poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80'
      },
      {
        title: 'Midnight in Mumbai',
        genre: 'Drama',
        language: 'Hindi',
        duration_mins: 152,
        release_date: '2026-08-20',
        description: 'A sweeping romantic drama set against the backdrop of modern Mumbai.',
        poster_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'
      },
      {
        title: 'Comedy Chaos',
        genre: 'Comedy',
        language: 'English',
        duration_mins: 110,
        release_date: '2026-10-10',
        description: 'A hilarious romp through the absurdities of everyday modern life.',
        poster_url: 'https://images.unsplash.com/photo-1600096194534-95cf5ece2e2e?w=400&q=80'
      },
      {
        title: 'Dark Shadows Rising',
        genre: 'Horror',
        language: 'English',
        duration_mins: 118,
        release_date: '2026-10-15',
        description: 'A terrifying supernatural thriller that will keep you on the edge of your seat.',
        poster_url: 'https://images.unsplash.com/photo-1520116468816-95b69f847357?w=400&q=80'
      },
      {
        title: 'Pyaar Ki Kahani',
        genre: 'Romance',
        language: 'Hindi',
        duration_mins: 145,
        release_date: '2026-09-01',
        description: 'A heartwarming love story that transcends time and distance.',
        poster_url: 'https://images.unsplash.com/photo-1508138221679-760a23a2285b?w=400&q=80'
      }
    ];

    for (const movie of movies) {
      await client.query(`
        INSERT INTO movies (title, genre, language, duration_mins, release_date, description, poster_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [movie.title, movie.genre, movie.language, movie.duration_mins, movie.release_date, movie.description, movie.poster_url]);
    }

    // Seed theatres
    const theatres = [
      { name: 'CineMax Multiplex', location: '12 MG Road, Connaught Place', city: 'Delhi' },
      { name: 'Star Cinema', location: '45 Linking Road, Bandra', city: 'Mumbai' },
      { name: 'Galaxy Theatre', location: '78 Brigade Road', city: 'Bangalore' }
    ];

    const theatreIds = [];
    for (const theatre of theatres) {
      const res = await client.query(`
        INSERT INTO theatres (name, location, city)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [theatre.name, theatre.location, theatre.city]);
      if (res.rows.length > 0) theatreIds.push(res.rows[0].id);
    }

    // Get all theatre ids
    const allTheatres = await client.query('SELECT id FROM theatres ORDER BY id');
    const tIds = allTheatres.rows.map(r => r.id);

    // Seed screens for each theatre
    const screenIds = [];
    for (const tId of tIds) {
      for (let s = 1; s <= 2; s++) {
        const res = await client.query(`
          INSERT INTO screens (theatre_id, name, total_seats)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [tId, `Screen ${s}`, s === 1 ? 60 : 48]);
        if (res.rows.length > 0) screenIds.push(res.rows[0].id);
      }
    }

    // Get all screen ids
    const allScreens = await client.query('SELECT id, total_seats FROM screens ORDER BY id');

    // Seed seats for each screen
    for (const screen of allScreens.rows) {
      const sId = screen.id;
      // Check if seats already exist
      const existing = await client.query('SELECT COUNT(*) FROM seats WHERE screen_id = $1', [sId]);
      if (parseInt(existing.rows[0].count) > 0) continue;

      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      const seatsPerRow = 10;
      let seatCount = 0;
      for (const row of rows) {
        for (let n = 1; n <= seatsPerRow; n++) {
          if (seatCount >= screen.total_seats) break;
          let seatType = 'standard';
          let price = 150;
          if (row === 'E' || row === 'F') { seatType = 'premium'; price = 200; }
          await client.query(`
            INSERT INTO seats (screen_id, row_label, seat_number, seat_type, price)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `, [sId, row, n, seatType, price]);
          seatCount++;
        }
        if (seatCount >= screen.total_seats) break;
      }
    }

    // Seed shows
    const allMovies = await client.query('SELECT id FROM movies ORDER BY id');
    const mIds = allMovies.rows.map(r => r.id);
    const allScreensForShows = await client.query('SELECT id FROM screens ORDER BY id');
    const scIds = allScreensForShows.rows.map(r => r.id);

    const showTimes = ['10:00', '13:30', '16:30', '19:30', '22:00'];
    const today = new Date();

    for (let day = 0; day < 7; day++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + day);
      const dateStr = showDate.toISOString().split('T')[0];

      for (let i = 0; i < Math.min(scIds.length, 6); i++) {
        const scId = scIds[i];
        const mId = mIds[i % mIds.length];
        // 2-3 shows per screen per day
        for (let t = 0; t < 3; t++) {
          const time = showTimes[t + 1];
          await client.query(`
            INSERT INTO shows (movie_id, screen_id, show_date, show_time)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [mId, scId, dateStr, time]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('  Admin:    admin@cinebookie.com / admin123');
    console.log('  Customer: customer@cinebookie.com / customer123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
  }
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
