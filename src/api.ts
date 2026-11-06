import { normalizeSchoolName } from './school';
import { directoryRevision, migrateDirectory } from './directory';
import { interestValues } from './interests';
import type { Notice, Opportunity, Profile } from './types';
import type { DemoAccount, Enrollment, Message, Role, SchoolData } from './roleTypes';
import { hostedApiBaseUrl } from './deployment';

export type AppData = {
  directoryRevision?: number;
  events: Opportunity[];
  school: SchoolData;
  profile: Profile;
  notices: Notice[];
  noticesRead: boolean;
  accounts: Partial<Record<Exclude<Role, 'guest'>, DemoAccount>>;
};
export type Saved<T> = { value: T; local: boolean };
const CACHE_KEY = 'vneklassa-data-v1';
const localApiOrigin = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) || /\.(?:ngrok-free\.(?:app|dev)|ngrok\.(?:app|dev|io))$/i.test(window.location.hostname);
const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD && !localApiOrigin ? hostedApiBaseUrl : '/api')).replace(/\/$/, '');
const ngrokApi = /^https:\/\/[^/]+\.(?:ngrok-free\.(?:app|dev)|ngrok\.(?:app|dev|io))(?:\/|$)/i.test(API_BASE);
let source: 'api' | 'mock' = 'mock';
let loading: Promise<AppData> | undefined;

export class ApiError extends Error {}

function stored<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as T | null; } catch { return null; }
}
function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const data = value as AppData;
  return Array.isArray(data.events) && data.events.every(event => event &&
    ['id', 'title', 'date', 'deadline', 'time', 'organizer', 'venue', 'category', 'type', 'format', 'age', 'image', 'description', 'details'].every(key => typeof event[key as keyof Opportunity] === 'string') && Array.isArray(event.skills))
    && typeof data.school?.id === 'string' && ['teachers', 'organizations', 'students', 'classes', 'enrollments', 'messages', 'eventResults'].every(key => Array.isArray(data.school[key as keyof SchoolData]))
    && data.school.teachers.length > 0 && data.school.teachers.every(person => person && typeof person.id === 'string' && typeof person.name === 'string')
    && data.school.organizations.length > 0 && data.school.organizations.every(item => item && typeof item.id === 'string' && typeof item.name === 'string')
    && data.school.students.some(student => student?.id === 'sasha')
    && typeof data.profile?.fullName === 'string' && typeof data.profile.initials === 'string'
    && Array.isArray(data.profile.interests) && data.profile.interests.every(item => typeof item === 'string')
    && Array.isArray(data.notices) && data.notices.every(item => item && typeof item.title === 'string' && typeof item.text === 'string')
    && typeof data.noticesRead === 'boolean' && Boolean(data.accounts) && typeof data.accounts === 'object' && !Array.isArray(data.accounts);
}
export function cacheData(data: AppData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* State stays usable in memory. */ }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4000);
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (ngrokApi) headers['ngrok-skip-browser-warning'] = '1';
    const response = await fetch(`${API_BASE}${path}`, {
      method, signal: controller.signal, cache: 'no-store',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        const payload = await response.json().catch(() => null);
        throw new ApiError(typeof payload?.detail === 'string' ? payload.detail : 'Проверь заполненные поля. Сервер отклонил запрос.');
      }
      throw new Error('Сервер недоступен');
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  } finally { window.clearTimeout(timeout); }
}

/** Telegram binding requires the actual API; a local mock must never pretend to link a chat. */
export async function requestBackend<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  // Keep probing the real API even if bootstrap used cached data during an outage.
  try { return await request<T>(path, method, body); }
  catch (error) { if (error instanceof ApiError) throw error; throw new Error('Сервер уведомлений недоступен. Повтори подключение.'); }
}

async function mockData(): Promise<AppData> {
  try { localStorage.removeItem('vneklassa-messages-v1'); } catch { /* Storage may be disabled. */ }
  const cached = stored<unknown>(CACHE_KEY);
  if (isAppData(cached)) {
    // Fill only fields missing from older browser caches, preserving saved choices.
    if (cached.school.students.some(student => !Array.isArray(student.interests))) {
      try {
        const response = await fetch('/mock/school.json');
        if (response.ok) {
          const seed = await response.json() as SchoolData;
          cached.school.students = cached.school.students.map(student => ({ ...student, interests: student.id === 'sasha' ? cached.profile.interests : student.interests ?? seed.students.find(item => item.id === student.id)?.interests ?? [] }));
        }
      } catch { /* Cached work remains available without a network. */ }
    }
    return normalizeSchoolName(migrateDirectory(cached));
  }
  const read = async <T,>(name: string): Promise<T> => {
    const response = await fetch(`/mock/${name}.json`);
    if (!response.ok) throw new Error('Не удалось загрузить резервные данные');
    return response.json();
  };
  const [events, school, profile, notices] = await Promise.all([
    read<Opportunity[]>('opportunities'), read<SchoolData>('school'), read<Profile>('profile'), read<Notice[]>('notifications'),
  ]);
  // Preserve work created by the previous browser-only version on its first offline launch.
  const published = stored<Opportunity[]>('vneklassa-published-events-v1');
  if (Array.isArray(published)) events.push(...published.filter(event => event && typeof event.id === 'string' && !events.some(item => item.id === event.id)));
  const enrollments = stored<Enrollment[]>('vneklassa-enrollments-v1');
  if (Array.isArray(enrollments)) school.enrollments = enrollments.filter(item => item && events.some(event => event.id === item.eventId)).map(record => ({ ...record, application: record.application ?? school.enrollments.find(seed => seed.studentId === record.studentId && seed.eventId === record.eventId)?.application }));
  const interests = stored<string[]>('vneklassa-interests');
  if (Array.isArray(interests)) profile.interests = interests.filter(value => (interestValues as readonly string[]).includes(value));
  let result: AppData = { directoryRevision, events, school, profile, notices, noticesRead: stored('vneklassa-notices') === true, accounts: {} };
  const accounts = stored<AppData['accounts']>('vneklassa-demo-accounts-v1');
  for (const role of ['organization'] as const) {
    const account = accounts?.[role];
    if (account && typeof account.name === 'string' && typeof account.email === 'string') result = withAccount(result, { ...account, role });
  }
  return normalizeSchoolName(result);
}

export function loadData(): Promise<AppData> {
  loading ??= (async () => {
    try {
      const data = await request<AppData>('/bootstrap');
      if (!isAppData(data)) throw new Error('Несовместимый ответ API');
      source = 'api';
      try { localStorage.removeItem('vneklassa-messages-v1'); } catch { /* Storage may be disabled. */ }
      return normalizeSchoolName({ ...data, directoryRevision });
    } catch {
      source = 'mock';
      return mockData();
    }
  })();
  return loading;
}

/** Chat delivery must reach SQLite even when bootstrap used the offline catalogue. */
export async function sendChatMessage(message: Omit<Message, 'createdAt'>): Promise<Message> {
  try { return await request<Message>('/messages', 'POST', message); }
  catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Сервер недоступен. Сообщение не отправлено — повтори попытку.');
  }
}

/** A network/5xx failure switches this session to local data. 4xx errors stay errors. */
export async function save<T>(path: string, method: string, body: unknown, fallback: T): Promise<Saved<T>> {
  if (source === 'api') {
    try { return { value: await request<T>(path, method, body), local: false }; }
    catch (error) {
      if (error instanceof ApiError) throw error;
      source = 'mock';
    }
  }
  return { value: fallback, local: true };
}

export function withAccount(data: AppData, account: DemoAccount): AppData {
  const initials = account.name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return { ...data, accounts: { ...data.accounts, [account.role]: account },
    profile: account.role === 'student' ? { ...data.profile, name: account.name === 'Шалманов Максим' ? 'Максим' : account.name.split(' ')[0], fullName: account.name, initials } : data.profile,
    school: { ...data.school,
      students: data.school.students.map(student => account.role === 'student' && student.id === 'sasha' ? { ...student, name: account.name, initials } : student),
      teachers: data.school.teachers.map(teacher => account.role === 'teacher' && teacher.id === 'teacher-1' ? { ...teacher, name: account.name } : teacher),
    },
  };
}

export const savedMessage = (message: string, local: boolean) => local ? `${message}. Сохранено в этом браузере` : message;
