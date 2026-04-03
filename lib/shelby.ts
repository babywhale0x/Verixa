import { ShelbyNodeClient } from '@shelby-protocol/sdk/node';
import { Network, Ed25519PrivateKey, Ed25519Account } from '@aptos-labs/ts-sdk';

const shelbyClient = new ShelbyNodeClient({
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY || '',
});

function getAccount(): Ed25519Account {
  const rawKey = process.env.SHELBY_PRIVATE_KEY || '';
  let hexKey = rawKey;
  if (hexKey.includes('ed25519-priv-')) {
    hexKey = hexKey.split('ed25519-priv-')[1];
  }
  if (hexKey.startsWith('0x') || hexKey.startsWith('0X')) {
    hexKey = hexKey.slice(2);
  }
  const privateKey = new Ed25519PrivateKey(hexKey);
  return new Ed25519Account({ privateKey });
}

export interface UploadSession {
  blobId: string;
  uploadUrl: string;
  rootHash: Uint8Array;
}

export async function initiateUpload(
  fileSize: number,
  contentType: string,
  encrypted: boolean = false
): Promise<UploadSession> {
  const blobId = `verixa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    blobId,
    uploadUrl: '/api/upload/complete',
    rootHash: new Uint8Array(32),
  };
}

export async function completeUpload(
  blobId: string,
  fileData: Buffer,
  contentType: string,
  fileName: string
): Promise<{ rootHash: Uint8Array; size: number; blobName: string }> {
  try {
    const account = getAccount();
    const blobName = `${blobId}/${fileName}`;
    const expirationMicros = (Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000;

    await shelbyClient.upload({
      signer: account,
      blobData: fileData,
      blobName,
      expirationMicros,
    });

    return {
      rootHash: new Uint8Array(32),
      size: fileData.length,
      blobName,
    };
  } catch (error) {
    console.error('Shelby upload error:', error);
    throw new Error('Failed to upload to Shelby storage');
  }
}

export async function downloadBlob(
  blobName: string
): Promise<Buffer> {
  try {
    const account = getAccount();
    const blob = await shelbyClient.download({
      account: account.accountAddress,
      blobName,
    });
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      blob.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      blob.stream.on('end', () => resolve(Buffer.concat(chunks)));
      blob.stream.on('error', reject);
    });
  } catch (error) {
    console.error('Shelby download error:', error);
    throw new Error('Failed to download from Shelby storage');
  }
}

export function generateBlobId(): string {
  return `verixa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}