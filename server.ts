import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vyaparkendra.db");
const SECRET_KEY = process.env.SECRET_KEY || "SUPER_SECRET_KEY";

// Initialize Database
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

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substr(2, 9);

    try {
      db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, name, email, hashedPassword, role);
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

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ access_token: token, role: user.role, name: user.name });
  });

  // --- Service Routes ---
  app.get("/api/services", (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.post("/api/admin/services", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, category, price, commission, description, processing_time } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO services (id, name, category, price, commission, description, processing_time) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, name, category, price, commission, description, processing_time);
    res.json({ message: "Service added" });
  });

  // --- Mitra Routes ---
  app.post("/api/mitra/requests", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'mitra') return res.sendStatus(403);
    const { citizen_name, citizen_phone, id_number, service_id, notes } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO requests (id, mitra_id, citizen_name, citizen_phone, id_number, service_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, req.user.id, citizen_name, citizen_phone, id_number, service_id, notes, new Date().toISOString());
    res.json({ message: "Request created" });
  });

  app.get("/api/mitra/requests", authenticateToken, (req: any, res) => {
    const requests = db.prepare(`
      SELECT r.*, s.name as service_name, s.commission 
      FROM requests r 
      JOIN services s ON r.service_id = s.id 
      WHERE r.mitra_id = ?
    `).all(req.user.id);
    res.json(requests);
  });

  app.post("/api/mitra/requests/:id/complete", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const request: any = db.prepare("SELECT * FROM requests WHERE id = ? AND mitra_id = ?").get(id, req.user.id);
    if (!request) return res.sendStatus(404);

    const service: any = db.prepare("SELECT commission FROM services WHERE id = ?").get(request.service_id);
    
    db.transaction(() => {
      db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(id);
      db.prepare("INSERT INTO ledger (id, mitra_id, amount, type, reference, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substr(2, 9), req.user.id, service.commission, 'credit', id, new Date().toISOString());
    })();

    res.json({ message: "Completed and commission credited" });
  });

  app.get("/api/mitra/wallet", authenticateToken, (req: any, res) => {
    const balance: any = db.prepare("SELECT SUM(amount) as balance FROM ledger WHERE mitra_id = ?").get(req.user.id);
    res.json({ balance: balance.balance || 0 });
  });

  // --- Loan Routes ---
  app.post("/api/loans", authenticateToken, (req: any, res) => {
    const { applicant, phone, amount, purpose, tenure, income } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO loans (id, mitra_id, applicant, phone, amount, purpose, tenure, income, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, req.user.id, applicant, phone, amount, purpose, tenure, income, new Date().toISOString());
    res.json({ message: "Loan application submitted" });
  });

  app.get("/api/loans", authenticateToken, (req: any, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE mitra_id = ?").all(req.user.id);
    res.json(loans);
  });

  // --- Admin Analytics ---
  app.get("/api/admin/analytics", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const mitras: any = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra'").get();
    const requests: any = db.prepare("SELECT COUNT(*) as count FROM requests").get();
    const revenue: any = db.prepare("SELECT SUM(amount) as total FROM ledger").get();
    res.json({
      total_mitras: mitras.count,
      total_requests: requests.count,
      total_revenue: revenue.total || 0
    });
  });

  // --- AI Assistant ---
  app.post("/api/ai/query", async (req, res) => {
    const { question } = req.body;
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: `You are the VyaparKendra AI Assistant. Help the user with their question about business, services, or loans. Question: ${question}` }] }]
      });
      const response = await model;
      res.json({ answer: response.text });
    } catch (e) {
      res.json({ answer: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." });
    }
  });

  // Vite middleware for development
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

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
