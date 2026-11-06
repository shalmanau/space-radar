import './landing.css';
import type { Opportunity } from '../types';
import { dateLabel } from '../types';

type Role = 'teacher' | 'organization';
type Props = {
  events: Opportunity[];
  onRegister: () => void;
  onExplore: () => void;
  onOpenEvent: (event: Opportunity) => void;
  onChooseRole: (role: Role) => void;
};

export default function Landing({ events, onRegister, onExplore, onOpenEvent, onChooseRole }: Props) {
  const upcoming = events.slice(0, 3);
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <h1 id="landing-title">Внеклассные активности. <span>В одном месте.</span></h1>
          <p className="landing-lead">Олимпиады, мастер-классы и проекты для школьников Беларуси.</p>
          <div className="landing-hero-actions">
            <button className="landing-button landing-button-dark" onClick={onRegister}>Создать профиль</button>
            <button className="landing-button landing-button-outline" onClick={onExplore}>Посмотреть события</button>
          </div>
        </div>
        <div className="landing-hero-visual">
          <img src="/images/miki/peace.webp" alt="Микки — мятный инопланетянин с жестом мира" width="1280" height="1280" fetchPriority="high" />
        </div>
      </section>

      <section className="landing-upcoming" aria-labelledby="landing-upcoming-title">
        <div className="landing-section-heading">
          <div><h2 id="landing-upcoming-title">Что скоро будет</h2></div>
          <button className="landing-link-button" onClick={onExplore}>Все события <span aria-hidden="true">↗</span></button>
        </div>
        <div className="landing-event-list">
          {upcoming.map((event) => (
            <article className="landing-event" key={event.id}>
              <p className="landing-event-date">{dateLabel(event.date)}</p>
              <div><h3>{event.title}</h3></div>
              <button type="button" className="landing-event-arrow" aria-label={`Подробнее: ${event.title}`} onClick={() => onOpenEvent(event)}><span aria-hidden="true">↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-roles" aria-labelledby="landing-roles-title">
        <div className="landing-section-heading landing-roles-heading">
          <div><h2 id="landing-roles-title">Для разных задач</h2></div>
        </div>
        <div className="landing-role-grid">
          <article className="landing-role-card">
            <h3>Школьникам</h3>
            <p>Подбирай события по интересам, отмечай участие и собирай свои достижения.</p>
            <button className="landing-role-action" onClick={onExplore}>Найти событие <span aria-hidden="true">↗</span></button>
          </article>
          <article className="landing-role-card">
            <h3>Учителям</h3>
            <p>Находи олимпиады, проекты и мастер-классы для учеников по теме и формату.</p>
            <button className="landing-role-action" onClick={() => onChooseRole('teacher')}>Продолжить как учитель <span aria-hidden="true">↗</span></button>
          </article>
          <article className="landing-role-card">
            <h3>Организациям</h3>
            <p>Рассказывай о мероприятиях и приглашай школьников присоединиться.</p>
            <button className="landing-role-action" onClick={() => onChooseRole('organization')}>Разместить событие <span aria-hidden="true">↗</span></button>
          </article>
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-final-title">
        <div><h2 id="landing-final-title">Создай профиль</h2></div>
        <button className="landing-button landing-button-dark" onClick={onRegister}>Создать профиль <span aria-hidden="true">↗</span></button>
      </section>
    </main>
  );
}
