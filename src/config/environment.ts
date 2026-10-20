export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const rawPort = config.PORT ?? 3000;
  const port =
    typeof rawPort === 'number' ||
    (typeof rawPort === 'string' && /^\d+$/.test(rawPort))
      ? Number(rawPort)
      : NaN;

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(
      'Invalid configuration: PORT must be an integer between 0 and 65535.',
    );
  }

  const nodeEnv = config.NODE_ENV ?? 'development';
  if (
    nodeEnv !== 'development' &&
    nodeEnv !== 'test' &&
    nodeEnv !== 'production'
  ) {
    throw new Error(
      'Invalid configuration: NODE_ENV must be development, test, or production.',
    );
  }

  return { PORT: port, NODE_ENV: nodeEnv };
}
