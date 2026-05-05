import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Typography Weights
  content = content.replace(/\bfont-bold\b/g, 'font-medium');
  content = content.replace(/\bfont-semibold\b/g, 'font-medium');
  content = content.replace(/\bfont-extrabold\b/g, 'font-medium');
  content = content.replace(/\bfont-black\b/g, 'font-medium');

  // 2. Map old CSS vars to new Tailwind tokens
  content = content.replace(/bg-\[var\(--bg\)\]/g, 'bg-bg');
  content = content.replace(/bg-\[var\(--surface\)\]/g, 'bg-surface');
  content = content.replace(/border-\[var\(--border\)\]/g, 'border-border');
  content = content.replace(/text-\[var\(--text-primary\)\]/g, 'text-text-primary');
  content = content.replace(/text-\[var\(--text-secondary\)\]/g, 'text-text-secondary');
  content = content.replace(/text-\[var\(--text-muted\)\]/g, 'text-text-muted');

  // 3. Sentence Case Enforcements
  const replacements = {
    'Connect Wallet': 'Connect wallet',
    'Start Storing': 'Start storing',
    'Explore Creators': 'Explore creators',
    'Launch App': 'Launch app',
    'Instant Earnings': 'Instant earnings',
    'Permanent Storage': 'Permanent storage',
    'Featured Contents': 'Featured contents',
    'Browse Content': 'Browse content',
    'Store Content': 'Store content',
    'Create Content': 'Create content',
    'My Listed Items': 'My listed items',
    'Purchased Content': 'Purchased content'
  };

  for (const [key, value] of Object.entries(replacements)) {
    // Basic string replace for text content
    const regex = new RegExp(`>\\s*${key}\\s*<`, 'g');
    content = content.replace(regex, `>${value}<`);
    // Also replace when next to an icon component
    content = content.replace(key, value);
  }

  // 4. Remove Gradients & Shadows
  content = content.replace(/\bbg-gradient-to-[a-z]+\b/g, 'bg-surface');
  content = content.replace(/\bfrom-[a-z0-9/-]+\b/g, '');
  content = content.replace(/\bto-[a-z0-9/-]+\b/g, '');
  content = content.replace(/\bdark:from-[a-z0-9/-]+\b/g, '');
  content = content.replace(/\bdark:to-[a-z0-9/-]+\b/g, '');
  content = content.replace(/\bshadow-lg\b/g, 'shadow-sm');
  content = content.replace(/\bshadow-glow\b/g, 'shadow-sm');
  content = content.replace(/\bshadow-md\b/g, 'shadow-sm');

  // 5. Standardize Accents and Icon backgrounds
  content = content.replace(/\bbg-(?!red|green|yellow|amber)[a-z]+-100\b/g, 'bg-primary-light');
  content = content.replace(/\bdark:bg-white\/5\b/g, 'bg-primary-light'); // Enforce light token globally
  content = content.replace(/\btext-(?!red|green|yellow|amber)[a-z]+-600\b/g, 'text-primary');
  content = content.replace(/\bdark:text-(?!red|green|yellow|amber)[a-z]+-400\b/g, 'text-primary');

  // Write changes if any
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log('Refactoring complete.');
