import { X, ExternalLink, ShieldCheck, Download, Award, Shield, Crown } from 'lucide-react';

interface CertificateProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
}

export default function CertificateModal({ isOpen, onClose, purchase }: CertificateProps) {
  if (!isOpen || !purchase) return null;

  const content = purchase.content;
  const tierName = getTierName(purchase.tier);
  const tierIcon = getTierIcon(purchase.tier);

  // Fallbacks for Shelby URL + TxHash parsing depending on if it's new or old purchases
  const isShelbyUrl = purchase.licenseHash && !purchase.licenseHash.startsWith('fallback-');
  const shelbyLink = isShelbyUrl ? `https://node.testnet.shelby.app/${purchase.licenseHash}` : null;
  const rawTxHash = purchase.licenseHash?.startsWith('fallback-') 
      ? purchase.licenseHash.split('fallback-')[1] 
      : (purchase.transactionHash || null); // Note: We might not have raw TxHash in DB yet if we only saved blobId, but we can display the blockchain state

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50 to-amber-50/50 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Ribbon */}
        <div className="h-14 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between px-6 relative z-10">
           <h2 className="text-white font-semibold flex items-center gap-2">
             <ShieldCheck className="w-5 h-5 text-amber-400" />
             Certificate of Authenticity
           </h2>
           <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Certificate Body */}
        <div className="p-8 relative z-10">
          <div className="text-center mb-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-100 mb-4">
               {tierIcon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Official License Record</h1>
            <p className="text-gray-500 mt-2">Issued by the Verixa Decentralized Protocol</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Licensed Content</p>
                <p className="font-semibold text-gray-900 truncate">{content?.title || "Unknown File"}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Access Tier Rights</p>
                <p className="font-semibold text-amber-600">{tierName}</p>
              </div>
            </div>

            <div className="p-5 border-2 border-gray-100 border-dashed rounded-xl bg-white space-y-3">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Date Issued:</span>
                 <span className="font-medium text-gray-900">{new Date(purchase.purchaseTimestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">License ID:</span>
                 <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{purchase.purchaseId}</span>
              </div>
              {rawTxHash && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                  <span className="text-gray-500">Aptos Tx Hash:</span>
                  <a 
                    href={`https://explorer.aptoslabs.com/txn/${rawTxHash}?network=testnet`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs truncate max-w-[200px]"
                  >
                    {rawTxHash} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {shelbyLink ? (
                <a 
                  href={shelbyLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
                >
                  <Download className="w-4 h-4" />
                  View Raw JSON Certificate
                </a>
              ) : (
                <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed">
                  No Permanent JSON Attached
                </button>
              )}
              <button 
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
               >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function getTierName(tier: number): string {
  switch (tier) {
    case 1: return 'Stream (In-App)';
    case 2: return 'Cite (On-chain Reference)';
    case 3: return 'License (Local Use)';
    case 4: return 'Commercial Rights';
    default: return 'Standard Access';
  }
}

function getTierIcon(tier: number) {
  switch (tier) {
    case 1: return <Shield className="w-8 h-8 text-white" />;
    case 2: return <Award className="w-8 h-8 text-white" />;
    case 3: return <ShieldCheck className="w-8 h-8 text-white" />;
    case 4: return <Crown className="w-8 h-8 text-white" />;
    default: return <Award className="w-8 h-8 text-white" />;
  }
}
