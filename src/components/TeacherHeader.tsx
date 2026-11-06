import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Teacher, TeacherPage } from '../roleTypes';
import Avatar from './Avatar';
import Brand from './Brand';
import ThemeSelector from './ThemeSelector';
import './teacherHeader.css';

const pages: { id: TeacherPage; label: string }[] = [
  { id: 'feed', label: 'Лента' },
  { id: 'classes', label: 'Классы' },
  { id: 'messages', label: 'Сообщения' },
  { id: 'olympiads', label: 'Олимпиады' },
];

export default function TeacherHeader({ page, teacher, onNavigate }: { page: TeacherPage; teacher: Teacher; onNavigate: (page: TeacherPage) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const navigate = (next: TeacherPage) => { setMenuOpen(false); onNavigate(next); };

  return <>
    {menuOpen && <button className="nav-backdrop teacher-nav-backdrop" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" />}
    <header className="site-header teacher-header">
      <Brand onClick={() => navigate('feed')} />
      <nav id="teacher-navigation" className={`site-nav${menuOpen ? ' open' : ''}`} aria-label="Навигация учителя">
        {pages.map(item => <button key={item.id} className={`nav-item${page === item.id ? ' active' : ''}`} onClick={() => navigate(item.id)} aria-current={page === item.id ? 'page' : undefined}>{item.label}</button>)}
      </nav>
      <div className="header-actions">
        <button className="account-button" aria-label="Открыть профиль учителя" aria-current={page === 'profile' ? 'page' : undefined} title={teacher.name} onClick={() => navigate('profile')}><Avatar className="header-avatar" photo={teacher.photo} initials={teacher.name.split(' ').slice(0, 2).map(part => part[0]).join('')} /></button>
        <ThemeSelector />
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-controls="teacher-navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={25} /> : <Menu size={25} />}</button>
      </div>
    </header>
  </>;
}
