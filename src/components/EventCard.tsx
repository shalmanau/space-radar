import { ArrowRight, CalendarDays, Check, Clock3, MapPin, Monitor } from 'lucide-react';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';

type Props = { event: Opportunity; joined: boolean; onSelect: (event: Opportunity) => void; onToggle: (id: string) => void };
export default function EventCard({ event, joined, onSelect, onToggle }: Props) {
  const past = isPast(event);
  return <article className="opportunity-card" data-event-id={event.id}>
    <div className="card-top"><span className="card-category">{event.type}</span>
      {past ? joined && <span className="participation-status"><Check size={14} />Участие</span> : <button className={`participation-toggle ${joined ? 'active' : ''}`} aria-label={`${joined ? 'Отменить участие' : 'Участвовать'}: ${event.title}`} aria-pressed={joined} onClick={() => onToggle(event.id)}><span className="participation-checkbox">{joined && <Check size={12} />}</span>{joined ? 'Участвую' : 'Участвовать'}</button>}
    </div>
    <button className="card-title" onClick={() => onSelect(event)}>{event.title}</button>
    <div className="card-meta"><span><CalendarDays size={15} />{dateLabel(event.date)}{event.endDate && ` — ${dateLabel(event.endDate)}`}<span className="event-time">{event.time}</span></span><span>{event.format === 'Онлайн' ? <Monitor size={15} /> : <MapPin size={15} />}{event.venue}{event.format === 'Онлайн' && ' · онлайн'}</span></div>
    <div className="card-bottom"><span>{past ? 'Событие завершено' : <><Clock3 size={12} />Заявки до {dateLabel(event.deadline)}</>}</span><button className="text-button" onClick={() => onSelect(event)} aria-label={`Подробнее: ${event.title}`}>Подробнее<ArrowRight size={15} /></button></div>
  </article>;
}
