const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.content.count();
  const contents = await prisma.content.findMany({ take: 2 });
  const files = await prisma.file.count();
  console.log(`Content items: ${count}`);
  console.log('Sample contents:', contents);
  console.log(`File items: ${files}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
