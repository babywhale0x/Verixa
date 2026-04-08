'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { 
  User, ExternalLink, Copy, History, Download, Eye, Lock, 
  Crown, Play, Image as ImageIcon, FileText, Music, BarChart2,
  Package, DollarSign, Tag, Check, X, Loader2, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { formatApt } from '@/lib/aptos';
import { FiatOnramp } from '@/components/wallet/FiatOnramp';
import toast from 'react-hot-toast';

interface ProfileStats {
  listed: number;
  sold: number;
  earned: number;
  purchased: number;
}

interface MyContent {
  id: string;
  blobId: string;
  name: string;
  contentType: string;
  isPublished: boolean;
  previewUrl: string | null;
  createdAt: string;
  contentId: string | null;
}

interface PurchasedItem {
  id: string;
  tierId: number;
  amountPaid: number;
  purchaseTimestamp: string;
  content: {
    title: string;
    files: Array<{
      name: string;
      contentType: string;
      previewUrl: string | null;
      blobId: string;
    }>;
  };
}

const TIER_LABELS: Record<number, string> = {
  1: 'View (24h)',
  2: 'Borrow (7d)',
  3: 'License',
  4: 'Commercial',
  5: 'Subscription'
};

function getTypeIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-500" />;
  if (type.startsWith('video/')) return <Play className="w-5 h-5 text-red-500" />;
  return <FileText className="w-5 h-5 text-green-500" />;
}

export default function ProfilePage() {
  const { connected, account } = useWallet();
  const [activeTab, setActiveTab] = useState<'items' | 'purchases' | 'history'>('items');
  const [showFundModal, setShowFundModal] = useState(false);
  
  const [aptBalance, setAptBalance] = useState<number | null>(null);
  const [shelbyBalance, setShelbyBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ listed: 0, sold: 0, earned: 0, purchased: 0 });
  
  const [myFiles, setMyFiles] = useState<MyContent[]>([]);
  const [purchases, setPurchases] = useState<PurchasedItem[]>([]);
  
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // For toggle operations
  const [togglingFileId, setTogglingFileId] = useState<string | null>(null);

  useEffect(() => {
    if (connected && account) {
      loadAllData();
    }
  }, [connected, account]);

  const loadAllData = async () => {
    if (!account) return;
    const addr = account.address.toString();
    fetchBalances(addr);
    
    setIsLoadingStats(true);
    setIsLoadingContent(true);
    try {
      const [statsRes, contentRes, purchasesRes] = await Promise.all([
        fetch(`/api/profile/stats?walletAddress=${addr}`),
        fetch(`/api/profile/content?walletAddress=${addr}`),
        fetch(`/api/profile/purchases?walletAddress=${addr}`)
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (contentRes.ok) setMyFiles((await contentRes.json()).files || []);
      if (purchasesRes.ok) setPurchases((await purchasesRes.json()).purchases || []);
    } catch (e) {
      console.error('Failed to load profile data', e);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingContent(false);
    }
  };

  const fetchBalances = async (address: string) => {
    setIsLoadingBalances(true);
    try {
      // Fetch APT
      const aptGql = await fetch('https://api.testnet.aptoslabs.com/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           query: `{ current_fungible_asset_balances(where: {owner_address: {_eq: "${address}"}, asset_type: {_eq: "0x1::aptos_coin::AptosCoin"}}) { amount } }`
        })
      });
      if (aptGql.ok) {
        const bal = (await aptGql.json())?.data?.current_fungible_asset_balances?.[0]?.amount;
        setAptBalance(Number(bal || 0));
      }
      
      // Fetch ShelbyUSD
      const shelbyMetadata = '0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1';
      const indexerRes = await fetch('https://api.testnet.aptoslabs.com/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           query: `{ current_fungible_asset_balances(where: {owner_address: {_eq: "${address}"}, asset_type: {_eq: "${shelbyMetadata}"}}) { amount } }`
        })
      });
      if (indexerRes.ok) {
        const balances = (await indexerRes.json())?.data?.current_fungible_asset_balances;
        setShelbyBalance(balances?.length ? Number(balances[0].amount) : 0);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success('Address copied');
    }
  };

  const handleTogglePublish = async (fileId: string, currentStatus: boolean) => {
    if (!account) return;
    setTogglingFileId(fileId);
    try {
      const res = await fetch(`/api/content/${fileId}/delist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account.address.toString(),
          isPublished: !currentStatus
        })
      });
      if (res.ok) {
        toast.success(currentStatus ? 'Item delisted from platform' : 'Item re-listed successfully');
        setMyFiles(files => files.map(f => f.id === fileId ? { ...f, isPublished: !currentStatus } : f));
      } else {
        throw new Error('Failed to update status');
      }
    } catch (e) {
      toast.error('Failed to update item status');
    } finally {
      setTogglingFileId(null);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center card p-10 max-w-sm w-full mx-4 glow">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Your Profile</h2>
          <p className="text-sm text-secondary mb-6">Connect your wallet to manage your assets, view your purchased content, and track your creator stats.</p>
        </div>
      </div>
    );
  }

  const shortAddr = account?.address.toString();
  const displayAddr = shortAddr ? `${shortAddr.slice(0, 8)}...${shortAddr.slice(-6)}` : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ─── Profile Header ─── */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 card">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md"
             style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
          {displayAddr.slice(0,2).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold tracking-tight mb-2">{displayAddr}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
            <button onClick={copyAddress} className="flex items-center gap-1.5 text-secondary hover:text-accent transition-colors">
              <Copy className="w-4 h-4" /> Copy Address
            </button>
            <a href={`https://explorer.aptoslabs.com/account/${shortAddr}?network=testnet`} target="_blank" rel="noreferrer" 
               className="flex items-center gap-1.5 text-secondary hover:text-accent transition-colors">
              <ExternalLink className="w-4 h-4" /> View on Explorer
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFundModal(true)} className="btn-primary py-2 px-4 shadow-none glow">
            <ArrowDownLeft className="w-4 h-4" /> Receive
          </button>
          <button onClick={() => toast.success('Send feature coming soon')} className="btn-secondary py-2 px-4">
            <ArrowUpRight className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      {/* ─── Balances & Stats Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* APT Balance */}
        <div className="card p-5 relative overflow-hidden group hover-lift lg:col-span-2 shadow-sm">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-secondary">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Aptos (APT)
            </h3>
            <button onClick={() => fetchBalances(shortAddr!)} className="text-xs font-semibold text-accent hover:underline">Refresh</button>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {isLoadingBalances ? <div className="h-9 w-32 skeleton rounded" /> : (aptBalance !== null ? formatApt(aptBalance) : '0 APT')}
          </div>
        </div>

        {/* ShelbyUSD Balance */}
        <div className="card p-5 relative overflow-hidden group hover-lift lg:col-span-2 shadow-sm">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-secondary">
              <div className="w-2 h-2 rounded-full bg-green-500" /> ShelbyUSD
            </h3>
            <a href="https://discord.gg/shelbyprotocol" target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-500 hover:underline">Get Token</a>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {isLoadingBalances ? <div className="h-9 w-32 skeleton rounded" /> : (shelbyBalance !== null ? `${(shelbyBalance/1e8).toFixed(2)} SUSD` : '0 SUSD')}
          </div>
        </div>

        {/* Creator Stats */}
        {[
          { label: 'Items Listed', value: stats.listed, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 flex items-center justify-center rounded-lg w-10 h-10' },
          { label: 'Items Sold', value: stats.sold, icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50 flex items-center justify-center rounded-lg w-10 h-10' },
          { label: 'Total Earned', value: `${(stats.earned/1e8).toFixed(2)} APT`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 flex items-center justify-center rounded-lg w-10 h-10' },
          { label: 'Items Bought', value: stats.purchased, icon: Download, color: 'text-orange-500', bg: 'bg-orange-50 flex items-center justify-center rounded-lg w-10 h-10' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-4 hover-lift shadow-sm">
            <div className={stat.bg}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</p>
              <div className="text-xl font-bold mt-0.5">
                {isLoadingStats ? <div className="h-6 w-16 skeleton rounded mt-1" /> : stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Content Tabs ─── */}
      <div className="pt-4">
        <div className="flex gap-6 border-b border-theme mb-6">
          <button 
            onClick={() => setActiveTab('items')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'items' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            My Listed Items <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary">{myFiles.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'purchases' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            Purchased Content <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary">{purchases.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            History
          </button>
        </div>

        {/* Tab: My Items */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {isLoadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : myFiles.length === 0 ? (
              <div className="text-center py-16 card bg-surface/50 border-dashed">
                <Package className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No items listed yet</h3>
                <p className="text-secondary mb-6">Start monetising your content on Verixa.</p>
                <a href="/create" className="btn-primary glow">Create Content</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myFiles.map(file => (
                  <div key={file.id} className={`card overflow-hidden transition-all ${file.isPublished ? 'border-theme' : 'border-red-500/30 opacity-75'}`}>
                    <div className="h-32 bg-secondary relative flex items-center justify-center">
                      {file.previewUrl ? (
                         file.contentType.startsWith('image/') 
                           ? <img src={file.previewUrl} className="w-full h-full object-cover" alt="preview" />
                           : getTypeIcon(file.contentType)
                      ) : getTypeIcon(file.contentType)}
                      
                      {!file.isPublished && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                          <span className="badge bg-red-500 text-white font-bold tracking-widest text-xs px-3">DELISTED</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-surface">
                      <h4 className="font-semibold mb-1 truncate">{file.name}</h4>
                      <p className="text-xs text-muted mb-4">{new Date(file.createdAt).toLocaleDateString()}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTogglePublish(file.id, file.isPublished)}
                          disabled={togglingFileId === file.id}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5
                            ${file.isPublished 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'bg-accent/10 text-accent hover:bg-accent/20'}`}
                        >
                          {togglingFileId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                           file.isPublished ? <><X className="w-3.5 h-3.5"/> Delist</> : <><Check className="w-3.5 h-3.5"/> Re-list</>}
                        </button>
                        
                        <button 
                          onClick={() => toast('Price editing requires contract update. Coming soon!', { icon: '✏️' })}
                          className="flex-1 py-2 bg-secondary text-primary hover:bg-theme border border-theme rounded-lg text-xs font-semibold transition-colors"
                        >
                          Edit Price
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Purchases */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            {isLoadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-16 card bg-surface/50 border-dashed">
                <Download className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No purchases yet</h3>
                <p className="text-secondary mb-6">Explore the marketplace to find premium content.</p>
                <a href="/explore" className="btn-primary glow">Explore Content</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {purchases.map(p => {
                  const firstFile = p.content.files[0];
                  return (
                    <div key={p.id} className="card overflow-hidden hover-lift flex flex-col">
                      <div className="h-32 relative bg-secondary flex items-center justify-center">
                        {firstFile && firstFile.previewUrl ? (
                           firstFile.contentType.startsWith('image/') 
                             ? <img src={firstFile.previewUrl} className="w-full h-full object-cover" alt="preview" />
                             : getTypeIcon(firstFile.contentType)
                        ) : (firstFile ? getTypeIcon(firstFile.contentType) : <Package className="w-8 h-8 text-muted" />)}
                        
                        <div className="absolute top-2 left-2 badge badge-accent bg-background/90 backdrop-blur">
                          <Lock className="w-3 h-3 mr-1" /> {TIER_LABELS[p.tierId] || 'Tier ' + p.tierId}
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col justify-between bg-surface">
                        <div>
                          <h4 className="font-semibold mb-1 line-clamp-2">{p.content.title}</h4>
                          <p className="text-xs text-secondary mb-4 flex items-center gap-1.5">
                            Purchased: {new Date(p.purchaseTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <a 
                          href={`/vault`} 
                          className="btn-primary w-full justify-center text-sm"
                        >
                          View in Vault
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="card">
             <div className="p-8 text-center text-secondary border-dashed border-2 m-4 rounded-xl">
               <History className="w-8 h-8 mx-auto mb-3 opacity-50" />
               <p>Detailed transaction history UI coming soon.</p>
               <p className="text-xs text-muted mt-2">View on-chain explorer for immediate history.</p>
             </div>
          </div>
        )}
      </div>

      <FiatOnramp 
        isOpen={showFundModal} 
        onClose={() => setShowFundModal(false)}
        onSuccess={() => {
          setShowFundModal(false);
          toast.success('Wallet funded successfully!');
          fetchBalances(shortAddr!);
        }}
      />
    </div>
  );
}
