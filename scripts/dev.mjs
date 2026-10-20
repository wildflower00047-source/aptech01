#!/usr/bin/env node
/**
 * AuthSec one-command dev bootstrap.
 *
 *   npm run dev     -> installs deps (if needed), seeds demo data (if DB empty),
 *                      then starts the API and the web app together.
 *   npm run setup   -> only performs the install + seed steps.
 *
 * Uses only Node.js built-ins, so a single `npm run dev` at the repo root is all
 * you need. Press Ctrl+C once to stop everything.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const setupOnly = process.argv.includes('--setup-only');
const isWin = process.platform === 'win32';
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const raw = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

const C = useColor ? raw : Object.fromEntries(Object.keys(raw).map((k) => [k, '']));

const banner = () => {
  console.log(`\n${C.bold}${C.magenta}  AuthSec${C.reset}${C.gray} - MERN authentication & authorization${C.reset}`);
  console.log(`${C.gray}  One command to run them all: ${C.cyan}npm run dev${C.reset}\n`);
};

const step = (msg) => console.log(`${C.cyan}>${C.reset} ${msg}`);
const ok = (msg) => console.log(`${C.green}OK${C.reset} ${msg}`);
const warn = (msg) => console.log(`${C.yellow}!${C.reset} ${msg}`);

const npmCmd = isWin ? 'npm.cmd' : 'npm';

const runSync = (args, cwd) => {
  const res = spawnSync(npmCmd, args, { cwd, stdio: 'inherit', shell: isWin });
  return res.status === 0;
};

const ensureDeps = (dir, name) => {
  if (existsSync(path.join(dir, 'node_modules'))) {
    ok(`${name} dependencies already installed`);
    return true;
  }
  step(`Installing ${name} dependencies (first run, please wait)...`);
  const done = runSync(['install'], dir);
  if (done) ok(`${name} dependencies installed`);
  else warn(`${name} install failed - try running "npm install" in ${name}/ manually`);
  return done;
};

const seedIfEmpty = () => {
  step('Checking database for demo data...');
  const done = runSync(['run', 'seed:if-empty'], serverDir);
  if (!done) warn('Seeding skipped (database may be unavailable). The API will try to connect on start.');
};

const prefixStream = (stream, label, color, target) => {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) target.write(`${color}${label}${C.reset} ${C.gray}|${C.reset} ${line}\n`);
    }
  });
};

const children = [];

const startProcess = (label, color, args, cwd) => {
  const child = spawn(npmCmd, args, { cwd, shell: isWin });
  prefixStream(child.stdout, label, color, process.stdout);
  prefixStream(child.stderr, label, color, process.stderr);
  child.on('exit', (code) => {
    if (code && code !== 0) console.log(`${color}${label}${C.reset} exited with code ${code}`);
  });
  children.push(child);
  return child;
};

const killTree = (child) => {
  if (!child || child.killed) return;
  if (isWin) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
};

const shutdown = (signal) => {
  if (shutdown.done) return;
  shutdown.done = true;
  console.log(`\n${C.yellow}Shutting down AuthSec (${signal})...${C.reset}`);
  children.forEach(killTree);
  setTimeout(() => process.exit(0), 500);
};

const main = () => {
  banner();

  step('Ensuring dependencies...');
  ensureDeps(serverDir, 'server');
  ensureDeps(clientDir, 'client');

  seedIfEmpty();

  if (setupOnly) {
    ok('Setup complete. Run "npm run dev" to start AuthSec.');
    process.exit(0);
  }

  console.log(`\n${C.bold}${C.green}Starting AuthSec...${C.reset}`);
  console.log(`${C.gray}  API -> ${C.cyan}http://localhost:5000${C.reset}`);
  console.log(`${C.gray}  Web -> ${C.cyan}http://localhost:5173${C.reset}`);
  console.log(`${C.gray}  Press Ctrl+C to stop both.${C.reset}\n`);

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  startProcess('API', C.magenta, ['run', 'dev'], serverDir);
  startProcess('WEB', C.cyan, ['run', 'dev'], clientDir);

  checkApi();
};

const checkApi = async () => {
  const url = 'http://localhost:5000/api/health';
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const res = await fetch(url);
      const body = await res.json();
      if (body?.success) {
        console.log(`\n${C.green}OK${C.reset} API is healthy at ${C.cyan}${url}${C.reset}`);
        return;
      }
      warn('Something unexpected is responding on port 5000. Is another app using it?');
      return;
    } catch {
      // API still starting up; keep polling.
    }
  }
  warn(
    'API did not respond on port 5000 within ~36s. Check the API logs above - common causes: ' +
      'port 5000 already taken by another app, or MongoDB unreachable (check server/.env).',
  );
};

main();
