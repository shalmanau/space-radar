import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import './filterSelect.css';

type FilterSelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export default function FilterSelect({ label, value, options, onChange, ariaLabel }: FilterSelectProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex(option => option.value === value)));
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [open]);

  const focusOption = (index: number) => {
    if (options.length === 0) return;
    const bounded = (index + options.length) % options.length;
    setActiveIndex(bounded);
    optionRefs.current[bounded]?.focus();
  };

  const openAt = (index?: number) => {
    if (!options.length) return;
    const selectedIndex = options.findIndex(option => option.value === value);
    setActiveIndex(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  };

  const choose = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(event.key === 'ArrowDown' ? undefined : Math.max(0, options.findIndex(option => option.value === value)));
      if (event.key === 'ArrowUp' && options.length) setActiveIndex(options.findIndex(option => option.value === value) >= 0 ? options.findIndex(option => option.value === value) : options.length - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      openAt(options.length - 1);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="filter-select" ref={rootRef}>
      <span className="filter-select-label" id={`${id}-label`}>{label}</span>
      <button
        ref={triggerRef}
        className="filter-select-trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : `${id}-label ${id}-value`}
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-haspopup="listbox"
        onClick={() => open ? setOpen(false) : openAt()}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="filter-select-value" id={`${id}-value`}>{selected?.label ?? value}</span>
        <ChevronDown size={20} aria-hidden="true" className={open ? 'is-open' : ''} />
      </button>
      {open && (
        <div
          className="filter-select-popup"
          id={`${id}-listbox`}
          role="listbox"
          aria-label={ariaLabel ?? label}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              ref={node => { optionRefs.current[index] = node; }}
              id={`${id}-option-${index}`}
              className="filter-select-option"
              role="option"
              aria-selected={option.value === value}
              tabIndex={activeIndex === index ? 0 : -1}
              onFocus={() => setActiveIndex(index)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={18} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
