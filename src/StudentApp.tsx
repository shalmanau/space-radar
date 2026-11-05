import StudentPath from './components/StudentPath';
import OrbitMark from './components/OrbitMark';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, CheckCheck, CircleHelp, Clock3, Code2, Compass, FlaskConical, Leaf, Palette, MapPin, Menu, Monitor, Search, SlidersHorizontal, Trophy, UserRound, Users, X } from 'lucide-react';
import EventCard from './components/EventCard';
import Avatar, { EditAvatar } from './components/Avatar';
import TelegramPanel from './components/TelegramPanel';
import EventPeople from './components/EventPeople';
import type { SchoolData, Enrollment } from './roleTypes';
import EventCalendar from './components/EventCalendar';
import type { Notice, Opportunity, Profile } from './types';
import { dateLabel, happensOn, isPast, monthKey, monthLabel, TODAY } from './types';

type Page = 'catalog' | 'profile' | 'achievements' | 'messages';
const nav = [{ id: 'catalog' as Page, label: 'Найти события', icon: Compass }, { id: 'profile' as Page, label: 'Профиль', icon: UserRound }, { id: 'achievements' as Page, label: 'Мой путь', icon: Trophy }, { id: 'messages' as Page, label: 'Сообщения', icon: UserRound }];
const categories = ['Все направления', 'Технологии', 'Творчество', 'Наука', 'Экология'];
const interestIcons = [Code2, Palette, FlaskConical, Leaf];
function dateMonth(date: string) { return new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1); }
function firstParticipationMonth(events: Opportunity[], ids: string[]) { const own = events.filter(event => ids.includes(event.id)).sort((a, b) => a.date.localeCompare(b.date)); return dateMonth(own.find(event => !isPast(event))?.date || own.at(-1)?.date || TODAY); }
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
  const [category, setCategory] = useState(categories[0]);
  const [scope, setScope] = useState<'organization' | 'region' | 'country'>('organization');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('Любой формат');
  const [venue, setVenue] = useState('Все площадки');
  const [period, setPeriod] = useState('upcoming');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const joined = participationIds;
  const [help, setHelp] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [catalogMonth, setCatalogMonth] = useState(dateMonth(TODAY));
  const [profileMonth, setProfileMonth] = useState(firstParticipationMonth(sharedEvents, participationIds));
  const [catalogDate, setCatalogDate] = useState<string | null>(null);
  const [profileDate, setProfileDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 3200); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNotificationsOpen(false); setMobileNav(false); } }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, []);
  const navigate = (next: Page) => { setPage(next); setMobileNav(false); setNotificationsOpen(false); if (next === 'profile') { setProfileDate(null); setProfileMonth(firstParticipationMonth(data, joined)); } window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { if (navigationRequest) navigate(navigationRequest.page); }, [navigationRequest]);
  const toggleJoined = (id: string) => {
    if (joined.includes(id)) { onParticipationChange(joined.filter(value => value !== id)); }
    else { const event = data.find(item => item.id === id); if (event) { setSelected(null); onApply(event); } }
  };
  const toggleInterest = async (value: string) => {
    if (savingInterests) return;
    setSavingInterests(true);
    try { await onInterestsChange(interests.includes(value) ? interests.filter(item => item !== value) : [...interests, value]); }
    catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось обновить интересы'); }
    finally { setSavingInterests(false); }
  };
  const resetFilters = () => { setQuery(''); setCategory(categories[0]); setFormat('Любой формат'); setVenue('Все площадки'); setPeriod('upcoming'); setCatalogDate(null); setCatalogMonth(dateMonth(TODAY)); };
  const scopedEvents = data.filter(event => scope === 'organization' ? event.organizationId === school.id : scope === 'region' ? event.region === school.region : event.country === school.country);
  const catalogue = scopedEvents.filter(event => (category === categories[0] || event.category === category) && (format === 'Любой формат' || event.format === format) && (venue === 'Все площадки' || event.venue === venue) && (period === 'all' || (period === 'past' ? isPast(event) : !isPast(event))) && `${event.title} ${event.organizer} ${event.venue} ${event.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const firstCatalogDate = catalogue[0]?.date;
  useEffect(() => { if (firstCatalogDate) setCatalogMonth(dateMonth(firstCatalogDate)); }, [firstCatalogDate]);
  const filtered = catalogue.filter(event => !catalogDate || happensOn(event, catalogDate));
  const groups = [...new Set(filtered.map(event => event.date.slice(0, 7)))];
  const participation = data.filter(event => joined.includes(event.id)).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const profileEvents = participation.filter(event => profileDate ? happensOn(event, profileDate) : event.date <= `${monthKey(profileMonth)}-31` && (event.endDate || event.date) >= `${monthKey(profileMonth)}-01`);
  const renderCard = (event: Opportunity) => <EventCard key={event.id} event={event} joined={joined.includes(event.id)} onSelect={setSelected} onToggle={toggleJoined} />;

  const interestSelector = <section className="student-interests" aria-label="Мои интересы"><h2>Мои интересы</h2><div className="interest-chips">{categories.slice(1).map((value, index) => { const Icon = interestIcons[index]; const active = interests.includes(value); return <button key={value} className={active ? 'active' : ''} disabled={savingInterests} onClick={() => void toggleInterest(value)} aria-pressed={active}><Icon size={24} aria-hidden="true" /><span>{value}</span><span className="interest-selection" aria-hidden="true">{active && <Check size={17} />}</span></button>; })}</div></section>;

  return <div className="app-shell">
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Закрыть меню" />}
    <header className="site-header">
      <button className="brand" onClick={() => navigate('catalog')} aria-label="ВнеКласса — на главную"><span className="brand-mark"><OrbitMark /></span>ВнеКласса</button>
      <nav className={`site-nav ${mobileNav ? 'open' : ''}`} aria-label="Основная навигация">{nav.map(({ id, label }) => <button className={`nav-item ${page === id ? 'active' : ''}`} key={id} onClick={() => navigate(id)} aria-current={page === id ? 'page' : undefined}>{label}</button>)}<div className="nav-utilities"><button className="nav-item" onClick={() => { setMobileNav(false); setHelp(true); }}>Справка</button><button className="nav-item nav-notifications" onClick={() => { setMobileNav(false); setNotificationsOpen(true); }}>Уведомления</button></div></nav>
      <div className="header-actions"><div className="notification-wrap"><button className="notification-button icon-button" aria-label="Уведомления" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={24} />{!noticesRead && <span className="notification-dot" />}</button>{notificationsOpen && <><button className="popover-backdrop" onClick={() => setNotificationsOpen(false)} aria-label="Закрыть уведомления" /><section className="notification-popover"><div className="popover-title"><h3>Уведомления</h3><button className="icon-button" aria-label="Закрыть панель уведомлений" onClick={() => setNotificationsOpen(false)}><X size={23} /></button></div>{notices.map(notice => <div className="notice" key={notice.id}><span className={`notice-dot ${noticesRead ? 'read' : ''}`} /><div><strong>{notice.title}</strong><p>{notice.text}</p><small>{notice.time}</small></div></div>)}<button className="text-button full-width notice-read" aria-label="Отметить все прочитанными" onClick={() => void onReadNotices()}><CheckCheck size={22} />Прочитать всё</button></section></>}</div><button className="icon-button header-help" onClick={() => setHelp(true)} aria-label="Справка"><CircleHelp size={24} /></button><button className="account-button" onClick={() => navigate('profile')} aria-label="Открыть профиль"><Avatar photo={profile.photo} initials={profile.initials} className="header-avatar" /></button><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Открыть меню" aria-expanded={mobileNav}><Menu size={25} /></button></div>
    </header>
    <div className="workspace">
    <main>
      {page === 'messages' && messagesView}
      {page === 'catalog' && <>
        <div className="page-intro"><h1><span>Найти события</span></h1><button className="button secondary mobile-calendar-toggle" onClick={() => setCalendarOpen(!calendarOpen)} aria-expanded={calendarOpen}><CalendarDays size={22} />Календарь</button></div>
        <div className="catalog-scope" role="group" aria-label="Масштаб событий">{[{ id: 'organization' as const, label: 'Моя организация', context: school.school }, { id: 'region' as const, label: 'Мой регион', context: school.region }, { id: 'country' as const, label: 'Вся страна', context: school.country }].map(item => <button key={item.id} className={scope === item.id ? 'active' : ''} aria-pressed={scope === item.id} onClick={() => { setScope(item.id); setCatalogDate(null); setVenue('Все площадки'); }}><strong>{item.label}</strong><span>{item.context}</span></button>)}</div>
        <div className="catalog-toolbar"><div className="search-field"><Search size={24} /><input placeholder="Поиск событий" aria-label="Поиск событий" value={query} onChange={e => { setQuery(e.target.value); setCatalogDate(null); }} />{query && <button className="icon-button mini" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={16} /></button>}</div><button className={`button secondary ${filtersOpen ? 'selected' : ''}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={22} />Фильтры</button></div>
        {filtersOpen && <div className="filter-panel"><label>Направление<select aria-label="Направление" value={category} onChange={event => { setCategory(event.target.value); setCatalogDate(null); }}>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Формат<select aria-label="Формат" value={format} onChange={e => { setFormat(e.target.value); setCatalogDate(null); }}><option>Любой формат</option><option>Онлайн</option><option>Очно</option></select></label><label>Площадка<select aria-label="Площадка" value={venue} onChange={e => { setVenue(e.target.value); setCatalogDate(null); }}><option>Все площадки</option>{[...new Set(scopedEvents.map(event => event.venue))].sort().map(value => <option key={value}>{value}</option>)}</select></label><label>Период<select aria-label="Период" value={period} onChange={e => { setPeriod(e.target.value); setCatalogDate(null); }}><option value="upcoming">Предстоящие</option><option value="past">Прошедшие</option><option value="all">Все события</option></select></label><button className="text-button" onClick={resetFilters}>Сбросить</button></div>}

        <div className="catalog-layout"><section className="month-groups" aria-label="События по месяцам">{catalogDate && <div className="date-filter"><span>{dateLabel(catalogDate)}</span><button className="text-button" onClick={() => setCatalogDate(null)}>Все даты<X size={13} /></button></div>}{groups.map(key => <section key={key} className="month-section" aria-label={monthLabel(key)}><div className="month-heading"><h2>{monthLabel(key)}</h2></div><div className="catalog-grid">{filtered.filter(event => event.date.startsWith(key)).sort((a, b) => Number(interests.includes(b.category)) - Number(interests.includes(a.category))).map(event => <EventCard key={event.id} event={event} joined={joined.includes(event.id)} onSelect={setSelected} onToggle={toggleJoined} recommended={interests.includes(event.category)} />)}</div></section>)}{!filtered.length && <div className="empty-state"><h3>Событий не найдено</h3><p>{catalogDate ? 'На выбранную дату событий нет.' : 'Измени запрос или фильтры.'}</p><button className="button secondary" onClick={resetFilters}>Сбросить фильтры</button></div>}</section>
          <aside className={`catalog-calendar ${calendarOpen ? 'open' : ''}`}><EventCalendar label="Календарь событий" events={catalogue} month={catalogMonth} onMonthChange={setCatalogMonth} selectedDate={catalogDate} onSelectDate={setCatalogDate} compact /></aside>
        </div>
      </>}
      {page === 'profile' && <>
        <div className="page-intro"><h1><span>Профиль</span></h1></div>
        <section className="portfolio-profile"><EditAvatar photo={profile.photo} initials={profile.initials} name={profile.fullName} onClick={onEditPhoto} /><div className="profile-identity"><h2>{profile.fullName}</h2><p>{profile.school} · {school.region} · {profile.grade} класс</p></div><button className="button secondary profile-interest-button" onClick={() => setEditingInterests(true)} aria-haspopup="dialog"><SlidersHorizontal size={21} />Мои интересы</button></section>
        <TelegramPanel />
        <div className="section-title"><h2>Мои события</h2><button className="text-button" onClick={() => navigate('catalog')}>Найти событие<ArrowRight size={15} /></button></div>
        <div className="profile-calendar-layout"><aside className="profile-calendar"><EventCalendar label="Календарь моих событий" events={participation} month={profileMonth} onMonthChange={setProfileMonth} selectedDate={profileDate} onSelectDate={setProfileDate} compact /></aside><section className="profile-month-events" aria-label="Мои события">{profileDate && <div className="date-filter"><span>{dateLabel(profileDate)}</span><button className="text-button" onClick={() => setProfileDate(null)}>Все даты<X size={13} /></button></div>}
        {profileEvents.length ? <div className="profile-events-grid">{profileEvents.map(renderCard)}</div> : <div className="empty-state"><p>{participation.length ? 'В выбранном периоде нет событий с твоим участием.' : 'Ты пока не участвуешь в событиях.'}</p><button className="button secondary" onClick={() => navigate('catalog')}>Найти события</button></div>}</section></div>
      </>}
      {page === 'achievements' && <StudentPath events={participation} results={school.eventResults} profile={profile} onOpenEvent={setSelected} onFindEvents={() => navigate('catalog')} />}
    </main></div>
    {selected && <Modal title="О событии" wide onClose={() => setSelected(null)}><div className="detail-cover"><img src={selected.image} alt="" /><span className="image-badge">{selected.type}</span></div><div className="detail-content"><div className="detail-overline">{selected.organizer}<span>{selected.free ? 'Бесплатно' : 'Платно'}</span></div><h2>{selected.title}</h2><div className="detail-meta"><span><CalendarDays size={16} />{dateLabel(selected.date)}{selected.endDate && ` — ${dateLabel(selected.endDate)}`} · {selected.time}</span><span><Users size={16} />{selected.age}</span></div><div className="detail-venue">{selected.format === 'Онлайн' ? <Monitor size={18} /> : <MapPin size={18} />}<div><strong>{selected.venue}</strong><p>{selected.format === 'Онлайн' ? `Онлайн · ${selected.platform}` : selected.address}</p></div></div><p>{selected.description}</p><h3>Программа</h3><p>{selected.details}</p>{isPast(selected) && <EventPeople event={selected} school={school} enrollments={enrollments} />}<h3>Навыки</h3><div className="detail-skills">{selected.skills.map(skill => <span key={skill}>{skill}</span>)}</div><div className="detail-deadline"><Clock3 size={18} /><strong>{isPast(selected) ? 'Событие завершено' : `Заявки до ${dateLabel(selected.deadline)}`}</strong></div><div className="detail-actions">{isPast(selected) ? <span className="participation-status">{joined.includes(selected.id) ? <><Check size={16} />Участие</> : 'Приём заявок закрыт'}</span> : <button className={`button ${joined.includes(selected.id) ? 'joined-button' : 'primary'}`} aria-pressed={joined.includes(selected.id)} onClick={() => toggleJoined(selected.id)}>{joined.includes(selected.id) ? <><Check size={17} />Участвую · отменить</> : 'Участвовать'}</button>}</div></div></Modal>}

    {editingInterests && <Modal title="Выбор интересов" onClose={() => setEditingInterests(false)}><div className="interest-dialog">{interestSelector}</div><button className="button primary full-width" onClick={() => setEditingInterests(false)}>Готово</button></Modal>}
    {help && <Modal title="Справка" onClose={() => setHelp(false)}><div className="help-step"><h3>Найти события</h3><p>По умолчанию показаны события твоей организации. Переключись на свой регион или всю страну, чтобы увидеть больше. События сгруппированы по месяцам. Внутри месяца сначала идут события по твоим интересам, затем остальные; в каждой группе сохраняется порядок по дате и времени. Интересы можно изменить в профиле кнопкой справа от имени. Общий календарь показывает события каталога независимо от участия.</p></div><div className="help-step"><h3>Профиль</h3><p>Нажми «Участвовать» и заполни заявку. После отправки событие появится в календаре профиля.</p></div><div className="help-step"><h3>Мой путь</h3><p>События с твоим участием идут от старых к новым: сначала прошедшие с результатами, затем предстоящие. Нажми на шаг, чтобы открыть подробности.</p></div></Modal>}
    {toast && <div className="toast" role="status"><span><Check size={16} /></span>{toast}<button aria-label="Закрыть сообщение" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}
