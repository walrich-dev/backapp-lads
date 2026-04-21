# LADS Backend API

Backend REST API for the **LADS Mobile** Expo app, built with Node.js, Express, TypeScript, and PostgreSQL via Prisma ORM.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15+ |
| Auth | JWT (access + refresh tokens) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Dev server | tsx watch |

---

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ running locally (or Docker)

### Quick PostgreSQL with Docker

```bash
docker run --name lads-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lads_db -p 5432:5432 -d postgres:15
```

---

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy .env and fill in values
copy .env.example .env

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations (creates tables)
npm run db:migrate

# 5. Seed with mock data
npm run db:seed

# 6. Start dev server (hot reload)
npm run dev
```

Server will be available at **http://localhost:3000**

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_EXPIRES_IN` | Access token expiry (e.g. `7d`) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `30d`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins |

---

## API Reference

### Health
```
GET /health
```

### Auth
```
POST /api/auth/register          Register new user
POST /api/auth/login             Login
POST /api/auth/refresh           Refresh access token
POST /api/auth/logout            Logout (invalidate refresh token)
POST /api/auth/forgot-password   Request password reset
POST /api/auth/reset-password    Reset password with token
GET  /api/auth/me                Get current user (🔒)
```

### Users
```
GET   /api/users/:id             Get user by ID (🔒)
PATCH /api/users/me              Update profile (🔒)
PATCH /api/users/me/password     Change password (🔒)
```

### Professionals
```
GET   /api/professionals                 List professionals (filter, search, pagination)
GET   /api/professionals/:id            Get single professional
POST  /api/professionals                Become a professional (🔒)
PATCH /api/professionals/:id           Update profile (🔒 owner/admin)
```

### Events
```
GET   /api/events                       List events
GET   /api/events/:id                  Get single event
POST  /api/events                       Create event (🔒 coordinator/admin)
PATCH /api/events/:id                  Update event (🔒 coordinator/admin)
DELETE /api/events/:id                 Delete event (🔒 admin)
```

### Forum
```
GET   /api/forum/posts                  List posts (tag, eventId, pinned, search, pagination)
GET   /api/forum/posts/:id             Get post with comments
POST  /api/forum/posts                  Create post (🔒)
DELETE /api/forum/posts/:id            Delete post (🔒 author/admin)
POST  /api/forum/posts/:id/like        Toggle like (🔒)
GET   /api/forum/posts/:id/comments    List comments
POST  /api/forum/posts/:id/comments    Add comment (🔒)
DELETE /api/forum/comments/:id         Delete comment (🔒 author/admin)
```

### Services
```
GET   /api/services/categories          List categories
GET   /api/services                     List services (categoryId, pagination)
GET   /api/services/:id                Get single service
GET   /api/services/requests            My requests (🔒)
POST  /api/services/requests            Create request (🔒)
PATCH /api/services/requests/:id       Update status (🔒)
```

---

## Test Accounts (after seed)

All passwords: `senha123`

| Email | Role |
|---|---|
| admin@lads.com | ADMIN |
| carlos@lads.com | COORDINATOR |
| fernanda@lads.com | PROFESSIONAL |
| lucas@lads.com | PROFESSIONAL |
| maria@lads.com | MEMBER |

---

## Useful Commands

```bash
npm run dev           # Dev server with hot reload
npm run build         # Compile TypeScript to dist/
npm run start         # Run compiled dist/
npm run db:studio     # Open Prisma Studio (DB GUI)
npm run db:reset      # Reset DB + re-seed
npm run db:migrate    # Run pending migrations
```
