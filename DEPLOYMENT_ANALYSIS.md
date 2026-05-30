# 📐 Deployment Analysis & Architecture

## Executive Summary

Your Gimbiya Mall project is structured as a **monorepo** with separate frontend and backend apps. For production deployment, this guide now targets:

- **Frontend** → Netlify (static hosting)
- **Backend** → Render (containerized Node.js service)

---

## Current Architecture

```
┌─────────────────────────────────────────────────────┐
│           Gimbiya Mall Monorepo                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │   Frontend           │  │  Backend             │ │
│  ├──────────────────────┤  ├──────────────────────┤ │
│  │ • React + Vite       │  │ • Express / Node     │ │
│  │ • TypeScript         │  │ • TypeScript         │ │
│  │ • TailwindCSS        │  │ • tRPC / API routes  │ │
│  │ • React Query        │  │ • MongoDB            │ │
│  │ • Firebase Auth      │  │ • Drizzle ORM        │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │  Shared Code         │  │   Database Layer     │ │
│  ├──────────────────────┤  ├──────────────────────┤ │
│  │ • Types             │  │ • MongoDB (User)     │ │
│  │ • Constants         │  │ • MySQL (Drizzle)    │ │
│  │ • Utilities         │  │                      │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRODUCTION ENVIRONMENT                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     NETLIFY (Frontend)                     │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  React SPA (frontend/dist)                           │  │ │
│  │  │  → Served globally via CDN                           │  │ │
│  │  │  → Base dir: frontend                                │  │ │
│  │  │  → Environment: VITE_API_URL → Render Backend        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                               │ │
│  │  URL: https://your-site.netlify.app                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          ▲                                         │
│                          │ HTTP/HTTPS API Calls                    │
│                          │                                      │
│                          ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   RENDER (Backend)                          │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                               │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Node.js Express Server                              │  │ │
│  │  │  → tRPC API Router (/api/trpc/*)                     │  │ │
│  │  │  → JWT Authentication                                │  │ │
│  │  │  → Rate Limiting                                     │  │ │
│  │  │  → CORS Middleware                                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                               │
│  │  ┌─────────────────┐      ┌──────────────────────────────┐ │ │
│  │  │  MongoDB Atlas  │      │  MySQL Database (Drizzle)    │ │ │
│  │  │  (User data)    │      │  (Orders, Products, etc.)    │ │ │
│  │  └─────────────────┘      └──────────────────────────────┘ │ │
│  │                                                               │
│  │  URL: https://your-app.onrender.com                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  External Services                          │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  • Firebase (Authentication)                                │ │
│  │  • AWS S3 (Image Storage)                                   │ │
│  │  • Monnify (Payment Gateway)                                │ │
│  │  • Image Generation Service                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Configuration Files Created

### 1. **netlify.toml** - Netlify Frontend Configuration
- **Purpose**: Tells Netlify how to build and publish the frontend from `frontend/`
- **Key Settings**:
  - Base directory: `frontend`
  - Publish directory: `dist`
  - Build command: `pnpm install && pnpm build`
  - SPA fallback redirect for client-side routing

### 2. **render.yaml** - Render Backend Configuration
- **Purpose**: Infrastructure as Code for Render deployment
- **Key Settings**:
  - Node.js environment
  - Build: `pnpm install && pnpm build`
  - Start: `pnpm start`
  - Root directory: `backend`

### 3. **.env.example** - Environment Template
- **Purpose**: Template showing all required environment variables
- **Usage**: Copy to `.env` and fill in actual values (never commit)

### 4. **frontend/.env.example** - Frontend Environment Template
- **Purpose**: Shows frontend-specific environment variables needed
- **Key Variables**: Firebase config + `VITE_API_URL`

### 5. **.nvmrc** - Node Version Specification
- **Version**: 18.17.0
- **Purpose**: Ensures both Netlify and Render use the same Node version

### 6. **DEPLOYMENT.md** - Comprehensive Deployment Guide
- **Content**: Full step-by-step instructions for both platforms

### 7. **QUICK_DEPLOY.md** - Quick Reference Guide
- **Purpose**: Checklist format for rapid deployment

### 8. **pre-deploy.sh** - Pre-deployment Validation Script
- **Checks**:
  - Node version
  - TypeScript compilation
  - Full build success

### 9. **post-deploy-test.sh** - Post-deployment Smoke Tests
- **Tests**:
  - Backend connectivity
  - Frontend connectivity
  - API endpoint accessibility

---

## Environment Variables Explained

### Backend (Render) - Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | User database connection | `mongodb+srv://...` |
| `JWT_SECRET` | Session token signing | 32+ char random string |
| `PORT` | Server port (Render assigns) | `3000` |
| `CORS_ORIGIN` | Allowed frontend URL | `https://app.netlify.app` |

### Backend (Render) - Optional

| Variable | Purpose | When Needed |
|----------|---------|-------------|
| `DATABASE_URL` | MySQL for Drizzle ORM | If using MySQL |
| `AWS_*` credentials | S3 image storage | For image uploads |
| `MONNIFY_*` credentials | Payment processing | For payments |

### Frontend (Netlify) - Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://app.onrender.com` |
| `VITE_FIREBASE_*` | Firebase auth config | From Firebase Console |

---

## Deployment Sequence

### Initial Deployment

```
1. Backend First (Render)
   ├─ Create Render service
   ├─ Set environment variables
   ├─ Deploy (git push)
   └─ Get backend URL

2. Frontend Second (Netlify)
   ├─ Create Netlify site
   ├─ Set `VITE_API_URL` to backend URL
   ├─ Deploy (git push)
   └─ Get frontend URL

3. Cross-Configuration
   ├─ Update Render CORS_ORIGIN to frontend URL
   ├─ Verify API connectivity
   └─ Test full application flow
```

### Updates After Deployment

```
For any code changes:
git push origin main
└─ Netlify auto-deploys frontend
└─ Render auto-deploys backend
```

---

## Key Considerations

### 1. **CORS Configuration**
- Backend must know frontend URL to allow API requests
- Frontend must know backend URL to make API calls
- Deploy both first, then cross-update the environment values

### 2. **Build Process**
- Frontend: Vite builds React to static files
- Backend: Render runs Node build from `backend`
- Both builds must succeed for deployment to work

### 3. **Database Access**
- MongoDB Atlas must allow Render access
- MySQL (if used) must be accessible from Render
- Use environment variables for all connection strings

### 4. **Cold Starts**
- Render: may have slower first requests on free tier
- Netlify: static frontend is instant via CDN

### 5. **Logging & Monitoring**
- Render: real-time logs in dashboard
- Netlify: deployment logs in site settings

---

## Cost Estimates (as of May 2026)

### Netlify (Frontend)
- **Free Tier**: good for testing and staging
- **Pro**: paid plans add bandwidth and team features
- **Typical Cost**: $0-20/month depending on needs

### Render (Backend)
- **Free Tier**: may have cold starts after idle
- **Standard**: $7/month per instance
- **Typical Cost**: $7-20/month depending on traffic

**Total Estimated Cost**: $7-40/month for production

---

## Production Readiness Checklist

- [ ] All environment variables documented and verified
- [ ] Database connection strings tested
- [ ] TypeScript compiles without errors (`pnpm run check`)
- [ ] Build succeeds locally (`pnpm run build`)
- [ ] CORS configuration correct
- [ ] API endpoints responding
- [ ] Authentication flow working
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance acceptable (< 3s load time)
- [ ] HTTPS enforced
- [ ] Backup strategy in place
- [ ] Monitoring/alerts set up

---

## Recommended Next Steps

1. **Run Pre-deployment Script**
   ```bash
   bash pre-deploy.sh
   ```

2. **Create Render Account & Backend Service**
   - Go to render.com
   - Create web service
   - Set environment variables

3. **Create Netlify Site & Frontend Deployment**
   - Go to app.netlify.com
   - Import repository
   - Set environment variables

4. **Cross-Update URLs**
   - Update Render CORS
   - Update Netlify API URL

5. **Run Smoke Tests**
   ```bash
   bash post-deploy-test.sh
   ```

6. **Monitor Logs** for any issues

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Netlify Documentation**: https://docs.netlify.com
- **Deployment Guide** (this repo): `DEPLOYMENT.md`
- **Quick Reference**: `QUICK_DEPLOY.md`

---

**Status**: ✅ Deployment guide updated for Netlify + Render.
