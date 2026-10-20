# nest-wourkout-api
BE for Reservation System project

## Local setup

`nest-api` is a NestJS 11 TypeScript application at the repository root. Use Node.js 22 LTS and npm 10 or newer (validated with Node.js 22.22.2 and npm 10.9.7).

- Install the locked dependencies: `npm ci`.
- Optionally copy the safe sample: `cp .env.example .env`.
- Start with automatic reload: `npm run start:dev`.
- Open <http://localhost:3000/>; the scaffold responds with `Hello World!`.
- Set `PORT` to use another port, for example `PORT=3001 npm run start:dev`.

## Environment configuration

`@nestjs/config` loads `.env` from the working directory; process environment variables take precedence. No `.env` file is required. Invalid supported values stop startup before the HTTP listener opens, without printing their contents.

| Variable | Default | Accepted values |
| --- | --- | --- |
| `PORT` | `3000` | Integer from `0` to `65535`; `0` asks the OS for an available port. |
| `NODE_ENV` | `development` | `development`, `test`, or `production`. |

Blank values are invalid; omit a variable to use its default. These are the only supported app settings; unrelated process variables are not validated. Consumers should inject `ConfigService` to read validated, typed values (including numeric `PORT`) instead of reading `process.env` directly.

Real `.env` and `.env.*` files are already ignored; only `.env.example` is committed. Configure production variables in the deployment environment, not in source control.

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
