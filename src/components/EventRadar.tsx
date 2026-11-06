import type { KeyboardEvent } from 'react';
import type { Opportunity } from '../types';

type Props = { events: Opportunity[]; onSelect: (event: Opportunity) => void; activeId?: string };

function pointFor(event: Opportunity, index: number, total: number) {
  let seed = 0;
  for (const char of event.id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const angle = ((seed % 360) + index * 137.5) % 360;
  const radius = 23 + ((seed >>> 8) % 112);
  const radians = (angle - 90) * Math.PI / 180;
  const scaledRadius = Math.min(radius, 142 - Math.min(total, 30) * .28);
  return { x: 160 + Math.cos(radians) * scaledRadius, y: 160 + Math.sin(radians) * scaledRadius };
}

export default function EventRadar({ events, onSelect, activeId }: Props) {
  const markers = events.slice(0, 48);
  const activateWithKey = (event: KeyboardEvent<SVGGElement>, opportunity: Opportunity) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(opportunity); }
  };

  return <section className="event-radar" aria-label="Радар событий">
    <div className="event-radar-heading"><h2>Радар событий</h2><span aria-label={`${events.length} событий`}>{events.length}</span></div>
    <svg viewBox="0 0 320 320" role="group" aria-label={`На радаре ${events.length} событий`}>
      <defs>
        <radialGradient id="radarGlow"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".12" /><stop offset="100%" stopColor="var(--surface)" stopOpacity="0" /></radialGradient>
        <linearGradient id="radarSweep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
      </defs>
      <circle cx="160" cy="160" r="151" fill="url(#radarGlow)" />
      {[32, 66, 100, 134].map(radius => <circle key={radius} className="radar-ring" cx="160" cy="160" r={radius} fill="none" />)}
      <path className="radar-crosshair" d="M 10 160 H 310 M 160 10 V 310 M 54 54 L 266 266 M 54 266 L 266 54" />
      <g className="radar-sweep"><path d="M160 160 L160 26 A134 134 0 0 1 252 63 Z" fill="url(#radarSweep)" /><line x1="160" y1="160" x2="160" y2="26" /></g>
      <circle className="radar-origin" cx="160" cy="160" r="4" />
      {markers.map((opportunity, index) => {
        const point = pointFor(opportunity, index, markers.length);
        const active = activeId === opportunity.id;
        return <g key={opportunity.id} className={`radar-marker${active ? ' active selected' : ''}`} role="button" tabIndex={0} aria-pressed={active} aria-label={`${opportunity.title}, ${opportunity.date}`} onClick={() => onSelect(opportunity)} onKeyDown={event => activateWithKey(event, opportunity)}>
          <title>{opportunity.title}</title><circle cx={point.x} cy={point.y} r="18" fill="transparent" />
          <circle className="radar-marker-halo" cx={point.x} cy={point.y} r="10" />
          <circle className="radar-marker-dot" cx={point.x} cy={point.y} r="4.5" />
        </g>;
      })}
    </svg>
    <p>{events.length ? 'Нажми на сигнал, чтобы открыть событие.' : 'Нет событий по выбранным фильтрам.'}</p>
  </section>;
}
