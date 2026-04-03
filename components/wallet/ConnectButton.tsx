'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';

export function ConnectButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connected && account) {
    return (
      <div className="relative">
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
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => { disconnect(); setShowDropdown(false); }}
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => connect(wallet.name)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-medium">{wallet.name}</span>
        </button>
      ))}
    </div>
  );
}