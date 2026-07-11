import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Load .env from the project root (cwd when running prisma CLI)
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env['DATABASE_URL'],
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
});
