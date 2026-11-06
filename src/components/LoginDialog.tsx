import { ArrowRight } from 'lucide-react';
import type { Organization, Role, Teacher } from '../roleTypes';
import { roleLabels } from '../roleTypes';
import type { Profile } from '../types';
import Avatar from './Avatar';
import DemoModal from './DemoModal';
import './login.css';

export default function LoginDialog({ student, teacher, organization, onLogin, onClose }: { student: Profile; teacher: Teacher; organization: Organization; onLogin: (role: Exclude<Role, 'guest'>) => void; onClose: () => void }) {
  const accounts = [
    { role: 'student' as const, name: student.fullName, photo: student.photo, initials: student.initials },
    { role: 'teacher' as const, name: teacher.name, photo: teacher.photo, initials: teacher.name.split(' ').slice(0, 2).map(part => part[0]).join('') },
    { role: 'organization' as const, name: organization.name, photo: organization.photo, initials: organization.name === 'ЭФ БГУ' ? 'ЭФ' : 'НБ' },
  ];
  return <DemoModal title="Вход" onClose={onClose}>
    <div className="login-accounts">{accounts.map(account => <button key={account.role} className="login-account" onClick={() => onLogin(account.role)}>
      <Avatar className="login-avatar" photo={account.photo} initials={account.initials} />
      <span className="login-account-copy"><span>{roleLabels[account.role]}</span><strong>{account.name}</strong></span>
      <ArrowRight size={22} aria-hidden="true" />
    </button>)}</div>
  </DemoModal>;
}
