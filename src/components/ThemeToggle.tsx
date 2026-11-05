import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101310' : '#d2f76a');
    try { localStorage.setItem('vneklassa-theme', theme); } catch { /* The current tab can still change its theme. */ }
  }, [theme]);
  const dark = theme === 'dark';
  return <button className="theme-toggle" aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'} title={dark ? 'Включить светлую тему' : 'Включить тёмную тему'} onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun size={21} /> : <Moon size={21} />}<span>{dark ? 'Светлая тема' : 'Тёмная тема'}</span></button>;
}
