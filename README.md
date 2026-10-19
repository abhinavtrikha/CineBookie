# CineBookie — Online Movie Ticket Booking System

CineBookie is a modern full-stack web application for online movie ticket booking, built in accordance with the Software Requirements Specification (SRS) for the Online Movie Ticket Booking System (OMTBS). It delivers a seamless user experience for browsing films, selecting cinema showtimes, choosing seats via an interactive layout, making sandbox payments, and viewing tickets and booking history, alongside a dedicated administrative portal.

---

## 1. Implemented Features

### Customer Features
- **User Authentication (FR-1, FR-2, FR-3, FR-4):** Account registration with password hashing (bcrypt), login credential verification, JWT token-based session management, and role-based route protection.
- **Movie Browsing & Discovery (FR-8, FR-9, FR-10):** Dynamic movie catalogue with real-time search (by title or genre), genre & language filter chips, and detailed movie view including synopsis, duration, and release dates.
- **Theatres & Show Selection (FR-18, FR-19):** View scheduled showtimes grouped by cinema location and date picker for upcoming dates.
- **Interactive Seat Selection (FR-20, FR-21, FR-22, FR-23, FR-24):** Visual seat map distinguishing available, selected, booked, and premium seats. Real-time subtotal calculation and client/server validation preventing selection of already-booked seats.
- **Booking Review & Confirmation (FR-25, FR-26, FR-27, FR-28, FR-29, FR-30):** Full pre-payment review of selected seats, cinema screen, and showtime. Generates a unique booking reference (`CBxxxxxxxx`) and persistently reserves seats.
- **Payment Processing (FR-31, FR-32, FR-33, FR-34):** Transparent sandbox payment simulation supporting Credit/Debit Card, UPI, and Net Banking. Successful payments confirm bookings; failed payments reject confirmation and immediately release the reserved seats.
- **Booking History & Ticket Details (FR-35, FR-36, FR-37, FR-38):** Personal booking history portal displaying digital tickets with unique IDs, show details, seat numbers, and booking status, with booking cancellation capability.

### Administrator Features
- **Dashboard & Analytics:** Overview of active movies, theatres, upcoming screenings, confirmed reservations, registered customers, and total revenue.
- **Movie Management (FR-5, FR-6, FR-7):** Add new titles, update details (duration, genre, language, synopsis, poster URL), and delete movies.
- **Theatre & Screen Management (FR-11, FR-12, FR-13, FR-14):** Add and manage cinema venues, configure hall screens, and maintain seat layouts.
- **Show Scheduling (FR-15, FR-16, FR-17):** Schedule screenings across theatres and screens with date, time, and conflict prevention.
- **Booking Management:** Centralized audit table of all customer bookings with search, filtering by status, detailed inspection, and administrative cancellation.

---

## 2. Technology Stack & Architecture

- **Frontend:** React 19, Vite, React Router DOM, Axios, Custom CSS Design System (CineBookie dark theme).
- **Backend:** Node.js, Express.js, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `express-validator`, `uuid`.
- **Database:** Dual-driver persistent relational database:
  - **SQLite (Default):** Zero-configuration local disk persistence using `better-sqlite3` with foreign key enforcement and Write-Ahead Logging (WAL).
  - **PostgreSQL (Optional):** Native support via `pg.Pool` when `USE_POSTGRES=true` and `DATABASE_URL` are provided.
- **Architecture:** Decoupled client-server architecture with RESTful API endpoints, server-side data validation, transactional seat concurrency controls, and JWT role-based access control.

---

## 3. Prerequisites

- **Node.js:** v18.0.0 or higher (tested on Node.js v24.15.0)
- **npm:** v9.0.0 or higher (tested on npm v11.12.1)

---

## 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example backend/.env
```

The application runs out of the box using persistent SQLite (`cinebookie.db`). Key variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=cinebookie_dev_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
USE_POSTGRES=false
DATABASE_URL=postgresql://postgres:password@localhost:5432/cinebookie
```

---

## 5. Database Setup & Seeding

From the root project directory:

```bash
# 1. Initialize database tables and constraints
npm run db:init

# 2. Populate demo movies, theatres, screens, seats, shows, and accounts
npm run db:seed
```

---

## 6. Running the Application

### Development Mode (Runs Backend & Frontend Concurrently)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Production Build & Preview
```bash
# Build frontend
npm run build

# Start production backend and preview frontend
npm start
```

---

## 7. Demonstration Accounts

After running `npm run db:seed`, the following demo accounts are available:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Administrator** | `admin@cinebookie.com` | `admin123` | Full access to Admin Dashboard, Movies, Theatres, Screens, Shows, Bookings |
| **Customer** | `customer@cinebookie.com` | `customer123` | Movie browsing, seat selection, booking, payment, booking history |

*You can also register a new customer account directly from the `/register` page.*

---

## 8. SRS Requirements Traceability Matrix

| SRS Requirement | Description | Status | Implementation Details |
|-----------------|-------------|--------|------------------------|
| **FR-1** | Customer account registration | Implemented | `POST /api/auth/register`, client validation, duplicate checks |
| **FR-2, FR-3** | Login & credential verification | Implemented | `POST /api/auth/login`, bcrypt hash comparison, JWT issuance |
| **FR-4** | Role-based access control | Implemented | `authenticate`, `requireAdmin`, `requireCustomer` middlewares |
| **FR-5** | Add movies (Admin) | Implemented | `POST /api/movies`, `AdminMovies.jsx` modal |
| **FR-6** | Update movie details (Admin) | Implemented | `PUT /api/movies/:id`, `AdminMovies.jsx` edit form |
| **FR-7** | Delete movies (Admin) | Implemented | `DELETE /api/movies/:id`, cascade delete checks |
| **FR-8** | View available movies | Implemented | `GET /api/movies`, `MoviesPage.jsx`, `HomePage.jsx` |
| **FR-9** | Search for movies | Implemented | `GET /api/movies?search=...`, title/genre filtering |
| **FR-10** | View movie details | Implemented | `GET /api/movies/:id`, `MovieDetailPage.jsx` |
| **FR-11** | Add theatre info (Admin) | Implemented | `POST /api/theatres`, `AdminTheatres.jsx` |
| **FR-12** | Update/delete theatre (Admin) | Implemented | `PUT /api/theatres/:id`, `DELETE /api/theatres/:id` |
| **FR-13** | Add & manage screens (Admin) | Implemented | `POST /api/screens`, `AdminScreens.jsx` |
| **FR-14** | Maintain seats per screen (Admin) | Implemented | `POST /api/seats/bulk`, `AdminScreens.jsx` layout view |
| **FR-15** | Create shows (Admin) | Implemented | `POST /api/shows`, `AdminShows.jsx` |
| **FR-16** | Update show details (Admin) | Implemented | `PUT /api/shows/:id`, `AdminShows.jsx` |
| **FR-17** | Delete shows (Admin) | Implemented | `DELETE /api/shows/:id`, `AdminShows.jsx` |
| **FR-18** | View available show timings | Implemented | `GET /api/shows`, date picker, `ShowsPage.jsx` |
| **FR-19** | Display shows by movie & theatre | Implemented | `GET /api/shows?movie_id=...&theatre_id=...` grouping |
| **FR-20** | Display seat layout for show | Implemented | `GET /api/seats/show/:showId`, `SeatSelectionPage.jsx` |
| **FR-21** | Display seat availability | Implemented | Dynamic calculation checking booked seats against layout |
| **FR-22** | Select available seats | Implemented | Interactive visual seat toggle with status indicators |
| **FR-23** | Prevent selection of booked seats | Implemented | Client disabling + server transactional validation (409 Conflict) |
| **FR-24** | Calculate total ticket amount | Implemented | Dynamic sum of selected seat tier pricing (standard/premium) |
| **FR-25** | Review booking before confirmation | Implemented | `BookingReviewPage.jsx` with full summary |
| **FR-26** | Confirm ticket booking | Implemented | `POST /api/bookings`, reservation creation |
| **FR-27** | Generate unique booking ID | Implemented | `CB` prefix + UUID alphanumeric 8-char reference |
| **FR-28** | Store booking details in database | Implemented | Stored in `bookings` and `booking_seats` tables |
| **FR-29** | Update availability of booked seats | Implemented | Booked seats immediately marked unavailable in show layout |
| **FR-30** | Display booking confirmation | Implemented | `BookingConfirmationPage.jsx` with digital ticket presentation |
| **FR-31** | Display total amount before payment | Implemented | Displayed on `PaymentPage.jsx` order summary |
| **FR-32** | Complete payment through supported method | Implemented | `POST /api/bookings/:id/pay`, Card, UPI, Net Banking |
| **FR-33** | Record payment status | Implemented | Stored in `payments` table and updated in `bookings` table |
| **FR-34** | Do not confirm booking if payment fails | Implemented | Fails with 402, sets status 'failed', releases booked seats |
| **FR-35** | View booking history | Implemented | `GET /api/bookings`, `BookingHistoryPage.jsx` |
| **FR-36** | View booking details | Implemented | `GET /api/bookings/:id`, `BookingDetailPage.jsx` |
| **FR-37** | Display booking ID for confirmed bookings | Implemented | Prominently rendered on digital ticket and details |
| **FR-38** | Display booking status | Implemented | Status badge (`confirmed`, `pending`, `cancelled`) |

---

## 9. Verification & Automated Test Suite

Run the automated test suite verifying all 38 Functional Requirements:

```bash
npm test
```

### Verified Scenarios:
1. Customer registration and duplicate email rejection.
2. Login credential authentication and bad password rejection.
3. Role-based access control (customer forbidden from admin endpoints).
4. Movie creation, update, retrieval, and search.
5. Theatre, screen, and bulk seat generation.
6. Show scheduling and date/theatre filtering.
7. Seat layout generation with tier pricing.
8. Concurrent booking collision prevention (409 Conflict).
9. Payment execution and booking confirmation with unique reference.
10. Payment failure simulation verifying booking rejection and seat release.
11. Customer booking history and ticket inspection.
12. Booking cancellation and subsequent seat release.

---

## 10. Known Limitations & Notes

- **Payment Gateway:** A sandbox payment simulation is implemented to demonstrate successful and failed payment flows without exposing real payment credentials or requiring external third-party merchant accounts. In a production deployment, this would be swapped with a live payment gateway provider (such as Stripe or Razorpay) using webhook verification.
- **Email Delivery:** As per SRS specifications, digital tickets and confirmations are rendered directly within the application and saved to booking history. External SMTP / transactional email services can be hooked into the confirmation event if real outbound email delivery is desired in production.
