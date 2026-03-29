'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Heart, Share2, Download, Eye, Clock, Shield, Loader2 } from 'lucide-react';
import { formatApt, getTierName, TIER_VIEW, TIER_BORROW, TIER_LICENSE, TIER_COMMERCIAL } from '@/lib/aptos';
import toast from 'react-hot-toast';

interface ContentDetail {
  contentId: bigint;
  creator: string;
  title: string;
  description: string;
  contentType: string;
  previewBlobId: string;
  viewPrice: bigint;
  borrowPrice: bigint;
  licensePrice: bigint;
  commercialPrice: bigint;
  tags: string[];
  uploadTimestamp: number;
}

export default function ContentDetailPage() {
  const params = useParams();
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    fetchContent();
  }, [params.id]);

  const fetchContent = async () => {
    try {
      // Mock data for now
      const mockContent: ContentDetail = {
        contentId: BigInt(params.id as string),
        creator: '0x1234567890abcdef1234567890abcdef12345678',
        title: 'Summer Vibes EP',
        description: 'A collection of electronic music tracks perfect for summer. Features 5 original tracks including the hit single "Midnight Drive".',
        contentType: 'audio/mpeg',
        previewBlobId: 'blob1',
        viewPrice: BigInt(100000),
        borrowPrice: BigInt(500000),
        licensePrice: BigInt(1000000),
        commercialPrice: BigInt(5000000),
        tags: ['music', 'electronic', 'summer', 'upbeat'],
        uploadTimestamp: Date.now() - 86400000,
      };

      setContent(mockContent);

      // Check if user has access
      if (connected && account) {
        // In production, check on-chain
        setHasAccess(false);
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
      const transaction = {
        data: {
          function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::marketplace::purchase_access`,
          functionArguments: [
            content.contentId.toString(),
            tier.toString(),
          ],
        },
      };

      const result = await signAndSubmitTransaction(transaction);

      toast.success('Purchase successful!');
      setHasAccess(true);
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
          <p className="text-gray-600">The content you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden mb-6">
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-6xl">♪</span>
              </div>
            </div>

            {/* Content Info */}
            <div className="card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {formatAddress(content.creator)}</span>
                    <span>•</span>
                    <span>{formatDate(content.uploadTimestamp)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{content.description}</p>

              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Creator Info */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">About the Creator</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                <div>
                  <p className="font-medium">{formatAddress(content.creator)}</p>
                  <p className="text-sm text-gray-500">Creator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Purchase Options */}
          <div>
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Access Options</h3>

              {hasAccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">You have access</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info('Download starting...')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* View Tier */}
                  {content.viewPrice > 0 && (
                    <button
                      onClick={() => handlePurchase(TIER_VIEW)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">View (24 hours)</p>
                            <p className="text-sm text-gray-500">Stream content</p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {isPurchasing && selectedTier === TIER_VIEW ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(Number(content.viewPrice))
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Borrow Tier */}
                  {content.borrowPrice > 0 && (
                    <button
                      onClick={() => handlePurchase(TIER_BORROW)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium">Borrow (7 days)</p>
                            <p className="text-sm text-gray-500">Extended access</p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {isPurchasing && selectedTier === TIER_BORROW ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(Number(content.borrowPrice))
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* License Tier */}
                  {content.licensePrice > 0 && (
                    <button
                      onClick={() => handlePurchase(TIER_LICENSE)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">License</p>
                            <p className="text-sm text-gray-500">Permanent download</p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {isPurchasing && selectedTier === TIER_LICENSE ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(Number(content.licensePrice))
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Commercial Tier */}
                  {content.commercialPrice > 0 && (
                    <button
                      onClick={() => handlePurchase(TIER_COMMERCIAL)}
                      disabled={isPurchasing}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">Commercial</p>
                            <p className="text-sm text-gray-500">Full commercial rights</p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {isPurchasing && selectedTier === TIER_COMMERCIAL ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            formatApt(Number(content.commercialPrice))
                          )}
                        </span>
                      </div>
                    </button>
                  )}

                  <p className="text-sm text-gray-500 text-center mt-4">
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
