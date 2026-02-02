# [Dashboard] Build Jira-like task board UI

## 🎯 Objective
Create a simple web dashboard to visualize tasks, agents, and system status.

## 📋 Dependencies
- **REQUIRES**: #19 (Backend API must be running)
- **BLOCKS**: None (this is a visual layer)

## 🏗️ Implementation Details

### Option A: Simple HTML/JS (Recommended for PoC)
Single HTML file that calls the API.

### File to Create
`src/dashboard/index.html`

### Implementation
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgentOS Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .task-card { transition: transform 0.2s; }
    .task-card:hover { transform: translateY(-2px); }
  </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold">🤖 AgentOS Dashboard</h1>
      <p class="text-gray-400">Autonomous Development System</p>
    </header>

    <!-- Stats Row -->
    <div id="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-2xl font-bold" id="stat-inbox">-</div>
        <div class="text-gray-400">Inbox</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-2xl font-bold text-yellow-400" id="stat-progress">-</div>
        <div class="text-gray-400">In Progress</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-2xl font-bold text-purple-400" id="stat-review">-</div>
        <div class="text-gray-400">In Review</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-2xl font-bold text-green-400" id="stat-done">-</div>
        <div class="text-gray-400">Done</div>
      </div>
    </div>

    <!-- Agents Row -->
    <div class="mb-8">
      <h2 class="text-xl font-bold mb-4">Agents</h2>
      <div id="agents" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Agents loaded here -->
      </div>
    </div>

    <!-- Task Board -->
    <div class="mb-8">
      <h2 class="text-xl font-bold mb-4">Task Board</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="font-bold mb-4 text-gray-300">📥 Inbox</h3>
          <div id="col-inbox" class="space-y-2"></div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="font-bold mb-4 text-yellow-400">🔨 In Progress</h3>
          <div id="col-in_progress" class="space-y-2"></div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="font-bold mb-4 text-purple-400">👀 Review</h3>
          <div id="col-review" class="space-y-2"></div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="font-bold mb-4 text-green-400">✅ Done</h3>
          <div id="col-done" class="space-y-2"></div>
        </div>
      </div>
    </div>

    <!-- Activity Log -->
    <div>
      <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
      <div id="activity" class="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
        <!-- Activity loaded here -->
      </div>
    </div>
  </div>

  <script>
    const API_BASE = 'http://localhost:3001/api';

    async function loadStats() {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      document.getElementById('stat-inbox').textContent = data.tasks.inbox || 0;
      document.getElementById('stat-progress').textContent = data.tasks.in_progress || 0;
      document.getElementById('stat-review').textContent = data.tasks.review || 0;
      document.getElementById('stat-done').textContent = data.tasks.done || 0;
    }

    async function loadAgents() {
      const res = await fetch(`${API_BASE}/agents`);
      const agents = await res.json();
      const container = document.getElementById('agents');
      container.innerHTML = agents.map(a => `
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <span class="${a.status === 'online' ? 'text-green-400' : a.status === 'busy' ? 'text-yellow-400' : 'text-gray-500'}">●</span>
            <span class="font-bold">${a.name}</span>
          </div>
          <div class="text-gray-400 text-sm">${a.role}</div>
          <div class="text-gray-500 text-xs mt-2">Tasks: ${a.tasksAssigned?.length || 0}</div>
        </div>
      `).join('');
    }

    async function loadTasks() {
      const res = await fetch(`${API_BASE}/tasks?limit=50`);
      const tasks = await res.json();

      const columns = { inbox: [], assigned: [], in_progress: [], review: [], done: [], blocked: [] };
      tasks.forEach(t => {
        if (columns[t.status]) columns[t.status].push(t);
      });

      for (const [status, items] of Object.entries(columns)) {
        const col = document.getElementById(`col-${status}`);
        if (col) {
          col.innerHTML = items.map(t => `
            <div class="task-card bg-gray-700 rounded p-3 cursor-pointer" onclick="showTask('${t.id}')">
              <div class="font-medium text-sm">${t.title.substring(0, 40)}</div>
              ${t.assignee ? `<div class="text-xs text-gray-400 mt-1">👤 ${t.assignee.name}</div>` : ''}
            </div>
          `).join('');
        }
      }
    }

    async function loadActivity() {
      const res = await fetch(`${API_BASE}/activities?limit=20`);
      const activities = await res.json();
      const container = document.getElementById('activity');
      container.innerHTML = activities.map(a => `
        <div class="border-b border-gray-700 py-2 last:border-0">
          <span class="text-gray-500 text-xs">${new Date(a.createdAt).toLocaleTimeString()}</span>
          <span class="text-blue-400">${a.agent?.name || 'System'}</span>
          <span class="text-gray-300">${a.message || a.eventType}</span>
        </div>
      `).join('');
    }

    function showTask(id) {
      alert(`Task details: ${id}\n(Full modal coming soon)`);
    }

    async function refresh() {
      await Promise.all([loadStats(), loadAgents(), loadTasks(), loadActivity()]);
    }

    // Initial load
    refresh();
    // Auto-refresh every 30 seconds
    setInterval(refresh, 30000);
  </script>
</body>
</html>
```

### Serve the dashboard
Add to `src/api/server.ts`:
```typescript
import path from 'path';
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));
```

## ✅ Acceptance Criteria
- [ ] Shows task count by status
- [ ] Shows all agents with status indicators
- [ ] Kanban-style board with 4 columns
- [ ] Tasks grouped by status
- [ ] Activity log shows recent events
- [ ] Auto-refreshes every 30 seconds
- [ ] Works with API on localhost:3001
- [ ] Responsive design (mobile-friendly)

## 📁 Files to Create/Modify
- CREATE: `src/dashboard/index.html`
- MODIFY: `src/api/server.ts` (add static file serving)

## 🧪 Verification
```bash
npm run api
# Open http://localhost:3001/dashboard in browser
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`dashboard`, `ui`, `depends-on-19`
