# Mission Control - Quick Start Guide
## Getting Started with Self-Bootstrapping Agent System

This guide will help you get Mission Control up and running, then let the agents build the rest.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- Git
- API keys for LLM (OpenAI/Anthropic/Google)

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/GDemay/agent-os.git
cd agent-os

# Start database
docker-compose up -d

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head

# Setup frontend
cd ../frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database credentials
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Background Workers
cd backend
celery -A worker worker --loglevel=info
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📝 Initial Setup Tasks

### Step 1: Create Seed Data (Manual - Day 1)

1. **Create 3 Core Agents** via API or UI:
   ```json
   [
     {
       "name": "Orchestrator",
       "role": "Meta-coordinator",
       "session_key": "agent:orchestrator:main",
       "capabilities": ["task_creation", "workflow_management", "quality_control"],
       "status": "active"
     },
     {
       "name": "Technical",
       "role": "Backend Developer",
       "session_key": "agent:technical:main",
       "capabilities": ["python", "fastapi", "sqlalchemy", "react"],
       "status": "active"
     },
     {
       "name": "QA",
       "role": "Quality Assurance",
       "session_key": "agent:qa:main",
       "capabilities": ["testing", "validation", "debugging"],
       "status": "active"
     }
   ]
   ```

2. **Create Initial Tasks** from GITHUB_ISSUES_TEMPLATE.md:
   - Start with issues #1-#3 (already done if you followed setup)
   - Create tasks for issues #4-#10 (database models and migrations)
   - Assign to Technical agent

### Step 2: Bootstrap the Orchestrator (Day 1-2)

1. **Feed the roadmap to Orchestrator:**
   - Upload MISSION_CONTROL_ROADMAP.md as a document
   - Upload GITHUB_ISSUES_TEMPLATE.md as a document
   - Create a task: "Break down roadmap into actionable tasks"

2. **Enable autonomous task creation:**
   - Orchestrator reads roadmap
   - Creates tasks from GitHub issues
   - Assigns tasks based on agent capabilities
   - Monitors progress via WORKING.md

### Step 3: Let Agents Work (Day 2-10)

From this point, agents should work autonomously:

1. **Heartbeat service triggers** (every 15 minutes):
   - Agents check WORKING.md
   - Pick up assigned tasks
   - Fetch relevant documentation online
   - Implement features
   - Run tests
   - Update WORKING.md

2. **You monitor progress:**
   - Check dashboard for agent activity
   - Review completed work
   - Address any blockers agents can't resolve
   - Approve major changes

---

## 🎯 Development Workflow

### For Agents

**Each Heartbeat:**
```
1. Read WORKING.md
2. Check assigned tasks
3. If task assigned to me:
   a. Fetch relevant documentation (if needed)
   b. Implement solution
   c. Write tests
   d. Run tests
   e. Update task status
   f. Post message with progress
   g. Update WORKING.md
4. If no tasks assigned:
   a. Check if can help others
   b. Suggest optimizations
   c. Update status to idle
```

### For Humans (You)

**Daily:**
```
1. Review dashboard
2. Check WORKING.md
3. Address blockers
4. Approve significant changes
5. Provide feedback
```

**Weekly:**
```
1. Review progress vs roadmap
2. Adjust priorities if needed
3. Add new agents if workload high
4. Review and merge completed features
```

---

## 📂 Project Structure

```
agent-os/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── models/                 # SQLAlchemy models
│   ├── crud/                   # Database operations
│   ├── api/                    # API endpoints
│   ├── services/               # Business logic
│   │   ├── heartbeat.py       # Heartbeat service
│   │   ├── orchestrator.py    # Agent orchestration
│   │   ├── working_state.py   # WORKING.md management
│   │   ├── knowledge_integrator.py  # External docs
│   │   └── agent_memory.py    # Agent memory system
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   ├── security.py        # Authentication
│   │   └── dependencies.py    # DI container
│   └── tests/                 # Test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API clients
│   │   ├── store/             # State management
│   │   └── utils/             # Utilities
│   └── tests/                 # Test suite
│
├── WORKING.md                  # Shared agent state file
├── MISSION_CONTROL_ROADMAP.md  # Complete roadmap
├── GITHUB_ISSUES_TEMPLATE.md   # All issues/tasks
├── docker-compose.yml          # Local development
└── README.md                   # Project overview
```

---

## 🔧 Configuration

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mission_control

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# JWT Auth
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# LLM API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# GitHub Integration
GITHUB_TOKEN=ghp_...

# Email (optional)
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@missioncontrol.dev
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test                    # Unit tests
npm run test:e2e           # E2E tests
```

### Integration Tests

```bash
cd backend
pytest tests/integration/ -v
```

---

## 🐛 Troubleshooting

### Database Issues

**Problem:** Can't connect to database
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart db

# Check logs
docker-compose logs db
```

**Problem:** Migration errors
```bash
# Reset database (WARNING: deletes all data)
alembic downgrade base
alembic upgrade head

# Or create new migration
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Agent Not Working

**Problem:** Agent not picking up tasks
```
1. Check agent status in database (should be 'active')
2. Check heartbeat service is running
3. Check WORKING.md has tasks assigned to agent
4. Check agent session_key matches in database and WORKING.md
5. Check logs for errors
```

**Problem:** Agent can't access external docs
```
1. Check internet connection
2. Check API keys are configured
3. Check rate limiting not exceeded
4. Check firewall/proxy settings
```

### Frontend Issues

**Problem:** API calls failing
```
1. Check backend is running (http://localhost:8000)
2. Check VITE_API_URL in .env
3. Check CORS settings in backend
4. Check browser console for errors
```

**Problem:** WebSocket not connecting
```
1. Check WebSocket endpoint (ws://localhost:8000/ws)
2. Check authentication token valid
3. Check browser console for errors
4. Check backend WebSocket handler running
```

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Agent Activity:**
   - Heartbeat frequency
   - Tasks completed per day
   - Average task completion time
   - Agent idle time

2. **System Performance:**
   - API response time (should be < 200ms)
   - Database query time
   - WebSocket connection count
   - Memory usage

3. **Task Progress:**
   - Tasks in each status
   - Tasks blocked/stuck
   - Task creation rate
   - Task completion rate

### Dashboard Views

1. **Agent Status View:**
   - All agents with current status
   - Current task for each agent
   - Last heartbeat time

2. **Task Board:**
   - Kanban board with all tasks
   - Filter by status, assignee, priority
   - Drag-and-drop to change status

3. **Activity Feed:**
   - Real-time event stream
   - Filter by agent or task
   - Search functionality

4. **Analytics:**
   - Task completion trends
   - Agent productivity metrics
   - System performance metrics

---

## 🎓 Learning Resources

### For Understanding the System

1. **Architecture Documentation:**
   - Read MISSION_CONTROL_ROADMAP.md
   - Review OpenAPI docs at /docs
   - Check database schema diagram

2. **Code Examples:**
   - Backend: Look at `backend/api/agents.py`
   - Frontend: Look at `frontend/src/pages/Dashboard.tsx`
   - Orchestration: Look at `backend/services/orchestrator.py`

3. **External Documentation:**
   - FastAPI: https://fastapi.tiangolo.com/
   - SQLAlchemy: https://docs.sqlalchemy.org/
   - React: https://react.dev/
   - Shadcn UI: https://ui.shadcn.com/

---

## 🚢 Deployment

### Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Load testing completed

### Deployment Steps

1. **Build Docker Images:**
   ```bash
   docker build -t mission-control-backend ./backend
   docker build -t mission-control-frontend ./frontend
   ```

2. **Push to Container Registry:**
   ```bash
   docker tag mission-control-backend registry.example.com/backend:latest
   docker push registry.example.com/backend:latest
   ```

3. **Deploy to Cloud:**
   ```bash
   # Example with Docker Compose on server
   scp docker-compose.prod.yml user@server:~/
   ssh user@server
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run Migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

5. **Verify Deployment:**
   - Check health endpoints
   - Test API functionality
   - Verify WebSocket connections
   - Check monitoring dashboards

---

## 🤝 Contributing

### For Agents

Agents should follow this process:
1. Pick task from WORKING.md
2. Implement feature
3. Write tests
4. Update documentation
5. Create pull request (or commit directly if authorized)
6. Update task status

### For Humans

If you want to contribute:
1. Check GITHUB_ISSUES_TEMPLATE.md for open issues
2. Pick an issue not assigned to an agent
3. Comment on issue to claim it
4. Follow standard Git workflow
5. Submit pull request
6. Update issue status

---

## 🎯 Success Criteria

### Week 1-2: Foundation
- [ ] All 3 core agents created
- [ ] Database models implemented
- [ ] Basic API working
- [ ] Heartbeat service running
- [ ] Agents can read/write WORKING.md

### Week 3-4: Core Features
- [ ] Agents assign tasks to each other
- [ ] Message threading works
- [ ] Document repository functional
- [ ] Basic dashboard showing agent status
- [ ] Real-time updates working

### Week 5-6: Autonomy
- [ ] Agents create tasks from roadmap
- [ ] Agents fetch external documentation
- [ ] Agents implement features independently
- [ ] System building itself with minimal human intervention

### Week 7-10: Polish
- [ ] All core features complete
- [ ] Tests passing
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Deployed to production

### Ultimate Success
- [ ] Agents build new features without human intervention
- [ ] System evolves itself based on user feedback
- [ ] Multiple agent teams work on different projects
- [ ] New agents onboarded automatically
- [ ] System generates value autonomously

---

## 📞 Support

### Getting Help

1. **Check Documentation:**
   - This quick start guide
   - MISSION_CONTROL_ROADMAP.md
   - API docs at /docs

2. **Check Activity Feed:**
   - See what agents are doing
   - Check for error messages
   - Review recent activities

3. **Ask an Agent:**
   - Create a task asking for help
   - Assign to Orchestrator agent
   - Agent will investigate and respond

4. **Community:**
   - GitHub Issues
   - Discord (coming soon)
   - Twitter: @AgentOS_dev

---

## 🎉 Next Steps

Now that you have Mission Control set up:

1. **Let agents work:** They should start implementing features from the roadmap
2. **Monitor progress:** Check dashboard daily
3. **Provide feedback:** Help agents when they're stuck
4. **Iterate:** System will improve as agents learn

**Remember:** The goal is for agents to build most of this themselves. Your job is to bootstrap them and provide guidance when needed.

Good luck! 🚀

---

*Last Updated: 2026-02-02*
*Version: 1.0*
