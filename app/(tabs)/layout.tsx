'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Lock, PlusCircle, User, Sun, Moon } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useEffect, useState } from 'react';
import { getTheme, toggleTheme, applyTheme, type Theme } from '@/lib/theme';

const tabs = [
  { name: 'Home',    href: '/home',    icon: Home },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'Vault',   href: '/vault',   icon: Lock },
  { name: 'Create',  href: '/create',  icon: PlusCircle },
  { name: 'Profile', href: '/wallet',  icon: User },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');

  // Initialise theme on mount
  useEffect(() => {
    const saved = getTheme();
    applyTheme(saved);
    setTheme(saved);
  }, []);

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ─── Top Navigation ─── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                V
              </div>
              <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Verixa
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map(tab => {
                const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Theme Toggle + Connect */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center justify-around h-16">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{
                    background: isActive ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <tab.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile spacer */}
      <div className="md:hidden h-16" />
    </div>
  );
}
