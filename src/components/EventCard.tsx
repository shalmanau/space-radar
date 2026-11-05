import { CalendarDays, Check, MapPin, Monitor } from 'lucide-react';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';

type Props = { event: Opportunity; joined: boolean; onSelect: (event: Opportunity) => void; onToggle: (id: string) => void; recommended?: boolean; hideParticipation?: boolean; action?: { label: string; onClick: () => void } };
export default function EventCard({ event, joined, onSelect, onToggle, hideParticipation = false, action, recommended = false }: Props) {
  const past = isPast(event);
  return <article className={`opportunity-card${recommended ? ' recommended-card' : ''}`} data-event-id={event.id}>
    <img className="card-image" src={event.image} alt="" />
    <div className="card-content">
      {recommended && <span className="interest-match">По интересам</span>}
      <h3 className="card-title">{event.title}</h3>
      <div className="card-meta">
        <span><CalendarDays size={18} />{dateLabel(event.date)}{event.endDate && ` — ${dateLabel(event.endDate)}`} · {event.time}</span>
        <span>{event.format === 'Онлайн' ? <Monitor size={18} /> : <MapPin size={18} />}{event.venue}{event.format === 'Онлайн' && ' · онлайн'}</span>
      </div>
      <div className="card-actions">
        <button className="button secondary card-details" onClick={() => onSelect(event)} aria-label={`Подробнее: ${event.title}`}>Подробнее</button>
        {action ? <button className="button primary" onClick={action.onClick}>{action.label}</button> : hideParticipation ? null : past ? joined && <span className="participation-status"><Check size={16} />Участие</span> : <button className={`button primary participation-toggle ${joined ? 'active' : ''}`} aria-label={`${joined ? 'Отменить участие' : 'Участвовать'}: ${event.title}`} aria-pressed={joined} onClick={() => onToggle(event.id)}>{joined && <Check size={16} />}{joined ? 'Участвую' : 'Участвовать'}</button>}
      </div>
    </div>
  </article>;
}
