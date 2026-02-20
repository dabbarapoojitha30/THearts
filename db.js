// db.js
require("dotenv").config();
const { Pool } = require("pg");

const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: isProd ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT current_database();')
  .then(res => console.log("✅ Connected to database:", res.rows[0].current_database))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;