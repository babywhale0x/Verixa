import Link from 'next/link';
import { ArrowRight, Music, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { CustomCursor } from '@/components/landing/CustomCursor';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureCards } from '@/components/landing/FeatureCards';
import { AnimatedSection } from '@/components/landing/AnimatedSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0e14] text-black dark:text-white transition-colors duration-500 overflow-x-hidden selection:bg-blue-500/30">
      <CustomCursor />
      
      {/* Header */}
      <header className="fixed top-0 w-full z-[100] bg-white/70 dark:bg-[#0b0e14]/70 backdrop-blur-xl border-b border-gray-100 dark:border-white/10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-blue-500 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform duration-300" />
              <span className="text-2xl font-black tracking-tight">Verixa</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 font-medium">
              <Link href="/explore" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Explore</Link>
              <Link href="/vault" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Vault</Link>
              <Link href="/create" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Create</Link>
            </nav>
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeatureCards />

      {/* Content Types Section */}
      <section className="py-32 relative overflow-hidden bg-white dark:bg-[#0b0e14] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Support All Content Types</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Upload, share, and monetize anything.</p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[ 
              { icon: Music, label: 'Music', color: 'text-blue-500' },
              { icon: ImageIcon, label: 'Photos', color: 'text-sky-500' },
              { icon: Video, label: 'Video', color: 'text-indigo-500' },
              { icon: FileText, label: 'Documents', color: 'text-cyan-500' }
            ].map((type, i) => {
              const Icon = type.icon;
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="group bg-gray-50 dark:bg-white/5 border border-transparent dark:hover:border-white/10 hover:bg-gray-100 rounded-3xl p-10 text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <Icon className={`w-12 h-12 mx-auto mb-6 ${type.color} group-hover:scale-110 transition-transform duration-300`} />
                    <h4 className="font-bold text-xl">{type.label}</h4>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 transition-colors duration-500" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-5xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Join thousands of creators and users already using Verixa for
              decentralized storage and monetization.
            </p>
            <Link
              href="/vault"
              className="px-10 py-5 bg-blue-500 text-white rounded-2xl font-bold text-xl hover:bg-blue-600 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] inline-flex items-center gap-3"
            >
              Launch App <ArrowRight className="w-6 h-6" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0b0e14] border-t border-gray-100 dark:border-white/10 py-16 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg" />
              <span className="text-xl font-bold">Verixa</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Built on Aptos & Shelby Protocol
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
