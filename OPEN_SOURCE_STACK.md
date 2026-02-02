# Mission Control - Open Source Stack
## 100% Free and Open Source Autonomous Agent Architecture

**Date:** 2026-02-02  
**Focus:** Open source and free software only  
**Status:** Updated based on feedback - No proprietary dependencies

---

## 🎯 Executive Summary

**Mission Control will use 100% open source and free software:**

### Core Stack (All Open Source)
1. **LLM**: Kimi K2.5 (open source, free)
2. **Coding Agent**: OpenCode (open source, MIT license)
3. **Orchestration**: CrewAI (open source)
4. **Vector DB**: Qdrant (open source, self-hostable)
5. **Backend**: FastAPI (open source)
6. **Frontend**: React + Vite + Tailwind + Shadcn UI (all open source)
7. **Database**: PostgreSQL (open source)
8. **Deployment**: Self-hosted with Docker (open source)

**Zero proprietary dependencies. Zero API costs for LLM.**

---

## 🌟 Why Kimi K2.5?

### Overview
- **Developer**: Moonshot AI (China)
- **License**: Open source
- **Cost**: FREE
- **Size**: 1 trillion parameters
- **Context**: 128K-256K tokens

### Key Features

**1. Self-Orchestrated Agent Swarm**
- Spins up to 100 sub-agents dynamically
- Parallel execution of 1,500 tool calls
- No pre-configuration needed
- Fully autonomous task decomposition

**2. State-of-the-Art Coding**
- Leads on SWE-Bench Verified
- Leads on LiveCodeBench
- **Multimodal coding**: Generate code from:
  - Text descriptions
  - Images/screenshots
  - Videos
  - Sketches
- Can reconstruct websites from video
- Visual debugging capabilities

**3. Open Source Benefits**
- Download and run locally
- No API costs
- No rate limits
- Full privacy
- Customizable
- Community support

**4. Compatible with OpenCode**
- Works with VSCode, Cursor, Zed
- Integrates with OpenHands, RooCode, Kilo Code
- Supports standard coding agent workflows

### Benchmarks
| Benchmark | Kimi K2.5 | Claude Sonnet 4.5 | GPT-4o |
|-----------|-----------|-------------------|--------|
| SWE-Bench Verified | **#1** | #2 | #3 |
| LiveCodeBench | **#1** | #2 | #3 |
| Cost | **FREE** | $15/1M tokens | $5/1M tokens |
| License | **Open Source** | Proprietary | Proprietary |

---

## 🛠️ OpenCode Integration

### Overview
- **License**: MIT (open source)
- **Stars**: 80,000+ on GitHub
- **Type**: AI coding agent framework
- **Privacy**: Local-first, all data stays on your machine

### Key Features

**1. Multi-Agent Architecture**
- Primary agents: Build and Plan
- Subagents: General and Explore
- Each agent customizable with JSON config

**2. Works with Any LLM**
- Kimi K2.5 (recommended - free & open source)
- Ollama for local models
- 75+ supported models via Models.dev

**3. Deep IDE Integration**
- VSCode extension
- Terminal interface
- Desktop app
- Language Server Protocol (LSP) support

**4. Granular Permissions**
- Per-agent tool access control
- Allow/ask/deny rules
- Command pattern restrictions
- Safe by default

### Example Configuration for Kimi K2.5
```json
{
  "agent": {
    "technical": {
      "mode": "primary",
      "model": "kimi-k2.5",
      "temperature": 0.1,
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": "ask",
        "git": true
      },
      "permissions": {
        "allow_patterns": ["src/**", "tests/**"],
        "deny_patterns": [".env", "secrets/**"]
      }
    }
  }
}
```

---

## 🏗️ Updated Architecture (100% Open Source)

```
┌────────────────────────────────────────────────────────────┐
│          Mission Control Web Platform                       │
│    (React + FastAPI + PostgreSQL - All Open Source)         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────┐
│         CrewAI Multi-Agent Orchestration (Open Source)      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Orchestrator │  │  Technical   │  │    QA        │    │
│  │    Agent     │  │   Agents     │  │  Agents      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────┐
│         Kimi K2.5 LLM (Open Source, Free)                  │
│                  +                                          │
│         OpenCode Coding Agent (Open Source, MIT)           │
│                                                             │
│  Each agent uses Kimi K2.5 via OpenCode with:             │
│  - File system access (read, write, edit)                  │
│  - GitHub operations (via git CLI)                         │
│  - Code execution (tests, builds, linting)                 │
│  - Deployment automation                                   │
│  - Visual debugging                                        │
│  - Multimodal understanding                                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────┐
│          Tool Integrations (Open Source)                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Git CLI        │  │ File System     │                │
│  │  (native)       │  │ (native)        │                │
│  └─────────────────┘  └─────────────────┘                │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Docker          │  │ Railway CLI     │                │
│  │ (open source)   │  │ (free tier)     │                │
│  └─────────────────┘  └─────────────────┘                │
└────────────────────────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────┐
│       Qdrant Vector Database (Open Source)                 │
│       - Agent memory                                       │
│       - Knowledge sharing                                  │
│       - Self-hostable                                      │
└────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Comparison

### Proprietary Stack (Original)
| Component | Cost/Month |
|-----------|-----------|
| Claude API | $1000-3000 |
| Infrastructure | $200-800 |
| **Total** | **$1200-3800** |

### Open Source Stack (Updated)
| Component | Cost/Month |
|-----------|-----------|
| Kimi K2.5 (self-hosted) | **$0** |
| OpenCode | **$0** |
| CrewAI | **$0** |
| Qdrant (self-hosted) | **$0** |
| Infrastructure | $200-800* |
| **Total** | **$200-800** |

*Infrastructure only (VPS/server). Can be $0 if using existing hardware.

**Savings: $1000-3000/month = $12,000-36,000/year**

---

## 🚀 Implementation Plan

### Phase 1: Set Up Kimi K2.5 (Week 1)

**Download and Install:**
```bash
# Option 1: Download from Hugging Face
huggingface-cli download moonshotai/kimi-k2.5

# Option 2: Use NVIDIA NIM (requires GPU)
docker pull nvcr.io/nvidia/moonshotai/kimi-k2.5

# Option 3: Use vLLM for efficient serving
pip install vllm
vllm serve moonshotai/kimi-k2.5 --gpu-memory-utilization 0.95
```

**Hardware Requirements:**
- **Minimum**: 4x A100 (80GB) or equivalent
- **Recommended**: 8x H100 (80GB) for production
- **Alternative**: Use Moonshot AI's API (still free/open)

**Test Installation:**
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="kimi-k2.5",
    messages=[
        {"role": "user", "content": "Write a Python function to calculate Fibonacci"}
    ]
)

print(response.choices[0].message.content)
```

---

### Phase 2: Install OpenCode (Week 1)

**Installation:**
```bash
# Via curl
curl -fsSL https://opencode.sh | sh

# Via npm
npm install -g @opencode/cli

# Via Homebrew
brew install opencode
```

**Configure for Kimi K2.5:**
```bash
# Create config directory
mkdir -p ~/.config/opencode/agent

# Create technical agent config
cat > ~/.config/opencode/agent/technical.json << EOF
{
  "agent": {
    "technical": {
      "mode": "primary",
      "model": "kimi-k2.5",
      "base_url": "http://localhost:8000/v1",
      "temperature": 0.1,
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": "ask",
        "git": true
      }
    }
  }
}
EOF
```

**Test OpenCode:**
```bash
# Start coding session
opencode agent technical --task "Create a simple FastAPI app"

# The agent will:
# 1. Create app.py
# 2. Add dependencies
# 3. Write tests
# 4. Run tests
# All using Kimi K2.5 locally
```

---

### Phase 3: Integrate with CrewAI (Week 2)

**Install CrewAI:**
```bash
pip install crewai crewai-tools
```

**Create Agents with Kimi K2.5:**
```python
from crewai import Agent, Task, Crew
from langchain_community.llms import VLLMOpenAI

# Configure Kimi K2.5
kimi_llm = VLLMOpenAI(
    openai_api_base="http://localhost:8000/v1",
    openai_api_key="not-needed",
    model_name="kimi-k2.5",
    temperature=0.1
)

# Create agents
orchestrator = Agent(
    role='Mission Orchestrator',
    goal='Coordinate all agents and ensure mission success',
    backstory='Experienced PM with technical background',
    llm=kimi_llm,
    tools=[create_task, assign_task],
    allow_delegation=True,
    verbose=True
)

technical = Agent(
    role='Senior Software Engineer',
    goal='Write high-quality code',
    backstory='10+ years full-stack development',
    llm=kimi_llm,
    tools=[opencode_tool, git_tool, docker_tool],
    verbose=True
)

# Create crew
crew = Crew(
    agents=[orchestrator, technical],
    tasks=[...],
    verbose=True
)

# Execute
result = crew.kickoff()
```

---

### Phase 4: Deploy Qdrant (Week 2)

**Install Qdrant:**
```bash
# Via Docker
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant

# Via binary (for production)
wget https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz
tar -xvf qdrant-x86_64-unknown-linux-gnu.tar.gz
./qdrant
```

**Configure Agent Memory:**
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="agent_memory",
    vectors_config=VectorParams(
        size=1536,  # embedding dimension
        distance=Distance.COSINE
    )
)

# Store agent memory
async def store_memory(agent_id: str, context: str):
    # Generate embedding using Kimi K2.5
    embedding = await generate_embedding_with_kimi(context)
    
    # Store in Qdrant
    client.upsert(
        collection_name="agent_memory",
        points=[{
            "id": str(uuid.uuid4()),
            "vector": embedding,
            "payload": {
                "agent_id": agent_id,
                "context": context,
                "timestamp": datetime.utcnow().isoformat()
            }
        }]
    )
```

---

## 🔧 Tool Integration (All Open Source)

### GitHub Operations
```python
import subprocess

def git_commit(files: list, message: str):
    """Commit files using git CLI"""
    for file in files:
        subprocess.run(["git", "add", file])
    subprocess.run(["git", "commit", "-m", message])
    subprocess.run(["git", "push"])
```

### Code Execution
```python
import docker

def execute_code_safely(code: str, language: str):
    """Execute code in Docker container"""
    client = docker.from_env()
    
    container = client.containers.run(
        f"{language}:latest",
        command=["sh", "-c", code],
        remove=True,
        mem_limit="512m",
        cpu_quota=50000,
        network_disabled=True,
        stdout=True,
        stderr=True
    )
    
    return container.decode()
```

### Railway Deployment
```bash
# Install Railway CLI (free tier available)
npm install -g @railway/cli

# Deploy
railway up

# Or use Python SDK
pip install railway-python
```

---

## 🎯 Advantages of Open Source Stack

### 1. **Zero API Costs**
- Kimi K2.5 runs locally - no per-token fees
- Save $12,000-36,000 per year
- Unlimited usage

### 2. **Full Privacy**
- All data stays on your servers
- No data sent to third parties
- GDPR/HIPAA compliant by default

### 3. **No Rate Limits**
- Run as many agents as hardware allows
- No throttling
- No quotas

### 4. **Complete Control**
- Modify model if needed
- Custom fine-tuning possible
- Deploy anywhere

### 5. **Community Support**
- Active open source communities
- Regular updates
- Transparent development

### 6. **No Vendor Lock-in**
- Switch models anytime
- Change infrastructure freely
- Export all data

---

## 📊 Hardware Requirements

### Development (Local Testing)
- **CPU**: 32+ cores
- **RAM**: 128GB+
- **GPU**: 1x A100 (80GB) or 2x A6000 (48GB each)
- **Storage**: 500GB SSD
- **Cost**: $5,000-10,000 one-time (or cloud GPU ~$3-5/hour)

### Production (Multiple Agents)
- **CPU**: 64+ cores
- **RAM**: 256GB+
- **GPU**: 4x A100 (80GB) or 2x H100 (80GB)
- **Storage**: 2TB NVMe SSD
- **Cost**: $20,000-40,000 one-time (or cloud ~$10-20/hour)

### Cloud Alternatives
- **Vast.ai**: Rent GPUs from $0.50-2/hour
- **Lambda Labs**: A100 at $1.10/hour
- **RunPod**: Flexible GPU rentals
- **Moonshot AI Cloud**: Kimi K2.5 hosted (may have free tier)

---

## 🔒 Security Benefits

### Open Source = Auditable
- All code visible
- No hidden telemetry
- Community security reviews
- CVEs published openly

### Self-Hosted = Secure
- No data exfiltration
- Air-gap possible
- Full audit trail
- Compliance-ready

---

## 📝 Migration from Proprietary Stack

### If Already Using Claude
```python
# Old (Proprietary)
from anthropic import Anthropic
client = Anthropic(api_key="sk-...")

# New (Open Source)
from openai import OpenAI
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

# Same API, zero cost
```

### Benefits
- Drop-in replacement
- Same API format (OpenAI-compatible)
- No code changes needed
- Instant savings

---

## 🎓 Learning Resources

### Kimi K2.5
- Official site: https://kimik2.com/
- Technical report: https://www.kimi.com/blog/kimi-k2-5.html
- Hugging Face: https://huggingface.co/moonshotai/kimi-k2.5
- Setup guides: https://platform.moonshot.ai/

### OpenCode
- GitHub: https://github.com/anomalyco/opencode
- Docs: https://open-code.ai/en/docs/agents
- VSCode extension: https://marketplace.visualstudio.com/items?itemName=opencode.opencode

### CrewAI
- GitHub: https://github.com/joaomdmoura/crewAI
- Docs: https://docs.crewai.com/

### Qdrant
- GitHub: https://github.com/qdrant/qdrant
- Docs: https://qdrant.tech/documentation/

---

## ✅ Updated GitHub Issues

The 10 GitHub issues will be updated to reflect open source stack:

1. **Issue #1-2**: Same (Backend + Database)
2. **Issue #3**: ~~Claude Agent SDK~~ → **Kimi K2.5 + OpenCode Integration**
3. **Issue #4**: Same (MCP can still be used, but native tools also work)
4. **Issue #5**: GitHub via git CLI instead of MCP
5. **Issue #6**: Same (Docker sandboxing)
6. **Issue #7**: Railway CLI instead of API
7. **Issue #8**: CrewAI with Kimi K2.5 (open source)
8. **Issue #9**: Qdrant (already open source)
9. **Issue #10**: Same (Documentation)

---

## 🚀 Next Steps

### Immediate (This Week)
1. Set up Kimi K2.5 locally or cloud
2. Install OpenCode
3. Test integration
4. Update GitHub issues

### Week 2
1. Integrate CrewAI with Kimi K2.5
2. Deploy Qdrant
3. Build first autonomous workflow

### Week 3-6
1. Complete backend (FastAPI + PostgreSQL)
2. Build frontend (React)
3. Deploy production system
4. **Zero API costs, full autonomy**

---

## 🎉 Summary

**100% Open Source Stack:**
- ✅ Kimi K2.5 (LLM) - FREE
- ✅ OpenCode (Coding Agent) - FREE
- ✅ CrewAI (Orchestration) - FREE
- ✅ Qdrant (Vector DB) - FREE
- ✅ FastAPI, React, PostgreSQL - FREE
- ✅ Docker, Git - FREE

**Zero proprietary dependencies.**
**Zero monthly API costs.**
**Full control and privacy.**
**Production-grade autonomous agents.**

**The future of autonomous agents is open source.** 🚀

---

*Last Updated: 2026-02-02*  
*Status: Ready for Implementation*  
*License: All components open source*  
*Cost: Hardware only, no API fees*
