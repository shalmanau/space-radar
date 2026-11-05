import Avatar from './Avatar';
import { ArrowRight } from 'lucide-react';
import type { Enrollment, SchoolData, SchoolStudent } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';
export default function StudentOlympiads({ student, school, events, enrollments, onOpenEvent }: { student: SchoolStudent; school: SchoolData; events: Opportunity[]; enrollments: Enrollment[]; onOpenEvent: (event: Opportunity) => void }) {
  const own = events.filter(event => event.type === 'Олимпиада' && enrollments.some(record => record.studentId === student.id && record.eventId === event.id));
  const upcoming = own.filter(event => !isPast(event)).sort((a,b) => a.date.localeCompare(b.date));
  const past = own.filter(isPast).sort((a,b) => b.date.localeCompare(a.date));
  return <div className="pupil-profile"><div className="pupil-profile-identity"><Avatar className="large-avatar" photo={student.photo} initials={student.initials} /><div><h3>{student.name}</h3><p>{student.institution} · {school.classes.find(group => group.id === student.classId)?.name}</p></div></div>{[{ title: 'Будущие олимпиады', events: upcoming }, { title: 'Прошедшие олимпиады', events: past }].map(group => <section key={group.title} aria-label={group.title}><h3>{group.title}</h3>{group.events.length ? <ul className="pupil-olympiads">{group.events.map(event => <li key={event.id}><div><h4>{event.title}</h4><p><time dateTime={event.date}>{dateLabel(event.date, { day:'2-digit',month:'2-digit',year:'numeric' })}</time> · {event.venue}</p>{isPast(event) && <span className="pupil-result">{school.eventResults.find(result => result.studentId === student.id && result.eventId === event.id)?.award || 'Участвовал(а)'}</span>}</div><button className="button secondary" onClick={() => onOpenEvent(event)} aria-label={`Подробнее: ${event.title}`}>Подробнее<ArrowRight size={18}/></button></li>)}</ul> : <p className="event-people-empty">{group.title === 'Будущие олимпиады' ? 'Нет записей на будущие олимпиады.' : 'Прошедших олимпиад пока нет.'}</p>}</section>)}</div>;
}
