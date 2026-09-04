# Atomic Ops - Frontend Web Application

Modern Vite + React 18 frontend for the Atomic Ops Event Booking Engine.

## Stack & Features
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS + Lucide Icons
- **State & Data Fetching:** `@tanstack/react-query`
- **Forms & Validation:** `react-hook-form` + `zod`
- **Notifications:** `react-hot-toast`

## Local Setup & Execution
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

## Separate Deployment Instructions (Vercel / Netlify)
1. Initialize as a standalone Git repository (if committing separately):
   ```bash
   git init
   git add .
   git commit -m "Initial frontend commit"
   ```
2. Push to your frontend Git repository.
3. Deploy to host (e.g. Vercel / Netlify):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL`: URL of deployed backend API (e.g. `https://atomic-ops-api.onrender.com/api`)
