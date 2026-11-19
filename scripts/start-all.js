const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('          PROJECT GHOSTCODE — LAUNCHING LABORATORY SERVERS                      ');
console.log('================================================================================');
console.log('Starting Backend REST API Server (Port 3001)...');
console.log('Starting Frontend Web Client (Port 5173)...');
console.log('--------------------------------------------------------------------------------\n');

// 1. Launch Backend
const backend = spawn('node', ['backend/dist/backend/src/server.js'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true
});

// 2. Launch Frontend
const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('[BACKEND ERROR]:', err);
});

frontend.on('error', (err) => {
  console.error('[FRONTEND ERROR]:', err);
});

function cleanup() {
  console.log('\nShutting down GHOSTCODE servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
