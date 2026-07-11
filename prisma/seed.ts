import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly for seed script execution
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Admin User (Idempotent via upsert)
  const adminEmail = 'admin@example.com';
  const plainPassword = 'Admin@123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Seed Sample Services (Idempotent via upsert based on title)
  const services = [
    {
      title: 'Haircut',
      description: 'Professional haircut and styling',
      duration: 30,
      price: 25.0,
      isActive: true,
    },
    {
      title: 'Massage',
      description: 'Relaxing 60-minute full body massage',
      duration: 60,
      price: 80.0,
      isActive: true,
    },
    {
      title: 'Cleaning',
      description: 'Deep home cleaning service',
      duration: 120,
      price: 150.0,
      isActive: true,
    },
    {
      title: 'Repair',
      description: 'General home maintenance and repair',
      duration: 45,
      price: 60.0,
      isActive: true,
    },
    {
      title: 'Consultation',
      description: 'One-on-one professional consultation',
      duration: 60,
      price: 100.0,
      isActive: true,
    },
  ];

  for (const service of services) {
    // Note: title is not explicitly marked @unique in schema (only @index),
    // but Prisma upsert requires a unique field. Wait, if title is not unique,
    // we can use findFirst and create, or use the generated IDs.
    // Let's use findFirst to check existence.
    const existingService = await prisma.service.findFirst({
      where: { title: service.title },
    });

    if (!existingService) {
      await prisma.service.create({
        data: service,
      });
      console.log(`✅ Service seeded: ${service.title}`);
    } else {
      console.log(`⚡ Service already exists: ${service.title}`);
    }
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
