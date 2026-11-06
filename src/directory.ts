import type { AppData } from './api';

export const directoryRevision = 2;
const students: Record<string, string> = {
  sasha: 'Шалманов Максим', maxim: 'Юркевич Мария', daria: 'Карачун Ульяна', egor: 'Ларпенко Егор',
};
const teachers: Record<string, string> = {
  'teacher-1': 'Виталий Кириленко', 'teacher-2': 'Алеся Дубодел', 'teacher-3': 'Макар Хартон',
};
/** Upgrade old offline snapshots once; subsequent conversations remain untouched. */
export function migrateDirectory(data: AppData): AppData {
  if (data.directoryRevision === directoryRevision) return data;
  const people = data.school.students.filter(student => students[student.id]).map(student => ({ ...student, name: students[student.id], initials: students[student.id].split(' ').map(part => part[0]).join('') }));
  const staff = data.school.teachers.map(teacher => ({ ...teacher, name: teachers[teacher.id] || teacher.name }));
  return { ...data, directoryRevision, profile: { ...data.profile, name: 'Максим', fullName: students.sasha, initials: 'ШМ' },
    accounts: { ...data.accounts,
      ...(data.accounts.student ? { student: { ...data.accounts.student, name: students.sasha } } : {}),
      ...(data.accounts.teacher ? { teacher: { ...data.accounts.teacher, name: teachers['teacher-1'] } } : {}),
    },
    school: { ...data.school, students: people, teachers: staff, teacher: staff.find(person => person.id === data.school.teacher.id) || staff[0],
      classes: data.school.classes.map(group => ({ ...group, curatorName: teachers[group.curatorId] || group.curatorName })),
      messages: [],
      enrollments: data.school.enrollments.filter(record => students[record.studentId]).map(record => ({ ...record,
        ...(record.application ? { application: { ...record.application, profile: { ...record.application.profile, name: students[record.studentId] } } } : {}),
      })),
      eventResults: data.school.eventResults.filter(result => students[result.studentId]),
    },
  };
}
