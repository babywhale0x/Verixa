import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ listed: 0, sold: 0, earned: 0, purchased: 0 });
    }

    const [listed, soldCount, earnedAgg, purchased] = await Promise.all([
      // Items currently published by this user
      prisma.file.count({ where: { userId: user.id, isPublished: true } }),
      // Sales of content owned by this user (via File → Content purchases)
      prisma.purchase.count({
        where: { content: { files: { some: { userId: user.id } } } },
      }),
      // Total earned from sales
      prisma.purchase.aggregate({
        where: { content: { files: { some: { userId: user.id } } } },
        _sum: { amountPaid: true },
      }),
      // Items purchased by this user
      prisma.purchase.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      listed,
      sold: soldCount,
      earned: Number(earnedAgg._sum.amountPaid ?? 0),
      purchased,
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
