import InterestPicker from './components/InterestPicker';
import { matchesInterests } from './interests';
import FilterSelect from './components/FilterSelect';
import StudentProfileOverview from './components/StudentProfileOverview';
import EventDiscovery from './components/EventDiscovery';
import ThemeSelector from './components/ThemeSelector';
import StudentPath from './components/StudentPath';
import OrbitMark from './components/OrbitMark';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, CalendarDays, Check, CheckCheck, CircleHelp, Clock3, Compass, MapPin, Menu, Monitor, Search, SlidersHorizontal, Trophy, UserRound, Users, X } from 'lucide-react';
import Avatar, { EditAvatar } from './components/Avatar';
import TelegramPanel from './components/TelegramPanel';
import EventPeople from './components/EventPeople';
import type { SchoolData, Enrollment } from './roleTypes';
import EventCalendar from './components/EventCalendar';
import './components/finder.css';
import type { Notice, Opportunity, Profile } from './types';
import { dateLabel, happensOn, isPast, TODAY } from './types';

type Page = 'catalog' | 'profile' | 'achievements' | 'messages';
const nav = [{ id: 'catalog' as Page, label: 'Найти события', icon: Compass }, { id: 'profile' as Page, label: 'Профиль', icon: UserRound }, { id: 'achievements' as Page, label: 'Мой путь', icon: Trophy }, { id: 'messages' as Page, label: 'Сообщения', icon: UserRound }];
function dateMonth(date: string) { return new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1); }
function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current!.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }} aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={21} /></button></div>{children}</dialog>;
}

type Props = { navigationRequest?: { page: Page; id: number }; onApply: (event: Opportunity) => void; school: SchoolData; enrollments: Enrollment[]; sharedEvents: Opportunity[]; participationIds: string[]; onParticipationChange: (ids: string[]) => void; messagesView: ReactNode; profile: Profile; onEditPhoto: () => void; notices: Notice[]; noticesRead: boolean; onInterestsChange: (interests: string[]) => Promise<void>; onReadNotices: () => Promise<void> };
export default function StudentApp({ navigationRequest, onApply, school, enrollments, sharedEvents, participationIds, onParticipationChange, messagesView, profile, onEditPhoto, notices, noticesRead, onInterestsChange, onReadNotices }: Props) {
  const data = sharedEvents;
  const interests = profile.interests;
  const [savingInterests, setSavingInterests] = useState(false);
  const [page, setPage] = useState<Page>('catalog');
  const [scope, setScope] = useState<'organization' | 'region' | 'country'>('organization');
  const [finderInterests, setFinderInterests] = useState<string[]>([...profile.interests]);
  useEffect(() => setFinderInterests([...profile.interests]), [profile.interests]);
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('Любой формат');
  const [venue, setVenue] = useState('Все площадки');
  const [period, setPeriod] = useState('upcoming');
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const joined = participationIds;
  const [help, setHelp] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [catalogMonth, setCatalogMonth] = useState(dateMonth(TODAY));
  const [catalogDate, setCatalogDate] = useState<string | null>(null);
  const calendarAnchor = useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!calendarOpen) return;
    const dismiss = (event: PointerEvent) => { if (!calendarAnchor.current?.contains(event.target as Node)) setCalendarOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCalendarOpen(false); };
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [calendarOpen]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 3200); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNotificationsOpen(false); setMobileNav(false); } }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, []);
  const navigate = (next: Page) => { setPage(next); setMobileNav(false); setNotificationsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { if (navigationRequest) navigate(navigationRequest.page); }, [navigationRequest]);
  const toggleJoined = (id: string) => {
    if (joined.includes(id)) { onParticipationChange(joined.filter(value => value !== id)); }
    else { const event = data.find(item => item.id === id); if (event) { setSelected(null); onApply(event); } }
  };
  const changeInterests = async (values: string[]) => {
    if (savingInterests) return;
    setSavingInterests(true);
    try { await onInterestsChange(values); }
    catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось обновить интересы'); }
    finally {setSavingInterests(false);}
  };
  const resetFilters = () => { setQuery(''); setScope('organization'); setFinderInterests([...profile.interests]); setFormat('Любой формат'); setVenue('Все площадки'); setPeriod('upcoming'); setCatalogDate(null); setCatalogMonth(dateMonth(TODAY)); };
  const scopedEvents = data.filter(event => scope === 'organization' ? event.organizationId === school.id : scope === 'region' ? event.region === school.region : event.country === school.country);
  const catalogue = scopedEvents.filter(event => matchesInterests(event, finderInterests) && (format === 'Любой формат' || event.format === format) && (venue === 'Все площадки' || event.venue === venue) && (period === 'all' || (period === 'past' ? isPast(event) : !isPast(event))) && `${event.title} ${event.organizer} ${event.venue} ${event.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const firstCatalogDate = catalogue[0]?.date;
  useEffect(() => { if (firstCatalogDate) setCatalogMonth(dateMonth(firstCatalogDate)); }, [firstCatalogDate]);
  const filtered = catalogue.filter(event => !catalogDate || happensOn(event, catalogDate));
  const participation = data.filter(event => joined.includes(event.id)).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const interestSelector = <InterestPicker mode="profile" selected={interests} onChange={values => void changeInterests(values)} />;

  return <div className="app-shell">
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Закрыть меню" />}
    <header className="site-header">
      <button className="brand" onClick={() => navigate('catalog')} aria-label="ВнеКласса — на главную"><span className="brand-mark"><OrbitMark /></span>ВнеКласса</button>
      <nav className={`site-nav ${mobileNav ? 'open' : ''}`} aria-label="Основная навигация">{nav.map(({ id, label }) => <button className={`nav-item ${page === id ? 'active' : ''}`} key={id} onClick={() => navigate(id)} aria-current={page === id ? 'page' : undefined}>{label}</button>)}<div className="nav-utilities"><button className="nav-item" onClick={() => { setMobileNav(false); setHelp(true); }}>Справка</button><button className="nav-item nav-notifications" onClick={() => { setMobileNav(false); setNotificationsOpen(true); }}>Уведомления</button></div></nav>
      <div className="header-actions"><div className="notification-wrap"><button className="notification-button icon-button" aria-label="Уведомления" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={24} />{!noticesRead && <span className="notification-dot" />}</button>{notificationsOpen && <><button className="popover-backdrop" onClick={() => setNotificationsOpen(false)} aria-label="Закрыть уведомления" /><section className="notification-popover"><div className="popover-title"><h3>Уведомления</h3><button className="icon-button" aria-label="Закрыть панель уведомлений" onClick={() => setNotificationsOpen(false)}><X size={23} /></button></div>{notices.map(notice => <div className="notice" key={notice.id}><span className={`notice-dot ${noticesRead ? 'read' : ''}`} /><div><strong>{notice.title}</strong><p>{notice.text}</p><small>{notice.time}</small></div></div>)}<button className="text-button full-width notice-read" aria-label="Отметить все прочитанными" onClick={() => void onReadNotices()}><CheckCheck size={22} />Прочитать всё</button></section></>}</div><button className="icon-button header-help" onClick={() => setHelp(true)} aria-label="Справка"><CircleHelp size={24} /></button><button className="account-button" onClick={() => navigate('profile')} aria-label="Открыть профиль"><Avatar photo={profile.photo} initials={profile.initials} className="header-avatar" /></button><ThemeSelector /><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Открыть меню" aria-expanded={mobileNav}><Menu size={25} /></button></div>
    </header>
    <div className="workspace">
    <main>
      {page === 'messages' && messagesView}
      {page === 'catalog' && <>
        <div className="event-finder">
          <div className="page-intro"><h1><span>Найти события</span></h1></div>
          <div className="discovery-filters">
            <div className="discovery-filter-row">
              <label className="discovery-search"><Search size={22}/><input aria-label="Поиск событий" placeholder="Событие или организатор" value={query} onChange={e => { setQuery(e.target.value); setCatalogDate(null); }}/></label>
              <FilterSelect label="Область" ariaLabel="Область событий" value={scope} options={[{value:'organization',label:school.school},{value:'region',label:`Мой регион · ${school.region}`},{value:'country',label:'Вся страна'}]} onChange={value => {setScope(value as typeof scope);setVenue('Все площадки');setCatalogDate(null);}}/>
              <FilterSelect label="Формат" value={format} options={['Любой формат','Онлайн','Очно'].map(value => ({value,label:value}))} onChange={value => {setFormat(value);setCatalogDate(null);}}/>
              <FilterSelect label="Период" ariaLabel="Период событий" value={period} options={[{value:'upcoming',label:'Предстоящие'},{value:'past',label:'Прошедшие'},{value:'all',label:'Все события'}]} onChange={value => {setPeriod(value);setCatalogDate(null);}}/>

            </div>
            <div className="discovery-interest-row"><InterestPicker mode="filter" selected={finderInterests} onChange={values => {setFinderInterests(values);setCatalogDate(null);}} /><button className="text-button" onClick={resetFilters}>Сбросить</button><div className="discovery-calendar-anchor" ref={calendarAnchor}><button className="text-button" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(!calendarOpen)}><CalendarDays size={20}/>{catalogDate ? dateLabel(catalogDate) : 'Календарь'}</button>{calendarOpen && <div className="discovery-calendar" role="dialog" aria-label="Выбор даты"><EventCalendar label="Календарь событий" events={catalogue} month={catalogMonth} onMonthChange={setCatalogMonth} selectedDate={catalogDate} onSelectDate={value => {setCatalogDate(value);setCalendarOpen(false);}} compact />{catalogDate && <button className="text-button full-width" onClick={() => {setCatalogDate(null);setCalendarOpen(false);}}>Все даты</button>}</div>}</div></div>
          </div>
          <EventDiscovery events={filtered} interests={interests} joined={joined} onOpenEvent={setSelected} onToggle={toggleJoined}/>

        </div>
      </>}
      {page === 'profile' && <>
        <div className="page-intro"><h1><span>Профиль</span></h1></div>
        <section className="portfolio-profile"><EditAvatar photo={profile.photo} initials={profile.initials} name={profile.fullName} onClick={onEditPhoto} /><div className="profile-identity"><h2>{profile.fullName}</h2><p>{profile.school} · {school.region} · {profile.grade} класс</p></div><TelegramPanel compact /><button className="button secondary profile-interest-button" onClick={() => setEditingInterests(true)} aria-haspopup="dialog"><SlidersHorizontal size={21} />Мои интересы</button></section>
        <StudentProfileOverview events={data} participation={participation} school={school} profile={profile} onOpenEvent={setSelected} onFindEvents={() => navigate('catalog')} onEditInterests={() => setEditingInterests(true)} />

      </>}
      {page === 'achievements' && <StudentPath events={participation} results={school.eventResults} profile={profile} onOpenEvent={setSelected} onFindEvents={() => navigate('catalog')} />}
    </main></div>
    {selected && <Modal title="О событии" wide onClose={() => setSelected(null)}><div className="detail-cover"><img src={selected.image} alt="" /><span className="image-badge">{selected.type}</span></div><div className="detail-content"><div className="detail-overline">{selected.organizer}<span>{selected.free ? 'Бесплатно' : 'Платно'}</span></div><h2>{selected.title}</h2><div className="detail-meta"><span><CalendarDays size={16} />{dateLabel(selected.date)}{selected.endDate && ` — ${dateLabel(selected.endDate)}`} · {selected.time}</span><span><Users size={16} />{selected.age}</span></div><div className="detail-venue">{selected.format === 'Онлайн' ? <Monitor size={18} /> : <MapPin size={18} />}<div><strong>{selected.venue}</strong><p>{selected.format === 'Онлайн' ? `Онлайн · ${selected.platform}` : selected.address}</p></div></div><p>{selected.description}</p><h3>Программа</h3><p>{selected.details}</p>{isPast(selected) && <EventPeople event={selected} school={school} enrollments={enrollments} />}<h3>Навыки</h3><div className="detail-skills">{selected.skills.map(skill => <span key={skill}>{skill}</span>)}</div><div className="detail-deadline"><Clock3 size={18} /><strong>{isPast(selected) ? 'Событие завершено' : `Заявки до ${dateLabel(selected.deadline)}`}</strong></div><div className="detail-actions">{isPast(selected) ? <span className="participation-status">{joined.includes(selected.id) ? <><Check size={16} />Участие</> : 'Приём заявок закрыт'}</span> : <button className={`button ${joined.includes(selected.id) ? 'joined-button' : 'primary'}`} aria-pressed={joined.includes(selected.id)} onClick={() => toggleJoined(selected.id)}>{joined.includes(selected.id) ? <><Check size={17} />Участвую · отменить</> : 'Участвовать'}</button>}</div></div></Modal>}

    {editingInterests && <Modal title="Выбор интересов" onClose={() => setEditingInterests(false)}><div className="interest-dialog">{interestSelector}</div><button className="button primary full-width" onClick={() => setEditingInterests(false)}>Готово</button></Modal>}
    {help && <Modal title="Справка" onClose={() => setHelp(false)}><div className="help-step"><h3>Найти события</h3><p>По умолчанию показаны события твоей организации. Переключись на свой регион или всю страну, чтобы увидеть больше. События сгруппированы по месяцам. Внутри месяца сначала идут события по твоим интересам, затем остальные; в каждой группе сохраняется порядок по дате и времени. Интересы можно изменить в профиле кнопкой справа от имени. Общий календарь показывает события каталога независимо от участия.</p></div><div className="help-step"><h3>Профиль</h3><p>Нажми «Участвовать» и заполни заявку. После отправки событие появится в календаре профиля.</p></div><div className="help-step"><h3>Мой путь</h3><p>События с твоим участием идут от старых к новым: сначала прошедшие с результатами, затем предстоящие. Нажми на шаг, чтобы открыть подробности.</p></div></Modal>}
    {toast && <div className="toast" role="status"><span><Check size={16} /></span>{toast}<button aria-label="Закрыть сообщение" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}
