import { PrismaClient, PollType, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Technology',
  'Gaming',
  'Education',
  'Sports',
  'Movies',
  'Music',
  'Food',
  'Lifestyle',
  'Fashion',
  'Travel',
  'Business',
  'Science',
  'Relationships',
  'Fun',
  'Other',
];

async function main() {
  for (const name of CATEGORIES) {
    const slug = name.toLowerCase();
    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
  }

  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id });
  const adminHash = await argon2.hash('Admin123!', { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@voter.app' },
    update: {},
    create: {
      email: 'admin@voter.app',
      username: 'admin',
      displayName: 'Voter Admin',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      bio: 'Keeping the square honest.',
    },
  });

  const rahul = await prisma.user.upsert({
    where: { email: 'rahul@voter.app' },
    update: {},
    create: {
      email: 'rahul@voter.app',
      username: 'rahul',
      displayName: 'Rahul',
      passwordHash,
      bio: 'Design, phones, and public opinion.',
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@voter.app' },
    update: {},
    create: {
      email: 'priya@voter.app',
      username: 'priya',
      displayName: 'Priya',
      passwordHash,
      bio: 'I vote first, argue later.',
    },
  });

  const amit = await prisma.user.upsert({
    where: { email: 'amit@voter.app' },
    update: {},
    create: {
      email: 'amit@voter.app',
      username: 'amit',
      displayName: 'Amit',
      passwordHash,
      bio: 'Here for the close calls.',
    },
  });

  const tech = await prisma.category.findUniqueOrThrow({ where: { slug: 'technology' } });
  const movies = await prisma.category.findUniqueOrThrow({ where: { slug: 'movies' } });
  const fun = await prisma.category.findUniqueOrThrow({ where: { slug: 'fun' } });

  const existing = await prisma.poll.count();
  if (existing === 0) {
    const poll1 = await prisma.poll.create({
      data: {
        userId: rahul.id,
        question: 'Which design looks better for a voting app?',
        description: 'Be honest. This is for a product that has to feel fast on a phone.',
        categoryId: tech.id,
        pollType: PollType.SINGLE,
        options: {
          create: [
            { text: 'Ink and paper, editorial', position: 0 },
            { text: 'Dark neon dashboard', position: 1 },
            { text: 'Soft pastel cards', position: 2 },
          ],
        },
      },
      include: { options: true },
    });

    const poll2 = await prisma.poll.create({
      data: {
        userId: priya.id,
        question: 'Which movie should we watch this weekend?',
        categoryId: movies.id,
        pollType: PollType.SINGLE,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        options: {
          create: [
            { text: 'A quiet character drama', position: 0 },
            { text: 'A loud action sequel', position: 1 },
            { text: 'A documentary nobody asked for', position: 2 },
          ],
        },
      },
      include: { options: true },
    });

    const poll3 = await prisma.poll.create({
      data: {
        userId: amit.id,
        question: 'Which platforms do you actually open every day?',
        description: 'Pick every one that still earns a slot on your home screen.',
        categoryId: fun.id,
        pollType: PollType.MULTIPLE,
        options: {
          create: [
            { text: 'YouTube', position: 0 },
            { text: 'Instagram', position: 1 },
            { text: 'X', position: 2 },
            { text: 'Reddit', position: 3 },
          ],
        },
      },
      include: { options: true },
    });

    await prisma.follow.createMany({
      data: [
        { followerId: priya.id, followingId: rahul.id },
        { followerId: amit.id, followingId: rahul.id },
        { followerId: rahul.id, followingId: priya.id },
      ],
      skipDuplicates: true,
    });

    await cast(poll1.id, priya.id, [poll1.options[0].id]);
    await cast(poll1.id, amit.id, [poll1.options[0].id]);
    await cast(poll2.id, rahul.id, [poll2.options[0].id]);
    await cast(poll3.id, rahul.id, [poll3.options[0].id, poll3.options[3].id]);
  }

  console.log('Seeded Voter. Demo logins:');
  console.log('  rahul@voter.app / password123');
  console.log('  priya@voter.app / password123');
  console.log('  admin@voter.app / Admin123!');
}

async function cast(pollId: string, userId: string, optionIds: string[]) {
  await prisma.voteSubmission.create({
    data: {
      pollId,
      userId,
      choices: { create: optionIds.map((optionId) => ({ optionId })) },
    },
  });
  await prisma.poll.update({ where: { id: pollId }, data: { voteCount: { increment: 1 } } });
  for (const optionId of optionIds) {
    await prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
