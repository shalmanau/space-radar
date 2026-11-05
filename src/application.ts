import type { ApplicationField, Opportunity } from './types';
import { TODAY } from './types';
import type { SchoolStudent } from './roleTypes';
export type ApplicationAnswers = Record<string, string | boolean>;
export function defaultApplicationFields(type: string): ApplicationField[] {
  if (type === 'Хакатон') return [{ id: 'motivation', label: 'Почему ты хочешь участвовать в хакатоне?', type: 'textarea', minLength: 60, maxLength: 1500 }];
  if (type === 'Олимпиада' || type === 'Акция') return [];
  if (type === 'Конкурс') return [{ id: 'idea', label: 'Кратко опиши идею своего проекта', type: 'textarea', minLength: 30, maxLength: 1500 }];
  return [{ id: 'expectations', label: 'Что ты хочешь узнать на мероприятии?', type: 'textarea', minLength: 20, maxLength: 1000 }];
}
export const applicationFields = (event: Opportunity) => event.applicationFields ?? defaultApplicationFields(event.type);
export function validApplication(fields: ApplicationField[], answers: ApplicationAnswers, student: SchoolStudent): boolean {
  if (!student.name.trim() || !student.institution.trim() || !Number.isInteger(student.birthYear) || student.birthYear < 1900 || student.birthYear > Number(TODAY.slice(0, 4))) return false;
  return fields.every(field => {
    const value = answers[field.id];
    if (field.type === 'checkbox') return value === true;
    if (typeof value !== 'string' || !value.trim()) return false;
    if (field.type === 'select') return Boolean(field.options?.includes(value));
    return value.trim().length >= (field.minLength ?? 1) && value.length <= (field.maxLength ?? 1500);
  });
}
