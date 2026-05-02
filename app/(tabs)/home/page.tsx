'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Star, ArrowRight, Music, Image, Video, FileText, Zap, Users, BarChart2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { formatApt } from '@/lib/aptos';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentItem {
  contentId: string;
  title: string;
  creator: string;
  contentType: string;
  streamPrice: string;
  citePrice: string;
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

const VERBS = ['Publish', 'License', 'Monetize'];

function RotatingVerbs({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % VERBS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={`relative inline-grid items-center ${align === 'right' ? 'justify-items-end' : 'justify-items-start'} h-[1.5em] overflow-hidden`}>
      <span className="invisible font-bold whitespace-nowrap col-start-1 row-start-1 px-1">
        Monetize,
      </span>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={`col-start-1 row-start-1 flex items-center text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap h-full px-1`}
        >
          {VERBS[index]},
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setIsMounted(true);
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
    { label: 'Categories', value: '12', icon: BarChart2, color: '#3b82f6' },
    { label: 'Open Market', value: 'Live', icon: TrendingUp, color: '#10b981' },
    { label: 'Creators', value: new Set(recentContent.map(c => c.creator)).size.toString(), icon: Users, color: '#ec4899' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 py-2 lg:py-4 space-y-6 lg:space-y-8">

        {/* ─── HERO ─── */}
        <section className="relative w-full rounded-3xl flex flex-col justify-center pt-2 lg:pt-4 pb-4 lg:pb-6">
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
             <div style={{
              position: 'absolute', top: '-10%', left: '-5%',
              width: '600px', height: '600px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
            }} />
             <div style={{
              position: 'absolute', bottom: '-10%', right: '-5%',
              width: '500px', height: '500px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            }} />
          </div>

          <div className="relative z-10 w-full">
            {!isMounted ? (
              <div className="animate-pulse flex flex-col items-center justify-center opacity-30 h-[160px]">
                <div className="w-64 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4" />
                <div className="w-48 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
            ) : connected ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base lg:text-lg font-semibold mb-1" style={{ color: 'var(--accent)' }}>Welcome back</p>
                  <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                    {displayAddr}
                  </h1>
                  <div className="flex items-center text-xl lg:text-2xl mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <RotatingVerbs align="left" />
                    <span className="ml-1 text-left shrink-0">your creative work.</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Continue creating or exploring the marketplace</p>
                  <div className="flex gap-3 mt-3">
                    <Link href="/explore" className="btn-primary">Explore Content <ArrowRight className="w-4 h-4" /></Link>
                    <Link href="/create" className="btn-secondary">+ Create</Link>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <Zap className="w-40 h-40 opacity-5" style={{ color: 'var(--accent)' }} />
                </div>
              </div>
            ) : (
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 text-balance leading-tight" style={{ color: 'var(--text-primary)' }}>
                  The creator economy, <br />
                  <motion.span 
                    style={{ display: 'inline-block', color: 'var(--accent)' }}
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.9 }}
                  >
                    on-chain.
                  </motion.span>
                </h1>
                
                <div className="flex justify-center items-center text-xl lg:text-2xl mb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <RotatingVerbs align="right" />
                  <span className="ml-2 text-left shrink-0">your creative work.</span>
                </div>
                
                <p className="text-sm uppercase tracking-widest font-semibold mb-8 opacity-60" style={{ color: 'var(--text-muted)' }}>
                  Permanent storage • Direct wallet payments • Zero middlemen
                </p>

                <div className="flex gap-3 justify-center">
                  <Link href="/explore" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-blue-500/25">Browse Content <ArrowRight className="w-4 h-4" /></Link>
                  <Link href="/vault" className="btn-secondary px-8 py-3.5 text-base border-gray-300 dark:border-gray-700">Store Content</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── STATS GRID ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {STATS.map((stat, idx) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
              className="card p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-[var(--border)] transition-all hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-gray-500">{stat.label}</p>
                <p className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ─── FEATURED DROPS (MOVED ABOVE LATEST) ─── */}
        {(isLoading || featured.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Featured Contents</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
                    <div className="skeleton h-48 w-full" />
                    <div className="p-5 space-y-2" style={{ background: 'var(--surface)' }}>
                       <div className="skeleton h-4 w-3/4 rounded" />
                       <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                featured.map((item, idx) => {
                  const typeKey = getTypeKey(item.contentType);
                  const ts = TYPE_STYLES[typeKey] ?? TYPE_STYLES.document;
                  return (
                    <Link
                      key={item.contentId}
                      href={`/content/${item.contentId}`}
                      className="card hover-lift overflow-hidden group shadow-md hover:shadow-xl"
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
                        <h3 className="font-bold mb-1 group-hover:text-blue-500 transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>by {formatAddress(item.creator)}</p>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Floor price</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {Number(item.streamPrice) > 0 ? formatApt(Number(item.streamPrice)) : 'Free'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ─── LATEST CONTENT ─── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Latest Content</h2>
            </div>
            <Link href="/explore" className="text-sm font-medium flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400">
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
                      className="shrink-0 hover-lift overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all"
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
                          <span className="type-badge shadow-sm" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                            {ts.label}
                          </span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-sm mb-1 truncate group-hover:text-blue-500" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>by {formatAddress(item.creator)}</p>
                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-1">
                          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>From</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {Number(item.streamPrice) > 0 ? formatApt(Number(item.streamPrice)) : 'Free'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─── BROWSE BY TAG ─── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Browse by Tag</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TAGS.map(tag => (
              <Link
                key={tag}
                href={`/explore?tag=${tag}`}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
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
