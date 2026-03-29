'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Star, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface FeaturedContent {
  id: string;
  title: string;
  creator: string;
  type: string;
  price: number;
  image: string;
}

export default function HomePage() {
  const { connected } = useWallet();
  const [featured, setFeatured] = useState<FeaturedContent[]>([]);
  const [recent, setRecent] = useState<FeaturedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Mock data for now
      setFeatured([
        {
          id: '1',
          title: 'Midnight Jazz Collection',
          creator: '0x1234...5678',
          type: 'audio',
          price: 0.01,
          image: 'gradient1',
        },
        {
          id: '2',
          title: 'Urban Photography',
          creator: '0xabcd...efgh',
          type: 'image',
          price: 0.005,
          image: 'gradient2',
        },
        {
          id: '3',
          title: 'Electronic Beats Vol. 1',
          creator: '0x9876...5432',
          type: 'audio',
          price: 0.02,
          image: 'gradient3',
        },
      ]);

      setRecent([
        {
          id: '4',
          title: 'Nature Documentary',
          creator: '0x1111...2222',
          type: 'video',
          price: 0.05,
          image: 'gradient4',
        },
        {
          id: '5',
          title: 'Design Assets Pack',
          creator: '0x3333...4444',
          type: 'image',
          price: 0.015,
          image: 'gradient5',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradient = (id: string) => {
    const gradients: Record<string, string> = {
      gradient1: 'from-purple-500 to-pink-500',
      gradient2: 'from-blue-500 to-cyan-500',
      gradient3: 'from-green-500 to-teal-500',
      gradient4: 'from-orange-500 to-red-500',
      gradient5: 'from-indigo-500 to-purple-500',
    };
    return gradients[id] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Home</h1>
            <div className="flex items-center gap-4">
              <Link href="/explore" className="text-blue-600 hover:text-blue-700">
                Explore All
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        {!connected && (
          <div className="card p-6 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Verixa</h2>
                <p className="text-blue-100 mb-4">
                  Connect your wallet to start storing files and discovering creator content.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden md:block">
                <Zap className="w-24 h-24 text-white/20" />
              </div>
            </div>
          </div>
        )}

        {/* Featured Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Featured</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className={`aspect-video bg-gradient-to-br ${getGradient(item.image)} flex items-center justify-center`}>
                    <span className="text-white text-4xl font-bold opacity-50">
                      {item.type === 'audio' && '♪'}
                      {item.type === 'image' && '◈'}
                      {item.type === 'video' && '▶'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      by {item.creator.slice(0, 6)}...{item.creator.slice(-4)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 capitalize">{item.type}</span>
                      <span className="font-semibold text-blue-600">{item.price} APT</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Recently Added</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className={`h-32 bg-gradient-to-br ${getGradient(item.image)}`} />
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {item.creator.slice(0, 6)}...{item.creator.slice(-4)}
                    </p>
                    <span className="text-sm font-semibold text-blue-600">{item.price} APT</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trending Tags */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Trending Tags</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {['music', 'photography', 'video', 'design', 'art', 'electronic', 'nature', 'tutorial'].map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${tag}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
