import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, blobId, name, contentType, size, isPublic, description, previewUrl } = body;

    let user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      user = await prisma.user.create({ data: { walletAddress } });
    }

    await prisma.file.upsert({
      where: { blobId },
      create: {
        userId: user.id,
        blobId,
        size: BigInt(size),
        name,
        contentType,
        encrypted: false,
        isPublic: isPublic || false,
        description: description || null,
        previewUrl: previewUrl || null,
      },
      update: { isPublic: isPublic || false, previewUrl: previewUrl || undefined },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save failed:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}