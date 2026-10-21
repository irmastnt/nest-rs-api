import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Each case boots the app in a separate process so ConfigModule's import-time
// caching and process.env writes cannot leak between cases. Only synthetic
// values and temporary .env fixtures reach the app.
describe('Environment configuration (e2e)', () => {
  let fixtureDirectory: string;
  const projectRoot = resolve(__dirname, '..');
  const script = `
    const { NestFactory } = require(${JSON.stringify(require.resolve('@nestjs/core'))});
    const { ConfigService } = require(${JSON.stringify(require.resolve('@nestjs/config'))});
    const { AppModule } = require(${JSON.stringify(join(projectRoot, 'src/app.module.ts'))});
    async function run() {
      const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
      try {
        await app.init();
        const config = app.get(ConfigService);
        const result = {
          app: config.getOrThrow('app'),
          databaseUrl: config.getOrThrow('database').url,
          unvalidated: config.get('UNRELATED') ?? null,
        };
        if (process.env.TEST_LISTEN === 'true') {
          await app.listen(result.app.port, '127.0.0.1');
          result.body = await (await fetch(await app.getUrl())).text();
        }
        process.stdout.write(JSON.stringify(result));
      } finally {
        await app.close();
      }
    }
    run().catch((error) => { console.error(error.message); process.exitCode = 1; });
  `;

  const requiredEnv = {
    DATABASE_URL: 'postgresql://rs:rs@env-host:5432/rs',
    JWT_ACCESS_SECRET: 'e2e-access-secret-0123456789abcdef',
    JWT_REFRESH_SECRET: 'e2e-refresh-secret-0123456789abcdef',
  };

  function writeEnvFile(name: string, lines: string[]) {
    writeFileSync(join(fixtureDirectory, name), `${lines.join('\n')}\n`);
  }

  function runApp(environment: Record<string, string> = {}) {
    return spawnSync(
      process.execPath,
      ['-r', require.resolve('ts-node/register'), '-e', script],
      {
        cwd: fixtureDirectory,
        env: {
          TS_NODE_PROJECT: join(projectRoot, 'tsconfig.json'),
          ...environment,
        },
        encoding: 'utf8',
        timeout: 15000,
      },
    );
  }

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), 'nest-config-test-'));
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  it('refuses to start without required variables and lists them', () => {
    const result = runApp();
    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Invalid environment configuration');
    for (const key of Object.keys(requiredEnv)) {
      expect(result.stderr).toContain(key);
    }
  });

  it('loads .env, applies defaults and serves HTTP on the validated port', () => {
    writeEnvFile('.env', [
      'PORT=0',
      'NODE_ENV=staging',
      'UNRELATED=ignored',
      ...Object.entries(requiredEnv).map(([key, value]) => `${key}=${value}`),
    ]);
    const result = runApp({ TEST_LISTEN: 'true' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      app: { nodeEnv: 'staging', port: 0, defaultTimezone: 'Europe/Zurich' },
      databaseUrl: requiredEnv.DATABASE_URL,
      unvalidated: null,
      body: 'Hello World!',
    });
  });

  it('gives process environment precedence over .env.local over .env', () => {
    writeEnvFile('.env', [
      'PORT=invalid',
      'NODE_ENV=invalid',
      'DATABASE_URL=postgresql://rs:rs@dotenv-host:5432/rs',
    ]);
    writeEnvFile('.env.local', [
      'NODE_ENV=test',
      'DATABASE_URL=postgresql://rs:rs@local-host:5432/rs',
    ]);
    const result = runApp({
      JWT_ACCESS_SECRET: requiredEnv.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: requiredEnv.JWT_REFRESH_SECRET,
      PORT: '4001',
    });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      app: { nodeEnv: 'test', port: 4001 },
      databaseUrl: 'postgresql://rs:rs@local-host:5432/rs',
    });
  });

  it.each([
    { PORT: 'synthetic-invalid-port' },
    { NODE_ENV: 'synthetic-invalid-mode' },
    { DATABASE_URL: 'synthetic-invalid-url' },
    { JWT_ACCESS_SECRET: 'synthetic-invalid' },
  ])(
    'rejects invalid configuration without echoing the value: %o',
    (override) => {
      const result = runApp({ ...requiredEnv, ...override });
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Invalid environment configuration');
      expect(result.stderr).not.toContain('synthetic-invalid');
    },
  );
});
