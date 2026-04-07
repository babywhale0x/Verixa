// Theme helpers — reads/writes localStorage and syncs to <html data-theme>
export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('verixa-theme') as Theme) || 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('verixa-theme', theme);
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}
