import { LogOut } from 'lucide-react';

export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return <button className="button secondary logout-button" onClick={onLogout}><LogOut size={20} />Выйти</button>;
}
