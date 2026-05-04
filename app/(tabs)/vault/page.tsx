'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image as ImageIcon, Video, Music, FileText, Trash2, Download, Lock, Globe, Loader2, ArrowLeft, Eye, Folder as FolderIcon, X } from 'lucide-react';
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
  storageFee: number | null;
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
  const [currentFolder, setCurrentFolder] = useState<{name: string, files: StoredFile[]} | null>(null);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);


  
  const groupedItems = useMemo(() => {
    const groups: Record<string, StoredFile[]> = {};
    const singles: StoredFile[] = [];

    files.forEach(f => {
      const match = f.name.match(/^(.*?) (\d+)(\.[^.]+)?$/);
      if (match) {
        const base = match[1];
        if (!groups[base]) groups[base] = [];
        groups[base].push(f);
      } else {
        singles.push(f);
      }
    });

    const result: any[] = [...singles];
    
    Object.entries(groups).forEach(([base, gFiles]) => {
      if (gFiles.length === 1) {
        result.push(gFiles[0]);
      } else {
        result.push({
          isFolder: true,
          name: base,
          id: `folder-${base}`,
          files: gFiles.sort((a, b) => a.name.localeCompare(b.name)),
          size: gFiles.reduce((acc, current) => acc + BigInt(current.size), BigInt(0)),
          createdAt: gFiles[gFiles.length - 1].createdAt,
          storageFee: gFiles.reduce((acc, current) => acc + (current.storageFee || 0), 0)
        });
      }
    });

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [files]);

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

          // Step 5: Calculate storage fee based on actual file size
          // Shelby charges ~0.012 SUSD per GB per year, proportional to actual size
          const fileSizeGB = file.size / 1073741824;
          const feePerGBYear = 0.012; // SUSD
          const calculatedFee = Math.max(fileSizeGB * feePerGBYear, 0.0001); // min floor

          // Step 6: Save metadata + encryption key + fee to DB
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
              storageFee: parseFloat(calculatedFee.toFixed(8)),
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

  
  const handlePreview = async (file: StoredFile) => {
    setPreviewFile(file);
    setIsPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const response = await fetch(`/api/download/${file.blobId}?wallet=${account?.address?.toString() || ''}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
         const { default: toast } = await import('react-hot-toast');
         toast.error('Failed to load preview');
         setPreviewFile(null);
      }
    } catch (error) {
      const { default: toast } = await import('react-hot-toast');
      toast.error('Failed to load preview');
      setPreviewFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleDownload = async (blobId: string, name: string) => {
    try {
      const response = await fetch(`/api/download/${blobId}?wallet=${account?.address?.toString() || ''}`);
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
    if (contentType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
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
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto text-muted mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-secondary">Connect your wallet to access your vault</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-surface border-b border-theme">
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
            <p className="text-sm text-secondary">Storage Used</p>
            <p className="text-2xl font-bold">{formatFileSize(storageStats.totalBytes)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-secondary">ShelbyUSD Balance</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-2xl font-bold">{(Number(storageStats.walletBalance) / 1e8).toFixed(2)} SUSD</p>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-sm text-secondary">Total Fees Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {files.reduce((sum, f) => sum + (f.storageFee || 0), 0).toFixed(4)} SUSD
            </p>
          </div>
        </div>

        {/* Upload Area */}
        {stagedFiles.length > 0 ? (
          <div className="card p-6 mb-8 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Confirm Upload</h2>
              <button
                onClick={() => { setStagedFiles([]); setStagedTitle(''); setStagedDescription(''); }}
                disabled={isUploading}
                className="flex items-center gap-1 text-sm text-secondary hover:text-primary"
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
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                    {getFileIcon(f.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{finalName}</p>
                      <p className="text-xs text-muted">{(f.size / 1024 / 1024).toFixed(2)} MB · {f.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  {stagedFiles.length === 1 ? 'Name' : 'Base Name'}
                </label>
                <input
                  type="text"
                  value={stagedTitle}
                  onChange={(e) => setStagedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-theme rounded-xl bg-surface"
                  placeholder={stagedFiles[0]?.name || 'Enter name'}
                />
                {stagedFiles.length > 1 && (
                  <p className="text-xs text-secondary mt-1">
                    Files will be named <strong>{stagedTitle || 'Name'} 1</strong>, <strong>{stagedTitle || 'Name'} 2</strong>…
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Description (Optional)</label>
                <textarea
                  value={stagedDescription}
                  onChange={(e) => setStagedDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-theme rounded-xl bg-surface"
                  rows={2}
                  placeholder="Describe these files"
                />
              </div>

              {/* Progress indicator */}
              {uploadProgress && (
                <div className="p-3 bg-surface rounded-lg border border-blue-200 dark:border-blue-900/50">
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
                  className="px-6 py-3 border border-theme rounded-xl hover:bg-secondary disabled:opacity-50 font-medium"
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
              isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]' : 'border-theme hover:border-gray-400 bg-surface hover:bg-secondary'
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full shadow-inner">
               <Upload className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm font-semibold text-primary">
                {isDragActive ? 'Drop files here to securely upload' : 'Click to browse or drag & drop files here'}
              </p>
              <p className="text-xs text-secondary mt-0.5">Max 500 MB per file · Decentralized & Encrypted</p>
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
        ) : groupedItems.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <File className="w-16 h-16 mx-auto mb-4" />
            <p>No files yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            
              {currentFolder && (
                 <div className="flex items-center gap-2 mb-4 p-4 bg-surface rounded-lg border border-theme">
                    <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Back to Vault
                    </button>
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <FolderIcon className="w-5 h-5 text-blue-400" />
                      {currentFolder.name}
                    </span>
                 </div>
              )}

<table className="w-full">
              <thead className="bg-secondary border-b border-theme">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary">File</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary">Fee Paid</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(currentFolder ? currentFolder.files : groupedItems).map((item) => {
                  if (item.isFolder) {
                    return (
                      <tr key={item.id} className="hover:bg-secondary cursor-pointer" onClick={() => setCurrentFolder(item)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FolderIcon className="w-5 h-5 text-blue-500 fill-blue-100" />
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs bg-gray-100 text-secondary px-2 py-0.5 rounded-full">{item.files.length} files</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary">
                          {formatFileSize(item.size)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                          {item.storageFee != null ? item.storageFee.toFixed(4) : '—'} SUSD
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary">
                          Folder
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-sm text-secondary">—</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setCurrentFolder(item); }}
                            className="p-2 hover:bg-secondary rounded-lg text-blue-600 font-medium text-sm"
                          >
                            Open Folder
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  
                  const file = item as StoredFile;
                  return (
                    <tr key={file.id} className="hover:bg-secondary">

<td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.contentType)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {file.storageFee != null ? file.storageFee.toFixed(4) : '—'} SUSD
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {file.contentType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {file.encrypted && <Lock className="w-4 h-4 text-green-500" />}
                          {file.isPublic && <Globe className="w-4 h-4 text-blue-500" />}
                          <span className="text-sm text-secondary">
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
                          onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                          className="p-2 hover:bg-secondary rounded-lg text-blue-600"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(file.blobId, file.name); }}
                          className="p-2 hover:bg-secondary rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(file.blobId); }}
                          className="p-2 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
    
      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-theme">
              <div className="flex items-center gap-3">
                {getFileIcon(previewFile.contentType)}
                <h3 className="font-semibold text-lg">{previewFile.name}</h3>
              </div>
              <button onClick={closePreview} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-secondary flex items-center justify-center p-4 min-h-[300px]">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center text-secondary">
                   <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                   <p>Decrypting and loading preview...</p>
                </div>
              ) : previewUrl ? (
                previewFile.contentType.startsWith('image/') ? (
                  <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : previewFile.contentType.startsWith('video/') ? (
                  <video src={previewUrl} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-sm" />
                ) : previewFile.contentType.startsWith('audio/') ? (
                  <audio src={previewUrl} controls className="w-full max-w-md" />
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
                    <p className="text-secondary mb-4">Preview not available for this file type.</p>
                    <button onClick={() => handleDownload(previewFile.blobId, previewFile.name)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                       <Download className="w-4 h-4 inline mr-2" /> Download to View
                    </button>
                  </div>
                )
              ) : (
                <div className="text-secondary">Failed to load preview.</div>
              )}
            </div>
          </div>
        </div>
      )}
</div>
  );
}
