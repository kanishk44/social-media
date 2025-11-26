# Social Media Backend

A production-ready social media backend with user graph, posting, and timelines built with TypeScript, Express, Prisma, and PostgreSQL.

## 🚀 Features

### Core Functionality

- **User Authentication**: JWT-based registration and login
- **Social Graph**: Follow/unfollow users, view followers and following lists with pagination
- **Posts**: Create text posts with optional media uploads
- **Media Storage**: Integrated with Supabase Storage for images and videos
- **Personalized Feed**: View posts from yourself and followed users, sorted by newest first
- **Security**: Rate limiting, CORS, helmet, password hashing, request validation

### Technical Features

- Clean modular architecture
- Comprehensive error handling
- Request validation with Zod
- Unit tests with Jest
- Logging with Pino
- TypeScript strict mode
- Docker support
- CI/CD with GitHub Actions

## 📋 Tech Stack

| Category            | Technology                       |
| ------------------- | -------------------------------- |
| **Language**        | TypeScript (Node.js 18+)         |
| **Framework**       | Express.js                       |
| **Database**        | PostgreSQL 15 (Supabase)         |
| **ORM**             | Prisma                           |
| **Authentication**  | JWT (access token, 15min expiry) |
| **Storage**         | Supabase Storage                 |
| **Validation**      | Zod                              |
| **Testing**         | Jest                             |
| **Logging**         | Pino                             |
| **Security**        | Helmet, CORS, Express Rate Limit |
| **Package Manager** | pnpm                             |

## 📐 Database Schema

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │     Follow      │         │      Post       │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄───────┤ followerId (FK) │         │ id (PK)         │
│ handle (unique) │         │ followingId(FK) │────────►│ authorId (FK)   │
│ email (unique)  │         │ createdAt       │         │ text            │
│ passwordHash    │         └─────────────────┘         │ mediaUrl        │
│ name            │                                      │ createdAt       │
│ createdAt       │◄─────────────────────────────────────┤                │
└─────────────────┘                                      └─────────────────┘
```

### Key Design Decisions

1. **JWT Access Tokens Only**: Short-lived tokens (15min) for simplicity. Production would add refresh tokens.

2. **Offset Pagination**: Simple offset/limit pagination for all list endpoints. Trade-off: less efficient for very large datasets vs. cursor-based pagination.

3. **Supabase for Everything**: Using Supabase for both PostgreSQL database and file storage for unified cloud infrastructure.

4. **Self-Referential Follow Model**: Many-to-many relationship with composite unique constraint preventing duplicate follows.

5. **Feed Algorithm**: Simple chronological feed from user + following. Scalable implementation would use pre-computed feeds or caching.

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18 or higher
- pnpm (`npm install -g pnpm`)
- Supabase account (free tier works)

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd social-media-backend

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=4000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_TTL=15m

# Supabase Storage (for media uploads)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=media

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Supabase Setup

#### Get Database Connection String:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project → Settings → Database
3. Copy the **Session pooler** connection string (IPv4 compatible)
4. Add `?pgbouncer=true&connection_limit=1` to the URL

#### Setup Storage:

1. In Supabase Dashboard → Storage
2. Create a new bucket named `media`
3. Set it to **public**

#### Get API Keys:

1. Go to Settings → API
2. Copy **Project URL** → use as `SUPABASE_URL`
3. Copy **service_role key** → use as `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important**: Use service_role (not anon) for signed upload URLs

### 4. Database Migration

Since Supabase's session pooler doesn't support direct migrations, use the SQL Editor:

```bash
# Generate Prisma Client
pnpm prisma generate
```

Then run the migration SQL manually:

1. Open `prisma/migrations/00_initial_schema.sql`
2. Copy the entire SQL content
3. In Supabase Dashboard → SQL Editor → New Query
4. Paste and execute the SQL

Verify tables were created: Database → Tables

### 5. Seed Database (Optional)

```bash
pnpm prisma:seed
```

This creates test users:

- **Alice**: `alice@example.com` / `alice` / `password123`
- **Bob**: `bob@example.com` / `bob` / `password123`
- **Charlie**: `charlie@example.com` / `charlie` / `password123`

### 6. Start Development Server

```bash
pnpm dev
```

Server will start at `http://localhost:4000`

Test health check:

```bash
curl http://localhost:4000/healthz
```

## 📡 API Documentation

### Base URL

```
http://localhost:4000/api/v1
```

### Authentication

Most endpoints require JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| POST   | `/auth/register` | Register new user | No            |
| POST   | `/auth/login`    | Login user        | No            |

#### Users

| Method | Endpoint               | Description                | Auth Required |
| ------ | ---------------------- | -------------------------- | ------------- |
| GET    | `/users/:id`           | Get user profile           | No            |
| POST   | `/users/:id/follow`    | Follow a user              | Yes           |
| DELETE | `/users/:id/follow`    | Unfollow a user            | Yes           |
| GET    | `/users/:id/followers` | Get user's followers       | No            |
| GET    | `/users/:id/following` | Get users followed by user | No            |

#### Posts

| Method | Endpoint                    | Description           | Auth Required |
| ------ | --------------------------- | --------------------- | ------------- |
| POST   | `/posts`                    | Create a new post     | Yes           |
| GET    | `/posts/:id`                | Get a single post     | No            |
| GET    | `/users/:id/posts`          | Get posts by user     | No            |
| GET    | `/feed`                     | Get personalized feed | Yes           |
| GET    | `/posts/upload-url?ext=jpg` | Get signed upload URL | Yes           |

### Request Examples

#### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "handle": "username",
  "name": "User Name",
  "password": "password123"
}
```

#### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "emailOrHandle": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc..."
  }
}
```

#### Create Post

```bash
POST /api/v1/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Hello world!",
  "mediaUrl": "https://..." // optional
}
```

#### Media Upload Flow

1. Get signed URL:
   ```
   GET /api/v1/posts/upload-url?ext=jpg
   ```
2. Upload file to `uploadUrl` using PUT request
3. Use returned `mediaUrl` when creating post

### Response Format

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 100
  }
}
```

**Error:**

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": { ... }
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test -- --coverage
```

### Test Coverage

- Auth Service: Password hashing, JWT generation, register/login flows
- Users Service: Follow/unfollow logic, followers/following lists
- Posts Service: Post creation, retrieval, feed generation

## 🔒 Security

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 15-minute expiration, signed with secret
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Request Validation**: Zod schemas on all endpoints
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **Body Limits**: 10MB max request size
- **SQL Injection**: Protected via Prisma ORM

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t social-media-backend .

# Run container
docker run -p 4000:4000 --env-file .env social-media-backend

# Or use Docker Compose
docker-compose up
```

### AWS EC2

```bash
# Use the deployment script
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh ubuntu@your-ec2-ip

# Or manually:
# 1. Install Node.js 18+ and pnpm on EC2
# 2. Clone repository
# 3. Install dependencies: pnpm install
# 4. Build: pnpm build
# 5. Run migrations via Supabase SQL Editor
# 6. Start with PM2: pm2 start dist/server.js
```

### Environment Variables for Production

Update `.env` for production:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=<production-supabase-url>
JWT_SECRET=<strong-random-secret>
SUPABASE_URL=<production-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<production-key>
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📝 Available Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Start development server with hot reload |
| `pnpm build`           | Build for production                     |
| `pnpm start`           | Start production server                  |
| `pnpm test`            | Run tests                                |
| `pnpm lint`            | Run ESLint                               |
| `pnpm format`          | Format code with Prettier                |
| `pnpm prisma:generate` | Generate Prisma Client                   |
| `pnpm prisma:studio`   | Open Prisma Studio                       |
| `pnpm prisma:seed`     | Seed database with test data             |
| `pnpm typecheck`       | Run TypeScript type checking             |

## 📂 Project Structure

```
social-media-backend/
├── src/
│   ├── config/              # Configuration (env, logger, database)
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   └── posts/          # Posts and feed
│   ├── middleware/          # Express middleware
│   ├── models/              # TypeScript types
│   ├── lib/                 # Utilities
│   ├── routes/              # Route aggregator
│   └── server.ts            # Express app
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # SQL migrations
├── tests/                   # Unit tests
├── scripts/                 # Deployment scripts
├── .github/workflows/       # CI/CD
├── postman_collection.json  # API testing
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🧩 Architecture Highlights

### Clean Modular Design

- Each feature module (auth, users, posts) contains:
  - Service layer (business logic)
  - Controller layer (request handling)
  - Routes (endpoint definitions)
  - Validation schemas (Zod)

### Error Handling

- Centralized error handler
- Custom `HttpError` class
- Consistent error responses
- Detailed logging

### Middleware Stack

- Request logging with unique IDs
- JWT authentication
- Zod validation
- Rate limiting
- CORS & security headers

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure you're using the **session pooler** URL with `?pgbouncer=true`
- For migrations, use Supabase SQL Editor (direct connection needs IPv6)

### bcrypt Module Errors

```bash
cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm run install
```

### Port Already in Use

Change `PORT` in `.env` to an available port (e.g., 4000, 5000)

### Supabase Upload Errors

- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Verify bucket name matches `SUPABASE_BUCKET` in `.env`
- Ensure bucket is set to public in Supabase Dashboard

## 📊 API Testing

Import `postman_collection.json` into Postman for pre-configured requests with examples.

**Quick Test:**

```bash
# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrHandle":"alice@example.com","password":"password123"}'

# Use returned token for authenticated requests
```

## 🎯 Assignment Requirements Checklist

- ✅ TypeScript with strict mode
- ✅ Express.js REST API with versioning (`/api/v1`)
- ✅ PostgreSQL 15 with Prisma ORM
- ✅ Supabase for database and storage
- ✅ JWT authentication (access token only)
- ✅ User registration and login
- ✅ Follow/unfollow functionality
- ✅ Followers and following lists with pagination
- ✅ Create posts with optional media
- ✅ Retrieve user posts
- ✅ Personalized feed
- ✅ Security (helmet, CORS, rate limiting, Zod validation)
- ✅ Unit tests with Jest
- ✅ ESLint + Prettier
- ✅ pnpm package manager
- ✅ Clean architecture and data modeling
- ✅ Comprehensive documentation
- ✅ Postman collection
- ✅ Docker support
- ✅ CI/CD pipeline
- ✅ Deployment ready (EC2 scripts)

## 📄 License

MIT

## 👤 Author

Backend Engineer Assignment - Social Media API
