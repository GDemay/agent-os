# 🚂 Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **NVIDIA NIM API Key**: Get from [build.nvidia.com](https://build.nvidia.com)

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Go to Railway Dashboard**
   - Visit [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select `GDemay/agent-os`

2. **Add PostgreSQL Database**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically provision and link it

3. **Configure Environment Variables**
   Click on your service → Variables → Add:
   ```
   NVIDIA_NIM_API_KEY=your-nvidia-nim-api-key-here
   NODE_ENV=production
   ```

   **Note**: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL

4. **Deploy**
   - Railway will automatically detect the configuration
   - Build and deploy will start
   - Wait for deployment to complete (~2-5 minutes)

5. **Access Your App**
   - Click "Settings" → Generate Domain
   - Your app will be at: `https://your-app.up.railway.app`
   - Mission Control: `https://your-app.up.railway.app/mission-control`
   - API Health: `https://your-app.up.railway.app/api/health`

### Option 2: Deploy with Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add -d postgres

# Set environment variables
railway variables set NVIDIA_NIM_API_KEY=your-key-here

# Deploy
railway up
```

## What Gets Deployed

Railway will automatically:
1. ✅ Install dependencies (`npm ci`)
2. ✅ Build TypeScript (`npm run build`)
3. ✅ Generate Prisma Client (`npx prisma generate`)
4. ✅ Run database migrations (`npx prisma db push`)
5. ✅ Seed agents (`npm run seed`)
6. ✅ Add Product Manager agent
7. ✅ Start API server on Railway-assigned port
8. ✅ Start kernel in background

## Configuration Files

- **`railway.toml`** - Railway configuration and build settings
- **`Procfile`** - Process definitions (web + kernel)
- **`nixpacks.toml`** - Build configuration
- **`scripts/railway-deploy.sh`** - Deployment setup script
- **`src/production.ts`** - Production server manager

## Environment Variables

### Required
- `NVIDIA_NIM_API_KEY` - Your NVIDIA NIM API key

### Automatic (Set by Railway)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port number for the web server
- `RAILWAY_ENVIRONMENT` - Current environment

### Optional
- `NODE_ENV` - Set to `production` (done automatically)
- `API_PORT` - Override default port (not needed on Railway)

## Monitoring

### View Logs
In Railway dashboard:
- Click on your service
- Go to "Deployments"
- Click on active deployment
- View real-time logs

### Check Health
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Access Mission Control
Visit: `https://your-app.up.railway.app/mission-control`

## Troubleshooting

### Build Fails
**Error**: `npm ci` fails
- **Solution**: Commit `package-lock.json` to git

**Error**: Prisma generation fails
- **Solution**: Ensure `DATABASE_URL` env var is set

### Runtime Issues
**Error**: "Cannot connect to database"
- **Solution**: Check PostgreSQL service is running
- **Solution**: Verify `DATABASE_URL` in environment variables

**Error**: "PORT already in use"
- **Solution**: Ensure app uses `process.env.PORT` (already configured)

### Kernel Not Running
**Symptom**: Tasks not processing
- **Check logs** for kernel startup messages
- **Verify** both `web` and `kernel` processes are running
- **Check** NVIDIA NIM API key is valid

## Custom Domain

1. Go to your Railway project
2. Click "Settings"
3. Scroll to "Domains"
4. Click "Add Domain"
5. Enter your custom domain
6. Update DNS records as shown

## Scaling

Railway automatically scales based on:
- **Memory**: Up to 8GB per service
- **CPU**: Shared or dedicated cores
- **Database**: Auto-scaling storage

For high-load scenarios:
1. Upgrade to Pro plan ($20/month)
2. Enable auto-scaling
3. Monitor metrics in dashboard

## Cost Estimation

**Hobby Plan (Free)**
- $5 free credit per month
- Good for testing/development
- Includes PostgreSQL

**Pro Plan ($20/month)**
- $20 credit per month
- Production-ready
- Better performance
- Custom domains

**Typical Usage**:
- Web service: ~$5-10/month
- PostgreSQL: ~$5-10/month
- Total: ~$10-20/month

## Database Backups

Railway automatically backs up PostgreSQL:
- **Frequency**: Daily
- **Retention**: 7 days (Pro plan)
- **Manual backup**: Available in database settings

## Continuous Deployment

Railway automatically redeploys when you push to `master`:

```bash
git add .
git commit -m "feat: add new feature"
git push origin master
```

Railway will:
1. Detect push
2. Build new version
3. Run migrations
4. Deploy with zero downtime

## Security

### Environment Variables
- ✅ Never commit `.env` file
- ✅ Set sensitive vars in Railway dashboard
- ✅ Rotate API keys regularly

### Database
- ✅ Railway provides SSL by default
- ✅ Connection is encrypted
- ✅ No public access without credentials

### API
- ✅ CORS configured for security
- ✅ Rate limiting recommended (add middleware)
- ✅ Use HTTPS only (automatic on Railway)

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [railway.app/discord](https://railway.app/discord)
- **AgentOS Issues**: [github.com/GDemay/agent-os/issues](https://github.com/GDemay/agent-os/issues)

## Next Steps

After deployment:
1. ✅ Verify health endpoint
2. ✅ Check Mission Control UI
3. ✅ Monitor logs for agent activity
4. ✅ Create your first strategic task
5. ✅ Watch Product Manager analyze your product!

---

**🎉 Your AgentOS is now running in the cloud!**

Access it at: `https://your-app.up.railway.app/mission-control`
