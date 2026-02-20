require("dotenv").config();
const { Pool } = require("pg");

// Use separate env vars instead of DATABASE_URL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false // MUST have this for Render Postgres
  }
});

// Test connection
pool.query('SELECT current_database();')
  .then(res => console.log("✅ Connected to database:", res.rows[0].current_database))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;