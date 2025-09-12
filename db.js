const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's PostgreSQL databases require SSL.
  // We enable SSL if the app is in production (on Render) OR if
  // the connection string is for an external Render DB (for local development).
  ssl: process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com'))
    ? { rejectUnauthorized: false }
    : false,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Successfully connected to the database at:', res.rows[0].now);
    }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool, // Export the pool for transactions and direct access
};