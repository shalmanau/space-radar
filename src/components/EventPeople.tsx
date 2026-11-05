import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Search, Trophy, X } from 'lucide-react';
import type { Enrollment, SchoolData, SchoolStudent } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';
import './eventPeople.css';

type Props = { event: Opportunity; school: SchoolData; enrollments: Enrollment[]; registry?: boolean; onOpenStudent?: (student: SchoolStudent) => void };
export default function EventPeople({ event, school, enrollments, registry = false, onOpenStudent }: Props) {
  const [query, setQuery] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const applicationRef = useRef<HTMLElement>(null);
  useEffect(() => { if (applicationId) applicationRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [applicationId]);
  const completed = isPast(event);
  const showStatus = registry || completed;
  const className = (student: SchoolStudent) => school.classes.find(group => group.id === student.classId)?.name || '—';
  const results = school.eventResults.filter(result => result.eventId === event.id);
  const records = enrollments.filter(record => record.eventId === event.id).flatMap(record => {
    const student = school.students.find(person => person.id === record.studentId);
    return student ? [{ record, student, award: results.find(result => result.studentId === student.id)?.award }] : [];
  }).sort((a, b) => completed ? Number(Boolean(b.award)) - Number(Boolean(a.award)) : 0);
  const filtered = records.filter(({ student }) => `${student.name} ${student.institution} ${className(student)}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const selectedApplication = records.find(person => person.record.id === applicationId);
  const applicationData = selectedApplication?.record.application;
  const applicationProfile = applicationData?.profile || selectedApplication?.student;
  const exportCsv = () => {
    const rows = [['Ученик', 'Класс', 'Учреждение', 'Дата регистрации', 'Статус'], ...filtered.map(({ record, student, award }) => [student.name, className(student), student.institution, dateLabel(record.registeredAt.slice(0, 10), { day: '2-digit', month: '2-digit', year: 'numeric' }), award || (completed ? 'Участвовал(а)' : 'Зарегистрирован(а)')])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `участники-${event.id}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="event-people">

    <section aria-label="Участники"><div className="event-people-heading"><h3>Участники <span>{records.length}</span></h3>{registry && <button className="button secondary" onClick={exportCsv} disabled={!filtered.length}><ArrowDownToLine size={18} />Скачать CSV</button>}</div>
      {registry && <label className="event-people-search"><Search size={21} /><input aria-label="Поиск участников мероприятия" placeholder="Имя, класс или учреждение" value={query} onChange={e => setQuery(e.target.value)} /></label>}
      {filtered.length ? <div className="event-people-table-wrap"><table className="event-people-table"><thead><tr><th scope="col">Ученик</th><th scope="col">Класс</th><th scope="col">Учреждение</th>{showStatus && <th scope="col">Статус</th>}{registry && <th scope="col">Анкета</th>}</tr></thead><tbody>{filtered.map(({ record, student, award }) => <tr key={student.id} className={completed && award ? 'event-winner-row' : undefined}><th scope="row">{onOpenStudent ? <button className="pupil-name-link" onClick={() => onOpenStudent(student)}>{student.name}</button> : student.name}</th><td>{className(student)}</td><td>{student.institution}</td>{showStatus && <td><span className={award ? 'event-award' : ''}>{completed && award && <Trophy size={18} aria-hidden="true" />}{award || (completed ? 'Участвовал(а)' : 'Зарегистрирован(а)')}</span></td>}{registry && <td className="application-action"><button className="button secondary" aria-label={`Посмотреть анкету: ${student.name}`} onClick={() => setApplicationId(record.id)}>Посмотреть анкету</button></td>}</tr>)}</tbody></table></div> : <p className="event-people-empty">{records.length ? 'Участники не найдены.' : 'Участников пока нет.'}</p>}
    </section>
    {registry && selectedApplication && applicationProfile && <section ref={applicationRef} className="application-response" aria-label={`Анкета: ${selectedApplication.student.name}`}><div className="application-response-heading"><h3>Анкета: {selectedApplication.student.name}</h3><button className="icon-button" aria-label="Закрыть анкету" onClick={() => setApplicationId(null)}><X size={21}/></button></div><dl><dt>Имя и фамилия</dt><dd>{applicationProfile.name}</dd><dt>Год рождения</dt><dd>{applicationProfile.birthYear}</dd><dt>Учебное заведение</dt><dd>{applicationProfile.institution}</dd>{applicationData?.fields.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{typeof applicationData.answers[field.id] === 'boolean' ? (applicationData.answers[field.id] ? 'Да' : 'Нет') : applicationData.answers[field.id]}</dd></div>)}</dl>{!applicationData && <p className="application-missing-note">Для этой старой регистрации дополнительные ответы не сохранились. Показаны данные профиля.</p>}</section>}
  </div>;
}
