const path = require('path');
const fs = require('fs');

let poolInstance = null;

// Determine if we should attempt PostgreSQL
const usePostgres = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')) &&
  process.env.USE_POSTGRES === 'true';

if (usePostgres) {
  try {
    const { Pool } = require('pg');
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    poolInstance.driver = 'postgres';
    poolInstance.on('connect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('Connected to PostgreSQL database');
      }
    });
    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  } catch (err) {
    console.warn('PostgreSQL client initialization failed, falling back to SQLite:', err.message);
    poolInstance = null;
  }
}

// Fallback to SQLite (persistent file storage)
if (!poolInstance) {
  const Database = require('better-sqlite3');
  const dbFile = process.env.DATABASE_FILE || path.join(__dirname, 'cinebookie.db');
  
  // Ensure directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbFile);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  function convertPgToSqlite(sql, params = []) {
    let convertedSql = sql.replace(/\s+FOR\s+UPDATE\b/gi, '');
    if (!params || params.length === 0) return { sql: convertedSql, params: [] };
    const sqliteParams = [];
    convertedSql = convertedSql.replace(/\$([0-9]+)/g, (_, num) => {
      const idx = parseInt(num, 10) - 1;
      sqliteParams.push(params[idx]);
      return '?';
    });
    return { sql: convertedSql, params: sqliteParams };
  }

  function executeQuery(sql, params = []) {
    const { sql: convertedSql, params: sqliteParams } = convertPgToSqlite(sql, params);
    const trimmed = convertedSql.trim();

    // Check for transaction commands
    if (/^BEGIN\b/i.test(trimmed)) {
      db.prepare('BEGIN IMMEDIATE').run();
      return { rows: [], rowCount: 0 };
    }
    if (/^COMMIT\b/i.test(trimmed)) {
      db.prepare('COMMIT').run();
      return { rows: [], rowCount: 0 };
    }
    if (/^ROLLBACK\b/i.test(trimmed)) {
      try {
        db.prepare('ROLLBACK').run();
      } catch (e) {
        // Ignore if no transaction is active
      }
      return { rows: [], rowCount: 0 };
    }

    const isSelect = /^SELECT\b/i.test(trimmed);
    const hasReturning = /\bRETURNING\b/i.test(trimmed);

    if (isSelect || hasReturning) {
      const stmt = db.prepare(convertedSql);
      const rows = stmt.all(...sqliteParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(convertedSql);
      const info = stmt.run(...sqliteParams);
      return { rows: [], rowCount: info.changes };
    }
  }

  poolInstance = {
    driver: 'sqlite',
    dbFile,
    db,
    async query(sql, params = []) {
      return executeQuery(sql, params);
    },
    async connect() {
      return {
        async query(sql, params = []) {
          return executeQuery(sql, params);
        },
        release() {
          // No-op for SQLite single-file connection
        }
      };
    },
    on(event, handler) {
      if (event === 'connect') {
        handler();
      }
      return poolInstance;
    },
    async end() {
      try {
        db.close();
      } catch (e) {}
    }
  };

  if (process.env.NODE_ENV !== 'test') {
    console.log(`Connected to persistent SQLite database at: ${dbFile}`);
  }
}

module.exports = poolInstance;
