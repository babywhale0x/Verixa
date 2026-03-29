'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Music, Image, Video, FileText, Loader2, Heart } from 'lucide-react';
import { formatApt, getTierName } from '@/lib/aptos';

interface Content {
  contentId: bigint;
  creator: string;
  title: string;
  description: string;
  contentType: string;
  previewBlobId: string;
  viewPrice: bigint;
  licensePrice: bigint;
  tags: string[];
}

export default function ExplorePage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      // In production, this would fetch from the blockchain
      // For now, using mock data
      const mockContents: Content[] = [
        {
          contentId: BigInt(1),
          creator: '0x1234567890abcdef',
          title: 'Summer Vibes EP',
          description: 'Electronic music collection',
          contentType: 'audio/mpeg',
          previewBlobId: 'blob1',
          viewPrice: BigInt(100000), // 0.001 APT
          licensePrice: BigInt(1000000), // 0.01 APT
          tags: ['music', 'electronic', 'summer'],
        },
        {
          contentId: BigInt(2),
          creator: '0xabcdef1234567890',
          title: 'Nature Photography Collection',
          description: 'High resolution nature photos',
          contentType: 'image/jpeg',
          previewBlobId: 'blob2',
          viewPrice: BigInt(50000),
          licensePrice: BigInt(500000),
          tags: ['photography', 'nature', 'landscape'],
        },
      ];

      setContents(mockContents);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContents = contents.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || 
                       (selectedType === 'image' && content.contentType.startsWith('image/')) ||
                       (selectedType === 'video' && content.contentType.startsWith('video/')) ||
                       (selectedType === 'audio' && content.contentType.startsWith('audio/')) ||
                       (selectedType === 'document' && content.contentType.includes('pdf'));
    return matchesSearch && matchesType;
  });

  const getContentIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (contentType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (contentType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Explore</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content, creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'image', 'video', 'audio', 'document'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No content found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content) => (
              <Link
                key={content.contentId.toString()}
                href={`/content/${content.contentId.toString()}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {content.contentType.startsWith('image/') ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                  ) : content.contentType.startsWith('audio/') ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Music className="w-12 h-12 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {getContentIcon(content.contentType)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{content.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                      <span className="text-sm text-gray-600">
                        {formatAddress(content.creator)}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Heart className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Pricing */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Starting from</span>
                      <span className="font-semibold text-blue-600">
                        {content.viewPrice > 0 
                          ? formatApt(Number(content.viewPrice))
                          : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {content.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
