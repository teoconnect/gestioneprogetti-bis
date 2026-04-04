const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

async function main() {
  // Test inserting a user
  const user = await prisma.user.create({
    data: {
      name: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      password: 'hashedpassword',
    },
  });
  console.log('User created:', user);

  // Test inserting a project
  const project = await prisma.project.create({
    data: {
      title: 'Vivid Logic Platform',
      ownerId: user.id,
    },
  });
  console.log('Project created:', project);

  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
