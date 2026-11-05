import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import type { Message } from '../roleTypes';
import type { Opportunity } from '../types';
export default function StudentInbox({ messages, events, teacherName, onSend, onOpenEvent }: { messages: Message[]; events: Opportunity[]; teacherName: string; onSend: (text: string) => void; onOpenEvent: (event: Opportunity) => void }) {
  const [text, setText] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!text.trim()) return; onSend(text.trim()); setText(''); };
  const own = messages.filter(message => message.studentId === 'sasha');
  return <><div className="page-intro"><h1><span>Сообщения</span></h1></div><section className="student-inbox"><div className="inbox-contact"><span className="large-avatar">{teacherName.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span><div><h2>{teacherName}</h2><p>Учитель · Гимназия № 12</p></div></div><div className="message-history" role="log" aria-label="Переписка с учителем">{own.length ? own.map(message => { const activity = events.find(item => item.id === message.eventId); return <article key={message.id} className={`message-bubble ${message.sender === 'student' ? 'outgoing' : ''}`}><p>{message.text}</p>{activity && <button className="message-event" onClick={() => onOpenEvent(activity)}>{activity.title}<ArrowUpRight size={19} /></button>}<span className="message-time">{message.sender === 'teacher' ? teacherName : 'Вы'} · {new Date(message.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' })}</span></article>; }) : <p>Сообщений пока нет.</p>}</div><form className="message-composer" onSubmit={submit}><label className="sr-only" htmlFor="student-message">Сообщение учителю</label><textarea id="student-message" value={text} onChange={event => setText(event.target.value)} placeholder="Написать учителю" rows={2} maxLength={2000} required /><button className="button primary" type="submit" disabled={!text.trim()}><Send size={20} />Отправить</button></form></section></>;
}
