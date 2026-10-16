import { spawn } from 'node:child_process';
import path from 'node:path';

const rootDir = process.cwd();
const apiServerPath = path.join(rootDir, 'scripts', 'local-server.mjs');

console.log('🔌 [dev-web] Démarrage du serveur API local sur http://localhost:3001...');
const apiProc = spawn(process.execPath, [apiServerPath, '--port', '3001'], {
  cwd: rootDir,
  env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
  stdio: 'inherit',
});

console.log('🌐 [dev-web] Démarrage d’Expo Web sur http://localhost:8081...');
const expoProc = spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
});

function cleanup() {
  if (!apiProc.killed) apiProc.kill('SIGTERM');
  if (!expoProc.killed) expoProc.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

expoProc.on('exit', (code) => {
  if (!apiProc.killed) apiProc.kill('SIGTERM');
  process.exit(code ?? 0);
});
