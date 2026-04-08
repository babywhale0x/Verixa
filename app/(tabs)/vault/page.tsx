'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, Video, Music, FileText, Trash2, Download, Lock, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { formatApt } from '@/lib/aptos';
import { FiatOnramp } from '@/components/wallet/FiatOnramp';
import toast from 'react-hot-toast';

interface StoredFile {
  id: string;
  blobId: string;
  name: string;
  contentType: string;
  size: bigint;
  isPublic: boolean;
  encrypted: boolean;
  createdAt: string;
}

export default function VaultPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalBytes: BigInt(0),
    walletBalance: BigInt(0),
    monthlyCost: BigInt(0),
    monthsRemaining: BigInt(0),
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [stagedTitle, setStagedTitle] = useState('');
  const [stagedDescription, setStagedDescription] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's files and storage stats
  useEffect(() => {
    if (connected && account) {
      fetchFiles();
      fetchStorageStats();
    }
  }, [connected, account]);

  const fetchFiles = async () => {
    if (!account) return;
    try {
      const response = await fetch(`/api/storage/files?wallet=${account.address.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    if (!account) return;
    try {
      const response = await fetch(`/api/storage/status?wallet=${account.address.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStorageStats({
          totalBytes: BigInt(data.totalBytes || 0),
          walletBalance: BigInt(data.walletBalance || 0),
          monthlyCost: BigInt(data.monthlyCost || 0),
          monthsRemaining: BigInt(data.monthsRemaining || 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setStagedFiles(acceptedFiles);
    setStagedTitle('');
    setStagedDescription('');
  }, [connected]);

  // ─── Upload using the BROWSER SDK (same flow as Create tab) ───
  const handleConfirmUpload = async () => {
    if (!connected || !account) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: stagedFiles.length });

    try {
      // Dynamically import the browser SDK (same as Create tab)
      const {
        createDefaultErasureCodingProvider,
        generateCommitments,
        expectedTotalChunksets,
        ShelbyBlobClient,
        ShelbyClient,
        defaultErasureCodingConfig,
      } = await import('@shelby-protocol/sdk/browser');
      const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');

      const aptosClient = new Aptos(new AptosConfig({ network: Network.TESTNET }));
      const shelbyClient = new ShelbyClient({
        network: Network.TESTNET,
        apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || '',
      });
      const provider = await createDefaultErasureCodingProvider();
      const config = defaultErasureCodingConfig();

      for (let i = 0; i < stagedFiles.length; i++) {
        const file = stagedFiles[i];
        let finalName = file.name;
        if (stagedTitle) {
          finalName = stagedFiles.length === 1
            ? stagedTitle
            : `${stagedTitle} ${i + 1}`;
        }

        const safeBase = finalName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const blobName = `vault-${Date.now()}-${safeBase}`;

        setUploadProgress({ current: i + 1, total: stagedFiles.length });
        toast.loading(`Uploading ${finalName} (${i + 1}/${stagedFiles.length})…`, { id: 'vault-upload' });

        try {
          // Step 1: Encrypt the file before upload
          const { generateEncryptionKey, encryptData } = await import('@/lib/encryption');
          const encKey = await generateEncryptionKey();
          const rawData = new Uint8Array(await file.arrayBuffer());
          const encryptedData = await encryptData(rawData, encKey);

          // Step 2: Generate commitments from ENCRYPTED data
          const commitments = await generateCommitments(provider, encryptedData);

          // Step 3: Register blob on-chain via wallet signature
          const payload = ShelbyBlobClient.createRegisterBlobPayload({
            account: account.address as any,
            blobName,
            blobMerkleRoot: commitments.blob_merkle_root,
            numChunksets: Number(expectedTotalChunksets(commitments.raw_data_size, config.chunkSizeBytes * config.erasure_k)),
            expirationMicros: Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000),
            blobSize: Number(commitments.raw_data_size),
            encoding: config.enumIndex,
          });
          const txResult = await signAndSubmitTransaction({ data: payload });
          await aptosClient.waitForTransaction({ transactionHash: txResult.hash });

          // Step 4: Upload ENCRYPTED data to Shelby RPC
          await shelbyClient.rpc.putBlob({
            account: account.address as any,
            blobName,
            blobData: encryptedData,
          });

          // Step 5: Save metadata + encryption key to DB
          await fetch('/api/upload/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: account.address.toString(),
              blobId: blobName,
              name: finalName,
              contentType: file.type,
              size: file.size,
              isPublic: false,
              encrypted: true,
              encryptionKey: encKey,
              description: stagedDescription || null,
            }),
          });

          toast.success(`Uploaded ${finalName}`, { id: 'vault-upload' });
        } catch (err: any) {
          console.error(`Upload error for ${finalName}:`, err);
          toast.error(`Failed to upload ${finalName} — ${err?.message || 'Unknown error'}`, { id: 'vault-upload' });
        }
      }

      toast.success(
        stagedFiles.length === 1 ? 'File uploaded to vault!' : `${stagedFiles.length} files uploaded to vault!`,
        { id: 'vault-upload' },
      );

      setStagedFiles([]);
      setStagedTitle('');
      setStagedDescription('');
      fetchFiles();
      fetchStorageStats();
    } catch (error: any) {
      console.error('Vault upload error:', error);
      toast.error(error?.message || 'Failed to upload', { id: 'vault-upload' });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 1024 * 1024 * 500, // 500MB
  });

  const handleDelete = async (blobId: string) => {
    try {
      const response = await fetch(`/api/storage/files/${blobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File deleted');
        fetchFiles();
        fetchStorageStats();
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (blobId: string, name: string) => {
    try {
      const response = await fetch(`/api/download/${blobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: bigint) => {
    const num = Number(bytes);
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (contentType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (contentType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const ExpiryTimer = ({ createdAt }: { createdAt: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const calculateTime = () => {
        const expiryDate = new Date(new Date(createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);
        const diffTime = Math.max(0, expiryDate.getTime() - Date.now());
        if (diffTime === 0) return 'Expired';
        
        const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diffTime % (1000 * 60)) / 1000);
        
        return `${d}d ${h}h ${m}m ${s}s`;
      };

      setTimeLeft(calculateTime());
      const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
      return () => clearInterval(interval);
    }, [createdAt]);

    return <span>{timeLeft}</span>;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to access your vault</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Your Vault</h1>
            <button
              onClick={() => setShowFundModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <span>Fund Wallet</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-2xl font-bold">{formatFileSize(storageStats.totalBytes)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">ShelbyUSD Balance</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-2xl font-bold">{(Number(storageStats.walletBalance) / 1e8).toFixed(2)} SUSD</p>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Total Storage Fees (Yearly Rate)</p>
            <p className="text-2xl font-bold text-green-600">{((Number(storageStats.totalBytes) / 1073741824) * 0.012).toFixed(4)} SUSD</p>
          </div>
        </div>

        {/* Upload Area */}
        {stagedFiles.length > 0 ? (
          <div className="card p-6 mb-8 border border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Confirm Upload</h2>
              <button
                onClick={() => { setStagedFiles([]); setStagedTitle(''); setStagedDescription(''); }}
                disabled={isUploading}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" /> Change files
              </button>
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
              {stagedFiles.map((f, i) => {
                const finalName = stagedTitle
                  ? (stagedFiles.length === 1 ? stagedTitle : `${stagedTitle} ${i + 1}`)
                  : f.name;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    {getFileIcon(f.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{finalName}</p>
                      <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB · {f.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {stagedFiles.length === 1 ? 'Name' : 'Base Name'}
                </label>
                <input
                  type="text"
                  value={stagedTitle}
                  onChange={(e) => setStagedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white"
                  placeholder={stagedFiles[0]?.name || 'Enter name'}
                />
                {stagedFiles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Files will be named <strong>{stagedTitle || 'Name'} 1</strong>, <strong>{stagedTitle || 'Name'} 2</strong>…
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={stagedDescription}
                  onChange={(e) => setStagedDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white"
                  rows={2}
                  placeholder="Describe these files"
                />
              </div>

              {/* Progress indicator */}
              {uploadProgress && (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Uploading {uploadProgress.current} of {uploadProgress.total}…
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Uploading…</> : <><Upload className="w-5 h-5" /> Upload to Vault</>}
                </button>
                <button
                  onClick={() => { setStagedFiles([]); setStagedTitle(''); setStagedDescription(''); }}
                  disabled={isUploading}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col sm:flex-row items-center justify-center gap-4 cursor-pointer transition-all mb-8 shadow-sm ${
              isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full shadow-inner">
               <Upload className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {isDragActive ? 'Drop files here to securely upload' : 'Click to browse or drag & drop files here'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Max 500 MB per file · Decentralized & Encrypted</p>
            </div>
            <button className="hidden sm:block px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm transition-colors">
              Browse Files
            </button>
          </div>
        )}

        {/* File List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File className="w-16 h-16 mx-auto mb-4" />
            <p>No files yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">File</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Yearly Fee</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.contentType)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium text-green-600">
                      {((Math.ceil(Number(file.size) / 1073741824) * 1200000) / 1e8).toFixed(4)} SUSD
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {file.contentType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {file.encrypted && <Lock className="w-4 h-4 text-green-500" />}
                          {file.isPublic && <Globe className="w-4 h-4 text-blue-500" />}
                          <span className="text-sm text-gray-600">
                            {file.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="text-xs text-orange-500 font-medium">
                          Expires in: <ExpiryTimer createdAt={file.createdAt} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file.blobId, file.name)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.blobId)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fund Modal */}
      <FiatOnramp
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        onSuccess={() => {
          setShowFundModal(false);
          fetchStorageStats();
          toast.success('Wallet funded successfully!');
        }}
      />
    </div>
  );
}
