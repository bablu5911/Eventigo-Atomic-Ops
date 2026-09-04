# Atomic Ops - Backend REST API Service

High-concurrency Node.js & Express REST API for the Atomic Ops Event Booking Engine.

## Stack & Features
- **Runtime:** Node.js, Express.js
- **Database:** MongoDB / Mongoose ORM (with zero-setup In-Memory DB fallback)
- **Auth:** Dual JWT system (Access Tokens & HTTP-only Refresh Cookie)
- **Validation:** Joi schema validation
- **Documentation:** Interactive Swagger UI at `/api-docs`

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
   The backend API will run on `http://localhost:5000`.

## Separate Deployment Instructions (Render / Railway / Heroku / AWS)
1. Initialize as a standalone Git repository (if committing separately):
   ```bash
   git init
   git add .
   git commit -m "Initial backend commit"
   ```
2. Push to your backend Git repository.
3. Deploy to host (e.g. Render Web Service):
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `PORT`: `5000` (or provided by host)
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `CLIENT_URL`: URL of deployed frontend (e.g. `https://atomic-ops.vercel.app`)
     - `JWT_SECRET`: Secure secret string
     - `REFRESH_TOKEN_SECRET`: Secure secret string
