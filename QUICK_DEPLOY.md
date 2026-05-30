# 🚀 Quick Deployment Setup

This guide provides a **rapid checklist** to deploy your Gimbiya Mall app to Netlify (frontend) + Render (backend).

## 📋 Pre-Deployment Checklist

### Local Validation
```bash
# Run validation script
bash pre-deploy.sh
```

This will check:
- ✅ Node version compatibility
- ✅ TypeScript compilation
- ✅ Full project build

### Environment Files
- [ ] Copy `.env.example` to `.env.local` (local development)
- [ ] Copy `frontend/.env.example` to `frontend/.env.local` (frontend local dev)
- [ ] Verify all required credentials are valid

---

## 🟦 Backend Deployment (Render)

### 1. Prepare on Render.com

```
render.com → New Web Service → Connect GitHub Repository
```

**Configuration Details:**

| Setting | Value |
|---------|-------|
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Root Directory** | `backend` |
| **Node Version** | 18.17.0 (or latest stable) |

### 2. Environment Variables (Add these in Render Dashboard)

**Critical (Required)**:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/gimbiya_mall?retryWrites=true&w=majority
JWT_SECRET=your-random-32-char-min-secret-string-here
CORS_ORIGIN=https://your-site.netlify.app
```

**Optional (If Using)**:
```
DATABASE_URL=mysql://user:pass@host:3306/db  (only if using Drizzle/MySQL)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
MONNIFY_API_KEY=...
MONNIFY_API_SECRET=...
MONNIFY_CONTRACT_CODE=...
```

### 3. Deploy Backend

1. Push to GitHub: `git push origin main`
2. Render auto-deploys on push
3. Monitor logs: **Render Dashboard → Your Service → Logs**
4. **Deployment URL** will be: `https://your-service-name.onrender.com`

⏱️ **Expected deployment time**: 5-10 minutes

---

## ⚪ Frontend Deployment (Netlify)

### 1. Create on Netlify.com

```
app.netlify.com → Add new site → Import an existing project
```

### 2. Configure Build Settings

Set these values in Netlify deploy settings:
- **Base directory**: `frontend`
- **Build command**: `pnpm install && pnpm build`
- **Publish directory**: `dist`

### 3. Environment Variables (Add in Netlify Dashboard)

**Critical**:
```
VITE_API_URL=https://your-render-backend.onrender.com
```

**Required Firebase**:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Deploy Frontend

1. Push to GitHub: `git push origin main`
2. Netlify auto-deploys on push
3. Monitor build: **Netlify Dashboard → Deploys**
4. **Frontend URL** will be: `https://your-site.netlify.app`

⏱️ **Expected deployment time**: 2-5 minutes

---

## 🔗 Post-Deployment Configuration

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

### Step 3: Verify Connectivity

1. Open your Netlify frontend
2. Check browser console for any CORS errors
3. Try making an API request (e.g., login/signup)
4. Monitor Render logs for any backend errors

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Frontend shows blank page** | API endpoint misconfigured | Verify `VITE_API_URL` in Netlify env vars |
| **"CORS Error" in console** | Backend CORS not updated | Update `CORS_ORIGIN` on Render to match Netlify URL |
| **"Cannot connect to database"** | MongoDB connection string invalid | Verify `MONGODB_URI` includes credentials and whitelist Render IP |
| **Build fails on Netlify** | TypeScript errors | Run `pnpm run check` locally, fix errors |
| **Build fails on Render** | Missing dependencies | Ensure `package.json` includes all dependencies |
| **API requests timeout** | Backend not running | Check Render logs, ensure service has redeployed |

---

## 📊 Monitoring After Deployment

### Render (Backend)
```
Dashboard → Your Service → Logs (Real-time logs)
Dashboard → Your Service → Metrics (CPU, Memory, Requests)
```

### Netlify (Frontend)
```
Dashboard → Your Site → Deploys → Logs
Dashboard → Your Site → Deploy Settings
```

---

## 🔐 Security Best Practices

- [ ] **JWT_SECRET**: Use a long (32+ char), random, unique string. Generate with:
  ```bash
  openssl rand -base64 32
  ```
  
- [ ] **Database credentials**: Never commit `.env` files. Use Render/Netlify secret management.

- [ ] **CORS_ORIGIN**: Always specify exact frontend URL (don't use `*` in production).

- [ ] **API Keys**: Store all API keys (Firebase, AWS, Monnify) in platform secret management.

- [ ] **HTTPS**: Both Netlify and Render provide free HTTPS. Ensure all API calls use `https://`.

---

## 📞 Troubleshooting Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Express.js**: https://expressjs.com
- **Vite**: https://vitejs.dev
- **Firebase**: https://firebase.google.com/docs

---

## ✅ Deployment Success Indicators

Once deployed, verify:

1. ✅ Frontend loads at `https://your-site.netlify.app`
2. ✅ No CORS errors in browser console
3. ✅ Can log in / authenticate (if applicable)
4. ✅ API requests complete without timeout
5. ✅ Both services appear in respective dashboards
6. ✅ Logs show no critical errors

---

**Congratulations!** Your app is live! 🎉
