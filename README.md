# ⚛️ Atomic Ops - Full-Stack Event Booking Engine (Monorepo)

Production-ready, highly concurrent Event Ticketing & Booking Monorepo built with Node.js, Express, MongoDB (Mongoose), React 18, Vite, React Query, and Tailwind CSS.

---

## 📁 Monorepo Directory Structure

```text
Atomic-Ops/
├── backend/
│   ├── config/             # DB connection, Cloudinary, Swagger setup
│   ├── controllers/        # Request/Response logic ONLY (Calls services)
│   ├── services/           # BUSINESS LOGIC ONLY (Atomic booking, Auth, calculations)
│   ├── models/             # 7 Mongoose schemas (User, Category, Event, TicketType, Booking, PromoCode, Review)
│   ├── validations/        # Joi schemas for request validation
│   ├── routes/             # Express routes mapped with Joi middleware
│   ├── middlewares/        # auth, authorize, validate, catchAsync, errorHandler, rateLimiter
│   ├── utils/              # ApiError, qrcode, pdfGenerator, mailer
│   ├── seed.js             # Seed script for demo data
│   └── server.js           # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # Skeletons, Spinners, Navbar, ProtectedRoute
│   │   ├── pages/          # Home, EventDetail, MyBookings, OrganizerDash, AdminDash
│   │   ├── services/       # Axios instance with auto-token refresh & React Query hooks
│   │   └── context/        # Auth state management
├── docs/
│   ├── architecture.md     # System workflow in Mermaid syntax
│   ├── er-diagram.md       # Database ER diagram in Mermaid syntax
│   ├── api-list.md         # Table of all endpoints
│   └── postman_collection.json
├── .gitignore
└── README.md
```

---

## 🔑 Key Features & Architectural Compliance

- **Strict Layered Architecture**: Controllers ONLY delegate request parameters to services and return JSON responses. Business logic, price calculations, and atomic stock decrements strictly live in `backend/services/`.
- **Dual-Token Authentication**: Short-lived JWT Access Token in responses + Refresh Token set in `httpOnly`, `sameSite`, `secure` cookies with auto-renewal interceptor on frontend.
- **Validation Middleware**: Complete request validation using Joi schemas attached via `validate()` middleware across all endpoints.
- **7 Core Mongoose Schemas**: `User` (password `select: false`), `Category`, `Event`, `TicketType`, `Booking`, `PromoCode`, and `Review`.
- **Interactive OpenAPI Documentation**: Swagger UI integrated at `http://localhost:5000/api-docs` with `bearerAuth` & `cookieAuth` schemes.
- **Frontend Stack**: React 18, Vite, React Router v6, Axios, Tailwind CSS, `@tanstack/react-query`, `react-hook-form`, `zod`, `lucide-react`, `react-hot-toast`.
- **3 Explicit UI/UX States**: Loading (Skeletons/Spinners), Error (Toasts/Banners), and Empty States across every view.

---

## ⚡ Quick Start & Setup Guide

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Server running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 1. Environment Configuration (`backend/.env`)
Create a `.env` file inside `backend/`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/atomic-ops
JWT_SECRET=atomic_ops_jwt_secret_key_2026_super_secure_spec
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=atomic_ops_refresh_token_secret_key_2026_spec
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 2. Backend Setup & Seeding
```bash
cd backend
npm install
npm run seed
npm run dev
```
*Backend server will start at `http://localhost:5000` with Swagger docs at `http://localhost:5000/api-docs`.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend app will start at `http://localhost:5173`.*

---

## 🔐 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@atomicops.com` | `Password123!` | Platform metrics, category management, event approvals |
| **Organizer** | `organizer@atomicops.com` | `Password123!` | Create/host events, ticket tier releases, door QR scanner |
| **Attendee** | `attendee@atomicops.com` | `Password123!` | Book events, apply promo codes, download PDF tickets, write reviews |

*One-click quick login buttons are also built directly into the `/login` page.*

---

## 📚 Documentation Links

- [System Architecture & Sequences (`docs/architecture.md`)](docs/architecture.md)
- [Database ER Diagram (`docs/er-diagram.md`)](docs/er-diagram.md)
- [API Endpoints Directory (`docs/api-list.md`)](docs/api-list.md)
- [Postman Collection (`docs/postman_collection.json`)](docs/postman_collection.json)
