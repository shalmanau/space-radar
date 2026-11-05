import { useState } from 'react';
import { ArrowDownToLine, Search, Trophy } from 'lucide-react';
import type { Enrollment, SchoolData, SchoolStudent } from '../roleTypes';
import type { Opportunity } from '../types';
import { dateLabel, isPast } from '../types';
import './eventPeople.css';

type Props = { event: Opportunity; school: SchoolData; enrollments: Enrollment[]; registry?: boolean };
export default function EventPeople({ event, school, enrollments, registry = false }: Props) {
  const [query, setQuery] = useState('');
  const completed = isPast(event);
  const className = (student: SchoolStudent) => school.classes.find(group => group.id === student.classId)?.name || '—';
  const results = school.eventResults.filter(result => result.eventId === event.id);
  const records = enrollments.filter(record => record.eventId === event.id).flatMap(record => {
    const student = school.students.find(person => person.id === record.studentId);
    return student ? [{ record, student, award: results.find(result => result.studentId === student.id)?.award }] : [];
  });
  const filtered = records.filter(({ student }) => `${student.name} ${student.institution} ${className(student)}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const winners = records.filter(person => person.award);
  const exportCsv = () => {
    const rows = [['Ученик', 'Класс', 'Учреждение', 'Дата регистрации', 'Статус'], ...filtered.map(({ record, student, award }) => [student.name, className(student), student.institution, dateLabel(record.registeredAt.slice(0, 10), { day: '2-digit', month: '2-digit', year: 'numeric' }), award || (completed ? 'Участвовал(а)' : 'Зарегистрирован(а)')])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `участники-${event.id}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="event-people">
    {completed && <section aria-label="Победители"><div className="event-people-heading"><h3><Trophy size={23} />Победители</h3></div>{winners.length ? <ul className="event-winners">{winners.map(({ student, award }) => <li key={student.id}><div><strong>{student.name}</strong><p>{student.institution} · {className(student)}</p></div><span>{award}</span></li>)}</ul> : <p className="event-people-empty">{event.type === 'Акция' ? 'В этом событии победители не определяются.' : 'Победители пока не объявлены.'}</p>}</section>}
    <section aria-label="Участники"><div className="event-people-heading"><h3>Участники <span>{records.length}</span></h3>{registry && <button className="button secondary" onClick={exportCsv} disabled={!filtered.length}><ArrowDownToLine size={18} />Скачать CSV</button>}</div>
      {registry && <label className="event-people-search"><Search size={21} /><input aria-label="Поиск участников мероприятия" placeholder="Имя, класс или учреждение" value={query} onChange={e => setQuery(e.target.value)} /></label>}
      {filtered.length ? <div className="event-people-table-wrap"><table className="event-people-table"><thead><tr><th scope="col">Ученик</th><th scope="col">Класс</th><th scope="col">Учреждение</th>{registry && <th scope="col">Статус</th>}</tr></thead><tbody>{filtered.map(({ student, award }) => <tr key={student.id}><th scope="row">{student.name}</th><td>{className(student)}</td><td>{student.institution}</td>{registry && <td><span className={award ? 'event-award' : ''}>{award || (completed ? 'Участвовал(а)' : 'Зарегистрирован(а)')}</span></td>}</tr>)}</tbody></table></div> : <p className="event-people-empty">{records.length ? 'Участники не найдены.' : 'Участников пока нет.'}</p>}
    </section>
  </div>;
}
