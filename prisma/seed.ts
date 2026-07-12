import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { usersData } from './data/users';
import { servicesData } from './data/services';
import { bookingsData } from './data/bookings';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users
  console.log('Creating users...');
  for (const user of usersData) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role as any,
        isActive: user.isActive,
      },
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role as any,
        isActive: user.isActive,
      },
    });
  }

  // 2. Seed Services
  console.log('Creating services...');
  for (const service of servicesData) {
    const existingService = await prisma.service.findFirst({
      where: { title: service.title },
    });
    
    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: {
          description: service.description,
          duration: service.duration,
          price: service.price,
          isActive: service.isActive,
        },
      });
    } else {
      await prisma.service.create({
        data: {
          title: service.title,
          description: service.description,
          duration: service.duration,
          price: service.price,
          isActive: service.isActive,
        },
      });
    }
  }

  // 3. Seed Bookings
  console.log('Creating bookings...');
  for (const booking of bookingsData) {
    // Find references
    const service = await prisma.service.findFirst({ where: { title: booking.serviceTitle } });

    if (!service) {
      console.warn(`Skipping booking for ${booking.customerEmail} - ${booking.serviceTitle} (Service not found)`);
      continue;
    }

    const bookingDate = new Date(booking.bookingDate);

    // Prevent duplicate bookings for the same service, date, and time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        serviceId: service.id,
        bookingDate: bookingDate,
        bookingTime: booking.bookingTime,
      },
    });

    if (!existingBooking) {
      await prisma.booking.create({
        data: {
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          serviceId: service.id,
          bookingDate: bookingDate,
          bookingTime: booking.bookingTime,
          status: booking.status as any,
        },
      });
    } else {
      // Update status if it exists but might be out of sync
      await prisma.booking.update({
        where: { id: existingBooking.id },
        data: { status: booking.status as any },
      });
    }
  }

  console.log('✅ Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
