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
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
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
