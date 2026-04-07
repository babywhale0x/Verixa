'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, Video, Music, FileText, Trash2, Download, Lock, Globe, Loader2 } from 'lucide-react';
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
  const { connected, account } = useWallet();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalBytes: BigInt(0),
    walletBalance: BigInt(0),
    monthlyCost: BigInt(0),
    monthsRemaining: BigInt(0),
  });
  const [isUploading, setIsUploading] = useState(false);
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
    try {
      const response = await fetch('/api/storage/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const response = await fetch('/api/storage/status');
      if (response.ok) {
        const data = await response.json();
        setStorageStats({
          totalBytes: BigInt(data.totalBytes),
          walletBalance: BigInt(data.walletBalance),
          monthlyCost: BigInt(data.monthlyCost),
          monthsRemaining: BigInt(data.monthsRemaining),
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

  const handleConfirmUpload = async () => {
    if (!connected || !account) return;
    
    setIsUploading(true);

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      let finalName = file.name;
      if (stagedTitle) {
        finalName = i === 0 ? stagedTitle : `${stagedTitle} ${i + 1}`;
      }

      try {
        // Step 1: Initiate upload
        const initResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileSize: file.size,
            contentType: file.type,
            encrypted: true,
            walletAddress: account.address.toString(),
          }),
        });

        if (initResponse.status === 402) {
          toast.error('Insufficient storage balance. Please fund your wallet.');
          setShowFundModal(true);
          break;
        }

        if (!initResponse.ok) {
          throw new Error('Failed to initiate upload');
        }

        const { blobId } = await initResponse.json();

        // Step 2: Upload file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({
          blobId,
          name: finalName,
          description: stagedDescription || null,
          contentType: file.type,
          isPublic: false,
          walletAddress: account.address.toString(),
        }));

        const uploadResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        toast.success(`Uploaded ${finalName}`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${finalName}`);
      }
    }

    setIsUploading(false);
    setStagedFiles([]);
    setStagedTitle('');
    setStagedDescription('');
    fetchFiles();
    fetchStorageStats();
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-2xl font-bold">{formatFileSize(storageStats.totalBytes)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Wallet Balance</p>
            <p className="text-2xl font-bold">{formatApt(Number(storageStats.walletBalance))}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="text-2xl font-bold">{formatApt(Number(storageStats.monthlyCost))}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Months Remaining</p>
            <p className="text-2xl font-bold">{storageStats.monthsRemaining.toString()}</p>
          </div>
        </div>

        {/* Upload Area */}
        {stagedFiles.length > 0 ? (
          <div className="card p-6 mb-8 border border-blue-200 bg-blue-50">
            <h2 className="text-lg font-semibold mb-4">Confirm Upload</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{stagedFiles.length} file(s) selected.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Name</label>
                <input
                  type="text"
                  value={stagedTitle}
                  onChange={(e) => setStagedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white"
                  placeholder={stagedFiles[0].name}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If uploading multiple files, they will be numbered automatically (e.g., Name, Name 2). Leave blank to use original.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={stagedDescription}
                  onChange={(e) => setStagedDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white"
                  rows={2}
                  placeholder="Shared description for these files"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Uploading...</> : 'Upload to Vault'}
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
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-8 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {file.contentType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {file.encrypted && <Lock className="w-4 h-4 text-green-500" />}
                        {file.isPublic && <Globe className="w-4 h-4 text-blue-500" />}
                        <span className="text-sm text-gray-600">
                          {file.encrypted ? 'Encrypted' : 'Private'}
                        </span>
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
