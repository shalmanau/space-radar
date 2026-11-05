import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownToLine, ArrowRight, MessageCircle, Plus, Search, Send, Users, X } from 'lucide-react';
import EventCard from './EventCard';
import EventPeople from './EventPeople';
import StudentOlympiads from './StudentOlympiads';
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
  onTeacherChange: (teacherId: string) => void;
  onOrganizationChange: (organizationId: string) => void;
  onPublish: () => void;
  onSendMessage: (studentId: string, text: string, eventId?: string) => Promise<void>;
  onOpenEvent: (event: Opportunity) => void;
};

const teacherTabs = ['Лента', 'Классы', 'Сообщения', 'Олимпиады'] as const;
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

export default function RoleWorkspace({ role, events, school: directory, enrollments, messages, onTeacherChange, onOrganizationChange, onPublish, onSendMessage, onOpenEvent }: Props) {
  const school = role === 'teacher' ? { ...directory, students: directory.students.filter(student => student.institution === directory.school) } : directory;
  const [participantEvent, setParticipantEvent] = useState<Opportunity | null>(null);
  const [tab, setTab] = useState<string>(role === 'teacher' ? teacherTabs[0] : organizationTabs[0]);
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(school.classes[0]?.id ?? '');
  const [dialog, setDialog] = useState<'invite' | 'message' | 'portfolio' | 'student-profile' | null>(null);
  const [dialogEvent, setDialogEvent] = useState<Opportunity | null>(null);
  const [inviteEventId, setInviteEventId] = useState('');
  const [portfolioStudent, setPortfolioStudent] = useState<SchoolStudent | null>(null);
  const [recipientMode, setRecipientMode] = useState<'student' | 'class'>('student');
  const [sending, setSending] = useState(false);
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
  const threadMessages = messages.filter(message => message.studentId === conversationStudent && message.teacherId === school.teacher.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sendDialog = async () => {
    const value = draft.trim();
    if (sending || !value || !dialogTargets.length) return;
    setSending(true);
    try {
      await Promise.all(dialogTargets.map(student => onSendMessage(student.id, value, dialog === 'invite' ? selectedInviteEvent?.id : undefined)));
      setDraft(''); setDialog(null); setDialogEvent(null); setInviteEventId('');
    } catch { /* Keep the dialog and draft; the parent displays the error. */ }
    finally { setSending(false); }
  };
  const openInvite = (event: Opportunity) => { setDialogEvent(event); setInviteEventId(event.id); setDialog('invite'); setDraft(''); setRecipientMode('student'); };
  const openDirectMessage = (studentId: string) => { setDialogStudent(studentId); setDialogClass(school.students.find(student => student.id === studentId)?.classId ?? school.classes[0]?.id ?? ''); setDialog('message'); setDraft(''); setRecipientMode('student'); };

  return <div className="staff-workspace">
    <section className="staff-identity">
      <div className="staff-identity-copy"><h1>{role === 'teacher' ? school.teacher.name : school.organization.name}</h1>{role === 'teacher' && <p>{school.teacher.subject} · {school.school}</p>}</div>
      <div className="staff-identity-actions">{role === 'organization' && <label className="teacher-account-select">Организация<select aria-label="Выбрать организацию" value={school.organization.id} onChange={event => onOrganizationChange(event.target.value)}>{school.organizations.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>}{role === 'teacher' && <label className="teacher-account-select">Учитель<select aria-label="Выбрать учителя" value={school.teacher.id} onChange={event => onTeacherChange(event.target.value)}>{school.teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>}{role === 'teacher' && <button className="button primary" onClick={onPublish}><Plus size={20} />Объявить активность</button>}</div>
    </section>
    <nav className="staff-tabs" aria-label="Разделы рабочего пространства">{(role === 'teacher' ? teacherTabs : organizationTabs).map(label => <button key={label} className={tab === label ? 'active' : ''} onClick={() => { setTab(label); setQuery(''); }} aria-current={tab === label ? 'page' : undefined}>{label}</button>)}</nav>

    {role === 'teacher' && tab === 'Лента' && <section className="staff-section">
      <div className="staff-section-heading"><div><h2>Предстоящие возможности</h2></div><span className="staff-count">{filteredFeed.length} событий</span></div>
      <label className="staff-search"><Search size={21} /><span className="visually-hidden">Поиск событий</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по названию, теме или организатору" /></label>
      {filteredFeed.length ? <div className="staff-event-grid">{filteredFeed.map(event => <EventCard key={event.id} event={event} joined={false} onSelect={onOpenEvent} onToggle={() => {}} hideParticipation action={{ label: 'Предложить', onClick: () => openInvite(event) }} />)}</div> : <div className="staff-empty"><h3>Событий не найдено</h3><p>Попробуйте другой поисковый запрос.</p></div>}
    </section>}

    {role === 'teacher' && tab === 'Классы' && <section className="staff-section">
      <div className="staff-section-heading"><div><h2>Классы и ученики</h2></div></div>
      <div className="staff-class-layout"><aside className="staff-class-list" aria-label="Список классов">{school.classes.map(group => <button className={selectedClass === group.id ? 'active' : ''} key={group.id} onClick={() => setSelectedClass(group.id)}><span>{group.name}</span><small>{school.students.filter(student => student.classId === group.id).length} учеников</small></button>)}</aside>
        <div className="staff-class-detail"><div className="staff-section-heading compact"><div><h3>{portfolioClass?.name ?? 'Класс'}</h3><p>Куратор: {portfolioClass?.curatorName}</p></div><span className="staff-count">{classesStudents.length} учеников</span></div>
          {classesStudents.length ? <div className="staff-student-grid">{classesStudents.map(student => <article className="staff-student-card" key={student.id}><span className="staff-avatar" aria-hidden="true">{student.initials}</span><div className="staff-student-info"><h4><button className="pupil-name-link" onClick={() => { setPortfolioStudent(student); setDialog('student-profile'); }}>{student.name}</button></h4><p>{studentClassName(school, student)}</p></div><div className="staff-student-actions"><button className="button secondary" onClick={() => { setPortfolioStudent(student); setDialog('student-profile'); }}>Профиль</button><button className="button secondary" onClick={() => openDirectMessage(student.id)}><MessageCircle size={18} />Написать</button><button className="button secondary" onClick={() => { setDialogStudent(student.id); setDialogClass(student.classId); setRecipientMode('student'); setDialog('invite'); setDialogEvent(null); setInviteEventId(''); setDraft(''); }}>Предложить событие</button><button className="button secondary" disabled={!portfolioClass?.portfolioAccess} title={!portfolioClass?.portfolioAccess ? 'Доступ есть только у классного руководителя этого класса' : undefined} onClick={() => { setPortfolioStudent(student); setDialog('portfolio'); }}>{portfolioClass?.portfolioAccess ? 'Портфолио' : 'Портфолио закрыто'}</button></div></article>)}</div> : <div className="staff-empty"><p>В этом классе пока нет учеников.</p></div>}
          {!portfolioClass?.portfolioAccess && <div className="staff-access-note"><strong>Портфолио учеников недоступно</strong><p>Доступ есть только у классного руководителя этого класса.</p></div>}

        </div>
      </div>
    </section>}

    {role === 'teacher' && tab === 'Сообщения' && <section className="staff-section">
      <div className="staff-section-heading"><div><h2>Сообщения ученикам</h2></div></div>
      <div className="staff-messages-layout"><aside className="staff-contacts" aria-label="Выберите ученика">{school.students.map(student => <button key={student.id} className={conversationStudent === student.id ? 'active' : ''} onClick={() => setConversationStudent(student.id)}><span className="staff-avatar small">{student.initials}</span><span><strong>{student.name}</strong><small>{studentClassName(school, student)}</small></span></button>)}</aside>
        <div className="staff-thread"><div className="staff-thread-head"><div><h3>{school.students.find(student => student.id === conversationStudent)?.name ?? 'Выберите ученика'}</h3><p>{school.students.find(student => student.id === conversationStudent) ? studentClassName(school, school.students.find(student => student.id === conversationStudent)!) : ''}</p></div><button className="button secondary" onClick={() => { const student = school.students.find(person => person.id === conversationStudent); if (student) { setPortfolioStudent(student); setDialog('student-profile'); } }}>Профиль</button><button className="button secondary" onClick={() => { setDialogStudent(conversationStudent); setDialogClass(school.students.find(student => student.id === conversationStudent)?.classId ?? ''); setDialog('invite'); setDialogEvent(null); setInviteEventId(''); setDraft(''); }}>Предложить событие</button></div>
          <div className="staff-message-list" aria-live="polite">{threadMessages.length ? threadMessages.map(message => <article className={`staff-message ${message.sender === 'teacher' ? 'outgoing' : 'incoming'}`} key={message.id}><p>{message.text}</p><div><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>{message.eventId && <span>Событие: {events.find(event => event.id === message.eventId)?.title ?? 'активность'}</span>}</div></article>) : <div className="staff-empty"><p>Начните разговор: отправьте ученику сообщение.</p></div>}</div>
          <form className="staff-composer" onSubmit={async event => { event.preventDefault(); if (sending || !conversationStudent || !draft.trim()) return; setSending(true); try { await onSendMessage(conversationStudent, draft.trim()); setDraft(''); } catch { /* Keep draft. */ } finally { setSending(false); } }}><label className="visually-hidden" htmlFor="staff-thread-message">Текст сообщения</label><textarea id="staff-thread-message" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Напишите сообщение…" rows={2} /><button className="button primary" type="submit" disabled={sending || !draft.trim() || !conversationStudent}><Send size={19} />Отправить</button></form>
        </div>
      </div>
    </section>}

    {role === 'teacher' && tab === 'Олимпиады' && <section className="staff-section"><div className="staff-section-heading"><h2>Олимпиады</h2></div><label className="staff-search"><Search size={21}/><span className="visually-hidden">Поиск олимпиад</span><input aria-label="Поиск олимпиад" placeholder="Название олимпиады" value={query} onChange={event => setQuery(event.target.value)}/></label><div className="staff-owned-events">{olympiadEvents.filter(event => event.title.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))).map(event => <article className="staff-owned-event olympiad-event" key={event.id}><div className="staff-owned-main"><span className="staff-event-type">{isPast(event) ? 'Завершена' : 'Предстоит'}</span><h3>{event.title}</h3><p>{dateLabel(event.date)} · {event.venue}</p></div><div className="staff-owned-actions"><span className="staff-participant-count"><Users size={19}/>{enrollments.filter(record => record.eventId === event.id && school.students.some(student => student.id === record.studentId)).length} участников</span><button className="button secondary" onClick={() => setParticipantEvent(event)}>Участники<ArrowRight size={18}/></button><button className="button secondary" onClick={() => onOpenEvent(event)}>Подробнее</button></div></article>)}</div>{!olympiadEvents.some(event => event.title.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))) && <div className="staff-empty"><p>Олимпиады не найдены.</p></div>}</section>}

    {role === 'organization' && tab === 'Мои активности' && <section className="staff-section">
      <div className="staff-section-heading"><div><h2>Мои активности</h2></div><button className="button primary" onClick={onPublish}><Plus size={19} />Создать активность</button></div>
      {ownerEvents.length ? <div className="staff-owned-events">{ownerEvents.map(event => { const count = enrollments.filter(enrollment => enrollment.eventId === event.id).length; return <article className="staff-owned-event" key={event.id}><img src={event.image} alt="" /><div className="staff-owned-main"><span className="staff-event-type">{event.type} · {isPast(event) ? 'Завершено' : 'Предстоит'}</span><h3>{event.title}</h3><p>{dateLabel(event.date)} · {event.time} · {event.venue}</p></div><div className="staff-owned-actions"><span className="staff-participant-count"><Users size={19} />{count} участников</span><button className="button secondary" onClick={() => setParticipantEvent(event)}>Участники<ArrowRight size={17} /></button><button className="button secondary" onClick={() => onOpenEvent(event)}>Подробнее</button></div></article>; })}</div> : <div className="staff-empty"><h3>Активностей пока нет</h3><p>Создайте первую публикацию, чтобы пригласить школьников.</p><button className="button primary" onClick={onPublish}><Plus size={19} />Создать активность</button></div>}
    </section>}

    {participantEvent && <WorkspaceDialog wide title={`Участники: ${participantEvent.title}`} onClose={() => setParticipantEvent(null)}><p className="event-registry-summary">{dateLabel(participantEvent.date)} · {participantEvent.venue}</p><EventPeople key={participantEvent.id} event={participantEvent} school={role === 'teacher' ? school : directory} enrollments={enrollments} registry onOpenStudent={role === 'teacher' ? student => { setParticipantEvent(null); setPortfolioStudent(student); setDialog('student-profile'); } : undefined} /></WorkspaceDialog>}

    {dialog && <WorkspaceDialog wide={dialog === 'student-profile'} title={dialog === 'student-profile' ? `Профиль: ${portfolioStudent?.name ?? ''}` : dialog === 'invite' ? 'Предложить активность ученикам' : dialog === 'portfolio' ? `Портфолио: ${portfolioStudent?.name ?? ''}` : 'Новое сообщение'} onClose={() => { setDialog(null); setDialogEvent(null); setInviteEventId(''); setPortfolioStudent(null); }}>
      {dialog === 'student-profile' && portfolioStudent ? <StudentOlympiads student={portfolioStudent} school={school} events={events} enrollments={enrollments} onOpenEvent={onOpenEvent} /> : dialog === 'portfolio' ? <><div className="staff-portfolio-summary"><span className="staff-avatar">{portfolioStudent?.initials}</span><div><h3>{portfolioStudent?.name}</h3><p>{portfolioStudent ? studentClassName(school, portfolioStudent) : ''} · {school.school}</p></div></div><div className="staff-dialog-actions portfolio-export"><span>{studentPortfolioEvents.length} завершённых событий</span><button className="button secondary" disabled={!studentPortfolioEvents.length} onClick={() => downloadCsv(`портфолио-${portfolioStudent?.name.replaceAll(' ', '-') ?? 'ученика'}.csv`, [['Активность', 'Дата', 'Место', 'Организатор'], ...studentPortfolioEvents.map(event => [event.title, dateLabel(event.date), event.venue, event.organizer])])}><ArrowDownToLine size={18} />Скачать CSV</button></div>{studentPortfolioEvents.length ? <div className="staff-event-grid staff-portfolio-events">{studentPortfolioEvents.map(event => <EventCard key={event.id} event={event} joined={false} onSelect={onOpenEvent} onToggle={() => {}} hideParticipation />)}</div> : <div className="staff-empty"><p>Завершённых событий с регистрациями этого ученика пока нет.</p></div>}</> : dialog === 'invite' && (dialogEvent ? <div className="staff-invite-event"><strong>{dialogEvent.title}</strong><span>{dateLabel(dialogEvent.date)} · {dialogEvent.organizer}</span></div> : <label className="staff-dialog-event-select">Активность<select value={inviteEventId} onChange={event => setInviteEventId(event.target.value)}><option value="">Выберите активность</option>{teacherEvents.map(event => <option key={event.id} value={event.id}>{event.title} · {dateLabel(event.date)}</option>)}</select></label>)}
      {dialog !== 'portfolio' && dialog !== 'student-profile' && <><div className="staff-form-fields"><label>Кому<select value={recipientMode} onChange={event => setRecipientMode(event.target.value as 'student' | 'class')}><option value="student">Одному ученику</option><option value="class">Всему классу</option></select></label>{recipientMode === 'class' ? <label>Класс<select value={dialogClass} onChange={event => setDialogClass(event.target.value)}>{school.classes.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label> : <label>Ученик<select value={dialogStudent} onChange={event => setDialogStudent(event.target.value)}>{school.students.map(student => <option key={student.id} value={student.id}>{student.name} · {studentClassName(school, student)}</option>)}</select></label>}<label>Сообщение<textarea rows={5} value={draft} onChange={event => setDraft(event.target.value)} placeholder={dialog === 'invite' ? 'Расскажите, почему эта активность может подойти…' : 'Напишите ученику…'} /></label></div><div className="staff-dialog-actions"><span>{dialogTargets.length} {dialogTargets.length === 1 ? 'получатель' : 'получателей'}</span><button className="button primary" disabled={sending || !draft.trim() || !dialogTargets.length || (dialog === 'invite' && !selectedInviteEvent)} onClick={sendDialog}><Send size={18} />Отправить</button></div></>}
    </WorkspaceDialog>}
  </div>;
}
