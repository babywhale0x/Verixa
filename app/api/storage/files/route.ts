import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    let user = await auth();
    
    // If no session but wallet param is provided, fetch user by wallet
    if (!user && wallet) {
      const dbUser = await prisma.user.findUnique({ where: { walletAddress: wallet }});
      if (dbUser) {
        user = { id: dbUser.id, walletAddress: dbUser.walletAddress };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        blobId: true,
        name: true,
        contentType: true,
        size: true,
        isPublic: true,
        encrypted: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
