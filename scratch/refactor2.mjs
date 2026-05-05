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
  // Skip the landing page (already done)
  if (filePath.endsWith('app\\page.tsx')) return;
  if (filePath.endsWith('app/page.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // ── 1. Replace old CSS variable references with new token names ──
  
  // Inline style references
  content = content.replace(/var\(--bg\)/g, 'var(--color-bg)');
  content = content.replace(/var\(--bg-secondary\)/g, 'var(--color-bg)');
  content = content.replace(/var\(--surface\)/g, 'var(--color-surface)');
  content = content.replace(/var\(--surface-hover\)/g, 'var(--color-bg)');
  content = content.replace(/var\(--border\)/g, 'var(--color-border)');
  content = content.replace(/var\(--border-hover\)/g, 'var(--color-border)');
  content = content.replace(/var\(--text-primary\)/g, 'var(--color-text-primary)');
  content = content.replace(/var\(--text-secondary\)/g, 'var(--color-text-secondary)');
  content = content.replace(/var\(--text-muted\)/g, 'var(--color-text-muted)');
  content = content.replace(/var\(--accent\)/g, 'var(--color-primary)');
  content = content.replace(/var\(--accent-hover\)/g, 'var(--color-primary-hover)');
  content = content.replace(/var\(--accent-soft\)/g, 'var(--color-primary-light)');
  content = content.replace(/var\(--green\)/g, 'var(--color-success)');
  content = content.replace(/var\(--red\)/g, 'var(--color-error)');
  content = content.replace(/var\(--shadow-sm\)/g, 'none');
  content = content.replace(/var\(--shadow-md\)/g, 'none');
  content = content.replace(/var\(--shadow-lg\)/g, 'none');
  content = content.replace(/var\(--shadow-glow\)/g, 'none');

  // ── 2. Remove stale Tailwind classes from the old system ──
  
  // Replace shadow classes
  content = content.replace(/\bshadow-2xl\b/g, 'shadow-none');

  // Write changes if any
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log('Phase 2 refactoring complete.');
