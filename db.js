const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // REQUIRED for Render
});

pool.connect()
  .then(() => console.log("✅ DB connected (Render Postgres)"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;