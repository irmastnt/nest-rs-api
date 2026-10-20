import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('defaults only the supported settings', () => {
    expect(validateEnvironment({ UNRELATED: 'ignored' })).toEqual({
      PORT: 3000,
      NODE_ENV: 'development',
    });
  });

  it.each(['0', '3001', '65535', 0, 3001, 65535])(
    'accepts PORT %s as a number',
    (port) => {
      expect(validateEnvironment({ PORT: port }).PORT).toBe(Number(port));
    },
  );

  it.each([
    '',
    ' ',
    '-1',
    '65536',
    '3000.5',
    '3000abc',
    '1e3',
    '0x10',
    'Infinity',
    '/tmp/app.sock',
    -1,
    65536,
    1.5,
    NaN,
    Infinity,
    true,
    {},
  ])('rejects invalid PORT %s', (port) => {
    expect(() => validateEnvironment({ PORT: port })).toThrow(
      'PORT must be an integer between 0 and 65535',
    );
  });

  it.each(['development', 'test', 'production'])(
    'accepts NODE_ENV %s',
    (nodeEnv) => {
      expect(validateEnvironment({ NODE_ENV: nodeEnv }).NODE_ENV).toBe(nodeEnv);
    },
  );

  it.each(['', 'staging', 'Production', ' test ', 123, false])(
    'rejects unsupported NODE_ENV %s',
    (nodeEnv) => {
      expect(() => validateEnvironment({ NODE_ENV: nodeEnv })).toThrow(
        'NODE_ENV must be development, test, or production',
      );
    },
  );

  it('never includes supplied values in validation errors', () => {
    const invalidValue = 'synthetic-private-value';
    for (const key of ['PORT', 'NODE_ENV']) {
      expect(() => validateEnvironment({ [key]: invalidValue })).not.toThrow(
        invalidValue,
      );
    }
  });
});
