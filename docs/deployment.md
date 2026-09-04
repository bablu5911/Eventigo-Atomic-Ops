# 🚀 Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying Atomic-Ops as two completely independent, decoupled cloud services:
1. **Backend API**: Hosted on **[Render](https://render.com)** (Node.js Express runtime with auto-healing and optional MongoDB Atlas).
2. **Frontend SPA**: Hosted on **[Vercel](https://vercel.com)** (High-performance global CDN with Vite SPA rewrites).

---

## Architecture Overview

```
 ┌──────────────────────────────────────────────────────────┐
 │                     ATOMIC OPS CLOUD                     │
 ├──────────────────────────┬───────────────────────────────┤
 │     FRONTEND ON VERCEL   │      BACKEND ON RENDER        │
 │     https://<app>.vercel │      https://<api>.onrender   │
 │     React 18 + Vite SPA  │      Node 20 + Express API    │
 └─────────────┬────────────┴───────────────▲───────────────┘
               │   VITE_API_URL (HTTPS)     │
               │   CORS Credentials Allowed │
               └────────────────────────────┘
```

---

## Part 1: Deploying the Backend on Render

The backend codebase is located in `/backend`.

### Method A: 1-Click Blueprint (Recommended)

Because this repository contains a root `render.yaml` Blueprint file, Render can configure everything automatically:

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically read `render.yaml`, detect the `atomic-ops-backend` service in `backend/`, and configure:
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/health`
6. Click **Apply**.
7. Once deployed, copy your backend URL:
   `https://atomic-ops-backend-xxxx.onrender.com`

---

### Method B: Manual Web Service Setup

If you prefer manual creation in Render:

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select your Git repository.
4. Configure the service settings:
   - **Name**: `atomic-ops-backend`
   - **Region**: Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Expand **Advanced Settings**:
   - **Health Check Path**: `/api/health`
6. Add the following **Environment Variables**:

| Variable | Recommended Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | (Render will override automatically, both work) |
| `HOST` | `0.0.0.0` | Binds to all network interfaces |
| `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (supports commas for multiples) |
| `JWT_SECRET` | `atomic_ops_jwt_secret_key_2026_super_secure_spec` | Generate a long random string |
| `JWT_REFRESH_SECRET` | `atomic_ops_refresh_token_secret_key_2026_spec` | Generate a long random string |
| `MONGO_URI` | *(Optional)* | If left empty, the engine uses the built-in zero-dependency in-memory store with auto-seeding! |

7. Click **Create Web Service**.
8. Wait ~2 minutes for the build to finish. Test your endpoint:
   `https://<your-render-backend>.onrender.com/api/health`
   Should return:
   ```json
   {"status":"UP","message":"Atomic Ops API is running smoothly"}
   ```

---

## Part 2: Deploying the Frontend on Vercel

The frontend codebase is located in `/frontend`.

### Step-by-Step Vercel Setup

1. Push your repository to **GitHub**.
2. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **Add New...** → **Project**.
4. Import your Git repository.
5. In the **Configure Project** screen:
   - **Project Name**: `atomic-ops`
   - **Framework Preset**: `Vite` (Vercel will detect this automatically)
   - **Root Directory**: Click **Edit** and select `frontend`!
6. Expand **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
7. Expand **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-render-backend>.onrender.com/api` | Point to your live Render backend! |

> [!NOTE]
> `frontend/src/services/api.js` has built-in smart URL normalization. Even if you accidentally omit `/api` at the end of `VITE_API_URL`, the frontend will automatically append `/api` to prevent 404s!

8. Click **Deploy**.
9. In under 60 seconds, Vercel will build and publish your app at:
   `https://atomic-ops-xxxx.vercel.app`

---

## Part 3: Connecting Frontend and Backend

1. Copy your live Vercel URL (e.g. `https://atomic-ops.vercel.app`).
2. Go back to your **Render Dashboard** → **atomic-ops-backend** → **Environment**.
3. Set or update:
   ```env
   CLIENT_URL=https://atomic-ops.vercel.app
   ```
4. Render will automatically redeploy the backend with the new CORS origin.

> [!TIP]
> The backend CORS handler in `backend/server.js` is already preconfigured to automatically allow **any** `*.vercel.app` domain, so your application will work immediately even before you update `CLIENT_URL`!

---

## Part 4: SPA Deep-Link Routing (`vercel.json`)

Vercel static sites by default return `404 Not Found` when a user navigates directly to or refreshes an internal page like `/superadmin`, `/admin`, or `/door-checker`.

To eliminate this, `frontend/vercel.json` is already configured:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```
This guarantees that:
- Direct visits and page refreshes on `/superadmin`, `/admin`, `/door-checker`, etc. will seamlessly resolve to the React SPA router.
- Static assets (JS, CSS, fonts) are cached aggressively for blazing-fast subsequent page loads.

---

## Part 5: Verification Checklist

Once both services are deployed:

- [ ] **Backend Health Check**: Open `https://<your-backend>.onrender.com/api/health` in your browser. Verify `200 OK` with status `UP`.
- [ ] **Swagger Documentation**: Open `https://<your-backend>.onrender.com/api-docs`. Verify all API endpoints are listed.
- [ ] **Frontend Home Page**: Open `https://<your-frontend>.vercel.app`. Verify event cards load with images and pricing.
- [ ] **1-Click Authentication**: Go to `/login` and test:
  - Super Admin: `superadmin@atomicops.com` / `Password123!` (OTP: `123456`)
  - Admin: `admin@atomicops.com` / `Password123!` (OTP: `123456`)
  - Organizer: `organizer@atomicops.com` / `Password123!`
  - Staff: `staff@atomicops.com` / `Password123!`
  - Attendee: `attendee@atomicops.com` / `Password123!`
- [ ] **Thermal Receipt & Tear**: Book a ticket as an attendee and experience the animated receipt printing with barcode.
- [ ] **Door Scanner**: Log in as staff on mobile/desktop and scan an event pass.
