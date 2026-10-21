import { ConfigModule, ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { appConfig, authConfig, databaseConfig, validate } from '.';

describe('typed config namespaces', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      DATABASE_URL: 'postgresql://rs:rs@db:5432/rs',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      PORT: '4000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exposes validated values with defaults applied', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [appConfig, databaseConfig, authConfig],
          validate,
        }),
      ],
    }).compile();

    const app = moduleRef.get<ConfigType<typeof appConfig>>(appConfig.KEY);
    const db = moduleRef.get<ConfigType<typeof databaseConfig>>(
      databaseConfig.KEY,
    );
    const auth = moduleRef.get<ConfigType<typeof authConfig>>(authConfig.KEY);

    expect(app).toEqual({
      nodeEnv: 'development',
      port: 4000,
      defaultTimezone: 'Europe/Zurich',
    });
    expect(db.url).toBe('postgresql://rs:rs@db:5432/rs');
    expect(auth).toEqual({
      accessSecret: 'a'.repeat(32),
      accessTtl: '15m',
      refreshSecret: 'b'.repeat(32),
      refreshTtl: '7d',
    });
  });
});
