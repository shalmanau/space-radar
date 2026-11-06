import { Atom, Calculator, Check, Code2, Cpu, Dna, FlaskConical, Leaf, ListFilter, Palette } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import './interestPicker.css';

type InterestPickerProps = {
  selected: string[];
  onChange: (values: string[]) => void;
  mode?: 'profile' | 'filter';
};

const groups = [
  {
    title: 'Предметы',
    interests: [
      { value: 'Математика', Icon: Calculator },
      { value: 'Информатика', Icon: Code2 },
      { value: 'Физика', Icon: Atom },
      { value: 'Биология', Icon: Dna },
    ],
  },
  {
    title: 'Направления',
    interests: [
      { value: 'Технологии', Icon: Cpu },
      { value: 'Наука', Icon: FlaskConical },
      { value: 'Творчество', Icon: Palette },
      { value: 'Экология', Icon: Leaf },
    ],
  },
];

export default function InterestPicker({ selected, onChange, mode = 'profile' }: InterestPickerProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const filterMode = mode === 'filter';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  };

  const closeOnTab = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') setOpen(false);
  };

  const countLabel = selected.length ? `${selected.length}` : 'Все направления';

  if (!filterMode) {
    return (
      <div className="interest-picker interest-picker-profile" aria-label="Мои интересы">
        <div className="interest-picker-profile-groups">
          {groups.map(group => (
            <section className="interest-picker-group" key={group.title} aria-label={group.title}>
              <h3>{group.title}</h3>
              <div className="interest-picker-grid" role="group" aria-label={group.title}>
                {group.interests.map(({ value, Icon }) => {
                  const active = selected.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`interest-picker-card${active ? ' is-selected' : ''}`}
                      aria-pressed={active}
                      onClick={() => toggle(value)}
                    >
                      <span className="interest-picker-icon"><Icon size={30} strokeWidth={1.9} aria-hidden="true" /></span>
                      <span className="interest-picker-name">{value}</span>
                      <span className="interest-picker-check" aria-hidden="true">{active && <Check size={18} />}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="interest-picker interest-picker-filter" ref={rootRef} onKeyDown={closeOnTab}>
      <button
        ref={triggerRef}
        type="button"
        className="interest-picker-filter-trigger"
        aria-label={`Интересы: ${countLabel}`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-haspopup="dialog"
        onClick={() => setOpen(value => !value)}
      >
        <ListFilter size={20} aria-hidden="true" />
        <span>Интересы</span>
        <span className={`interest-picker-count${selected.length ? ' has-selection' : ''}`}>
          {selected.length || 'Все'}
        </span>
      </button>
      {open && (
        <div className="interest-picker-popover" id={`${id}-panel`} role="dialog" aria-label="Фильтр по интересам">
          <div className="interest-picker-popover-heading">
            <strong>Интересы</strong>
            <span>{selected.length ? `Выбрано: ${selected.length}` : 'Все направления'}</span>
          </div>
          <div className="interest-picker-options">
            {groups.map(group => (
              <section className="interest-picker-option-group" key={group.title} aria-label={group.title}>
                <h3>{group.title}</h3>
                {group.interests.map(({ value, Icon }) => (
                  <label className="interest-picker-option" key={value}>
                    <input
                      type="checkbox"
                      checked={selected.includes(value)}
                      onChange={() => toggle(value)}
                    />
                    <Icon size={21} aria-hidden="true" />
                    <span>{value}</span>
                  </label>
                ))}
              </section>
            ))}
          </div>
          <div className="interest-picker-popover-footer">
            <button type="button" className="interest-picker-clear" onClick={() => onChange([])}>Все направления</button>
            <button type="button" className="interest-picker-done" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>Готово</button>
          </div>
        </div>
      )}
    </div>
  );
}
