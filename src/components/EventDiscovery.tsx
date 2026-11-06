import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Code2, FlaskConical, Leaf, MapPin, Monitor, Palette, Sparkles, Trophy, Users } from 'lucide-react';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';
import EventRadar from './EventRadar';
import './eventDiscovery.css';

type Props = {
  events: Opportunity[];
  interests: string[];
  joined: string[];
  onOpenEvent: (event: Opportunity) => void;
  onToggle: (id: string) => void;
};

function eventSymbol(event: Opportunity) {
  if (event.type === 'Олимпиада') return Trophy;
  if (event.category === 'Технологии') return Code2;
  if (event.category === 'Творчество') return Palette;
  if (event.category === 'Наука') return FlaskConical;
  if (event.category === 'Экология') return Leaf;
  return Sparkles;
}

export default function EventDiscovery({ events, interests, joined, onOpenEvent, onToggle }: Props) {
  const layout = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const update = () => { if (layout.current) layout.current.style.setProperty('--discovery-height', `${Math.max(240, window.innerHeight - (layout.current.getBoundingClientRect().top + window.scrollY) - 24)}px`); };
    update();
    const observer = new ResizeObserver(update);
    document.querySelectorAll('.event-finder,.discovery-filters,.site-header').forEach(element => observer.observe(element));
    void document.fonts.ready.then(update);
    window.addEventListener('resize', update);
    return () => {observer.disconnect(); window.removeEventListener('resize', update);};
  }, []);
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const activeIndex = Math.max(0, events.findIndex(event => event.id === requestedId));
  const event = events[activeIndex];
  const activeId = event?.id;

  const selectEvent = (opportunity: Opportunity) => setRequestedId(opportunity.id);
  const move = (delta: number) => {
    const next = Math.max(0, Math.min(events.length - 1, activeIndex + delta));
    if (events[next]) setRequestedId(events[next].id);
  };
  const handleKeyDown = (keyEvent: KeyboardEvent<HTMLElement>) => {
    if (keyEvent.key === 'ArrowRight' && activeIndex < events.length - 1) { keyEvent.preventDefault(); move(1); }
    if (keyEvent.key === 'ArrowLeft' && activeIndex > 0) { keyEvent.preventDefault(); move(-1); }
  };
  const startTouch = (touchEvent: TouchEvent<HTMLElement>) => {
    const touch = touchEvent.touches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const endTouch = (touchEvent: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    const touch = touchEvent.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
  };

  return <section ref={layout} className="event-discovery" aria-label="Подборка событий" onKeyDown={handleKeyDown}>
    <div className="discovery-layout">
      <div className="discovery-radar-column">
        <EventRadar events={events} activeId={activeId} onSelect={selectEvent} />
      </div>
      <section className="discovery-carousel" aria-label="События каруселью" aria-roledescription="карусель" onTouchStart={startTouch} onTouchEnd={endTouch}>
        {event ? <>
          <article className="discovery-card" aria-live="polite">
          <div className="discovery-carousel-controls">
            <span aria-live="polite">{activeIndex + 1} / {events.length}</span>
            <div>
              <button type="button" aria-label="Предыдущее событие" disabled={activeIndex === 0} onClick={() => move(-1)}><ArrowLeft size={23} /></button>
              <button type="button" aria-label="Следующее событие" disabled={activeIndex >= events.length - 1} onClick={() => move(1)}><ArrowRight size={23} /></button>
            </div>
          </div>

            <div className="discovery-card-top">
              <span className="discovery-symbol" aria-hidden="true">{(() => { const Symbol = eventSymbol(event); return <Symbol size={43} strokeWidth={1.6} />; })()}</span>
              <div className="discovery-tags"><span>{event.category}</span>{interests.includes(event.category) && <span className="discovery-interest">По твоим интересам</span>}</div>
            </div>
            <h2>{event.title}</h2>
            <div className="discovery-meta">
              <span><CalendarDays size={21} /><span>{dateLabel(event.date)}{event.endDate && ` — ${dateLabel(event.endDate)}`} · {event.time}</span></span>
              <span>{event.format === 'Онлайн' ? <Monitor size={21} /> : <MapPin size={21} />}<span>{event.format === 'Онлайн' ? `Онлайн${event.platform ? ` · ${event.platform}` : ''}` : event.venue}</span></span>
              <span><Users size={21} /><span>{event.age}</span></span>
              <span><Clock3 size={21} /><span>{isPast(event) ? 'Событие завершено' : `Заявки до ${dateLabel(event.deadline)}`}</span></span>
            </div>
            <div className="discovery-actions">
              <button type="button" className="discovery-details" onClick={() => onOpenEvent(event)}>Подробнее</button>
              {isPast(event) ? joined.includes(event.id) && <span className="discovery-joined"><Check size={18} />Участие</span> : <button type="button" className="discovery-participate" aria-pressed={joined.includes(event.id)} onClick={() => onToggle(event.id)}>{joined.includes(event.id) ? <><Check size={19} />Участвую · отменить</> : 'Участвовать'}</button>}
            </div>
          </article>
        </> : <div className="discovery-empty"><Sparkles size={34} /><p>Событий по выбранным фильтрам нет.</p></div>}
      </section>
    </div>
  </section>;
}
