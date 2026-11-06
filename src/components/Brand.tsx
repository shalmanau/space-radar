import './brand.css';

/** Supplied PNG artwork, framed to its visible bounds without changing the files. */
export default function Brand({ onClick }: { onClick: () => void }) {
  return <button className="brand radar-brand" onClick={onClick} aria-label="radar Space — на главную">
    <svg className="radar-brand-star" viewBox="225 78 839 1077" aria-hidden="true"><image href="/images/brand/star.png" width="1254" height="1254" /></svg>
    <span className="radar-brand-name" aria-hidden="true">
      <svg className="radar-wordmark radar-wordmark-light" viewBox="326 141 1109 553"><image href="/images/brand/wordmark-dark.png" width="1774" height="887" /></svg>
      <svg className="radar-wordmark radar-wordmark-dark" viewBox="280 150 1209 580"><image href="/images/brand/wordmark-mint.png" width="1774" height="887" /></svg>
    </span>
  </button>;
}
