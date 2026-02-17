# Backend API - Quick Start Guide

## ✅ Technology Stack (Implemented)

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Real-time**: Socket.IO + Supabase Realtime
- **File Storage**: Google Drive API
- **Email**: Resend API
- **API Docs**: Swagger UI
- **Testing**: Jest + Supertest

---

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cd backend
copy .env.example .env
```

**Required Variables:**
```env
PORT=3001
NODE_ENV=development

# Supabase (from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_here

# Google Drive API (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Resend API (from resend.com)
RESEND_API_KEY=re_your_resend_api_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

### 3. Access API Documentation

Once server is running, visit:
```
http://localhost:3001/api-docs
```

---

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/google
```

### Documents
```
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
```

### Files
```
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
```

---

## 🧪 Testing

**Run all tests:**
```bash
npm test
```

**Watch mode:**
```bash
npm run test:watch
```

---

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |

---

## 📦 Key Services

### Email Service (`emailService.ts`)
```typescript
import { EmailService } from './services/emailService';

// Send approval notification
await EmailService.sendDocumentApprovalRequest(
  'user@example.com',
  'Budget Report 2024',
  'Dr. Principal'
);
```

### Google Drive Service (`googleDriveService.ts`)
- Upload files to Google Drive
- Generate shareable links
- Manage file permissions

### Socket Service (`socketService.ts`)
- Real-time notifications
- Live document updates
- Chat functionality

### Cache Service (`cacheService.ts`)
- Supabase Edge Functions for caching
- Reduces database load

---

## 🔐 Authentication Flow

1. User logs in via Supabase Auth
2. Backend validates JWT token
3. Token stored in Authorization header: `Bearer <token>`
4. Protected routes use `auth` middleware

---

## 📊 Database Schema

Located in:
- `supabase-schema.sql` - Main tables
- `supabase-workflow-schema.sql` - Workflow tables
- `supabase-recipients-schema.sql` - Recipients table

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Supabase Connection Issues
- Verify `SUPABASE_URL` and keys in `.env`
- Check Supabase dashboard for service status

### Email Not Sending
- Verify `RESEND_API_KEY` is valid
- Check Resend dashboard for quota limits

---

## 📝 Next Steps

1. ✅ Configure `.env` file
2. ✅ Start backend: `npm run dev`
3. ✅ Test API: Visit `http://localhost:3001/health`
4. ✅ View docs: Visit `http://localhost:3001/api-docs`
5. ✅ Run tests: `npm test`

---

## 🔗 Integration with Frontend

Frontend should point to:
```typescript
// In frontend .env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

---

## 📞 Support

For issues, check:
1. Console logs in terminal
2. API documentation at `/api-docs`
3. Test files in `/tests` directory
