# Prompt for Cursor

You are building a minimal social-media style backend that satisfies the “Backend Engineer Assignment” brief (user graph, posting, timelines; clean TS; clear data modeling) using the exact stack below and simplified choices (no cursor pagination, no refresh tokens, unit tests only).

---

## ⚙️ Tech & Architecture

- Language: **TypeScript** (Node 18+)
- API: **REST** with **Express.js** (Router modules; versioned `/api/v1`)
- DB: **Postgres 15 (Supabase)**

  - Use **Prisma ORM**
  - Use **Supabase Storage** for media uploads (store URLs in DB)

- Auth: **JWT (access token only)** — short-lived, no refresh token
- Hosting: **AWS EC2** (Ubuntu 22.04)
- Package manager: **pnpm**
- Lint/format: **ESLint + Prettier**
- Tests: **Jest** (unit tests only)
- Security: **helmet**, **cors**, **express-rate-limit**, centralized error handler, request validation with **zod**

---

## 🧩 High-level features

### Users & Graph

- Register, login (email/handle + password)
- Follow / unfollow
- Followers & Following lists (offset pagination)

### Posts

- Create text posts with optional media
- Retrieve all posts for a user
- Retrieve a feed (own + followed posts) sorted by newest first

### Documentation

- Clear data model
- README with setup, decisions & trade-offs
- Postman collection (optional)
- Deployed and testable on EC2

---

## 🗂 Repository layout

```
/src
  /config
  /modules
    /auth
    /users
    /posts
  /controllers     // route logic layer (uses services)
  /models          // TypeScript interfaces/types and DTOs
  /lib
  /middleware
  /routes
  server.ts
/prisma
  schema.prisma
/tests             // unit tests only (Jest)
/scripts
  seed.ts
.env.example
Dockerfile
README.md

```

---

## 🧱 Prisma Data Model

```prisma
model User {
  id           String   @id @default(cuid())
  handle       String   @unique
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  posts        Post[]
  followers    Follow[] @relation("followers")
  following    Follow[] @relation("following")
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("following", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
}

model Post {
  id        String   @id @default(cuid())
  authorId  String
  text      String
  mediaUrl  String?
  createdAt DateTime @default(now())

  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

---

## 🔐 ENV variables

```
NODE_ENV=
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET=change-me
JWT_TTL=15m
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-or-service-role>
SUPABASE_BUCKET=media
CORS_ORIGIN=http://localhost:5173
```

---

## 🌐 API design (`/api/v1`)

**Auth**

- `POST /auth/register` → `{email, handle, name, password}`
- `POST /auth/login` → `{emailOrHandle, password}` → `{accessToken}`

**Users**

- `GET /users/:id`
- `POST /users/:id/follow` → follow target (auth required)
- `DELETE /users/:id/follow` → unfollow
- `GET /users/:id/followers?offset=0&limit=20`
- `GET /users/:id/following?offset=0&limit=20`

**Posts**

- `POST /posts` → `{text, mediaUrl?}` (auth required)
- `GET /posts/:id`
- `GET /users/:id/posts?offset=0&limit=20`
- `GET /feed?offset=0&limit=20`

Upload flow:

1. Client requests `POST /posts/upload-url?ext=png|jpg|mp4`
2. Uploads to Supabase
3. Calls `POST /posts` with `mediaUrl`

---

## ⚠️ Validation & Security

- **zod** validation per route (`422` on failure)
- Central error handler (`{code,message,details}`)
- Rate limiting, CORS allow-list, body size limits
- Passwords: **bcrypt(12)**
- JWT in `Authorization: Bearer <token>`; expires in ~15m
- No refresh tokens
- Sanitize file uploads, validate types and size

---

## 🔄 Pagination (simple)

Use offset + limit for all lists.
No cursor helpers or keyset pagination.

---

## 🧪 Implementation steps

1. Scaffold project and basic Express server (`/healthz`).
2. Configure Prisma + migrations.
3. Implement `auth`, `users`, `posts` modules with zod validation.
4. Integrate Supabase SDK and signed upload URLs.
5. Implement feed query: `posts WHERE authorId IN (self + following)` ORDER BY `createdAt DESC LIMIT/OFFSET`.
6. Add pino logger, error handler, rate limits.
7. Write **unit tests (Jest)** for:

   - Auth service (hash/verify/token)
   - Follow/unfollow logic
   - Post creation and feed logic (mocked DB layer)

8. Write README and (optionally) a Postman collection.
9. Deploy on EC2 via PM2 or Docker + Nginx proxy + `.env`.

---

## 🧰 Developer experience

- Add **`pino` logger** with `requestId` via `pino-http`
- Strict TypeScript (`"strict": true`)
- Pre-commit hooks:

  - `lint-staged` to run `eslint --fix`
  - `tsc --noEmit` for type safety

---

## 📦 Deliverables

- Complete **GitHub repo** with structure above
- **Running backend** on EC2 (base URL in README)
- **README** includes:

  - Local + Supabase setup, `.env` config
  - DB schema diagram (ERD or ASCII)
  - Assumptions & trade-offs (Supabase vs S3, etc.)
  - Test cases list
  - Deployment steps + security notes

- **(Optional)**: Postman collection
- **(Bonus)**: Dockerfile + simple CI pipeline (lint + test)

---
