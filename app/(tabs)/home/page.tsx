'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Star, ArrowRight, Music, Image, Video, FileText, Zap, Users, BarChart2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { formatApt } from '@/lib/aptos';

interface ContentItem {
  contentId: string;
  title: string;
  creator: string;
  contentType: string;
  viewPrice: string;
  previewUrl?: string;
  tags: string[];
  uploadTimestamp: string;
}

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  audio:    { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed', label: 'Audio' },
  image:    { bg: 'rgba(59,130,246,0.15)', color: '#2563eb', label: 'Image' },
  video:    { bg: 'rgba(239,68,68,0.15)',  color: '#dc2626', label: 'Video' },
  document: { bg: 'rgba(16,185,129,0.15)', color: '#059669', label: 'Doc' },
};

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
];

const TRENDING_TAGS = ['music', 'photography', 'nft', 'design', 'art', 'electronic', 'nature', 'tutorial', 'video', 'research'];

function getTypeKey(contentType: string): string {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  return 'document';
}

function getTypeIcon(type: string) {
  if (type === 'audio')    return <Music className="w-5 h-5" />;
  if (type === 'image')    return <Image className="w-5 h-5" />;
  if (type === 'video')    return <Video className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

function formatAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function HomePage() {
  const { connected, account } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content?sort=newest&limit=20');
      if (res.ok) {
        const data = await res.json();
        setRecentContent(data.contents || []);
        setTotalItems(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shortAddress = account?.address?.toString() ?? '';
  const displayAddr = shortAddress ? `${shortAddress.slice(0, 6)}…${shortAddress.slice(-4)}` : '';

  // Split content into trending (first 5) and featured (next 3)
  const trending = recentContent.slice(0, 5);
  const featured = recentContent.slice(5, 8);

  const STATS = [
    { label: 'Total Items', value: totalItems.toString(), icon: Star, color: '#f59e0b' },
    { label: 'Categories', value: '12', icon: BarChart2, color: '#6366f1' },
    { label: 'Open Market', value: 'Live', icon: TrendingUp, color: '#10b981' },
    { label: 'Creators', value: new Set(recentContent.map(c => c.creator)).size.toString(), icon: Users, color: '#ec4899' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '-80px', left: '-120px',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-100px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          {connected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>Welcome back</p>
                <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                  {displayAddr}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Continue creating or exploring the marketplace</p>
                <div className="flex gap-3 mt-6">
                  <Link href="/explore" className="btn-primary">Explore Content <ArrowRight className="w-4 h-4" /></Link>
                  <Link href="/create" className="btn-secondary">+ Create</Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <Zap className="w-40 h-40 opacity-5" style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          ) : (
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 badge badge-accent">
                <Zap className="w-3 h-3" /> Built on Aptos + Shelby Protocol
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-balance" style={{ color: 'var(--text-primary)' }}>
                The creator economy,{' '}
                <span style={{ color: 'var(--accent)' }}>on-chain.</span>
              </h1>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                Publish, license and monetise your creative work. Permanent storage, direct wallet payments, zero middlemen.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/explore" className="btn-primary">Browse Content <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/" className="btn-secondary">Connect Wallet</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="scroll-row justify-around">
            {STATS.map(stat => (
              <div key={stat.label} className="flex items-center gap-3 stat-chip">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* ─── LATEST CONTENT ─── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Latest Content</h2>
            </div>
            <Link href="/explore" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="scroll-row pb-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="shrink-0 rounded-2xl overflow-hidden" style={{ width: 280, border: '1px solid var(--border)' }}>
                    <div className="skeleton h-40 w-full" />
                    <div className="p-4 space-y-2" style={{ background: 'var(--surface)' }}>
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              : trending.length === 0 ? (
                  <div className="w-full text-center py-12">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-primary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No content yet — be the first to publish!</p>
                    <Link href="/create" className="btn-primary mt-4 inline-flex">Create Content</Link>
                  </div>
                )
              : trending.map((item, idx) => {
                  const typeKey = getTypeKey(item.contentType);
                  const ts = TYPE_STYLES[typeKey] ?? TYPE_STYLES.document;
                  return (
                    <Link
                      key={item.contentId}
                      href={`/content/${item.contentId}`}
                      className="shrink-0 hover-lift overflow-hidden rounded-2xl"
                      style={{ width: 280, background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      {/* Preview */}
                      <div className="relative h-40 flex items-center justify-center" style={{ background: GRADIENTS[idx % GRADIENTS.length] }}>
                        {item.previewUrl && item.contentType.startsWith('image/') ? (
                          <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.4)', transform: 'scale(2)' }}>{getTypeIcon(typeKey)}</div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="type-badge" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                            {ts.label}
                          </span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>by {formatAddress(item.creator)}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                            {Number(item.viewPrice) > 0 ? formatApt(Number(item.viewPrice)) : 'Free'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─── FEATURED DROPS ─── */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>More to Explore</h2>
              </div>
              <Link href="/explore" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map((item, idx) => {
                const typeKey = getTypeKey(item.contentType);
                const ts = TYPE_STYLES[typeKey] ?? TYPE_STYLES.document;
                return (
                  <Link
                    key={item.contentId}
                    href={`/content/${item.contentId}`}
                    className="card hover-lift overflow-hidden group"
                  >
                    {/* Ribbon */}
                    <div className="relative h-48 flex items-center justify-center" style={{ background: GRADIENTS[(idx + 3) % GRADIENTS.length] }}>
                      {item.previewUrl && item.contentType.startsWith('image/') ? (
                        <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div style={{ color: 'rgba(255,255,255,0.35)', transform: 'scale(3)' }}>{getTypeIcon(typeKey)}</div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="type-badge" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>by {formatAddress(item.creator)}</p>
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Floor price</span>
                        <span className="font-bold" style={{ color: 'var(--accent)' }}>
                          {Number(item.viewPrice) > 0 ? formatApt(Number(item.viewPrice)) : 'Free'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── BROWSE BY TAG ─── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Browse by Tag</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TAGS.map(tag => (
              <Link
                key={tag}
                href={`/explore?tag=${tag}`}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
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
