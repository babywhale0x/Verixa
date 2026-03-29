import { ShelbyClient } from '@shelby-protocol/sdk';

// Initialize Shelby client
const shelbyConfig = {
  network: (process.env.SHELBY_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  rpcUrl: process.env.SHELBY_RPC_URL,
  privateKey: process.env.SHELBY_PRIVATE_KEY,
};

export const shelby = new ShelbyClient(shelbyConfig);

export interface UploadSession {
  blobId: string;
  uploadUrl: string;
  rootHash: Uint8Array;
}

export interface UploadResult {
  blobId: string;
  rootHash: Uint8Array;
  size: number;
}

// Initiate upload session
export async function initiateUpload(
  fileSize: number,
  contentType: string,
  encrypted: boolean = true
): Promise<UploadSession> {
  try {
    const reservation = await shelby.reserveBlob({
      size: fileSize,
      ttl: 365 * 24 * 60 * 60, // 1 year
      contentType,
    });

    return {
      blobId: reservation.blobId,
      uploadUrl: reservation.uploadUrl,
      rootHash: new Uint8Array(reservation.rootHash),
    };
  } catch (error) {
    console.error('Failed to initiate Shelby upload:', error);
    throw new Error('Failed to initiate upload session');
  }
}

// Complete upload to Shelby
export async function completeUpload(
  blobId: string,
  fileData: Buffer,
  encryptionKey?: Uint8Array
): Promise<UploadResult> {
  try {
    let dataToUpload = fileData;

    // Encrypt if key provided
    if (encryptionKey) {
      dataToUpload = await encryptBuffer(fileData, encryptionKey);
    }

    // Upload to Shelby
    const result = await shelby.uploadBlob({
      blobId,
      data: dataToUpload,
    });

    // Verify upload
    const verified = await shelby.verifyBlob({
      blobId,
      rootHash: result.rootHash,
    });

    if (!verified) {
      throw new Error('Blob verification failed');
    }

    return {
      blobId,
      rootHash: new Uint8Array(result.rootHash),
      size: fileData.length,
    };
  } catch (error) {
    console.error('Failed to complete Shelby upload:', error);
    throw new Error('Failed to complete upload');
  }
}

// Retrieve blob from Shelby
export async function retrieveBlob(
  blobId: string,
  decryptionKey?: Uint8Array
): Promise<Buffer> {
  try {
    const blob = await shelby.getBlob({ blobId });

    if (decryptionKey) {
      return decryptBuffer(Buffer.from(blob.data), decryptionKey);
    }

    return Buffer.from(blob.data);
  } catch (error) {
    console.error('Failed to retrieve blob:', error);
    throw new Error('Failed to retrieve file');
  }
}

// Generate encryption key for client-side encryption
export function generateEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Encrypt buffer using AES-256-GCM
async function encryptBuffer(data: Buffer, key: Uint8Array): Promise<Buffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  // Prepend IV to encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(result);
}

// Decrypt buffer using AES-256-GCM
async function decryptBuffer(data: Buffer, key: Uint8Array): Promise<Buffer> {
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    cryptoKey,
    encrypted
  );

  return Buffer.from(decrypted);
}

// Calculate storage cost
export function calculateStorageCost(sizeBytes: number, months: number = 1): number {
  const bytesPerGB = 1073741824;
  const costPerGBMonthOctas = 100000; // 0.001 APT

  const gb = Math.ceil(sizeBytes / bytesPerGB);
  return gb * costPerGBMonthOctas * months;
}
