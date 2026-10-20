# nest-wourkout-api
BE for Reservation System project

## Local setup

`nest-api` is a NestJS 11 TypeScript application at the repository root. Use Node.js 22 LTS and npm 10 or newer (validated with Node.js 22.22.2 and npm 10.9.7).

- Install the locked dependencies: `npm ci`.
- Start with automatic reload: `npm run start:dev`.
- Open <http://localhost:3000/>; the scaffold responds with `Hello World!`.
- Set `PORT` to use another port, for example `PORT=3001 npm run start:dev`.

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
