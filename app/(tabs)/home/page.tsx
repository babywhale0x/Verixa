'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Star, ArrowRight, Music, Image, Video, FileText, Zap, Users, BarChart2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface ContentItem {
  id: string;
  title: string;
  creator: string;
  type: string;
  price: number;
  previewUrl?: string;
  trending?: boolean;
}

const STATS = [
  { label: '24h Volume', value: '142 APT', icon: BarChart2, color: '#6366f1' },
  { label: 'Total Items', value: '2,841', icon: Star, color: '#f59e0b' },
  { label: 'Top Sale', value: '5.2 APT', icon: TrendingUp, color: '#10b981' },
  { label: 'Creators', value: '384', icon: Users, color: '#ec4899' },
];

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

function getTypeIcon(type: string) {
  if (type === 'audio')    return <Music className="w-5 h-5" />;
  if (type === 'image')    return <Image className="w-5 h-5" />;
  if (type === 'video')    return <Video className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

const MOCK_TRENDING: ContentItem[] = [
  { id: '1', title: 'Midnight Jazz Collection', creator: '0x1234...5678', type: 'audio', price: 0.01, trending: true },
  { id: '2', title: 'Urban Photography Vol. 3', creator: '0xabcd...ef01', type: 'image', price: 0.005, trending: true },
  { id: '3', title: 'Electronic Beats Pack', creator: '0x9876...5432', type: 'audio', price: 0.02 },
  { id: '4', title: 'Motion Graphics Bundle', creator: '0x2222...3333', type: 'video', price: 0.05, trending: true },
  { id: '5', title: 'NFT Artwork Series', creator: '0x4444...5555', type: 'image', price: 0.015 },
];

const MOCK_FEATURED: ContentItem[] = [
  { id: '6', title: 'Nature Documentary Shorts', creator: '0x1111...2222', type: 'video', price: 0.05 },
  { id: '7', title: 'Design Assets Mega Pack', creator: '0x3333...4444', type: 'image', price: 0.015 },
  { id: '8', title: 'Research Papers Bundle', creator: '0x5555...6666', type: 'document', price: 0.008 },
];

export default function HomePage() {
  const { connected, account } = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const shortAddress = account?.address?.toString() ?? '';
  const displayAddr = shortAddress ? `${shortAddress.slice(0, 6)}…${shortAddress.slice(-4)}` : '';

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

        {/* ─── TRENDING NOW ─── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trending Now</h2>
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
              : MOCK_TRENDING.map((item, idx) => {
                  const ts = TYPE_STYLES[item.type] ?? TYPE_STYLES.document;
                  return (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="shrink-0 hover-lift overflow-hidden rounded-2xl"
                      style={{ width: 280, background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      {/* Preview */}
                      <div className="relative h-40 flex items-center justify-center" style={{ background: GRADIENTS[idx % GRADIENTS.length] }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', transform: 'scale(2)' }}>{getTypeIcon(item.type)}</div>
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="type-badge" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                            {ts.label}
                          </span>
                          {item.trending && (
                            <span className="type-badge" style={{ background: 'rgba(255,165,0,0.85)', color: '#fff' }}>
                              🔥 Hot
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>by {item.creator}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{item.price} APT</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─── FEATURED DROPS ─── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Featured Drops</h2>
            </div>
            <Link href="/explore" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden card">
                    <div className="skeleton h-48 w-full" />
                    <div className="p-5 space-y-2">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                    </div>
                  </div>
                ))
              : MOCK_FEATURED.map((item, idx) => {
                  const ts = TYPE_STYLES[item.type] ?? TYPE_STYLES.document;
                  return (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="card hover-lift overflow-hidden group"
                    >
                      {/* Ribbon */}
                      <div className="relative h-48 flex items-center justify-center" style={{ background: GRADIENTS[(idx + 3) % GRADIENTS.length] }}>
                        <div style={{ color: 'rgba(255,255,255,0.35)', transform: 'scale(3)' }}>{getTypeIcon(item.type)}</div>
                        <div className="absolute top-3 left-3">
                          <span className="type-badge" style={{ background: 'rgba(99,102,241,0.9)', color: '#fff' }}>✦ FEATURED</span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="type-badge" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>by {item.creator}</p>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Floor price</span>
                          <span className="font-bold" style={{ color: 'var(--accent)' }}>{item.price} APT</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─── TRENDING TAGS ─── */}
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
