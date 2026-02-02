#!/usr/bin/env python3
"""
Script to create GitHub issues for Mission Control development
Based on autonomous agents research and updated roadmap
"""

import os
import json

# GitHub issue templates based on research
ISSUES = [
    # ========== PHASE 0: FOUNDATION ==========
    {
        "title": "[Phase 0.1] Backend Project Structure Setup with FastAPI",
        "body": """## Description
Set up the initial FastAPI backend project structure with all necessary dependencies and configuration files.

## Context
This is the foundation for the Mission Control platform. We need a solid backend structure that can support autonomous agent operations.

## Tasks
- [ ] Create `/backend` directory structure
- [ ] Initialize Python virtual environment
- [ ] Create `requirements.txt` with:
  - FastAPI
  - SQLAlchemy
  - PostgreSQL driver (psycopg2)
  - Pydantic
  - Alembic
  - python-dotenv
- [ ] Create `backend/main.py` with basic FastAPI app
- [ ] Create `backend/core/config.py` for settings management
- [ ] Create `backend/api/` folder structure
- [ ] Add `.env.example` file with required environment variables
- [ ] Create `README.md` in backend folder with setup instructions

## Deliverables
- [ ] Working backend directory structure
- [ ] `requirements.txt` with all dependencies
- [ ] Basic FastAPI app that starts successfully
- [ ] Configuration management setup

## Acceptance Criteria
- [ ] `pip install -r requirements.txt` completes successfully
- [ ] `uvicorn main:app` starts the server without errors
- [ ] Health check endpoint returns 200 OK
- [ ] Environment variables loaded correctly

## Estimated Time
4-6 hours

## Labels
phase-0, backend, setup, priority-critical

## Dependencies
None - Can start immediately
""",
        "labels": ["phase-0", "backend", "setup", "priority-critical"]
    },
    
    {
        "title": "[Phase 0.2] Database Schema Design for Agent OS",
        "body": """## Description
Design and implement the complete database schema for Mission Control with SQLAlchemy models.

## Context
Based on the roadmap, we need 6 core models to support autonomous agent operations:
1. Agents
2. Tasks
3. Messages
4. Activities
5. Documents
6. Notifications

## Tasks

### Create SQLAlchemy Models

**Agents Model:**
- [ ] Create `backend/models/agent.py`
- [ ] Fields: id (UUID), name, role, status (enum: idle/active/blocked), session_key, capabilities (JSON), memory_context (TEXT), created_at, updated_at
- [ ] Add indexes for performance
- [ ] Add validation

**Tasks Model:**
- [ ] Create `backend/models/task.py`
- [ ] Fields: id, title, description, status (enum: inbox/assigned/in_progress/review/done), priority, assignee_ids (JSON), created_by (FK), parent_task_id (FK), created_at, updated_at, due_at
- [ ] Add relationships
- [ ] Add indexes

**Messages Model:**
- [ ] Create `backend/models/message.py`
- [ ] Fields: id, task_id (FK), from_agent_id (FK), content, attachments (JSON), message_type (enum), created_at
- [ ] Add relationships

**Activities Model:**
- [ ] Create `backend/models/activity.py`
- [ ] Fields: id, event_type, agent_id (FK), task_id (FK), message, metadata (JSON), created_at
- [ ] Add indexes for timeline queries

**Documents Model:**
- [ ] Create `backend/models/document.py`
- [ ] Fields: id, title, content (TEXT - Markdown), type (enum: deliverable/research/protocol), task_id (FK), created_by (FK), version, created_at, updated_at
- [ ] Add versioning support

**Notifications Model:**
- [ ] Create `backend/models/notification.py`
- [ ] Fields: id, mentioned_agent_id (FK), task_id (FK), content, delivered (bool), read (bool), created_at
- [ ] Add indexes

### Alembic Setup
- [ ] Initialize Alembic
- [ ] Create initial migration
- [ ] Test migration up/down
- [ ] Create seed data script

## Deliverables
- [ ] All 6 SQLAlchemy models
- [ ] Alembic migrations
- [ ] ER diagram (PNG/SVG)
- [ ] Database documentation
- [ ] Seed data script

## Acceptance Criteria
- [ ] All models pass validation
- [ ] Migrations run successfully
- [ ] Foreign keys properly configured
- [ ] Indexes created for query performance
- [ ] Seed data populates correctly

## Estimated Time
6-8 hours

## Labels
phase-0, backend, database, priority-critical

## Dependencies
#1 (Backend Project Setup)
""",
        "labels": ["phase-0", "backend", "database", "priority-critical"]
    },
    
    # ========== PHASE 1: CLAUDE AGENT SDK INTEGRATION ==========
    {
        "title": "[Phase 1.5] Integrate Claude Agent SDK for Autonomous Operations",
        "body": """## Description
Integrate Anthropic's Claude Agent SDK to enable truly autonomous agent capabilities with real tool usage.

## Context
**Based on research:** Claude Sonnet 4.5 with Agent SDK is the best option for autonomous coding agents. This integration is critical for enabling agents to actually perform actions, not just coordinate tasks.

## Research References
- Claude Agent SDK: https://platform.claude.com/docs/en/agent-sdk/quickstart
- GitHub Quickstart: https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding

## Tasks

### Install and Setup
- [ ] Install `claude-agent-sdk` and `anthropic` packages
- [ ] Set up API key management (encrypted storage)
- [ ] Create service configuration

### Create Agent Service
- [ ] Create `backend/services/claude_agent_service.py`
- [ ] Implement agent initialization
- [ ] Create task execution wrapper
- [ ] Add streaming response handling
- [ ] Implement error handling and retries

### Permission System
- [ ] Design permission levels (auto, ask, deny)
- [ ] Implement per-agent permission configuration
- [ ] Create permission checking middleware
- [ ] Add permission audit logging

### Tool Configuration
- [ ] Define allowed tools per agent type:
  - Read, Write, Edit (file operations)
  - Bash (command execution)
  - Git (version control)
  - Glob (file search)
- [ ] Implement tool access control
- [ ] Add tool usage logging

### Testing
- [ ] Test basic agent operations (read file)
- [ ] Test file editing capabilities
- [ ] Test command execution (sandboxed)
- [ ] Test permission enforcement
- [ ] Integration tests with database

## Example Implementation
```python
from claude_agent_sdk import query, ClaudeAgentOptions
import anthropic

class ClaudeAgentService:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
    
    async def execute_agent_task(
        self,
        agent_id: str,
        task_description: str,
        allowed_tools: list,
        permission_mode: str = "ask"
    ):
        async for message in query(
            prompt=task_description,
            options=ClaudeAgentOptions(
                allowed_tools=allowed_tools,
                permission_mode=permission_mode
            )
        ):
            await self.log_agent_action(agent_id, message)
            yield message
```

## Deliverables
- [ ] Claude agent service module
- [ ] Permission management system
- [ ] Action logging system
- [ ] Configuration templates
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests

## Acceptance Criteria
- [ ] Can create agent instances with Claude SDK
- [ ] Can execute tasks autonomously
- [ ] Permissions enforced correctly
- [ ] All actions logged with full audit trail
- [ ] Tests pass with 90%+ coverage
- [ ] API usage tracked for cost monitoring

## Estimated Time
8-10 hours

## Labels
phase-1, backend, ai-integration, priority-critical

## Dependencies
#1 (Backend Setup)
#2 (Database Schema)

## Security Notes
⚠️ Critical: All API keys must be encrypted at rest and never logged
⚠️ Implement rate limiting to prevent runaway costs
⚠️ Sandbox all code execution
""",
        "labels": ["phase-1", "backend", "ai-integration", "priority-critical"]
    },
    
    # ========== PHASE 2: MCP TOOL INTEGRATION ==========
    {
        "title": "[Phase 2.1] Set Up Model Context Protocol (MCP) Infrastructure",
        "body": """## Description
Deploy and configure Model Context Protocol (MCP) servers to enable standardized tool integration for autonomous agents.

## Context
**Based on research:** MCP is the "USB-C for AI applications" - it provides standardized tool access for agents. This eliminates the need for custom integrations per tool.

MCP allows agents to discover and use tools automatically with proper authentication and permissions.

## Research References
- MCP Docs: https://modelcontextprotocol.io/docs/getting-started/intro
- MCP Guide: https://noqta.tn/en/blog/mcp-protocol-guide-2026

## Tasks

### Research and Planning
- [ ] Study MCP architecture and protocols
- [ ] Identify required MCP servers:
  - GitHub MCP Server
  - File System MCP Server
  - Code Execution MCP Server
  - HTTP MCP Server (for API calls)
- [ ] Plan authentication strategy
- [ ] Design server registry system

### Deploy MCP Servers

**GitHub MCP Server:**
- [ ] Deploy via Docker: `ghcr.io/github/github-mcp-server`
- [ ] Configure with GitHub token
- [ ] Test connectivity
- [ ] Verify permissions

**File System MCP Server:**
- [ ] Install: `npm install -g @modelcontextprotocol/server-filesystem`
- [ ] Configure allowed paths
- [ ] Set read/write permissions
- [ ] Test file operations

**Code Execution MCP Server:**
- [ ] Create sandboxed Docker environment
- [ ] Implement resource limits (CPU, memory, network)
- [ ] Configure timeout mechanisms
- [ ] Add security measures
- [ ] Test with multiple languages (Python, Node, Go)

**HTTP MCP Server:**
- [ ] Deploy for API calls and web scraping
- [ ] Configure rate limiting
- [ ] Add request logging
- [ ] Test with sample APIs

### Backend Integration
- [ ] Create `backend/services/mcp_client.py`
- [ ] Implement MCP client for communication
- [ ] Create server registry database table
- [ ] Add server health monitoring
- [ ] Implement tool discovery mechanism
- [ ] Create authentication layer

### Configuration
- [ ] Add MCP server configs to `.env`
- [ ] Create MCP server documentation
- [ ] Set up monitoring and alerts

## Docker Compose Configuration
```yaml
services:
  github-mcp:
    image: ghcr.io/github/github-mcp-server
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    ports:
      - "3000:3000"
  
  code-executor-mcp:
    build: ./mcp-servers/code-executor
    volumes:
      - ./sandbox:/sandbox:ro
    security_opt:
      - no-new-privileges:true
```

## Deliverables
- [ ] All MCP servers deployed and running
- [ ] MCP client service in backend
- [ ] Server registry and health monitoring
- [ ] Authentication system
- [ ] Configuration documentation
- [ ] Tests for each server

## Acceptance Criteria
- [ ] All MCP servers running and healthy
- [ ] Agents can discover available tools automatically
- [ ] Authentication works for all servers
- [ ] Tools can be invoked successfully from agents
- [ ] Health monitoring reports server status
- [ ] Tests pass

## Estimated Time
10-12 hours

## Labels
phase-2, backend, infrastructure, mcp, priority-critical

## Dependencies
#3 (Claude Agent SDK Integration)

## Security Notes
⚠️ All MCP servers must use encrypted connections
⚠️ Implement proper authentication and authorization
⚠️ Audit log all tool invocations
⚠️ Sandbox code execution environment
""",
        "labels": ["phase-2", "backend", "infrastructure", "mcp", "priority-critical"]
    },
    
    {
        "title": "[Phase 2.2] Implement GitHub Operations via MCP",
        "body": """## Description
Enable autonomous agents to perform GitHub operations (issues, PRs, commits, reviews) using the GitHub MCP server.

## Context
Agents need to be able to interact with GitHub autonomously to:
- Create and update issues
- Create pull requests
- Commit and push code
- Review code changes
- Manage branches

This uses the GitHub MCP server deployed in Phase 2.1.

## Tasks

### GitHub MCP Configuration
- [ ] Configure GitHub MCP server with proper authentication
- [ ] Set up repository access permissions
- [ ] Test connection and authentication
- [ ] Verify API rate limits

### Create GitHub Operations Service
- [ ] Create `backend/services/github_operations.py`
- [ ] Implement wrapper functions for:
  - `create_issue(title, body, labels, assignees)`
  - `update_issue(issue_number, updates)`
  - `create_pull_request(title, body, head, base)`
  - `commit_files(files, message, branch)`
  - `create_branch(branch_name, from_branch)`
  - `merge_pull_request(pr_number)`
  - `review_code(pr_number, comments, approve/request_changes)`
  - `get_file_content(path, ref)`

### Permission System
- [ ] Define GitHub operation permissions per agent role
- [ ] Implement permission checks before operations
- [ ] Create approval workflow for critical operations (e.g., merging to main)
- [ ] Add permission audit logging

### Audit and Logging
- [ ] Log all GitHub operations with:
  - Agent ID
  - Operation type
  - Timestamp
  - Success/failure
  - Details
- [ ] Create GitHub operation dashboard
- [ ] Set up alerts for critical operations

### Testing
- [ ] Create test repository for integration tests
- [ ] Test issue creation and updates
- [ ] Test PR creation and merging
- [ ] Test code commits
- [ ] Test branch operations
- [ ] Test permission enforcement

## Example Usage
```python
# Agent creates an issue
github_ops = GitHubOperations(mcp_client)
issue = await github_ops.create_issue(
    title="Implement user authentication",
    body="## Description\\nAdd JWT-based authentication...",
    labels=["enhancement", "backend"],
    assignees=["agent:technical:main"]
)

# Agent commits code
await github_ops.commit_files(
    files={
        "backend/auth.py": "def authenticate():\\n    ...",
        "tests/test_auth.py": "def test_auth():\\n    ..."
    },
    message="feat: add JWT authentication",
    branch="feature/authentication"
)

# Agent creates PR
pr = await github_ops.create_pull_request(
    title="Add JWT authentication",
    body="Implements #123",
    head="feature/authentication",
    base="main"
)
```

## Deliverables
- [ ] GitHub operations service
- [ ] Permission system
- [ ] Audit logging
- [ ] Integration tests
- [ ] Documentation

## Acceptance Criteria
- [ ] Can create issues programmatically
- [ ] Can create and merge PRs
- [ ] Can commit code to branches
- [ ] Can review code
- [ ] All operations logged with full audit trail
- [ ] Permission system prevents unauthorized operations
- [ ] Tests pass with 90%+ coverage

## Estimated Time
12-14 hours

## Labels
phase-2, backend, github-integration, mcp, priority-critical

## Dependencies
#4 (MCP Infrastructure Setup)

## Security Notes
⚠️ Never commit secrets or API keys
⚠️ Implement approval workflow for merges to protected branches
⚠️ Rate limit GitHub operations
⚠️ Audit all operations
""",
        "labels": ["phase-2", "backend", "github-integration", "mcp", "priority-critical"]
    },
    
    {
        "title": "[Phase 2.3] Create Secure Code Execution Environment",
        "body": """## Description
Build a secure, sandboxed code execution environment that allows agents to run tests, execute scripts, and build projects safely.

## Context
Agents need to execute code to:
- Run unit tests
- Execute integration tests
- Build projects
- Lint code
- Run validation scripts

**Critical:** This must be highly secure to prevent malicious code execution.

## Tasks

### Docker-Based Sandbox
- [ ] Create base Docker images for:
  - Python (3.10, 3.11, 3.12)
  - Node.js (18, 20)
  - Go (1.20, 1.21)
  - Shell/Bash
- [ ] Configure resource limits:
  - CPU quota (50% of one core)
  - Memory limit (512MB)
  - Storage limit (1GB)
  - Network isolation (disabled by default)
- [ ] Set execution timeouts (30s default, configurable)
- [ ] Implement cleanup after execution

### Create Executor Service
- [ ] Create `backend/services/code_executor.py`
- [ ] Implement execution methods:
  - `execute_python(code, timeout, allow_network)`
  - `execute_javascript(code, timeout, allow_network)`
  - `execute_go(code, timeout, allow_network)`
  - `execute_shell(script, timeout, allow_network)`
- [ ] Capture stdout, stderr, and exit codes
- [ ] Handle timeouts gracefully
- [ ] Clean up containers after execution

### Security Measures
- [ ] Disable network by default (enable only when explicitly allowed)
- [ ] Run containers with minimal privileges
- [ ] Use read-only filesystems where possible
- [ ] Implement seccomp profiles to restrict syscalls
- [ ] Add AppArmor/SELinux profiles
- [ ] Scan code for obvious malicious patterns before execution
- [ ] Rate limit executions per agent

### Output Management
- [ ] Capture and structure output
- [ ] Limit output size (prevent log bombing)
- [ ] Parse test results (pytest, jest, etc.)
- [ ] Extract error messages and stack traces
- [ ] Return structured results

### Testing
- [ ] Test with sample Python scripts
- [ ] Test with Node.js code
- [ ] Test timeout enforcement
- [ ] Test resource limits
- [ ] Test network isolation
- [ ] Test malicious code detection
- [ ] Load testing with concurrent executions

## Example Implementation
```python
import docker
from typing import Dict

class SecureCodeExecutor:
    def __init__(self):
        self.client = docker.from_env()
        self.images = {
            'python': 'python:3.11-slim',
            'node': 'node:18-alpine',
            'go': 'golang:1.21-alpine'
        }
    
    async def execute(
        self,
        code: str,
        language: str,
        timeout: int = 30,
        allow_network: bool = False
    ) -> Dict:
        try:
            container = self.client.containers.run(
                self.images[language],
                command=["sh", "-c", code],
                remove=True,
                mem_limit="512m",
                cpu_period=100000,
                cpu_quota=50000,
                network_disabled=not allow_network,
                timeout=timeout,
                stdout=True,
                stderr=True
            )
            return {
                "success": True,
                "output": container.decode(),
                "exit_code": 0
            }
        except docker.errors.ContainerError as e:
            return {
                "success": False,
                "error": str(e),
                "exit_code": e.exit_status
            }
```

## Deliverables
- [ ] Sandboxed Docker environments
- [ ] Code executor service
- [ ] Security configurations
- [ ] Output parsing
- [ ] Tests (security & functionality)
- [ ] Documentation

## Acceptance Criteria
- [ ] Can execute Python code safely
- [ ] Can execute JavaScript code safely
- [ ] Can execute Go code safely
- [ ] Resource limits enforced correctly
- [ ] Network isolation works
- [ ] Timeout mechanism works
- [ ] No security vulnerabilities found
- [ ] Tests pass with 90%+ coverage
- [ ] Load test supports 10+ concurrent executions

## Estimated Time
14-16 hours

## Labels
phase-2, backend, security, code-execution, priority-critical

## Dependencies
#4 (MCP Infrastructure Setup)

## Security Notes
⚠️ CRITICAL: This is a high-security component
⚠️ Never allow unrestricted network access
⚠️ Always enforce resource limits
⚠️ Audit all code executions
⚠️ Regular security reviews required
⚠️ Keep Docker images updated with security patches
""",
        "labels": ["phase-2", "backend", "security", "code-execution", "priority-critical"]
    },
    
    # ========== PHASE 3: MULTI-AGENT ORCHESTRATION ==========
    {
        "title": "[Phase 3.1] Integrate CrewAI for Multi-Agent Orchestration",
        "body": """## Description
Integrate CrewAI framework to enable multiple specialized agents to work together hierarchically on complex tasks.

## Context
**Based on research:** CrewAI is a production-grade framework for orchestrating teams of AI agents with role-based task distribution. It's ideal for our use case where we need:
- Orchestrator agent (coordinates all agents)
- Technical agents (write code)
- QA agents (test and validate)
- DevOps agents (deploy and monitor)

## Research References
- CrewAI: https://www.aibars.net/en/library/open-source-ai/details/723192811276603392
- Multi-Agent Setup: https://amirteymoori.com/opencode-multi-agent-setup-specialized-ai-coding-agents/

## Tasks

### Install and Setup
- [ ] Install CrewAI: `pip install crewai crewai-tools`
- [ ] Study CrewAI architecture and patterns
- [ ] Design agent roles and responsibilities
- [ ] Plan task delegation workflows

### Create Agent Definitions

**Orchestrator Agent:**
- [ ] Role: Mission Orchestrator
- [ ] Goal: Coordinate all agents and ensure mission success
- [ ] Backstory: Experienced project manager
- [ ] Tools: Task creation, assignment, status checking
- [ ] Delegation: Enabled (can delegate to other agents)

**Technical Agent:**
- [ ] Role: Senior Software Engineer
- [ ] Goal: Write high-quality code
- [ ] Backstory: 10+ years full-stack experience
- [ ] Tools: File operations, code execution, GitHub commits
- [ ] Delegation: Limited (can ask for help)

**QA Agent:**
- [ ] Role: QA Engineer
- [ ] Goal: Ensure code quality and catch bugs
- [ ] Backstory: Meticulous tester
- [ ] Tools: Test execution, code review, issue creation
- [ ] Delegation: Limited

**DevOps Agent:**
- [ ] Role: DevOps Engineer
- [ ] Goal: Deploy applications reliably
- [ ] Backstory: Expert in deployment and monitoring
- [ ] Tools: Deployment, health checks, rollback, logs
- [ ] Delegation: Limited

### Implement Crew Orchestration
- [ ] Create `backend/services/crew_orchestrator.py`
- [ ] Implement agent factory
- [ ] Create task creation and delegation logic
- [ ] Implement hierarchical process (orchestrator-led)
- [ ] Add agent communication layer
- [ ] Implement result aggregation

### Tool Integration
- [ ] Connect CrewAI agents to MCP tools
- [ ] Create tool wrappers for CrewAI format
- [ ] Implement tool permission checks
- [ ] Add tool usage logging

### Testing
- [ ] Test single agent execution
- [ ] Test multi-agent collaboration
- [ ] Test task delegation
- [ ] Test hierarchical workflow
- [ ] Integration tests with database

## Example Implementation
```python
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool

class MissionControlCrew:
    def __init__(self):
        self.setup_agents()
    
    def setup_agents(self):
        self.orchestrator = Agent(
            role='Mission Orchestrator',
            goal='Coordinate all agents and ensure mission success',
            backstory='Experienced PM with strong technical background',
            tools=[self.create_task, self.assign_task],
            allow_delegation=True,
            verbose=True
        )
        
        self.technical = Agent(
            role='Senior Software Engineer',
            goal='Write high-quality code',
            backstory='10+ years of full-stack development',
            tools=[self.read_file, self.write_file, self.commit],
            verbose=True
        )
        
        self.qa = Agent(
            role='QA Engineer',
            goal='Ensure code quality',
            backstory='Meticulous tester who catches bugs',
            tools=[self.run_tests, self.review_code],
            verbose=True
        )
    
    async def execute_mission(self, goal: str):
        tasks = self.break_down_goal(goal)
        crew = Crew(
            agents=[self.orchestrator, self.technical, self.qa],
            tasks=tasks,
            process=Process.hierarchical,
            manager_agent=self.orchestrator,
            verbose=True
        )
        result = crew.kickoff()
        return result
```

## Deliverables
- [ ] CrewAI integration service
- [ ] Agent definitions (Orchestrator, Technical, QA, DevOps)
- [ ] Task delegation system
- [ ] Tool integrations
- [ ] Tests (unit & integration)
- [ ] Documentation

## Acceptance Criteria
- [ ] Can create specialized agents with CrewAI
- [ ] Agents can delegate tasks to each other
- [ ] Orchestrator coordinates workflow hierarchically
- [ ] Agents use real tools (GitHub, code execution, deployment)
- [ ] Task results properly aggregated
- [ ] Tests pass with 90%+ coverage

## Estimated Time
16-20 hours

## Labels
phase-3, backend, ai-orchestration, crewai, priority-critical

## Dependencies
#3 (Claude Agent SDK)
#5 (GitHub Operations)
#6 (Code Execution)

## Notes
💡 CrewAI enables true multi-agent collaboration
💡 Hierarchical process ensures orchestrator maintains control
💡 Each agent can specialize in their domain
""",
        "labels": ["phase-3", "backend", "ai-orchestration", "crewai", "priority-critical"]
    },
    
    {
        "title": "[Phase 3.2] Implement Agent Memory System with Vector Database",
        "body": """## Description
Create a persistent memory system for agents using Qdrant vector database to enable context retention and learning.

## Context
Agents need memory to:
- Remember previous interactions and outcomes
- Learn from past successes and failures
- Share knowledge between agents
- Maintain context across sessions
- Retrieve relevant information semantically

**Based on research:** Qdrant is open-source, self-hostable, and integrates well with AI agents.

## Tasks

### Set Up Qdrant
- [ ] Deploy Qdrant via Docker
- [ ] Create collections for:
  - Agent memories
  - Task outcomes
  - Code patterns
  - Best practices
- [ ] Configure vector dimensions (1536 for OpenAI embeddings)
- [ ] Set up authentication
- [ ] Configure backup/restore

### Create Memory Service
- [ ] Create `backend/services/agent_memory.py`
- [ ] Implement embedding generation:
  - Choose provider (Claude or OpenAI)
  - Create embedding function
  - Add caching for efficiency
- [ ] Implement memory storage:
  - `store_context(agent_id, context, metadata)`
  - `store_outcome(task_id, outcome, success)`
  - `store_pattern(pattern_type, code, description)`
- [ ] Implement memory retrieval:
  - `retrieve_relevant(agent_id, query, limit)`
  - `get_similar_patterns(code, limit)`
  - `get_task_history(agent_id, limit)`

### Memory Management
- [ ] Implement memory compression (summarization)
- [ ] Add memory pruning (remove old/irrelevant memories)
- [ ] Create memory importance scoring
- [ ] Implement memory expiration
- [ ] Add memory statistics

### Knowledge Sharing
- [ ] Enable agents to share memories
- [ ] Implement knowledge transfer between agents
- [ ] Create team memory (accessible by all agents)
- [ ] Add knowledge verification

### Integration with Agents
- [ ] Integrate with Claude Agent SDK
- [ ] Add memory retrieval before task execution
- [ ] Store outcomes after task completion
- [ ] Enable agents to query their own memory
- [ ] Add memory to agent context window

### Testing
- [ ] Test memory storage and retrieval
- [ ] Test semantic search accuracy
- [ ] Test knowledge sharing
- [ ] Test memory compression
- [ ] Performance testing with large datasets

## Example Implementation
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import anthropic
import uuid
from datetime import datetime

class AgentMemory:
    def __init__(self):
        self.qdrant = QdrantClient(host="localhost", port=6333)
        self.anthropic = anthropic.Anthropic()
        self.collection = "agent_memory"
        self.setup_collection()
    
    def setup_collection(self):
        self.qdrant.create_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(
                size=1536,
                distance=Distance.COSINE
            )
        )
    
    async def store_context(
        self,
        agent_id: str,
        context: str,
        metadata: dict = None
    ):
        # Generate embedding
        embedding = await self.generate_embedding(context)
        
        # Store in Qdrant
        self.qdrant.upsert(
            collection_name=self.collection,
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "agent_id": agent_id,
                        "context": context,
                        "timestamp": datetime.utcnow().isoformat(),
                        **(metadata or {})
                    }
                )
            ]
        )
    
    async def retrieve_relevant(
        self,
        agent_id: str,
        query: str,
        limit: int = 5
    ):
        query_embedding = await self.generate_embedding(query)
        
        results = self.qdrant.search(
            collection_name=self.collection,
            query_vector=query_embedding,
            query_filter={
                "must": [
                    {"key": "agent_id", "match": {"value": agent_id}}
                ]
            },
            limit=limit
        )
        
        return [hit.payload["context"] for hit in results]
```

## Deliverables
- [ ] Qdrant deployment (Docker)
- [ ] Agent memory service
- [ ] Embedding generation
- [ ] Memory compression
- [ ] Knowledge sharing system
- [ ] Tests
- [ ] Documentation

## Acceptance Criteria
- [ ] Can store agent context with embeddings
- [ ] Can retrieve relevant context semantically
- [ ] Semantic search returns accurate results
- [ ] Agents can share knowledge
- [ ] Memory doesn't grow unbounded (compression works)
- [ ] Performance acceptable (< 100ms retrieval)
- [ ] Tests pass with 90%+ coverage

## Estimated Time
14-16 hours

## Labels
phase-3, backend, ai-memory, vector-database, priority-high

## Dependencies
#7 (CrewAI Integration)

## Cost Notes
💰 Qdrant is free and self-hostable
💰 Embedding generation will use API calls (Claude or OpenAI)
💰 Estimate ~$50-100/month for embedding generation at scale
""",
        "labels": ["phase-3", "backend", "ai-memory", "vector-database", "priority-high"]
    },
    
    # ========== RAILWAY DEPLOYMENT ==========
    {
        "title": "[Phase 2.4] Railway Deployment Integration",
        "body": """## Description
Enable autonomous agents to deploy applications to Railway platform automatically.

## Context
Agents need to be able to deploy applications to Railway to close the loop on full autonomy:
1. Write code
2. Test code
3. Deploy code
4. Monitor deployment

Railway provides a simple deployment API/CLI that agents can use.

## Tasks

### Research Railway API
- [ ] Study Railway API documentation
- [ ] Identify authentication methods
- [ ] Map required operations:
  - Trigger deployment
  - Manage environment variables
  - Check deployment status
  - View logs
  - Rollback deployment
- [ ] Understand Railway GraphQL API

### Create Deployment Service
- [ ] Create `backend/services/railway_deployer.py`
- [ ] Implement Railway API client
- [ ] Implement operations:
  - `deploy(project_id, service_id)`
  - `set_env_var(service_id, key, value)`
  - `get_deployment_status(deployment_id)`
  - `get_logs(deployment_id, lines)`
  - `rollback(service_id, deployment_id)`
- [ ] Add error handling and retries
- [ ] Implement deployment monitoring

### Deployment Workflow
- [ ] Create deployment pipeline:
  1. Validate code (tests pass)
  2. Commit to GitHub
  3. Trigger Railway deployment
  4. Monitor deployment progress
  5. Run smoke tests
  6. Rollback if smoke tests fail
- [ ] Add deployment notifications
- [ ] Create deployment history

### Environment Management
- [ ] Implement secure env var management
- [ ] Add env var encryption
- [ ] Create env var templates
- [ ] Implement env var validation

### Monitoring
- [ ] Monitor deployment health
- [ ] Check application health endpoints
- [ ] Parse deployment logs
- [ ] Alert on deployment failures

### Testing
- [ ] Create test Railway project
- [ ] Test deployment trigger
- [ ] Test env var management
- [ ] Test rollback
- [ ] Test monitoring

## Example Implementation
```python
import requests
import time

class RailwayDeployer:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://backboard.railway.app/graphql"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
    
    async def deploy(self, project_id: str, service_id: str):
        mutation = '''
        mutation deploymentTrigger($serviceId: String!) {
            deploymentTrigger(serviceId: $serviceId) {
                id
                status
            }
        }
        '''
        
        response = requests.post(
            self.base_url,
            json={
                "query": mutation,
                "variables": {"serviceId": service_id}
            },
            headers=self.headers
        )
        
        deployment = response.json()["data"]["deploymentTrigger"]
        
        # Monitor deployment
        return await self.monitor_deployment(deployment["id"])
    
    async def monitor_deployment(self, deployment_id: str):
        while True:
            status = await self.get_status(deployment_id)
            
            if status == "SUCCESS":
                return {"success": True, "deployment_id": deployment_id}
            elif status == "FAILED":
                logs = await self.get_logs(deployment_id)
                return {
                    "success": False,
                    "error": logs,
                    "deployment_id": deployment_id
                }
            
            await asyncio.sleep(10)  # Check every 10 seconds
```

## Deliverables
- [ ] Railway deployment service
- [ ] Deployment pipeline
- [ ] Environment management
- [ ] Monitoring system
- [ ] Rollback functionality
- [ ] Tests
- [ ] Documentation

## Acceptance Criteria
- [ ] Can trigger deployments via API
- [ ] Can manage environment variables
- [ ] Can monitor deployment status
- [ ] Can view deployment logs
- [ ] Can rollback failed deployments
- [ ] Deployment pipeline automated
- [ ] Tests pass

## Estimated Time
10-12 hours

## Labels
phase-2, backend, deployment, railway, priority-high

## Dependencies
#5 (GitHub Operations)
#6 (Code Execution)

## Notes
💡 Railway simplifies deployment - no complex Kubernetes needed
💡 GraphQL API is powerful and well-documented
⚠️ Store Railway tokens securely
⚠️ Implement approval workflow for production deployments
""",
        "labels": ["phase-2", "backend", "deployment", "railway", "priority-high"]
    },
    
    # ========== DOCUMENTATION ==========
    {
        "title": "[Documentation] Create Implementation Guide for Autonomous Agents",
        "body": """## Description
Create comprehensive documentation for implementing and deploying the autonomous agent system.

## Context
We've completed extensive research on autonomous agents (OpenClaw, OpenCode, Claude Agent SDK, CrewAI, MCP). We need documentation that helps developers implement and deploy this system.

## Research Documents Already Created
- ✅ AUTONOMOUS_AGENTS_INVESTIGATION.md (28KB)
- ✅ UPDATED_MISSION_CONTROL_ROADMAP.md (28KB)
- ✅ MISSION_CONTROL_ROADMAP.md (original - 33KB)
- ✅ GITHUB_ISSUES_TEMPLATE.md (56 issues)
- ✅ QUICK_START_GUIDE.md
- ✅ WORKING.md (agent coordination template)

## Tasks

### Developer Guides
- [ ] Create `docs/DEVELOPER_GUIDE.md`:
  - Setting up development environment
  - Installing dependencies
  - Configuring MCP servers
  - Running locally
  - Testing changes

- [ ] Create `docs/AGENT_DEVELOPMENT.md`:
  - How to create new agents
  - Agent best practices
  - Tool integration guide
  - Permission configuration
  - Testing agents

- [ ] Create `docs/MCP_INTEGRATION.md`:
  - MCP architecture overview
  - How to add new MCP servers
  - Custom tool development
  - Authentication setup
  - Troubleshooting

### Deployment Guides
- [ ] Create `docs/DEPLOYMENT_RAILWAY.md`:
  - Railway setup
  - Environment configuration
  - Database setup
  - Monitoring setup

- [ ] Create `docs/DEPLOYMENT_SELF_HOSTED.md`:
  - Docker setup
  - Kubernetes configuration
  - SSL/TLS setup
  - Backup procedures

### Operations Guides
- [ ] Create `docs/OPERATIONS.md`:
  - Monitoring agents
  - Cost management (LLM API)
  - Security best practices
  - Incident response
  - Scaling guidelines

- [ ] Create `docs/TROUBLESHOOTING.md`:
  - Common issues
  - Debug procedures
  - Log analysis
  - Performance tuning

### API Documentation
- [ ] Generate OpenAPI specification
- [ ] Create API examples
- [ ] Document WebSocket protocol
- [ ] Create Postman collection

### Architecture Documentation
- [ ] Update architecture diagrams
- [ ] Document data flow
- [ ] Document security model
- [ ] Create sequence diagrams for key workflows

### Video/Tutorial Content
- [ ] Script for setup walkthrough
- [ ] Demo scenarios
- [ ] Best practices video outline

## Deliverables
- [ ] Complete developer documentation
- [ ] Deployment guides
- [ ] Operations manual
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Tutorial scripts

## Acceptance Criteria
- [ ] Developer can set up system from docs alone
- [ ] All deployment options documented
- [ ] Common issues have solutions
- [ ] API fully documented
- [ ] Architecture clearly explained

## Estimated Time
8-10 hours

## Labels
documentation, priority-medium

## Dependencies
All implementation issues should be completed or in progress
""",
        "labels": ["documentation", "priority-medium"]
    },
]

def main():
    """Generate GitHub issue creation script"""
    print("#!/bin/bash")
    print("# Script to create GitHub issues for Mission Control")
    print("# Generated from autonomous agents research")
    print()
    print("set -e")
    print()
    print("# Check if gh CLI is authenticated")
    print("if ! gh auth status > /dev/null 2>&1; then")
    print("    echo 'Error: GitHub CLI not authenticated'")
    print("    echo 'Please run: gh auth login'")
    print("    exit 1")
    print("fi")
    print()
    print("echo 'Creating GitHub issues for Mission Control...'")
    print()
    
    for i, issue in enumerate(ISSUES, 1):
        # Escape body content for shell
        body = issue['body'].replace('`', '\\`').replace('"', '\\"').replace('$', '\\$')
        labels = ','.join(issue['labels'])
        
        print(f"# Issue {i}: {issue['title']}")
        print(f"gh issue create \\")
        print(f"    --title \"{issue['title']}\" \\")
        print(f"    --body \"{body}\" \\")
        print(f"    --label \"{labels}\"")
        print()
        print(f"echo 'Created issue {i}/{len(ISSUES)}'")
        print()
    
    print("echo 'All issues created successfully!'")
    print("echo 'View issues at: https://github.com/GDemay/agent-os/issues'")

if __name__ == "__main__":
    main()
