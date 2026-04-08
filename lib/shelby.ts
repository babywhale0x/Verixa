import { Network, Ed25519PrivateKey, Ed25519Account } from '@aptos-labs/ts-sdk';

// Lazy-initialised client – avoids crashing the module on import
// (the Shelby SDK pulls in WASM / native deps that can fail at
// module-evaluation time in some runtimes like Vercel Edge).
let _shelbyClient: any = null;

async function getShelbyClient() {
  if (_shelbyClient) return _shelbyClient;

  try {
    const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node');
    _shelbyClient = new ShelbyNodeClient({
      network: Network.TESTNET,
      apiKey: process.env.SHELBY_API_KEY || '',
    });
    return _shelbyClient;
  } catch (error) {
    console.error('Failed to initialise ShelbyNodeClient:', error);
    throw new Error('Shelby SDK initialisation failed');
  }
}

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
  // Ensure the SDK loads successfully before returning a session
  await getShelbyClient();

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
    const client = await getShelbyClient();
    const account = getAccount();
    const blobName = `${blobId}/${fileName}`;
    const expirationMicros = (Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000;

    // The SDK expects Uint8Array — Buffer is a subclass so this works
    await client.upload({
      signer: account,
      blobData: new Uint8Array(fileData),
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
    const client = await getShelbyClient();
    const account = getAccount();

    const blob = await client.download({
      account: account.accountAddress,
      blobName,
    });

    // ShelbyBlob.readable is a Web ReadableStream, not a Node stream.
    const reader = blob.readable.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Shelby download error:', error);
    throw new Error('Failed to download from Shelby storage');
  }
}

export function generateBlobId(): string {
  return `verixa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}