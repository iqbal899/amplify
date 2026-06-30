# Amplify Backend

Backend API for the Amplify creator platform.

This project is built using Hono, Cloudflare Workers, PostgreSQL, and Drizzle ORM. It provides the creator-facing APIs for authentication, campaign browsing, enrollments, reel submissions, and payout history.

---

## Tech Stack

- Hono
- TypeScript
- Cloudflare Workers
- PostgreSQL
- Drizzle ORM
- JWT Authentication
- bcryptjs
- Zod

---

## Project Structure

```
src/
├── controllers/
├── db/
│   ├── client.ts
│   └── schema/
├── middleware/
├── routes/
├── services/
├── types/
├── utils/
├── validators/
└── index.ts
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file.

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_URL=postgres://...
JWT_SECRET=your-secret
```

### 3. Start PostgreSQL using Docker

The project uses Docker Compose to run a local PostgreSQL instance.

```bash
docker compose up -d
```

To verify the container is running:

```bash
docker ps
```

To stop the database:

```bash
docker compose down
```

### 4. Generate database migrations

```bash
npm run generate
```

### 5. Apply migrations

```bash
npm run migrate
```

### 6. Start the development server

```bash
npm run dev
```

## Implemented APIs

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new creator |
| POST | `/auth/login` | Login creator |
| GET | `/me` | Get logged-in creator profile |
| PATCH | `/me` | Update logged-in creator profile |

---

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/campaigns` | Browse campaigns with filters and pagination |
| GET | `/campaigns/:id` | Get campaign details |

Supported query parameters:

- status
- genre
- language
- page
- limit

---

### Enrollments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/campaigns/:id/enroll` | Enroll into a campaign |
| GET | `/me/enrollments` | Get creator enrollments |

Enrollment Rules

- Campaign must exist.
- Campaign must be open.
- Campaign must have available spots.
- Duplicate enrollments are not allowed.
- Campaign spot count is updated atomically using a database transaction.

---

### Reel Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/enrollments/:id/submission` | Submit a reel |
| GET | `/me/submissions` | Get creator submissions |

Submission Rules

- Enrollment must exist.
- Enrollment must belong to the authenticated creator.
- Only one submission is allowed per enrollment.
- New submissions are created with:
  - `verificationStatus = pending`
  - `currentViews = 0`

---

### Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me/payouts` | Get creator payout history |

---

## Authentication

Protected endpoints require a JWT access token.

```
Authorization: Bearer <jwt_token>
```

Passwords are hashed using bcrypt before being stored.

---

## Validation

Request validation is handled using Zod.

Invalid requests return appropriate validation errors before reaching the service layer.

---

## Current Architecture

The project follows a layered architecture.

```
Routes
    ↓
Middleware
    ↓
Controllers
    ↓
Services
    ↓
Database
```

Responsibilities:

- Routes define API endpoints.
- Middleware handles authentication.
- Controllers process HTTP requests and responses.
- Services contain business logic.
- Drizzle ORM handles database operations.

---

## Database & Data Access

The application uses **PostgreSQL** with **Drizzle ORM** for type-safe database access and schema management.

Current database tables:

- creators
- campaigns
- enrollments
- reel_submissions
- payouts

### Migrations

Database schema changes are managed using **Drizzle Kit** migrations.

```bash
npm run generate
npm run migrate
```

### Transactions

Database transactions are used to ensure data consistency for operations that modify multiple tables.

Current transaction implementation: POST	/campaigns/:id/enroll	

- **Post-Campaign Enrollment**
  - Creates a new enrollment.
  - Increments the campaign's `spotsFilled` count.
  - Both operations are executed atomically to prevent inconsistent data.

### SQL Joins

The backend uses SQL joins through Drizzle ORM to efficiently retrieve related data in a single database query.

Current join implementations include:

- **GET /me/enrollments**
  - Retrieves creator enrollments together with the associated campaign details.

- **GET /me/submissions**
  - Retrieves creator submissions together with their enrollment and campaign information.

- **GET /me/payouts**
  - Retrieves creator payouts together with the related submission and campaign information.

Using joins reduces the number of database queries, avoids the N+1 query problem, and provides richer API responses.

## Deferred Features

The following features are intentionally not implemented as they are outside the current project scope.

### Admin APIs

- POST `/campaigns/preview`
- POST `/campaigns`
- PATCH `/campaigns/:id`
- GET `/campaigns/:id/enrollments`
- PATCH `/enrollments/:id`
- GET `/submissions`
- PATCH `/submissions/:id`
- POST `/submissions/:id/refresh-views`
- GET `/payouts`
- POST `/payouts`
- PATCH `/payouts/:id`

### External Integrations

- Spotify metadata preview
- Instagram scraping
- Automatic payout generation
- Scheduled cron jobs

---

## Implementation Status

This repository currently implements all creator-facing APIs described in the project specification.

Admin functionality and external integrations are intentionally deferred.