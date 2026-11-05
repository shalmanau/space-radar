import './landing.css';

type Role = 'teacher' | 'organization';
type Props = {
  onRegister: () => void;
  onExplore: () => void;
  onChooseRole: (role: Role) => void;
};

const upcoming = [
  { date: '8 ноября', type: 'Экология · акция', title: 'Экологическая волонтёрская акция' },
  { date: '14 ноября', type: 'Творчество · мастер-класс', title: 'Школа новых медиа' },
  { date: '21 ноября', type: 'Технологии · хакатон', title: 'Хакатон для школьников' },
];

export default function Landing({ onRegister, onExplore, onChooseRole }: Props) {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">Для школьников, учителей и организаторов</p>
          <h1 id="landing-title">Внеклассные активности. <span>В одном месте.</span></h1>
          <p className="landing-lead">Находи олимпиады, мастер-классы, волонтёрские акции и проекты. Выбирай по интересам, формату и дате.</p>
          <div className="landing-hero-actions">
            <button className="landing-button landing-button-dark" onClick={onRegister}>Создать профиль</button>
            <button className="landing-button landing-button-outline" onClick={onExplore}>Посмотреть события</button>
          </div>
        </div>
        <div className="landing-hero-visual">
          <img src="/images/hackathon.jpg" alt="Участники работают над проектом на хакатоне" />
          <div className="landing-image-caption"><span>События по твоим интересам</span><span aria-hidden="true">↗</span></div>
        </div>
      </section>

      <section className="landing-upcoming" aria-labelledby="landing-upcoming-title">
        <div className="landing-section-heading">
          <div><p className="landing-eyebrow">Ближайшие даты</p><h2 id="landing-upcoming-title">Что скоро будет</h2></div>
          <button className="landing-link-button" onClick={onExplore}>Все события <span aria-hidden="true">↗</span></button>
        </div>
        <div className="landing-event-list">
          {upcoming.map((event) => (
            <article className="landing-event" key={event.title}>
              <p className="landing-event-date">{event.date}</p>
              <div><p className="landing-event-type">{event.type}</p><h3>{event.title}</h3></div>
              <span className="landing-event-arrow" aria-hidden="true">↗</span>
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
            <span className="landing-role-number" aria-hidden="true">01</span>
            <h3>Школьникам</h3>
            <p>Подбирай события по интересам, отмечай участие и собирай свои достижения.</p>
            <button className="landing-role-action" onClick={onExplore}>Найти событие <span aria-hidden="true">↗</span></button>
          </article>
          <article className="landing-role-card">
            <span className="landing-role-number" aria-hidden="true">02</span>
            <h3>Учителям</h3>
            <p>Находи олимпиады, проекты и мастер-классы для учеников по теме и формату.</p>
            <button className="landing-role-action" onClick={() => onChooseRole('teacher')}>Продолжить как учитель <span aria-hidden="true">↗</span></button>
          </article>
          <article className="landing-role-card">
            <span className="landing-role-number" aria-hidden="true">03</span>
            <h3>Организациям</h3>
            <p>Рассказывай о мероприятиях и приглашай школьников присоединиться.</p>
            <button className="landing-role-action" onClick={() => onChooseRole('organization')}>Разместить событие <span aria-hidden="true">↗</span></button>
          </article>
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-final-title">
        <div><p className="landing-eyebrow">Демо-регистрация</p><h2 id="landing-final-title">Создай профиль</h2></div>
        <button className="landing-button landing-button-dark" onClick={onRegister}>Создать профиль <span aria-hidden="true">↗</span></button>
      </section>
    </main>
  );
}
