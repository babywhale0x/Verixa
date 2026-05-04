'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function FiatOnramp({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { account } = useWallet();
  const [copied, setCopied] = useState(false);
  const address = account?.address?.toString();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-theme rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Fund Your Wallet</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-secondary">
            Send APT to your wallet address to fund your account.
          </p>
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-xs text-secondary mb-2">Your Wallet Address</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono break-all flex-1">{address}</p>
              <button
                onClick={copyAddress}
                className="p-2 hover:opacity-80 rounded shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-secondary" />
                )}
              </button>
            </div>
          </div>
          <a
            href="https://aptos.dev/en/network/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700"
          >
            Get Testnet APT from Faucet
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 border border-theme rounded-lg hover:bg-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
