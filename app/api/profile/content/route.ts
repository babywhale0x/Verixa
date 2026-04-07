import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all files uploaded by a user (published + delisted)
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return NextResponse.json({ files: [] });

    const files = await prisma.file.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        blobId: true,
        name: true,
        contentType: true,
        size: true,
        isPublished: true,
        isPublic: true,
        previewUrl: true,
        description: true,
        createdAt: true,
        contentId: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Profile content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
