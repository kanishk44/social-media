import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      handle: 'alice',
      name: 'Alice Johnson',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      handle: 'bob',
      name: 'Bob Smith',
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      handle: 'charlie',
      name: 'Charlie Brown',
      passwordHash,
    },
  });

  // Create follows
  await prisma.follow.create({
    data: {
      followerId: alice.id,
      followingId: bob.id,
    },
  });

  await prisma.follow.create({
    data: {
      followerId: alice.id,
      followingId: charlie.id,
    },
  });

  await prisma.follow.create({
    data: {
      followerId: bob.id,
      followingId: alice.id,
    },
  });

  // Create posts
  await prisma.post.create({
    data: {
      authorId: alice.id,
      text: 'Hello world! This is my first post.',
    },
  });

  await prisma.post.create({
    data: {
      authorId: bob.id,
      text: 'Excited to be here!',
    },
  });

  await prisma.post.create({
    data: {
      authorId: charlie.id,
      text: 'Just another day in paradise 🌴',
    },
  });

  await prisma.post.create({
    data: {
      authorId: alice.id,
      text: 'Working on some cool projects today.',
    },
  });

  // eslint-disable-next-line no-console
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

