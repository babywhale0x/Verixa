'use client';

import { useState, useCallback, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Image, Video, Music, FileText, Loader2,
  Tag, Eye, Download, Crown, X, Check, Lock, Droplets
} from 'lucide-react';
import { aptToOctas, TIER_VIEW, TIER_BORROW, TIER_LICENSE, TIER_COMMERCIAL, TIER_SUBSCRIPTION } from '@/lib/aptos';
import toast from 'react-hot-toast';

type ImagePreviewMode = 'blur' | 'watermark';

interface PricingTier {
  enabled: boolean;
  price: number;
}

const CATEGORIES = [
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'video', label: 'Video', emoji: '🎬' },
  { id: 'document', label: 'Document', emoji: '📄' },
  { id: 'research', label: 'Research', emoji: '🔬' },
  { id: 'nft', label: 'NFT', emoji: '💎' },
  { id: 'design', label: 'Design', emoji: '✏️' },
  { id: 'writing', label: 'Writing', emoji: '📝' },
  { id: 'journalism', label: 'Journalism', emoji: '📰' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export default function CreatePage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [imagePreviewMode, setImagePreviewMode] = useState<ImagePreviewMode>('blur');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tiers, setTiers] = useState<Record<number, PricingTier>>({
    [TIER_VIEW]: { enabled: true, price: 0.001 },
    [TIER_BORROW]: { enabled: false, price: 0.005 },
    [TIER_LICENSE]: { enabled: true, price: 0.01 },
    [TIER_COMMERCIAL]: { enabled: false, price: 0.05 },
    [TIER_SUBSCRIPTION]: { enabled: false, price: 0.02 },
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(c => c !== categoryId);
      }
      if (prev.length >= 3) {
        toast.error('Maximum 3 categories allowed');
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const generateImagePreview = useCallback(async (selectedFile: File, mode: ImagePreviewMode): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;

        if (mode === 'blur') {
          ctx.filter = 'blur(18px)';
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        // Watermark
        const wText = '🔒 Verixa';
        const fontSize = Math.max(16, canvas.width / 18);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.fillText(wText, canvas.width / 2, canvas.height / 2);

        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(selectedFile);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreviewFile(null);
      setGeneratedPreviewUrl(null);
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      }
      if (selectedFile.type.startsWith('image/')) {
        setIsGeneratingPreview(true);
        try {
          const dataUrl = await generateImagePreview(selectedFile, imagePreviewMode);
          setGeneratedPreviewUrl(dataUrl);
        } catch (e) {
          console.error('Preview generation failed', e);
        } finally {
          setIsGeneratingPreview(false);
        }
      }
    }
  }, [imagePreviewMode, generateImagePreview]);

  const handlePreviewModeChange = useCallback(async (mode: ImagePreviewMode) => {
    setImagePreviewMode(mode);
    if (file && file.type.startsWith('image/')) {
      setIsGeneratingPreview(true);
      try {
        const dataUrl = await generateImagePreview(file, mode);
        setGeneratedPreviewUrl(dataUrl);
      } finally {
        setIsGeneratingPreview(false);
      }
    }
  }, [file, generateImagePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 1024 * 1024 * 500,
    multiple: false,
  });

  const handleTierChange = (tier: number, field: 'enabled' | 'price', value: boolean | number) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
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
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setIsUploading(true);

    try {
      const {
        createDefaultErasureCodingProvider,
        generateCommitments,
        expectedTotalChunksets,
        ShelbyBlobClient,
        ShelbyClient,
        defaultErasureCodingConfig,
      } = await import('@shelby-protocol/sdk/browser');

      const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');

      toast.loading('Encoding file...', { id: 'upload' });
      const data = Buffer.from(await file.arrayBuffer());
      const provider = await createDefaultErasureCodingProvider();
      const commitments = await generateCommitments(provider, data);
      const config = defaultErasureCodingConfig();

      toast.loading('Registering on blockchain...', { id: 'upload' });
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const baseName = safeTitle || file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
      const blobName = `verixa-${Date.now()}-${baseName}`;

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
      const aptosClient = new Aptos(new AptosConfig({ network: Network.TESTNET }));
      await aptosClient.waitForTransaction({ transactionHash: txResult.hash });

      toast.loading('Uploading to Shelby storage...', { id: 'upload' });
      const shelbyClient = new ShelbyClient({
        network: Network.TESTNET,
        apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || '',
      });

      await shelbyClient.rpc.putBlob({
        account: account.address as any,
        blobName,
        blobData: new Uint8Array(await file.arrayBuffer()),
      });

      toast.loading('Saving metadata...', { id: 'upload' });

      // Upload preview
      let previewUrl: string | null = null;
      if (file.type.startsWith('image/') && generatedPreviewUrl) {
        previewUrl = generatedPreviewUrl;
        await fetch('/api/upload/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: account.address.toString(),
            blobId: blobName,
            previewDataUrl: generatedPreviewUrl,
          }),
        });
      } else if (previewFile) {
        const previewFormData = new FormData();
        previewFormData.append('previewFile', previewFile);
        previewFormData.append('walletAddress', account.address.toString());
        previewFormData.append('blobId', blobName);
        const previewRes = await fetch('/api/upload/preview', {
          method: 'POST',
          body: previewFormData,
        });
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          previewUrl = previewData.previewUrl;
        }
      }

      await fetch('/api/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account.address.toString(),
          blobId: blobName,
          name: title || file.name,
          contentType: file.type,
          size: file.size,
          isPublic: true,
          description,
          categories: selectedCategories,
          previewUrl,
        }),
      });

      setIsUploading(false);
      setIsPublishing(true);
      toast.loading('Publishing to marketplace...', { id: 'upload' });

      const tagList = [...tags.split(',').map((t) => t.trim()).filter(Boolean), ...selectedCategories];

      const viewPrice = tiers[TIER_VIEW].enabled ? aptToOctas(tiers[TIER_VIEW].price || 0) : 0;
      const borrowPrice = tiers[TIER_BORROW].enabled ? aptToOctas(tiers[TIER_BORROW].price || 0) : 0;
      const licensePrice = tiers[TIER_LICENSE].enabled ? aptToOctas(tiers[TIER_LICENSE].price || 0) : 0;
      const commercialPrice = tiers[TIER_COMMERCIAL].enabled ? aptToOctas(tiers[TIER_COMMERCIAL].price || 0) : 0;
      const subscriptionPrice = tiers[TIER_SUBSCRIPTION].enabled ? aptToOctas(tiers[TIER_SUBSCRIPTION].price || 0) : 0;

      await signAndSubmitTransaction({
        data: {
          function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::marketplace::publish_content` as `${string}::${string}::${string}`,
          functionArguments: [
            title,
            description,
            file.type,
            blobName,
            (() => {
              const root = commitments.blob_merkle_root;
              if (typeof root === 'string') {
                const hex = root.startsWith('0x') ? root.slice(2) : root;
                return Array.from(Buffer.from(hex, 'hex'));
              }
              return Array.from(root as Uint8Array);
            })(),
            blobName,
            viewPrice,
            borrowPrice,
            licensePrice,
            commercialPrice,
            subscriptionPrice,
            tagList,
            0,
          ],
          typeArguments: [],
        },
      });

      toast.success('Content published successfully!', { id: 'upload' });
      setFile(null);
      setPreview(null);
      setGeneratedPreviewUrl(null);
      setPreviewFile(null);
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedCategories([]);

    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error?.message || 'Failed to publish content', { id: 'upload' });
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Create Content</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: File Upload + Details */}
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
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {getFileIcon()}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => { setFile(null); setPreview(null); setGeneratedPreviewUrl(null); setPreviewFile(null); }} className="text-red-600 hover:text-red-700 text-sm">
                      Remove
                    </button>
                  </div>

                  {/* Original preview */}
                  {preview && (
                    <div>
                      {file.type.startsWith('image/') ? (
                        <img src={preview} alt="Original" className="max-h-48 rounded-lg w-full object-cover" />
                      ) : file.type.startsWith('video/') ? (
                        <video src={preview} className="max-h-48 rounded-lg w-full" controls />
                      ) : null}
                    </div>
                  )}

                  {/* Image: preview mode selector + generated preview */}
                  {file.type.startsWith('image/') && (
                    <div className="border rounded-xl p-4 space-y-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-800">Buyer Preview Style</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreviewModeChange('blur')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              imagePreviewMode === 'blur'
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
                            }`}
                          >
                            <Droplets className="w-3.5 h-3.5" /> Blur
                          </button>
                          <button
                            onClick={() => handlePreviewModeChange('watermark')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              imagePreviewMode === 'watermark'
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" /> Watermark only
                          </button>
                        </div>
                      </div>
                      {isGeneratingPreview ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Generating preview...</span>
                        </div>
                      ) : generatedPreviewUrl ? (
                        <div className="relative">
                          <img src={generatedPreviewUrl} alt="Generated preview" className="w-full rounded-lg object-cover max-h-40" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              Preview buyers will see
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Audio / Video / Doc: optional short preview upload */}
                  {(file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type.includes('pdf') || file.type.includes('document')) && (
                    <div className="border rounded-xl p-4 space-y-2 bg-purple-50 border-purple-200">
                      <p className="text-sm font-semibold text-purple-800">
                        {file.type.startsWith('audio/') && '🎵 Upload a preview clip (max 30s) — Optional'}
                        {file.type.startsWith('video/') && '🎬 Upload a trailer / teaser (max 60s) — Optional'}
                        {(file.type.includes('pdf') || file.type.includes('document')) && '📄 Upload a preview image (e.g. first page) — Optional'}
                      </p>
                      <p className="text-xs text-purple-600">This will be shown publicly to buyers before purchase. The main file stays encrypted and gated.</p>
                      <label className="block">
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          previewFile ? 'border-purple-400 bg-purple-100' : 'border-purple-300 hover:border-purple-400'
                        }`}>
                          <input
                            type="file"
                            className="hidden"
                            accept={
                              file.type.startsWith('audio/') ? 'audio/*' :
                              file.type.startsWith('video/') ? 'video/*' :
                              'image/*'
                            }
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setPreviewFile(f);
                            }}
                          />
                          {previewFile ? (
                            <div className="flex items-center justify-center gap-2 text-purple-700">
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">{previewFile.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setPreviewFile(null); }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-purple-600">Click to choose preview file</span>
                          )}
                        </div>
                      </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="Enter content title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Describe your content"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="input pl-10"
                      placeholder="summer, exclusive, rare"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Categories</h2>
                <span className="text-sm text-gray-500">{selectedCategories.length}/3 selected</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCategories.map(id => {
                    const cat = CATEGORIES.find(c => c.id === id);
                    return cat ? (
                      <span key={id} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {cat.emoji} {cat.label}
                        <button onClick={() => toggleCategory(id)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Pricing Tiers */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing Tiers</h2>
              <div className="space-y-4">
                {/* View Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">View (24 hours)</p>
                    <p className="text-sm text-gray-500">Time-limited access</p>
                  </div>
                  <label className="flex items-center gap-2 shrink-0">
                    <input type="checkbox" checked={tiers[TIER_VIEW].enabled} onChange={(e) => handleTierChange(TIER_VIEW, 'enabled', e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_VIEW].enabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" step="0.001" min="0" value={tiers[TIER_VIEW].price} onChange={(e) => handleTierChange(TIER_VIEW, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                      <span className="text-xs text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* Borrow Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Download className="w-5 h-5 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Borrow (7 days)</p>
                    <p className="text-sm text-gray-500">Extended access</p>
                  </div>
                  <label className="flex items-center gap-2 shrink-0">
                    <input type="checkbox" checked={tiers[TIER_BORROW].enabled} onChange={(e) => handleTierChange(TIER_BORROW, 'enabled', e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_BORROW].enabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" step="0.001" min="0" value={tiers[TIER_BORROW].price} onChange={(e) => handleTierChange(TIER_BORROW, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                      <span className="text-xs text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* License Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Download className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">License</p>
                    <p className="text-sm text-gray-500">Permanent download</p>
                  </div>
                  <label className="flex items-center gap-2 shrink-0">
                    <input type="checkbox" checked={tiers[TIER_LICENSE].enabled} onChange={(e) => handleTierChange(TIER_LICENSE, 'enabled', e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_LICENSE].enabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" step="0.001" min="0" value={tiers[TIER_LICENSE].price} onChange={(e) => handleTierChange(TIER_LICENSE, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                      <span className="text-xs text-gray-500">APT</span>
                    </div>
                  )}
                </div>

                {/* Commercial Tier */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Crown className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Commercial</p>
                    <p className="text-sm text-gray-500">Full commercial rights</p>
                  </div>
                  <label className="flex items-center gap-2 shrink-0">
                    <input type="checkbox" checked={tiers[TIER_COMMERCIAL].enabled} onChange={(e) => handleTierChange(TIER_COMMERCIAL, 'enabled', e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Enable</span>
                  </label>
                  {tiers[TIER_COMMERCIAL].enabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" step="0.001" min="0" value={tiers[TIER_COMMERCIAL].price} onChange={(e) => handleTierChange(TIER_COMMERCIAL, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                      <span className="text-xs text-gray-500">APT</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={isUploading || isPublishing || !file || !title || selectedCategories.length === 0}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Uploading...</>
              ) : isPublishing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Publishing...</>
              ) : (
                <><Upload className="w-5 h-5" />Publish Content</>
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
