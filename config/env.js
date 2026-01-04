require('dotenv').config();

const env = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    baseUrl: process.env.APP_BASE_URL || '',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'quanlysv',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    secure: process.env.SESSION_SECURE === 'true',
    sameSite: process.env.SESSION_SAMESITE || 'lax',
  },
  security: {
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 300,
  }
};

module.exports = env;
