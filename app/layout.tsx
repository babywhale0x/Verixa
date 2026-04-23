import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Verixa - Decentralized Storage & Creator Marketplace',
  description: 'Store files permanently and monetize creative work on Aptos blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletProvider>
            {children}
            <Toaster position="top-right" />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
