export interface DayInfo {
  id: string;
  name: string;
}

export interface PeriodInfo {
  id: string;
  name: string;
  time: string;
  shift: 'morning' | 'afternoon';
}

export type ColorKey = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';

export interface ColorStyle {
  bg: string;
  border: string;
  text: string;
  badge: string;
}

export interface SubjectItem {
  name: string;
  code?: string;
  color: ColorKey;
  hoursPerWeek: number;
}

export interface ClassItem {
  id: string;
  name: string;
  room: string;
  curriculumProfile?: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  subject: string;
  phone: string;
  maxHours: number;
  unavailable: string[];
  preferred?: string[];
  preferredShift?: 'any' | 'morning' | 'afternoon';
}

export interface ScheduleSlot {
  id: string;
  day: string;
  period: string;
  classId: string;
  teacherId: string;
  subjectName: string;
  note?: string;
}

export interface OfficialServicePlanItem {
  classId: string;
  teacherId: string;
  subjectName: string;
  note?: string;
}

export interface ServiceRosterItem {
  no: string;
  name: string;
  gender: string;
  dob: string;
  startDate: string;
  scale: string;
  spec: string;
  role: string;
  taughtSub: string;
  grades: string;
  reqHours: number;
  extraHours: number;
  totalHours: number;
  note: string;
  codes: string[];
  breakdown: string;
}

export type AdminRoleKey = 'FINANCE' | 'DEPUTY' | 'SECRETARY' | 'TEACHER';

export interface AdminChronoItem {
  id: number;
  role: AdminRoleKey;
  roleName: string;
  code: string;
  category: string;
  title: string;
  color?: string;
}

export interface AdministrationData {
  schoolName: string;
  items: AdminChronoItem[];
}

export interface AppState {
  viewMode: 'class' | 'teacher';
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  classes: ClassItem[];
  schedule: ScheduleSlot[];
  officialServicePlan: OfficialServicePlanItem[];
  serviceRoster?: ServiceRosterItem[];
  administration?: AdministrationData;
  curriculumProfiles?: Record<string, Record<string, number>>;
}

export const STORAGE_KEY = 'preah_norodom_sihamoni_schedule_2026_v2';
export const LAST_SAVED_KEY = 'preah_norodom_sihamoni_schedule_2026_v2_last_saved';

export const DAYS: DayInfo[] = [
  { id: 'mon', name: 'ថ្ងៃចន្ទ' },
  { id: 'tue', name: 'ថ្ងៃអង្គារ' },
  { id: 'wed', name: 'ថ្ងៃពុធ' },
  { id: 'thu', name: 'ថ្ងៃព្រហស្បតិ៍' },
  { id: 'fri', name: 'ថ្ងៃសុក្រ' },
  { id: 'sat', name: 'ថ្ងៃសៅរ៍' },
];

export const PERIODS: PeriodInfo[] = [
  { id: 'p1', name: 'ម៉ោងទី ១', time: '7:00 - 8:00', shift: 'morning' },
  { id: 'p2', name: 'ម៉ោងទី ២', time: '8:00 - 9:00', shift: 'morning' },
  { id: 'p3', name: 'ម៉ោងទី ៣', time: '9:00 - 10:00', shift: 'morning' },
  { id: 'p4', name: 'ម៉ោងទី ៤', time: '10:00 - 11:00', shift: 'morning' },
  { id: 'p5', name: 'ម៉ោងទី ៥', time: '11:00 - 12:00', shift: 'morning' },
  { id: 'p6', name: 'ម៉ោងទី ៦', time: '1:00 - 2:00', shift: 'afternoon' },
  { id: 'p7', name: 'ម៉ោងទី ៧', time: '2:00 - 3:00', shift: 'afternoon' },
  { id: 'p8', name: 'ម៉ោងទី ៨', time: '3:00 - 4:00', shift: 'afternoon' },
  { id: 'p9', name: 'ម៉ោងទី ៩', time: '4:00 - 5:00', shift: 'afternoon' },
];

export const COLOR_STYLES: Record<ColorKey, ColorStyle> = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-900', badge: 'bg-indigo-600 text-white' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', badge: 'bg-amber-500 text-slate-950' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-900', badge: 'bg-rose-600 text-white' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-900', badge: 'bg-sky-600 text-white' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', badge: 'bg-purple-600 text-white' },
};

export const OFFICIAL_SERVICE_ROSTER: ServiceRosterItem[] = [
  { no: '១', name: 'ហ៊ុល ហាក់', gender: 'ប', dob: '11/12/1979', startDate: '01/10/2003', scale: 'ក១.៦', spec: 'Ed+C', role: 'នាយក', taughtSub: 'Ed', grades: '7, 8', reqHours: 0, extraHours: 8, totalHours: 8, note: 'នាយក', codes: ['Ed1'], breakdown: 'Ed1 (8ABC=6h, 7A=2h) = 8h' },
  { no: '២', name: 'ស៊ី វណ្ណា', gender: 'ប', dob: '20/02/1983', startDate: '01/10/2006', scale: 'ក២.៣', spec: 'M+P', role: 'នាយករង', taughtSub: 'Ed', grades: '7, 10', reqHours: 0, extraHours: 8, totalHours: 8, note: 'នាយករង', codes: ['Ed2'], breakdown: 'Ed2 (10ABC=6h, 7B=2h) = 8h' },
  { no: '៣', name: 'ហូ សុធារិទ្ធ', gender: 'ប', dob: '18/08/1989', startDate: '01/10/2017', scale: 'ក៣.២', spec: 'H', role: 'បង្រៀន', taughtSub: 'H, G', grades: '9, 10, 11, 12', reqHours: 9, extraHours: 12, totalHours: 21, note: 'បន្ទុកថ្នាក់ទី 12C', codes: ['G1', 'H2'], breakdown: 'G1 (12ABC=8h, 11ABC=6h, 10ABC=6h)=20h + H2(9B=1h) = 21h' },
  { no: '៤', name: 'ប៊ុន សុផាត', gender: 'ប', dob: '10/10/1971', startDate: '01/10/1991', scale: 'ខ១.៥', spec: 'M', role: 'បង្រៀន', taughtSub: 'M, Ed', grades: '7, 8', reqHours: 15, extraHours: 12, totalHours: 27, note: 'បង្រៀន', codes: ['M4', 'Ed4'], breakdown: 'M4 (7ABC=15h, 8AB=10h)=25h + Ed4(7C=2h) = 27h' },
  { no: '៥', name: 'ហ៊ី ថាត', gender: 'ប', dob: '02/11/1989', startDate: '01/10/2009', scale: 'ក៣.១', spec: 'B', role: 'បង្រៀន', taughtSub: 'B', grades: '8, 9, 10, 12', reqHours: 7, extraHours: 11, totalHours: 18, note: 'បន្ទុកថ្នាក់ទី 8B', codes: ['B2'], breakdown: 'B2 (12A=2h, 10ABC=6h, 8ABC=6h, 9AB=4h) = 18h' },
  { no: '៦', name: 'អ៊ុន លីដា', gender: 'ស', dob: '05/07/1991', startDate: '01/10/2017', scale: 'ក៣.១', spec: 'K', role: 'បង្រៀន', taughtSub: 'K', grades: '9, 10, 11, 12', reqHours: 9, extraHours: 12, totalHours: 21, note: 'បន្ទុកថ្នាក់ទី 11B', codes: ['K2'], breakdown: 'K2 (12C=3h, 11AB=6h, 10B=6h, 9B=6h) = 21h' },
  { no: '៧', name: 'ល័ក្ខ ណាគ្រី', gender: 'ស', dob: '05/06/1992', startDate: '01/10/2012', scale: 'ខ២.៤', spec: 'B+ES', role: 'បង្រៀន', taughtSub: 'ES, K', grades: '7, 8, 9, 10', reqHours: 9, extraHours: 10, totalHours: 19, note: 'បន្ទុកថ្នាក់ទី 7A', codes: ['K5', 'ES2'], breakdown: 'K5 (7AB=12h) + ES2 (8ABC=3h, 9AB=2h, 10C=2h) = 19h' },
  { no: '៨', name: 'ម៉ែន យុទ្ធា', gender: 'ប', dob: '11/01/1989', startDate: '01/10/2009', scale: 'ខ២.៣', spec: 'Ed', role: 'បណ្ណារក្ស', taughtSub: 'Ed', grades: '9, 11', reqHours: 2, extraHours: 8, totalHours: 10, note: 'បណ្ណារក្ស', codes: ['Ed3'], breakdown: 'Ed3 (11ABC=6h, 9AB=4h) = 10h' },
  { no: '៩', name: 'ឆយ សុវ៉ាន់ណេត', gender: 'ប', dob: '09/05/1995', startDate: '01/11/2018', scale: 'ក៣.៣', spec: 'M', role: 'បង្រៀន', taughtSub: 'M', grades: '10, 12', reqHours: 13, extraHours: 8, totalHours: 21, note: 'បន្ទុកថ្នាក់ទី 10B', codes: ['M2'], breakdown: 'M2 (12AB=6h, 10ABC=15h) = 21h' },
  { no: '១០', name: 'ចែម ភាសាល', gender: 'ប', dob: '28/02/1998', startDate: '01/02/2023', scale: 'ក៣.៤', spec: 'IT', role: 'បុគ្គលិកទីចាត់ការ', taughtSub: 'I', grades: '7, 8', reqHours: 2, extraHours: 8, totalHours: 10, note: 'បុគ្គលិកទីចាត់ការ', codes: ['I3'], breakdown: 'I3 (7ABC=6h, 8B=4h) = 10h' },
  { no: '១១', name: 'គុំ វណ្ណាត', gender: 'ប', dob: '15/02/1997', startDate: '01/02/2023', scale: 'ក៣.៤', spec: 'B', role: 'បង្រៀន', taughtSub: 'B', grades: '7, 11, 12', reqHours: 8, extraHours: 12, totalHours: 20, note: 'បន្ទុកថ្នាក់ទី 12B', codes: ['B1'], breakdown: 'B1 (12BC=5h, 11ABC=9h, 7ABC=6h) = 20h' },
  { no: '១២', name: 'ជុំ សុជាតិ', gender: 'ប', dob: '09/07/1995', startDate: '15/01/2019', scale: 'ក៣.៣', spec: 'K', role: 'បង្រៀន', taughtSub: 'K', grades: '9, 10, 12', reqHours: 12, extraHours: 10, totalHours: 22, note: 'បង្រៀន', codes: ['K1'], breakdown: 'K1 (12AB=10h, 10A=6h, 9A=6h) = 22h' },
  { no: '១៣', name: 'ហ៊ុន ឈឿន', gender: 'ប', dob: '01/10/1987', startDate: '01/10/2011', scale: 'ក៣.២', spec: 'C', role: 'លេខា', taughtSub: 'En', grades: '7, 8', reqHours: 0, extraHours: 8, totalHours: 8, note: 'លេខា', codes: ['En4'], breakdown: 'En4 (7ABC=6h, 8C=2h) = 8h' },
  { no: '១៤', name: 'ហន ឈុនហាក់', gender: 'ប', dob: '10/10/1993', startDate: '01/10/2020', scale: 'ក៣.៣', spec: 'P', role: 'បង្រៀន', taughtSub: 'P', grades: '9, 10, 11, 12', reqHours: 10, extraHours: 12, totalHours: 22, note: 'បន្ទុកថ្នាក់ទី 10C', codes: ['P1'], breakdown: 'P1 (12ABC=7h, 11ABC=9h, 10BC=4h, 9A=2h) = 22h' },
  { no: '១៥', name: 'អុន សុគន្ធា', gender: 'ស', dob: '20/04/1993', startDate: '01/10/2020', scale: 'ក៣.៣', spec: 'En', role: 'បុគ្គលិកទីចាត់ការ', taughtSub: 'En', grades: '9, 10, 11, 12', reqHours: 10, extraHours: 10, totalHours: 20, note: 'បុគ្គលិកទីចាត់ការ', codes: ['En1'], breakdown: 'En1 (12ABC=6h, 11ABC=6h, 10ABC=6h, 9A=2h) = 20h' },
  { no: '១៦', name: 'ហាស់ សង្ហា', gender: 'ប', dob: '01/07/1996', startDate: '01/10/2020', scale: 'ក៣.៣', spec: 'M', role: 'បង្រៀន', taughtSub: 'M', grades: '9, 11, 12', reqHours: 9, extraHours: 11, totalHours: 20, note: 'បន្ទុកថ្នាក់ទី 9A', codes: ['M1'], breakdown: 'M1 (12C=5h, 11AB=10h, 9A=5h) = 20h' },
  { no: '១៧', name: 'ហ៊ុន សុខម៉េង', gender: 'ស', dob: '13/06/1995', startDate: '01/02/2023', scale: 'ក៣.៤', spec: 'M', role: 'បង្រៀន', taughtSub: 'M, En', grades: '8, 9, 11', reqHours: 7, extraHours: 12, totalHours: 19, note: 'បន្ទុកថ្នាក់ទី 8C', codes: ['M3', 'En3'], breakdown: 'M3 (11C=5h, 9B=5h, 8C=5h)=15h + En3(8AB=4h) = 19h' },
  { no: '១៨', name: 'រី ដារ៉ូ', gender: 'ប', dob: '20/07/1997', startDate: '01/02/2023', scale: 'ខ៣.៣', spec: 'P', role: 'បង្រៀន', taughtSub: 'P, En', grades: '7, 8, 9, 10', reqHours: 7, extraHours: 11, totalHours: 18, note: 'បន្ទុកថ្នាក់ទី 9B', codes: ['P2', 'En2'], breakdown: 'P2 (10A=2h, 9B=2h, 8ABC=6h, 7ABC=6h)=16h + En2(9B=2h) = 18h' },
  { no: '១៩', name: 'ខាត់ ចន្ថា', gender: 'ប', dob: '06/06/1993', startDate: '01/10/2020', scale: 'ក៣.៣', spec: 'C', role: 'បង្រៀន', taughtSub: 'C', grades: '7, 9, 10, 12', reqHours: 7, extraHours: 11, totalHours: 18, note: 'បន្ទុកថ្នាក់ទី 10A', codes: ['C1'], breakdown: 'C1 (12AB=4h, 10ABC=6h, 9A=2h, 7ABC=6h) = 18h' },
  { no: '២០', name: 'គ្រោះ រ៉ែម', gender: 'ប', dob: '12/10/1972', startDate: '01/10/1990', scale: 'ខ១.៦', spec: 'H+G', role: 'បង្រៀន', taughtSub: 'H, G', grades: '7, 8, 9', reqHours: 9, extraHours: 10, totalHours: 19, note: 'បន្ទុកថ្នាក់ទី 7B', codes: ['G2', 'H3'], breakdown: 'G2 (9AB=4h, 8ABC=6h, 7ABC=6h)=16h + H3(8ABC=3h) = 19h' },
  { no: '២១', name: 'គិន សុភា', gender: 'ប', dob: '03/09/1994', startDate: '13/01/2019', scale: 'ក៣.៣', spec: 'ES', role: 'បង្រៀន', taughtSub: 'ES', grades: '7, 10, 11, 12', reqHours: 7, extraHours: 12, totalHours: 19, note: 'បន្ទុកថ្នាក់ទី 11C', codes: ['ES1'], breakdown: 'ES1 (12ABC=6h, 11ABC=6h, 10AB=4h, 7ABC=3h) = 19h' },
  { no: '២២', name: 'អ៊ុក សាវឿន', gender: 'ប', dob: '18/11/1988', startDate: '01/10/2010', scale: 'ក៣.២', spec: 'P+C', role: 'ហិរញ្ញិក', taughtSub: 'I', grades: '9, 10', reqHours: 0, extraHours: 8, totalHours: 8, note: 'ហិរញ្ញិក', codes: ['I2', 'I4'], breakdown: 'I2 (10ABC=6h, 9B=2h) + I4(8AC=4h)' },
  { no: '២៣', name: 'សាយ ពិសិដ្ឋ', gender: 'ប', dob: '16/06/1994', startDate: '01/11/2019', scale: 'ក៣.៣', spec: 'H', role: 'បង្រៀន', taughtSub: 'H', grades: '7, 9, 10, 11, 12', reqHours: 9, extraHours: 12, totalHours: 21, note: 'បន្ទុកថ្នាក់ទី 11A', codes: ['H1'], breakdown: 'H1 (12ABC=8h, 11ABC=6h, 10ABC=3h, 9A=1h, 7ABC=3h) = 21h' },
  { no: '២៤', name: 'សុខ ឃឹម', gender: 'ស', dob: '10/08/1998', startDate: '01/11/2025', scale: 'ក៣.៤', spec: 'K', role: 'បង្រៀន', taughtSub: '-', grades: '-', reqHours: 0, extraHours: 0, totalHours: 0, note: 'លំហែមាតុភាព', codes: [], breakdown: 'លំហែមាតុភាព (0 ម៉ោង)' },
  { no: '២៥', name: 'វង ទី', gender: 'ប', dob: '08/02/1997', startDate: '01/11/2025', scale: 'ក៣.៤', spec: 'C', role: 'បង្រៀន', taughtSub: 'C', grades: '8, 9, 11, 12', reqHours: 8, extraHours: 12, totalHours: 20, note: 'បន្ទុកថ្នាក់ទី 8A', codes: ['C2'], breakdown: 'C2 (12C=3h, 11ABC=9h, 9B=2h, 8ABC=6h) = 20h' },
  { no: '២៦', name: 'មាឃ លឹមហ៊ាត', gender: 'ប', dob: '10/01/1999', startDate: '01/11/2025', scale: 'ក៣.៤', spec: 'I', role: 'បង្រៀន', taughtSub: 'I, En', grades: '9, 11, 12', reqHours: 7, extraHours: 11, totalHours: 18, note: 'បន្ទុកថ្នាក់ទី 12A', codes: ['I1'], breakdown: 'I1 (12ABC=8h, 11ABC=6h, 9A=2h) + En2(9B=2h) = 18h' },
  { no: '២៧', name: 'ខេង ស្រីខួច', gender: 'ស', dob: '15/01/1991', startDate: '01/11/2025', scale: 'ក៣.៤', spec: 'Em', role: 'បង្រៀន', taughtSub: 'Em, K', grades: '7, 8, 10, 11', reqHours: 9, extraHours: 12, totalHours: 21, note: 'បន្ទុកថ្នាក់ទី 7C', codes: ['K4', 'Em1'], breakdown: 'K4 (8A=6h, 7C=6h)=12h + Em1 (11ABC=6h, 10ABC=3h)=9h = 21h' },
  { no: '២៨', name: 'អែ សារឹម', gender: 'ប', dob: '-', startDate: '01/11/2025', scale: 'ក៣.៤', spec: 'K', role: 'បង្រៀន', taughtSub: 'K', grades: '8, 10, 11', reqHours: 12, extraHours: 9, totalHours: 21, note: 'បង្រៀន', codes: ['K3'], breakdown: 'K3 (11C=3h, 10C=6h, 8BC=12h) = 21h' },
];

export const ROSTER_FIELDS: Array<[keyof ServiceRosterItem, string, 'text' | 'number']> = [
  ['no', 'ល.រ', 'text'],
  ['name', 'គោត្តនាម-នាម', 'text'],
  ['gender', 'ភេទ', 'text'],
  ['dob', 'ថ្ងៃខែឆ្នាំកំណើត (ថ្ងៃ/ខែ/ឆ្នាំ)', 'text'],
  ['startDate', 'ថ្ងៃខែឆ្នាំចូលការងារ (ថ្ងៃ/ខែ/ឆ្នាំ)', 'text'],
  ['scale', 'ក្របខណ្ឌ', 'text'],
  ['spec', 'ឯកទេស', 'text'],
  ['role', 'ឋានៈតួនាទី', 'text'],
  ['taughtSub', 'មុខវិជ្ជាបង្រៀន', 'text'],
  ['grades', 'ថ្នាក់ទី', 'text'],
  ['reqHours', 'ម៉ោងកំណត់', 'number'],
  ['extraHours', 'ម៉ោងបន្ថែម', 'number'],
  ['totalHours', 'ម៉ោងសរុប', 'number'],
  ['note', 'ផ្សេងៗ / កំណត់សម្គាល់', 'text'],
  ['codes', 'កូដកាលវិភាគ (បំបែកដោយសញ្ញាក្បៀស)', 'text'],
  ['breakdown', 'សេចក្ដីបែងចែកសេវាលម្អិត', 'text'],
];

export const ADMIN_DEFAULT_ITEMS: AdminChronoItem[] = [
  // ១. នាយករងហិរញ្ញវត្ថុ (30)
  { id: 1, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០១', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'ថវិកាសប្បុរសជន ភាស៊ីលក់ដូរ និងភាស៊ីកង់ម៉ូតូ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 2, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០២', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'បញ្ជីឈ្មោះសិស្សតាមឆ្នាំ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 3, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៣', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'ការប្តេជ្ញាចិត្តមាតាបិតា', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 4, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៤', category: 'ផ្នែកការសិក្សា ប្រឡង និងសកម្មភាព', title: 'ការងារយុវជន និងកីឡា', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 5, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៥', category: 'ផ្នែករដ្ឋបាល និងលិខិតស្នាម', title: 'កម្មវិធី និងរបាយការណ៍ប្រជុំនានា', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 6, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៦', category: 'ផ្នែកការសិក្សា ប្រឡង និងសកម្មភាព', title: 'លិខិតណែនាំស្តីពីការប្រឡង', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 7, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៧', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'បញ្ជីវត្តមានសិស្សអវត្តមានច្រើន', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 8, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៨', category: 'ផ្នែករដ្ឋបាល និងលិខិតស្នាម', title: 'លិខិតចេញ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 9, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-០៩', category: 'ផ្នែករដ្ឋបាល និងលិខិតស្នាម', title: 'លិខិតចូល', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 10, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១០', category: 'ផ្នែកការសិក្សា ប្រឡង និងសកម្មភាព', title: 'លទ្ធផលប្រឡង', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 11, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១១', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'កិច្ចព្រមព្រៀងរៀនបំប៉ន', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 12, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១២', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'កិច្ចសន្យាសិស្សបង្កបញ្ហា និងលេងទូរស័ព្ទក្នុងបរិវេណសាលារៀន', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 13, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៣', category: 'ផ្នែកគម្រោង និងស្តង់ដាសាលាគំរូ', title: 'របាយការណ៍ចុះបង្វឹក (GEIP 2026)', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 14, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៤', category: 'ផ្នែកគម្រោង និងស្តង់ដាសាលាគំរូ', title: 'ទម្រង់ឯកសារស្តង់ដាសាលាគំរូ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 15, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៥', category: 'ផ្នែកការសិក្សា ប្រឡង និងសកម្មភាព', title: 'ការលើកកម្ពស់សុខភាពសិក្សា', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 16, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៦', category: 'ផ្នែកសម្ភារៈ និងទ្រព្យសម្បត្តិរដ្ឋ', title: 'កិច្ចបញ្ជីការសម្ភារៈ (១)', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 17, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៧', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'កិច្ចបញ្ជីការគណនេយ្យ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 18, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៨', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'ប្រកាសអាហារូបករណ៍', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 19, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-១៩', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'របាយការណ៍ LMC', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 20, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២០', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'របាយការណ៍ SOP', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 21, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២១', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'កិច្ចបញ្ជីការគណនេយ្យ SOF 2023', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 22, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២២', category: 'ផ្នែកសម្ភារៈ និងទ្រព្យសម្បត្តិរដ្ឋ', title: 'កិច្ចបញ្ជីការសម្ភារៈ SOF 2023', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 23, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៣', category: 'ផ្នែកសម្ភារៈ និងទ្រព្យសម្បត្តិរដ្ឋ', title: 'កិច្ចបញ្ជីការសម្ភារៈ (២)', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 24, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៤', category: 'ផ្នែកគម្រោង និងស្តង់ដាសាលាគំរូ', title: 'គម្រោង GEIP-ADB 2023', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 25, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៥', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'កិច្ចបញ្ជីការគណនេយ្យ 2024', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 26, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៦', category: 'ផ្នែកសម្ភារៈ និងទ្រព្យសម្បត្តិរដ្ឋ', title: 'កិច្ចបញ្ជីការសម្ភារៈ 2024', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 27, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៧', category: 'ផ្នែកគម្រោង និងស្តង់ដាសាលាគំរូ', title: 'គម្រោង GEIP 2024', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 28, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៨', category: 'ផ្នែកកិច្ចការសិស្ស និងវិន័យ', title: 'បញ្ជីសិស្សគេចសាលា ឬអវត្តមានច្រើន', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 29, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-២៩', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ', title: 'លិខិតណែនាំផ្នែកហិរញ្ញវត្ថុ', color: 'border-blue-600 bg-blue-50 text-blue-900' },
  { id: 30, role: 'FINANCE', roleName: 'នាយករងហិរញ្ញវត្ថុ', code: 'ហវ-៣០', category: 'ផ្នែកការសិក្សា ប្រឡង និងសកម្មភាព', title: 'ឯកសារគណិតវិទ្យា', color: 'border-blue-600 bg-blue-50 text-blue-900' },

  // ២. នាយករង (14)
  { id: 31, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០១', category: 'ផ្នែកបុគ្គលិក និងបច្ចេកទេស', title: 'ពាក្យស្នើសុំផ្លាស់ប្តូរទីកន្លែងការងារ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 32, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០២', category: 'ផ្នែកកិច្ចការសិស្ស និងសញ្ញាបត្រ', title: 'អាហារូបករណ៍សិស្សក្រីក្រ ឆ្នាំសិក្សា ២០២៤-២០២៥', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 33, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៣', category: 'ផ្នែកកិច្ចការសិស្ស និងសញ្ញាបត្រ', title: 'លិខិតបញ្ជាក់ការសិក្សា', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 34, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៤', category: 'ផ្នែកបុគ្គលិក និងបច្ចេកទេស', title: 'របាយការណ៍ស្នាដៃការងារដំឡើងកាំប្រាក់', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 35, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៥', category: 'ផ្នែកកិច្ចការសិស្ស និងសញ្ញាបត្រ', title: 'លិខិតផ្ទេរសិទ្ធិ និងកែតម្រូវសញ្ញាបត្រ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 36, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៦', category: 'ផ្នែករដ្ឋបាល និងផែនការ', title: 'គណបក្ស', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 37, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៧', category: 'ផ្នែកហេដ្ឋារចនាសម្ព័ន្ធ និងសារពើភណ្ឌ', title: 'សំណង់អគារសិក្សា', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 38, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៨', category: 'ផ្នែកបុគ្គលិក និងបច្ចេកទេស', title: 'កិច្ចសន្យាបម្រើការងារ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 39, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-០៩', category: 'ផ្នែករដ្ឋបាល និងផែនការ', title: 'បញ្ជូនលិខិត', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 40, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-១០', category: 'ផ្នែករដ្ឋបាល និងផែនការ', title: 'ផែនការការងារ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 41, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-១១', category: 'ផ្នែកកិច្ចការសិស្ស និងសញ្ញាបត្រ', title: 'ការផ្ទេរការសិក្សា', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 42, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-១២', category: 'ផ្នែករដ្ឋបាល និងផែនការ', title: 'លិខិតផ្សេងៗ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 43, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-១៣', category: 'ផ្នែកហេដ្ឋារចនាសម្ព័ន្ធ និងសារពើភណ្ឌ', title: 'បញ្ជីសារពើភណ្ឌ', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { id: 44, role: 'DEPUTY', roleName: 'នាយករង', code: 'នរ-១៤', category: 'ផ្នែកបុគ្គលិក និងបច្ចេកទេស', title: 'តារាងបែងចែកម៉ោងបង្រៀន ឬកាលវិភាគបង្រៀន', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },

  // ៣. លេខានាយក (9)
  { id: 45, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០១', category: 'ផ្នែករដ្ឋបាល និងបុគ្គលិក', title: 'លិខិតសុំច្បាប់របស់បុគ្គលិក', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 46, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០២', category: 'ផ្នែកកិច្ចការសិស្ស និងការសិក្សា', title: 'កិច្ចសន្យាសិស្សប្រចាំឆ្នាំ', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 47, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៣', category: 'ផ្នែកកិច្ចការសិស្ស និងការសិក្សា', title: 'បញ្ជីទំនាក់ទំនង និងលេខទូរស័ព្ទអាណាព្យាបាលសិស្ស', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 48, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៤', category: 'ផ្នែកកិច្ចការសិស្ស និងការសិក្សា', title: 'ពាក្យសុំច្បាប់របស់សិស្សប្រចាំថ្ងៃ', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 49, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៥', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគម្រោង', title: 'តារាងស្រង់ថវិកាទឹកភ្លើង', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 50, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៦', category: 'ផ្នែកហិរញ្ញវត្ថុ និងគម្រោង', title: 'គម្រោង GEIP (ក, ខ, គ, ឃ)', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 51, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៧', category: 'ផ្នែកកិច្ចការសិស្ស និងការសិក្សា', title: 'បញ្ជីពិន្ទុតាមថ្នាក់រៀន ប្រចាំខែ និងប្រចាំឆ្នាំ', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 52, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៨', category: 'ផ្នែករដ្ឋបាល និងបុគ្គលិក', title: 'តារាង SEC', color: 'border-purple-600 bg-purple-50 text-purple-900' },
  { id: 53, role: 'SECRETARY', roleName: 'លេខានាយក', code: 'លខ-០៩', category: 'ផ្នែករដ្ឋបាល និងបុគ្គលិក', title: 'ឯកសារផ្សេងៗ', color: 'border-purple-600 bg-purple-50 text-purple-900' },

  // ៤. គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់ (13)
  { id: 54, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០១', category: 'បច្ចេកទេសបង្រៀន', title: 'កាលវិភាគបង្រៀនប្រចាំសប្តាហ៍', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 55, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០២', category: 'បច្ចេកទេសបង្រៀន', title: 'សៀវភៅសម្រង់អត្ថបទ', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 56, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៣', category: 'គ្រប់គ្រងថ្នាក់រៀន', title: 'សៀវភៅវេនសិស្ស', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 57, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៤', category: 'បច្ចេកទេសបង្រៀន', title: 'សៀវភៅជួយសិស្សរៀនយឺត', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 58, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៥', category: 'គ្រប់គ្រងថ្នាក់រៀន', title: 'សៀវភៅទំនាក់ទំនងមាតាបិតាសិស្ស', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 59, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៦', category: 'គ្រប់គ្រងថ្នាក់រៀន', title: 'សៀវភៅវត្តមាន និងពិន្ទុសិស្ស', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 60, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៧', category: 'បច្ចេកទេសបង្រៀន', title: 'សៀវភៅផែនការគ្រូ', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 61, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៨', category: 'រដ្ឋបាល ប្រជុំ និងអធិការកិច្ច', title: 'សៀវភៅប្រជុំបច្ចេកទេស', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 62, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-០៩', category: 'រដ្ឋបាល ប្រជុំ និងអធិការកិច្ច', title: 'សៀវភៅប្រជុំការងារផ្សេងៗ', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 63, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-១០', category: 'រដ្ឋបាល ប្រជុំ និងអធិការកិច្ច', title: 'សៀវភៅថ្នាក់ដឹកនាំ', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 64, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-១១', category: 'រដ្ឋបាល ប្រជុំ និងអធិការកិច្ច', title: 'សៀវភៅអនុសាសន៍អធិការកិច្ច', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 65, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-១២', category: 'គ្រប់គ្រងថ្នាក់រៀន', title: 'សៀវភៅតាមដានសុខភាពសិស្ស', color: 'border-amber-600 bg-amber-50 text-amber-900' },
  { id: 66, role: 'TEACHER', roleName: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់', code: 'គ្រូ-១៣', category: 'គ្រប់គ្រងថ្នាក់រៀន', title: 'សៀវភៅប្រគល់ និងទទួលសម្ភារៈ', color: 'border-amber-600 bg-amber-50 text-amber-900' },
];

export const ADMIN_ROLES: Record<AdminRoleKey, string> = {
  FINANCE: 'នាយករងហិរញ្ញវត្ថុ',
  DEPUTY: 'នាយករង',
  SECRETARY: 'លេខានាយក',
  TEACHER: 'គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់',
};

export const PROFILE_LABELS: Record<string, string> = {
  '7': 'ថ្នាក់ទី ៧',
  '8': 'ថ្នាក់ទី ៨',
  '9': 'ថ្នាក់ទី ៩',
  '10': 'ថ្នាក់ទី ១០',
  '11_science': 'ថ្នាក់ទី ១១ · វិទ្យាសាស្ត្រពិត',
  '11_social': 'ថ្នាក់ទី ១១ · វិទ្យាសាស្ត្រសង្គម',
  '12_science': 'ថ្នាក់ទី ១២ · វិទ្យាសាស្ត្រពិត',
  '12_social': 'ថ្នាក់ទី ១២ · វិទ្យាសាស្ត្រសង្គម',
};

export const TRADITIONAL_HOURS: Record<string, Record<string, number>> = {
  science: { K: 3, M: 5, P: 3, C: 3, B: 3, ES: 2, H: 2, G: 2, I: 2, En: 2, Ed: 1, Em: 2 },
  social: { K: 5, M: 3, P: 2, C: 2, B: 2, ES: 2, H: 3, G: 3, I: 3, En: 2, Ed: 1, Em: 2 },
};

export function buildOfficialSchoolSchedule(): AppState {
  const subjects: SubjectItem[] = [
    { name: 'អក្សរសាស្ត្រខ្មែរ (K)', code: 'K', color: 'emerald', hoursPerWeek: 5 },
    { name: 'គណិតវិទ្យា (M)', code: 'M', color: 'indigo', hoursPerWeek: 5 },
    { name: 'រូបវិទ្យា (P)', code: 'P', color: 'sky', hoursPerWeek: 2 },
    { name: 'គីមីវិទ្យា (C)', code: 'C', color: 'purple', hoursPerWeek: 2 },
    { name: 'ជីវវិទ្យា (B)', code: 'B', color: 'emerald', hoursPerWeek: 2 },
    { name: 'ផែនដី-បរិស្ថាន (ES)', code: 'ES', color: 'amber', hoursPerWeek: 2 },
    { name: 'ប្រវត្តិវិទ្យា (H)', code: 'H', color: 'amber', hoursPerWeek: 2 },
    { name: 'ភូមិវិទ្យា (G)', code: 'G', color: 'emerald', hoursPerWeek: 2 },
    { name: 'សីលធម៌-ពលរដ្ឋវិជ្ជា (I)', code: 'I', color: 'purple', hoursPerWeek: 2 },
    { name: 'ភាសាអង់គ្លេស (En)', code: 'En', color: 'rose', hoursPerWeek: 2 },
    { name: 'អប់រំកាយ-កីឡា (Ed)', code: 'Ed', color: 'sky', hoursPerWeek: 2 },
    { name: 'សេដ្ឋកិច្ច (Em)', code: 'Em', color: 'amber', hoursPerWeek: 2 },
    { name: 'ពលកម្ម', code: 'L', color: 'rose', hoursPerWeek: 1 },
  ];

  const classes: ClassItem[] = [
    { id: '12A', name: 'ថ្នាក់ទី 12A', room: 'គ្រូបន្ទុកថ្នាក់៖ មាឃ លឹមហ៊ាត' },
    { id: '12B', name: 'ថ្នាក់ទី 12B', room: 'គ្រូបន្ទុកថ្នាក់៖ គុំ វណ្ណាត' },
    { id: '12C', name: 'ថ្នាក់ទី 12C', room: 'គ្រូបន្ទុកថ្នាក់៖ ហូ សុធារិទ្ធ' },
    { id: '11A', name: 'ថ្នាក់ទី 11A', room: 'គ្រូបន្ទុកថ្នាក់៖ សាយ ពិសិដ្ឋ' },
    { id: '11B', name: 'ថ្នាក់ទី 11B', room: 'គ្រូបន្ទុកថ្នាក់៖ អ៊ុន លីដា' },
    { id: '11C', name: 'ថ្នាក់ទី 11C', room: 'គ្រូបន្ទុកថ្នាក់៖ គិន សុភា' },
    { id: '10A', name: 'ថ្នាក់ទី 10A', room: 'គ្រូបន្ទុកថ្នាក់៖ ខាត់ ចន្ថា' },
    { id: '10B', name: 'ថ្នាក់ទី 10B', room: 'គ្រូបន្ទុកថ្នាក់៖ ឆយ សុវ៉ាន់ណេត' },
    { id: '10C', name: 'ថ្នាក់ទី 10C', room: 'គ្រូបន្ទុកថ្នាក់៖ ហន ឈុនហាក់' },
    { id: '9A', name: 'ថ្នាក់ទី 9A', room: 'គ្រូបន្ទុកថ្នាក់៖ ហាស់ សង្ហា' },
    { id: '9B', name: 'ថ្នាក់ទី 9B', room: 'គ្រូបន្ទុកថ្នាក់៖ រី ដារ៉ូ' },
    { id: '8A', name: 'ថ្នាក់ទី 8A', room: 'គ្រូបន្ទុកថ្នាក់៖ វង ទី' },
    { id: '8B', name: 'ថ្នាក់ទី 8B', room: 'គ្រូបន្ទុកថ្នាក់៖ ហ៊ី ថាត' },
    { id: '8C', name: 'ថ្នាក់ទី 8C', room: 'គ្រូបន្ទុកថ្នាក់៖ ហ៊ុន សុខម៉េង' },
    { id: '7A', name: 'ថ្នាក់ទី 7A', room: 'គ្រូបន្ទុកថ្នាក់៖ ល័ក្ខ ណាគ្រី' },
    { id: '7B', name: 'ថ្នាក់ទី 7B', room: 'គ្រូបន្ទុកថ្នាក់៖ គ្រោះ រ៉ែម' },
    { id: '7C', name: 'ថ្នាក់ទី 7C', room: 'គ្រូបន្ទុកថ្នាក់៖ ខេង ស្រីខួច' },
  ];

  const teachers: TeacherItem[] = [
    // អក្សរសាស្ត្រខ្មែរ (K1 - K5)
    { id: 'K1', name: 'ជុំ សុជាតិ (K1)', subject: 'អក្សរសាស្ត្រខ្មែរ (K)', phone: 'ក៣.៣ | 22ម៉ (លើស 10ម៉)', maxHours: 22, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'K2', name: 'អ៊ុន លីដា (K2)', subject: 'អក្សរសាស្ត្រខ្មែរ (K)', phone: 'ក៣.១ | 21ម៉ (បន្ទុក 11B)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'K3', name: 'អែ សារឹម (K3)', subject: 'អក្សរសាស្ត្រខ្មែរ (K)', phone: 'ក៣.៤ | 21ម៉ (លើស 9ម៉)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'K4', name: 'ខេង ស្រីខួច (K4)', subject: 'អក្សរសាស្ត្រខ្មែរ (K)', phone: 'ក៣.៤ | K4+Em=21ម៉ (បន្ទុក 7C)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'K5', name: 'ល័ក្ខ ណាគ្រី (K5)', subject: 'អក្សរសាស្ត្រខ្មែរ (K)', phone: 'ខ២.៤ | K5+ES2=19ម៉ (បន្ទុក 7A)', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    // គណិតវិទ្យា (M1 - M4)
    { id: 'M1', name: 'ហាស់ សង្ហា (M1)', subject: 'គណិតវិទ្យា (M)', phone: 'ក៣.៣ | 20ម៉ (បន្ទុក 9A)', maxHours: 20, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'M2', name: 'ឆយ សុវ៉ាន់ណេត (M2)', subject: 'គណិតវិទ្យា (M)', phone: 'ក៣.៣ | 21ម៉ (បន្ទុក 10B)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'M3', name: 'ហ៊ុន សុខម៉េង (M3)', subject: 'គណិតវិទ្យា (M)', phone: 'ក៣.៤ | M3+En3=19ម៉ (បន្ទុក 8C)', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'M4', name: 'ប៊ុន សុផាត (M4)', subject: 'គណិតវិទ្យា (M)', phone: 'ខ១.៥ | M4+Ed4=27ម៉ (លើស 12ម៉)', maxHours: 27, unavailable: [], preferred: [], preferredShift: 'any' },
    // រូបវិទ្យា (P1 - P2)
    { id: 'P1', name: 'ហន ឈុនហាក់ (P1)', subject: 'រូបវិទ្យា (P)', phone: 'ក៣.៣ | 22ម៉ (បន្ទុក 10C)', maxHours: 22, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'P2', name: 'រី ដារ៉ូ (P2)', subject: 'រូបវិទ្យា (P)', phone: 'ខ៣.៣ | P2+En2=18ម៉ (បន្ទុក 9B)', maxHours: 18, unavailable: [], preferred: [], preferredShift: 'any' },
    // គីមីវិទ្យា (C1 - C2)
    { id: 'C1', name: 'ខាត់ ចន្ថា (C1)', subject: 'គីមីវិទ្យា (C)', phone: 'ក៣.៣ | 18ម៉ (បន្ទុក 10A)', maxHours: 18, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'C2', name: 'វង ទី (C2)', subject: 'គីមីវិទ្យា (C)', phone: 'ក៣.៤ | 20ម៉ (បន្ទុក 8A)', maxHours: 20, unavailable: [], preferred: [], preferredShift: 'any' },
    // ជីវវិទ្យា (B1 - B2)
    { id: 'B1', name: 'គុំ វណ្ណាត (B1)', subject: 'ជីវវិទ្យា (B)', phone: 'ក៣.៤ | 20ម៉ (បន្ទុក 12B)', maxHours: 20, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'B2', name: 'ហ៊ី ថាត (B2)', subject: 'ជីវវិទ្យា (B)', phone: 'ក៣.១ | 18ម៉ (បន្ទុក 8B)', maxHours: 18, unavailable: [], preferred: [], preferredShift: 'any' },
    // ផែនដី-បរិស្ថាន (ES1 - ES2)
    { id: 'ES1', name: 'គិន សុភា (ES1)', subject: 'ផែនដី-បរិស្ថាន (ES)', phone: 'ក៣.៣ | 19ម៉ (បន្ទុក 11C)', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'ES2', name: 'ល័ក្ខ ណាគ្រី (ES2)', subject: 'ផែនដី-បរិស្ថាន (ES)', phone: 'ខ២.៤ | ES2(7ម៉)+K5(12ម៉)=19ម៉', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    // ប្រវត្តិវិទ្យា (H1 - H3)
    { id: 'H1', name: 'សាយ ពិសិដ្ឋ (H1)', subject: 'ប្រវត្តិវិទ្យា (H)', phone: 'ក៣.៣ | 21ម៉ (បន្ទុក 11A)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'H2', name: 'ហូ សុធារិទ្ធ (H2)', subject: 'ប្រវត្តិវិទ្យា (H)', phone: 'ក៣.២ | H2(1ម៉)+G1(20ម៉)=21ម៉', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'H3', name: 'គ្រោះ រ៉ែម (H3)', subject: 'ប្រវត្តិវិទ្យា (H)', phone: 'ខ១.៦ | H3(3ម៉)+G2(16ម៉)=19ម៉', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    // ភូមិវិទ្យា (G1 - G2)
    { id: 'G1', name: 'ហូ សុធារិទ្ធ (G1)', subject: 'ភូមិវិទ្យា (G)', phone: 'ក៣.២ | 21ម៉ (បន្ទុក 12C)', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'G2', name: 'គ្រោះ រ៉ែម (G2)', subject: 'ភូមិវិទ្យា (G)', phone: 'ខ១.៦ | 19ម៉ (បន្ទុក 7B)', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    // សីលធម៌-ពលរដ្ឋវិជ្ជា (I1 - I4)
    { id: 'I1', name: 'មាឃ លឹមហ៊ាត (I1)', subject: 'សីលធម៌-ពលរដ្ឋវិជ្ជា (I)', phone: 'ក៣.៤ | 18ម៉ (បន្ទុក 12A)', maxHours: 18, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'I2', name: 'អ៊ុក សាវឿន (I2)', subject: 'សីលធម៌-ពលរដ្ឋវិជ្ជា (I)', phone: 'ក៣.២ | ហិរញ្ញិក (8ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'I3', name: 'ចែម ភាសាល (I3)', subject: 'សីលធម៌-ពលរដ្ឋវិជ្ជា (I)', phone: 'ក៣.៤ | បុគ្គលិកទីចាត់ការ (10ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'I4', name: 'អ៊ុក សាវឿន (I4)', subject: 'សីលធម៌-ពលរដ្ឋវិជ្ជា (I)', phone: 'ក៣.២ | ហិរញ្ញិក (8AC)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    // ភាសាអង់គ្លេស (En1 - En4)
    { id: 'En1', name: 'អុន សុគន្ធា (En1)', subject: 'ភាសាអង់គ្លេស (En)', phone: 'ក៣.៣ | បុគ្គលិកទីចាត់ការ (20ម៉)', maxHours: 20, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'En2', name: 'រី ដារ៉ូ / មាឃ លឹមហ៊ាត (En2)', subject: 'ភាសាអង់គ្លេស (En)', phone: '9B (4ម៉)', maxHours: 18, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'En3', name: 'ហ៊ុន សុខម៉េង (En3)', subject: 'ភាសាអង់គ្លេស (En)', phone: 'ក៣.៤ | En3(4ម៉)+M3(15ម៉)=19ម៉', maxHours: 19, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'En4', name: 'ហ៊ុន ឈឿន (En4)', subject: 'ភាសាអង់គ្លេស (En)', phone: 'ក៣.២ | លេខា (8ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    // អប់រំកាយ-កីឡា (Ed1 - Ed4)
    { id: 'Ed1', name: 'ហ៊ុល ហាក់ (Ed1)', subject: 'អប់រំកាយ-កីឡា (Ed)', phone: 'ក១.៦ | នាយកសាលា (8ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'Ed2', name: 'ស៊ី វណ្ណា (Ed2)', subject: 'អប់រំកាយ-កីឡា (Ed)', phone: 'ក២.៣ | នាយករង (8ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'Ed3', name: 'ម៉ែន យុទ្ធា (Ed3)', subject: 'អប់រំកាយ-កីឡា (Ed)', phone: 'ខ២.៣ | បណ្ណារក្ស (10ម៉)', maxHours: 12, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'Ed4', name: 'ប៊ុន សុផាត (Ed4)', subject: 'អប់រំកាយ-កីឡា (Ed)', phone: 'ខ១.៥ | Ed4(2ម៉)+M4(25ម៉)=27ម៉', maxHours: 27, unavailable: [], preferred: [], preferredShift: 'any' },
    // សេដ្ឋកិច្ច & ពលកម្ម
    { id: 'Em1', name: 'ខេង ស្រីខួច (Em)', subject: 'សេដ្ឋកិច្ច (Em)', phone: 'ក៣.៤ | Em(9ម៉)+K4(12ម៉)=21ម៉', maxHours: 21, unavailable: [], preferred: [], preferredShift: 'any' },
    { id: 'L1', name: 'គ្រូបន្ទុកថ្នាក់ (ពលកម្ម)', subject: 'ពលកម្ម', phone: '-', maxHours: 24, unavailable: [], preferred: [], preferredShift: 'any' },
  ];

  const rawMatrix: Record<string, Record<string, Record<string, string>>> = {
    '12A': {
      mon: { p1: 'C1', p2: 'C1', p3: 'ES1', p4: 'ES1', p5: 'I1', p7: 'K1', p8: 'G1', p9: 'H1' },
      tue: { p1: 'B2', p2: 'B2', p3: 'G1', p4: 'G1', p8: 'I1' },
      wed: { p1: 'K1', p2: 'K1', p3: 'P1', p4: 'P1', p5: 'M2' },
      thu: { p1: 'K1', p2: 'K1', p3: 'H1', p4: 'H1', p5: 'M2' },
      fri: { p1: 'P1', p2: 'P1', p5: 'M2' },
      sat: { p3: 'En1', p4: 'En1' },
    },
    '12B': {
      mon: { p1: 'I1', p2: 'I1', p3: 'C1', p4: 'C1', p7: 'B1', p8: 'B1', p9: 'K1' },
      tue: { p1: 'G1', p2: 'G1', p3: 'ES1', p4: 'ES1' },
      wed: { p1: 'H1', p2: 'I1', p3: 'K1', p4: 'K1' },
      thu: { p1: 'H1', p2: 'H1', p3: 'M2', p4: 'M2' },
      fri: { p1: 'K1', p2: 'K1', p3: 'G1', p4: 'M2' },
      sat: { p1: 'En1', p2: 'En1', p3: 'P1', p4: 'P1' },
    },
    '12C': {
      mon: { p1: 'K2', p2: 'K2', p3: 'M1', p4: 'M1', p7: 'H1', p8: 'H1', p9: 'B1' },
      tue: { p1: 'ES1', p2: 'ES1', p3: 'I1', p4: 'I1', p5: 'K2' },
      wed: { p1: 'M1', p2: 'P1', p3: 'C2', p4: 'C2' },
      thu: { p1: 'G1', p2: 'G1', p3: 'B1', p4: 'B1', p5: 'C2' },
      fri: { p1: 'En1', p2: 'En1' },
      sat: { p1: 'P1', p2: 'P1', p3: 'M1', p4: 'M1' },
    },
    '11A': {
      mon: { p1: 'M1', p2: 'M1', p3: 'En1', p4: 'En1', p5: 'B1', p6: 'I1', p7: 'I1', p8: 'C2' },
      tue: { p1: 'M1', p2: 'M1', p3: 'K2', p4: 'K2', p5: 'P1', p6: 'Ed3', p7: 'Ed3', p8: 'P1', p9: 'P1' },
      wed: { p1: 'C2', p2: 'C2', p3: 'ES1', p4: 'ES1', p5: 'K2' },
      thu: { p1: 'B1', p2: 'B1', p3: 'Em1', p4: 'Em1' },
      fri: { p1: 'H1', p2: 'H1', p3: 'M1' },
      sat: { p1: 'G1', p2: 'G1' },
    },
    '11B': {
      mon: { p1: 'Ed3', p2: 'Ed3', p3: 'K2', p4: 'K2', p5: 'P1', p7: 'K2', p8: 'P1', p9: 'P1' },
      tue: { p1: 'Em1', p2: 'Em1', p3: 'H1', p4: 'H1', p5: 'M1' },
      wed: { p1: 'ES1', p2: 'ES1', p3: 'B1', p4: 'B1', p5: 'C2' },
      thu: { p1: 'C2', p2: 'C2', p3: 'I1', p4: 'I1', p5: 'B1' },
      fri: { p1: 'M1', p2: 'M1', p3: 'En1', p4: 'En1' },
      sat: { p1: 'M1', p2: 'M1', p3: 'G1', p4: 'G1' },
    },
    '11C': {
      mon: { p1: 'B1', p2: 'B1', p3: 'H1', p4: 'H1', p8: 'Ed3', p9: 'Ed3' },
      tue: { p1: 'I1', p2: 'I1', p3: 'En1', p4: 'En1', p5: 'C2', p6: 'P1', p7: 'P1', p8: 'K3' },
      wed: { p1: 'P1', p2: 'M3', p3: 'Em1', p4: 'Em1', p5: 'B1' },
      thu: { p1: 'ES1', p2: 'ES1', p3: 'C2', p4: 'C2' },
      fri: { p1: 'G1', p2: 'G1', p3: 'M3', p4: 'M3' },
      sat: { p1: 'K3', p2: 'K3', p3: 'M3', p4: 'M3' },
    },
    '10A': {
      mon: { p1: 'B2', p2: 'B2', p3: 'K1', p4: 'K1', p5: 'H1' },
      tue: { p1: 'En1', p2: 'En1', p3: 'C1', p4: 'C1', p5: 'Em1', p6: 'K1', p7: 'K1', p8: 'ES1', p9: 'ES1' },
      wed: { p1: 'M2', p2: 'M2', p3: 'G1', p4: 'G1' },
      thu: { p1: 'I1', p2: 'I1', p3: 'K1', p4: 'K1' },
      fri: { p1: 'M2', p2: 'M2' },
      sat: { p1: 'Ed2', p2: 'Ed2', p3: 'P2', p4: 'P2' },
    },
    '10B': {
      mon: { p1: 'ES1', p2: 'ES1', p3: 'B2', p4: 'B2', p5: 'Em1', p8: 'K2', p9: 'K2' },
      tue: { p1: 'C1', p2: 'C1', p3: 'P1', p4: 'P1', p6: 'En2', p7: 'En1' },
      wed: { p1: 'K2', p2: 'K2', p3: 'M2', p4: 'M2', p5: 'H1', p6: 'M2', p7: 'M2' },
      thu: { p1: 'Ed2', p2: 'Ed2', p3: 'G1', p4: 'G1', p6: 'M2' },
      fri: { p1: 'K2', p2: 'K2', p3: 'M2' },
      sat: { p1: 'I2', p2: 'I2' },
    },
    '10C': {
      mon: { p1: 'P1', p2: 'P1', p3: 'Em1', p4: 'G1', p5: 'G1', p8: 'C1', p9: 'C1' },
      tue: { p1: 'Ed2', p2: 'Ed2', p3: 'B2', p4: 'B2', p5: 'H1' },
      wed: { p1: 'K3', p2: 'K3', p3: 'En1', p4: 'En1', p8: 'M2', p9: 'M2' },
      thu: { p1: 'M2', p2: 'M2', p3: 'K3', p4: 'K3', p7: 'M2' },
      fri: { p1: 'I2', p2: 'I2', p3: 'K3', p4: 'K3' },
      sat: { p1: 'ES2', p2: 'ES2' },
    },
    '9A': {
      mon: { p1: 'K1', p2: 'K1', p3: 'I1', p4: 'I1', p6: 'P1', p7: 'P1', p8: 'M1' },
      tue: { p1: 'K1', p2: 'K1', p3: 'M1', p4: 'M1', p5: 'ES2' },
      wed: { p1: 'C1', p2: 'C1', p3: 'B2', p4: 'B2' },
      thu: { p1: 'En1', p2: 'En1', p3: 'M1', p4: 'M1', p5: 'H1' },
      fri: { p1: 'Ed3', p2: 'Ed3', p3: 'K1', p4: 'K1' },
      sat: { p1: 'G2', p2: 'G2' },
    },
    '9B': {
      mon: { p1: 'I2', p2: 'I2', p3: 'Ed3', p4: 'Ed3', p5: 'M3', p7: 'H2', p8: 'En2', p9: 'En2' },
      tue: { p1: 'K2', p2: 'K2', p3: 'G2', p4: 'G2' },
      wed: { p1: 'B2', p2: 'B2', p3: 'M3', p4: 'M3' },
      thu: { p1: 'M3', p2: 'M3', p3: 'K2', p4: 'K2' },
      fri: { p1: 'C2', p2: 'C2', p3: 'K2', p4: 'K2' },
      sat: { p1: 'P2', p2: 'P2', p3: 'ES2' },
    },
    '8A': {
      mon: { p1: 'P2', p2: 'P2', p3: 'G2', p4: 'G2', p5: 'ES2', p7: 'M4', p8: 'K4', p9: 'K4' },
      tue: { p1: 'I4', p2: 'I4', p3: 'K4', p4: 'K4', p7: 'K4', p8: 'K4', p9: 'H3' },
      wed: { p1: 'Ed1', p2: 'Ed1', p3: 'M4', p4: 'M4' },
      thu: { p1: 'B2', p2: 'B2', p3: 'En3', p4: 'En3' },
      fri: { p1: 'M4', p2: 'M4' },
      sat: { p1: 'C2', p2: 'C2' },
    },
    '8B': {
      mon: { p1: 'En3', p2: 'En3', p3: 'M4', p4: 'M4', p7: 'B2', p8: 'B2', p9: 'K3' },
      tue: { p1: 'Ed1', p2: 'Ed1', p3: 'M4', p4: 'K3', p5: 'K3', p7: 'I3', p8: 'I3' },
      wed: { p1: 'H3', p2: 'ES2', p3: 'K3', p4: 'K3' },
      thu: { p1: 'M4', p2: 'M4', p3: 'G2', p4: 'G2' },
      fri: { p1: 'P2', p2: 'P2', p3: 'C2', p4: 'C2' },
      sat: { p1: 'I3', p2: 'I3', p3: 'K3', p4: 'K3' },
    },
    '8C': {
      mon: { p1: 'Ed1', p2: 'Ed1', p3: 'M3', p4: 'M3', p7: 'K3', p8: 'K3' },
      tue: { p1: 'K3', p2: 'K3', p3: 'P2', p4: 'En4', p5: 'En4', p7: 'B2', p8: 'B2' },
      wed: { p1: 'M3', p2: 'H3', p3: 'ES2' },
      thu: { p1: 'G2', p2: 'G2', p3: 'P2' },
      fri: { p1: 'K3', p2: 'K3', p3: 'I4', p4: 'I4' },
      sat: { p1: 'M3', p2: 'M3', p3: 'C2', p4: 'C2' },
    },
    '7A': {
      mon: { p1: 'K5', p2: 'K5', p3: 'B1', p4: 'B1', p7: 'ES1', p8: 'I3', p9: 'I3' },
      tue: { p1: 'M4', p2: 'M4', p3: 'K5', p4: 'K5', p7: 'C1', p8: 'C1' },
      wed: { p1: 'P2', p2: 'M4', p3: 'H1' },
      thu: { p1: 'En4', p2: 'En4', p3: 'M4', p4: 'M4' },
      fri: { p1: 'K5', p2: 'K5', p3: 'P2' },
      sat: { p1: 'Ed1', p2: 'Ed1', p3: 'G2', p4: 'G2' },
    },
    '7B': {
      mon: { p1: 'G2', p2: 'G2', p3: 'K5', p4: 'K5', p6: 'P2', p7: 'P2', p8: 'ES1' },
      tue: { p1: 'K5', p2: 'K5', p3: 'B1', p4: 'B1' },
      wed: { p3: 'M4', p4: 'C1' },
      thu: { p1: 'K5', p2: 'K5', p3: 'Ed2', p4: 'Ed2' },
      fri: { p1: 'I3', p2: 'I3', p3: 'M4', p4: 'M4' },
      sat: { p1: 'En4', p2: 'En4', p3: 'M4', p4: 'M4' },
    },
    '7C': {
      mon: { p1: 'M4', p2: 'M4', p3: 'P2', p4: 'P2', p6: 'K4', p7: 'K4', p8: 'M4', p9: 'ES1' },
      tue: { p1: 'H1', p2: 'B1', p7: 'Ed4', p8: 'Ed4', p9: 'B1' },
      wed: { p1: 'K4', p2: 'K4', p3: 'G2', p4: 'G2' },
      thu: { p1: 'K4', p2: 'K4', p3: 'C1', p4: 'C1' },
      fri: { p1: 'En4', p2: 'En4' },
      sat: { p1: 'M4', p2: 'M4', p3: 'I3', p4: 'I3' },
    },
  };

  const schedule: ScheduleSlot[] = [];
  let idCounter = 1;

  Object.keys(rawMatrix).forEach((classId) => {
    const daysObj = rawMatrix[classId];
    Object.keys(daysObj).forEach((dayId) => {
      const periodsObj = daysObj[dayId];
      Object.keys(periodsObj).forEach((periodId) => {
        const teacherCode = periodsObj[periodId];
        const teacher = teachers.find((t) => t.id === teacherCode);
        if (teacher) {
          schedule.push({
            id: 's_' + idCounter++,
            day: dayId,
            period: periodId,
            classId,
            teacherId: teacher.id,
            subjectName: teacher.subject,
            note: teacherCode === 'L1' ? 'ពលកម្ម' : `កូដ៖ ${teacherCode}`,
          });
        }
      });
    });
  });

  return {
    viewMode: 'class',
    subjects,
    teachers,
    classes,
    schedule,
    officialServicePlan: schedule.map((s) => ({
      classId: s.classId,
      teacherId: s.teacherId,
      subjectName: s.subjectName,
      note: s.note,
    })),
    serviceRoster: JSON.parse(JSON.stringify(OFFICIAL_SERVICE_ROSTER)),
    administration: {
      schoolName: 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី',
      items: JSON.parse(JSON.stringify(ADMIN_DEFAULT_ITEMS)),
    },
    curriculumProfiles: {},
  };
}
