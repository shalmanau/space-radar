import { Camera } from 'lucide-react';
import './photo.css';

export default function Avatar({ photo, initials, className = '' }: { photo?: string | null; initials: string; className?: string }) {
  return <span className={`profile-avatar ${className}`} aria-hidden="true">{photo ? <img src={photo} alt="" /> : initials}</span>;
}

export function EditAvatar({ photo, initials, name, onClick }: { photo?: string | null; initials: string; name: string; onClick: () => void }) {
  return <button className="avatar-edit" onClick={onClick} aria-label={`Изменить фото: ${name}`} aria-haspopup="dialog"><span className="avatar-edit-image"><Avatar photo={photo} initials={initials} className="large-avatar" /><span className="avatar-camera"><Camera size={18} /></span></span><span className="avatar-edit-label">Изменить фото</span></button>;
}
