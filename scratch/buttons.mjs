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

  // Replace button colors
  content = content.replace(/\bbg-blue-600\b/g, 'bg-primary');
  content = content.replace(/\bhover:bg-blue-700\b/g, 'hover:bg-primary-hover');
  content = content.replace(/\bbg-blue-500\b/g, 'bg-primary');
  content = content.replace(/\btext-blue-500\b/g, 'text-primary');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log('Buttons refactored.');
