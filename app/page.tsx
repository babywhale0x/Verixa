'use client';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Music, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { motion } from 'framer-motion';
import { MatrixText } from '@/components/ui/MatrixText';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <span className="text-xl font-bold">Verixa</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/explore" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Explore</Link>
              <Link href="/vault" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Vault</Link>
              <Link href="/create" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Create</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-[var(--bg)] dark:from-blue-900/10 dark:to-[var(--bg)] py-20 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[var(--text-primary)] leading-tight">
            <MatrixText text="Your Files." delay={0.1} />
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              <MatrixText text="Your Earnings." delay={0.4} />
            </span>
          </h1>
          <motion.p 
            className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Decentralized storage meets creator marketplace. Store files permanently,
            publish creative work, and earn directly to your wallet.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Link href="/vault">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(37, 99, 235, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 group cursor-pointer"
              >
                Start Storing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
            <Link href="/explore">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.05)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[var(--surface)] text-[var(--text-primary)] rounded-xl font-semibold border-2 border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                Explore Creators
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ y: -10, boxShadow: "0 20px 40px -5px rgba(0,0,0,0.1)" }}
              className="card p-8 transition-shadow bg-[var(--surface)] border-[var(--border)]"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Permanent Storage</h3>
              <p className="text-[var(--text-secondary)]">
                Files stored on Shelby Protocol, distributed across thousands of nodes.
                No single point of failure.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ y: -10, boxShadow: "0 20px 40px -5px rgba(0,0,0,0.1)" }}
              className="card p-8 transition-shadow bg-[var(--surface)] border-[var(--border)]"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Instant Earnings</h3>
              <p className="text-[var(--text-secondary)]">
                90% of every sale goes directly to your wallet. No holding periods,
                no withdrawal requests.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              whileHover={{ y: -10, boxShadow: "0 20px 40px -5px rgba(0,0,0,0.1)" }}
              className="card p-8 transition-shadow bg-[var(--surface)] border-[var(--border)]"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Uncensorable</h3>
              <p className="text-[var(--text-secondary)]">
                Content hash-committed on Aptos blockchain. No platform can take
                down your work or freeze your earnings.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section className="py-20 bg-[var(--bg-secondary)] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-primary)]">Support All Content Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div whileHover={{ scale: 1.05 }} className="card p-6 text-center bg-[var(--surface)] border-[var(--border)]">
              <Music className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-[var(--text-primary)]">Music</h4>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="card p-6 text-center bg-[var(--surface)] border-[var(--border)]">
              <ImageIcon className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-[var(--text-primary)]">Photos</h4>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="card p-6 text-center bg-[var(--surface)] border-[var(--border)]">
              <Video className="w-8 h-8 mx-auto mb-3 text-red-600 dark:text-red-400" />
              <h4 className="font-medium text-[var(--text-primary)]">Video</h4>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="card p-6 text-center bg-[var(--surface)] border-[var(--border)]">
              <FileText className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-[var(--text-primary)]">Documents</h4>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">Ready to get started?</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join thousands of creators and users already using Verixa for
            decentralized storage and monetization.
          </p>
          <Link href="/vault">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(37, 99, 235, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 group cursor-pointer"
            >
              Launch App <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 transition-colors duration-500">
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
