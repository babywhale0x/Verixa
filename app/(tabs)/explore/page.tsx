'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Music, Image, Video, FileText, Loader2, Heart, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { formatApt } from '@/lib/aptos';
import { FeaturedSlideshow } from '@/components/FeaturedSlideshow';

interface Content {
  contentId: string;
  creator: string;
  title: string;
  description: string;
  contentType: string;
  previewUrl?: string;
  streamPrice: string;
  citePrice: string;
  licensePrice: string;
  tags: string[];
  uploadTimestamp: string;
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

const TYPE_FILTERS = [
  { id: 'image',    label: 'Images',    icon: Image,    match: (t: string) => t.startsWith('image/') },
  { id: 'audio',    label: 'Audio',     icon: Music,    match: (t: string) => t.startsWith('audio/') },
  { id: 'video',    label: 'Videos',    icon: Video,    match: (t: string) => t.startsWith('video/') },
  { id: 'document', label: 'Documents', icon: FileText, match: (t: string) => t.includes('pdf') || t.includes('document') },
];

const SORT_OPTIONS = [
  { id: 'newest',   label: 'Newest first' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
];

const TYPE_BG: Record<string, string> = {
  image:    'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
  audio:    'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  video:    'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  document: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
};

function getTypeKey(contentType: string): string {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  return 'document';
}

function formatAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ContentCard({ content }: { content: Content }) {
  const typeKey = getTypeKey(content.contentType);
  const bg = TYPE_BG[typeKey];
  const TypeIcon = TYPE_FILTERS.find(t => t.id === typeKey)?.icon ?? FileText;

  return (
    <Link
      href={`/content/${content.contentId}`}
      className="card hover-lift overflow-hidden block"
    >
      {/* Preview area */}
      <div className="aspect-video relative flex items-center justify-center overflow-hidden" style={{ background: bg }}>
        {content.previewUrl ? (
          content.contentType.startsWith('image/') ? (
            <img src={content.previewUrl} alt={content.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <TypeIcon className="w-12 h-12 text-white/60" />
            </div>
          )
        ) : (
          <TypeIcon className="w-12 h-12 text-white/40" />
        )}
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span
            className="type-badge"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            {typeKey.toUpperCase()}
          </span>
        </div>
        <button className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-all">
          <Heart className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {content.title}
        </h3>
        <p className="text-xs mb-3 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
          {content.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {formatAddress(content.creator)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {Number(content.streamPrice) > 0 ? formatApt(Number(content.streamPrice)) : 'Free'}
          </span>
        </div>
        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {content.tags.slice(0, 3).map(tag => (
            <span key={tag} className="badge badge-accent text-xs">#{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (sortBy) params.set('sort', sortBy);
      // We filter type/category client-side for multi-select; API supports single
      const res = await fetch(`/api/content?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const toggleType = (id: string) => setSelectedTypes(prev =>
    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
  );

  const toggleCategory = (id: string) => setSelectedCategories(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  );

  // Client-side filtering for multi-select type/category/price
  const filtered = useMemo(() => {
    let list = [...contents];

    if (selectedTypes.length > 0) {
      list = list.filter(c =>
        selectedTypes.some(t => TYPE_FILTERS.find(f => f.id === t)?.match(c.contentType))
      );
    }

    if (selectedCategories.length > 0) {
      list = list.filter(c => c.tags.some(t => selectedCategories.includes(t)));
    }

    const minApt = parseFloat(minPrice) || 0;
    const maxApt = parseFloat(maxPrice) || Infinity;
    list = list.filter(c => {
      const price = Number(c.streamPrice) / 1e8;
      return price >= minApt && price <= maxApt;
    });

    return list;
  }, [contents, selectedTypes, selectedCategories, minPrice, maxPrice]);

  const activeFiltersCount = selectedTypes.length + selectedCategories.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Types */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Content Type</h3>
        <div className="space-y-1.5">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => toggleType(f.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                background: selectedTypes.includes(f.id) ? 'var(--accent-soft)' : 'transparent',
                color: selectedTypes.includes(f.id) ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <f.icon className="w-4 h-4" />
              {f.label}
              {selectedTypes.includes(f.id) && (
                <span className="ml-auto w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--accent)', color: '#fff' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Category</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selectedCategories.includes(cat.id) ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                color: selectedCategories.includes(cat.id) ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${selectedCategories.includes(cat.id) ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Price Range (APT)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="input text-sm"
            min="0"
            step="0.001"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="input text-sm"
            min="0"
            step="0.001"
          />
        </div>
      </div>

      {/* Clear */}
      {activeFiltersCount > 0 && (
        <button
          onClick={() => { setSelectedTypes([]); setSelectedCategories([]); setMinPrice(''); setMaxPrice(''); }}
          className="w-full py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20 transition-all"
          style={{ border: '1px solid #fecaca' }}
        >
          Clear all filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Search header */}
      <div className="sticky top-16 z-30" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search content, creators, tags…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input pr-8 text-sm appearance-none cursor-pointer"
                style={{ width: 160 }}
              >
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
              style={{
                background: activeFiltersCount > 0 ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                color: activeFiltersCount > 0 ? 'var(--accent)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="mt-auto rounded-t-3xl p-6 overflow-y-auto max-h-[80vh]" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <FilterPanel />
            <button onClick={() => setShowFilters(false)} className="btn-primary w-full mt-6">
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex gap-7">

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="sticky top-36 card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="badge badge-accent">{activeFiltersCount}</span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {!isLoading && !searchQuery && activeFiltersCount === 0 && contents.length > 0 && (
              <FeaturedSlideshow items={contents.slice(0, 5)} />
            )}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isLoading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {contents.length === 0 ? 'No content published yet' : 'No results found'}
                </h3>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {contents.length === 0
                    ? 'Be the first to publish content on Verixa!'
                    : 'Try adjusting your search or filters'}
                </p>
                {contents.length === 0 ? (
                  <Link href="/create" className="btn-primary">Create Content</Link>
                ) : (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedTypes([]); setSelectedCategories([]); setMinPrice(''); setMaxPrice(''); }}
                    className="btn-primary"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(c => <ContentCard key={c.contentId} content={c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
