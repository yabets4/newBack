export default {
  url: process.env.DATABASE_URL, // use single connection string
  ssl: false,
  pool: { max: 10, idleTimeoutMillis: 30000 },
};
