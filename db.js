const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render requires SSL for its PostgreSQL databases.
  // For local development, you might not need SSL.
  ssl: process.env.NODE_ENV === 'production' 
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
};