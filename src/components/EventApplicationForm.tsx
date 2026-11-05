import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import type { Opportunity } from '../types';
import type { SchoolStudent } from '../roleTypes';
import type { ApplicationAnswers } from '../application';
import { applicationFields, validApplication } from '../application';
export default function EventApplicationForm({ event, student, onSubmit }: { event: Opportunity; student: SchoolStudent; onSubmit: (answers: ApplicationAnswers) => void }) {
  const fields = applicationFields(event);
  const [answers, setAnswers] = useState<ApplicationAnswers>({});
  const valid = validApplication(fields, answers, student);
  const set = (id: string, value: string | boolean) => setAnswers(previous => ({ ...previous, [id]: value }));
  const submit = (formEvent: FormEvent<HTMLFormElement>) => { formEvent.preventDefault(); if (validApplication(fields, answers, student)) onSubmit(answers); };
  return <form className="demo-form event-application-form" onSubmit={submit}><div className="application-event-title"><h3>{event.title}</h3><p>{event.organizer}</p></div><div className="application-identity-note"><LockKeyhole size={18} />Данные из профиля нельзя изменить в заявке</div><label>Имя и фамилия<input value={student.name} readOnly /></label><div className="demo-form-row"><label>Год рождения<input value={student.birthYear} readOnly /></label><label>Учебное заведение<input value={student.institution} readOnly /></label></div>{fields.map(field => field.type === 'checkbox' ? <label key={field.id} className="application-checkbox"><input type="checkbox" required checked={answers[field.id] === true} onChange={e => set(field.id, e.target.checked)} /><span>{field.label}</span></label> : <label key={field.id}>{field.label}{field.type === 'textarea' ? <textarea aria-label={field.label} required value={String(answers[field.id] ?? '')} onChange={e => set(field.id, e.target.value)} minLength={field.minLength ?? 1} maxLength={field.maxLength ?? 1500} rows={4} /> : field.type === 'select' ? <select aria-label={field.label} required value={String(answers[field.id] ?? '')} onChange={e => set(field.id, e.target.value)}><option value="">Выбери вариант</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input aria-label={field.label} required value={String(answers[field.id] ?? '')} onChange={e => set(field.id, e.target.value)} minLength={field.minLength ?? 1} maxLength={field.maxLength ?? 500} />}{field.type === 'textarea' && <span className="application-field-hint">{String(answers[field.id] ?? '').trim().length} / минимум {field.minLength ?? 1} символов</span>}</label>)}<button className="button primary full-width" disabled={!valid} type="submit">Отправить заявку<ArrowRight size={20} /></button></form>;
}
