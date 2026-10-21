import { registerAs } from '@nestjs/config';
import { Environment } from './env.validation';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV as Environment,
  port: Number(process.env.PORT),
  defaultTimezone: process.env.DEFAULT_TIMEZONE as string,
}));
