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
      orderBy: { purchasedAt: 'desc' },
      include: {
        content: {
          include: {
            files: {
              select: {
                name: true,
                contentType: true,
                previewUrl: true,
                blobId: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Profile purchases error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
