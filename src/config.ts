export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    path: process.env.DB_PATH || './data/brandlint.db',
  },
};
