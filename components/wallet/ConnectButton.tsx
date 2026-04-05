'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export function ConnectButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowWalletPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success('Address copied!');
      setShowDropdown(false);
    }
  };

  if (connected && account) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-medium text-gray-900">
            {formatAddress(account.address.toString())}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500">Connected wallet</p>
              <p className="text-sm font-mono font-medium text-gray-900 truncate">
                {account.address.toString().slice(0, 16)}...
              </p>
            </div>
            <div className="p-1">
              <button
                onClick={copyAddress}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Copy Address</span>
              </button>
              <a
                href={`https://explorer.aptoslabs.com/account/${account.address.toString()}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span>View on Explorer</span>
              </a>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowWalletPicker(!showWalletPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showWalletPicker && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900">Connect a wallet</p>
            <p className="text-xs text-gray-500 mt-0.5">Choose your preferred wallet</p>
          </div>
          <div className="p-2">
            {wallets && wallets.length > 0 ? (
              wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => { connect(wallet.name); setShowWalletPicker(false); }}
                  className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {wallet.icon ? (
                    <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{wallet.name}</p>
                    <p className="text-xs text-gray-500">
                      {wallet.readyState === 'Installed' ? 'Installed' : 'Not installed'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                <p>No wallets detected.</p>
                <a
                  href="https://petra.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-1 block"
                >
                  Install Petra Wallet
                </a>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Powered by Aptos • Testnet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
