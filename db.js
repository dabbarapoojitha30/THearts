require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER?.trim(),
  host: process.env.DB_HOST?.trim(),
  database: process.env.DB_NAME?.trim(),
  password: process.env.DB_PASSWORD?.trim(),
  port: Number(process.env.DB_PORT?.trim()),
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT current_database();')
  .then(res => console.log("✅ Connected to database:", res.rows[0].current_database))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;