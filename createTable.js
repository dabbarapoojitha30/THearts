const pool = require("./db");

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        dob DATE,
        age TEXT,
        review_date DATE,
        sex VARCHAR(10),
        weight NUMERIC(5,2),
        phone1 VARCHAR(10),
        phone2 VARCHAR(10),
        location TEXT,
        diagnosis TEXT,
        situs_loop TEXT,
        systemic_veins TEXT,
        pulmonary_veins TEXT,
        atria TEXT,
        atrial_septum TEXT,
        av_valves TEXT,
        ventricles TEXT,
        ventricular_septum TEXT,
        outflow_tracts TEXT,
        pulmonary_arteries TEXT,
        aortic_arch TEXT,
        others_field TEXT,
        impression TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(50) PRIMARY KEY,
        password VARCHAR(200),
        role VARCHAR(10) NOT NULL
      );
    `);

    // Seed users
    const bcrypt = require("bcrypt");
    const hashAdmin = await bcrypt.hash("admin123", 10);
    const hashGuest = await bcrypt.hash("guest123", 10);

    await pool.query(`
      INSERT INTO users(username,password,role)
      VALUES
      ('admin','${hashAdmin}','admin')
      ON CONFLICT(username) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO users(username,password,role)
      VALUES
      ('guest','${hashGuest}','guest')
      ON CONFLICT(username) DO NOTHING
    `);

    console.log("✅ Tables ready");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
    process.exit(1);
  }
})();
