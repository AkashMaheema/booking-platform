# EN2H Booking Platform API

A production-ready REST API built with NestJS, Prisma ORM, PostgreSQL, JWT Authentication, and Docker as part of the EN2H Software Engineer Intern Technical Assignment.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Business Rules](#business-rules)
- [Performance Optimization](#performance-optimization)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Author](#author)

---

## Project Overview

The EN2H Booking Platform is a backend service designed to manage service bookings efficiently. It empowers administrators and staff to define and manage offered services while allowing customers to seamlessly book appointments.

The architecture leverages **NestJS** for robust modularity, **Prisma ORM** for type-safe database interactions, and **PostgreSQL** as the relational data store. Security is enforced via stateless **JWT Authentication**, role-based access logic, and rate limiting. The entire application is containerized with **Docker** for predictable deployments.

---

## Features

### Authentication

- User Registration
- User Login (with generic error messages to prevent enumeration)
- JWT Authentication (Access & Refresh Tokens with Rotation)
- User Logout

### Service Management

- Create Service
- Update Service
- Delete Service (prevented if bookings exist)
- Get All Services (paginated)
- Get Service by ID

### Booking Management

- Create Booking (with duplicate prevention checks)
- Get All Bookings (paginated with filtering)
- Get Booking by ID
- Update Booking Status
- Cancel Booking

### Additional Features

- Cursor and Offset Pagination
- Full-Text Search (case-insensitive)
- Database-level Filtering and Sorting
- Payload Validation (`class-validator`)
- Swagger API Documentation
- Docker Containerization
- E2E Testing with Jest
- Idempotent Seed Data Generation
- Global Logging via Winston
- Performance Monitoring Interceptors

---

## Technology Stack

| Technology | Purpose              |
| ---------- | -------------------- |
| NestJS     | Backend Framework    |
| TypeScript | Programming Language |
| Prisma ORM | Database ORM         |
| PostgreSQL | Database             |
| JWT        | Authentication       |
| Swagger    | API Documentation    |
| Docker     | Containerization     |
| Jest       | Testing Framework    |
| Winston    | Global Logging       |

---

## Project Structure

```text
booking-platform/
├── src/
│   ├── modules/
│   │   ├── auth/          # Registration, login, JWT issuance
│   │   ├── users/         # User repository and data access
│   │   ├── services/      # Service catalogue logic
│   │   ├── bookings/      # Booking generation and state
│   │   └── health/        # Liveness/Readiness probes
│   ├── common/
│   │   ├── filters/       # Global exception handling
│   │   ├── interceptors/  # Transform & performance interceptors
│   │   └── middleware/    # Request ID and context tracing
│   └── database/          # Prisma singleton service
├── prisma/
│   ├── data/              # Seed data payloads
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Idempotent seeding script
└── test/
    ├── e2e/               # End-to-end tests for all modules
    └── setup/             # Jest global setup and teardown
```

---

## Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd booking-platform
```

**2. Install dependencies**

```bash
npm install
```

---

## Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

**Example `.env`:**

```env
# HTTP Port
PORT=3000

# Environment Mode (development, production, test)
NODE_ENV=development

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/booking_platform

# JWT Secrets (Must be min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-super-secret-refresh-key-must-be-at-least-32-chars
REFRESH_EXPIRES_IN=7d

# CORS Allowed Origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting Configurations
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Database Setup

**1. Run database migrations**

```bash
npx prisma migrate dev
```

**2. Generate Prisma Client**

```bash
npx prisma generate
```

**3. Seed database (Optional)**

```bash
npm run seed
```

_Note: To completely wipe the DB and re-seed, run `npm run seed:reset`._

**Default Admin Credentials (created by seed):**

- Email: `admin@en2h.com`
- Password: `Admin@123`

---

## Running the Application

**Development**

```bash
npm run start:dev
```

**Production**

```bash
npm run build
npm run start:prod
```

**Docker (Full Stack)**

```bash
# Starts both the PostgreSQL database and the API
docker compose up --build -d

# View logs
docker compose logs -f api

# Tear down
docker compose down -v
```

_Note: Migrations run automatically when the Docker container starts._

---

## Running Tests

**Unit Tests**

```bash
npm run test
```

**Coverage Report**

```bash
npm run test:cov
```

_Generates a comprehensive HTML coverage report in the `coverage/` directory._

**End-to-End Tests**

```bash
# E2E tests run against an isolated test database defined in .env.test
npm run test:e2e
```

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/docs
```

**Using Swagger with JWT:**

1. Call the `POST /api/v1/auth/login` endpoint.
2. Copy the `accessToken` from the response payload.
3. Click the **Authorize** button at the top of the Swagger UI.
4. Enter your token (no `Bearer ` prefix required, Swagger handles it).
5. All protected endpoints are now fully accessible.

---

## API Endpoints

**Authentication**

- `POST /api/v1/auth/register` — Create user
- `POST /api/v1/auth/login` — Login user
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Revoke token

**Services**

- `POST /api/v1/services` — Create service (Admin, Staff)
- `GET /api/v1/services` — List all services
- `GET /api/v1/services/:id` — Get service details
- `PATCH /api/v1/services/:id` — Update service (Admin, Staff)
- `DELETE /api/v1/services/:id` — Delete service (Admin only)

**Bookings**

- `POST /api/v1/bookings` — Create booking
- `GET /api/v1/bookings` — List all bookings (Admin, Staff)
- `GET /api/v1/bookings/:id` — Get booking details (Admin, Staff)
- `PATCH /api/v1/bookings/:id/status` — Update booking status (Admin, Staff)

**Health**

- `GET /health` — Application health check

---

## Business Rules

- **Service Requirement**: A booking must reference an active, existing service.
- **Date Validation**: Booking dates cannot be in the past.
- **Duplicate Prevention**: A customer cannot book the exact same service, at the exact same date, at the exact same time more than once.
- **State Logic**: Cancelled bookings cannot be transitioned to a `COMPLETED` state.
- **Service Integrity**: Services that possess historical bookings cannot be deleted (they must be made inactive instead).
- **Authentication Bypass**: Customers can seamlessly create bookings without needing a registered account. Staff/Admins require an account to view and manage these bookings.

---

## Performance Optimization

The application has been explicitly optimized for performance and scalability:

- **N+1 Prevention**: Prisma's `include` selectively queries relationships.
- **Pagination**: Implemented entirely database-side using Prisma `skip` and `take`.
- **Indexing**: Optimized PostgreSQL indexes on fields like `email`, `title`, and a composite unique index on `(serviceId, bookingDate, bookingTime)`.
- **Interceptors**: Global `PerformanceInterceptor` tracking requests exceeding `500ms`.
- **Compression**: Automatic HTTP response compression via `compression`.
- **Load Testing Recommendations**: Evaluated for `k6` and `Artillery` simulation targeting login throughput and composite-constraint race conditions.

---

## Assumptions

- **Role Management**: A simplistic, hard-coded role hierarchy (`ADMIN`, `STAFF`) is sufficient for the scope of the assignment.
- **Timezones**: Booking dates and times are stored in UTC format. It is the client/frontend's responsibility to format these into local time zones.
- **Guest Bookings**: Customer tracking relies strictly on their provided `customerEmail` and `customerPhone` during checkout. No persistent customer table mapping is required.
- **Container Strategy**: The primary usage pattern implies running the DB natively for development, but in Docker for staging/production (thus `localhost` vs `postgres` alias).

---

## Future Improvements

- **Role-Based Access Control (RBAC)**: Expand to dynamically driven permissions mapping.
- **Email/SMS Notifications**: Integrate Twilio or SendGrid to fire webhooks on `BookingStatus` changes.
- **Redis Caching**: Implement in-memory caching for `GET /api/v1/services` to dramatically improve read throughput.
- **Calendar Synchronization**: Export standard `.ics` payloads or integrate with Google Calendar APIs.
- **Payment Gateway**: Integrate Stripe for upfront booking deposits.

---

## License

MIT License

---

## Author

- **Akash Maheema**
- GitHub: [Akashmaheema](https://github.com/akashmaheema)
