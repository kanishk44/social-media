# Social Media Backend

A minimal social media backend with user graph, posting, and timelines built with TypeScript, Express, Prisma, and PostgreSQL.

## 🚀 Features

- **User Management**: Registration, login with JWT authentication
- **Social Graph**: Follow/unfollow users, view followers and following lists
- **Posts**: Create text posts with optional media, view user posts and personalized feed
- **Media Upload**: Integrated with Supabase Storage for image and video uploads
- **Security**: Rate limiting, CORS, helmet, request validation with Zod
- **Testing**: Unit tests for core services using Jest

## 📋 Tech Stack

- **Language**: TypeScript (Node 18+)
- **Framework**: Express.js
- **Database**: PostgreSQL 15 (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (access token only)
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Testing**: Jest
- **Logging**: Pino
- **Security**: Helmet, CORS, Express Rate Limit
- **Package Manager**: pnpm

## 📐 Architecture & Design Decisions

### Database Schema

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

### Key Design Choices

1. **JWT Access Token Only**: For simplicity, only short-lived access tokens (15m) are used. In production, refresh tokens would be added.

2. **Offset Pagination**: Simple offset-based pagination is used instead of cursor-based for easier implementation. Trade-off: less efficient for large datasets.

3. **Supabase for Media**: Using Supabase Storage instead of AWS S3 for easier setup and integration. Files are stored with pre-signed URLs.

4. **Follow Model**: Self-referential many-to-many relationship with a composite unique constraint to prevent duplicate follows.

5. **Feed Generation**: Feed queries fetch posts from the user + all followed users in a single query. For scale, this would need optimization (e.g., caching, pre-computed feeds).

6. **Error Handling**: Centralized error handler with custom HttpError class for consistent API responses.

7. **Security**: 
   - Passwords hashed with bcrypt (12 rounds)
   - Rate limiting (100 req/15min per IP)
   - Request validation with Zod
   - Body size limits (10MB)

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 15 (or Supabase account)
- Supabase account (optional, for media uploads)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=8080
   DATABASE_URL=postgresql://user:password@localhost:5432/social_media
   JWT_SECRET=your-super-secret-jwt-key-change-me
   JWT_TTL=15m
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_BUCKET=media
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Setup database with Prisma**
   ```bash
   # Generate Prisma Client
   pnpm prisma:generate
   
   # Run migrations
   pnpm prisma:migrate
   
   # (Optional) Seed database with test data
   pnpm prisma:seed
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```
   
   Server will start at `http://localhost:8080`

6. **Run tests**
   ```bash
   pnpm test
   ```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to Settings > Database and copy the connection string
3. Navigate to Storage and create a new bucket named `media`
4. Set the bucket to public or configure access policies
5. Copy the project URL and anon key to your `.env` file

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth
- `POST /auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "handle": "username",
    "name": "User Name",
    "password": "password123"
  }
  ```

- `POST /auth/login` - Login with email/handle and password
  ```json
  {
    "emailOrHandle": "user@example.com",
    "password": "password123"
  }
  ```

#### Users
- `GET /users/:id` - Get user profile
- `POST /users/:id/follow` - Follow a user (auth required)
- `DELETE /users/:id/follow` - Unfollow a user (auth required)
- `GET /users/:id/followers?offset=0&limit=20` - Get user's followers
- `GET /users/:id/following?offset=0&limit=20` - Get users followed by user

#### Posts
- `POST /posts` - Create a new post (auth required)
  ```json
  {
    "text": "Hello world!",
    "mediaUrl": "https://example.com/image.jpg" // optional
  }
  ```

- `GET /posts/:id` - Get a single post
- `GET /users/:id/posts?offset=0&limit=20` - Get posts by user
- `GET /feed?offset=0&limit=20` - Get personalized feed (auth required)
- `GET /posts/upload-url?ext=jpg` - Get signed upload URL for media (auth required)

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated Response:**
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

**Error Response:**
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": { ... } // optional
}
```

### Health Check
```
GET /healthz
```

## 🧪 Testing

The project includes unit tests for core services:

- **AuthService**: Password hashing, verification, JWT generation, registration, login
- **UsersService**: Follow/unfollow logic, followers/following lists
- **PostsService**: Post creation, retrieval, feed generation

Run tests with:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

## 🚢 Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t social-media-backend .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 --env-file .env social-media-backend
   ```

### AWS EC2 Deployment

1. **Setup EC2 instance**
   - Launch Ubuntu 22.04 instance
   - Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Install Node.js 18+, pnpm, PM2

2. **Deploy application**
   ```bash
   # SSH into instance
   ssh ubuntu@your-ec2-ip
   
   # Clone repository
   git clone <repository-url>
   cd social-media-backend
   
   # Install dependencies
   pnpm install
   
   # Setup environment
   cp .env.example .env
   # Edit .env with production values
   
   # Build application
   pnpm build
   
   # Run migrations
   pnpm prisma:migrate
   
   # Start with PM2
   pm2 start dist/server.js --name social-media-backend
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔒 Security Considerations

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire in 15 minutes
- Rate limiting: 100 requests per 15 minutes per IP
- Request validation with Zod schemas
- Body size limits (10MB)
- CORS configured for specific origins
- Helmet.js for security headers
- SQL injection protection via Prisma ORM

## 🔄 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm prisma:seed` - Seed database with test data
- `pnpm typecheck` - Run TypeScript type checking

## 📝 API Testing

You can test the API using cURL, Postman, or any HTTP client.

### Example: Register and Login

1. **Register**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "handle": "testuser",
       "name": "Test User",
       "password": "password123"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "emailOrHandle": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Create Post** (use token from login)
   ```bash
   curl -X POST http://localhost:8080/api/v1/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-token>" \
     -d '{
       "text": "My first post!"
     }'
   ```

## 🐛 Known Limitations

- No refresh token mechanism (tokens expire in 15m)
- Offset pagination can be slow for large datasets
- Feed generation not optimized for scale
- No real-time updates (WebSocket/SSE)
- No post editing or deletion
- No likes/comments functionality
- No user profile images
- Media upload requires Supabase configuration

## 📚 Future Improvements

- Add refresh token mechanism
- Implement cursor-based pagination
- Add caching layer (Redis)
- Implement WebSocket for real-time updates
- Add post editing and deletion
- Add likes and comments
- Add user profile images
- Add notifications system
- Add search functionality
- Add analytics and monitoring
- Add CI/CD pipeline
- Add integration tests
- Add API documentation with Swagger

## 📄 License

MIT

## 👥 Author

Backend Engineer Assignment

