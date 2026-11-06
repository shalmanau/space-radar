import ThemeSelector from './components/ThemeSelector';
import TeacherHeader from './components/TeacherHeader';
import MikiHelper from './components/MikiHelper';
import type { StudentDestination } from './components/MikiHelper';
import Logo from './components/Brand';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, MapPin, X } from 'lucide-react';
import StudentApp from './StudentApp';
import Avatar from './components/Avatar';
import PhotoEditor from './components/PhotoEditor';
import Landing from './components/Landing';
import LoginDialog from './components/LoginDialog';
import RoleWorkspace from './components/RoleWorkspace';
import DemoModal from './components/DemoModal';
import PublicationForm from './components/PublicationForm';
import StudentInbox from './components/StudentInbox';
import EventCard from './components/EventCard';
import EventPeople from './components/EventPeople';
import EventApplicationForm from './components/EventApplicationForm';
import { applicationFields, validApplication } from './application';
import type { ApplicationAnswers } from './application';
import type { Opportunity } from './types';
import { dateLabel, isPast } from './types';
import type { Enrollment, Message, Role, TeacherPage, TeacherRecommendationRequest } from './roleTypes';
import { cacheData, loadData, save, sendChatMessage, savedMessage } from './api';
import type { AppData } from './api';
import './roles.css';

const sessionKey = 'vneklassa-active-role-v1';
function savedRole(): Role {
  try { const value = localStorage.getItem(sessionKey); if (value === 'student' || value === 'teacher' || value === 'organization') return value; } catch { /* Storage can be unavailable. */ }
  return 'guest';
}

type PhotoTarget = { role: Exclude<Role, 'guest'>; id: string; name: string; initials: string; photo?: string | null };

export default function App() {
  const pendingChatMessages = useRef(new Map<string, Message>());
  const [role, setRole] = useState<Role>(savedRole);
  useEffect(() => {
    try { if (role === 'guest') localStorage.removeItem(sessionKey); else localStorage.setItem(sessionKey, role); } catch { /* The selected profile still works in this tab. */ }
  }, [role]);
  const [studentNavigation, setStudentNavigation] = useState<{ page: StudentDestination; id: number }>();
  const [teacherRecommendation, setTeacherRecommendation] = useState<TeacherRecommendationRequest>();
  const [teacherPage, setTeacherPage] = useState<TeacherPage>('feed');
  const navigateTeacher = (page: TeacherPage) => { setTeacherPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const [activeOrganizationId, setActiveOrganizationId] = useState('org-1');
  const [guestPage, setGuestPage] = useState<'landing' | 'catalog'>('landing');
  const [dataset, setDataset] = useState<AppData | null>(null);
  const [photoTarget, setPhotoTarget] = useState<PhotoTarget | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [applicationEventId, setApplicationEventId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState('');
  const [guestQuery, setGuestQuery] = useState('');
  const school = dataset?.school;
  const enrollments = school?.enrollments ?? [];
  const messages = school?.messages ?? [];

  useEffect(() => {
    let active = true;
    void loadData().then(data => { if (active) setDataset(data); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (dataset) cacheData(dataset); }, [dataset]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  const events = useMemo(() => [...(dataset?.events ?? [])].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [dataset?.events]);
  const schoolView = useMemo(() => {
    if (!school) return null;
    const teacher = school.teachers.find(person => person.id === 'teacher-1') || school.teachers[0];
    const organization = school.organizations.find(item => item.id === activeOrganizationId) || school.organizations[0];
    return { ...school, teacher, organization, students: school.students.map(student => student.id === 'sasha' ? { ...student, interests: dataset?.profile.interests ?? [] } : student), classes: school.classes.map(group => ({ ...group, portfolioAccess: group.curatorId === teacher.id, curatorName: school.teachers.find(person => person.id === group.curatorId)?.name || group.curatorName })) };
  }, [school, dataset?.profile.interests, activeOrganizationId]);
  const changeRole = (next: Role) => { setRole(next); setTeacherPage('feed'); setTeacherRecommendation(undefined); setStudentNavigation(undefined); setLoginOpen(false); setPendingEventId(null); setPublishing(false); setSelected(null); setApplicationEventId(null); setToast(''); setMutationError(''); setPhotoTarget(null); if (next === 'guest') setGuestPage('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openLogin = (eventId?: string) => { setPendingEventId(eventId || null); setSelected(null); setLoginOpen(true); };
  const login = (next: Exclude<Role, 'guest'>) => {
    const eventId = pendingEventId;
    changeRole(next);
    if (next === 'student' && eventId && !studentParticipation.includes(eventId)) {
      setApplicationEventId(eventId);
    }
  };
  const logout = () => { pendingChatMessages.current.clear(); changeRole('guest'); };
  const publish = async (activity: Opportunity) => {
    if (busy) return; setBusy(true); setMutationError('');
    try {
      const result = await save('/events', 'POST', activity, activity);
      setDataset(previous => previous ? { ...previous, events: [...previous.events.filter(item => item.id !== result.value.id), result.value] } : previous);
      setPublishing(false); setToast(savedMessage('Активность опубликована в общей ленте', result.local));
    } catch (error) { setMutationError(error instanceof Error ? error.message : 'Не удалось опубликовать активность'); }
    finally { setBusy(false); }
  };
  const syncStudentParticipation = useCallback(async (ids: string[]) => {
    const removed = enrollments.filter(item => item.studentId === 'sasha' && !ids.includes(item.eventId));
    for (const enrollment of removed) {
      try {
        const result = await save(`/enrollments/${encodeURIComponent(enrollment.id)}`, 'DELETE', undefined, undefined);
        setDataset(previous => previous ? { ...previous, school: { ...previous.school, enrollments: previous.school.enrollments.filter(item => item.id !== enrollment.id) } } : previous);
        setToast(savedMessage('Участие отменено', result.local));
      } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось отменить участие'); }
    }
  }, [enrollments]);
  const sendMessage = async (studentId: string, text: string, sender: 'teacher' | 'student', teacherId: string, eventId?: string) => {
    if (!text.trim()) return;
    const key = `${studentId}:${teacherId}:${sender}`;
    const pending = pendingChatMessages.current.get(key);
    const message: Message = pending?.text === text.trim() && pending.eventId === eventId ? pending : { id: crypto.randomUUID(), studentId, teacherId, sender, text: text.trim(), eventId, createdAt: new Date().toISOString() };
    pendingChatMessages.current.set(key, message);
    try {
      const { createdAt: _createdAt, ...body } = message;
      const delivered = await sendChatMessage(body);
      setDataset(previous => previous ? { ...previous, school: { ...previous.school, messages: [...previous.school.messages.filter(item => item.id !== delivered.id), delivered] } } : previous);
      pendingChatMessages.current.delete(key);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось отправить сообщение'); throw error; }
  };
  const studentParticipation = useMemo(() => enrollments.filter(item => item.studentId === 'sasha').map(item => item.eventId), [enrollments]);
  const applicationEvent = events.find(event => event.id === applicationEventId);
  const applicant = schoolView?.students.find(student => student.id === 'sasha');
  const requestApplication = (event: Opportunity) => { if (isPast(event) || studentParticipation.includes(event.id)) return; setSelected(null); setMutationError(''); setApplicationEventId(event.id); };
  const submitApplication = async (answers: ApplicationAnswers) => {
    if (busy || !applicationEvent || !applicant || isPast(applicationEvent) || !validApplication(applicationFields(applicationEvent), answers, applicant)) return;
    const application = { profile: { name: applicant.name, birthYear: applicant.birthYear, institution: applicant.institution }, fields: applicationFields(applicationEvent).map(field => ({ ...field })), answers: Object.fromEntries(applicationFields(applicationEvent).map(field => [field.id, typeof answers[field.id] === 'string' ? String(answers[field.id]).trim() : answers[field.id]])) };
    const enrollment: Enrollment = { id: crypto.randomUUID(), studentId: applicant.id, eventId: applicationEvent.id, registeredAt: new Date().toISOString(), application };
    setBusy(true); setMutationError('');
    try {
      const result = await save('/enrollments', 'POST', { id: enrollment.id, studentId: applicant.id, eventId: applicationEvent.id, answers: application.answers }, enrollment);
      setDataset(previous => previous ? { ...previous, school: { ...previous.school, enrollments: [...previous.school.enrollments.filter(item => !(item.studentId === result.value.studentId && item.eventId === result.value.eventId)), result.value] } } : previous);
      setApplicationEventId(null); setToast(savedMessage('Заявка отправлена. Событие добавлено в твой календарь', result.local));
    } catch (error) { setMutationError(error instanceof Error ? error.message : 'Не удалось отправить заявку'); }
    finally { setBusy(false); }
  };
  const updateInterests = async (interests: string[]) => {
    if (!dataset) return;
    const result = await save('/profile/interests', 'PATCH', { interests }, { ...dataset.profile, interests });
    setDataset(previous => previous ? { ...previous, profile: result.value } : previous);
    if (result.local) setToast(savedMessage('Интересы обновлены', true));
  };
  const readNotices = async () => {
    try {
      const result = await save('/notifications/read', 'PATCH', { read: true }, { read: true });
      setDataset(previous => previous ? { ...previous, noticesRead: result.value.read } : previous);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось обновить уведомления'); }
  };
  const updatePhoto = async (photo: string | null) => {
    if (!photoTarget) return;
    const target = photoTarget;
    const result = await save(`/photos/${target.role}/${encodeURIComponent(target.id)}`, 'PATCH', { photo }, { photo });
    setDataset(previous => previous ? { ...previous,
      profile: target.role === 'student' && target.id === 'sasha' ? { ...previous.profile, photo: result.value.photo } : previous.profile,
      school: { ...previous.school,
        students: previous.school.students.map(item => target.role === 'student' && item.id === target.id ? { ...item, photo: result.value.photo } : item),
        teachers: previous.school.teachers.map(item => target.role === 'teacher' && item.id === target.id ? { ...item, photo: result.value.photo } : item),
        organizations: previous.school.organizations.map(item => target.role === 'organization' && item.id === target.id ? { ...item, photo: result.value.photo } : item),
      },
    } : previous);
    setToast(savedMessage(photo ? 'Фото обновлено' : 'Фото удалено', result.local));
  };
  const publicEvents = events.filter(event => !isPast(event) && `${event.title} ${event.venue}`.toLowerCase().includes(guestQuery.toLowerCase()));

  if (error) return <div className="loading-screen"><h1>Не удалось загрузить макет</h1><button className="button primary" onClick={() => location.reload()}>Повторить</button></div>;
  if (!schoolView || !dataset) return <div className="loading-screen" role="status"><p>Загрузка…</p></div>;
  const staffPhotoTarget: PhotoTarget = role === 'teacher'
    ? { role: 'teacher', id: schoolView.teacher.id, name: schoolView.teacher.name, initials: schoolView.teacher.name.split(' ').slice(0, 2).map(part => part[0]).join(''), photo: schoolView.teacher.photo }
    : { role: 'organization', id: schoolView.organization.id, name: schoolView.organization.name, initials: schoolView.organization.name === 'ЭФ БГУ' ? 'ЭФ' : 'НБ', photo: schoolView.organization.photo };
  return <div className="role-app">
    {role === 'student' ? <div className="student-area"><StudentApp onLogout={logout} navigationRequest={studentNavigation} onApply={requestApplication} school={schoolView} enrollments={enrollments} sharedEvents={events} participationIds={studentParticipation} onParticipationChange={syncStudentParticipation} profile={dataset.profile} onEditPhoto={() => setPhotoTarget({ role: 'student', id: 'sasha', name: dataset.profile.fullName, initials: dataset.profile.initials, photo: dataset.profile.photo })} notices={dataset.notices} noticesRead={dataset.noticesRead} onInterestsChange={updateInterests} onReadNotices={readNotices} messagesView={<StudentInbox messages={messages} events={events} teachers={schoolView.teachers} onSend={(teacherId, text) => sendMessage('sasha', text, 'student', teacherId)} onOpenEvent={setSelected} />} /></div> : <>
      {role === 'teacher' ? <TeacherHeader page={teacherPage} teacher={schoolView.teacher} onNavigate={navigateTeacher} /> : <header className="site-header role-header"><Logo onClick={() => { if (role === 'guest') { setGuestPage('landing'); window.scrollTo(0, 0); } else window.scrollTo({ top: 0, behavior: 'smooth' }); }} />{role === 'guest' ? <><nav className="guest-nav" aria-label="Навигация гостя"><button onClick={() => { setGuestPage('landing'); window.scrollTo(0, 0); }}>О платформе</button><button onClick={() => { setGuestPage('catalog'); window.scrollTo(0, 0); }}>Найти события</button></nav><div className="role-header-actions"><button className="button primary guest-register" onClick={() => openLogin()}>Вход<ArrowRight size={20} /></button><ThemeSelector /></div></> : <><span className="workspace-role-label">Кабинет организации</span><div className="role-header-actions"><button className="account-button staff-account" aria-label="Изменить фото профиля" onClick={() => setPhotoTarget(staffPhotoTarget)}><Avatar className="header-avatar" photo={staffPhotoTarget.photo} initials={staffPhotoTarget.initials} /></button><ThemeSelector /></div></>}</header>}
      {role === 'guest' ? guestPage === 'landing' ? <Landing events={publicEvents} onOpenEvent={setSelected} onLogin={() => openLogin()} onExplore={() => { setGuestPage('catalog'); window.scrollTo(0, 0); }} /> : <main className="guest-catalog"><div className="page-intro"><h1><span>Найти события</span></h1></div><div className="search-field guest-search"><input aria-label="Поиск активностей" placeholder="Название или площадка" value={guestQuery} onChange={event => setGuestQuery(event.target.value)} /></div><div className="profile-events-grid">{publicEvents.map(event => <EventCard key={event.id} event={event} joined={false} onToggle={() => openLogin(event.id)} onSelect={setSelected} action={{ label: 'Участвовать', onClick: () => openLogin(event.id) }} />)}</div>{!publicEvents.length && <div className="empty-state"><p>События не найдены.</p></div>}</main> : <RoleWorkspace key={`${role}-${activeOrganizationId}`} role={role} onLogout={logout} events={events} school={schoolView} enrollments={enrollments} messages={messages} onEditPhoto={() => setPhotoTarget(staffPhotoTarget)} recommendationRequest={teacherRecommendation} teacherPage={teacherPage} onTeacherPageChange={navigateTeacher} onOrganizationChange={setActiveOrganizationId} onPublish={() => { setMutationError(''); setPublishing(true); }} onSendMessage={(studentId, text, eventId) => sendMessage(studentId, text, 'teacher', schoolView.teacher.id, eventId)} onOpenEvent={setSelected} />}
    </>}
    {photoTarget && <PhotoEditor key={`${photoTarget.role}-${photoTarget.id}`} name={photoTarget.name} photo={photoTarget.photo} initials={photoTarget.initials} onClose={() => setPhotoTarget(null)} onSave={updatePhoto} />}
    <MikiHelper key={role} role={role} school={schoolView} enrollments={enrollments} onInvite={(student, event) => setTeacherRecommendation(previous => ({ id: (previous?.id ?? 0) + 1, studentId: student.id, eventId: event.id }))} onOpenStudent={student => setTeacherRecommendation(previous => ({ id: (previous?.id ?? 0) + 1, studentId: student.id }))} events={events} interests={dataset.profile.interests} joined={studentParticipation} organizationId={schoolView.organization.id} onOpenEvent={setSelected} onAction={action => {
      if (action === 'register') openLogin();
      else if (action === 'publish') { setMutationError(''); setPublishing(true); }
      else if (role === 'student') setStudentNavigation(previous => ({ page: action, id: (previous?.id ?? 0) + 1 }));
      else if (role === 'guest') { setGuestPage('catalog'); window.scrollTo(0, 0); }
    }} />
    {loginOpen && <LoginDialog student={dataset.profile} teacher={schoolView.teacher} organization={schoolView.organization} onLogin={login} onClose={() => { setLoginOpen(false); setPendingEventId(null); }} />}
    {role === 'student' && applicationEvent && applicant && <DemoModal title="Заявка на участие" wide onClose={() => setApplicationEventId(null)}><EventApplicationForm key={applicationEvent.id} event={applicationEvent} student={applicant} submitting={busy} errorMessage={mutationError} onSubmit={submitApplication} /></DemoModal>}
    {publishing && role !== 'guest' && role !== 'student' && <DemoModal title="Объявить активность" wide onClose={() => setPublishing(false)}><PublicationForm organizationId={role === 'teacher' ? schoolView.id : schoolView.organization.id} region={schoolView.region} country={schoolView.country} organizer={role === 'teacher' ? schoolView.school : schoolView.organization.name} ownerId={role === 'teacher' ? schoolView.teacher.id : schoolView.organization.id} authorRole={role} submitting={busy} errorMessage={mutationError} onPublish={publish} /></DemoModal>}
    {selected && <DemoModal title="Об активности" wide onClose={() => setSelected(null)}><img className="public-detail-image" src={selected.image} alt="" /><div className="public-detail"><p>{selected.organizer}</p><h2>{selected.title}</h2><div className="public-event-meta"><span><CalendarDays size={21} />{dateLabel(selected.date)} · {selected.time}</span><span><MapPin size={21} />{selected.venue}</span></div><p>{selected.description}</p><h3>Программа</h3><p>{selected.details}</p>{isPast(selected) && <EventPeople event={selected} school={schoolView} enrollments={enrollments} />}{role === 'student' && !isPast(selected) && <button className={`button full-width ${studentParticipation.includes(selected.id) ? 'joined-button' : 'primary'}`} aria-pressed={studentParticipation.includes(selected.id)} onClick={() => studentParticipation.includes(selected.id) ? syncStudentParticipation(studentParticipation.filter(id => id !== selected.id)) : requestApplication(selected)}>{studentParticipation.includes(selected.id) ? 'Участвую · отменить' : 'Участвовать'}</button>}{role === 'guest' && !isPast(selected) && <button className="button primary full-width" onClick={() => { setSelected(null); openLogin(selected.id); }}>Войти и участвовать</button>}</div></DemoModal>}
    {toast && <div className="toast" role="status"><span><Check size={17} /></span>{toast}<button aria-label="Закрыть сообщение" onClick={() => setToast('')}><X size={20} /></button></div>}
  </div>;
}
