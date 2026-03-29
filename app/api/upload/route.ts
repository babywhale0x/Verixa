import { NextRequest, NextResponse } from 'next/server';
import { initiateUpload } from '@/lib/shelby';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await auth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileSize, contentType, encrypted = true } = body;

    // Validate inputs
    if (!fileSize || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileSize, contentType' },
        { status: 400 }
      );
    }

    // Check user's storage balance
    const storageBalance = await prisma.storageBalance.findUnique({
      where: { userId: user.id },
    });

    // Calculate required storage cost for first month
    const bytesPerGB = 1073741824;
    const costPerGBMonthOctas = 100000;
    const gb = Math.ceil(fileSize / bytesPerGB);
    const requiredOctas = gb * costPerGBMonthOctas;

    // Check if user has enough balance (or allow if they have some balance)
    const currentBalanceOctas = storageBalance 
      ? Math.floor(Number(storageBalance.walletBalance) * 100000000) 
      : 0;

    if (currentBalanceOctas < requiredOctas) {
      return NextResponse.json(
        { 
          error: 'Insufficient storage balance', 
          required: requiredOctas,
          requiredAPT: requiredOctas / 100000000,
          available: currentBalanceOctas,
          availableAPT: currentBalanceOctas / 100000000,
        },
        { status: 402 }
      );
    }

    // Initiate Shelby upload session
    const session = await initiateUpload(fileSize, contentType, encrypted);

    // Store pending upload in database
    await prisma.pendingUpload.create({
      data: {
        userId: user.id,
        blobId: session.blobId,
        fileSize: BigInt(fileSize),
        contentType,
        encrypted,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
      },
    });

    return NextResponse.json({
      blobId: session.blobId,
      uploadUrl: session.uploadUrl,
      rootHash: Array.from(session.rootHash),
    });
  } catch (error) {
    console.error('Upload initiation failed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate upload' },
      { status: 500 }
    );
  }
}
