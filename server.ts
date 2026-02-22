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
    tenant TEXT,
    kyc_status TEXT DEFAULT 'pending',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL,
    commission REAL,
    description TEXT,
    processing_time TEXT,
    tenant TEXT
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    mitra_id TEXT,
    msme_id TEXT,
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
    nbfc_partner_id TEXT,
    gstin TEXT,
    credit_score INTEGER,
    status TEXT DEFAULT 'submitted',
    created_at TEXT,
    FOREIGN KEY(mitra_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS nbfc_partners (
    id TEXT PRIMARY KEY,
    name TEXT,
    api_endpoint TEXT,
    commission_rate REAL,
    active_status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    role TEXT,
    action TEXT,
    ip_address TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS state_analytics (
    id TEXT PRIMARY KEY,
    state TEXT UNIQUE,
    total_revenue REAL DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    updated_at TEXT
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Audit Logger
  const logAudit = (userId: string, role: string, action: string, ip: string) => {
    try {
      db.prepare("INSERT INTO audit_logs (id, user_id, role, action, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substr(2, 9), userId, role, action, ip, new Date().toISOString());
    } catch (e) { console.error("Audit log failed", e); }
  };

  const updateStateAnalytics = (state: string, revenue: number = 0, requests: number = 0) => {
    if (!state) return;
    try {
      const existing: any = db.prepare("SELECT * FROM state_analytics WHERE state = ?").get(state);
      if (existing) {
        db.prepare("UPDATE state_analytics SET total_revenue = total_revenue + ?, total_requests = total_requests + ?, updated_at = ? WHERE state = ?")
          .run(revenue, requests, new Date().toISOString(), state);
      } else {
        db.prepare("INSERT INTO state_analytics (id, state, total_revenue, total_requests, updated_at) VALUES (?, ?, ?, ?, ?)")
          .run(Math.random().toString(36).substr(2, 9), state, revenue, requests, new Date().toISOString());
      }
    } catch (e) { console.error("Analytics update failed", e); }
  };

  // Audit Middleware
  app.use((req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logAudit('system', 'middleware', `${req.method} ${req.path}`, ip);
    next();
  });

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

  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  };

  // --- Auth Routes ---
  app.post("/api/register", async (req, res) => {
    const { name, email, password, role, tenant = 'Global' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substr(2, 9);

    try {
      db.prepare("INSERT INTO users (id, name, email, password, role, tenant, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, name, email, hashedPassword, role, tenant, new Date().toISOString());
      logAudit(id, role, 'User Registered', req.ip || 'unknown');
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

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, tenant: user.tenant }, SECRET_KEY, { expiresIn: '12h' });
    logAudit(user.id, user.role, 'User Login', req.ip || 'unknown');
    res.json({ access_token: token, role: user.role, name: user.name, tenant: user.tenant });
  });

  // --- Service Routes ---
  app.get("/api/services", (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.post("/api/admin/services", authenticateToken, requireRole(['admin', 'tech']), (req: any, res) => {
    const { name, category, price, commission, description, processing_time, tenant = 'Global' } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO services (id, name, category, price, commission, description, processing_time, tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, name, category, price, commission, description, processing_time, tenant);
    logAudit(req.user.id, req.user.role, `Added service ${name}`, req.ip || 'unknown');
    res.json({ message: "Service added" });
  });

  // --- Mitra Routes ---
  app.post("/api/mitra/requests", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const { citizen_name, citizen_phone, id_number, service_id, notes, msme_id = null } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO requests (id, mitra_id, msme_id, citizen_name, citizen_phone, id_number, service_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, req.user.id, msme_id, citizen_name, citizen_phone, id_number, service_id, notes, new Date().toISOString());
    updateStateAnalytics(req.user.tenant, 0, 1);
    logAudit(req.user.id, req.user.role, `Created request ${id}`, req.ip || 'unknown');
    res.json({ message: "Request created" });
  });

  app.get("/api/mitra/requests", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const requests = db.prepare(`
      SELECT r.*, s.name as service_name, s.commission 
      FROM requests r 
      JOIN services s ON r.service_id = s.id 
      WHERE r.mitra_id = ?
    `).all(req.user.id);
    res.json(requests);
  });

  app.post("/api/mitra/requests/:id/complete", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const { id } = req.params;
    const request: any = db.prepare("SELECT * FROM requests WHERE id = ? AND mitra_id = ?").get(id, req.user.id);
    if (!request || request.status === 'completed') return res.status(400).json({ error: "Invalid or already completed request" });

    const service: any = db.prepare("SELECT commission, price FROM services WHERE id = ?").get(request.service_id);
    
    db.transaction(() => {
      db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(id);
      db.prepare("INSERT INTO ledger (id, mitra_id, amount, type, reference, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substr(2, 9), req.user.id, service.commission, 'credit', id, new Date().toISOString());
    })();

    updateStateAnalytics(req.user.tenant, service.price, 0);
    logAudit(req.user.id, req.user.role, `Completed request ${id}`, req.ip || 'unknown');
    res.json({ message: "Completed and commission credited" });
  });

  app.get("/api/mitra/wallet", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const credits: any = db.prepare("SELECT SUM(amount) as balance FROM ledger WHERE mitra_id = ? AND type = 'credit'").get(req.user.id);
    const debits: any = db.prepare("SELECT SUM(amount) as balance FROM ledger WHERE mitra_id = ? AND type = 'debit'").get(req.user.id);
    const balance = (credits.balance || 0) - (debits.balance || 0);
    res.json({ balance, total_earned: credits.balance || 0 });
  });

  // --- Loan Routes ---
  app.post("/api/loans", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const { applicant, phone, amount, purpose, tenure, income, nbfc_partner_id = null, gstin = null } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const credit_score = gstin && gstin.length === 15 ? 750 : 600; // Mock credit score logic

    db.prepare("INSERT INTO loans (id, mitra_id, applicant, phone, amount, purpose, tenure, income, nbfc_partner_id, gstin, credit_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, req.user.id, applicant, phone, amount, purpose, tenure, income, nbfc_partner_id, gstin, credit_score, new Date().toISOString());
    
    logAudit(req.user.id, req.user.role, `Applied for loan ${id}`, req.ip || 'unknown');
    res.json({ message: "Loan application submitted", credit_score });
  });

  app.get("/api/loans", authenticateToken, requireRole(['mitra']), (req: any, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE mitra_id = ?").all(req.user.id);
    res.json(loans);
  });

  // --- Admin Analytics ---
  app.get("/api/admin/analytics", authenticateToken, requireRole(['admin', 'tech', 'govt']), (req: any, res) => {
    const mitras: any = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra'").get();
    const requests: any = db.prepare("SELECT COUNT(*) as count FROM requests").get();
    const revenue: any = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'credit'").get();
    const state_metrics = db.prepare("SELECT * FROM state_analytics").all();
    
    res.json({
      total_mitras: mitras.count,
      total_requests: requests.count,
      total_revenue: revenue.total || 0,
      state_metrics
    });
  });

  app.get("/api/admin/audit-logs", authenticateToken, requireRole(['admin', 'tech', 'govt']), (req: any, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100").all();
    res.json(logs);
  });

  // --- NBFC Module ---
  app.get("/api/nbfc/loans", authenticateToken, requireRole(['nbfc']), (req: any, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE status = 'submitted'").all();
    res.json(loans);
  });

  app.put("/api/nbfc/loans/:id/status", authenticateToken, requireRole(['nbfc']), (req: any, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected', 'disbursed'].includes(status)) return res.status(400).json({ error: "Invalid status" });
    db.prepare("UPDATE loans SET status = ? WHERE id = ?").run(status, req.params.id);
    logAudit(req.user.id, req.user.role, `Updated loan ${req.params.id} to ${status}`, req.ip || 'unknown');
    res.json({ message: `Loan ${status}` });
  });

  // --- MSME Module ---
  app.get("/api/msme/credit-score", authenticateToken, requireRole(['msme']), (req: any, res) => {
    res.json({ msme_id: req.user.id, credit_score: 720, last_updated: new Date().toISOString() });
  });

  // --- Government Module ---
  app.get("/api/govt/analytics", authenticateToken, requireRole(['govt']), (req: any, res) => {
    const row = db.prepare("SELECT * FROM state_analytics WHERE state = ?").get(req.user.tenant);
    res.json(row || { state: req.user.tenant, total_revenue: 0, total_requests: 0 });
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

  app.post("/api/ai/gst-analysis", authenticateToken, async (req: any, res) => {
    res.json({
      status: "success",
      analysis: {
        risk_level: "Low",
        compliance_score: 92,
        recommendations: ["File GSTR-3B by 20th", "Reconcile GSTR-2A mismatches"]
      }
    });
  });

  app.post("/api/ai/credit-score", authenticateToken, async (req: any, res) => {
    res.json({
      status: "success",
      prediction: {
        estimated_score: 745,
        default_probability: 0.04,
        factors: ["Consistent GST filing", "High vintage", "Low credit utilization"]
      }
    });
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
