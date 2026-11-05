import type { CSSProperties } from 'react';
import { ArrowDownToLine, ArrowUpRight, CalendarDays, Check, Trophy } from 'lucide-react';
import type { EventResult } from '../roleTypes';
import type { Opportunity, Profile } from '../types';
import { dateLabel, isPast } from '../types';
import './studentPath.css';

type Props = {
  events: Opportunity[];
  results: EventResult[];
  profile: Profile;
  onOpenEvent: (event: Opportunity) => void;
  onFindEvents: () => void;
};
const offsets = [0, 40, 80, 40];
const chronological = (a: Opportunity, b: Opportunity) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
const shortDate = (event: Opportunity) => dateLabel(event.date, { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function StudentPath({ events, results, profile, onOpenEvent, onFindEvents }: Props) {
  const completed = events.filter(isPast).sort(chronological);
  const upcoming = events.filter(event => !isPast(event)).sort(chronological);
  const steps = [...completed, ...upcoming].map(event => ({
    event,
    completed: isPast(event),
    award: isPast(event) ? results.find(result => result.eventId === event.id && result.studentId === 'sasha')?.award : undefined,
  }));
  const status = (step: typeof steps[number]) => step.completed ? step.award || 'Участвовал(а)' : 'Участвую';
  const download = () => {
    const content = `${profile.fullName}\n${profile.school}, ${profile.grade} класс\n\nМОЙ ПУТЬ\n\n${steps.map(step => `${step.event.title}\n${shortDate(step.event)} · ${step.event.venue}\n${status(step)}`).join('\n\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Мой путь — ВнеКласса.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <>
    <div className="page-intro"><h1>Мой путь</h1><button className="button secondary" disabled={!steps.length} onClick={download}><ArrowDownToLine size={20} />Скачать</button></div>
    {steps.length ? <ol className="journey-track" aria-label="События от старых к новым">
      {steps.map((step, index) => {
        const offset = offsets[index % offsets.length];
        const nextOffset = offsets[(index + 1) % offsets.length];
        const Icon = step.completed ? (step.award ? Trophy : Check) : CalendarDays;
        return <li key={step.event.id} data-event-id={step.event.id} data-date={step.event.date} data-state={step.completed ? 'completed' : 'upcoming'}
          className={`journey-step ${step.completed ? 'is-complete' : 'is-upcoming'}${index === completed.length ? ' is-next' : ''}`}
          style={{ '--step-offset': `${offset}px` } as CSSProperties}>
          {index < steps.length - 1 && <svg className={`journey-connector${index + 1 < completed.length ? ' is-complete' : ''}`} viewBox="0 0 160 160" preserveAspectRatio="none" aria-hidden="true">
            <path d={`M ${offset + 38} 0 C ${offset + 38} 80, ${nextOffset + 38} 80, ${nextOffset + 38} 160`} />
          </svg>}
          <button className="journey-stop" aria-label={`Подробнее: ${step.event.title}`} onClick={() => onOpenEvent(step.event)}>
            <span className="journey-node" aria-hidden="true"><Icon size={30} strokeWidth={2.2} /></span>
            <span className="journey-copy"><strong>{step.event.title}</strong>
              <span className="journey-meta"><time dateTime={step.event.date}>{shortDate(step.event)}</time><span aria-hidden="true">·</span><span>{step.event.venue}</span></span>
              <span className="journey-status">{status(step)}</span>
            </span>
            <ArrowUpRight className="journey-arrow" size={22} aria-hidden="true" />
          </button>
        </li>;
      })}
    </ol> : <div className="empty-state"><p>Пока нет событий.</p><button className="button primary" onClick={onFindEvents}>Найти события</button></div>}
  </>;
}
