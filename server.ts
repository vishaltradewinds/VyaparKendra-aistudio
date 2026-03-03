import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { servicesSeedData } from "./seedData.js";

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

// SQLite (Primary Demo DB to ensure the UI works flawlessly without external setup)
const db = new Database("vyaparkendra.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    district TEXT,
    kyc_status TEXT DEFAULT 'pending',
    onboarding_step INTEGER DEFAULT 0,
    referred_by TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(referred_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS training_modules (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    video_url TEXT,
    duration TEXT,
    order_index INTEGER
  );
  CREATE TABLE IF NOT EXISTS user_training_progress (
    userId TEXT,
    moduleId TEXT,
    completed INTEGER DEFAULT 0,
    PRIMARY KEY(userId, moduleId)
  );
  CREATE TABLE IF NOT EXISTS mitra_documents (
    id TEXT PRIMARY KEY,
    mitraId TEXT,
    docType TEXT,
    status TEXT DEFAULT 'PENDING',
    uploaded_at TEXT
  );
  CREATE TABLE IF NOT EXISTS wallets (
    mitraId TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    FOREIGN KEY(mitraId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    type TEXT,
    debit TEXT,
    credit TEXT,
    amount REAL,
    district TEXT,
    userId TEXT,
    gstAmount REAL DEFAULT 0,
    tdsAmount REAL DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    serviceCode TEXT,
    mitraId TEXT,
    price REAL,
    status TEXT DEFAULT 'CREATED',
    created_at TEXT,
    FOREIGN KEY(mitraId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT,
    role TEXT,
    created_at TEXT
  );
  
  -- Migration: Ensure userId exists in ledger
  -- Note: SQLite doesn't support IF NOT EXISTS for ADD COLUMN easily in one statement
  -- but we can use a try-catch or just check if it exists.
`);

try {
  db.exec("ALTER TABLE ledger ADD COLUMN userId TEXT");
} catch (e) {
  // Column likely already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {
  // Column might already exist
}

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL,
    commission REAL,
    description TEXT,
    processing_time TEXT
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    mitra_id TEXT,
    applicant TEXT,
    amount REAL,
    purpose TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TEXT
  );
`);

// Seed Services Data
const existingServices = db.prepare("SELECT COUNT(*) as count FROM services").get() as any;
if (existingServices.count === 0) {
  const insertService = db.prepare("INSERT INTO services (id, name, category, price, commission, description, processing_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const insertMany = db.transaction((services) => {
    for (const s of services) {
      insertService.run(Math.random().toString(36).substr(2, 9), s.name, s.category, s.price, s.commission, s.description, s.processing_time);
    }
  });
  insertMany(servicesSeedData);
  console.log("Seeded services data.");
}

// Seed Training Modules
const existingModules = db.prepare("SELECT COUNT(*) as count FROM training_modules").get() as any;
if (existingModules.count === 0) {
  const modules = [
    { id: "m1", title: "Introduction to VyaparKendra", description: "Learn about our mission and the services you can offer.", duration: "10 mins", order_index: 1 },
    { id: "m2", title: "Using the Mitra Dashboard", description: "A complete walkthrough of your dashboard and wallet management.", duration: "15 mins", order_index: 2 },
    { id: "m3", title: "Compliance & Ethics", description: "Understanding the legal requirements and ethical standards for digital services.", duration: "20 mins", order_index: 3 },
    { id: "m4", title: "Customer Support Best Practices", description: "How to handle customer queries and provide excellent service.", duration: "12 mins", order_index: 4 }
  ];
  const insert = db.prepare("INSERT INTO training_modules (id, title, description, duration, order_index) VALUES (?, ?, ?, ?, ?)");
  modules.forEach(m => insert.run(m.id, m.title, m.description, m.duration, m.order_index));
  console.log("Seeded training modules.");
}

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

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, district, referredBy } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).substr(2, 9);
  try {
    db.prepare("INSERT INTO users (id, name, email, password, role, district, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name, email, hashedPassword, role, district, referredBy || null);
    res.json({ message: "Registration successful", user: { id, name, email, role, district } });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  
  const token = jwt.sign({ id: user.id, role: user.role, district: user.district }, privateKey, { algorithm: "RS256", expiresIn: "1d" });
  res.json({ token, role: user.role, onboarding_step: user.onboarding_step });
});

// --- Wallet Routes ---
app.post("/api/wallet/recharge", auth(["admin"]), (req: any, res) => {
  const { mitraId, amount } = req.body;
  
  const wallet: any = db.prepare("SELECT * FROM wallets WHERE mitraId = ?").get(mitraId);
  if (wallet) {
    db.prepare("UPDATE wallets SET balance = balance + ? WHERE mitraId = ?").run(amount, mitraId);
  } else {
    db.prepare("INSERT INTO wallets (mitraId, balance) VALUES (?, ?)").run(mitraId, amount);
  }

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "RECHARGE", "BANK", "MITRA_WALLET", amount, mitraId, new Date().toISOString()
  );

  res.json("Wallet Credited");
});

// --- Commission Engine ---
const calculateFranchiseCommission = (district: string, amount: number) => {
  const rate = 0.1;
  const commission = amount * rate;
  
  const franchise = db.prepare("SELECT id FROM users WHERE role = 'franchise' AND district = ?").get(district) as any;
  const franchiseId = franchise?.id || null;

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "FRANCHISE_COMMISSION", "PLATFORM_REVENUE", "FRANCHISE_ACCOUNT", commission, district, franchiseId, new Date().toISOString()
  );

  return commission;
};

const calculateMitraCommission = (mitraId: string, district: string, serviceCode: string, amount: number) => {
  // Find service commission rate
  const service = db.prepare("SELECT commission FROM services WHERE name = ?").get(serviceCode) as any;
  const commissionRate = service?.commission || 0.05; // Default 5% if not found
  const commission = amount * commissionRate;

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "MITRA_COMMISSION", "PLATFORM_REVENUE", "MITRA_WALLET", commission, district, mitraId, new Date().toISOString()
  );
  
  // Also credit the wallet
  db.prepare("UPDATE wallets SET balance = balance + ? WHERE mitraId = ?").run(commission, mitraId);

  return commission;
};

// --- Service Routes ---
app.get("/api/services", (req: any, res) => {
  const services = db.prepare("SELECT * FROM services").all();
  res.json(services);
});

app.post("/api/service/create", auth(["mitra"]), (req: any, res) => {
  const { serviceCode, price } = req.body;

  const wallet: any = db.prepare("SELECT * FROM wallets WHERE mitraId = ?").get(req.user.id);
  if (!wallet || wallet.balance < price) {
    return res.status(400).json("Insufficient balance");
  }

  db.prepare("UPDATE wallets SET balance = balance - ? WHERE mitraId = ?").run(price, req.user.id);

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "SERVICE_DEBIT", "MITRA_WALLET", "PLATFORM_REVENUE", price, req.user.district, req.user.id, new Date().toISOString()
  );

  calculateFranchiseCommission(req.user.district, price);
  calculateMitraCommission(req.user.id, req.user.district, serviceCode, price);

  db.prepare("INSERT INTO service_requests (id, serviceCode, mitraId, price, created_at) VALUES (?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), serviceCode, req.user.id, price, new Date().toISOString()
  );

  res.json("Service Created");
});

// --- Dashboard Routes ---
app.get("/api/dashboard/admin", auth(["admin"]), (req: any, res) => {
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const revenue = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE credit = 'PLATFORM_REVENUE'").get();
  
  const users = db.prepare("SELECT id, name, email, role, district, kyc_status, status FROM users ORDER BY id DESC").all();
  const ledger = db.prepare("SELECT * FROM ledger ORDER BY created_at DESC LIMIT 100").all();

  res.json({ 
    totalUsers: (usersCount as any).count, 
    platformRevenue: (revenue as any).total || 0,
    users,
    ledger
  });
});

app.get("/api/dashboard/mitra", auth(["mitra"]), (req: any, res) => {
  const user = db.prepare("SELECT onboarding_step, kyc_status FROM users WHERE id = ?").get(req.user.id) as any;
  const wallet: any = db.prepare("SELECT balance FROM wallets WHERE mitraId = ?").get(req.user.id);
  const requests = db.prepare("SELECT * FROM service_requests WHERE mitraId = ? ORDER BY created_at DESC").all(req.user.id);
  
  // Commission data
  const commissions = db.prepare("SELECT * FROM ledger WHERE userId = ? AND type = 'MITRA_COMMISSION' ORDER BY created_at DESC").all(req.user.id);
  const totalCommission = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE userId = ? AND type = 'MITRA_COMMISSION'").get(req.user.id);

  // Wallet history
  const ledgerEntries = db.prepare("SELECT type, amount, created_at FROM ledger WHERE userId = ? ORDER BY created_at ASC").all(req.user.id);
  
  let currentBalance = 0;
  const walletHistory = ledgerEntries.map((entry: any) => {
    if (entry.type === 'WALLET_RECHARGE' || entry.type === 'MITRA_COMMISSION') {
      currentBalance += entry.amount;
    } else if (entry.type === 'SERVICE_DEBIT') {
      currentBalance -= entry.amount;
    }
    return {
      date: new Date(entry.created_at).toLocaleDateString(),
      balance: currentBalance,
      type: entry.type,
      amount: entry.amount
    };
  });

  // Group by date to show daily balance
  const dailyBalanceMap = new Map();
  walletHistory.forEach((entry: any) => {
    dailyBalanceMap.set(entry.date, entry.balance);
  });
  
  const chartData = Array.from(dailyBalanceMap.entries()).map(([date, balance]) => ({
    date,
    balance
  }));

  // If chartData is empty, add a default point
  if (chartData.length === 0) {
    chartData.push({ date: new Date().toLocaleDateString(), balance: wallet?.balance || 0 });
  }

  res.json({ 
    balance: wallet?.balance || 0, 
    requests, 
    onboarding_step: user.onboarding_step, 
    kyc_status: user.kyc_status,
    commissions,
    totalCommission: (totalCommission as any)?.total || 0,
    payoutSchedule: "Weekly (Every Monday)",
    walletHistory: chartData
  });
});

app.get("/api/onboarding/status", auth(["mitra"]), (req: any, res) => {
  const user = db.prepare("SELECT onboarding_step, kyc_status FROM users WHERE id = ?").get(req.user.id) as any;
  const docs = db.prepare("SELECT * FROM mitra_documents WHERE mitraId = ?").all(req.user.id);
  const training = db.prepare(`
    SELECT tm.*, COALESCE(utp.completed, 0) as completed 
    FROM training_modules tm 
    LEFT JOIN user_training_progress utp ON tm.id = utp.moduleId AND utp.userId = ?
    ORDER BY tm.order_index
  `).all(req.user.id);
  res.json({ onboarding_step: user.onboarding_step, kyc_status: user.kyc_status, documents: docs, training });
});

app.post("/api/onboarding/upload", auth(["mitra"]), (req: any, res) => {
  const { docType } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  db.prepare("INSERT INTO mitra_documents (id, mitraId, docType, status, uploaded_at) VALUES (?, ?, ?, 'PENDING', ?)").run(
    id, req.user.id, docType, new Date().toISOString()
  );
  
  // Check if all required docs are uploaded to advance step
  const docs = db.prepare("SELECT docType FROM mitra_documents WHERE mitraId = ?").all(req.user.id) as any[];
  const required = ["AADHAAR", "PAN", "SHOP_PHOTO"];
  const hasAll = required.every(r => docs.some(d => d.docType === r));
  
  if (hasAll) {
    db.prepare("UPDATE users SET onboarding_step = 1 WHERE id = ? AND onboarding_step = 0").run(req.user.id);
  }
  
  res.json({ message: "Document uploaded successfully", id });
});

app.post("/api/onboarding/complete-training", auth(["mitra"]), (req: any, res) => {
  const { moduleId } = req.body;
  db.prepare("INSERT OR REPLACE INTO user_training_progress (userId, moduleId, completed) VALUES (?, ?, 1)").run(
    req.user.id, moduleId
  );
  
  // Check if all training is complete to advance step
  const total = db.prepare("SELECT COUNT(*) as count FROM training_modules").get() as any;
  const completed = db.prepare("SELECT COUNT(*) as count FROM user_training_progress WHERE userId = ? AND completed = 1").get(req.user.id) as any;
  
  if (completed.count >= total.count) {
    db.prepare("UPDATE users SET onboarding_step = 2 WHERE id = ? AND onboarding_step = 1").run(req.user.id);
  }
  
  res.json({ message: "Training module completed" });
});

app.post("/api/onboarding/final-submit", auth(["mitra"]), (req: any, res) => {
  const user = db.prepare("SELECT referred_by, onboarding_step FROM users WHERE id = ?").get(req.user.id) as any;
  
  if (user && user.onboarding_step < 3) {
    db.prepare("UPDATE users SET onboarding_step = 3, kyc_status = 'pending' WHERE id = ?").run(req.user.id);
    
    // Award referral bonus if referred by a franchise
    if (user.referred_by) {
      const referrer = db.prepare("SELECT role, district FROM users WHERE id = ?").get(user.referred_by) as any;
      if (referrer && referrer.role === 'franchise') {
        const bonusAmount = 500;
        db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          Math.random().toString(36).substr(2, 9), 
          "REFERRAL_BONUS", 
          "SYSTEM", 
          "FRANCHISE_COMMISSION", 
          bonusAmount, 
          referrer.district,
          user.referred_by,
          new Date().toISOString()
        );
      }
    }
  }
  res.json({ message: "Onboarding submitted for review" });
});

app.post("/api/dashboard/franchise/mitras", auth(["franchise"]), async (req: any, res) => {
  const { name, email, password } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    db.prepare("INSERT INTO users (id, name, email, password, role, district, referred_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')")
      .run(id, name, email, hashedPassword, 'mitra', req.user.district, req.user.id);
    res.json({ message: "Mitra created successfully", id });
  } catch (err) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.put("/api/dashboard/franchise/mitras/:id", auth(["franchise"]), async (req: any, res) => {
  const { name, email, status } = req.body;
  const mitraId = req.params.id;
  
  // Ensure the mitra belongs to the franchise's district
  const mitra = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'mitra' AND district = ?").get(mitraId, req.user.district);
  if (!mitra) return res.status(404).json({ error: "Mitra not found" });

  try {
    db.prepare("UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?").run(name, email, status, mitraId);
    res.json({ message: "Mitra updated successfully" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.delete("/api/dashboard/franchise/mitras/:id", auth(["franchise"]), (req: any, res) => {
  const mitraId = req.params.id;
  
  // Ensure the mitra belongs to the franchise's district
  const mitra = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'mitra' AND district = ?").get(mitraId, req.user.district);
  if (!mitra) return res.status(404).json({ error: "Mitra not found" });

  db.prepare("UPDATE users SET status = 'deactivated' WHERE id = ?").run(mitraId);
  res.json({ message: "Mitra deactivated successfully" });
});

app.get("/api/dashboard/franchise", auth(["franchise"]), (req: any, res) => {
  const commission = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'FRANCHISE_COMMISSION' AND district = ?").get(req.user.district);
  const referralBonuses = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'REFERRAL_BONUS' AND district = ?").get(req.user.district);
  const mitrasCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra' AND district = ?").get(req.user.district);
  const referredMitrasCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra' AND referred_by = ?").get(req.user.id);
  
  const mitras = db.prepare("SELECT id, name, email, kyc_status, onboarding_step, status FROM users WHERE role = 'mitra' AND district = ?").all(req.user.district);
  const recentCommissions = db.prepare("SELECT * FROM ledger WHERE (type = 'FRANCHISE_COMMISSION' OR type = 'REFERRAL_BONUS') AND district = ? ORDER BY created_at DESC LIMIT 10").all(req.user.district);
  
  const regionalPerformance = db.prepare(`
    SELECT COUNT(sr.id) as totalRequests, SUM(sr.price) as totalVolume
    FROM service_requests sr
    JOIN users u ON sr.mitraId = u.id
    WHERE u.district = ?
  `).get(req.user.district);

  res.json({ 
    totalCommission: (commission as any).total || 0, 
    referralBonuses: (referralBonuses as any).total || 0,
    totalMitras: (mitrasCount as any).count,
    referredMitras: (referredMitrasCount as any).count,
    mitras,
    recentCommissions,
    regionalPerformance: {
      totalRequests: (regionalPerformance as any).totalRequests || 0,
      totalVolume: (regionalPerformance as any).totalVolume || 0
    },
    district: req.user.district,
    franchiseId: req.user.id
  });
});

app.get("/api/dashboard/ca", auth(["ca"]), (req: any, res) => {
  const requests = db.prepare("SELECT * FROM service_requests WHERE serviceCode LIKE '%TAX%' OR serviceCode LIKE '%GST%'").all();
  res.json({ pendingTaxRequests: requests.length });
});

app.get("/api/dashboard/compliance", auth(["compliance"]), (req: any, res) => {
  const pendingKyc = db.prepare("SELECT COUNT(*) as count FROM users WHERE kyc_status = 'pending'").get();
  res.json({ pendingKyc: (pendingKyc as any).count });
});

app.get("/api/dashboard/investor", auth(["investor"]), (req: any, res) => {
  const revenue = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE credit = 'PLATFORM_REVENUE'").get();
  const growth = 15; // Mock growth %
  res.json({ totalRevenue: (revenue as any).total || 0, monthOverMonthGrowth: growth });
});

app.post("/api/ai/query", auth(), async (req: any, res) => {
  const { question, history = [] } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Fetch context data
    const services = db.prepare("SELECT name, category, price, commission, processing_time FROM services").all();
    
    let userContext = `User Role: ${req.user.role}\nUser Name: ${req.user.name}\n`;
    
    if (req.user.role === 'mitra') {
      const balance: any = db.prepare("SELECT balance FROM wallets WHERE mitraId = ?").get(req.user.id);
      const requests = db.prepare("SELECT serviceCode, status, created_at FROM service_requests WHERE mitraId = ? LIMIT 5").all(req.user.id);
      const loans = db.prepare("SELECT applicant, amount, purpose, status FROM loans WHERE mitra_id = ? LIMIT 5").all(req.user.id);
      
      userContext += `Wallet Balance: ₹${balance?.balance || 0}\n`;
      userContext += `Recent Requests: ${JSON.stringify(requests)}\n`;
      userContext += `Recent Loans: ${JSON.stringify(loans)}\n`;
    }

    const systemInstruction = `You are the VyaparKendra AI Assistant, specifically designed to help Mitras (agents). 
Your primary responsibilities include:
1. Service Recommendations: Recommend appropriate services based on customer needs (e.g., if a customer needs a PAN card, recommend the PAN Card service and state the price/processing time).
2. Customer Queries: Answer questions about required documents, processing times, and service details.
3. Administrative Tasks: Help the Mitra check their wallet balance, review recent requests, and track loan statuses.
4. Actions: You can create service requests or apply for loans on behalf of the Mitra using the provided tools.

You have access to the following system data:
Available Services: ${JSON.stringify(services)}

User Context:
${userContext}

Answer the user's question concisely, professionally, and accurately based on this data. If a user asks to create a service request, make sure to extract the service code and price from the available services list.`;

    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const contents = [...formattedHistory, { role: 'user', parts: [{ text: question }] }];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{
          functionDeclarations: [
            {
              name: "checkWalletBalance",
              description: "Check the current wallet balance of the user.",
              parameters: {
                type: Type.OBJECT,
                properties: {},
              }
            },
            {
              name: "createServiceRequest",
              description: "Create a new service request for a citizen.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  serviceCode: { type: Type.STRING, description: "The name or code of the service to request." },
                  price: { type: Type.NUMBER, description: "The price of the service." }
                },
                required: ["serviceCode", "price"]
              }
            },
            {
              name: "applyForLoan",
              description: "Apply for a new loan.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  applicantName: { type: Type.STRING, description: "Name of the applicant." },
                  amount: { type: Type.NUMBER, description: "Loan amount requested." },
                  purpose: { type: Type.STRING, description: "Purpose of the loan." }
                },
                required: ["applicantName", "amount", "purpose"]
              }
            }
          ]
        }]
      }
    });

    let answer = response.text;
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "checkWalletBalance") {
        const balance: any = db.prepare("SELECT balance FROM wallets WHERE mitraId = ?").get(req.user.id);
        answer = `Your current wallet balance is ₹${balance?.balance || 0}.`;
      } else if (call.name === "createServiceRequest") {
        const { serviceCode, price } = call.args as any;
        const wallet: any = db.prepare("SELECT balance FROM wallets WHERE mitraId = ?").get(req.user.id);
        if (!wallet || wallet.balance < price) {
          answer = `You have insufficient balance to create a request for ${serviceCode}. It costs ₹${price}, but your balance is ₹${wallet?.balance || 0}.`;
        } else {
          db.prepare("UPDATE wallets SET balance = balance - ? WHERE mitraId = ?").run(price, req.user.id);
          
          db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district, userId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
            Math.random().toString(36).substr(2, 9), "SERVICE_DEBIT", "MITRA_WALLET", "PLATFORM_REVENUE", price, req.user.district, req.user.id, new Date().toISOString()
          );

          calculateFranchiseCommission(req.user.district, price);
          calculateMitraCommission(req.user.id, req.user.district, serviceCode, price);

          db.prepare("INSERT INTO service_requests (id, serviceCode, mitraId, price, created_at) VALUES (?, ?, ?, ?, ?)").run(
            Math.random().toString(36).substr(2, 9), serviceCode, req.user.id, price, new Date().toISOString()
          );
          answer = `Successfully created a service request for ${serviceCode}. ₹${price} has been deducted from your wallet.`;
        }
      } else if (call.name === "applyForLoan") {
        const { applicantName, amount, purpose } = call.args as any;
        db.prepare("INSERT INTO loans (id, mitra_id, applicant, amount, purpose, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
          Math.random().toString(36).substr(2, 9), req.user.id, applicantName, amount, purpose, new Date().toISOString()
        );
        answer = `Successfully submitted a loan application for ${applicantName} for ₹${amount} (${purpose}).`;
      }
    }

    res.json({ answer });
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
