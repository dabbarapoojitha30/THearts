require("dotenv").config();
const { Pool } = require("pg");

// Always enable SSL for Render Postgres
const pool = new Pool({
  user: process.env.DB_USER,           // tinyheartsp_user
  host: process.env.DB_HOST,           // dpg-d6c3u375r7bs73an1n80-a.singapore-postgres.render.com
  database: process.env.DB_NAME,       // tinyheartsp
  password: process.env.DB_PASSWORD,   // your password
  port: Number(process.env.DB_PORT),   // 5432
  ssl: { rejectUnauthorized: false }   // THIS IS CRUCIAL
});

// Test connection
pool.query("SELECT current_database();")
  .then(res => console.log("✅ Connected to database:", res.rows[0].current_database))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;