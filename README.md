# VyaparKendra - National Stakeholder-Integrated Platform

This project contains the complete source code for the VyaparKendra platform, including the React frontend and the production-ready FastAPI backend.

## Project Structure

- `main.py`: The production-grade FastAPI backend (PostgreSQL, RBAC, JWT, Multi-tenant).
- `src/App.tsx`: The React frontend (Tailwind CSS, Framer Motion, Lucide Icons).
- `server.ts`: A lightweight Node.js/Express mock server used exclusively for the AI Studio live preview environment.

## How to Deploy (Production Integration)

To integrate the React frontend with the FastAPI backend in your own environment, follow these steps:

### 1. Start the FastAPI Backend

Ensure you have Python 3.9+ installed.

```bash
# Install dependencies
pip install fastapi uvicorn psycopg2-binary pyjwt pydantic

# Set environment variables (optional but recommended)
export SECRET_KEY="your_super_secret_key"
export DATABASE_URL="postgresql://user:password@localhost/vyaparkendra" # Uses SQLite if omitted

# Run the backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend will now be running at `http://localhost:8000`.

### 2. Update the Frontend API Base URL

In your React frontend, update the API calls to point to the FastAPI backend.
Currently, the frontend uses relative paths (e.g., `/api/login`). You can either:

1. Set up a reverse proxy (like Nginx) to route `/api` to `localhost:8000`.
2. Or, update your Vite config (`vite.config.ts`) to proxy requests to the FastAPI server:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // Removes /api prefix before sending to FastAPI
      },
    },
  },
});
```

### 3. Build and Deploy the Frontend

```bash
# Install Node dependencies
npm install

# Build the React app
npm run build
```

Deploy the `dist/` folder to your preferred static hosting service (Vercel, Netlify, AWS S3, etc.).

## Features Included

- **Multi-Stakeholder RBAC**: Admin, Mitra, MSME, NBFC, Govt, and Tech roles.
- **Internal Ledger**: RBI-aligned accounting for Mitra commissions.
- **Audit Logging**: Government-compliant action tracking.
- **AI Integration**: Gemini-powered business assistant and credit scoring.
- **Multi-Tenant**: State-level data filtering and analytics.
