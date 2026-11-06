import type { Opportunity } from './types';

export const interestValues = [
  'Математика',
  'Информатика',
  'Физика',
  'Биология',
  'Технологии',
  'Наука',
  'Творчество',
  'Экология',
] as const;

const broadInterests = new Set<string>(['Технологии', 'Наука', 'Творчество', 'Экология']);
const subjectKeywords: Record<string, string[]> = {
  Математика: ['математ', 'алгебр', 'геометр'],
  Информатика: ['информат', 'хакатон', 'программ', 'данн'],
  Физика: ['физик', 'физич', 'опыт', 'лаборатор'],
  Биология: ['биолог', 'природ', 'экол'],
};

export function matchesInterests(event: Opportunity, interests: string[]): boolean {
  if (!interests.length) return true;
  if (interests.some(interest => broadInterests.has(interest) && event.category === interest)) return true;
  const text = [event.title, event.description, ...(event.skills || [])].join(' ').toLocaleLowerCase('ru');
  return interests.some(interest => subjectKeywords[interest]?.some(keyword => text.includes(keyword)) ?? false);
}
