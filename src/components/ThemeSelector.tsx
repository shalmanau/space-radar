import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeMode = Theme | 'system';
const storageKey = 'vneklassa-theme-mode';
function initialMode(): ThemeMode {
  const value = document.documentElement.dataset.themeMode;
  return value === 'light' || value === 'dark' ? value : 'system';
}

export default function ThemeSelector() {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    const device = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const next = mode === 'system' ? (device.matches ? 'dark' : 'light') : mode;
      document.documentElement.dataset.theme = next;
      document.documentElement.dataset.themeMode = mode;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#080f1e' : '#edf1f3');
      setTheme(next);
    };
    apply();
    device.addEventListener('change', apply);
    return () => device.removeEventListener('change', apply);
  }, [mode]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey) setMode(event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system');
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setMode(next);
    try { localStorage.setItem(storageKey, next); } catch { /* Browsing modes can disable storage. */ }
  };
  const label = theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему';
  const Icon = theme === 'light' ? Moon : Sun;
  return <button className="theme-trigger icon-button" aria-label={label} title={label} onClick={toggle}><Icon size={22} /></button>;
}
