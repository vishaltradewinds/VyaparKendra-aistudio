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
    kyc_status TEXT DEFAULT 'pending'
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
    gstAmount REAL DEFAULT 0,
    tdsAmount REAL DEFAULT 0,
    created_at TEXT
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
  const { name, email, password, role, district } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).substr(2, 9);
  try {
    db.prepare("INSERT INTO users (id, name, email, password, role, district) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, email, hashedPassword, role, district);
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
  res.json({ token, role: user.role });
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

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount) VALUES (?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "RECHARGE", "BANK", "MITRA_WALLET", amount
  );

  res.json("Wallet Credited");
});

// --- Commission Engine ---
const calculateFranchiseCommission = (district: string, amount: number) => {
  const rate = 0.1;
  const commission = amount * rate;

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district) VALUES (?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "FRANCHISE_COMMISSION", "PLATFORM_REVENUE", "FRANCHISE_ACCOUNT", commission, district
  );

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

  db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district) VALUES (?, ?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), "SERVICE_DEBIT", "MITRA_WALLET", "PLATFORM_REVENUE", price, req.user.district
  );

  calculateFranchiseCommission(req.user.district, price);

  db.prepare("INSERT INTO service_requests (id, serviceCode, mitraId, price, created_at) VALUES (?, ?, ?, ?, ?)").run(
    Math.random().toString(36).substr(2, 9), serviceCode, req.user.id, price, new Date().toISOString()
  );

  res.json("Service Created");
});

// --- Dashboard Routes ---
app.get("/api/dashboard/admin", auth(["admin"]), (req: any, res) => {
  const users = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const revenue = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE credit = 'PLATFORM_REVENUE'").get();
  res.json({ totalUsers: (users as any).count, platformRevenue: (revenue as any).total || 0 });
});

app.get("/api/dashboard/mitra", auth(["mitra"]), (req: any, res) => {
  const wallet: any = db.prepare("SELECT balance FROM wallets WHERE mitraId = ?").get(req.user.id);
  const requests = db.prepare("SELECT * FROM service_requests WHERE mitraId = ?").all(req.user.id);
  res.json({ balance: wallet?.balance || 0, requests });
});

app.get("/api/dashboard/franchise", auth(["franchise"]), (req: any, res) => {
  const commission = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'FRANCHISE_COMMISSION' AND district = ?").get(req.user.district);
  const mitrasCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mitra' AND district = ?").get(req.user.district);
  
  const mitras = db.prepare("SELECT id, name, email, kyc_status FROM users WHERE role = 'mitra' AND district = ?").all(req.user.district);
  const recentCommissions = db.prepare("SELECT * FROM ledger WHERE type = 'FRANCHISE_COMMISSION' AND district = ? ORDER BY created_at DESC LIMIT 10").all(req.user.district);
  
  const regionalPerformance = db.prepare(`
    SELECT COUNT(sr.id) as totalRequests, SUM(sr.price) as totalVolume
    FROM service_requests sr
    JOIN users u ON sr.mitraId = u.id
    WHERE u.district = ?
  `).get(req.user.district);

  res.json({ 
    totalCommission: (commission as any).total || 0, 
    totalMitras: (mitrasCount as any).count,
    mitras,
    recentCommissions,
    regionalPerformance: {
      totalRequests: (regionalPerformance as any).totalRequests || 0,
      totalVolume: (regionalPerformance as any).totalVolume || 0
    },
    district: req.user.district
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
  const { question } = req.body;
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

    const systemInstruction = `You are the VyaparKendra AI Assistant. Help the user with their question about business, services, or loans. 
You have access to the following system data:
Available Services: ${JSON.stringify(services)}

User Context:
${userContext}

Answer the user's question concisely and accurately based on this data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        tools: [{
          functionDeclarations: [
            {
              name: "checkWalletBalance",
              description: "Check the current wallet balance of the user.",
              parameters: {
                type: "OBJECT",
                properties: {},
              }
            },
            {
              name: "createServiceRequest",
              description: "Create a new service request for a citizen.",
              parameters: {
                type: "OBJECT",
                properties: {
                  serviceCode: { type: "STRING", description: "The name or code of the service to request." },
                  price: { type: "NUMBER", description: "The price of the service." }
                },
                required: ["serviceCode", "price"]
              }
            },
            {
              name: "applyForLoan",
              description: "Apply for a new loan.",
              parameters: {
                type: "OBJECT",
                properties: {
                  applicantName: { type: "STRING", description: "Name of the applicant." },
                  amount: { type: "NUMBER", description: "Loan amount requested." },
                  purpose: { type: "STRING", description: "Purpose of the loan." }
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
          
          db.prepare("INSERT INTO ledger (id, type, debit, credit, amount, district) VALUES (?, ?, ?, ?, ?, ?)").run(
            Math.random().toString(36).substr(2, 9), "SERVICE_DEBIT", "MITRA_WALLET", "PLATFORM_REVENUE", price, req.user.district
          );

          calculateFranchiseCommission(req.user.district, price);

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
