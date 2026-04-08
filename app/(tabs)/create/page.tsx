'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Image, Video, Music, FileText, Loader2, Star,
  Tag, Eye, Download, Crown, X, Check, Lock, Droplets, ArrowLeft
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

const getFileTypeIcon = (type: string, size = 'md') => {
  const cls = size === 'sm' ? 'w-5 h-5' : 'w-10 h-10';
  if (type.startsWith('image/')) return <Image className={`${cls} text-blue-500`} />;
  if (type.startsWith('video/')) return <Video className={`${cls} text-red-500`} />;
  if (type.startsWith('audio/')) return <Music className={`${cls} text-purple-500`} />;
  return <FileText className={`${cls} text-gray-500`} />;
};

export default function CreatePage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();

  // Staging state
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [baseTitle, setBaseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imagePreviewMode, setImagePreviewMode] = useState<ImagePreviewMode>('blur');
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // Per-file generated previews: indexed by file index
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<number, string>>({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<{ current: number; total: number } | null>(null);

  // Recent creations state
  const [recentCreations, setRecentCreations] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Fetch recent creations
  const fetchRecentCreations = useCallback(async () => {
    if (!account) return;
    setIsLoadingRecent(true);
    try {
      const res = await fetch(`/api/profile/content?walletAddress=${account.address.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const publishedFiles = data.files ? data.files.filter((f: any) => f.isPublished) : [];
        setRecentCreations(publishedFiles.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [account]);

  // Load on mount
  require('react').useEffect(() => {
    if (connected && account) fetchRecentCreations();
  }, [connected, account, fetchRecentCreations]);

  const [tiers, setTiers] = useState<Record<number, PricingTier>>({
    [TIER_VIEW]: { enabled: true, price: 0.001 },
    [TIER_BORROW]: { enabled: false, price: 0.005 },
    [TIER_LICENSE]: { enabled: true, price: 0.01 },
    [TIER_COMMERCIAL]: { enabled: false, price: 0.05 },
    [TIER_SUBSCRIPTION]: { enabled: false, price: 0.02 },
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) return prev.filter(c => c !== categoryId);
      if (prev.length >= 3) { toast.error('Maximum 3 categories allowed'); return prev; }
      return [...prev, categoryId];
    });
  };

  const generateImagePreview = useCallback(async (file: File, mode: ImagePreviewMode): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        if (mode === 'blur') ctx.filter = 'blur(18px)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        const fontSize = Math.max(16, canvas.width / 18);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.fillText('🔒 Verixa', canvas.width / 2, canvas.height / 2);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setStagedFiles(acceptedFiles);
    setBaseTitle('');
    setPreviewFile(null);
    setGeneratedPreviews({});

    // Auto-generate previews for image files
    const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setIsGeneratingPreview(true);
      const previews: Record<number, string> = {};
      for (let i = 0; i < acceptedFiles.length; i++) {
        if (acceptedFiles[i].type.startsWith('image/')) {
          try {
            previews[i] = await generateImagePreview(acceptedFiles[i], imagePreviewMode);
          } catch (e) {
            console.error('Preview generation failed for', acceptedFiles[i].name);
          }
        }
      }
      setGeneratedPreviews(previews);
      setIsGeneratingPreview(false);
    }
  }, [imagePreviewMode, generateImagePreview]);

  const handlePreviewModeChange = useCallback(async (mode: ImagePreviewMode) => {
    setImagePreviewMode(mode);
    if (stagedFiles.length === 0) return;
    setIsGeneratingPreview(true);
    const previews: Record<number, string> = {};
    for (let i = 0; i < stagedFiles.length; i++) {
      if (stagedFiles[i].type.startsWith('image/')) {
        try {
          previews[i] = await generateImagePreview(stagedFiles[i], mode);
        } catch (e) { /* skip */ }
      }
    }
    setGeneratedPreviews(previews);
    setIsGeneratingPreview(false);
  }, [stagedFiles, generateImagePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 1024 * 1024 * 500,
    multiple: true,
  });

  const handleTierChange = (tier: number, field: 'enabled' | 'price', value: boolean | number) => {
    setTiers(prev => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  };

  const resetAll = () => {
    setStagedFiles([]);
    setBaseTitle('');
    setDescription('');
    setTags('');
    setSelectedCategories([]);
    setPreviewFile(null);
    setGeneratedPreviews({});
    setPublishProgress(null);
  };

  const handlePublish = async () => {
    if (!connected || !account) { toast.error('Please connect your wallet'); return; }
    if (stagedFiles.length === 0) { toast.error('Please select at least one file'); return; }
    if (!baseTitle.trim()) { toast.error('Please enter a title for your content'); return; }
    if (selectedCategories.length === 0) { toast.error('Please select at least one category'); return; }

    setIsPublishing(true);
    setPublishProgress({ current: 0, total: stagedFiles.length });

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

      const aptosClient = new Aptos(new AptosConfig({ network: Network.TESTNET }));
      const shelbyClient = new ShelbyClient({
        network: Network.TESTNET,
        apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || '',
      });
      const provider = await createDefaultErasureCodingProvider();
      const config = defaultErasureCodingConfig();

      const safeBase = baseTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const tagList = [...tags.split(',').map(t => t.trim()).filter(Boolean), ...selectedCategories];
      const viewPrice = tiers[TIER_VIEW].enabled ? aptToOctas(tiers[TIER_VIEW].price || 0) : 0;
      const borrowPrice = tiers[TIER_BORROW].enabled ? aptToOctas(tiers[TIER_BORROW].price || 0) : 0;
      const licensePrice = tiers[TIER_LICENSE].enabled ? aptToOctas(tiers[TIER_LICENSE].price || 0) : 0;
      const commercialPrice = tiers[TIER_COMMERCIAL].enabled ? aptToOctas(tiers[TIER_COMMERCIAL].price || 0) : 0;
      const subscriptionPrice = tiers[TIER_SUBSCRIPTION].enabled ? aptToOctas(tiers[TIER_SUBSCRIPTION].price || 0) : 0;

      for (let i = 0; i < stagedFiles.length; i++) {
        const file = stagedFiles[i];
        const finalTitle = stagedFiles.length === 1 ? baseTitle.trim() : `${baseTitle.trim()} ${i + 1}`;
        const blobName = `verixa-${Date.now()}-${safeBase}${stagedFiles.length > 1 ? `-${i + 1}` : ''}`;

        setPublishProgress({ current: i + 1, total: stagedFiles.length });
        toast.loading(`Publishing ${finalTitle} (${i + 1}/${stagedFiles.length})…`, { id: 'upload' });

        try {
          // Step 1: Encrypt the file before upload
          const { generateEncryptionKey, encryptData } = await import('@/lib/encryption');
          const encKey = await generateEncryptionKey();
          const rawData = new Uint8Array(await file.arrayBuffer());
          const encryptedData = await encryptData(rawData, encKey);

          // Step 2: Generate commitments from ENCRYPTED data
          const commitments = await generateCommitments(provider, encryptedData);

          // Step 3: Register on-chain
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

          // Step 4: Upload ENCRYPTED data to Shelby
          await shelbyClient.rpc.putBlob({
            account: account.address as any,
            blobName,
            blobData: encryptedData,
          });

          // Handle preview (previews are NOT encrypted — they are the blurred/watermarked version)
          let previewUrl: string | null = null;
          if (file.type.startsWith('image/') && generatedPreviews[i]) {
            previewUrl = generatedPreviews[i];
            await fetch('/api/upload/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: account.address.toString(),
                blobId: blobName,
                previewDataUrl: generatedPreviews[i],
              }),
            });
          } else if (previewFile && i === 0) {
            // Preview clip only applies to the first file in a batch for audio/video/docs
            const previewFormData = new FormData();
            previewFormData.append('previewFile', previewFile);
            previewFormData.append('walletAddress', account.address.toString());
            previewFormData.append('blobId', blobName);
            const previewRes = await fetch('/api/upload/preview', { method: 'POST', body: previewFormData });
            if (previewRes.ok) previewUrl = (await previewRes.json()).previewUrl;
          }

          // Publish to marketplace FIRST to get the on-chain content ID
          const root = commitments.blob_merkle_root;
          const rootBytes = typeof root === 'string'
            ? Array.from(Buffer.from(root.startsWith('0x') ? root.slice(2) : root, 'hex'))
            : Array.from(root as Uint8Array);

          const publishTx = await signAndSubmitTransaction({
            data: {
              function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::marketplace::publish_content` as `${string}::${string}::${string}`,
              functionArguments: [finalTitle, description, file.type, blobName, rootBytes, blobName,
                viewPrice, borrowPrice, licensePrice, commercialPrice, subscriptionPrice, tagList, 0],
              typeArguments: [],
            },
          });
          await aptosClient.waitForTransaction({ transactionHash: publishTx.hash });

          // Get the actual on-chain content ID assigned by the contract
          const { getCreatorContents } = await import('@/lib/contract-queries');
          const contentIds = await getCreatorContents(account.address.toString());
          const onChainContentId = contentIds.length > 0
            ? contentIds[contentIds.length - 1].toString()
            : Date.now().toString();

          // NOW save metadata + pricing + encryption key with the real on-chain content ID
          await fetch('/api/upload/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: account.address.toString(),
              blobId: blobName,
              name: finalTitle,
              contentType: file.type,
              size: file.size,
              isPublic: true,
              encrypted: true,
              encryptionKey: encKey,
              description,
              categories: selectedCategories,
              tags: tagList,
              previewUrl,
              viewPrice,
              borrowPrice,
              licensePrice,
              commercialPrice,
              subscriptionPrice,
              onChainContentId,
            }),
          });

          toast.success(`Published: ${finalTitle}`, { id: 'upload' });
        } catch (err: any) {
          console.error(`Failed to publish ${finalTitle}:`, err);
          toast.error(`Failed: ${finalTitle} — ${err?.message || 'Unknown error'}`, { id: 'upload' });
        }
      }

      toast.success(
        stagedFiles.length === 1 ? 'Content published!' : `${stagedFiles.length} items published!`,
        { id: 'upload' }
      );
      fetchRecentCreations();
      resetAll();
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error?.message || 'Failed to publish content', { id: 'upload' });
    } finally {
      setIsPublishing(false);
      setPublishProgress(null);
    }
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

        {/* ─── STEP 1: Drop Zone (no files staged yet) ─── */}
        {stagedFiles.length === 0 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors mb-8 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-14 h-14 mx-auto text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-700">
              {isDragActive ? 'Drop files here' : 'Drag & drop your files here'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Max 500 MB per file • Multiple files supported</p>
          </div>
        )}

        {/* ─── RECENT CREATIONS (Only visible when no files are staged) ─── */}
        {stagedFiles.length === 0 && connected && recentCreations.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" /> Your Recent Creations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recentCreations.map((file) => (
                <div key={file.id} className="card overflow-hidden hover-lift flex flex-col border border-gray-200">
                  <div className="h-28 relative bg-gray-100 flex items-center justify-center">
                    {file.previewUrl ? (
                      file.contentType.startsWith('image/')
                        ? <img src={file.previewUrl} className="w-full h-full object-cover" alt="preview" />
                        : getFileTypeIcon(file.contentType, 'sm')
                    ) : getFileTypeIcon(file.contentType, 'sm')}
                  </div>
                  <div className="p-3 bg-white flex-1">
                    <h4 className="font-semibold text-sm truncate mb-1">{file.name}</h4>
                    <p className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Staging + Details (files selected) ─── */}
        {stagedFiles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left column */}
            <div className="space-y-6">

              {/* Staged files list */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {stagedFiles.length === 1 ? '1 File Selected' : `${stagedFiles.length} Files Selected`}
                  </h2>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change files
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stagedFiles.map((f, i) => {
                    const finalName = baseTitle
                      ? (stagedFiles.length === 1 ? baseTitle : `${baseTitle} ${i + 1}`)
                      : null;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getFileTypeIcon(f.type, 'sm')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {finalName ?? <span className="text-gray-400 italic">Awaiting title…</span>}
                          </p>
                          <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB · {f.type}</p>
                        </div>
                        {generatedPreviews[i] && (
                          <img src={generatedPreviews[i]} alt="preview" className="w-10 h-10 rounded object-cover border border-gray-200" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Drop more files */}
                <div
                  {...getRootProps()}
                  className="mt-3 border border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <input {...getInputProps()} />
                  <p className="text-xs text-gray-500">{isDragActive ? 'Drop here' : '+ Add more files'}</p>
                </div>
              </div>

              {/* Content Details */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Content Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {stagedFiles.length === 1 ? 'Title *' : 'Base Title *'}
                    </label>
                    <input
                      type="text"
                      value={baseTitle}
                      onChange={e => setBaseTitle(e.target.value)}
                      className="input"
                      placeholder={stagedFiles.length === 1 ? 'Enter content title' : 'e.g. "Summer Collection" → Summer Collection 1, 2, 3…'}
                    />
                    {stagedFiles.length > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Files will be published as <strong>{baseTitle || 'Title'} 1</strong>, <strong>{baseTitle || 'Title'} 2</strong>…
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
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
                        onChange={e => setTags(e.target.value)}
                        className="input pl-10"
                        placeholder="summer, exclusive, rare"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image preview mode — only when at least one image is staged */}
              {stagedFiles.some(f => f.type.startsWith('image/')) && (
                <div className="card p-6 border border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
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
                    <div className="flex items-center gap-2 text-blue-600 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating previews…</span>
                    </div>
                  ) : Object.keys(generatedPreviews).length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(generatedPreviews).map(([idx, url]) => (
                        <img key={idx} src={url} alt="preview" className="h-20 rounded-lg object-cover border border-blue-200" />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Audio/Video/Doc preview clip upload */}
              {stagedFiles.some(f => f.type.startsWith('audio/') || f.type.startsWith('video/') || f.type.includes('pdf') || f.type.includes('document')) && (
                <div className="card p-4 border border-purple-200 bg-purple-50 space-y-2">
                  <p className="text-sm font-semibold text-purple-800">Preview File — Optional</p>
                  <p className="text-xs text-purple-600">Upload a short clip or preview image buyers can see before purchasing. Will apply to the first file in the batch.</p>
                  <label className="block">
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      previewFile ? 'border-purple-400 bg-purple-100' : 'border-purple-300 hover:border-purple-400'
                    }`}>
                      <input
                        type="file"
                        className="hidden"
                        accept="audio/*,video/*,image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setPreviewFile(f); }}
                      />
                      {previewFile ? (
                        <div className="flex items-center justify-center gap-2 text-purple-700">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">{previewFile.name}</span>
                          <button type="button" onClick={e => { e.preventDefault(); setPreviewFile(null); }} className="text-red-500 hover:text-red-700">
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

              {/* Categories */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Categories</h2>
                  <span className="text-sm text-gray-500">{selectedCategories.length}/3 selected</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
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
                          <button onClick={() => toggleCategory(id)}><X className="w-3 h-3" /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Pricing + Publish */}
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Pricing Tiers</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">View (24 hours)</p>
                      <p className="text-sm text-gray-500">Time-limited access</p>
                    </div>
                    <label className="flex items-center gap-2 shrink-0">
                      <input type="checkbox" checked={tiers[TIER_VIEW].enabled} onChange={e => handleTierChange(TIER_VIEW, 'enabled', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Enable</span>
                    </label>
                    {tiers[TIER_VIEW].enabled && (
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" step="0.001" min="0" value={tiers[TIER_VIEW].price} onChange={e => handleTierChange(TIER_VIEW, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                        <span className="text-xs text-gray-500">APT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Download className="w-5 h-5 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Borrow (7 days)</p>
                      <p className="text-sm text-gray-500">Extended access</p>
                    </div>
                    <label className="flex items-center gap-2 shrink-0">
                      <input type="checkbox" checked={tiers[TIER_BORROW].enabled} onChange={e => handleTierChange(TIER_BORROW, 'enabled', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Enable</span>
                    </label>
                    {tiers[TIER_BORROW].enabled && (
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" step="0.001" min="0" value={tiers[TIER_BORROW].price} onChange={e => handleTierChange(TIER_BORROW, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                        <span className="text-xs text-gray-500">APT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Download className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">License</p>
                      <p className="text-sm text-gray-500">Permanent download</p>
                    </div>
                    <label className="flex items-center gap-2 shrink-0">
                      <input type="checkbox" checked={tiers[TIER_LICENSE].enabled} onChange={e => handleTierChange(TIER_LICENSE, 'enabled', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Enable</span>
                    </label>
                    {tiers[TIER_LICENSE].enabled && (
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" step="0.001" min="0" value={tiers[TIER_LICENSE].price} onChange={e => handleTierChange(TIER_LICENSE, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                        <span className="text-xs text-gray-500">APT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Commercial</p>
                      <p className="text-sm text-gray-500">Full commercial rights</p>
                    </div>
                    <label className="flex items-center gap-2 shrink-0">
                      <input type="checkbox" checked={tiers[TIER_COMMERCIAL].enabled} onChange={e => handleTierChange(TIER_COMMERCIAL, 'enabled', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Enable</span>
                    </label>
                    {tiers[TIER_COMMERCIAL].enabled && (
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" step="0.001" min="0" value={tiers[TIER_COMMERCIAL].price} onChange={e => handleTierChange(TIER_COMMERCIAL, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                        <span className="text-xs text-gray-500">APT</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              {publishProgress && (
                <div className="card p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Publishing {publishProgress.current} of {publishProgress.total}…
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${(publishProgress.current / publishProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={isPublishing || stagedFiles.length === 0 || !baseTitle.trim() || selectedCategories.length === 0}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Publishing…</>
                ) : (
                  <><Upload className="w-5 h-5" />
                    {stagedFiles.length <= 1 ? 'Publish Content' : `Publish ${stagedFiles.length} Items`}
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Platform fee: 10% • You receive 90% of all sales
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
