import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import type { Message, Teacher } from '../roleTypes';
import type { Opportunity } from '../types';
export default function StudentInbox({ messages, events, teachers, onSend, onOpenEvent }: { messages: Message[]; events: Opportunity[]; teachers: Teacher[]; onSend: (teacherId: string, text: string) => Promise<void>; onOpenEvent: (event: Opportunity) => void }) {
  const [sending, setSending] = useState(false);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const teacher = teachers.find(item => item.id === teacherId) || teachers[0];
  const text = drafts[teacherId] || '';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (sending || !text.trim() || !teacher) return;
    setSending(true); const recipient = teacher.id;
    try { await onSend(recipient, text.trim()); setDrafts(previous => ({ ...previous, [recipient]: '' })); }
    catch { /* The parent shows the API error; retain the draft for retry. */ }
    finally { setSending(false); }
  };
  const own = messages.filter(message => message.studentId === 'sasha' && message.teacherId === teacher?.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const initials = (name: string) => name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <><div className="page-intro"><h1><span>Сообщения</span></h1></div><div className="student-chat-layout"><aside className="student-teacher-list" aria-label="Чаты с учителями"><label className="mobile-teacher-choice">Учитель<select aria-label="Выбрать чат" value={teacherId} onChange={event => setTeacherId(event.target.value)}>{teachers.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>{teachers.map(person => <button key={person.id} className={person.id === teacherId ? 'active' : ''} aria-pressed={person.id === teacherId} onClick={() => setTeacherId(person.id)}><span className="chat-avatar">{initials(person.name)}</span><span><strong>{person.name}</strong><span>{person.subject.split(' · ')[0]}</span></span></button>)}</aside>{teacher && <section className="student-inbox" aria-label={`Чат: ${teacher.name}`}><div className="inbox-contact"><span className="large-avatar">{initials(teacher.name)}</span><div><h2>{teacher.name}</h2><p>{teacher.subject} · {teacher.institution}</p></div></div><div className="message-history" role="log" aria-label={`Переписка: ${teacher.name}`}>{own.length ? own.map(message => { const activity = events.find(item => item.id === message.eventId); return <article key={message.id} className={`message-bubble ${message.sender === 'student' ? 'outgoing' : ''}`}><p>{message.text}</p>{activity && <button className="message-event" onClick={() => onOpenEvent(activity)}>{activity.title}<ArrowUpRight size={19} /></button>}<span className="message-time">{message.sender === 'teacher' ? teacher.name : 'Вы'} · {new Date(message.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' })}</span></article>; }) : <p>Сообщений пока нет.</p>}</div><form className="message-composer" onSubmit={submit}><label className="sr-only" htmlFor="student-message">Сообщение учителю</label><textarea id="student-message" value={text} onChange={event => setDrafts(previous => ({ ...previous, [teacherId]: event.target.value }))} placeholder="Написать учителю" rows={2} maxLength={2000} required /><button className="button primary" type="submit" disabled={sending || !text.trim()}><Send size={20} />Отправить</button></form></section>}</div></>;
}
