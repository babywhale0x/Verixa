'use client';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function FeatureCards() {
  const features = [
    {
      title: 'Permanent Storage',
      description: 'Files stored on Shelby Protocol, distributed across thousands of nodes. No single point of failure.',
      icon: Shield,
      color: 'text-blue-500',
      bgHover: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10'
    },
    {
      title: 'Instant Earnings',
      description: '90% of every sale goes directly to your wallet. No holding periods, no withdrawal requests.',
      icon: Zap,
      color: 'text-sky-500',
      bgHover: 'group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10'
    },
    {
      title: 'Uncensorable',
      description: 'Content hash-committed on Aptos blockchain. No platform can take down your work or freeze your earnings.',
      icon: Globe,
      color: 'text-indigo-500',
      bgHover: 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10'
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-[#111520] transition-colors duration-500 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black dark:text-white">Built for the Future</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience the power of true ownership with unmatched security.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
            <AnimatedSection key={i} delay={i * 0.2}>
              <motion.div 
                className="group relative h-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-8 hover:border-gray-200 dark:hover:border-white/20 transition-all duration-300"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 dark:from-white/5 dark:to-transparent pointer-events-none rounded-3xl transition-opacity duration-300"></div>
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${feature.bgHover} bg-gray-50 dark:bg-white/5`}>
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </motion.div>
            </AnimatedSection>
          )})}
        </div>
      </div>
    </section>
  );
}
