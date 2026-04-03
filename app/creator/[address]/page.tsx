'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Users, Image, Music, Video, FileText, Loader2, Crown, Check } from 'lucide-react';
import { getCreatorContents, getCreatorStats, hasActiveSubscription } from '@/lib/contract-queries';
import { formatApt } from '@/lib/aptos';
import toast from 'react-hot-toast';

interface CreatorProfile {
  address: string;
  totalContents: bigint;
  totalSales: bigint;
  totalEarnings: bigint;
  subscriberCount: bigint;
}

interface Content {
  contentId: bigint;
  title: string;
  contentType: string;
  viewPrice: bigint;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const creatorAddress = params.address as string;
  const isOwnProfile = account?.address?.toString() === creatorAddress;

  useEffect(() => {
    fetchCreatorData();
  }, [creatorAddress, connected]);

  const fetchCreatorData = async () => {
    try {
      // Fetch creator stats
      const stats = await getCreatorStats(creatorAddress);

      setCreator({
        address: creatorAddress,
        totalContents: stats.totalContents,
        totalSales: stats.totalSales,
        totalEarnings: stats.totalEarnings,
        subscriberCount: stats.subscriberCount,
      });

      // Fetch creator contents
      const contentIds = await getCreatorContents(creatorAddress);

      // Fetch details for each content
      const contentsData: Content[] = [];
      for (const id of contentIds.slice(0, 10)) {
        // In production, fetch actual content details
        contentsData.push({
          contentId: id,
          title: `Content #${id.toString()}`,
          contentType: 'image/jpeg',
          viewPrice: BigInt(100000),
        });
      }
      setContents(contentsData);

      // Check subscription status
      if (connected && account) {
        const subscribed = await hasActiveSubscription(account.address, creatorAddress);
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSubscribing(true);

    try {
      const transaction = {
        data: {
          function: `${process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS}::subscription::subscribe`,
          functionArguments: [creatorAddress],
        },
      };

      const result = await signAndSubmitTransaction(transaction);

      toast.success('Subscribed successfully!');
      setIsSubscribed(true);
      fetchCreatorData();
    } catch (error) {
      console.error('Subscription failed:', error);
      toast.error('Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getContentIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (contentType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (contentType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {creatorAddress.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Creator {formatAddress(creatorAddress)}
                </h1>
                <div className="flex items-center gap-6 text-gray-600">
                  <span className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    {creator?.totalContents.toString()} works
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {creator?.subscriberCount.toString()} subscribers
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleSubscribe}
                disabled={isSubscribing || isSubscribed}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  isSubscribed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <Check className="w-5 h-5" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Subscribe
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Sales</p>
              <p className="text-2xl font-bold">{creator?.totalSales.toString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold">
                {creator ? formatApt(Number(creator.totalEarnings)) : '0 APT'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Content Items</p>
              <p className="text-2xl font-bold">{creator?.totalContents.toString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold mb-6">Published Works</h2>

        {contents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No content published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
              <a
                key={content.contentId.toString()}
                href={`/content/${content.contentId.toString()}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {getContentIcon(content.contentType)}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{content.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {content.contentType.split('/')[1].toUpperCase()}
                    </span>
                    <span className="font-semibold text-blue-600">
                      {formatApt(Number(content.viewPrice))}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
