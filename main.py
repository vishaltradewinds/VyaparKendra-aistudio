# ===============================================================
# VYAPARKENDRA – NATIONAL STAKEHOLDER-INTEGRATED FULLSTACK PLATFORM
# PRODUCTION READY FASTAPI BACKEND
# ===============================================================

import os
import uuid
import hashlib
import jwt
import sqlite3
import psycopg2
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# ===============================================================
# CONFIGURATION & ENVIRONMENT VARIABLES
# ===============================================================

SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY")
ALGORITHM = "HS256"
DATABASE_URL = os.getenv("DATABASE_URL")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
DB_FILE = "vyaparkendra_national.db"

app = FastAPI(title="VyaparKendra National Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ===============================================================
# DATABASE HANDLER
# ===============================================================

def get_db():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    return sqlite3.connect(DB_FILE)

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        tenant TEXT,
        kyc_status TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS services(
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        mitra_commission REAL,
        tenant TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS service_requests(
        id TEXT PRIMARY KEY,
        citizen_name TEXT,
        msme_id TEXT,
        mitra_id TEXT,
        service_id TEXT,
        status TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS ledger(
        id TEXT PRIMARY KEY,
        mitra_id TEXT,
        amount REAL,
        type TEXT,
        reference_id TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS loan_applications(
        id TEXT PRIMARY KEY,
        applicant_name TEXT,
        mitra_id TEXT,
        nbfc_partner_id TEXT,
        gstin TEXT,
        credit_score INTEGER,
        requested_amount REAL,
        status TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS nbfc_partners(
        id TEXT PRIMARY KEY,
        name TEXT,
        api_endpoint TEXT,
        commission_rate REAL,
        active_status BOOLEAN
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS audit_logs(
        id TEXT PRIMARY KEY,
        user_id TEXT,
        role TEXT,
        action TEXT,
        ip_address TEXT,
        timestamp TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS state_analytics(
        id TEXT PRIMARY KEY,
        state TEXT UNIQUE,
        total_revenue REAL,
        total_requests INTEGER,
        updated_at TEXT
    )""")

    conn.commit()
    conn.close()

init_db()

# ===============================================================
# UTILITIES & SECURITY
# ===============================================================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(data: dict) -> str:
    data.update({"exp": datetime.utcnow() + timedelta(hours=24)})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[str]):
    def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def log_audit(user_id: str, role: str, action: str, ip_address: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?)",
              (str(uuid.uuid4()), user_id, role, action, ip_address, str(datetime.utcnow())))
    conn.commit()
    conn.close()

def update_state_analytics(state: str, revenue: float = 0, requests: int = 0):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM state_analytics WHERE state=?", (state,))
    row = c.fetchone()
    if row:
        c.execute("UPDATE state_analytics SET total_revenue = total_revenue + ?, total_requests = total_requests + ?, updated_at = ? WHERE state=?",
                  (revenue, requests, str(datetime.utcnow()), state))
    else:
        c.execute("INSERT INTO state_analytics VALUES (?, ?, ?, ?, ?)",
                  (str(uuid.uuid4()), state, revenue, requests, str(datetime.utcnow())))
    conn.commit()
    conn.close()

# ===============================================================
# MIDDLEWARE
# ===============================================================

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    response = await call_next(request)
    # Basic logging for all requests
    client_ip = request.client.host if request.client else "unknown"
    action = f"{request.method} {request.url.path}"
    
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?)",
              (str(uuid.uuid4()), "system", "middleware", action, client_ip, str(datetime.utcnow())))
    conn.commit()
    conn.close()
    
    return response

# ===============================================================
# MODELS
# ===============================================================

class RegisterModel(BaseModel):
    name: str
    email: str
    password: str
    role: str  # admin, mitra, msme, nbfc, govt, tech
    tenant: str # e.g., 'MH', 'DL', 'KA'

class LoginModel(BaseModel):
    email: str
    password: str

class ServiceModel(BaseModel):
    name: str
    category: str
    price: float
    mitra_commission: float
    tenant: str

class RequestModel(BaseModel):
    citizen_name: str
    msme_id: Optional[str] = None
    service_id: str

class LoanModel(BaseModel):
    applicant_name: str
    nbfc_partner_id: str
    gstin: str
    requested_amount: float

class NBFCModel(BaseModel):
    name: str
    api_endpoint: str
    commission_rate: float

class AIQueryModel(BaseModel):
    data: str

# ===============================================================
# 1. AUTH MODULE
# ===============================================================

@app.post("/register", tags=["Auth"])
def register(data: RegisterModel, request: Request):
    conn = get_db()
    c = conn.cursor()
    user_id = str(uuid.uuid4())
    
    try:
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  (user_id, data.name, data.email, hash_password(data.password), 
                   data.role, data.tenant, "pending", str(datetime.utcnow())))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    conn.close()
    log_audit(user_id, data.role, "User Registered", request.client.host if request.client else "unknown")
    return {"message": "Registration successful", "user_id": user_id}

@app.post("/login", tags=["Auth"])
def login(data: LoginModel, request: Request):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, role, tenant, password_hash FROM users WHERE email=?", (data.email,))
    user = c.fetchone()
    conn.close()

    if not user or user[3] != hash_password(data.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_token({"user_id": user[0], "role": user[1], "tenant": user[2]})
    log_audit(user[0], user[1], "User Login", request.client.host if request.client else "unknown")
    
    return {"access_token": token, "token_type": "bearer", "role": user[1], "tenant": user[2]}

# ===============================================================
# 2. ADMIN MODULE
# ===============================================================

@app.post("/admin/services", tags=["Admin"])
def add_service(service: ServiceModel, request: Request, user=Depends(require_role(["admin", "tech"]))):
    conn = get_db()
    c = conn.cursor()
    service_id = str(uuid.uuid4())
    c.execute("INSERT INTO services VALUES (?, ?, ?, ?, ?, ?)",
              (service_id, service.name, service.category, service.price, service.mitra_commission, service.tenant))
    conn.commit()
    conn.close()
    log_audit(user["user_id"], user["role"], f"Added service {service.name}", request.client.host if request.client else "unknown")
    return {"message": "Service added successfully", "service_id": service_id}

@app.put("/admin/mitra/{mitra_id}/approve", tags=["Admin"])
def approve_mitra(mitra_id: str, request: Request, user=Depends(require_role(["admin"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET kyc_status='approved' WHERE id=? AND role='mitra'", (mitra_id,))
    conn.commit()
    conn.close()
    log_audit(user["user_id"], user["role"], f"Approved mitra {mitra_id}", request.client.host if request.client else "unknown")
    return {"message": "Mitra approved"}

@app.post("/admin/nbfc", tags=["Admin"])
def add_nbfc(nbfc: NBFCModel, request: Request, user=Depends(require_role(["admin", "tech"]))):
    conn = get_db()
    c = conn.cursor()
    nbfc_id = str(uuid.uuid4())
    c.execute("INSERT INTO nbfc_partners VALUES (?, ?, ?, ?, ?)",
              (nbfc_id, nbfc.name, nbfc.api_endpoint, nbfc.commission_rate, True))
    conn.commit()
    conn.close()
    log_audit(user["user_id"], user["role"], f"Added NBFC {nbfc.name}", request.client.host if request.client else "unknown")
    return {"message": "NBFC Partner added", "nbfc_id": nbfc_id}

@app.get("/admin/analytics", tags=["Admin"])
def view_analytics(user=Depends(require_role(["admin", "tech", "govt"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users WHERE role='mitra'")
    total_mitras = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM service_requests")
    total_requests = c.fetchone()[0]
    c.execute("SELECT SUM(amount) FROM ledger WHERE type='credit'")
    total_revenue = c.fetchone()[0] or 0
    c.execute("SELECT * FROM state_analytics")
    state_metrics = c.fetchall()
    conn.close()
    
    return {
        "total_mitras": total_mitras,
        "total_requests": total_requests,
        "total_revenue": total_revenue,
        "state_metrics": [{"state": row[1], "revenue": row[2], "requests": row[3]} for row in state_metrics]
    }

@app.get("/admin/audit-logs", tags=["Admin"])
def view_audit_logs(user=Depends(require_role(["admin", "govt", "tech"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
    logs = c.fetchall()
    conn.close()
    return [{"id": l[0], "user_id": l[1], "role": l[2], "action": l[3], "ip": l[4], "time": l[5]} for l in logs]

# ===============================================================
# 3. MITRA MODULE
# ===============================================================

@app.post("/mitra/requests", tags=["Mitra"])
def create_request(req: RequestModel, request: Request, user=Depends(require_role(["mitra"]))):
    conn = get_db()
    c = conn.cursor()
    req_id = str(uuid.uuid4())
    c.execute("INSERT INTO service_requests VALUES (?, ?, ?, ?, ?, ?, ?)",
              (req_id, req.citizen_name, req.msme_id, user["user_id"], req.service_id, "in_progress", str(datetime.utcnow())))
    conn.commit()
    conn.close()
    
    update_state_analytics(user["tenant"], requests=1)
    log_audit(user["user_id"], user["role"], f"Created request {req_id}", request.client.host if request.client else "unknown")
    return {"message": "Service request created", "request_id": req_id}

@app.post("/mitra/requests/{req_id}/complete", tags=["Mitra"])
def complete_request(req_id: str, request: Request, user=Depends(require_role(["mitra"]))):
    conn = get_db()
    c = conn.cursor()
    
    c.execute("SELECT service_id, status FROM service_requests WHERE id=? AND mitra_id=?", (req_id, user["user_id"]))
    req_data = c.fetchone()
    if not req_data or req_data[1] == 'completed':
        raise HTTPException(status_code=400, detail="Invalid or already completed request")
        
    c.execute("SELECT mitra_commission, price FROM services WHERE id=?", (req_data[0],))
    service_data = c.fetchone()
    commission = service_data[0]
    price = service_data[1]
    
    # Auto-credit commission to ledger
    c.execute("INSERT INTO ledger VALUES (?, ?, ?, ?, ?, ?)",
              (str(uuid.uuid4()), user["user_id"], commission, "credit", req_id, str(datetime.utcnow())))
    
    c.execute("UPDATE service_requests SET status='completed' WHERE id=?", (req_id,))
    conn.commit()
    conn.close()
    
    update_state_analytics(user["tenant"], revenue=price)
    log_audit(user["user_id"], user["role"], f"Completed request {req_id}", request.client.host if request.client else "unknown")
    return {"message": "Request completed and commission credited", "commission_earned": commission}

@app.get("/mitra/wallet", tags=["Mitra"])
def view_wallet(user=Depends(require_role(["mitra"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT SUM(amount) FROM ledger WHERE mitra_id=? AND type='credit'", (user["user_id"],))
    credits = c.fetchone()[0] or 0
    c.execute("SELECT SUM(amount) FROM ledger WHERE mitra_id=? AND type='debit'", (user["user_id"],))
    debits = c.fetchone()[0] or 0
    conn.close()
    return {"balance": credits - debits, "total_earned": credits}

@app.post("/mitra/loans", tags=["Mitra"])
def apply_loan(loan: LoanModel, request: Request, user=Depends(require_role(["mitra"]))):
    # Trigger credit scoring function (mocked)
    credit_score = 750 if len(loan.gstin) == 15 else 600
    
    conn = get_db()
    c = conn.cursor()
    loan_id = str(uuid.uuid4())
    c.execute("INSERT INTO loan_applications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              (loan_id, loan.applicant_name, user["user_id"], loan.nbfc_partner_id, 
               loan.gstin, credit_score, loan.requested_amount, "submitted", str(datetime.utcnow())))
    conn.commit()
    conn.close()
    
    log_audit(user["user_id"], user["role"], f"Applied for loan {loan_id}", request.client.host if request.client else "unknown")
    return {"message": "Loan application submitted", "loan_id": loan_id, "calculated_score": credit_score}

@app.get("/mitra/loans", tags=["Mitra"])
def view_loan_status(user=Depends(require_role(["mitra"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM loan_applications WHERE mitra_id=?", (user["user_id"],))
    loans = c.fetchall()
    conn.close()
    return [{"id": l[0], "applicant": l[1], "amount": l[6], "status": l[7]} for l in loans]

# ===============================================================
# 4. MSME MODULE
# ===============================================================

@app.get("/msme/services", tags=["MSME"])
def msme_services(user=Depends(require_role(["msme"]))):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM services WHERE tenant=?", (user["tenant"],))
    services = c.fetchall()
    conn.close()
    return [{"id": s[0], "name": s[1], "price": s[3]} for s in services]

@app.get("/msme/credit-score", tags=["MSME"])
def msme_credit_score(user=Depends(require_role(["msme"]))):
    # Mock credit score retrieval
    return {"msme_id": user["user_id"], "credit_score": 720, "last_updated": str(datetime.utcnow())}

# ===============================================================
# 5. NBFC MODULE
# ===============================================================

@app.get("/nbfc/loans", tags=["NBFC"])
def nbfc_view_loans(user=Depends(require_role(["nbfc"]))):
    # In a real app, filter by NBFC partner ID linked to this user
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM loan_applications WHERE status='submitted'")
    loans = c.fetchall()
    conn.close()
    return [{"id": l[0], "applicant": l[1], "gstin": l[4], "score": l[5], "amount": l[6]} for l in loans]

@app.put("/nbfc/loans/{loan_id}/status", tags=["NBFC"])
def update_loan_status(loan_id: str, status: str, request: Request, user=Depends(require_role(["nbfc"]))):
    if status not in ["approved", "rejected", "disbursed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE loan_applications SET status=? WHERE id=?", (status, loan_id))
    conn.commit()
    conn.close()
    
    log_audit(user["user_id"], user["role"], f"Updated loan {loan_id} to {status}", request.client.host if request.client else "unknown")
    return {"message": f"Loan {status}"}

# ===============================================================
# 6. GOVERNMENT MODULE
# ===============================================================

@app.get("/govt/analytics", tags=["Government"])
def govt_analytics(user=Depends(require_role(["govt"]))):
    conn = get_db()
    c = conn.cursor()
    # Govt user can only see their state's analytics
    c.execute("SELECT * FROM state_analytics WHERE state=?", (user["tenant"],))
    row = c.fetchone()
    conn.close()
    if not row:
        return {"state": user["tenant"], "total_revenue": 0, "total_requests": 0}
    return {"state": row[1], "total_revenue": row[2], "total_requests": row[3], "last_updated": row[4]}

@app.get("/govt/compliance-logs", tags=["Government"])
def govt_compliance_logs(user=Depends(require_role(["govt"]))):
    conn = get_db()
    c = conn.cursor()
    # Filter logs by users in the same tenant state
    c.execute("""
        SELECT a.* FROM audit_logs a
        JOIN users u ON a.user_id = u.id
        WHERE u.tenant = ?
        ORDER BY a.timestamp DESC LIMIT 100
    """, (user["tenant"],))
    logs = c.fetchall()
    conn.close()
    return [{"id": l[0], "user_id": l[1], "action": l[3], "time": l[5]} for l in logs]

# ===============================================================
# 7. AI MODULE
# ===============================================================

@app.post("/ai/gst-analysis", tags=["AI"])
def ai_gst_analysis(query: AIQueryModel, user=Depends(require_role(["admin", "mitra", "msme"]))):
    # Mock AI response returning structured JSON
    return {
        "status": "success",
        "analysis": {
            "risk_level": "Low",
            "compliance_score": 92,
            "recommendations": ["File GSTR-3B by 20th", "Reconcile GSTR-2A mismatches"]
        }
    }

@app.post("/ai/credit-score", tags=["AI"])
def ai_credit_score(query: AIQueryModel, user=Depends(require_role(["nbfc", "admin"]))):
    # Mock AI response returning structured JSON
    return {
        "status": "success",
        "prediction": {
            "estimated_score": 745,
            "default_probability": 0.04,
            "factors": ["Consistent GST filing", "High vintage", "Low credit utilization"]
        }
    }

# ===============================================================
# ROOT
# ===============================================================

@app.get("/", tags=["System"])
def root():
    return {
        "platform": "VyaparKendra National Stakeholder-Integrated Platform",
        "status": "Operational",
        "version": "2.0.0",
        "modules": ["Auth", "Admin", "Mitra", "MSME", "NBFC", "Government", "AI"]
    }

# ===============================================================
# RUN INSTRUCTIONS
# ===============================================================
# pip install fastapi uvicorn psycopg2-binary pyjwt pydantic
# uvicorn main:app --host 0.0.0.0 --port 8000
# For Production:
# gunicorn main:app -k uvicorn.workers.UvicornWorker --workers 4 --bind 0.0.0.0:8000
