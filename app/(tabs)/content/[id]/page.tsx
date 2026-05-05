'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Heart, Share2, Download, Eye, Clock, Shield, Loader2, Lock, Music, Video, FileText, Crown } from 'lucide-react';
import { formatApt, getTierName, TIER_STREAM, TIER_CITE, TIER_LICENSE, TIER_COMMERCIAL } from '@/lib/aptos';
import toast from 'react-hot-toast';

interface ContentDetail {
  contentId: string;
  creator: string;
  title: string;
  description: string;
  contentType: string;
  previewUrl?: string;
  streamPrice: string;
  citePrice: string;
  licensePrice: string;
  commercialPrice: string;
  tags: string[];
  uploadTimestamp: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    fetchContent();
  }, [params.id]);

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/content/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      } else {
        setContent(null);
      }

      // Check if user has access
      if (connected && account) {
        try {
          const accessRes = await fetch(`/api/content/${params.id}/access?wallet=${account.address.toString()}`);
          if (accessRes.ok) {
            const accessData = await accessRes.json();
            setHasAccess(accessData.hasAccess);
            setCanDownload(accessData.canDownload);
          }
        } catch (e) {
          console.error('Failed to check access:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (tier: number) => {
    if (!connected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!content) return;

    setIsPurchasing(true);
    setSelectedTier(tier);

    try {
      const result = await signAndSubmitTransaction({
        data: {
          function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::marketplace::purchase_access` as `${string}::${string}::${string}`,
          functionArguments: [
            content.contentId,
            tier.toString(),
          ],
          typeArguments: [],
        },
      });

      // Price maps for DB recording
      const priceMap: Record<number, number> = {
        1: Number(content.streamPrice),
        2: Number(content.citePrice),
        3: Number(content.licensePrice),
        4: Number(content.commercialPrice)
      };

      // 1. Sync the permanent certificate with our backend 
      try {
        const certRes = await fetch('/api/purchase/certify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: result.hash,
            tier: tier,
            contentId: content.contentId,
            buyerAddress: account.address.toString(),
            amount: priceMap[tier] || 0
          })
        });
        
        if (!certRes.ok) {
          const errData = await certRes.json();
          throw new Error(errData.error || 'Failed to generate certificate');
        }
        toast.success('Purchase successful! Certificate generated.');
      } catch (err: any) {
        console.error("Failed to sync certificate implicitly: ", err);
        toast.error(`Transaction confirmed, but certificate failed: ${err.message}. Please refresh.`);
      }

      // Re-fetch to update access dynamically
      setTimeout(fetchContent, 2000);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed');
    } finally {
      setIsPurchasing(false);
      setSelectedTier(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">Content Not Found</h2>
          <p className="text-text-secondary">The content you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const streamPrice = Number(content.streamPrice);
  const citePrice = Number(content.citePrice);
  const licensePrice = Number(content.licensePrice);
  const commercialPrice = Number(content.commercialPrice);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden mb-6">
              <div className="relative aspect-video bg-surface   flex items-center justify-center overflow-hidden">
                {content.previewUrl || (hasAccess && (content as any).shelbyBlobId) ? (
                  content.contentType.startsWith('audio/') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-surface  ">
                      <Music className="w-16 h-16 text-purple-300" />
                      <audio src={hasAccess && (content as any).shelbyBlobId ? `/api/download/${(content as any).shelbyBlobId}?wallet=${account?.address?.toString()}` : content.previewUrl} controls className="w-full max-w-sm" />
                    </div>
                  ) : content.contentType.startsWith('video/') ? (
                    <video src={hasAccess && (content as any).shelbyBlobId ? `/api/download/${(content as any).shelbyBlobId}?wallet=${account?.address?.toString()}` : content.previewUrl} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={hasAccess && (content as any).shelbyBlobId ? `/api/download/${(content as any).shelbyBlobId}?wallet=${account?.address?.toString()}` : content.previewUrl} alt={content.title} className="w-full h-full object-cover" />
                  )
                ) : content.contentType.startsWith('audio/') ? (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <Music className="w-16 h-16 text-purple-300" />
                    <span className="text-purple-300 text-sm">Audio content</span>
                  </div>
                ) : content.contentType.startsWith('video/') ? (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <Video className="w-16 h-16 text-text-muted" />
                    <span className="text-text-muted text-sm">Video content</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <FileText className="w-16 h-16 text-gray-300" />
                    <span className="text-gray-300 text-sm">Document</span>
                  </div>
                )}

                {/* Lock overlay for non-purchasers */}
                {!hasAccess && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <div className="bg-surface/10 border border-white/20 rounded-xl px-6 py-4 text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white font-medium text-sm">Purchase to unlock full content</p>
                      {content.previewUrl && (
                        <p className="text-white/70 text-xs mt-1">↑ Preview only</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Info */}
            <div className="card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-medium mb-2">{content.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>By {formatAddress(content.creator)}</span>
                    <span>•</span>
                    <span>{formatDate(content.uploadTimestamp)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-bg rounded-lg">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="p-2 hover:bg-bg rounded-lg"
                    title="Share this content"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-primary mb-4">{content.description}</p>

              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-light text-text-secondary rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Creator Info */}
            <div className="card p-6">
              <h3 className="font-medium mb-4">About the Creator</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface   rounded-full" />
                <div>
                  <p className="font-medium">{formatAddress(content.creator)}</p>
                  <p className="text-sm text-text-secondary">Creator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Purchase Options */}
          <div>
            <div className="card p-6 sticky top-24">
              <h3 className="font-medium mb-4">Access Options</h3>

              {hasAccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">You have access</span>
                    </div>
                    {canDownload ? (
                      <p className="text-sm text-green-600">You can download this content.</p>
                    ) : (
                      <p className="text-sm text-green-600">You can view/stream this content.</p>
                    )}
                  </div>
                  {canDownload && (
                    <button
                      onClick={async () => {
                        const blobId = (content as any).shelbyBlobId;
                        if (!blobId) return toast.error('File not found');
                        try {
                          toast.loading('Downloading...', { id: 'download' });
                          const res = await fetch(`/api/download/${blobId}?wallet=${account?.address?.toString()}`);
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = content.title;
                            a.click();
                            window.URL.revokeObjectURL(url);
                            toast.success('Download complete!', { id: 'download' });
                          } else {
                            toast.error('Failed to download', { id: 'download' });
                          }
                        } catch (e) {
                          toast.error('Download error', { id: 'download' });
                        }
                      }}
                      className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Final File
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Stream Tier */}
                  {streamPrice > 0 && (
                    <button
                      onClick={() => handlePurchase(1)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-border rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Stream (In-App)</p>
                            <p className="text-sm text-text-secondary">Full access in-app, no download</p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {isPurchasing && selectedTier === 1 ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(streamPrice)
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Cite Tier */}
                  {citePrice > 0 && (
                    <button
                      onClick={() => handlePurchase(2)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-border rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium">Cite</p>
                            <p className="text-sm text-text-secondary">On-chain citation certificate + access</p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {isPurchasing && selectedTier === 2 ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(citePrice)
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* License Tier */}
                  {licensePrice > 0 && (
                    <button
                      onClick={() => handlePurchase(3)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-border rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">License</p>
                            <p className="text-sm text-text-secondary">Download + private use rights + certificate</p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {isPurchasing && selectedTier === 3 ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(licensePrice)
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Commercial Tier */}
                  {commercialPrice > 0 && (
                    <button
                      onClick={() => handlePurchase(4)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-border rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Crown className="w-5 h-5 text-text-muted" />
                          <div>
                            <p className="font-medium">Commercial</p>
                            <p className="text-sm text-text-secondary">Download + full commercial rights + certificate</p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {isPurchasing && selectedTier === 4 ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(commercialPrice)
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  <p className="text-sm text-text-secondary text-center mt-4">
                    90% goes to creator • 10% platform fee
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
