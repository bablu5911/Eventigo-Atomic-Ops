# Atomic Ops API Endpoint Directory

Complete mapping of all REST API endpoints, HTTP methods, access roles, descriptions, and request payload schemas.

| Category | Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `/api/health` | `GET` | Public | System uptime & health status check |
| **Swagger** | `/api-docs` | `GET` | Public | Interactive OpenAPI Swagger UI documentation |
| **Auth** | `/api/auth/register` | `POST` | Public | Register new user (`attendee` or `organizer`) |
| **Auth** | `/api/auth/login` | `POST` | Public | Authenticate user & issue dual tokens (JWT + Cookie) |
| **Auth** | `/api/auth/refresh` | `POST` | Public | Exchange `refreshToken` cookie for new access token |
| **Auth** | `/api/auth/me` | `GET` | Private | Retrieve logged-in user profile |
| **Auth** | `/api/auth/update-profile`| `PUT` | Private | Update user name or email address |
| **Auth** | `/api/auth/update-password`| `PUT` | Private | Change password with current password verification |
| **Auth** | `/api/auth/forgot-password`| `POST` | Public | Request password reset token |
| **Auth** | `/api/auth/reset-password` | `POST` | Public | Reset password using reset token |
| **Auth** | `/api/auth/logout` | `POST` | Private | Clear `refreshToken` httpOnly cookie |
| **Categories**| `/api/categories` | `GET` | Public | List all event categories |
| **Categories**| `/api/categories` | `POST` | Admin | Create a new category |
| **Categories**| `/api/categories/:id` | `PUT` | Admin | Update an existing category |
| **Categories**| `/api/categories/:id` | `DELETE`| Admin | Delete a category |
| **Events** | `/api/events` | `GET` | Public | List published events with search, city, & category filters |
| **Events** | `/api/events/organizer/me`| `GET` | Organizer, Admin | List events hosted by logged-in organizer |
| **Events** | `/api/events/:slugOrId` | `GET` | Public | Get single event details and available ticket types |
| **Events** | `/api/events` | `POST` | Organizer, Admin | Create a new event draft |
| **Events** | `/api/events/:id` | `PUT` | Organizer, Admin | Update event details |
| **Events** | `/api/events/:id` | `DELETE`| Organizer, Admin | Delete an event and associated ticket types |
| **Events** | `/api/events/:id/approval`| `PATCH` | Admin | Toggle event approval status |
| **Ticket Types**| `/api/events/:eventId/ticket-types` | `GET` | Public | List ticket tiers for a specific event |
| **Ticket Types**| `/api/ticket-types` | `POST` | Organizer, Admin | Add new ticket tier to an event |
| **Ticket Types**| `/api/ticket-types/:id` | `PUT` | Organizer, Admin | Update ticket tier price/quantity |
| **Ticket Types**| `/api/ticket-types/:id` | `DELETE`| Organizer, Admin | Delete a ticket tier |
| **Bookings** | `/api/bookings` | `POST` | Private | Create atomic booking with promo code & stock decrement |
| **Bookings** | `/api/bookings/my` | `GET` | Private | List all bookings created by logged-in user |
| **Bookings** | `/api/bookings/:id` | `GET` | Private | Retrieve single booking details & QR pass URL |
| **Bookings** | `/api/bookings/:id/pdf` | `GET` | Private | Stream/download official PDF ticket pass |
| **Bookings** | `/api/bookings/:id/cancel`| `POST` | Private | Cancel booking and restore ticket inventory |
| **Bookings** | `/api/bookings/verify-checkin`| `POST` | Organizer, Admin | Validate QR code booking code at door |
| **Promo Codes**| `/api/promo-codes` | `POST` | Organizer, Admin | Create promo code for an event |
| **Promo Codes**| `/api/promo-codes/validate`| `POST` | Public | Validate promo code applicability & discount |
| **Promo Codes**| `/api/events/:eventId/promo-codes`| `GET` | Organizer, Admin | List all promo codes for an event |
| **Promo Codes**| `/api/promo-codes/:id` | `DELETE`| Organizer, Admin | Delete a promo code |
| **Reviews** | `/api/reviews` | `POST` | Private | Submit attendee review for a booking |
| **Reviews** | `/api/events/:eventId/reviews`| `GET` | Public | List reviews & average rating for an event |
| **Reviews** | `/api/reviews/:id` | `DELETE`| Private | Delete a review |
| **Dashboard** | `/api/dashboard/organizer`| `GET` | Organizer, Admin | Get organizer studio revenue & attendee metrics |
| **Dashboard** | `/api/dashboard/admin` | `GET` | Admin | Get platform-wide user, revenue, & event metrics |
