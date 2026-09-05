import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default community...');
  const community = await prisma.community.upsert({
    where: { slug: 'general' },
    update: {},
    create: {
      name: 'General',
      slug: 'general',
      icon: 'general',
      description: 'The default community for all discussions.',
      createdById: 'system', // or leave it blank if allowed, but schema says it's required string
    },
  });
  console.log('Community seeded:', community.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
