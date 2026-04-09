import { NextRequest, NextResponse } from 'next/server';
import { downloadBlob } from '@/lib/shelby';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { blobId: string } }
) {
  try {
    const { blobId } = params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

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
      hasAccess = true;
    } else if (walletAddress && file.user.walletAddress === walletAddress) {
      hasAccess = true;
    } else if (walletAddress && file.contentId != null) {
      // For marketplace content, check if the user has purchased a downloadable tier
      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (user) {
        const purchases = await prisma.purchase.findMany({
          where: {
            userId: user.id,
            contentId: file.contentId,
          },
        });
        // TIER_LICENSE = 3, TIER_COMMERCIAL = 4 are downloadable
        if (purchases.some((p: any) => p.tier >= 3)) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied or download not permitted for this tier' },
        { status: 403 }
      );
    }

    // Retrieve from Shelby using blobId as blobName
    const data = await downloadBlob(blobId);

    return new NextResponse(new Uint8Array(data), {
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
