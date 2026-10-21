import { Environment, validate } from './env.validation';

const validEnv = {
  DATABASE_URL: 'postgresql://rs:rs@localhost:5432/rs',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validate (environment)', () => {
  it('applies defaults for optional variables', () => {
    const config = validate(validEnv);

    expect(config.NODE_ENV).toBe(Environment.Development);
    expect(config.PORT).toBe(3000);
    expect(config.DEFAULT_TIMEZONE).toBe('Europe/Zurich');
    expect(config.JWT_ACCESS_TTL).toBe('15m');
    expect(config.JWT_REFRESH_TTL).toBe('7d');
  });

  it('converts PORT from string to number', () => {
    expect(validate({ ...validEnv, PORT: '8080' }).PORT).toBe(8080);
  });

  it.each([
    ['missing DATABASE_URL', { DATABASE_URL: undefined }, 'DATABASE_URL'],
    [
      'non-postgres DATABASE_URL',
      { DATABASE_URL: 'mysql://x' },
      'DATABASE_URL',
    ],
    ['unknown NODE_ENV', { NODE_ENV: 'qa' }, 'NODE_ENV'],
    ['out-of-range PORT', { PORT: '70000' }, 'PORT'],
    ['short JWT secret', { JWT_ACCESS_SECRET: 'short' }, 'JWT_ACCESS_SECRET'],
    ['bad TTL', { JWT_REFRESH_TTL: 'week' }, 'JWT_REFRESH_TTL'],
    [
      'identical JWT secrets',
      { JWT_REFRESH_SECRET: validEnv.JWT_ACCESS_SECRET },
      'must differ',
    ],
  ])('rejects %s', (_case, override, expected) => {
    expect(() => validate({ ...validEnv, ...override })).toThrow(expected);
  });
});
