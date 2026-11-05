import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Opportunity } from '../types';
import { dateLabel, happensOn, monthKey, monthLabel, TODAY } from '../types';

type Props = { events: Opportunity[]; month: Date; onMonthChange: (month: Date) => void; selectedDate: string | null; onSelectDate: (date: string | null) => void; compact?: boolean; label: string };
export default function EventCalendar({ events, month, onMonthChange, selectedDate, onSelectDate, compact = false, label }: Props) {
  const key = monthKey(month);
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  const moveMonth = (delta: number) => { onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1)); onSelectDate(null); };
  return <section className={`event-calendar ${compact ? 'compact' : 'full'}`} aria-label={label}>
    <div className="calendar-toolbar"><h3>{monthLabel(key)}</h3><div className="month-controls"><button className="icon-button" aria-label={`${label}: предыдущий месяц`} onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label={`${label}: следующий месяц`} onClick={() => moveMonth(1)}><ChevronRight size={17} /></button></div></div>
    <div className="calendar-days">{['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-cells">{Array.from({ length: count }, (_, i) => {
      const day = i - offset + 1;
      if (day < 1 || day > days) return <div className="calendar-blank" key={`empty${i}`} />;
      const date = `${key}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => happensOn(event, date));
      return <button className={`calendar-cell ${date === TODAY ? 'today-cell' : ''} ${selectedDate === date ? 'selected-cell' : ''} ${dayEvents.length ? 'has-events' : ''}`} key={date} onClick={() => onSelectDate(selectedDate === date ? null : date)} aria-label={`${dateLabel(date)}, событий: ${dayEvents.length}`} aria-pressed={selectedDate === date}><span className="cell-number">{day}</span>{compact ? <span className="calendar-dots">{dayEvents.slice(0, 3).map(event => <i key={event.id} />)}</span> : dayEvents.map(event => <span key={event.id} className="calendar-event" title={`${event.time} · ${event.title}`}>{event.time} · {event.title}</span>)}</button>;
    })}</div>
    {!selectedDate && <p className="calendar-note">{compact ? 'Выбери дату для просмотра событий' : 'Выбери день, чтобы посмотреть свои события'}</p>}
  </section>;
}
