import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('../', import.meta.url));

if (typeof process.loadEnvFile === 'function' && !process.env.DIRECT_URL && !process.env.POSTGRES_URL_NON_POOLING) {
  try { process.loadEnvFile(path.join(rootDir, '.env')); } catch {}
}

// Une seule source SQL : les migrations Prisma versionnées. Pas de connexion pg parallèle.
export function deployDatabase(env = process.env, run = spawnSync) {
  const directUrl = env.DIRECT_URL || env.POSTGRES_URL_NON_POOLING;
  if (!directUrl) throw new Error('DIRECT_URL ou POSTGRES_URL_NON_POOLING est requis (connexion directe).');
  const result = run(path.join(rootDir, 'node_modules', '.bin', 'prisma'), ['migrate', 'deploy'], {
    cwd: rootDir,
    env: { ...env, DATABASE_URL: directUrl, DIRECT_URL: directUrl },
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = deployDatabase();
  } catch {
    console.error('Déploiement de la base impossible : vérifiez la connexion directe et la configuration Prisma.');
    process.exitCode = 1;
  }
}
