'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Video, Music, FileText, Loader2, DollarSign, Tag, Eye, Download, Crown } from 'lucide-react';
import { aptToOctas, TIER_VIEW, TIER_BORROW, TIER_LICENSE, TIER_COMMERCIAL, TIER_SUBSCRIPTION } from '@/lib/aptos';
import toast from 'react-hot-toast';

interface PricingTier {
  enabled: boolean;
  price: number;
}

export default function CreatePage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [tiers, setTiers] = useState<Record<number, PricingTier>>({
    [TIER_VIEW]: { enabled: true, price: 0.001 },
    [TIER_BORROW]: { enabled: false, price: 0.005 },
    [TIER_LICENSE]: { enabled: true, price: 0.01 },
    [TIER_COMMERCIAL]: { enabled: false, price: 0.05 },
    [TIER_SUBSCRIPTION]: { enabled: false, price: 0.02 },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      // Create preview for images/videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 1024 * 1024 * 500, // 500MB
    multiple: false,
  });

  const handleTierChange = (tier: number, field: 'enabled' | 'price', value: boolean | number) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value,
      },
    }));
  };

  const handlePublish = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!file || !title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload file to Shelby
      const initResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileSize: file.size,
          contentType: file.type,
          encrypted: false, // Public content is not encrypted
        }),
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.error || 'Failed to initiate upload');
      }

      const { blobId, rootHash } = await initResponse.json();

      // Step 2: Complete upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        blobId,
        name: file.name,
        contentType: file.type,
        isPublic: true,
      }));

      const uploadResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Publish to blockchain
      setIsUploading(false);
      setIsPublishing(true);

      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const transaction = {
        data: {
          function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::marketplace::publish_content`,
          functionArguments: [
            title,
            description,
            file.type,
            blobId,
            Array.from(new Uint8Array(rootHash)),
            blobId, // preview_blob_id (same as main for now)
            tiers[TIER_VIEW].enabled ? aptToOctas(tiers[TIER_VIEW].price) : 0,
            tiers[TIER_BORROW].enabled ? aptToOctas(tiers[TIER_BORROW].price) : 0,
            tiers[TIER_LICENSE].enabled ? aptToOctas(tiers[TIER_LICENSE].price) : 0,
            tiers[TIER_COMMERCIAL].enabled ? aptToOctas(tiers[TIER_COMMERCIAL].price) : 0,
            tiers[TIER_SUBSCRIPTION].enabled ? aptToOctas(tiers[TIER_SUBSCRIPTION].price) : 0,
            tagList,
            0, // collection_id
          ],
        },
      };

      const result = await signAndSubmitTransaction(transaction);

      toast.success('Content published successfully!');

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setTags('');

    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish content');
    } finally {
      setIsUploading(false);
      setIsPublishing(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="w-12 h-12 text-gray-400" />;
    if (file.type.startsWith('image/')) return <Image className="w-12 h-12 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-12 h-12 text-red-500" />;
    if (file.type.startsWith('audio/')) return <Music className="w-12 h-12 text-purple-500" />;
    return <FileText className="w-12 h-12 text-gray-500" />;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to publish content</p>
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
            <h1 className="text-xl font-bold">Create Content</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: File Upload */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>

              {!file ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {getFileIcon()}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  {preview && (
                    <div className="mt-4">
                      {file.type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" className="max-h-64 rounded-lg" />
                      ) : file.type.startsWith('video/') ? (
                        <video src={preview} className="max-h-64 rounded-lg" controls />
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Content Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="Enter content title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="Describe your content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="input pl-10"
                      placeholder="music, electronic, exclusive"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Pricing Tiers */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing Tiers</h2>

              <div className="space-y-4">
                {/* View Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">View (24 hours)</p>
                    <p className="text-sm text-gray-500">Time-limited access to view content</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tiers[TIER_VIEW].enabled}
                      onChange={(e) => handleTierChange(TIER_VIEW, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_VIEW].enabled && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={tiers[TIER_VIEW].price}
                        onChange={(e) => handleTierChange(TIER_VIEW, 'price', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <span className="text-sm text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* Borrow Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Download className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="font-medium">Borrow (7 days)</p>
                    <p className="text-sm text-gray-500">Extended access with reference rights</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tiers[TIER_BORROW].enabled}
                      onChange={(e) => handleTierChange(TIER_BORROW, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_BORROW].enabled && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={tiers[TIER_BORROW].price}
                        onChange={(e) => handleTierChange(TIER_BORROW, 'price', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <span className="text-sm text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* License Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Download className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">License</p>
                    <p className="text-sm text-gray-500">Permanent download with watermark</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tiers[TIER_LICENSE].enabled}
                      onChange={(e) => handleTierChange(TIER_LICENSE, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_LICENSE].enabled && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={tiers[TIER_LICENSE].price}
                        onChange={(e) => handleTierChange(TIER_LICENSE, 'price', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <span className="text-sm text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* Commercial Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium">Commercial License</p>
                    <p className="text-sm text-gray-500">Full commercial usage rights</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tiers[TIER_COMMERCIAL].enabled}
                      onChange={(e) => handleTierChange(TIER_COMMERCIAL, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_COMMERCIAL].enabled && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={tiers[TIER_COMMERCIAL].price}
                        onChange={(e) => handleTierChange(TIER_COMMERCIAL, 'price', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <span className="text-sm text-gray-500">APT</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isUploading || isPublishing || !file || !title}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publish Content
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Platform fee: 10% • You receive 90% of all sales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
