export default () => ({
  app: {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    isProduction: process.env['NODE_ENV'] === 'production',
  },
  database: {
    url: process.env['DATABASE_URL'],
  },
  jwt: {
    secret: process.env['JWT_SECRET'],
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '15m',
  },
  refresh: {
    secret: process.env['REFRESH_SECRET'],
    expiresIn: process.env['REFRESH_EXPIRES_IN'] ?? '7d',
  },
  throttle: {
    ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60', 10),
    limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
  },
});
