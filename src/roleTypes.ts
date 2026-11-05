export type Role = 'guest' | 'student' | 'teacher' | 'organization';
export type SchoolStudent = { id: string; name: string; classId: string; initials: string };
export type SchoolClass = { id: string; name: string; curatorName: string; portfolioAccess: boolean };
export type Enrollment = { id: string; studentId: string; eventId: string; registeredAt: string };
export type Message = { id: string; studentId: string; sender: 'teacher' | 'student'; text: string; eventId?: string; createdAt: string };
export type SchoolData = { school: string; teacher: { id: string; name: string; subject: string }; organization: { id: string; name: string }; classes: SchoolClass[]; students: SchoolStudent[]; enrollments: Enrollment[]; messages: Message[] };
export type DemoAccount = { name: string; email: string; role: Exclude<Role, 'guest'> };
export const roleLabels: Record<Role, string> = { guest: 'Гость', student: 'Школьник', teacher: 'Учитель', organization: 'Организация' };
