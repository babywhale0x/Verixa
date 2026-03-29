import { NextRequest, NextResponse } from 'next/server';
import { completeUpload, generateEncryptionKey } from '@/lib/shelby';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await auth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file || !metadataStr) {
      return NextResponse.json(
        { error: 'Missing file or metadata' },
        { status: 400 }
      );
    }

    const metadata = JSON.parse(metadataStr);

    // Find pending upload
    const pendingUpload = await prisma.pendingUpload.findFirst({
      where: {
        userId: user.id,
        blobId: metadata.blobId,
        status: 'pending',
      },
    });

    if (!pendingUpload) {
      return NextResponse.json(
        { error: 'Invalid or expired upload session' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate encryption key for private files
    let encryptionKey: Uint8Array | undefined;
    let encryptedKey: string | undefined;

    if (pendingUpload.encrypted) {
      encryptionKey = generateEncryptionKey();
      // In production, encrypt this key with user's public key
      // For now, we'll store a hash/placeholder
      encryptedKey = Buffer.from(encryptionKey).toString('base64');
    }

    // Complete upload to Shelby
    const result = await completeUpload(
      metadata.blobId,
      buffer,
      encryptionKey
    );

    // Save file record
    await prisma.file.create({
      data: {
        userId: user.id,
        blobId: metadata.blobId,
        rootHash: Buffer.from(result.rootHash),
        size: BigInt(result.size),
        name: metadata.name || file.name,
        contentType: metadata.contentType || file.type,
        encrypted: pendingUpload.encrypted,
        encryptionKey: encryptedKey,
        isPublic: metadata.isPublic || false,
        description: metadata.description,
      },
    });

    // Update user's storage balance
    await prisma.storageBalance.update({
      where: { userId: user.id },
      data: {
        totalBytes: {
          increment: BigInt(result.size),
        },
      },
    });

    // Update pending upload status
    await prisma.pendingUpload.update({
      where: { id: pendingUpload.id },
      data: { status: 'completed' },
    });

    return NextResponse.json({
      success: true,
      blobId: metadata.blobId,
      rootHash: Array.from(result.rootHash),
      size: result.size,
    });
  } catch (error) {
    console.error('Upload completion failed:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
