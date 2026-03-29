import { NextRequest, NextResponse } from 'next/server';
import { retrieveBlob } from '@/lib/shelby';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasValidAccess } from '@/lib/contract-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { blobId: string } }
) {
  try {
    const user = await auth();
    const { blobId } = params;
    const { searchParams } = new URL(request.url);
    const tier = parseInt(searchParams.get('tier') || '0');
    const contentId = searchParams.get('contentId');

    // Get file metadata
    const file = await prisma.file.findUnique({
      where: { blobId },
      include: { user: true },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    let hasAccess = false;

    if (file.isPublic && !file.encrypted) {
      // Public unencrypted files are accessible to all
      hasAccess = true;
    } else if (file.userId === user?.id) {
      // Owner always has access
      hasAccess = true;
    } else if (contentId && user) {
      // Check on-chain purchase for marketplace content
      hasAccess = await hasValidAccess(
        user.walletAddress,
        BigInt(contentId),
        tier
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Retrieve from Shelby
    let data: Buffer;

    if (file.encrypted && file.encryptionKey) {
      // Decrypt with user's key (simplified - in production decrypt with user's private key)
      const keyBuffer = Buffer.from(file.encryptionKey, 'base64');
      data = await retrieveBlob(blobId, new Uint8Array(keyBuffer));
    } else {
      data = await retrieveBlob(blobId);
    }

    // Apply watermarking based on tier for marketplace content
    if (contentId && tier >= 1) {
      // Add invisible watermark for tracking
      data = await addInvisibleWatermark(data, {
        buyerAddress: user?.walletAddress || 'anonymous',
        contentId,
        tier,
        timestamp: Date.now(),
      });
    }

    // Return with appropriate headers
    return new NextResponse(data, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Cache-Control': 'private, no-cache',
        'Content-Length': data.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

// Helper function to add invisible watermark
async function addInvisibleWatermark(
  data: Buffer,
  metadata: {
    buyerAddress: string;
    contentId: string;
    tier: number;
    timestamp: number;
  }
): Promise<Buffer> {
  // In production, implement actual steganography or watermarking
  // For now, we'll append metadata as a comment/header for certain file types

  const watermark = Buffer.from(
    `\n<!-- VERIXA_WATERMARK:${JSON.stringify(metadata)} -->\n`
  );

  return Buffer.concat([data, watermark]);
}
