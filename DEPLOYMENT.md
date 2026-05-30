# Deployment Guide: Netlify + Render

This guide covers deploying the frontend to Netlify and the backend to Render.

## Project Structure

```
/your-repo/
├── frontend/            (Frontend app)        → Deploy to Netlify
├── backend/             (Backend server/API)   → Deploy to Render
├── shared/              (Shared types)
├── package.json         (Monorepo root)
├── netlify.toml         (Netlify config)
└── render.yaml          (Render config)
```

---

## Backend Deployment (Render)

### Prerequisites
- Render account (free or paid tier)
- MongoDB Atlas database (or any MongoDB provider)
- MySQL database (for Drizzle, if using)
- All required API keys and secrets

### Step 1: Prepare Backend Environment Variables

Required environment variables on Render:

| Variable | Type | Description |
|----------|------|-------------|
| `NODE_ENV` | Fixed | `production` |
| `MONGODB_URI` | Secret | MongoDB connection string |
| `MONGODB_DB_NAME` | Fixed | `gimbiya_mall` |
| `JWT_SECRET` | Secret | Min 32 characters, unique and secure |
| `PORT` | Fixed | `3000` (Render assigns automatically) |
| `DATABASE_URL` | Secret | MySQL connection string (if using Drizzle) |
| `CORS_ORIGIN` | Fixed | Your Netlify frontend URL (e.g., `https://your-site.netlify.app`) |
| `AWS_ACCESS_KEY_ID` | Secret | AWS S3 credentials (if using) |
| `AWS_SECRET_ACCESS_KEY` | Secret | AWS S3 credentials (if using) |
| `AWS_S3_BUCKET` | Fixed | S3 bucket name (if using) |
| `MONNIFY_API_KEY` | Secret | Payment gateway API key |
| `MONNIFY_API_SECRET` | Secret | Payment gateway secret |
| `MONNIFY_CONTRACT_CODE` | Secret | Payment gateway contract code |

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `gimbiya-mall-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend` (if supported)
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Standard (or Free for testing)

### Step 3: Set Environment Variables on Render

1. In your service dashboard, go to **Environment**
2. Add all variables from the table above
3. For secrets, toggle the "Secret" option and use Render's secret management

### Step 4: Deploy

```bash
git push origin main
```

Render will automatically build and deploy on every push to your connected branch.

**Your backend URL will be**: `https://your-service-name.onrender.com`

---

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account (free tier available)
- Backend URL from Render (from Step 2 above)
- Firebase or other client-side service configuration

### Step 1: Prepare Frontend Environment Variables

Required environment variables on Netlify:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., `https://your-service-name.onrender.com`) |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

### Step 2: Create Netlify Site

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Choose your repo and configure deployment settings:
   - **Base directory**: `frontend`
   - **Build command**: `pnpm install && pnpm build`
   - **Publish directory**: `dist`

### Step 3: Configure Build Settings

Netlify should use the values above. Confirm:
- **Build command**: `pnpm install && pnpm build`
- **Publish directory**: `dist`
- **Base directory**: `frontend`

### Step 4: Set Environment Variables

1. Go to site **Settings** → **Build & deploy** → **Environment**
2. Add all variables from the table above
3. Set scope to `Production` and optionally `Deploy previews`

**Critical**: Set `VITE_API_URL` to your Render backend URL before deploying.

### Step 5: Deploy

1. Push your code to GitHub
2. Netlify will automatically deploy on push
3. Once deployment succeeds, your app is live!

**Your frontend URL will be**: `https://your-site.netlify.app`

---

## Recommended `netlify.toml`

Create a `netlify.toml` file at the repository root with:

```toml
[build]
  base = "frontend"
  command = "pnpm install && pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Optional API proxy for same-origin /api calls
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_RENDER_BACKEND.onrender.com/:splat"
  status = 200
  force = true
```

---

## Post-Deployment Configuration

### Step 1: Update Backend CORS

Once you have your Netlify frontend URL, update the backend on Render:

1. Go to Render dashboard → Your backend service
2. **Environment** → Edit `CORS_ORIGIN`
3. Set it to: `https://your-site.netlify.app`
4. Redeploy the backend

### Step 2: Update Frontend API Endpoint

Once you have your Render backend URL, update Netlify:

1. Go to Netlify dashboard → Your site → **Site settings** → **Build & deploy** → **Environment**
2. Find `VITE_API_URL`
3. Update it to your Render URL
4. Trigger a redeploy

### Step 3: Test API Connectivity

1. Open your Netlify frontend
2. Check browser console for any CORS errors
3. Try making an API request (e.g., login/signup)
4. Monitor Render logs for any backend errors

---

## Monitoring & Logs

### Render Logs
```
Render Dashboard → Your Service → Logs
```
- View real-time server logs
- Check for errors, database connection issues, etc.

### Netlify Logs
```
Netlify Dashboard → Site → Deploys → Logs
```
- Build logs (pnpm install, pnpm build)
- Deploy logs and status

---

## Troubleshooting

### Frontend Not Connecting to Backend

**Issue**: API calls fail with CORS errors

**Solution**:
1. Verify `VITE_API_URL` environment variable is set correctly
2. Check backend `CORS_ORIGIN` includes your Netlify URL
3. Ensure backend is running (check Render logs)

### Build Failures on Netlify

**Issue**: `pnpm build` fails

**Possible Causes**:
- TypeScript errors (run `pnpm run check` locally)
- Missing environment variables
- Dependency conflicts

**Solution**:
1. Test locally: `cd frontend && pnpm build`
2. Check Netlify build logs
3. Ensure all environment variables are set

### Build Failures on Render

**Issue**: `pnpm build` fails during deployment

**Possible Causes**:
- esbuild compilation errors
- Missing dependencies
- TypeScript errors in server code

**Solution**:
1. Test locally: `cd backend && pnpm build`
2. Check Render build logs
3. Verify all dependencies in `package.json`

### Database Connection Failures

**Issue**: "Cannot connect to MongoDB" or "DATABASE_URL not found"

**Solution**:
1. Verify `MONGODB_URI` and `DATABASE_URL` are set on Render
2. Check your MongoDB Atlas firewall allows Render IPs
3. Test connection string locally before deploying

---

## Production Checklist

- [ ] All environment variables set on both Netlify and Render
- [ ] `CORS_ORIGIN` on Render matches Netlify frontend URL
- [ ] `VITE_API_URL` on Netlify matches Render backend URL
- [ ] MongoDB and database connections tested
- [ ] JWT_SECRET is secure and unique
- [ ] API keys (Firebase, AWS, Monnify) are valid and in production
- [ ] Both deployments pass health checks
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Testing on staging before production

---

## Useful Commands

```bash
# Build backend
cd backend && pnpm install && pnpm build

# Test backend locally
cd backend && pnpm start

# Build frontend
cd frontend && pnpm install && pnpm build

# Check for TypeScript errors
pnpm run check

# Run tests
pnpm test
```

```

---

## Important Notes

1. **Monorepo Structure**: This project uses a single `package.json` at the root with both frontend and backend code. Keep this in mind when managing dependencies.

2. **Build Output**: 
   - Frontend builds to `frontend/dist` (Netlify will publish this directory by default from the `frontend` base)
   - Backend builds to `backend/dist` (Render will run the backend from the `backend` root)
   - Netlify serves the frontend
   - Render serves the backend

3. **Development vs Production**: 
   - Dev: Frontend makes requests to `http://localhost:3000/api/trpc` (or to your local backend port)
   - Prod: Frontend makes requests to the Render backend URL (set `VITE_API_URL` in Netlify)

4. **Vite Configuration**: The frontend uses Vite with React. The build is optimized for production automatically.

5. **Node Version**: Ensure both Netlify and Render use the same Node.js version (check `.nvmrc` or `package.json` `engines` field).

---

For issues or questions, check the `STARTUP_GUIDE.md` and `AUTH_GUIDE.md` files for more context.
