import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return NextResponse.json({ purchases: [] });

    const purchases = await prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { purchaseTimestamp: 'desc' },
    });

    const contentIdsArray = purchases.map(p => p.contentId);
    const uniqueContentIds = Array.from(new Set(contentIdsArray));

    // Fetch Content entities manually
    const contents = await prisma.content.findMany({
      where: { id: { in: uniqueContentIds } },
    });

    // Fetch corresponding Files manually
    const files = await prisma.file.findMany({
      where: { contentId: { in: uniqueContentIds } },
      select: {
        contentId: true,
        name: true,
        contentType: true,
        previewUrl: true,
        blobId: true,
      },
    });

    const enrichedPurchases = purchases.map(p => {
      const content = contents.find(c => c.id === p.contentId);
      const contentFiles = files.filter(f => f.contentId === p.contentId);
      
      return {
        ...p,
        // Convert BigInts to string for JSON serialization
        purchaseId: p.purchaseId.toString(),
        contentId: p.contentId.toString(),
        amountPaid: Number(p.amountPaid) || 0,
        content: content ? {
          title: content.title,
          files: contentFiles
        } : {
          title: 'Unknown Content',
          files: []
        }
      };
    });

    return NextResponse.json({ purchases: enrichedPurchases });
  } catch (error) {
    console.error('Profile purchases error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
