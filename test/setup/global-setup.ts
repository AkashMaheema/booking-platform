import { execSync } from 'child_process';

export default async (): Promise<void> => {
  console.log('\n[Global Setup] Running database migrations for E2E tests...');
  execSync('npx dotenv -e .env.test -- npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
  });
  console.log('[Global Setup] Migrations complete.');
};
