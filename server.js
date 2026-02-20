
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const pool = require("./db"); // use DATABASE_URL with SSL
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");

const app = express();
app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.get("/", (req, res) => res.redirect("/login.html"));

const LOCATION_CODES = {
  "Arthi Hospital, Kumbakonam": "KUM",
  "Senthil Nursing Home, Puthukottai": "PUTS",
  "Hridya Cardiac Care, Puthukottai": "PUTH",
  "Thulir Hospital, Tiruvarur": "TIR",
  "Perambalur Cardiac Centre, Perambalur": "PER",
  "Star Kids Hospital, Dindugul": "DIN",
  "Pugazhini Hospital, Trichy": "TRI"
};

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  if (isNaN(birth)) return "";
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return `${years}y ${months}m ${days}d`;
}

function formatDateForPDF(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

const patientValidationRules = [
  body("patient_id").trim().notEmpty(),
  body("name").trim().notEmpty(),
  body("dob").optional({ checkFalsy: true }).isISO8601(),
  body("review_date").optional({ checkFalsy: true }).isISO8601(),
  body("weight").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("phone1").optional({ checkFalsy: true }).matches(/^\d{10}$/),
  body("phone2").optional({ checkFalsy: true }).matches(/^\d{10}$/)
];

// ---------------- CRUD ROUTES ----------------
app.post("/patients", patientValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const p = req.body;
    p.age = p.dob ? calculateAge(p.dob) : "";

    const fields = [
      "patient_id","name","dob","age","review_date","sex","weight",
      "phone1","phone2","location","diagnosis","situs_loop",
      "systemic_veins","pulmonary_veins","atria","atrial_septum",
      "av_valves","ventricles","ventricular_septum",
      "outflow_tracts","pulmonary_arteries","aortic_arch",
      "others_field","impression"
    ];

    const values = fields.map(f => p[f] || null);

    await pool.query(
      `INSERT INTO patients (${fields.join(",")})
       VALUES (${fields.map((_, i) => `$${i + 1}`).join(",")})`,
      values
    );

    res.json({ status: "success" });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Patient ID already exists" });
    res.status(500).json({ error: err.message });
  }
});

app.patch("/patients/:id", patientValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const p = req.body;
  p.age = p.dob ? calculateAge(p.dob) : "";

  const fields = [
    "name","dob","age","review_date","sex","weight",
    "phone1","phone2","location","diagnosis","situs_loop",
    "systemic_veins","pulmonary_veins","atria","atrial_septum",
    "av_valves","ventricles","ventricular_septum",
    "outflow_tracts","pulmonary_arteries","aortic_arch",
    "others_field","impression"
  ];

  const setQuery = fields.map((f, i) => `${f}=$${i+1}`).join(",");
  const values = fields.map(f => p[f] || null);

  try {
    await pool.query(`UPDATE patients SET ${setQuery} WHERE patient_id=$${fields.length+1}`, [...values, id]);
    res.json({ status: "updated" });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/patients", async (_, res) => {
  try {
    const r = await pool.query("SELECT patient_id, name, age, location FROM patients ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/patients/search", async (req, res) => {
    try {
        const nameQuery = req.query.name || "";
        const result = await pool.query(
            `SELECT patient_id, name, age, location 
             FROM patients 
             WHERE name ILIKE $1 
             ORDER BY created_at DESC`,
            [`%${nameQuery}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/patients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM patients WHERE patient_id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(result.rows[0]);
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

app.delete("/patients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM patients WHERE patient_id=$1", [id]);
    res.json({ status: "deleted" });
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PDF / PUPPETEER ----------------
let browserInstance = null;
async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: true,
      args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]
    });
  }
  return browserInstance;
}

async function generatePDFFromHTML(fileName, data) {
  const htmlPath = path.join(publicDir, fileName);
  if (!fs.existsSync(htmlPath)) throw new Error("HTML template not found");

  data.dob = data.dob ? formatDateForPDF(data.dob) : "";
  data.review_date = data.review_date ? formatDateForPDF(data.review_date) : "";
  data.report_date = formatDateForPDF(new Date());

  let html = fs.readFileSync(htmlPath, "utf8");
  for (const key in data) html = html.replace(new RegExp(`{{${key}}}`, "g"), data[key] || "");

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "load", timeout: 60000 });
  await page.evaluateHandle("document.fonts.ready");
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload=r; img.onerror=r; })));
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top:"10mm", bottom:"10mm", left:"10mm", right:"10mm" },
    timeout: 60000
  });

  await page.close();
  return pdf;
}

app.post("/generate-pdf", async (req, res) => {
  try {
    const pdf = await generatePDFFromHTML("report.html", req.body);
    const safeName = (req.body.name || '').replace(/[^a-z0-9]/gi, '_');
    const patientId = req.body.patient_id || 'Unknown';
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${patientId}-${safeName}.pdf"`);
    res.end(pdf);
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send(`PDF generation failed: ${err.message}`);
  }
});

// ---------------- HEALTH CHECK ----------------
app.get("/healthz", (_, res) => res.status(200).send("OK"));

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));