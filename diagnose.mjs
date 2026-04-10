import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching recent purchases...");
  const purchases = await prisma.purchase.findMany({
    orderBy: { purchaseTimestamp: 'desc' },
    take: 5
  });

  console.log("Recent purchases:", purchases.map(p => ({
    id: p.id,
    purchaseId: p.purchaseId.toString(),
    userId: p.userId,
    contentId: p.contentId.toString(),
    tier: p.tier,
    licenseHash: p.licenseHash
  })));

  console.log("Fetching recent users...");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2
  });
  console.log("Recent Users:", users.map(u => ({ id: u.id, wallet: u.walletAddress })));

  await prisma.$disconnect();
}

main().catch(console.error);
