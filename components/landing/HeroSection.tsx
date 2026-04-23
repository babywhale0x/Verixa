'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-[#0b0e14] transition-colors duration-500">
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-[20%] left-[10%] w-80 h-80 bg-blue-300/30 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 pointer-events-none"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ y: y1 }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-sky-200/40 dark:bg-sky-400/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 pointer-events-none"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ y: y2 }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <motion.h1 
          className="text-6xl md:text-8xl font-extrabold tracking-tight text-black dark:text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Your Files.<br />
          <span className="text-blue-500 dark:text-blue-400 inline-block mt-2">Your Earnings.</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Decentralized storage meets creator marketplace. Store files permanently, publish creative work, and earn directly to your wallet.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <Link href="/vault" className="group relative">
            <div className="absolute -inset-1 bg-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            >
              Start Storing 
              <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </motion.div>
          </Link>
          
          <motion.div
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/explore"
              className="block px-8 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 text-black dark:text-white rounded-2xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              Explore Creators
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span className="text-sm font-medium tracking-widest uppercase">Scroll</span>
        <motion.div 
          className="w-[1px] h-12 bg-gradient-to-b from-gray-400 to-transparent dark:from-gray-500 origin-top"
          animate={{ scaleY: [0, 1, 0.5], translateY: [0, 10, 20], opacity: [1, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "circInOut" }}
        />
      </motion.div>
    </section>
  );
}
