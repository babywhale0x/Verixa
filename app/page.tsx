import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Music, Image, FileText, Video } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <span className="text-xl font-bold">Verixa</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/explore" className="text-gray-600 hover:text-gray-900">Explore</Link>
              <Link href="/vault" className="text-gray-600 hover:text-gray-900">Vault</Link>
              <Link href="/create" className="text-gray-600 hover:text-gray-900">Create</Link>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Files.<br />
            <span className="text-blue-600">Your Earnings.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Decentralized storage meets creator marketplace. Store files permanently,
            publish creative work, and earn directly to your wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vault"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Storing <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/explore"
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Explore Creators
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Permanent Storage</h3>
              <p className="text-gray-600">
                Files stored on Shelby Protocol, distributed across thousands of nodes.
                No single point of failure.
              </p>
            </div>

            <div className="card p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Earnings</h3>
              <p className="text-gray-600">
                90% of every sale goes directly to your wallet. No holding periods,
                no withdrawal requests.
              </p>
            </div>

            <div className="card p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Uncensorable</h3>
              <p className="text-gray-600">
                Content hash-committed on Aptos blockchain. No platform can take
                down your work or freeze your earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Support All Content Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <h4 className="font-medium">Music</h4>
            </div>
            <div className="card p-6 text-center">
              <Image className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <h4 className="font-medium">Photos</h4>
            </div>
            <div className="card p-6 text-center">
              <Video className="w-8 h-8 mx-auto mb-3 text-red-600" />
              <h4 className="font-medium">Video</h4>
            </div>
            <div className="card p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <h4 className="font-medium">Documents</h4>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of creators and users already using Verixa for
            decentralized storage and monetization.
          </p>
          <Link
            href="/vault"
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            Launch App <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
              <span className="text-xl font-bold">Verixa</span>
            </div>
            <p className="text-gray-400 text-sm">
              Built on Aptos & Shelby Protocol
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
