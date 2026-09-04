# Atomic Ops System Architecture & Sequence Workflows

This document outlines the architectural blueprints, layer boundaries, and end-to-end event sequence workflows for the Atomic Ops Event Booking Engine.

---

## 1. System Overview & Layer Architecture

```mermaid
graph TD
    Client[React 18 SPA + Vite] -->|HTTPS Requests + Bearer Token| API[Express.js Server]
    Client -->|HttpOnly Refresh Cookie| API
    
    subgraph Express Backend
        API --> RateLimiter[express-rate-limit Middleware]
        RateLimiter --> Helmet[Helmet Security & CORS]
        Helmet --> Validator[Joi Schema Validation Middleware]
        Validator --> AuthMiddleware[Auth & Role Authorization]
        
        subgraph Layered Architecture
            AuthMiddleware --> Controllers[Controllers Layer - Req/Res Handlers]
            Controllers --> Services[Services Layer - Business & Transaction Logic]
            Services --> Models[Mongoose Schema Models]
        end
        
        Services --> Utils[Utils - PDFKit, QRCode, Mailer, ApiError]
    end
    
    Models --> MongoDB[(MongoDB Instance / Replica Set)]
```

---

## 2. Dual-Token Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React SPA (Axios)
    participant API as Express API Server
    participant AuthServ as AuthService
    participant DB as MongoDB

    User->>Frontend: Submit Login Credentials
    Frontend->>API: POST /api/auth/login
    API->>AuthServ: login(email, password)
    AuthServ->>DB: User.findOne({ email }).select('+password')
    DB-->>AuthServ: User Document
    AuthServ->>AuthServ: Verify bcrypt matchPassword()
    AuthServ->>AuthServ: Generate Access Token (15m) & Refresh Token (7d)
    AuthServ-->>API: { user, accessToken, refreshToken }
    API-->>Frontend: Set HttpOnly Cookie (refreshToken) + Return JSON { token: accessToken, user }
    
    Note over Frontend, API: Access Token expires after 15 mins...
    
    Frontend->>API: GET /api/bookings/my (with expired Bearer token)
    API-->>Frontend: 401 Unauthorized
    Frontend->>API: POST /api/auth/refresh (auto cookie attach)
    API->>AuthServ: refreshToken(cookieToken)
    AuthServ-->>API: { accessToken: newAccessToken }
    API-->>Frontend: { success: true, token: newAccessToken }
    Frontend->>API: Retry original GET /api/bookings/my
    API-->>Frontend: 200 OK (Bookings List)
```

---

## 3. High-Concurrency Atomic Booking Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Frontend as React UI
    participant Route as Express Router & Joi Middleware
    participant Controller as BookingController
    participant Service as BookingService
    participant DB as MongoDB Transaction

    Attendee->>Frontend: Select Ticket Quantity & Apply Promo Code
    Frontend->>Route: POST /api/bookings { eventId, tickets, promoCode }
    Route->>Route: Validate Joi schema in request body
    Route->>Controller: createBooking(req, res)
    Controller->>Service: createBooking(userId, bookingData)
    
    Service->>DB: startSession() & startTransaction()
    loop For each Ticket Type
        Service->>DB: TicketType.findOne({ _id, event }).session(session)
        Note over Service, DB: Check available inventory (totalQuantity - soldQuantity)
        Service->>DB: TicketType.updateOne({ soldQuantity += qty }).session(session)
    end
    
    opt Promo Code Provided
        Service->>DB: PromoCode.findOne({ code, event }).session(session)
        Service->>Service: Calculate percentage/flat discount
        Service->>DB: PromoCode.updateOne({ usedCount += 1 }).session(session)
    end
    
    Service->>DB: Booking.create([newBooking]), { session }
    Service->>DB: commitTransaction() & endSession()
    
    Service->>Service: Generate QR Code Payload & PDF Stream
    Service-->>Controller: { booking, qrCodeUrl }
    Controller-->>Frontend: 201 Created JSON
    Frontend->>Attendee: Display Interactive Ticket Pass & QR Modal
```

---

## 4. Door Check-In Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Organizer
    participant Scanner as Door QR Scanner Modal
    participant API as Booking Controller
    participant Service as BookingService
    participant DB as MongoDB

    Organizer->>Scanner: Scan Attendee's QR Code Ticket
    Scanner->>API: POST /api/bookings/verify-checkin { bookingCode }
    API->>Service: verifyCheckIn(bookingCode, organizerId)
    Service->>DB: Booking.findOne({ bookingCode }).populate('event')
    
    alt Unauthorized Organizer
        Service-->>API: Throw ApiError(403, "Not authorized to check in for this event")
        API-->>Scanner: 403 Forbidden
    else Already Checked In
        Service-->>API: Throw ApiError(400, "Attendee already checked in at HH:MM")
        API-->>Scanner: 400 Bad Request
    else Valid First-Time Check-In
        Service->>DB: Booking.updateOne({ attendedAt: new Date() })
        Service-->>API: Updated Booking Document
        API-->>Scanner: 200 OK (Verification Success Toast)
    end
```
