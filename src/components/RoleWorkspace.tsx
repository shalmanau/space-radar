import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownToLine, ArrowRight, MessageCircle, Plus, Search, Send, Users, X } from 'lucide-react';
import EventCard from './EventCard';
import EventPeople from './EventPeople';
import type { Enrollment, Message, SchoolData, SchoolStudent } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';
import '../staff.css';

type Props = {
  role: 'teacher' | 'organization';
  events: Opportunity[];
  school: SchoolData;
  enrollments: Enrollment[];
  messages: Message[];
  onPublish: () => void;
  onSendMessage: (studentId: string, text: string, eventId?: string) => void;
  onOpenEvent: (event: Opportunity) => void;
};

const teacherTabs = ['Лента', 'Классы', 'Сообщения', 'Участники олимпиад'] as const;
const organizationTabs = ['Мои активности'] as const;
const studentClassName = (school: SchoolData, student: SchoolStudent) => school.classes.find(item => item.id === student.classId)?.name ?? 'Класс не указан';
const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
function downloadCsv(filename: string, rows: string[][]) {
  const csv = '\uFEFF' + rows.map(row => row.map(escapeCsv).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

function WorkspaceDialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  // The dialog stays mounted while open; showModal supplies keyboard and backdrop behavior.
  useEffect(() => { const dialog = ref.current; if (dialog && !dialog.open) dialog.showModal(); const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previousOverflow; }; }, []);
  return <dialog className={`staff-dialog${wide ? ' registry-dialog' : ''}`} ref={ref} aria-label={title} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="staff-dialog-head"><h2>{title}</h2><button className="icon-button" type="button" aria-label="Закрыть окно" onClick={onClose}><X size={22} /></button></div>
    {children}
  </dialog>;
}

export default function RoleWorkspace({ role, events, school: directory, enrollments, messages, onPublish, onSendMessage, onOpenEvent }: Props) {
  const school = role === 'teacher' ? { ...directory, students: directory.students.filter(student => student.institution === directory.school) } : directory;
  const [participantEvent, setParticipantEvent] = useState<Opportunity | null>(null);
  const [tab, setTab] = useState<string>(role === 'teacher' ? teacherTabs[0] : organizationTabs[0]);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedClass, setSelectedClass] = useState(school.classes[0]?.id ?? '');
  const [dialog, setDialog] = useState<'invite' | 'message' | 'portfolio' | null>(null);
  const [dialogEvent, setDialogEvent] = useState<Opportunity | null>(null);
  const [inviteEventId, setInviteEventId] = useState('');
  const [portfolioStudent, setPortfolioStudent] = useState<SchoolStudent | null>(null);
  const [recipientMode, setRecipientMode] = useState<'student' | 'class'>('student');
  const [draft, setDraft] = useState('');
  const [dialogClass, setDialogClass] = useState(school.classes[0]?.id ?? '');
  const [dialogStudent, setDialogStudent] = useState(school.students[0]?.id ?? '');
  const [conversationStudent, setConversationStudent] = useState(school.students[0]?.id ?? '');

  const teacherEvents = useMemo(() => events.filter(event => !isPast(event)).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [events]);
  const classesStudents = school.students.filter(student => student.classId === selectedClass);
  const portfolioClass = school.classes.find(item => item.id === selectedClass);
  const studentPortfolioEvents = portfolioStudent ? events.filter(event => isPast(event) && enrollments.some(enrollment => enrollment.eventId === event.id && enrollment.studentId === portfolioStudent.id)).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const filteredFeed = teacherEvents.filter(event => `${event.title} ${event.organizer} ${event.category} ${event.type}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const dialogTargets = recipientMode === 'class' ? school.students.filter(student => student.classId === dialogClass) : school.students.filter(student => student.id === dialogStudent);
  const selectedInviteEvent = dialogEvent ?? teacherEvents.find(event => event.id === inviteEventId) ?? null;
  const ownerEvents = events.filter(event => event.ownerId === school.organization.id).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const olympiadEvents = events.filter(event => event.type === 'Олимпиада');
  const filteredOlympiads = enrollments.filter(enrollment => {
    const student = school.students.find(item => item.id === enrollment.studentId);
    const event = events.find(item => item.id === enrollment.eventId && item.type === 'Олимпиада');
    return Boolean(student && event && (classFilter === 'all' || student.classId === classFilter) && (eventFilter === 'all' || event.id === eventFilter));
  });
  const threadMessages = messages.filter(message => message.studentId === conversationStudent).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sendDialog = () => {
    const value = draft.trim();
    if (!value || !dialogTargets.length) return;
    dialogTargets.forEach(student => onSendMessage(student.id, value, dialog === 'invite' ? selectedInviteEvent?.id : undefined));
    setDraft(''); setDialog(null); setDialogEvent(null); setInviteEventId('');
  };
  const openInvite = (event: Opportunity) => { setDialogEvent(event); setInviteEventId(event.id); setDialog('invite'); setDraft(''); setRecipientMode('student'); };
  const openDirectMessage = (studentId: string) => { setDialogStudent(studentId); setDialogClass(school.students.find(student => student.id === studentId)?.classId ?? school.classes[0]?.id ?? ''); setDialog('message'); setDraft(''); setRecipientMode('student'); };

  return <div className="staff-workspace">
    <section className="staff-identity">
      <div className="staff-identity-copy"><span className="staff-eyebrow">{role === 'teacher' ? school.school : 'Партнёр ВнеКласса'}</span><h1>{role === 'teacher' ? school.teacher.name : school.organization.name}</h1><p>{role === 'teacher' ? school.teacher.subject : 'Кабинет организатора активностей'}</p></div>
      <div className="staff-identity-actions">{role === 'teacher' && <button className="button primary" onClick={onPublish}><Plus size={20} />Объявить активность</button>}<span className="staff-role-pill">{role === 'teacher' ? 'Учитель' : 'Организация'}</span></div>
    </section>
    <nav className="staff-tabs" aria-label="Разделы рабочего пространства">{(role === 'teacher' ? teacherTabs : organizationTabs).map(label => <button key={label} className={tab === label ? 'active' : ''} onClick={() => { setTab(label); setQuery(''); }} aria-current={tab === label ? 'page' : undefined}>{label}</button>)}</nav>

    {role === 'teacher' && tab === 'Лента' && <section className="staff-section">
      <div className="staff-section-heading"><div><span className="staff-eyebrow">Для школьников</span><h2>Предстоящие возможности</h2></div><span className="staff-count">{filteredFeed.length} событий</span></div>
      <label className="staff-search"><Search size={21} /><span className="visually-hidden">Поиск событий</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по названию, теме или организатору" /></label>
      {filteredFeed.length ? <div className="staff-event-grid">{filteredFeed.map(event => <EventCard key={event.id} event={event} joined={false} onSelect={onOpenEvent} onToggle={() => {}} hideParticipation action={{ label: 'Предложить', onClick: () => openInvite(event) }} />)}</div> : <div className="staff-empty"><h3>Событий не найдено</h3><p>Попробуйте другой поисковый запрос.</p></div>}
    </section>}

    {role === 'teacher' && tab === 'Классы' && <section className="staff-section">
      <div className="staff-section-heading"><div><span className="staff-eyebrow">Школьное сообщество</span><h2>Классы и ученики</h2></div></div>
      <div className="staff-class-layout"><aside className="staff-class-list" aria-label="Список классов">{school.classes.map(group => <button className={selectedClass === group.id ? 'active' : ''} key={group.id} onClick={() => setSelectedClass(group.id)}><span>{group.name}</span><small>{school.students.filter(student => student.classId === group.id).length} учеников</small></button>)}</aside>
        <div className="staff-class-detail"><div className="staff-section-heading compact"><div><h3>{portfolioClass?.name ?? 'Класс'}</h3><p>Куратор: {portfolioClass?.curatorName}</p></div><span className="staff-count">{classesStudents.length} учеников</span></div>
          {classesStudents.length ? <div className="staff-student-grid">{classesStudents.map(student => <article className="staff-student-card" key={student.id}><span className="staff-avatar" aria-hidden="true">{student.initials}</span><div className="staff-student-info"><h4>{student.name}</h4><p>{studentClassName(school, student)}</p></div><div className="staff-student-actions"><button className="button secondary" onClick={() => openDirectMessage(student.id)}><MessageCircle size={18} />Написать</button><button className="button secondary" onClick={() => { setDialogStudent(student.id); setDialogClass(student.classId); setRecipientMode('student'); setDialog('invite'); setDialogEvent(null); setInviteEventId(''); setDraft(''); }}>Предложить событие</button><button className="button secondary" disabled={!portfolioClass?.portfolioAccess} title={!portfolioClass?.portfolioAccess ? 'Доступ есть только у классного руководителя этого класса' : undefined} onClick={() => { setPortfolioStudent(student); setDialog('portfolio'); }}>{portfolioClass?.portfolioAccess ? 'Портфолио' : 'Портфолио закрыто'}</button></div></article>)}</div> : <div className="staff-empty"><p>В этом классе пока нет учеников.</p></div>}
          {!portfolioClass?.portfolioAccess && <div className="staff-access-note"><strong>Портфолио учеников недоступно</strong><p>Доступ есть только у классного руководителя этого класса.</p></div>}

        </div>
      </div>
    </section>}

    {role === 'teacher' && tab === 'Сообщения' && <section className="staff-section">
      <div className="staff-section-heading"><div><span className="staff-eyebrow">Личная переписка</span><h2>Сообщения ученикам</h2></div></div>
      <div className="staff-messages-layout"><aside className="staff-contacts" aria-label="Выберите ученика">{school.students.map(student => <button key={student.id} className={conversationStudent === student.id ? 'active' : ''} onClick={() => setConversationStudent(student.id)}><span className="staff-avatar small">{student.initials}</span><span><strong>{student.name}</strong><small>{studentClassName(school, student)}</small></span><span className="staff-contact-unread">{messages.filter(message => message.studentId === student.id).length || ''}</span></button>)}</aside>
        <div className="staff-thread"><div className="staff-thread-head"><div><h3>{school.students.find(student => student.id === conversationStudent)?.name ?? 'Выберите ученика'}</h3><p>{school.students.find(student => student.id === conversationStudent) ? studentClassName(school, school.students.find(student => student.id === conversationStudent)!) : ''}</p></div><button className="button secondary" onClick={() => { setDialogStudent(conversationStudent); setDialogClass(school.students.find(student => student.id === conversationStudent)?.classId ?? ''); setDialog('invite'); setDialogEvent(null); setInviteEventId(''); setDraft(''); }}>Предложить событие</button></div>
          <div className="staff-message-list" aria-live="polite">{threadMessages.length ? threadMessages.map(message => <article className={`staff-message ${message.sender === 'teacher' ? 'outgoing' : 'incoming'}`} key={message.id}><p>{message.text}</p><div><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>{message.eventId && <span>Событие: {events.find(event => event.id === message.eventId)?.title ?? 'активность'}</span>}</div></article>) : <div className="staff-empty"><p>Начните разговор: отправьте ученику сообщение.</p></div>}</div>
          <form className="staff-composer" onSubmit={event => { event.preventDefault(); if (!conversationStudent || !draft.trim()) return; onSendMessage(conversationStudent, draft.trim()); setDraft(''); }}><label className="visually-hidden" htmlFor="staff-thread-message">Текст сообщения</label><textarea id="staff-thread-message" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Напишите сообщение…" rows={2} /><button className="button primary" type="submit" disabled={!draft.trim() || !conversationStudent}><Send size={19} />Отправить</button></form>
        </div>
      </div>
    </section>}

    {role === 'teacher' && tab === 'Участники олимпиад' && <section className="staff-section">
      <div className="staff-section-heading"><div><span className="staff-eyebrow">Школьная статистика</span><h2>Участники олимпиад</h2></div><button className="button secondary" disabled={!filteredOlympiads.length} onClick={() => downloadCsv('участники-олимпиад.csv', [['Ученик', 'Класс', 'Олимпиада', 'Дата регистрации'], ...filteredOlympiads.map(enrollment => { const student = school.students.find(item => item.id === enrollment.studentId)!; const event = events.find(item => item.id === enrollment.eventId)!; return [student.name, studentClassName(school, student), event.title, dateLabel(enrollment.registeredAt.slice(0, 10))]; })])}><ArrowDownToLine size={19} />Скачать CSV</button></div>
      <div className="staff-filters"><label>Класс<select value={classFilter} onChange={event => setClassFilter(event.target.value)}><option value="all">Все классы</option>{school.classes.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label>Олимпиада<select value={eventFilter} onChange={event => setEventFilter(event.target.value)}><option value="all">Все олимпиады</option>{olympiadEvents.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label><span className="staff-count">{filteredOlympiads.length} регистраций</span></div>
      <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Ученик</th><th>Класс</th><th>Олимпиада</th><th>Дата регистрации</th></tr></thead><tbody>{filteredOlympiads.map(enrollment => { const student = school.students.find(item => item.id === enrollment.studentId)!; const event = events.find(item => item.id === enrollment.eventId)!; return <tr key={enrollment.id}><td>{student.name}</td><td>{studentClassName(school, student)}</td><td><button className="staff-link-button" onClick={() => onOpenEvent(event)}>{event.title}</button></td><td>{dateLabel(enrollment.registeredAt.slice(0, 10))}</td></tr>; })}</tbody></table>{!filteredOlympiads.length && <div className="staff-empty"><p>По выбранным фильтрам регистраций нет.</p></div>}</div>
    </section>}

    {role === 'organization' && tab === 'Мои активности' && <section className="staff-section">
      <div className="staff-section-heading"><div><span className="staff-eyebrow">Публикации организации</span><h2>Мои активности</h2></div><button className="button primary" onClick={onPublish}><Plus size={19} />Создать активность</button></div>
      {ownerEvents.length ? <div className="staff-owned-events">{ownerEvents.map(event => { const count = enrollments.filter(enrollment => enrollment.eventId === event.id).length; return <article className="staff-owned-event" key={event.id}><img src={event.image} alt="" /><div className="staff-owned-main"><span className="staff-event-type">{event.type} · {isPast(event) ? 'Завершено' : 'Предстоит'}</span><h3>{event.title}</h3><p>{dateLabel(event.date)} · {event.time} · {event.venue}</p></div><div className="staff-owned-actions"><span className="staff-participant-count"><Users size={19} />{count} участников</span><button className="button secondary" onClick={() => setParticipantEvent(event)}>Участники<ArrowRight size={17} /></button><button className="button secondary" onClick={() => onOpenEvent(event)}>Подробнее</button></div></article>; })}</div> : <div className="staff-empty"><h3>Активностей пока нет</h3><p>Создайте первую публикацию, чтобы пригласить школьников.</p><button className="button primary" onClick={onPublish}><Plus size={19} />Создать активность</button></div>}
    </section>}

    {participantEvent && <WorkspaceDialog wide title={`Участники: ${participantEvent.title}`} onClose={() => setParticipantEvent(null)}><p className="event-registry-summary">{dateLabel(participantEvent.date)} · {participantEvent.venue}</p><EventPeople key={participantEvent.id} event={participantEvent} school={directory} enrollments={enrollments} registry /></WorkspaceDialog>}

    {dialog && <WorkspaceDialog title={dialog === 'invite' ? 'Предложить активность ученикам' : dialog === 'portfolio' ? `Портфолио: ${portfolioStudent?.name ?? ''}` : 'Новое сообщение'} onClose={() => { setDialog(null); setDialogEvent(null); setInviteEventId(''); setPortfolioStudent(null); }}>
      {dialog === 'portfolio' ? <><div className="staff-portfolio-summary"><span className="staff-avatar">{portfolioStudent?.initials}</span><div><h3>{portfolioStudent?.name}</h3><p>{portfolioStudent ? studentClassName(school, portfolioStudent) : ''} · {school.school}</p></div></div><div className="staff-dialog-actions portfolio-export"><span>{studentPortfolioEvents.length} завершённых событий</span><button className="button secondary" disabled={!studentPortfolioEvents.length} onClick={() => downloadCsv(`портфолио-${portfolioStudent?.name.replaceAll(' ', '-') ?? 'ученика'}.csv`, [['Активность', 'Дата', 'Место', 'Организатор'], ...studentPortfolioEvents.map(event => [event.title, dateLabel(event.date), event.venue, event.organizer])])}><ArrowDownToLine size={18} />Скачать CSV</button></div>{studentPortfolioEvents.length ? <div className="staff-event-grid staff-portfolio-events">{studentPortfolioEvents.map(event => <EventCard key={event.id} event={event} joined={false} onSelect={onOpenEvent} onToggle={() => {}} hideParticipation />)}</div> : <div className="staff-empty"><p>Завершённых событий с регистрациями этого ученика пока нет.</p></div>}</> : dialog === 'invite' && (dialogEvent ? <div className="staff-invite-event"><strong>{dialogEvent.title}</strong><span>{dateLabel(dialogEvent.date)} · {dialogEvent.organizer}</span></div> : <label className="staff-dialog-event-select">Активность<select value={inviteEventId} onChange={event => setInviteEventId(event.target.value)}><option value="">Выберите активность</option>{teacherEvents.map(event => <option key={event.id} value={event.id}>{event.title} · {dateLabel(event.date)}</option>)}</select></label>)}
      {dialog !== 'portfolio' && <><div className="staff-form-fields"><label>Кому<select value={recipientMode} onChange={event => setRecipientMode(event.target.value as 'student' | 'class')}><option value="student">Одному ученику</option><option value="class">Всему классу</option></select></label>{recipientMode === 'class' ? <label>Класс<select value={dialogClass} onChange={event => setDialogClass(event.target.value)}>{school.classes.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label> : <label>Ученик<select value={dialogStudent} onChange={event => setDialogStudent(event.target.value)}>{school.students.map(student => <option key={student.id} value={student.id}>{student.name} · {studentClassName(school, student)}</option>)}</select></label>}<label>Сообщение<textarea rows={5} value={draft} onChange={event => setDraft(event.target.value)} placeholder={dialog === 'invite' ? 'Расскажите, почему эта активность может подойти…' : 'Напишите ученику…'} /></label></div><div className="staff-dialog-actions"><span>{dialogTargets.length} {dialogTargets.length === 1 ? 'получатель' : 'получателей'}</span><button className="button primary" disabled={!draft.trim() || !dialogTargets.length || (dialog === 'invite' && !selectedInviteEvent)} onClick={sendDialog}><Send size={18} />Отправить</button></div></>}
    </WorkspaceDialog>}
  </div>;
}
