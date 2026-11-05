import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CalendarDays, Check, MapPin, X } from 'lucide-react';
import StudentApp from './StudentApp';
import ThemeToggle from './components/ThemeToggle';
import Landing from './components/Landing';
import RoleSwitcher from './components/RoleSwitcher';
import RoleWorkspace from './components/RoleWorkspace';
import DemoModal from './components/DemoModal';
import PublicationForm from './components/PublicationForm';
import StudentInbox from './components/StudentInbox';
import EventCard from './components/EventCard';
import EventPeople from './components/EventPeople';
import type { Opportunity } from './types';
import { dateLabel, isPast } from './types';
import type { DemoAccount, Enrollment, Message, Role, SchoolData } from './roleTypes';
import { roleLabels } from './roleTypes';
import './roles.css';

const KEYS = { events: 'vneklassa-published-events-v1', enrollments: 'vneklassa-enrollments-v1', messages: 'vneklassa-messages-v1' };
function storedArray<T>(key: string): T[] | null { try { const value: unknown = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : null; } catch { return null; } }
function storedAccounts(): Partial<Record<Exclude<Role, 'guest'>, DemoAccount>> { try { const value = JSON.parse(localStorage.getItem('vneklassa-demo-accounts-v1') || '{}'); const result: Partial<Record<Exclude<Role, 'guest'>, DemoAccount>> = {}; for (const role of ['student', 'teacher', 'organization'] as const) { if (value?.[role] && typeof value[role].name === 'string' && typeof value[role].email === 'string') result[role] = { name: value[role].name, email: value[role].email, role }; } return result; } catch { return {}; } }
function persist(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser-local demo remains usable without persistence. */ } }
function Logo({ onClick }: { onClick: () => void }) { return <button className="brand" onClick={onClick} aria-label="ВнеКласса — на главную"><span className="brand-mark"><svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M50 0 62 32 92 15 74 44 100 50 74 59 90 89 60 73 50 100 40 73 10 89 26 59 0 50 27 40 10 12 40 29Z" /></svg></span>ВнеКласса</button>; }

export default function App() {
  const [role, setRole] = useState<Role>('guest');
  const [activeTeacherId, setActiveTeacherId] = useState('teacher-1');
  const [guestPage, setGuestPage] = useState<'landing' | 'catalog'>('landing');
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [baseEvents, setBaseEvents] = useState<Opportunity[]>([]);
  const [published, setPublished] = useState<Opportunity[]>(() => storedArray<Opportunity>(KEYS.events) || []);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [accounts, setAccounts] = useState<Partial<Record<Exclude<Role, 'guest'>, DemoAccount>>>(storedAccounts);
  const [registration, setRegistration] = useState<Exclude<Role, 'guest'> | null>(null);
  const [registrationError, setRegistrationError] = useState('');
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState('');
  const [guestQuery, setGuestQuery] = useState('');

  useEffect(() => {
    async function load() {
      const fetchJson = async <T,>(url: string): Promise<T> => { const response = await fetch(url); if (!response.ok) throw new Error('Ошибка загрузки'); return response.json(); };
      try {
        const [events, directory] = await Promise.all([fetchJson<Opportunity[]>('/mock/opportunities.json'), fetchJson<SchoolData>('/mock/school.json')]);
        setBaseEvents(events.map(event => ({ ...event, ownerId: event.ownerId || (['code', 'code-january'].includes(event.id) ? directory.organization.id : ['school-hackathon'].includes(event.id) ? directory.teacher.id : 'org-other') })));
        const initialEnrollments = storedArray<Enrollment>(KEYS.enrollments) ?? directory.enrollments;
        const priorParticipation = storedArray<string>('vneklassa-participation-v2');
        const initialIds = priorParticipation?.filter(id => typeof id === 'string' && [...events, ...published].some(activity => activity.id === id));
        setEnrollments(initialIds ? [...initialEnrollments.filter(item => item.studentId !== 'sasha'), ...initialIds.map(eventId => initialEnrollments.find(item => item.studentId === 'sasha' && item.eventId === eventId) || { id: crypto.randomUUID(), studentId: 'sasha', eventId, registeredAt: new Date().toISOString() })] : initialEnrollments); setMessages((storedArray<Message>(KEYS.messages) ?? directory.messages).map(message => ({ ...message, teacherId: message.teacherId || directory.teacher.id }))); setSchool(directory);
      } catch { setError(true); }
    }
    void load();
  }, []);
  useEffect(() => { if (school) persist(KEYS.enrollments, enrollments); }, [school, enrollments]);
  useEffect(() => { if (school) persist(KEYS.messages, messages); }, [school, messages]);
  useEffect(() => { persist('vneklassa-demo-accounts-v1', accounts); }, [accounts]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  const events = useMemo(() => [...baseEvents, ...published].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [baseEvents, published]);
  const schoolView = useMemo(() => {
    if (!school) return null;
    const teachers = school.teachers.map(teacher => teacher.id === school.teacher.id && accounts.teacher ? { ...teacher, name: accounts.teacher.name } : teacher);
    const teacher = teachers.find(person => person.id === activeTeacherId) || teachers[0];
    return { ...school, teachers, teacher, organization: { ...school.organization, name: accounts.organization?.name || school.organization.name }, classes: school.classes.map(group => ({ ...group, portfolioAccess: group.curatorId === teacher.id, curatorName: teachers.find(person => person.id === group.curatorId)?.name || group.curatorName })), students: school.students.map(student => student.id === 'sasha' && accounts.student ? { ...student, name: accounts.student.name, initials: accounts.student.name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase() } : student) };
  }, [school, accounts, activeTeacherId]);
  const changeRole = (next: Role) => { setRole(next); setRegistration(null); setPendingEventId(null); setPublishing(false); setSelected(null); setToast(''); if (next === 'guest') setGuestPage('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const beginRegistration = (next: Exclude<Role, 'guest'> = 'student', eventId?: string) => { setPendingEventId(eventId || null); setRegistration(next); setRegistrationError(''); };
  const register = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name') || '').trim(); const email = String(data.get('email') || '').trim(); if (name.length < 2 || !registration) { setRegistrationError('Укажи имя или название организации.'); return; } const account: DemoAccount = { name, email, role: registration }; setAccounts(previous => ({ ...previous, [registration]: account })); const next = registration; setRegistration(null); setRole(next); if (next === 'teacher') setActiveTeacherId('teacher-1'); if (next === 'student' && pendingEventId && !studentParticipation.includes(pendingEventId)) syncStudentParticipation([...studentParticipation, pendingEventId]); setPendingEventId(null); setToast('Демо-профиль создан'); window.scrollTo(0, 0); };
  const publish = (activity: Opportunity) => { const next = [...published, activity]; setPublished(next); persist(KEYS.events, next); setPublishing(false); setToast('Активность опубликована в общей ленте'); };
  const syncStudentParticipation = useCallback((ids: string[]) => {
    persist('vneklassa-participation-v2', ids);
    setEnrollments(previous => {
      const own = previous.filter(enrollment => enrollment.studentId === 'sasha');
      if (own.length === ids.length && own.every(enrollment => ids.includes(enrollment.eventId))) return previous;
      return [...previous.filter(enrollment => enrollment.studentId !== 'sasha'), ...ids.map(eventId => own.find(enrollment => enrollment.eventId === eventId) || { id: crypto.randomUUID(), studentId: 'sasha', eventId, registeredAt: new Date().toISOString() })];
    });
  }, []);
  const sendMessage = (studentId: string, text: string, sender: 'teacher' | 'student', teacherId: string, eventId?: string) => { if (!text.trim()) return; setMessages(previous => [...previous, { id: crypto.randomUUID(), studentId, teacherId, sender, text: text.trim(), eventId, createdAt: new Date().toISOString() }]); };
  const studentParticipation = useMemo(() => enrollments.filter(item => item.studentId === 'sasha').map(item => item.eventId), [enrollments]);
  const publicEvents = events.filter(event => !isPast(event) && `${event.title} ${event.venue}`.toLowerCase().includes(guestQuery.toLowerCase()));

  if (error) return <div className="loading-screen"><h1>Не удалось загрузить макет</h1><button className="button primary" onClick={() => location.reload()}>Повторить</button></div>;
  if (!schoolView) return <div className="loading-screen" role="status"><p>Загрузка…</p></div>;
  return <div className="role-app">
    {role === 'student' ? <div className="student-area"><StudentApp school={schoolView} enrollments={enrollments} sharedEvents={events} participationIds={studentParticipation} onParticipationChange={syncStudentParticipation} accountName={accounts.student?.name} messagesView={<StudentInbox messages={messages} events={events} teachers={schoolView.teachers} onSend={(teacherId, text) => sendMessage('sasha', text, 'student', teacherId)} onOpenEvent={setSelected} />} /></div> : <>
      <header className="site-header role-header"><Logo onClick={() => { if (role === 'guest') { setGuestPage('landing'); window.scrollTo(0, 0); } else changeRole('guest'); }} />{role === 'guest' ? <><nav className="guest-nav" aria-label="Навигация гостя"><button onClick={() => { setGuestPage('landing'); window.scrollTo(0, 0); }}>О платформе</button><button onClick={() => { setGuestPage('catalog'); window.scrollTo(0, 0); }}>Активности</button></nav><button className="button primary guest-register" onClick={() => beginRegistration()}>Регистрация<ArrowRight size={20} /></button></> : <><span className="workspace-role-label">{role === 'teacher' ? 'Кабинет учителя' : 'Кабинет организации'}</span><button className="account-button staff-account" aria-label={roleLabels[role]}>{role === 'teacher' ? schoolView.teacher.name.split(' ').slice(0, 2).map(part => part[0]).join('') : 'ОЦ'}</button></>}</header>
      {role === 'guest' ? guestPage === 'landing' ? <Landing onRegister={() => beginRegistration()} onExplore={() => { setGuestPage('catalog'); window.scrollTo(0, 0); }} onChooseRole={beginRegistration} /> : <main className="guest-catalog"><div className="page-intro"><h1><span>Активности</span></h1></div><div className="search-field guest-search"><input aria-label="Поиск активностей" placeholder="Название или площадка" value={guestQuery} onChange={event => setGuestQuery(event.target.value)} /></div><p className="guest-catalog-intro">Посмотри события. Для участия создай демо-профиль.</p><div className="profile-events-grid">{publicEvents.map(event => <EventCard key={event.id} event={event} joined={false} onToggle={() => beginRegistration('student', event.id)} onSelect={setSelected} action={{ label: 'Участвовать', onClick: () => beginRegistration('student', event.id) }} />)}</div>{!publicEvents.length && <div className="empty-state"><p>События не найдены.</p></div>}</main> : <RoleWorkspace key={`${role}-${role === 'teacher' ? activeTeacherId : ''}`} role={role} events={events} school={schoolView} enrollments={enrollments} messages={messages} onTeacherChange={setActiveTeacherId} onPublish={() => setPublishing(true)} onSendMessage={(studentId, text, eventId) => sendMessage(studentId, text, 'teacher', schoolView.teacher.id, eventId)} onOpenEvent={setSelected} />}
    </>}
    <ThemeToggle />
    <RoleSwitcher role={role} onChange={changeRole} />
    {registration && <DemoModal title="Создать демо-профиль" onClose={() => setRegistration(null)}><form className="demo-form" onSubmit={register}><label>Роль<select aria-label="Роль при регистрации" value={registration} onChange={event => setRegistration(event.target.value as Exclude<Role, 'guest'>)}><option value="student">Школьник</option><option value="teacher">Учитель</option><option value="organization">Организация</option></select></label><label>{registration === 'organization' ? 'Название организации' : 'Имя и фамилия'}<input name="name" autoComplete="name" placeholder={registration === 'organization' ? 'Образовательный центр' : 'Александра Иванова'} required maxLength={120} /></label><label>Электронная почта<input name="email" type="email" autoComplete="email" placeholder="name@example.by" required /></label>{registrationError && <p className="form-error" role="alert">{registrationError}</p>}<button className="button primary full-width" type="submit">Создать профиль<ArrowRight size={20} /></button><p className="demo-caption">Это демо-регистрация: пароль не нужен, письма не отправляются.</p></form></DemoModal>}
    {publishing && role !== 'guest' && role !== 'student' && <DemoModal title="Объявить активность" wide onClose={() => setPublishing(false)}><PublicationForm organizer={role === 'teacher' ? schoolView.school : schoolView.organization.name} ownerId={role === 'teacher' ? schoolView.teacher.id : schoolView.organization.id} authorRole={role} onPublish={publish} /></DemoModal>}
    {selected && <DemoModal title="Об активности" wide onClose={() => setSelected(null)}><img className="public-detail-image" src={selected.image} alt="" /><div className="public-detail"><p>{selected.organizer}</p><h2>{selected.title}</h2><div className="public-event-meta"><span><CalendarDays size={21} />{dateLabel(selected.date)} · {selected.time}</span><span><MapPin size={21} />{selected.venue}</span></div><p>{selected.description}</p><h3>Программа</h3><p>{selected.details}</p>{isPast(selected) && <EventPeople event={selected} school={schoolView} enrollments={enrollments} />}{role === 'student' && !isPast(selected) && <button className={`button full-width ${studentParticipation.includes(selected.id) ? 'joined-button' : 'primary'}`} aria-pressed={studentParticipation.includes(selected.id)} onClick={() => syncStudentParticipation(studentParticipation.includes(selected.id) ? studentParticipation.filter(id => id !== selected.id) : [...studentParticipation, selected.id])}>{studentParticipation.includes(selected.id) ? 'Участвую · отменить' : 'Участвовать'}</button>}{role === 'guest' && !isPast(selected) && <button className="button primary full-width" onClick={() => { setSelected(null); beginRegistration('student', selected.id); }}>Создать профиль и участвовать</button>}</div></DemoModal>}
    {toast && <div className="toast" role="status"><span><Check size={17} /></span>{toast}<button aria-label="Закрыть сообщение" onClick={() => setToast('')}><X size={20} /></button></div>}
  </div>;
}
