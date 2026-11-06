import { useMemo, useState } from 'react';
import type { Enrollment, SchoolData, SchoolStudent } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast, TODAY } from '../types';
import './teacherRecommendations.css';

type StudentWithInterests = SchoolStudent & { interests?: string[] };
type Props = {
  events: Opportunity[];
  school: SchoolData;
  enrollments: Enrollment[];
  onInvite: (student: SchoolStudent, event: Opportunity) => void;
  onOpenStudent: (student: SchoolStudent) => void;
  onOpenEvent: (event: Opportunity) => void;
};
type Mode = 'event' | 'student';

const yearToday = Number(TODAY.slice(0, 4));

function eventAgeRange(age: string): [number, number] | null {
  const values = age.match(/\d{1,2}/g)?.map(Number) ?? [];
  if (!values.length) return null;
  if (values.length === 1) {
    if (/\+/.test(age) || /от|старше/i.test(age)) return [values[0], 120];
    if (/до|младше/i.test(age)) return [0, values[0]];
    return /^\s*\d{1,2}\s*(лет|года|год)\s*$/i.test(age) ? [values[0], values[0]] : null;
  }
  if (!/(?:-|–|—|до|по)/i.test(age)) return null;
  return [Math.min(values[0], values[1]), Math.max(values[0], values[1])];
}

function ageFits(event: Opportunity, student: SchoolStudent) {
  const range = eventAgeRange(event.age);
  const age = yearToday - student.birthYear;
  return !!range && age >= range[0] && age <= range[1];
}

function openForRecommendations(event: Opportunity) {
  return event.deadline >= TODAY && !isPast(event);
}

function classLabel(school: SchoolData, student: SchoolStudent) {
  return school.classes.find(item => item.id === student.classId)?.name || 'Класс не указан';
}

function matchingInterest(student: StudentWithInterests, event: Opportunity) {
  return student.interests?.find(interest => interest === event.category) ?? null;
}

export default function TeacherRecommendations({ events, school, enrollments, onInvite, onOpenStudent, onOpenEvent }: Props) {
  const [mode, setMode] = useState<Mode>('event');
  const [classId, setClassId] = useState('all');
  const [eventId, setEventId] = useState('');
  const [studentId, setStudentId] = useState('');

  const filteredStudents = useMemo(() => school.students.filter(student => student.institution === school.school && (classId === 'all' || student.classId === classId)), [school.students, school.school, classId]);
  const candidates = useMemo(() => events.filter(openForRecommendations), [events]);
  const selectedEvent = candidates.find(event => event.id === eventId) ?? candidates[0];
  const selectedStudent = filteredStudents.find(student => student.id === studentId) ?? filteredStudents[0];
  const teacherId = school.teacher.id;

  const isExcluded = (student: SchoolStudent, event: Opportunity) => {
    return enrollments.some(item => item.studentId === student.id && item.eventId === event.id)
      || school.messages.some(message => message.sender === 'teacher' && message.teacherId === teacherId && message.eventId === event.id && message.studentId === student.id);
  };

  const matchingStudents = selectedEvent ? filteredStudents.filter(student => {
    const extended = student as StudentWithInterests;
    return ageFits(selectedEvent, student) && !!matchingInterest(extended, selectedEvent) && !isExcluded(student, selectedEvent);
  }) : [];

  const matchingEvents = selectedStudent ? candidates.filter(event => ageFits(event, selectedStudent)
    && !!matchingInterest(selectedStudent as StudentWithInterests, event)
    && !isExcluded(selectedStudent, event)) : [];

  const invite = (student: SchoolStudent, event: Opportunity) => onInvite(student, event);

  const classes = school.classes;
  const setModeAndReset = (next: Mode) => setMode(next);

  return <section className="teacher-recommendations" aria-label="Рекомендации ученикам">
    <div className="tr-mode" role="group" aria-label="Как подбирать рекомендации">
      <button type="button" aria-pressed={mode === 'event'} className={mode === 'event' ? 'active' : ''} onClick={() => setModeAndReset('event')}>По событию</button>
      <button type="button" aria-pressed={mode === 'student'} className={mode === 'student' ? 'active' : ''} onClick={() => setModeAndReset('student')}>По ученику</button>
    </div>

    <label className="tr-control">
      <span>Класс</span>
      <select value={classId} onChange={event => setClassId(event.target.value)}>
        <option value="all">Все классы</option>
        {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>

    {mode === 'event' ? <>
      <label className="tr-control">
        <span>Событие</span>
        <select aria-label="Выберите событие" value={selectedEvent?.id ?? ''} onChange={event => setEventId(event.target.value)} disabled={!candidates.length}>
          {!candidates.length && <option value="">Нет открытых событий</option>}
          {candidates.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
      </label>
      {selectedEvent && <div className="tr-results">
        <div className="tr-selection"><span>{dateLabel(selectedEvent.date)} · {selectedEvent.category}</span><button type="button" onClick={() => onOpenEvent(selectedEvent)}>Подробнее</button></div>
        {matchingStudents.length ? <ul>{matchingStudents.map(student => {
          const interest = matchingInterest(student as StudentWithInterests, selectedEvent)!;
          return <li key={student.id}>
            <div className="tr-person-copy"><button type="button" className="tr-person-link" onClick={() => onOpenStudent(student)}>{student.name}</button><span>{classLabel(school, student)} · интерес: {interest}</span></div>
            <button type="button" className="tr-invite" onClick={() => invite(student, selectedEvent)}>Предложить</button>
          </li>;
        })}</ul> : <p className="tr-empty">Подходящих учеников пока нет.</p>}
      </div>}
      {!candidates.length && <p className="tr-empty">Нет открытых будущих событий.</p>}
    </> : <>
      <label className="tr-control">
        <span>Ученик</span>
        <select aria-label="Выберите ученика" value={selectedStudent?.id ?? ''} onChange={event => setStudentId(event.target.value)} disabled={!filteredStudents.length}>
          {!filteredStudents.length && <option value="">В этом классе нет учеников</option>}
          {filteredStudents.map(student => <option key={student.id} value={student.id}>{student.name} · {classLabel(school, student)}</option>)}
        </select>
      </label>
      {selectedStudent && <div className="tr-results">
        <div className="tr-selection"><span>{selectedStudent.interests?.join(' · ') || 'Интересы не выбраны'}</span><button type="button" onClick={() => onOpenStudent(selectedStudent)}>Профиль</button></div>
        {matchingEvents.length ? <ul>{matchingEvents.map(event => {
          const interest = matchingInterest(selectedStudent as StudentWithInterests, event)!;
          return <li key={event.id}>
            <div className="tr-person-copy"><button type="button" className="tr-person-link" onClick={() => onOpenEvent(event)}>{event.title}</button><span>{dateLabel(event.date)} · интерес: {interest}</span></div>
            <button type="button" className="tr-invite" onClick={() => invite(selectedStudent, event)}>Предложить</button>
          </li>;
        })}</ul> : <p className="tr-empty">{selectedStudent.interests?.length ? 'Подходящих новых событий пока нет.' : 'У ученика пока не выбраны интересы.'}</p>}
      </div>}
      {!filteredStudents.length && <p className="tr-empty">В выбранном классе пока нет учеников.</p>}
    </>}
  </section>;
}
