import { matchesInterests } from '../interests';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Award, Bell, CalendarDays, CheckCircle2, Circle, Clock3, Leaf, Medal, Plus, Trash2, Trophy } from 'lucide-react';
import EventCalendar from './EventCalendar';
import type { SchoolData } from '../roleTypes';
import type { Opportunity, Profile } from '../types';
import { dateLabel, happensOn, TODAY } from '../types';
import './studentProfileOverview.css';

type Props = {
  events: Opportunity[];
  participation: Opportunity[];
  school: SchoolData;
  profile: Profile;
  onOpenEvent: (event: Opportunity) => void;
  onFindEvents: () => void;
  onEditInterests: () => void;
};
type Reminder = { id: string; title: string; date: string; time: string; done: boolean };
const dateMonth = (value: string) => new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1);
const eventOrder = (a: Opportunity, b: Opportunity) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
const readStorage = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};
const writeStorage = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable in private browsing. */ }
};

export default function StudentProfileOverview({ events, participation, school, profile, onOpenEvent }: Props) {
  const studentId = school.students.find(student => student.name === profile.fullName)?.id || profile.fullName || profile.name;
  const storagePrefix = `student-profile-overview:${encodeURIComponent(studentId)}`;
  const remindersKey = `${storagePrefix}:reminders`;
  const [reminders, setReminders] = useState<Reminder[]>(() => readStorage(remindersKey, []));
  const upcoming = useMemo(() => participation.filter(event => (event.endDate || event.date) >= TODAY).sort(eventOrder), [participation]);
  const [month, setMonth] = useState(() => dateMonth(upcoming[0]?.date || TODAY));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [reminderDate, setReminderDate] = useState(TODAY);
  const [reminderTime, setReminderTime] = useState('18:00');

  useEffect(() => writeStorage(remindersKey, reminders), [remindersKey, reminders]);

  const results = school.eventResults.filter(result => result.studentId === studentId);
  const achievementMap = new Map<string, { event: Opportunity; award?: string }>();
  participation.filter(event => (event.endDate || event.date) < TODAY).forEach(event => achievementMap.set(event.id, { event }));
  results.forEach(result => {
    const event = events.find(item => item.id === result.eventId);
    if (event) achievementMap.set(event.id, { event, award: result.award });
  });
  const achievements = [...achievementMap.values()].sort((a, b) => eventOrder(b.event, a.event));
  const pastParticipations = participation.filter(event => (event.endDate || event.date) < TODAY);
  const diplomaCount = results.filter(result => result.award.trim().length > 0).length;
  const milestones = [
    { id: 'first-participation', title: 'Первое участие', value: pastParticipations.length, goal: 1, Icon: CheckCircle2 },
    { id: 'three-events', title: '3 мероприятия', value: pastParticipations.length, goal: 3, Icon: Medal },
    { id: 'different-interests', title: 'Разные интересы', value: new Set(pastParticipations.map(event => event.category)).size, goal: 2, Icon: Leaf },
    { id: 'first-diploma', title: 'Первый диплом', value: diplomaCount, goal: 1, Icon: Award },
  ];
  const selectedEvents = selectedDate ? upcoming.filter(event => happensOn(event, selectedDate)) : upcoming.slice(0, 3);
  const joinedIds = new Set([...profile.joined, ...profile.completedEventIds, ...participation.map(event => event.id)]);
  const matchingDeadlines = events.filter(event => event.date >= TODAY && event.deadline >= TODAY && !joinedIds.has(event.id) && matchesInterests(event, profile.interests))
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || eventOrder(a, b));
  const selectedDeadlines = selectedDate ? matchingDeadlines.filter(event => event.deadline === selectedDate) : matchingDeadlines.slice(0, 4);
  const selectedReminders = selectedDate ? reminders.filter(item => item.date === selectedDate) : [];
  const markerBase = events[0] || participation[0];
  const deadlineMarkers = matchingDeadlines.map(event => ({ ...event, id: `deadline:${event.id}`, title: `Дедлайн: ${event.title}`, date: event.deadline, endDate: event.deadline }));
  const reminderMarkers: Opportunity[] = reminders.map(item => ({
    ...(markerBase || { organizer: '', category: 'Личное', type: 'Напоминание', venue: '', format: '', age: '', deadline: item.date, image: '', description: '', skills: [], details: '', free: true }),
    id: `reminder:${item.id}`, title: item.title, date: item.date, endDate: item.date, time: item.time,
  }));
  const calendarMarkers: Opportunity[] = [...upcoming, ...deadlineMarkers, ...reminderMarkers];

  const addReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !reminderDate || !reminderTime) return;
    setReminders(previous => [...previous, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: cleanTitle, date: reminderDate, time: reminderTime, done: false }].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
    setTitle('');
  };
  const toggleReminder = (id: string) => setReminders(previous => previous.map(item => item.id === id ? { ...item, done: !item.done } : item));
  const removeReminder = (id: string) => setReminders(previous => previous.filter(item => item.id !== id));

  return <section className="profile-overview" aria-label="Обзор профиля ученика">
    <div className="profile-overview-columns">
      <div className="profile-overview-left">
        <section className="po-panel po-achievements" aria-labelledby="po-achievements-title">
          <header className="po-section-heading"><span className="po-icon"><Trophy size={22} /></span><div><h2 id="po-achievements-title">Достижения</h2></div></header>
          {achievements.length ? <ul className="po-achievement-list">{achievements.map(({ event, award }) => <li key={event.id}><button className="po-event-link" onClick={() => onOpenEvent(event)}><span className="po-achievement-mark"><CheckCircle2 size={19} /></span><span className="po-item-copy"><strong>{event.title}</strong><span>{dateLabel(event.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {award || 'Участвовал(а)'}</span></span><span className="po-open">Подробнее</span></button></li>)}</ul>
            : <p className="po-empty">Здесь появятся прошедшие события и результаты участия.</p>}
        </section>

        <section className="po-panel po-milestones" aria-labelledby="po-milestones-title">
          <header className="po-section-heading"><span className="po-icon miki"><img src="/images/miki/guide.webp" alt="" width="42" height="42" /></span><div><h2 id="po-milestones-title">Задания Микки</h2></div></header>
          <ul className="po-milestone-list">{milestones.map(({ id, title: milestoneTitle, value, goal, Icon }) => {
            const done = value >= goal;
            const shown = Math.min(value, goal);
            const percent = Math.min(100, value / goal * 100);
            return <li key={id} className={done ? 'is-done' : ''}>
              <span className="po-milestone-icon"><Icon size={22} /></span>
              <div className="po-milestone-copy"><div className="po-milestone-heading"><strong>{milestoneTitle}</strong></div><div className="po-progress-track" role="progressbar" aria-label={milestoneTitle} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={shown}><span style={{ width: `${percent}%` }} /></div><span className="po-milestone-status">{done ? 'Выполнено' : `${shown}/${goal}`}</span></div>
            </li>;
          })}</ul>
        </section>
      </div>

      <div className="profile-overview-right">
        <section className="po-panel po-calendar-panel" aria-labelledby="po-calendar-title">
          <header className="po-section-heading"><span className="po-icon"><CalendarDays size={22} /></span><div><h2 id="po-calendar-title">Умный календарь</h2></div></header>
          <EventCalendar label="Календарь моих событий и напоминаний" events={calendarMarkers} month={month} onMonthChange={setMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} compact />
          <section className="po-calendar-list" aria-live="polite" aria-label={selectedDate ? `Мои события на ${dateLabel(selectedDate)}` : 'Ближайшие мои события'}>
            <h3>{selectedDate ? `Мои события · ${dateLabel(selectedDate)}` : 'Ближайшие мои события'}</h3>
            {selectedEvents.length ? <ul>{selectedEvents.map(event => <li key={event.id}><button className="po-event-link" onClick={() => onOpenEvent(event)}><span className="po-date-badge"><time dateTime={event.date}>{dateLabel(event.date, { day: 'numeric', month: 'short' })}</time></span><span className="po-item-copy"><strong>{event.title}</strong><span>{event.time} · {event.venue} · Участвую</span></span><span className="po-open">Подробнее</span></button></li>)}</ul>
              : <p className="po-empty">{selectedDate ? 'На этот день нет будущих событий с твоим участием.' : 'Пока нет будущих событий с твоим участием.'}</p>}
          </section>
          <section className="po-deadlines" aria-labelledby="po-deadlines-title">
            <h3 id="po-deadlines-title"><Leaf size={19} />Подходящие дедлайны</h3>
            {selectedDeadlines.length ? <ul>{selectedDeadlines.map(event => <li key={event.id}><button className="po-event-link" onClick={() => onOpenEvent(event)}><span className="po-deadline-icon"><Clock3 size={19} /></span><span className="po-item-copy"><strong>{event.title}</strong><span>Заявки до {dateLabel(event.deadline, { day: 'numeric', month: 'long' })} · {event.category} · не записан(а)</span></span><span className="po-open">Подробнее</span></button></li>)}</ul>
              : <p className="po-empty">{selectedDate ? 'На выбранный день нет подходящих дедлайнов.' : 'Пока нет открытых дедлайнов по твоим интересам.'}</p>}
          </section>
          {selectedDate && <section className="po-calendar-list po-selected-reminders" aria-label={`Личные напоминания на ${dateLabel(selectedDate)}`}><h3>Мои напоминания · {dateLabel(selectedDate)}</h3>{selectedReminders.length ? <ul>{selectedReminders.map(item => <li key={item.id}><div className={`po-reminder-date-row${item.done ? ' is-done' : ''}`}><button className="po-check" type="button" aria-label={`${item.done ? 'Вернуть в список' : 'Отметить выполненным'}: ${item.title}`} aria-pressed={item.done} onClick={() => toggleReminder(item.id)}>{item.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}</button><span className="po-item-copy"><strong>{item.title}</strong><span>{item.time} · личное напоминание</span></span><button className="po-remove-reminder" type="button" onClick={() => removeReminder(item.id)} aria-label={`Удалить напоминание «${item.title}»`}><Trash2 size={19} /></button></div></li>)}</ul> : <p className="po-empty">На этот день нет личных напоминаний.</p>}</section>}
        </section>

        <section className="po-panel po-reminders" aria-labelledby="po-reminders-title">
          <header className="po-section-heading"><span className="po-icon"><Bell size={21} /></span><div><h2 id="po-reminders-title">Мои напоминания</h2></div></header>
          <form className="po-reminder-form" onSubmit={addReminder}><label className="po-reminder-name">Название<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} placeholder="Например, подготовить вопросы" required /></label><div className="po-reminder-fields"><label>Дата<input type="date" value={reminderDate} onChange={event => setReminderDate(event.target.value)} required /></label><label>Время<input type="time" value={reminderTime} onChange={event => setReminderTime(event.target.value)} required /></label></div><button className="po-add-reminder" type="submit"><Plus size={18} />Добавить</button></form>
          {reminders.length ? <ul className="po-reminder-list">{reminders.map(reminder => <li key={reminder.id} className={reminder.done ? 'is-done' : ''}><button className="po-check" type="button" aria-label={`${reminder.done ? 'Вернуть в список' : 'Отметить выполненным'}: ${reminder.title}`} aria-pressed={reminder.done} onClick={() => toggleReminder(reminder.id)}>{reminder.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}</button><span className="po-reminder-copy"><strong>{reminder.title}</strong><span>{dateLabel(reminder.date)} · {reminder.time}</span></span><button className="po-remove-reminder" type="button" onClick={() => removeReminder(reminder.id)} aria-label={`Удалить напоминание «${reminder.title}»`}><Trash2 size={19} /></button></li>)}</ul> : <p className="po-empty">Добавь личное напоминание, чтобы не забыть важное.</p>}
        </section>
      </div>
    </div>
  </section>;
}
