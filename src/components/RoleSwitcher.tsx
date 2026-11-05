import { useEffect, useState } from 'react';
import { Check, Repeat2 } from 'lucide-react';
import type { Role } from '../roleTypes';
import { roleLabels } from '../roleTypes';
export default function RoleSwitcher({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, []);
  return <div className="role-switcher">{open && <><button className="role-switch-backdrop" aria-label="Закрыть список ролей" onClick={() => setOpen(false)} /><div className="role-switch-menu" role="group" aria-label="Демо-роли"><h2>Выбрать роль</h2>{(['guest', 'student', 'teacher', 'organization'] as Role[]).map(value => <button key={value} aria-pressed={role === value} onClick={() => { onChange(value); setOpen(false); }}><span>{roleLabels[value]}</span>{role === value && <Check size={20} />}</button>)}</div></>}<button className="role-switch-button" onClick={() => setOpen(!open)} aria-label="Переключить роль" aria-expanded={open}><Repeat2 size={21} /><span>{roleLabels[role]}</span><span className="role-demo-label">Демо</span></button></div>;
}
