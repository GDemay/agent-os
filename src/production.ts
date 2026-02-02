import express from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

let apiProcess: ChildProcess | null = null;
let kernelProcess: ChildProcess | null = null;

// Start API server
function startAPI() {
  console.log('[Production] Starting API server...');
  apiProcess = spawn('node', [path.join(__dirname, 'api', 'server.js')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  apiProcess.on('error', (error) => {
    console.error('[Production] API error:', error);
  });

  apiProcess.on('exit', (code) => {
    console.log(`[Production] API exited with code ${code}`);
    if (code !== 0) {
      setTimeout(startAPI, 5000); // Restart after 5 seconds
    }
  });
}

// Start kernel
function startKernel() {
  console.log('[Production] Starting kernel...');
  kernelProcess = spawn('node', [path.join(__dirname, 'kernel.js')], {
    stdio: 'inherit',
    env: process.env,
  });

  kernelProcess.on('error', (error) => {
    console.error('[Production] Kernel error:', error);
  });

  kernelProcess.on('exit', (code) => {
    console.log(`[Production] Kernel exited with code ${code}`);
    if (code !== 0) {
      setTimeout(startKernel, 5000); // Restart after 5 seconds
    }
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\n[Production] Shutting down...');

  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }

  if (kernelProcess) {
    kernelProcess.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start both processes
startAPI();
startKernel();

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🚀 AgentOS Production Server                        ║
║                                                               ║
║   API:    Running on port ${PORT}                               ║
║   Kernel: Running in background                               ║
║                                                               ║
║   Health: http://localhost:${PORT}/api/health                    ║
║   UI:     http://localhost:${PORT}/mission-control               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Keep process alive
process.stdin.resume();
