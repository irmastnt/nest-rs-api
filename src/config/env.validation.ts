import 'reflect-metadata';
import { Expose, plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}

const DURATION_PATTERN = /^\d+[smhd]$/;

// Accept only plain decimal digits so values like "1e3" or "0x10" are rejected
// instead of being coerced into a valid-looking port.
const toPort = ({
  value,
  obj,
}: {
  value: unknown;
  obj: Record<string, unknown>;
}): unknown => {
  const raw = obj.PORT;
  if (raw === undefined || typeof raw === 'number') return value;
  return typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
};

export class EnvironmentVariables {
  @Expose()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Expose()
  @Transform(toPort)
  @IsInt({ message: 'PORT must be an integer between 0 and 65535' })
  @Min(0, { message: 'PORT must be an integer between 0 and 65535' })
  @Max(65535, { message: 'PORT must be an integer between 0 and 65535' })
  PORT: number = 3000;

  @Expose()
  @IsString()
  @IsNotEmpty()
  DEFAULT_TIMEZONE: string = 'Europe/Zurich';

  @Expose()
  @Matches(/^postgres(ql)?:\/\/.+/, {
    message: 'DATABASE_URL must be a postgres:// or postgresql:// URL',
  })
  DATABASE_URL: string;

  @Expose()
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @Expose()
  @Matches(DURATION_PATTERN, {
    message: 'JWT_ACCESS_TTL must be a duration like 900s, 15m, 12h or 7d',
  })
  JWT_ACCESS_TTL: string = '15m';

  @Expose()
  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @Expose()
  @Matches(DURATION_PATTERN, {
    message: 'JWT_REFRESH_TTL must be a duration like 900s, 15m, 12h or 7d',
  })
  JWT_REFRESH_TTL: string = '7d';
}

/**
 * Validates process.env at startup. Used as ConfigModule's `validate` option,
 * so the app refuses to boot with missing or malformed configuration.
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    // Keep only declared variables so ConfigService never exposes unvalidated keys.
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    const details = [...new Set(messages)]
      .map((message) => `  - ${message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error(
      'Invalid environment configuration:\n  - JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ',
    );
  }

  return validated;
}
