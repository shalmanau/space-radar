import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import TeacherRecommendations from './TeacherRecommendations';
import type { Enrollment, SchoolData, SchoolStudent, Role } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast, TODAY } from '../types';
import './miki.css';

export type StudentDestination = 'catalog' | 'profile' | 'achievements' | 'messages';
type Action = 'catalog' | 'profile' | 'achievements' | 'register' | 'publish';
type Reply = { id: number; text: string; from: 'miki' | 'user'; event?: Opportunity; action?: Action; label?: string };
type Topic = 'greeting' | 'event' | 'participation' | 'achievements' | 'invite' | 'publish' | 'applications';
type Props = {
  role: Role;
  school: SchoolData;
  enrollments: Enrollment[];
  onInvite: (student: SchoolStudent, event: Opportunity) => void;
  onOpenStudent: (student: SchoolStudent) => void;
  events: Opportunity[];
  interests: string[];
  joined: string[];
  organizationId: string;
  onOpenEvent: (event: Opportunity) => void;
  onAction: (action: Action) => void;
};

// Original greetings from the supplied HTML, with the same character and voice.
const greetings = [
  'Привет, землянин! На радаре появились новые возможности. Исследуем?',
  'А вот и ты! Я уже настроила антенны на твои интересы.',
  'Привет-привет! Хочешь отыскать новую звезду в своей галактике?',
  'В ДЕСЯТЫЙ РАЗ ПРИВЕТ! Ладно, мне тоже нравится с тобой здороваться.',
  'Сканирую вселенную… Нашла! Твой следующий шаг — совсем рядом.',
];
const topics: Record<Role, { id: Topic; label: string }[]> = {
  guest: [{ id: 'event', label: 'Найти событие' }, { id: 'participation', label: 'Как участвовать?' }],
  student: [{ id: 'event', label: 'Подобрать событие' }, { id: 'participation', label: 'Как участвовать?' }, { id: 'achievements', label: 'Мой путь' }],
  teacher: [ { id: 'publish', label: 'Объявить активность' }],
  organization: [{ id: 'publish', label: 'Создать активность' }, { id: 'applications', label: 'Посмотреть анкеты' }, { id: 'event', label: 'Ближайшее событие' }],
};

export default function MikiHelper({ role, school, enrollments, onInvite, onOpenStudent, events, interests, joined, organizationId, onOpenEvent, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Reply[]>([{ id: 0, from: 'miki', text: 'Привет, я Микки! Готова искать для тебя новые звёзды.' }]);
  const [pose, setPose] = useState<'welcome' | 'peace' | 'guide'>('welcome');
  const greetingIndex = useRef(0);
  const recommendationIndex = useRef(0);
  const messageId = useRef(0);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const panelId = useId();

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && role !== 'teacher' && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [open, messages, role]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  };
  const run = (action: Action) => { setOpen(false); onAction(action); };
  const choose = (topic: Topic, label: string) => {
    let response: Omit<Reply, 'id' | 'from'>;
    setPose(topic === 'greeting' ? (greetingIndex.current % 2 ? 'peace' : 'welcome') : 'guide');
    if (topic === 'greeting') {
      response = { text: greetings[greetingIndex.current++ % greetings.length] };
    } else if (topic === 'event') {
      const candidates = events.filter(event => !isPast(event) && event.deadline >= TODAY &&
        (role !== 'student' || !joined.includes(event.id)) && (role !== 'organization' || event.organizationId === organizationId))
        .sort((a, b) => Number(role === 'student' && interests.includes(b.category)) - Number(role === 'student' && interests.includes(a.category)) || `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
      const event = candidates[recommendationIndex.current++ % Math.max(1, candidates.length)];
      response = event ? { text: role === 'student' && interests.includes(event.category) ? 'Есть контакт! Это событие подходит под твои интересы.' : 'Есть контакт! Вот ближайшая возможность на радаре.', event }
        : role === 'organization' ? { text: 'Пока нет предстоящих событий. Давай объявим новое?', action: 'publish', label: 'Создать активность' }
          : role === 'teacher' ? { text: 'Пока нет новых событий с открытой регистрацией. Новые активности появятся в ленте.' }
            : { text: 'Пока нет новых событий с открытой регистрацией. Можно посмотреть весь каталог.', action: 'catalog', label: 'Найти события' };
    } else if (topic === 'participation') {
      response = role === 'guest'
        ? { text: 'Создай профиль, выбери событие и нажми «Участвовать». Заполни анкету организатора — после отправки событие появится в твоём профиле.', action: 'register', label: 'Создать профиль' }
        : { text: 'Нажми «Участвовать» у нужного события и заполни анкету. Имя и учебное заведение уже будут указаны. После отправки событие появится в профиле и личном календаре.', action: 'catalog', label: 'Найти события' };
    } else if (topic === 'achievements') {
      response = { text: 'В разделе «Мой путь» сначала идут прошедшие события с результатами, затем предстоящие с твоим участием. Нажми на шаг, чтобы открыть событие.', action: 'achievements', label: 'Открыть мой путь' };
    } else if (topic === 'invite') {
      response = { text: 'Во вкладке «Классы» выбери ученика и нажми «Предложить событие». Или найди активность в ленте и нажми «Предложить». Приглашение придёт ученику в сообщения.' };
    } else if (topic === 'applications') {
      response = { text: 'Нажми «Участники» у нужного мероприятия. Рядом с каждым учеником есть кнопка «Посмотреть анкету» — там его данные и ответы на вопросы.' };
    } else {
      response = { text: 'Укажи название, место и даты, а затем выбери вопросы для анкеты. После публикации событие появится в каталоге, а заявки — в списке участников.', action: 'publish', label: 'Создать активность' };
    }
    const user: Reply = { id: ++messageId.current, from: 'user', text: label };
    const reply: Reply = { ...response, id: ++messageId.current, from: 'miki' };
    setMessages(previous => [...previous, user, reply].slice(-24));
  };

  return <div className={`miki-widget${role === 'teacher' ? ' is-teacher' : ''}${open ? ' is-open' : ''}`}>
    <button ref={launcher} className="miki-launcher" aria-label={open ? 'Закрыть чат с Микки' : 'Позвать Микки'} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => open ? close() : setOpen(true)}>
      <span className="miki-toggle-art" aria-hidden="true">{open ? <X size={28} /> : <img src="/images/miki/welcome.webp" width="76" height="76" alt="" draggable={false} />}</span>
      <span className="miki-launcher-label">{open ? 'Закрыть чат' : role === 'teacher' ? 'Помощник Микки' : 'Привет, Микки!'}</span>
    </button>
    <section hidden={!open} id={panelId} className="miki-dialog" role="dialog" aria-modal="false" aria-labelledby={headingId} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="miki-heading">
        <img src={`/images/miki/${pose}.webp`} width="78" height="78" alt="Микки — мятный инопланетянин" draggable={false} />
        <h2 id={headingId}>Микки</h2>
        <button ref={closeButton} className="icon-button" onClick={close} aria-label="Скрыть Микки"><X size={24} /></button>
      </header>
      <div ref={history} className="miki-history" role={role === 'teacher' ? undefined : 'log'} aria-label={role === 'teacher' ? 'Подбор рекомендаций ученикам' : 'Переписка с Микки'} aria-live={role === 'teacher' ? undefined : 'polite'} aria-relevant="additions text">
        {role === 'teacher' ? <TeacherRecommendations events={events} school={school} enrollments={enrollments} onInvite={(student, event) => { setOpen(false); onInvite(student, event); }} onOpenStudent={student => { setOpen(false); onOpenStudent(student); }} onOpenEvent={event => { setOpen(false); onOpenEvent(event); }} /> : messages.map(message => <div key={message.id} className={`miki-message ${message.from === 'user' ? 'from-user' : 'from-miki'}`}>
          <p>{message.text}</p>
          {message.event && <div className="miki-event"><h3>{message.event.title}</h3><p>{dateLabel(message.event.date)} · {message.event.venue}</p><button className="button primary" onClick={() => { setOpen(false); onOpenEvent(message.event!); }}>Подробнее<ArrowUpRight size={19} /></button></div>}
          {message.action && <button className="button primary miki-reply-action" onClick={() => run(message.action!)}>{message.label}<ArrowUpRight size={19} /></button>}
        </div>)}
      </div>
      <div className="miki-topics" aria-label="Вопросы Микки">
        {topics[role].map(topic => <button key={topic.id} onClick={() => role === 'teacher' && topic.id === 'publish' ? run('publish') : choose(topic.id, topic.label)}>{topic.label}</button>)}
        {role !== 'teacher' && <button onClick={() => choose('greeting', 'Привет, Микки!')}>Привет, Микки!</button>}
      </div>
    </section>
  </div>;
}
