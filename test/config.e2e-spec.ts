import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Separate processes avoid ConfigModule's import-time cache and process.env writes.
// Only synthetic environment values and temporary .env fixtures reach the app.
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
        const result = { port: config.getOrThrow('PORT'), nodeEnv: config.getOrThrow('NODE_ENV') };
        if (process.env.TEST_LISTEN === 'true') {
          await app.listen(result.port, '127.0.0.1');
          result.body = await (await fetch(await app.getUrl())).text();
        }
        process.stdout.write(JSON.stringify(result));
      } finally {
        await app.close();
      }
    }
    run().catch((error) => { console.error(error.message); process.exitCode = 1; });
  `;

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

  it('starts without .env using the existing port default', () => {
    const result = runApp();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      port: 3000,
      nodeEnv: 'development',
    });
  });

  it('loads .env and serves HTTP using the validated numeric port', () => {
    writeFileSync(
      join(fixtureDirectory, '.env'),
      'PORT=0\nNODE_ENV=production\nUNRELATED=ignored\n',
    );
    const result = runApp({ TEST_LISTEN: 'true' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      port: 0,
      nodeEnv: 'production',
      body: 'Hello World!',
    });
  });

  it('gives process environment precedence over .env', () => {
    writeFileSync(
      join(fixtureDirectory, '.env'),
      'PORT=invalid\nNODE_ENV=invalid\n',
    );
    const result = runApp({ PORT: '4001', NODE_ENV: 'test' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ port: 4001, nodeEnv: 'test' });
  });

  it.each([
    { PORT: 'synthetic-invalid-port' },
    { NODE_ENV: 'synthetic-invalid-mode' },
  ])(
    'rejects invalid process configuration before startup: %o',
    (environment) => {
      const result = runApp(environment);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Invalid configuration:');
      expect(result.stderr).not.toContain('synthetic-invalid');
    },
  );

  it('rejects invalid .env configuration before startup', () => {
    writeFileSync(join(fixtureDirectory, '.env'), 'PORT=65536\n');
    const result = runApp();
    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(
      'Invalid configuration: PORT must be an integer between 0 and 65535.',
    );
  });
});
