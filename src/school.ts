import type { AppData } from './api';

export const schoolName = 'Лицей им. Ф.Э.Дзержинского БГУ';
const rename = (value: string) => value.replaceAll('Лицей БГУ', schoolName);
/** Update cached institution labels without changing conversations or participation. */
export function normalizeSchoolName(data: AppData): AppData {
  return { ...data,
    profile: { ...data.profile, school: rename(data.profile.school) },
    events: data.events.map(event => ({ ...event, organizer: rename(event.organizer), venue: rename(event.venue),
      ...(event.address ? { address: rename(event.address) } : {}), description: rename(event.description), details: rename(event.details) })),
    school: { ...data.school, school: rename(data.school.school),
      students: data.school.students.map(student => ({ ...student, institution: rename(student.institution) })),
      teachers: data.school.teachers.map(teacher => ({ ...teacher, institution: rename(teacher.institution) })),
      teacher: { ...data.school.teacher, institution: rename(data.school.teacher.institution) },
      enrollments: data.school.enrollments.map(record => ({ ...record, ...(record.application ? {
        application: { ...record.application, profile: { ...record.application.profile, institution: rename(record.application.profile.institution) } }
      } : {}) })),
    },
  };
}
