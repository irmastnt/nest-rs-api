# nest-wourkout-api
BE for Reservation System project

## Local setup

`nest-api` is a NestJS 11 TypeScript application at the repository root. Use Node.js 22 LTS and npm 10 or newer (validated with Node.js 22.22.2 and npm 10.9.7).

- Install the locked dependencies: `npm ci`.
- Create your local config: `cp .env.example .env` and adjust values (see [Environment variables](#environment-variables)).
- Start with automatic reload: `npm run start:dev`.
- Open <http://localhost:3000/>; the scaffold responds with `Hello World!`.
- Set `PORT` to use another port, for example `PORT=3001 npm run start:dev`.

## Environment variables

Configuration is loaded with `@nestjs/config` from real environment variables, then `.env.local`, then `.env` (earlier sources win). `.env*` files are git-ignored except `.env.example`. All values are validated at startup in `src/config/env.validation.ts`; the app refuses to start and lists every problem if something is missing or malformed.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development`, `test`, `staging` or `production` |
| `PORT` | no | `3000` | Integer 0–65535, digits only; `0` picks a free port |
| `DEFAULT_TIMEZONE` | no | `Europe/Zurich` | Default IANA time zone for new tenants |
| `DATABASE_URL` | yes | | `postgres://` or `postgresql://` connection string |
| `JWT_ACCESS_SECRET` | yes | | At least 32 characters |
| `JWT_ACCESS_TTL` | no | `15m` | Duration: `900s`, `15m`, `12h`, `7d` |
| `JWT_REFRESH_SECRET` | yes | | At least 32 characters, must differ from the access secret |
| `JWT_REFRESH_TTL` | no | `7d` | Duration: `900s`, `15m`, `12h`, `7d` |

In code, inject typed namespaces instead of reading `process.env`, for example `@Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>`. Namespaces: `app`, `database`, `auth` (see `src/config/`). `ConfigService` exposes only the validated variables above (`skipProcessEnv`), so unrelated process variables cannot be read through it. Validation errors name the variable but never echo its value. E2E tests get deterministic values from `test/setup-env.ts`; `test/config.e2e-spec.ts` boots the app in separate processes to cover `.env` loading, precedence and startup failures.

Never commit real secrets. In staging and production, set these variables in the deployment environment (GitHub environment secrets, compose env), not in files in the repository.

## Build and run

- Build: `npm run build`.
- Run the compiled application: `npm run start:prod`.
- Run without watch mode: `npm start`.

## Checks

- Unit tests: `npm test -- --runInBand`.
- HTTP end-to-end tests: `npm run test:e2e -- --runInBand`.
- Coverage: `npm run test:cov -- --runInBand`.
- Lint without changing files: `npm run lint -- --no-fix --max-warnings=0`.
- Format source and tests: `npm run format`.

This initializes the standard NestJS scaffold only; workout features, database access, authentication, and deployment are not included.
