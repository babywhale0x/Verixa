'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, Plus, Copy, ExternalLink } from 'lucide-react';
import { formatApt } from '@/lib/aptos';
import { FiatOnramp } from '@/components/wallet/FiatOnramp';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'receive' | 'send' | 'purchase' | 'sale';
  amount: number;
  from?: string;
  to?: string;
  contentTitle?: string;
  timestamp: string;
}

export default function WalletPage() {
  const { connected, account } = useWallet();
  const [showFundModal, setShowFundModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aptBalance, setAptBalance] = useState<number | null>(null);
  const [shelbyBalance, setShelbyBalance] = useState<number | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  useEffect(() => {
    if (connected && account) {
      fetchBalances();
      fetchTransactions();
    }
  }, [connected, account]);

  const fetchBalances = async () => {
    if (!account) return;
    setIsLoadingBalances(true);
    try {
      const address = account.address.toString();

      // Fetch APT balance
      const aptRes = await fetch(
        `https://api.testnet.aptoslabs.com/v1/accounts/${address}/resource/0x1::coin::CoinStore%3C0x1::aptos_coin::AptosCoin%3E`
      );
      if (aptRes.ok) {
        const data = await aptRes.json();
        setAptBalance(Number(data.data.coin.value));
      }

      // Fetch ShelbyUSD as fungible asset
      try {
        const shelbyMetadata = '0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1';
        const faRes = await fetch(
          `https://fullnode.testnet.aptoslabs.com/v1/accounts/${address}/resource/0x1::primary_fungible_store::PrimaryStore<${shelbyMetadata}>`
        );
        if (shelbyRes.ok) {
          const data = await faRes.json();
          setShelbyBalance(Number(data.data?.balance || 0));
        } else {
          // Try alternate FA endpoint
          const faRes2 = await fetch(
            `https://fullnode.testnet.aptoslabs.com/v1/accounts/${address}/resource/0x1::fungible_asset::FungibleStore`
          );
          if (faRes2.ok) {
            const data = await faRes2.json();
            setShelbyBalance(Number(data.data?.balance || 0));
          } else {
            setShelbyBalance(0);
          }
        }
      } catch {
        setShelbyBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactions([
        {
          id: '1',
          type: 'receive',
          amount: 100000000,
          from: '0x1234...5678',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          type: 'purchase',
          amount: 100000,
          contentTitle: 'Summer Vibes EP',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success('Address copied to clipboard');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShelby = (amount: number) => {
    return `${(amount / 1000000).toFixed(4)} SUSD`;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your balance and transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Wallet</h1>
            <button
              onClick={fetchBalances}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* APT Balance */}
          <div className="card p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100 text-sm">APT Balance</span>
              <button
                onClick={() => setShowFundModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            <div className="text-3xl font-bold mb-2">
              {isLoadingBalances ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                aptBalance !== null ? formatApt(aptBalance) : '0.0000 APT'
              )}
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <span className="text-xs font-mono">{account?.address?.toString().slice(0, 20)}...</span>
              <button onClick={copyAddress} className="p-1 hover:bg-white/20 rounded">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* ShelbyUSD Balance */}
          <div className="card p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-100 text-sm">ShelbyUSD Balance</span>
              <a
                href="https://discord.gg/shelbyprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                <Plus className="w-3 h-3" />
                Get
              </a>
            </div>
            <div className="text-3xl font-bold mb-2">
              {isLoadingBalances ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                shelbyBalance !== null ? formatShelby(shelbyBalance) : '0.0000 SUSD'
              )}
            </div>
            <div className="text-emerald-100 text-xs">
              Used for Shelby storage payments
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowFundModal(true)}
            className="card p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Receive</h3>
            <p className="text-sm text-gray-500">Fund your wallet</p>
          </button>

          <button
            onClick={() => toast.success('Send feature coming soon')}
            className="card p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Send</h3>
            <p className="text-sm text-gray-500">Transfer APT</p>
          </button>
        </div>

        {/* Transaction History */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'receive' ? 'bg-green-100' :
                      tx.type === 'send' ? 'bg-red-100' :
                      tx.type === 'purchase' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      {tx.type === 'receive' && <ArrowDownLeft className="w-5 h-5 text-green-600" />}
                      {tx.type === 'send' && <ArrowUpRight className="w-5 h-5 text-red-600" />}
                      {tx.type === 'purchase' && <Wallet className="w-5 h-5 text-blue-600" />}
                      {tx.type === 'sale' && <Wallet className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.type === 'receive' && 'Received APT'}
                        {tx.type === 'send' && 'Sent APT'}
                        {tx.type === 'purchase' && `Purchased ${tx.contentTitle}`}
                        {tx.type === 'sale' && `Sale: ${tx.contentTitle}`}
                      </p>
                      {tx.from && <p className="text-sm text-gray-500">From: {tx.from}</p>}
                      {tx.to && <p className="text-sm text-gray-500">To: {tx.to}</p>}
                      <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    tx.type === 'receive' || tx.type === 'sale' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {tx.type === 'receive' || tx.type === 'sale' ? '+' : '-'}
                    {formatApt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a
            href={`https://explorer.aptoslabs.com/account/${account?.address.toString()}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            View on Aptos Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <FiatOnramp
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        onSuccess={() => {
          setShowFundModal(false);
          toast.success('Wallet funded successfully!');
          fetchBalances();
        }}
      />
    </div>
  );
}
