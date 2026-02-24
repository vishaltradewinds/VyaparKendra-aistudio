import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vyaparkendra";
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "super_internal_token";

// =====================================================
// 1. RSA KEY MANAGEMENT FOR RS256
// =====================================================
let privateKey: string;
let publicKey: string;

// For a fully deployable demo, we need both public and private keys to sign and verify JWTs.
// If the private key is missing, we generate a new pair for the demo environment.
if (fs.existsSync("./private.pem") && fs.existsSync("./public.pem")) {
  privateKey = fs.readFileSync("./private.pem", "utf8");
  publicKey = fs.readFileSync("./public.pem", "utf8");
} else {
  console.log("Generating new RSA keypair for RS256 demo...");
  const { privateKey: prk, publicKey: puk } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  privateKey = prk;
  publicKey = puk;
  fs.writeFileSync("./private.pem", privateKey);
  fs.writeFileSync("./public.pem", publicKey);
}

// =====================================================
// 2. DATABASE CONNECTIONS
// =====================================================

// MongoDB (Optional for Demo - prevents crashing if not available)
mongoose.connect(MONGO_URI).catch(err => {
  console.warn("MongoDB connection failed (Optional for demo). Using SQLite fallback.", err.message);
});

// SQLite (Primary Demo DB to ensure the UI works flawlessly without external setup)
const db = new Database("vyaparkendra.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    kyc_status TEXT DEFAULT 'pending'
  );
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL,
    commission REAL,
    description TEXT,
    processing_time TEXT
  );
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    mitra_id TEXT,
    citizen_name TEXT,
    citizen_phone TEXT,
    id_number TEXT,
    service_id TEXT,
    status TEXT DEFAULT 'in_progress',
    notes TEXT,
    created_at TEXT,
    FOREIGN KEY(mitra_id) REFERENCES users(id),
    FOREIGN KEY(service_id) REFERENCES services(id)
  );
  CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    mitra_id TEXT,
    amount REAL,
    type TEXT,
    reference TEXT,
    created_at TEXT,
    FOREIGN KEY(mitra_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    mitra_id TEXT,
    applicant TEXT,
    phone TEXT,
    amount REAL,
    purpose TEXT,
    tenure INTEGER,
    income REAL,
    status TEXT DEFAULT 'submitted',
    created_at TEXT,
    FOREIGN KEY(mitra_id) REFERENCES users(id)
  );
`);

// =====================================================
// 3. AUTH MIDDLEWARE (RS256)
// =====================================================
function auth(roles: string[] = []) {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid Token" });
    }
  };
}

// =====================================================
// 4. API ROUTES
// =====================================================

// --- System/Alliance Routes ---
app.get("/api/status", (req, res) => {
  res.json({ service: "VYAPARKENDRA", issuer: "ALLIANCEVENTURES", auth: "RS256", status: "Active" });
});

app.get("/api/msme", auth(["admin", "investor"]), (req: any, res) => {
  res.json({ message: "MSME Secure Data", user: req.user });
});

app.get("/internal/metrics", (req, res) => {
  const token = req.headers["x-service-token"];
  if (token !== INTERNAL_TOKEN) return res.status(403).json({ error: "Forbidden" });
  res.json({ msmeOnboarded: 8700, creditScoresGenerated: 6300, totalRevenue: 18000000 });
});

// --- Frontend App Routes ---
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).substr(2, 9);
  try {
    db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(id, name, email, hashedPassword, role);
    res.json({ message: "Registration successful" });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  
  // Sign token using RS256 and the private key
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, privateKey, { algorithm: "RS256", expiresIn: "12h" });
  res.json({ access_token: token, role: user.role, name: user.name });
});

app.get("/api/services", (req, res) => {
  const services = db.prepare("SELECT * FROM services").all();
  res.json(services);
});

app.post("/api/admin/services", auth(["admin"]), (req: any, res) => {
  const { name, category, price, commission, description, processing_time } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  db.prepare("INSERT INTO services (id, name, category, price, commission, description, processing_time) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name, category, price, commission, description, processing_time);
  res.json({ message: "Service added" });
});

app.post("/api/mitra/requests", auth(["mitra"]), (req: any, res) => {
  const { citizen_name, citizen_phone, id_number, service_id, notes } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  db.prepare("INSERT INTO requests (id, mitra_id, citizen_name, citizen_phone, id_number, service_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, req.user.id, citizen_name, citizen_phone, id_number, service_id, notes, new Date().toISOString());
  res.json({ message: "Request created" });
});

app.get("/api/mitra/requests", auth(["mitra"]), (req: any, res) => {
  const requests = db.prepare("SELECT r.*, s.name as service_name, s.commission FROM requests r JOIN services s ON r.service_id = s.id WHERE r.mitra_id = ?").all(req.user.id);
  res.json(requests);
});

app.post("/api/mitra/requests/:id/complete", auth(["mitra"]), (req: any, res) => {
  const { id } = req.params;
  const request: any = db.prepare("SELECT * FROM requests WHERE id = ? AND mitra_id = ?").get(id, req.user.id);
  if (!request) return res.sendStatus(404);
  
  const service: any = db.prepare("SELECT commission FROM services WHERE id = ?").get(request.service_id);
  
  db.transaction(() => {
    db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(id);
    db.prepare("INSERT INTO ledger (id, mitra_id, amount, type, reference, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(Math.random().toString(36).substr(2, 9), req.user.id, service.commission, 'credit', id, new Date().toISOString());
  })();
  
  res.json({ message: "Completed and commission credited" });
});

app.get("/api/mitra/wallet", auth(["mitra"]), (req: any, res) => {
  const balance: any = db.prepare("SELECT SUM(amount) as balance FROM ledger WHERE mitra_id = ?").get(req.user.id);
  res.json({ balance: balance.balance || 0 });
});

app.post("/api/loans", auth(["mitra"]), (req: any, res) => {
  const { applicant, phone, amount, purpose, tenure, income } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  db.prepare("INSERT INTO loans (id, mitra_id, applicant, phone, amount, purpose, tenure, income, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, req.user.id, applicant, phone, amount, purpose, tenure, income, new Date().toISOString());
  res.json({ message: "Loan application submitted" });
});

app.get("/api/loans", auth(["mitra"]), (req: any, res) => {
  const loans = db.prepare("SELECT * FROM loans WHERE mitra_id = ?").all(req.user.id);
  res.json(loans);
});

app.get("/api/admin/analytics", auth(["admin"]), (req: any, res) => {
  const mitras: any = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra'").get();
  const requests: any = db.prepare("SELECT COUNT(*) as count FROM requests").get();
  const revenue: any = db.prepare("SELECT SUM(amount) as total FROM ledger").get();
  res.json({ total_mitras: mitras.count, total_requests: requests.count, total_revenue: revenue.total || 0 });
});

app.post("/api/ai/query", async (req, res) => {
  const { question } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the VyaparKendra AI Assistant. Help the user with their question about business, services, or loans. Question: ${question}`
    });
    res.json({ answer: response.text });
  } catch (e) {
    console.error(e);
    res.json({ answer: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." });
  }
});

// =====================================================
// 5. VITE MIDDLEWARE (FRONTEND SERVING)
// =====================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("VYAPARKENDRA running on port " + PORT);
  });
}

startServer();
