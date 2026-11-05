import { useEffect, useId, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
type ThemeMode = 'system' | 'light' | 'dark';
const modes = [{ value: 'system' as const, label: 'Как на устройстве', icon: Monitor }, { value: 'light' as const, label: 'Светлая', icon: Sun }, { value: 'dark' as const, label: 'Тёмная', icon: Moon }];
export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const value = document.documentElement.dataset.themeMode;
    return value === 'light' || value === 'dark' ? value : 'system';
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update); update();
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeMode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1525' : '#ffffff');
    try { localStorage.setItem('vneklassa-theme-mode', mode); } catch { /* The current tab can still change its theme. */ }
  }, [mode, systemDark]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const current = modes.find(item => item.value === mode)!;
  const Icon = current.icon;
  return <div className="theme-control" ref={ref}>{open && <div className="theme-menu" id={menuId} role="group" aria-label="Режим темы"><h2>Тема оформления</h2>{modes.map(item => <button key={item.value} aria-pressed={mode === item.value} onClick={() => { setMode(item.value); setOpen(false); buttonRef.current?.focus(); }}><item.icon size={20} /><span>{item.label}</span>{mode === item.value && <Check size={19} />}</button>)}</div>}<button ref={buttonRef} className="theme-toggle" aria-label="Тема оформления" title={`Тема: ${current.label}`} aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(!open)}><Icon size={21} /><span>{current.label}</span></button></div>;
}
