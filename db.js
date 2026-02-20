const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render Postgres
});

pool.connect()
  .then(() => console.log("✅ DB connected (Render Postgres)"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;