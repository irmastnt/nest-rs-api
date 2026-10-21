// Deterministic configuration for e2e tests so they do not depend on a local .env file.
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://rs:rs@localhost:5432/rs_test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789abcdef';
