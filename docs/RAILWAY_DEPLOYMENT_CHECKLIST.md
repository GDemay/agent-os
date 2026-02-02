# Railway Deployment Checklist

## ✅ Pre-Deployment

- [ ] All TypeScript compiles without errors (`npm run build`)
- [ ] `.env.example` exists with all required vars
- [ ] `railway.toml` configuration is correct
- [ ] `Procfile` defines web and kernel processes
- [ ] `scripts/railway-deploy.sh` is executable
- [ ] Git repository is up to date

## 🚂 Railway Setup

### 1. Create Project
```bash
# Option A: Via Dashboard
1. Go to railway.app/new
2. Click "Deploy from GitHub repo"
3. Select GDemay/agent-os
4. Click "Deploy Now"

# Option B: Via CLI
railway init
railway up
```

### 2. Add PostgreSQL
```bash
# In Railway Dashboard:
1. Click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Wait for provisioning (~30 seconds)
```

### 3. Set Environment Variables
```bash
# Required:
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx

# Automatic (set by Railway):
DATABASE_URL=postgresql://...
PORT=3000
RAILWAY_ENVIRONMENT=production
```

## 📝 Deployment Process

Railway will automatically:
1. ✅ Clone repository
2. ✅ Run `npm ci` (install deps)
3. ✅ Run `npm run build` (compile TypeScript)
4. ✅ Run `npx prisma generate` (generate Prisma client)
5. ✅ Execute `scripts/railway-deploy.sh` (migrations + seeding)
6. ✅ Start `npm run start:production` (API + kernel)

## 🔍 Verification

### Check Deployment Status
1. Go to Railway dashboard
2. Click on your service
3. View "Deployments" tab
4. Wait for "Success" status

### Test Endpoints
```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Mission Control
open https://your-app.up.railway.app/mission-control
```

### View Logs
1. Click on deployment
2. View real-time logs
3. Look for:
   - "AgentOS API Server running on port XXXX"
   - "AgentOS Event-Driven Kernel v0.2.0"
   - "Initialized with X agents"

## 🐛 Troubleshooting

### Build Fails
**Error**: `npm ci` fails
```bash
# Ensure package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

**Error**: TypeScript compilation fails
```bash
# Test locally first
npm run build
# Fix errors, commit, and push
```

### Runtime Errors
**Error**: "Cannot connect to database"
```bash
# 1. Check PostgreSQL service is running
# 2. Verify DATABASE_URL is set
# 3. Check deployment logs for Prisma errors
```

**Error**: "DEEPSEEK_API_KEY not set"
```bash
# Set in Railway dashboard:
railway variables set DEEPSEEK_API_KEY=your-key-here
```

**Error**: "Port already in use"
```bash
# This shouldn't happen - Railway manages ports
# Check logs for process conflicts
```

### Agents Not Running
**Symptom**: Tasks not processing
```bash
# 1. Check logs for kernel startup
# 2. Verify agents were seeded
# 3. Check DeepSeek API key is valid
# 4. Restart deployment
```

## 🎯 Post-Deployment

### 1. Generate Domain
```bash
# In Railway dashboard:
1. Go to Settings
2. Click "Generate Domain"
3. Copy the URL
```

### 2. Test Mission Control
```bash
# Visit your domain
https://your-app.up.railway.app/mission-control

# Verify:
- [ ] Agents list loads
- [ ] Tasks display in kanban
- [ ] Can create new task
- [ ] API status shows "online"
```

### 3. Create First Strategic Task
```bash
# In Mission Control:
1. Click "+ New Task"
2. Title: "Analyze market opportunity"
3. Tags: product, research, strategy
4. Assign to: Product Manager
5. Priority: High
6. Click "Create Task"
```

### 4. Monitor Activity
```bash
# Watch logs for:
- Product Manager starts analysis
- Websearch tool usage
- Sub-task creation
- Task completion
```

## 📊 Expected Behavior

### On First Deploy
```
[Production] Starting API server...
[Production] Starting kernel...
[Kernel] Initializing event-driven kernel...
[Kernel] Loaded Product Manager (product)
[Kernel] Loaded Orchestrator (orchestrator)
[Kernel] Loaded Worker (worker)
[Kernel] Loaded Reviewer (reviewer)
[Kernel] Initialized with 4 agents and 5 tools
[Kernel] Starting recovery watchdog
[Kernel] Found 1 inbox goals to process
[Kernel] Found 0 in-progress tasks to continue
[Kernel] Found 0 assigned tasks to continue
[Kernel] Found 0 tasks awaiting review
[Kernel] Event-driven kernel started
```

### On Task Creation
```
[Kernel] Task created: Analyze market opportunity
[Kernel] Task assigned: Analyze market opportunity to agent agent-product-01
[Kernel] Agent found, starting task processing...
[Product Manager] Analyzing: Analyze market opportunity
[Product Manager] Strategic iteration 1/15
[Product Manager] Research started: 2 topics
[Product Manager] Created 5 strategic sub-tasks
[Product Manager] Strategic analysis complete
```

## 🔒 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] API keys set in Railway (not in code)
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic on Railway)
- [ ] Database credentials secure
- [ ] No secrets in logs

## 💰 Cost Monitoring

### Check Usage
```bash
# In Railway dashboard:
1. Go to "Usage"
2. Monitor:
   - Compute hours
   - Database storage
   - Network egress
```

### Typical Monthly Cost
- **Hobby Plan**: $0-5 (with $5 free credit)
- **Pro Plan**: $20-40 (includes $20 credit)

### Components:
- Web service: ~$5-10/month
- Kernel (background): ~$5-10/month
- PostgreSQL: ~$5-10/month

## 🎉 Success!

Your AgentOS is now live at:
- **Mission Control**: `https://your-app.up.railway.app/mission-control`
- **API**: `https://your-app.up.railway.app/api/health`

The Product Manager agent is analyzing your product strategy right now!
