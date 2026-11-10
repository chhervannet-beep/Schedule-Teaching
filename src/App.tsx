/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Save,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  Printer,
  Table,
  Grid,
  Users,
  BookOpen,
  UserCheck,
  Building2,
  FolderKanban,
  BarChart3,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  ArrowUpDown,
  FileText,
  Tag,
} from 'lucide-react';
import {
  STORAGE_KEY,
  LAST_SAVED_KEY,
  DAYS,
  PERIODS,
  COLOR_STYLES,
  OFFICIAL_SERVICE_ROSTER,
  ROSTER_FIELDS,
  ADMIN_DEFAULT_ITEMS,
  ADMIN_ROLES,
  PROFILE_LABELS,
  TRADITIONAL_HOURS,
  buildOfficialSchoolSchedule,
  type AppState,
  type ColorKey,
  type ScheduleSlot,
  type ServiceRosterItem,
  type AdminChronoItem,
  type AdminRoleKey,
  type ClassItem,
} from './data/schoolData';

type TabKey =
  | 'timetable'
  | 'master'
  | 'service'
  | 'curriculum'
  | 'teachers'
  | 'classes'
  | 'administration'
  | 'reports';

interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error' | 'warning';
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

function getDefaultProfileKeyForClass(classObj: ClassItem): string {
  if (classObj.curriculumProfile) return classObj.curriculumProfile;
  const m = classObj.id.match(/^(\d+)([A-Z])$/);
  if (!m) return '10';
  const grade = m[1];
  const letter = m[2];
  if (grade === '11' || grade === '12') {
    return letter === 'C' ? `${grade}_social` : `${grade}_science`;
  }
  return grade;
}

function ensureCurriculumProfilesOnState(s: AppState): AppState {
  const next: AppState = {
    ...s,
    classes: s.classes.map((c) => ({
      ...c,
      curriculumProfile: c.curriculumProfile || getDefaultProfileKeyForClass(c),
    })),
    teachers: s.teachers.map((t) => ({
      ...t,
      unavailable: Array.isArray(t.unavailable) ? t.unavailable : [],
      preferred: Array.isArray(t.preferred) ? t.preferred : [],
      preferredShift: t.preferredShift || 'any',
    })),
  };

  if (!next.serviceRoster || !Array.isArray(next.serviceRoster) || next.serviceRoster.length === 0) {
    next.serviceRoster = JSON.parse(JSON.stringify(OFFICIAL_SERVICE_ROSTER));
  }

  if (!next.administration || !Array.isArray(next.administration.items)) {
    next.administration = {
      schoolName: 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី',
      items: JSON.parse(JSON.stringify(ADMIN_DEFAULT_ITEMS)),
    };
  }

  const profiles: Record<string, Record<string, number>> = { ...(next.curriculumProfiles || {}) };
  Object.keys(PROFILE_LABELS).forEach((pKey) => {
    if (!profiles[pKey]) profiles[pKey] = {};
    const repClass = next.classes.find((c) => c.curriculumProfile === pKey);
    next.subjects.forEach((sub) => {
      if (typeof profiles[pKey][sub.name] !== 'number') {
        const planSlots = repClass
          ? (next.officialServicePlan || next.schedule || []).filter(
              (slot) => slot.classId === repClass.id && slot.subjectName === sub.name
            ).length
          : 0;
        if (planSlots > 0) {
          profiles[pKey][sub.name] = planSlots;
        } else if (sub.code && (pKey.endsWith('_science') || pKey.endsWith('_social'))) {
          const stream = pKey.endsWith('_social') ? 'social' : 'science';
          profiles[pKey][sub.name] = TRADITIONAL_HOURS[stream][sub.code] ?? (sub.hoursPerWeek || 0);
        } else {
          profiles[pKey][sub.name] = sub.code === 'L' ? 0 : sub.hoursPerWeek || 2;
        }
      }
    });
  });

  next.curriculumProfiles = profiles;
  return next;
}

function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      const defaults = buildOfficialSchoolSchedule();
      if (!parsed.officialServicePlan || parsed.officialServicePlan.length === 0) {
        parsed.officialServicePlan = defaults.officialServicePlan;
      }
      if (Array.isArray(parsed.subjects)) {
        parsed.subjects = parsed.subjects.map((sub) => {
          const def = defaults.subjects.find((d) => d.name === sub.name);
          return {
            ...sub,
            code: sub.code || (def ? def.code : undefined),
            hoursPerWeek: typeof sub.hoursPerWeek === 'number' ? sub.hoursPerWeek : def ? def.hoursPerWeek : 2,
          };
        });
      }
      return ensureCurriculumProfilesOnState(parsed);
    }
  } catch (e) {
    console.error('Failed to load schedule from localStorage', e);
  }
  return ensureCurriculumProfilesOnState(buildOfficialSchoolSchedule());
}

function formatCodeSubscript(code: string): React.ReactNode {
  if (!code) return null;
  if (code === 'L1') {
    return <span className="text-[10px] font-bold text-rose-700">ពលកម្ម</span>;
  }
  const match = code.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return (
      <span>
        {match[1]}
        <sub className="text-[9px] font-bold">{match[2]}</sub>
      </span>
    );
  }
  return <span>{code}</span>;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [lastSavedText, setLastSavedText] = useState<string>(() => {
    return localStorage.getItem(LAST_SAVED_KEY) || '';
  });
  const [activeTab, setActiveTab] = useState<TabKey>('timetable');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Timetable tab controls
  const [entitySelect, setEntitySelect] = useState<string>(() => {
    const initial = loadInitialState();
    return initial.classes[0]?.id || '12A';
  });
  const [shiftSelect, setShiftSelect] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [dragPayload, setDragPayload] = useState<{ day: string; period: string } | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Master tab controls
  const [masterShiftFilter, setMasterShiftFilter] = useState<'both' | 'morning' | 'afternoon'>('both');
  const [masterGradeFilter, setMasterGradeFilter] = useState<'all' | 'high' | 'low'>('all');
  const [masterColorize, setMasterColorize] = useState<boolean>(true);

  // Service Roster tab controls
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [serviceFilterSub, setServiceFilterSub] = useState<string>('all');

  // Curriculum tab controls
  const [selectedCurriculumProfile, setSelectedCurriculumProfile] = useState<string>('12_science');
  const [rulePreferWishes, setRulePreferWishes] = useState<boolean>(true);
  const [ruleRespectUnavailable, setRuleRespectUnavailable] = useState<boolean>(true);
  const [ruleDoubleBlocks, setRuleDoubleBlocks] = useState<boolean>(true);
  const [ruleSpreadDays, setRuleSpreadDays] = useState<boolean>(true);
  const [ruleMorningCore, setRuleMorningCore] = useState<boolean>(true);
  const [prefMatrixSearch, setPrefMatrixSearch] = useState<string>('');

  // Teachers tab controls
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [newTeacherCode, setNewTeacherCode] = useState<string>('');
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherSub, setNewTeacherSub] = useState<string>(() => state.subjects[0]?.name || '');
  const [newTeacherMax, setNewTeacherMax] = useState<number>(20);
  const [newTeacherPhone, setNewTeacherPhone] = useState<string>('');

  // Classes & Subjects tab controls
  const [newClassId, setNewClassId] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassRoom, setNewClassRoom] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubColor, setNewSubColor] = useState<ColorKey>('indigo');
  const [newSubHours, setNewSubHours] = useState<number>(2);

  // Administration tab controls
  const [adminCurrentRole, setAdminCurrentRole] = useState<'ALL' | AdminRoleKey>('ALL');
  const [adminCurrentView, setAdminCurrentView] = useState<'table' | 'spine'>('table');
  const [adminSearchText, setAdminSearchText] = useState<string>('');

  // Modals state
  const [slotModal, setSlotModal] = useState<{
    isOpen: boolean;
    dayId: string;
    periodId: string;
    classId: string;
    subjectName: string;
    teacherId: string;
    note: string;
  }>({
    isOpen: false,
    dayId: 'mon',
    periodId: 'p1',
    classId: '12A',
    subjectName: '',
    teacherId: '',
    note: '',
  });

  const [availModalTeacherId, setAvailModalTeacherId] = useState<string | null>(null);
  const [autoModalOpen, setAutoModalOpen] = useState<boolean>(false);
  const [autoModalScope, setAutoModalScope] = useState<string>('all');
  const [autoModalMode, setAutoModalMode] = useState<'official' | 'curriculum'>('official');

  const [rosterModalIndex, setRosterModalIndex] = useState<number | null>(null);
  const [rosterForm, setRosterForm] = useState<Record<string, string>>({});

  const [adminModal, setAdminModal] = useState<{
    isOpen: boolean;
    editId: number | null;
    role: AdminRoleKey;
    code: string;
    category: string;
    title: string;
  }>({
    isOpen: false,
    editId: null,
    role: 'FINANCE',
    code: '',
    category: '',
    title: '',
  });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    teacherId: string;
    currentName: string;
  }>({
    isOpen: false,
    teacherId: '',
    currentName: '',
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: 'info' | 'error' | 'warning' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const askConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; isDanger?: boolean }
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: options?.confirmLabel,
      isDanger: options?.isDanger,
      onConfirm,
    });
  };

  // Persist to localStorage automatically whenever state changes
  const saveToDisk = (nextState: AppState, showFeedback = false) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      const now = new Date();
      const timeStr = now.toLocaleTimeString('km-KH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      localStorage.setItem(LAST_SAVED_KEY, timeStr);
      setLastSavedText(timeStr);
      if (showFeedback) {
        showToast('💾 បានរក្សាទុកទិន្នន័យទាំងអស់ដោយជោគជ័យ!', 'info');
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      if (showFeedback) {
        showToast('⚠️ មិនអាចរក្សាទុកទិន្នន័យបានទេ!', 'error');
      }
    }
  };

  const updateState = (updater: (prev: AppState) => AppState, showFeedback = false) => {
    setState((prev) => {
      const updated = updater(prev);
      saveToDisk(updated, showFeedback);
      return updated;
    });
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveToDisk(state, true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Helpers
  const getSubjectStyle = (subName: string) => {
    const sub = state.subjects.find((s) => s.name === subName);
    const colorKey: ColorKey = sub?.color || 'indigo';
    return COLOR_STYLES[colorKey] || COLOR_STYLES.indigo;
  };

  const getTeacherById = (id: string) => state.teachers.find((t) => t.id === id);
  const getClassById = (id: string) => state.classes.find((c) => c.id === id);

  const findConflicts = () => {
    const conflicts: Array<{
      day: string;
      period: string;
      teacherId: string;
      classes: string[];
    }> = [];
    const map: Record<string, string[]> = {};
    state.schedule.forEach((slot) => {
      const key = `${slot.day}_${slot.period}_${slot.teacherId}`;
      if (!map[key]) map[key] = [];
      map[key].push(slot.classId);
    });
    Object.keys(map).forEach((key) => {
      if (map[key].length > 1) {
        const [day, period, teacherId] = key.split('_');
        conflicts.push({ day, period, teacherId, classes: map[key] });
      }
    });
    return conflicts;
  };

  const conflicts = findConflicts();

  // Mode switch
  const switchViewMode = (mode: 'class' | 'teacher') => {
    const firstId =
      mode === 'class' ? state.classes[0]?.id || '12A' : state.teachers[0]?.id || 'K1';
    setEntitySelect(firstId);
    updateState((prev) => ({ ...prev, viewMode: mode }));
  };

  const jumpToTimetable = (mode: 'class' | 'teacher', id: string) => {
    setEntitySelect(id);
    updateState((prev) => ({ ...prev, viewMode: mode }));
    setActiveTab('timetable');
  };

  // Slot Modal Open
  const openSlotModal = (dayId: string, periodId: string, overrideClassId?: string) => {
    const isClassMode = state.viewMode === 'class' || Boolean(overrideClassId);
    const currentEntity = overrideClassId || entitySelect;

    let slot: ScheduleSlot | undefined;
    if (overrideClassId) {
      slot = state.schedule.find(
        (s) => s.day === dayId && s.period === periodId && s.classId === overrideClassId
      );
    } else if (state.viewMode === 'class') {
      slot = state.schedule.find(
        (s) => s.day === dayId && s.period === periodId && s.classId === currentEntity
      );
    } else {
      slot = state.schedule.find(
        (s) => s.day === dayId && s.period === periodId && s.teacherId === currentEntity
      );
    }

    const defaultClassId = isClassMode
      ? currentEntity
      : slot?.classId || state.classes[0]?.id || '12A';
    const defaultSubject =
      slot?.subjectName ||
      (!isClassMode
        ? getTeacherById(currentEntity)?.subject || state.subjects[0]?.name || ''
        : state.subjects[0]?.name || '');
    const defaultTeacherId = slot?.teacherId || (!isClassMode ? currentEntity : '');

    // Pick first matching teacher if empty
    let resolvedTeacherId = defaultTeacherId;
    if (!resolvedTeacherId) {
      const matchingTeachers = state.teachers.filter((t) => t.subject === defaultSubject);
      resolvedTeacherId = matchingTeachers[0]?.id || state.teachers[0]?.id || '';
    }

    setSlotModal({
      isOpen: true,
      dayId,
      periodId,
      classId: defaultClassId,
      subjectName: defaultSubject,
      teacherId: resolvedTeacherId,
      note: slot?.note || '',
    });
  };

  const saveSlotModal = () => {
    const { dayId, periodId, classId, subjectName, teacherId, note } = slotModal;
    if (!classId || !subjectName || !teacherId) {
      showToast('សូមជ្រើសរើស ថ្នាក់ មុខវិជ្ជា និងគ្រូបង្រៀន!', 'error');
      return;
    }

    const teacherConflict = state.schedule.find(
      (s) =>
        s.day === dayId &&
        s.period === periodId &&
        s.teacherId === teacherId &&
        s.classId !== classId
    );
    if (teacherConflict) {
      const cObj = getClassById(teacherConflict.classId);
      const tObj = getTeacherById(teacherId);
      showToast(
        `⚠️ ប៉ះម៉ោងគ្រូ! ${tObj?.name || teacherId} កំពុងបង្រៀននៅ ${cObj?.name || teacherConflict.classId} រួចហើយ!`,
        'error'
      );
      return;
    }

    updateState((prev) => {
      const filtered = prev.schedule.filter(
        (s) => !(s.day === dayId && s.period === periodId && s.classId === classId)
      );
      return {
        ...prev,
        schedule: [
          ...filtered,
          {
            id: 's_' + Date.now(),
            day: dayId,
            period: periodId,
            classId,
            teacherId,
            subjectName,
            note: note.trim(),
          },
        ],
      };
    });

    setSlotModal((prev) => ({ ...prev, isOpen: false }));
    showToast('បានរក្សាទុកម៉ោងសិក្សាដោយជោគជ័យ!');
  };

  const deleteSlotFromModal = () => {
    const { dayId, periodId, classId } = slotModal;
    updateState((prev) => ({
      ...prev,
      schedule: prev.schedule.filter(
        (s) => !(s.day === dayId && s.period === periodId && s.classId === classId)
      ),
    }));
    setSlotModal((prev) => ({ ...prev, isOpen: false }));
    showToast('បានលុបម៉ោងសិក្សា!');
  };

  // Drag and Drop handlers
  const handleCellDrop = (targetDay: string, targetPeriod: string) => {
    setDragOverKey(null);
    if (!dragPayload) return;
    const { day: srcDay, period: srcPeriod } = dragPayload;
    setDragPayload(null);
    if (srcDay === targetDay && srcPeriod === targetPeriod) return;

    const isClassMode = state.viewMode === 'class';
    const currentEntity = entitySelect;

    if (isClassMode) {
      const srcSlot = state.schedule.find(
        (s) => s.day === srcDay && s.period === srcPeriod && s.classId === currentEntity
      );
      const dstSlot = state.schedule.find(
        (s) => s.day === targetDay && s.period === targetPeriod && s.classId === currentEntity
      );
      if (!srcSlot) return;

      const srcTeacherConflict = state.schedule.find(
        (s) =>
          s.day === targetDay &&
          s.period === targetPeriod &&
          s.teacherId === srcSlot.teacherId &&
          s.classId !== currentEntity
      );
      if (srcTeacherConflict) {
        const t = getTeacherById(srcSlot.teacherId);
        showToast(
          `មិនអាចប្ដូរបានទេ! ${t ? t.name : ''} ជាប់បង្រៀនថ្នាក់ ${srcTeacherConflict.classId} នៅម៉ោងនោះ!`,
          'error'
        );
        return;
      }

      if (dstSlot) {
        const dstTeacherConflict = state.schedule.find(
          (s) =>
            s.day === srcDay &&
            s.period === srcPeriod &&
            s.teacherId === dstSlot.teacherId &&
            s.classId !== currentEntity
        );
        if (dstTeacherConflict) {
          const t = getTeacherById(dstSlot.teacherId);
          showToast(
            `មិនអាចប្ដូរបានទេ! ${t ? t.name : ''} ជាប់បង្រៀនថ្នាក់ ${dstTeacherConflict.classId} នៅម៉ោងដើម!`,
            'error'
          );
          return;
        }
      }

      updateState((prev) => ({
        ...prev,
        schedule: prev.schedule.map((s) => {
          if (s.id === srcSlot.id) {
            return { ...s, day: targetDay, period: targetPeriod };
          }
          if (dstSlot && s.id === dstSlot.id) {
            return { ...s, day: srcDay, period: srcPeriod };
          }
          return s;
        }),
      }));
      showToast('បានផ្លាស់ប្ដូរម៉ោងសិក្សាដោយជោគជ័យ!');
    } else {
      const srcSlot = state.schedule.find(
        (s) => s.day === srcDay && s.period === srcPeriod && s.teacherId === currentEntity
      );
      const dstSlot = state.schedule.find(
        (s) => s.day === targetDay && s.period === targetPeriod && s.teacherId === currentEntity
      );
      if (!srcSlot) return;

      const classBusyAtTarget = state.schedule.find(
        (s) =>
          s.day === targetDay &&
          s.period === targetPeriod &&
          s.classId === srcSlot.classId &&
          s.teacherId !== currentEntity
      );
      if (classBusyAtTarget) {
        showToast(
          `មិនអាចប្ដូរបានទេ! ថ្នាក់ ${srcSlot.classId} មានម៉ោងសិក្សារួចហើយនៅម៉ោងនោះ!`,
          'error'
        );
        return;
      }

      if (dstSlot) {
        const dstClassBusyAtSrc = state.schedule.find(
          (s) =>
            s.day === srcDay &&
            s.period === srcPeriod &&
            s.classId === dstSlot.classId &&
            s.teacherId !== currentEntity
        );
        if (dstClassBusyAtSrc) {
          showToast(
            `មិនអាចប្ដូរបានទេ! ថ្នាក់ ${dstSlot.classId} មានម៉ោងសិក្សារួចហើយនៅម៉ោងដើម!`,
            'error'
          );
          return;
        }
      }

      updateState((prev) => ({
        ...prev,
        schedule: prev.schedule.map((s) => {
          if (s.id === srcSlot.id) {
            return { ...s, day: targetDay, period: targetPeriod };
          }
          if (dstSlot && s.id === dstSlot.id) {
            return { ...s, day: srcDay, period: srcPeriod };
          }
          return s;
        }),
      }));
      showToast('បានផ្លាស់ប្ដូរម៉ោងបង្រៀនដោយជោគជ័យ!');
    }
  };

  // Auto-scheduler algorithm
  const runSmartScheduler = (
    targetClassId: string,
    mode: 'official' | 'curriculum',
    rules: {
      preferWishes: boolean;
      respectUnavailable: boolean;
      doubleBlocks: boolean;
      spreadDays: boolean;
      morningCore: boolean;
    }
  ) => {
    const classesToFill =
      targetClassId === 'all'
        ? state.classes
        : state.classes.filter((c) => c.id === targetClassId);

    let nextSchedule: ScheduleSlot[] =
      targetClassId === 'all'
        ? []
        : state.schedule.filter((s) => s.classId !== targetClassId);

    const isSlotBusyForTeacher = (tId: string, day: string, period: string) =>
      nextSchedule.some((s) => s.teacherId === tId && s.day === day && s.period === period);

    const isSlotBusyForClass = (cId: string, day: string, period: string) =>
      nextSchedule.some((s) => s.classId === cId && s.day === day && s.period === period);

    const getTeacherLoad = (tId: string) =>
      nextSchedule.filter((s) => s.teacherId === tId).length;

    const isTeacherUnavailable = (teacher: { unavailable?: string[] }, day: string, period: string) => {
      if (!rules.respectUnavailable) return false;
      return Array.isArray(teacher.unavailable) && teacher.unavailable.includes(`${day}_${period}`);
    };

    const isTeacherPreferredSlot = (
      teacher: { preferred?: string[]; preferredShift?: string },
      day: string,
      period: string
    ) => {
      if (!rules.preferWishes) return 0;
      let bonus = 0;
      if (Array.isArray(teacher.preferred) && teacher.preferred.includes(`${day}_${period}`)) {
        bonus += 35;
      }
      const pObj = PERIODS.find((p) => p.id === period);
      if (teacher.preferredShift && teacher.preferredShift !== 'any' && pObj) {
        if (teacher.preferredShift === pObj.shift) bonus += 15;
        else bonus -= 10;
      }
      return bonus;
    };

    let addedCount = 0;
    let skippedCount = 0;

    interface TaskBlock {
      classId: string;
      teacherId: string;
      subjectName: string;
      size: number;
      isCore: boolean;
    }

    const allTasks: TaskBlock[] = [];

    classesToFill.forEach((cls) => {
      const existingClassSlots = nextSchedule.filter((s) => s.classId === cls.id);
      const subjectTeacherPairs: Record<
        string,
        { subjectName: string; teacherId: string; count: number }
      > = {};

      if (mode === 'official') {
        const officialPlan =
          state.officialServicePlan && state.officialServicePlan.length > 0
            ? state.officialServicePlan
            : buildOfficialSchoolSchedule().officialServicePlan;

        const classPlan = officialPlan.filter((p) => p.classId === cls.id);
        classPlan.forEach((item) => {
          const key = `${item.subjectName}__${item.teacherId}`;
          if (!subjectTeacherPairs[key]) {
            subjectTeacherPairs[key] = {
              subjectName: item.subjectName,
              teacherId: item.teacherId,
              count: 0,
            };
          }
          subjectTeacherPairs[key].count++;
        });
      } else {
        const pKey = getDefaultProfileKeyForClass(cls);
        const profileMap = state.curriculumProfiles?.[pKey] || {};
        const officialPlan = state.officialServicePlan || [];

        state.subjects.forEach((sub) => {
          const targetHours =
            typeof profileMap[sub.name] === 'number'
              ? profileMap[sub.name]
              : sub.hoursPerWeek || 0;
          if (targetHours <= 0) return;

          const officialTeacher = officialPlan.find(
            (p) => p.classId === cls.id && p.subjectName === sub.name
          );
          let chosenTeacherId = officialTeacher ? officialTeacher.teacherId : null;

          if (!chosenTeacherId) {
            const candidates = state.teachers
              .filter((t) => t.subject === sub.name)
              .sort((a, b) => getTeacherLoad(a.id) - getTeacherLoad(b.id));
            if (candidates.length > 0) chosenTeacherId = candidates[0].id;
          }

          if (chosenTeacherId) {
            const key = `${sub.name}__${chosenTeacherId}`;
            subjectTeacherPairs[key] = {
              subjectName: sub.name,
              teacherId: chosenTeacherId,
              count: targetHours,
            };
          } else {
            skippedCount += targetHours;
          }
        });
      }

      Object.values(subjectTeacherPairs).forEach((pair) => {
        const alreadyAssigned = existingClassSlots.filter(
          (s) => s.subjectName === pair.subjectName && s.teacherId === pair.teacherId
        ).length;
        let needed = Math.max(0, pair.count - alreadyAssigned);

        const subObj = state.subjects.find((s) => s.name === pair.subjectName);
        const isCore = Boolean(subObj && ['K', 'M', 'P', 'C', 'B'].includes(subObj.code || ''));

        if (rules.doubleBlocks) {
          while (needed >= 2) {
            allTasks.push({
              classId: cls.id,
              teacherId: pair.teacherId,
              subjectName: pair.subjectName,
              size: 2,
              isCore,
            });
            needed -= 2;
          }
        }
        while (needed >= 1) {
          allTasks.push({
            classId: cls.id,
            teacherId: pair.teacherId,
            subjectName: pair.subjectName,
            size: 1,
            isCore,
          });
          needed -= 1;
        }
      });
    });

    allTasks.sort((a, b) => {
      if (b.size !== a.size) return b.size - a.size;
      if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
      const tA = getTeacherById(a.teacherId);
      const tB = getTeacherById(b.teacherId);
      const unA = tA?.unavailable?.length || 0;
      const unB = tB?.unavailable?.length || 0;
      return unB - unA;
    });

    const doubleStarterPeriods = ['p1', 'p2', 'p3', 'p6', 'p7', 'p8'];

    allTasks.forEach((task) => {
      const teacher = getTeacherById(task.teacherId);
      if (!teacher) {
        skippedCount += task.size;
        return;
      }

      const placeSingleHour = (): boolean => {
        const candidates: Array<{ day: string; period: string; score: number }> = [];
        DAYS.forEach((d) => {
          PERIODS.forEach((p, pIdx) => {
            if (isSlotBusyForClass(task.classId, d.id, p.id)) return;
            if (isSlotBusyForTeacher(task.teacherId, d.id, p.id)) return;
            if (isTeacherUnavailable(teacher, d.id, p.id)) return;

            let score = 100;
            score += isTeacherPreferredSlot(teacher, d.id, p.id);

            const sameSubToday = nextSchedule.filter(
              (s) =>
                s.classId === task.classId &&
                s.day === d.id &&
                s.subjectName === task.subjectName
            ).length;
            if (rules.spreadDays && sameSubToday > 0) score -= 45 * sameSubToday;

            if (rules.morningCore && task.isCore && p.shift === 'morning') score += 18;
            if (p.shift === 'morning') score += 8 - pIdx;
            else score += 4 - (pIdx - 5);

            const classDayCount = nextSchedule.filter(
              (s) => s.classId === task.classId && s.day === d.id
            ).length;
            score -= classDayCount * 2;
            score += Math.random() * 3;

            candidates.push({ day: d.id, period: p.id, score });
          });
        });

        candidates.sort((a, b) => b.score - a.score);
        if (candidates.length > 0) {
          const best = candidates[0];
          nextSchedule.push({
            id: 's_auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            day: best.day,
            period: best.period,
            classId: task.classId,
            teacherId: task.teacherId,
            subjectName: task.subjectName,
            note: `កូដ៖ ${task.teacherId}`,
          });
          addedCount++;
          return true;
        }
        return false;
      };

      if (task.size === 2) {
        const candidates: Array<{ day: string; p1: string; p2: string; score: number }> = [];
        DAYS.forEach((d) => {
          for (let i = 0; i < PERIODS.length - 1; i++) {
            const p1 = PERIODS[i];
            const p2 = PERIODS[i + 1];
            if (p1.shift !== p2.shift) continue;
            if (!doubleStarterPeriods.includes(p1.id)) continue;

            if (
              isSlotBusyForClass(task.classId, d.id, p1.id) ||
              isSlotBusyForClass(task.classId, d.id, p2.id)
            )
              continue;
            if (
              isSlotBusyForTeacher(task.teacherId, d.id, p1.id) ||
              isSlotBusyForTeacher(task.teacherId, d.id, p2.id)
            )
              continue;
            if (
              isTeacherUnavailable(teacher, d.id, p1.id) ||
              isTeacherUnavailable(teacher, d.id, p2.id)
            )
              continue;

            let score = 100;
            score += isTeacherPreferredSlot(teacher, d.id, p1.id);
            score += isTeacherPreferredSlot(teacher, d.id, p2.id);

            const sameSubToday = nextSchedule.filter(
              (s) =>
                s.classId === task.classId &&
                s.day === d.id &&
                s.subjectName === task.subjectName
            ).length;
            if (rules.spreadDays && sameSubToday > 0) score -= 60 * sameSubToday;

            if (rules.morningCore && task.isCore && p1.shift === 'morning') score += 22;
            if (p1.id === 'p1' || p1.id === 'p3' || p1.id === 'p6') score += 12;

            const classDayCount = nextSchedule.filter(
              (s) => s.classId === task.classId && s.day === d.id
            ).length;
            score -= classDayCount * 3;
            score += Math.random() * 4;

            candidates.push({ day: d.id, p1: p1.id, p2: p2.id, score });
          }
        });

        candidates.sort((a, b) => b.score - a.score);
        if (candidates.length > 0) {
          const best = candidates[0];
          nextSchedule.push(
            {
              id: 's_auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              day: best.day,
              period: best.p1,
              classId: task.classId,
              teacherId: task.teacherId,
              subjectName: task.subjectName,
              note: `កូដ៖ ${task.teacherId}`,
            },
            {
              id: 's_auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              day: best.day,
              period: best.p2,
              classId: task.classId,
              teacherId: task.teacherId,
              subjectName: task.subjectName,
              note: `កូដ៖ ${task.teacherId}`,
            }
          );
          addedCount += 2;
        } else {
          if (!placeSingleHour()) skippedCount++;
          if (!placeSingleHour()) skippedCount++;
        }
      } else {
        if (!placeSingleHour()) skippedCount++;
      }
    });

    updateState((prev) => ({
      ...prev,
      schedule: nextSchedule,
    }));

    setAutoModalOpen(false);
    if (skippedCount > 0) {
      showToast(
        `បានរៀបស្វ័យប្រវត្តិ ${addedCount} ម៉ោង! (នៅសល់ ${skippedCount} ម៉ោងដោយសារគ្រូជាប់ម៉ោងទំនេរ/ពេញកូតា)`,
        'warning'
      );
    } else {
      showToast(`✨ បានរៀបកាលវិភាគស្វ័យប្រវត្តិចំនួន ${addedCount} ម៉ោងដោយជោគជ័យ ១០០%!`);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['ថ្ងៃ', 'ម៉ោងទី', 'ម៉ោងសិក្សា', 'ថ្នាក់', 'មុខវិជ្ជា', 'កូដគ្រូ', 'ឈ្មោះគ្រូ', 'សម្គាល់'];
    const rows = state.schedule.map((s) => {
      const d = DAYS.find((x) => x.id === s.day)?.name || s.day;
      const p = PERIODS.find((x) => x.id === s.period);
      const c = getClassById(s.classId)?.name || s.classId;
      const t = getTeacherById(s.teacherId)?.name || s.teacherId;
      return [d, p?.name || s.period, p?.time || '', c, s.subjectName, s.teacherId, t, s.note || ''];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `កាលវិភាគ_វិទ្យាល័យព្រះនរោត្តមសីហមុនី_2026-2027.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('បានទាញយកឯកសារ CSV (Excel) ដោយជោគជ័យ!');
  };

  // Export JSON
  const exportJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_schedule_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('បានទាញយកឯកសារបម្រុងទុក (JSON)!');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(String(ev.target?.result)) as AppState;
        if (imported.classes && imported.teachers && imported.schedule) {
          const hydrated = ensureCurriculumProfilesOnState(imported);
          setState(hydrated);
          saveToDisk(hydrated, false);
          showToast('បានបញ្ចូលទិន្នន័យកាលវិភាគដោយជោគជ័យ!');
        } else {
          showToast('ទម្រង់ឯកសារមិនត្រឹមត្រូវ!', 'error');
        }
      } catch {
        showToast('មិនអាចអានឯកសារបានទេ!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Official 2026-2027 Data
  const handleResetDemo = () => {
    askConfirm(
      'ផ្ទុកកាលវិភាគផ្លូវការដើមឡើងវិញ',
      'តើអ្នកពិតជាចង់ផ្ទុកកាលវិភាគផ្លូវការដើម (ឆ្នាំសិក្សា ២០២៦-២០២៧) របស់វិទ្យាល័យ ព្រះនរោត្តមសីហមុនី ឡើងវិញមែនទេ? រាល់ការកែប្រែបច្ចុប្បន្ននឹងត្រូវជំនួស។',
      () => {
        const fresh = ensureCurriculumProfilesOnState(buildOfficialSchoolSchedule());
        setState(fresh);
        saveToDisk(fresh, false);
        setEntitySelect(fresh.classes[0]?.id || '12A');
        showToast('បានផ្ទុកកាលវិភាគផ្លូវការ (២០២៦-២០២៧) ឡើងវិញដោយជោគជ័យ!');
      },
      { confirmLabel: 'ផ្ទុកឡើងវិញ', isDanger: true }
    );
  };

  // Clear Current Entity Schedule
  const handleClearCurrentEntitySchedule = () => {
    const isClassMode = state.viewMode === 'class';
    const currentEntity = entitySelect;
    const entityObj = isClassMode
      ? getClassById(currentEntity)
      : getTeacherById(currentEntity);
    const label = entityObj ? entityObj.name : currentEntity;

    askConfirm(
      'សម្អាតម៉ោងក្នុងតារាងនេះ',
      `តើអ្នកពិតជាចង់សម្អាតម៉ោងសិក្សាទាំងអស់របស់ "${label}" មែនទេ?`,
      () => {
        updateState((prev) => ({
          ...prev,
          schedule: isClassMode
            ? prev.schedule.filter((s) => s.classId !== currentEntity)
            : prev.schedule.filter((s) => s.teacherId !== currentEntity),
        }));
        showToast(`បានសម្អាតកាលវិភាគរបស់ ${label}!`);
      },
      { confirmLabel: 'សម្អាតម៉ោង', isDanger: true }
    );
  };

  // Cycle Teacher Day Preference in Matrix
  const cycleTeacherDayPref = (teacherId: string, dayId: string) => {
    updateState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const unavailable = Array.isArray(t.unavailable) ? [...t.unavailable] : [];
        const preferred = Array.isArray(t.preferred) ? [...t.preferred] : [];
        const daySlots = PERIODS.map((p) => `${dayId}_${p.id}`);

        const unavailCount = daySlots.filter((k) => unavailable.includes(k)).length;
        const prefCount = daySlots.filter((k) => preferred.includes(k)).length;

        const cleanUnavail = unavailable.filter((k) => !daySlots.includes(k));
        const cleanPref = preferred.filter((k) => !daySlots.includes(k));

        if (unavailCount >= 5) {
          return { ...t, unavailable: cleanUnavail, preferred: cleanPref };
        } else if (prefCount >= 5) {
          return {
            ...t,
            unavailable: [...cleanUnavail, ...daySlots],
            preferred: cleanPref,
          };
        } else {
          return {
            ...t,
            unavailable: cleanUnavail,
            preferred: [...cleanPref, ...daySlots],
          };
        }
      }),
    }));
  };

  // Cycle single slot in Availability Modal
  const cycleSingleSlotAvail = (teacherId: string, key: string) => {
    updateState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const unavailable = Array.isArray(t.unavailable) ? [...t.unavailable] : [];
        const preferred = Array.isArray(t.preferred) ? [...t.preferred] : [];
        const isUnavail = unavailable.includes(key);
        const isPref = preferred.includes(key);

        if (!isPref && !isUnavail) {
          return { ...t, preferred: [...preferred, key] };
        } else if (isPref) {
          return {
            ...t,
            preferred: preferred.filter((k) => k !== key),
            unavailable: [...unavailable, key],
          };
        } else {
          return {
            ...t,
            unavailable: unavailable.filter((k) => k !== key),
          };
        }
      }),
    }));
  };

  // Roster Modal Open
  const openRosterModal = (index: number | null) => {
    const roster = state.serviceRoster || [];
    const item: Partial<ServiceRosterItem> =
      index !== null && roster[index]
        ? roster[index]
        : {
            no: String(roster.length + 1),
            name: '',
            gender: 'ប',
            dob: '',
            startDate: '',
            scale: 'ក៣.៤',
            spec: '',
            role: 'បង្រៀន',
            taughtSub: '',
            grades: '',
            reqHours: 0,
            extraHours: 0,
            totalHours: 0,
            note: '',
            codes: [],
            breakdown: '',
          };

    const formObj: Record<string, string> = {};
    ROSTER_FIELDS.forEach(([key]) => {
      const val = item[key];
      formObj[key] = Array.isArray(val) ? val.join(', ') : String(val ?? '');
    });
    setRosterForm(formObj);
    setRosterModalIndex(index === null ? -1 : index);
  };

  const saveRosterModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ServiceRosterItem = {
      no: (rosterForm.no || '').trim(),
      name: (rosterForm.name || '').trim(),
      gender: (rosterForm.gender || '').trim(),
      dob: (rosterForm.dob || '').trim(),
      startDate: (rosterForm.startDate || '').trim(),
      scale: (rosterForm.scale || '').trim(),
      spec: (rosterForm.spec || '').trim(),
      role: (rosterForm.role || '').trim(),
      taughtSub: (rosterForm.taughtSub || '').trim(),
      grades: (rosterForm.grades || '').trim(),
      reqHours: Number(rosterForm.reqHours || 0),
      extraHours: Number(rosterForm.extraHours || 0),
      totalHours: Number(rosterForm.totalHours || 0),
      note: (rosterForm.note || '').trim(),
      codes: (rosterForm.codes || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      breakdown: (rosterForm.breakdown || '').trim(),
    };

    updateState((prev) => {
      const nextRoster = [...(prev.serviceRoster || [])];
      if (rosterModalIndex !== null && rosterModalIndex >= 0 && nextRoster[rosterModalIndex]) {
        nextRoster[rosterModalIndex] = updated;
      } else {
        nextRoster.push(updated);
      }

      const nextTeachers = prev.teachers.map((t) => {
        if (updated.codes.includes(t.id)) {
          return { ...t, name: `${t.id} - ${updated.name}` };
        }
        return t;
      });

      return {
        ...prev,
        serviceRoster: nextRoster,
        teachers: nextTeachers,
      };
    });

    setRosterModalIndex(null);
    showToast('✅ បានរក្សាទុកព័ត៌មានបុគ្គលិកក្នុងតារាងសេវាបង្រៀនដោយជោគជ័យ!');
  };

  const deleteRosterModalItem = () => {
    if (rosterModalIndex === null || rosterModalIndex < 0) return;
    const item = state.serviceRoster?.[rosterModalIndex];
    if (!item) return;
    askConfirm(
      'លុបឈ្មោះបុគ្គលិក',
      `តើអ្នកពិតជាចង់លុបឈ្មោះ "${item.name}" ចេញពីតារាងសេវាបង្រៀនមែនទេ?`,
      () => {
        updateState((prev) => {
          const nextRoster = [...(prev.serviceRoster || [])];
          nextRoster.splice(rosterModalIndex, 1);
          return { ...prev, serviceRoster: nextRoster };
        });
        setRosterModalIndex(null);
        showToast('🗑️ បានលុបឈ្មោះបុគ្គលិកចេញពីតារាងសេវាបង្រៀន!');
      },
      { confirmLabel: 'លុបឈ្មោះ', isDanger: true }
    );
  };

  // Administration Chrono helpers
  const openAdminModal = (id?: number) => {
    const items = state.administration?.items || [];
    if (id !== undefined) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setAdminModal({
        isOpen: true,
        editId: item.id,
        role: item.role,
        code: item.code,
        category: item.category,
        title: item.title,
      });
    } else {
      const defaultRole: AdminRoleKey =
        adminCurrentRole !== 'ALL' ? adminCurrentRole : 'FINANCE';
      const prefix =
        defaultRole === 'FINANCE'
          ? 'ហវ-'
          : defaultRole === 'DEPUTY'
          ? 'នរ-'
          : defaultRole === 'SECRETARY'
          ? 'លខ-'
          : 'គ្រូ-';
      const roleCount = items.filter((i) => i.role === defaultRole).length + 1;
      const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      const numStr = String(roleCount)
        .padStart(2, '0')
        .split('')
        .map((c) => khmerDigits[Number(c)] || c)
        .join('');

      setAdminModal({
        isOpen: true,
        editId: null,
        role: defaultRole,
        code: prefix + numStr,
        category: '',
        title: '',
      });
    }
  };

  const saveAdminModal = () => {
    const { editId, role, code, category, title } = adminModal;
    if (!code.trim() || !category.trim() || !title.trim()) {
      showToast('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!', 'error');
      return;
    }
    const roleName = ADMIN_ROLES[role];
    updateState((prev) => {
      const prevAdmin = prev.administration || {
        schoolName: 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី',
        items: [],
      };
      const items = [...prevAdmin.items];
      if (editId !== null) {
        const idx = items.findIndex((i) => i.id === editId);
        if (idx > -1) {
          items[idx] = {
            ...items[idx],
            role,
            roleName,
            code: code.trim(),
            category: category.trim(),
            title: title.trim(),
          };
        }
      } else {
        const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        items.push({
          id: newId,
          role,
          roleName,
          code: code.trim(),
          category: category.trim(),
          title: title.trim(),
        });
      }
      return {
        ...prev,
        administration: {
          ...prevAdmin,
          items,
        },
      };
    });
    setAdminModal((prev) => ({ ...prev, isOpen: false }));
    showToast(editId !== null ? '✅ បានកែប្រែឯកសារក្រូណូ!' : '✅ បានបន្ថែមក្រូណូថ្មី!');
  };

  const deleteAdminItem = (id: number) => {
    const item = state.administration?.items.find((i) => i.id === id);
    if (!item) return;
    askConfirm(
      'លុបឯកសារក្រូណូ',
      `តើអ្នកពិតជាចង់លុបក្រូណូ [${item.code}] "${item.title}" មែនទេ?`,
      () => {
        updateState((prev) => {
          if (!prev.administration) return prev;
          return {
            ...prev,
            administration: {
              ...prev.administration,
              items: prev.administration.items.filter((i) => i.id !== id),
            },
          };
        });
        showToast('🗑️ បានលុបឯកសារក្រូណូ!');
      },
      { confirmLabel: 'លុបក្រូណូ', isDanger: true }
    );
  };

  // Filtered periods for Timetable tab
  const visiblePeriods = PERIODS.filter(
    (p) => shiftSelect === 'all' || p.shift === shiftSelect
  );

  // Current entity Weekly count for Timetable tab
  const currentEntitySlotsCount =
    state.viewMode === 'class'
      ? state.schedule.filter((s) => s.classId === entitySelect).length
      : state.schedule.filter((s) => s.teacherId === entitySelect).length;

  const currentEntityObj =
    state.viewMode === 'class'
      ? getClassById(entitySelect)
      : getTeacherById(entitySelect);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-indigo-950 text-white shadow-lg no-print sticky top-0 z-30 border-b border-indigo-800">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-bold text-xl shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-moul text-base md:text-lg tracking-wide text-amber-300">
                ប្រព័ន្ធគ្រប់គ្រងកាលវិភាគបង្រៀន និងរដ្ឋបាលសាលា
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-200">
                <span>វិទ្យាល័យ ព្រះនរោត្តមសីហមុនី (ស្រុកជលគិរី) • ឆ្នាំសិក្សា ២០២៦-២០២៧</span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {lastSavedText
                      ? `រក្សាទុកចុងក្រោយ៖ ${lastSavedText}`
                      : 'រក្សាទុកស្វ័យប្រវត្តិ (Auto-Saved)'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => saveToDisk(state, true)}
              title="រក្សាទុកការកែប្រែទាំងអស់ (Ctrl + S)"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុក (Save)</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="bg-indigo-800/80 hover:bg-indigo-700 text-xs md:text-sm px-3 py-2 rounded-lg border border-indigo-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ផ្ទុកកាលវិភាគផ្លូវការដើម</span>
            </button>

            <button
              onClick={exportCSV}
              className="bg-emerald-700 hover:bg-emerald-600 text-xs md:text-sm px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>នាំចេញ Excel (CSV)</span>
            </button>

            <button
              onClick={exportJSON}
              className="bg-sky-700 hover:bg-sky-600 text-xs md:text-sm px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>រក្សាទុកឯកសារ</span>
            </button>

            <label className="bg-slate-700 hover:bg-slate-600 text-xs md:text-sm px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>បញ្ចូលឯកសារ</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setAutoModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>រៀបស្វ័យប្រវត្តិ</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm px-3.5 py-2 rounded-lg border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព / PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-indigo-900/90 border-t border-indigo-800/80">
          <div className="max-w-[1600px] mx-auto px-4 flex overflow-x-auto gap-1 pt-1">
            {[
              { id: 'timetable', label: 'កាលវិភាគតាមថ្នាក់/គ្រូ', icon: Table },
              { id: 'master', label: 'តារាង Master រួម (គ្រប់ថ្នាក់)', icon: Grid },
              { id: 'service', label: 'សេវាបង្រៀន & ម៉ោងបន្ថែម (២៨នាក់)', icon: Users },
              { id: 'curriculum', label: 'កំណត់ផែនការម៉ោង & រៀប Auto', icon: BookOpen },
              { id: 'teachers', label: 'គ្រប់គ្រងគ្រូ & ម៉ោងទំនេរ', icon: UserCheck },
              { id: 'classes', label: 'ថ្នាក់រៀន & មុខវិជ្ជា', icon: Building2 },
              { id: 'administration', label: '📁 រដ្ឋបាលការងារ', icon: FolderKanban },
              { id: 'reports', label: 'របាយការណ៍ & ស្ថិតិ', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabKey)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-indigo-950 font-semibold'
                      : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-5 space-y-5">
        {/* Global KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ថ្នាក់រៀនសរុប (៧-១២)</p>
              <p className="text-xl font-bold text-slate-800">{state.classes.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">កូដគ្រូបង្រៀនសរុប</p>
              <p className="text-xl font-bold text-slate-800">{state.teachers.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">មុខវិជ្ជាសរុប</p>
              <p className="text-xl font-bold text-slate-800">{state.subjects.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ម៉ោងបានរៀបរួច</p>
              <p className="text-xl font-bold text-slate-800">{state.schedule.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ការប៉ះម៉ោងគ្នា (Conflicts)</p>
              <p
                className={`text-xl font-bold ${
                  conflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {conflicts.length}
              </p>
            </div>
          </div>
        </section>

        {/* TAB 1: TIMETABLE */}
        {activeTab === 'timetable' && (
          <section className="space-y-4">
            {/* Filter & View Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => switchViewMode('class')}
                    className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-medium transition cursor-pointer ${
                      state.viewMode === 'class'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    មើលតាមថ្នាក់រៀន
                  </button>
                  <button
                    onClick={() => switchViewMode('teacher')}
                    className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-medium transition cursor-pointer ${
                      state.viewMode === 'teacher'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    មើលតាមគ្រូបង្រៀន
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs md:text-sm font-medium text-slate-600">
                    {state.viewMode === 'class' ? 'ជ្រើសរើសថ្នាក់៖' : 'ជ្រើសរើសគ្រូ៖'}
                  </label>
                  <select
                    value={entitySelect}
                    onChange={(e) => setEntitySelect(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 font-medium min-w-[240px]"
                  >
                    {state.viewMode === 'class'
                      ? state.classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.room ? `(${c.room})` : ''}
                          </option>
                        ))
                      : state.teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.subject})
                          </option>
                        ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs md:text-sm font-medium text-slate-600">វេនសិក្សា៖</label>
                  <select
                    value={shiftSelect}
                    onChange={(e) =>
                      setShiftSelect(e.target.value as 'all' | 'morning' | 'afternoon')
                    }
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2"
                  >
                    <option value="all">ពេញមួយថ្ងៃ (ព្រឹក + រសៀល)</option>
                    <option value="morning">វេនព្រឹក (7:00 - 12:00)</option>
                    <option value="afternoon">វេនរសៀល (1:00 - 5:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden xl:inline-flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                  អូសទម្លាក់ (Drag & Drop) ដើម្បីប្ដូរម៉ោង ឬចុចលើប្រអប់ដើម្បីកែប្រែ
                </span>
                <button
                  onClick={handleClearCurrentEntitySchedule}
                  className="text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs md:text-sm px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>សម្អាតម៉ោងក្នុងតារាងនេះ</span>
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print-only text-center mb-4">
              <div className="flex justify-between items-start text-xs leading-relaxed">
                <div className="text-left">
                  <p className="font-moul">មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ឆ្នាំង</p>
                  <p className="font-moul">ការិយាល័យអប់រំ យុវជន និងកីឡា ស្រុកជលគិរី</p>
                  <p className="font-moul">វិទ្យាល័យ ព្រះនរោត្តមសីហមុនី</p>
                </div>
                <div className="text-center">
                  <p className="font-moul text-sm">ព្រះរាជាណាចក្រកម្ពុជា</p>
                  <p className="font-moul text-xs">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>
              </div>
              <h2 className="font-moul text-base mt-2">
                {state.viewMode === 'class'
                  ? `កាលវិភាគសិក្សាប្រចាំសប្ដាហ៍ - ${currentEntityObj?.name || ''}`
                  : `កាលវិភាគបង្រៀនប្រចាំសប្ដាហ៍ - ${currentEntityObj?.name || ''}`}
              </h2>
              <p className="text-xs text-slate-600">ឆ្នាំសិក្សា ២០២៦ - ២០២៧</p>
            </div>

            {/* Active Entity Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                  {state.viewMode === 'class' ? 'ថ្នាក់រៀន' : 'គ្រូបង្រៀន'}
                </span>
                <h2 className="text-base md:text-lg font-bold">
                  {state.viewMode === 'class'
                    ? `${currentEntityObj?.name || ''} ${
                        (currentEntityObj as ClassItem)?.room
                          ? `• ${(currentEntityObj as ClassItem).room}`
                          : ''
                      }`
                    : `${currentEntityObj?.name || ''} • ឯកទេស៖ ${
                        getTeacherById(entitySelect)?.subject || ''
                      }`}
                </h2>
              </div>
              <div className="text-xs md:text-sm text-indigo-100 flex items-center gap-4">
                <span>
                  ម៉ោងសរុបក្នុងសប្ដាហ៍៖{' '}
                  <strong className="text-amber-300">{currentEntitySlotsCount} ម៉ោង</strong>
                </span>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden print-container">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs md:text-sm">
                      <th className="border border-slate-600 py-3 px-3 w-36 text-center font-semibold">
                        ម៉ោងសិក្សា / ថ្ងៃ
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d.id}
                          className="border border-slate-600 py-3 px-3 text-center font-semibold w-[14%]"
                        >
                          {d.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs md:text-sm">
                    {visiblePeriods.map((period, idx) => {
                      const isFirstAfternoon =
                        period.shift === 'afternoon' &&
                        (idx === 0 || visiblePeriods[idx - 1].shift === 'morning');

                      return (
                        <React.Fragment key={period.id}>
                          {isFirstAfternoon && shiftSelect === 'all' && (
                            <tr className="bg-amber-50/90 text-amber-900">
                              <td
                                colSpan={7}
                                className="border border-slate-300 py-1.5 px-4 text-center font-semibold text-xs tracking-wide"
                              >
                                ☀️ សម្រាកថ្ងៃត្រង់ (12:00 - 1:00 រសៀល) • ចូលរៀនវេនរសៀល
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50/60 transition">
                            <td className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-center">
                              <div className="font-bold text-slate-800 text-xs md:text-sm">
                                {period.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {period.time}
                              </div>
                            </td>
                            {DAYS.map((day) => {
                              const slot =
                                state.viewMode === 'class'
                                  ? state.schedule.find(
                                      (s) =>
                                        s.day === day.id &&
                                        s.period === period.id &&
                                        s.classId === entitySelect
                                    )
                                  : state.schedule.find(
                                      (s) =>
                                        s.day === day.id &&
                                        s.period === period.id &&
                                        s.teacherId === entitySelect
                                    );

                              const teacherUnavail =
                                state.viewMode === 'teacher' &&
                                (getTeacherById(entitySelect)?.unavailable || []).includes(
                                  `${day.id}_${period.id}`
                                );

                              const isConflict = slot
                                ? conflicts.some(
                                    (c) =>
                                      c.day === day.id &&
                                      c.period === period.id &&
                                      c.teacherId === slot.teacherId
                                  )
                                : false;

                              const cellKey = `${day.id}_${period.id}`;
                              const isDragOver = dragOverKey === cellKey;

                              if (slot) {
                                const style = getSubjectStyle(slot.subjectName);
                                const teacher = getTeacherById(slot.teacherId);
                                const cls = getClassById(slot.classId);

                                return (
                                  <td
                                    key={day.id}
                                    draggable
                                    onDragStart={() =>
                                      setDragPayload({ day: day.id, period: period.id })
                                    }
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverKey(cellKey);
                                    }}
                                    onDragLeave={() => setDragOverKey(null)}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleCellDrop(day.id, period.id);
                                    }}
                                    onClick={() => openSlotModal(day.id, period.id)}
                                    className={`border border-slate-300 p-1.5 align-top h-20 relative group cursor-pointer transition ${
                                      isDragOver ? 'drag-over-cell' : ''
                                    }`}
                                  >
                                    <div
                                      className={`h-full rounded-lg p-2 border ${style.bg} ${
                                        style.border
                                      } ${style.text} flex flex-col justify-between shadow-2xs hover:shadow-md transition ${
                                        isConflict ? 'ring-2 ring-rose-600' : ''
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="font-bold text-xs md:text-sm leading-snug">
                                          {slot.subjectName}
                                        </span>
                                        {isConflict && (
                                          <span
                                            className="text-rose-600 text-xs font-bold"
                                            title="ប៉ះម៉ោងបង្រៀន!"
                                          >
                                            ⚠️
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1 space-y-0.5 text-[11px] opacity-90">
                                        {state.viewMode === 'class' ? (
                                          <div className="flex items-center gap-1 font-medium truncate">
                                            <span>👨‍🏫</span>
                                            <span>{teacher ? teacher.name : 'មិនស្គាល់គ្រូ'}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 font-bold truncate">
                                            <span>🏫</span>
                                            <span>{cls ? cls.name : slot.classId}</span>
                                          </div>
                                        )}
                                        {slot.note && (
                                          <div className="text-[10px] italic opacity-75 truncate">
                                            📌 {slot.note}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              if (teacherUnavail) {
                                return (
                                  <td
                                    key={day.id}
                                    onClick={() => openSlotModal(day.id, period.id)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverKey(cellKey);
                                    }}
                                    onDragLeave={() => setDragOverKey(null)}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleCellDrop(day.id, period.id);
                                    }}
                                    className={`border border-slate-300 p-1.5 align-middle h-20 bg-rose-50/50 text-center cursor-pointer hover:bg-rose-100/60 transition ${
                                      isDragOver ? 'drag-over-cell' : ''
                                    }`}
                                  >
                                    <span className="text-[11px] text-rose-500 font-medium">
                                      ⛔ គ្រូសុំទំនេរ
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={day.id}
                                  onClick={() => openSlotModal(day.id, period.id)}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverKey(cellKey);
                                  }}
                                  onDragLeave={() => setDragOverKey(null)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleCellDrop(day.id, period.id);
                                  }}
                                  className={`border border-slate-300 p-1.5 align-middle h-20 text-center cursor-pointer group hover:bg-indigo-50/40 transition ${
                                    isDragOver ? 'drag-over-cell' : ''
                                  }`}
                                >
                                  <div className="opacity-0 group-hover:opacity-100 transition text-indigo-500 text-xs font-medium no-print flex items-center justify-center gap-1">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ដាក់ម៉ោង</span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Signature Footer */}
            <div className="hidden print-only mt-6 text-xs">
              <div className="grid grid-cols-2 text-center">
                <div>
                  <p>បានឃើញ និងឯកភាព</p>
                  <p className="font-moul mt-1">ប្រធានមន្ទីរអប់រំ យុវជន និងកីឡា</p>
                </div>
                <div>
                  <p>ថ្ងៃ......................... ខែ............. ឆ្នាំម្សាញ់ សប្តស័ក ព.ស.២៥៦៩</p>
                  <p>ព្រៃគ្រី ថ្ងៃទី........ ខែ............ ឆ្នាំ២០២៦</p>
                  <p className="font-moul mt-1">នាយកសាលា</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: MASTER OVERVIEW */}
        {activeTab === 'master' && (
          <section className="space-y-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print">
              <div>
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Grid className="w-5 h-5 text-indigo-600" />
                  <span>តារាងកាលវិភាគរួម គ្រប់ថ្នាក់ (Master Schedule - ព្រឹក និង រសៀល)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  បង្ហាញកូដគ្រូតាមម៉ោង និងថ្នាក់ទាំង ១៧ ដូចតារាងផ្លូវការរបស់សាលា (ចុចលើក្រឡាណាមួយដើម្បីកែប្រែភ្លាមៗ)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={masterShiftFilter}
                  onChange={(e) =>
                    setMasterShiftFilter(e.target.value as 'both' | 'morning' | 'afternoon')
                  }
                  className="bg-slate-50 border border-slate-300 text-sm rounded-lg px-3 py-2 font-medium"
                >
                  <option value="both">បង្ហាញទាំង ២ វេន (ព្រឹក + រសៀល)</option>
                  <option value="morning">បង្ហាញតែវេនព្រឹក (ម៉ោងទី ១ - ៥)</option>
                  <option value="afternoon">បង្ហាញតែវេនរសៀល (ម៉ោងទី ៦ - ៩)</option>
                </select>
                <select
                  value={masterGradeFilter}
                  onChange={(e) =>
                    setMasterGradeFilter(e.target.value as 'all' | 'high' | 'low')
                  }
                  className="bg-slate-50 border border-slate-300 text-sm rounded-lg px-3 py-2"
                >
                  <option value="all">គ្រប់កម្រិតថ្នាក់ (ទី៧ ដល់ ទី១២)</option>
                  <option value="high">មធ្យមសិក្សាទុតិយភូមិ (ទី១០ ដល់ ទី១២)</option>
                  <option value="low">មធ្យមសិក្សាបឋមភូមិ (ទី៧ ដល់ ទី៩)</option>
                </select>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={masterColorize}
                    onChange={(e) => setMasterColorize(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>បង្ហាញពណ៌តាមមុខវិជ្ជា</span>
                </label>
              </div>
            </div>

            {(() => {
              const filteredClasses = state.classes.filter((c) => {
                if (masterGradeFilter === 'high') {
                  return c.id.startsWith('10') || c.id.startsWith('11') || c.id.startsWith('12');
                }
                if (masterGradeFilter === 'low') {
                  return c.id.startsWith('7') || c.id.startsWith('8') || c.id.startsWith('9');
                }
                return true;
              });

              const renderShiftMasterTable = (
                shiftKey: 'morning' | 'afternoon',
                title: string
              ) => {
                const shiftPeriods = PERIODS.filter((p) => p.shift === shiftKey);
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden mb-6">
                    <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                      <h3 className="font-moul text-xs md:text-sm text-amber-300">{title}</h3>
                      <span className="text-xs text-slate-300">
                        ឆ្នាំសិក្សា ២០២៦-២០២៧ • វិទ្យាល័យ ព្រះនរោត្តមសីហមុនី
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse master-table">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            <th rowSpan={2} className="border border-slate-600 w-10">
                              ថ្នាក់
                            </th>
                            {DAYS.map((d) => (
                              <th
                                key={d.id}
                                colSpan={shiftPeriods.length}
                                className="border border-slate-600 py-1 bg-indigo-950 text-amber-300 font-bold"
                              >
                                {d.name}
                              </th>
                            ))}
                            <th rowSpan={2} className="border border-slate-600 w-28">
                              គ្រូបន្ទុកថ្នាក់
                            </th>
                          </tr>
                          <tr className="bg-slate-700 text-slate-100">
                            {DAYS.map((d) =>
                              shiftPeriods.map((p, idx) => (
                                <th
                                  key={`${d.id}_${p.id}`}
                                  className="border border-slate-600 font-medium text-[10px]"
                                >
                                  {shiftKey === 'morning' ? idx + 1 : idx + 1}
                                </th>
                              ))
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClasses.map((c) => {
                            const hr = c.room ? c.room.replace('បន្ទុក៖ ', '') : '';
                            return (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="border border-slate-300 font-bold bg-slate-100 text-slate-900">
                                  {c.id}
                                </td>
                                {DAYS.map((d) =>
                                  shiftPeriods.map((p) => {
                                    const slot = state.schedule.find(
                                      (s) =>
                                        s.classId === c.id &&
                                        s.day === d.id &&
                                        s.period === p.id
                                    );
                                    if (!slot) {
                                      return (
                                        <td
                                          key={`${d.id}_${p.id}`}
                                          onClick={() => openSlotModal(d.id, p.id, c.id)}
                                          className="border border-slate-200 text-slate-300 cursor-pointer hover:bg-indigo-50"
                                        />
                                      );
                                    }
                                    const style = getSubjectStyle(slot.subjectName);
                                    const colorClasses = masterColorize
                                      ? `${style.bg} ${style.text}`
                                      : 'bg-white text-slate-900';

                                    return (
                                      <td
                                        key={`${d.id}_${p.id}`}
                                        onClick={() => openSlotModal(d.id, p.id, c.id)}
                                        title={`${c.name} • ${d.name} ${p.name}: ${
                                          slot.subjectName
                                        } (${
                                          getTeacherById(slot.teacherId)?.name || slot.teacherId
                                        })`}
                                        className={`border border-slate-300 font-semibold cursor-pointer hover:ring-2 hover:ring-indigo-500 ${colorClasses}`}
                                      >
                                        {formatCodeSubscript(slot.teacherId)}
                                      </td>
                                    );
                                  })
                                )}
                                <td className="border border-slate-300 text-left px-2 text-[10px] font-medium text-slate-700 bg-slate-50">
                                  {hr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              };

              return (
                <div>
                  {(masterShiftFilter === 'both' || masterShiftFilter === 'morning') &&
                    renderShiftMasterTable(
                      'morning',
                      'កាលវិភាគរួម វេនព្រឹក (ម៉ោងទី១ ដល់ ម៉ោងទី៥ • 7:00 - 12:00)'
                    )}
                  {(masterShiftFilter === 'both' || masterShiftFilter === 'afternoon') &&
                    renderShiftMasterTable(
                      'afternoon',
                      'កាលវិភាគរួម វេនរសៀល (ម៉ោងទី១ ដល់ ម៉ោងទី៤ • 1:00 - 5:00)'
                    )}
                </div>
              );
            })()}
          </section>
        )}

        {/* TAB 3: SERVICE ROSTER */}
        {activeTab === 'service' && (
          <section className="space-y-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print">
              <div>
                <h2 className="font-moul text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>
                    តារាងបែងចែកសេវាបង្រៀន និងម៉ោងបន្ថែម (ឆ្នាំសិក្សា ២០២៦-២០២៧)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  បញ្ជីបុគ្គលិកអប់រំទាំង ២៨ នាក់ (ស្រី ០៥ នាក់) អមដោយក្របខណ្ឌ ម៉ោងកំណត់ ម៉ោងបន្ថែម និងការបែងចែកម៉ោងតាមមុខវិជ្ជា
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="ស្វែងរកឈ្មោះគ្រូ ឬកូដ..."
                    className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-sm"
                  />
                </div>
                <select
                  value={serviceFilterSub}
                  onChange={(e) => setServiceFilterSub(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-sm rounded-lg px-3 py-1.5"
                >
                  <option value="all">គ្រប់មុខវិជ្ជាទាំងអស់</option>
                  <option value="K">អក្សរសាស្ត្រខ្មែរ (K)</option>
                  <option value="M">គណិតវិទ្យា (M)</option>
                  <option value="P">រូបវិទ្យា (P)</option>
                  <option value="C">គីមីវិទ្យា (C)</option>
                  <option value="B">ជីវវិទ្យា (B)</option>
                  <option value="ES">ផែនដីវិទ្យា (ES)</option>
                  <option value="HG">ប្រវត្តិវិទ្យា & ភូមិវិទ្យា (H, G)</option>
                  <option value="I">ពលរដ្ឋវិទ្យា & សីលធម៌ (I)</option>
                  <option value="En">ភាសាអង់គ្លេស (En)</option>
                  <option value="Ed">អប់រំកាយ & សេដ្ឋកិច្ច (Ed, Em)</option>
                </select>
                <button
                  onClick={() => openRosterModal(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>បន្ថែមបុគ្គលិកថ្មី</span>
                </button>
              </div>
            </div>

            {/* Official 28 Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[1150px]">
                  <thead>
                    <tr className="bg-slate-800 text-white text-center">
                      <th className="border border-slate-600 py-2.5 px-2 w-10">ល.រ</th>
                      <th className="border border-slate-600 py-2.5 px-3 text-left">គោត្តនាម-នាម</th>
                      <th className="border border-slate-600 py-2.5 px-2 w-12">ភេទ</th>
                      <th className="border border-slate-600 py-2.5 px-2">ថ្ងៃខែឆ្នាំកំណើត</th>
                      <th className="border border-slate-600 py-2.5 px-2">ថ្ងៃចូលការងារ</th>
                      <th className="border border-slate-600 py-2.5 px-2">ក្របខណ្ឌ</th>
                      <th className="border border-slate-600 py-2.5 px-2">ឯកទេស</th>
                      <th className="border border-slate-600 py-2.5 px-2">ឋានៈតួនាទី</th>
                      <th className="border border-slate-600 py-2.5 px-2">មុខវិជ្ជាបង្រៀន</th>
                      <th className="border border-slate-600 py-2.5 px-2">ថ្នាក់ទី</th>
                      <th className="border border-slate-600 py-2.5 px-2 bg-indigo-950 text-amber-300">
                        កូដកាលវិភាគ
                      </th>
                      <th className="border border-slate-600 py-2.5 px-2">ម៉ោងកំណត់</th>
                      <th className="border border-slate-600 py-2.5 px-2 text-amber-300">
                        ម៉ោងបន្ថែម
                      </th>
                      <th className="border border-slate-600 py-2.5 px-2 bg-emerald-950 text-emerald-300">
                        ម៉ោងសរុប
                      </th>
                      <th className="border border-slate-600 py-2.5 px-2 bg-sky-950 text-sky-300">
                        ម៉ោងក្នុងតារាងផ្ទាល់
                      </th>
                      <th className="border border-slate-600 py-2.5 px-3 text-left">
                        ផ្សេងៗ / ការបែងចែកថ្នាក់
                      </th>
                      <th className="border border-slate-600 py-2.5 px-2 text-center no-print">
                        សកម្មភាព
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const rosterSource = state.serviceRoster || OFFICIAL_SERVICE_ROSTER;
                      const q = serviceSearch.trim().toLowerCase();
                      const filtered = rosterSource
                        .map((r, originalIndex) => ({ r, originalIndex }))
                        .filter(({ r }) => {
                          const matchQuery =
                            !q ||
                            r.name.toLowerCase().includes(q) ||
                            r.codes.some((c) => c.toLowerCase().includes(q)) ||
                            r.note.toLowerCase().includes(q);
                          if (!matchQuery) return false;
                          if (serviceFilterSub === 'all') return true;
                          if (serviceFilterSub === 'HG') {
                            return (
                              r.taughtSub.includes('H') ||
                              r.taughtSub.includes('G') ||
                              r.spec.includes('H')
                            );
                          }
                          if (serviceFilterSub === 'Ed') {
                            return r.taughtSub.includes('Ed') || r.taughtSub.includes('Em');
                          }
                          return (
                            r.taughtSub.includes(serviceFilterSub) ||
                            r.codes.some((c) => c.startsWith(serviceFilterSub))
                          );
                        });

                      return filtered.map(({ r, originalIndex }) => {
                        const liveHours = r.codes.reduce(
                          (acc, code) =>
                            acc + state.schedule.filter((s) => s.teacherId === code).length,
                          0
                        );
                        const diff = liveHours - r.totalHours;

                        return (
                          <tr key={originalIndex} className="hover:bg-slate-50 transition">
                            <td className="border border-slate-200 py-2 px-2 text-center font-bold text-slate-700">
                              {r.no}
                            </td>
                            <td className="border border-slate-200 py-2 px-3 font-bold text-slate-900">
                              {r.name}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center">
                              {r.gender}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center text-slate-600">
                              {r.dob}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center text-slate-600">
                              {r.startDate}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-medium">
                              {r.scale}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-semibold text-indigo-700">
                              {r.spec}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center">
                              {r.role}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-bold">
                              {r.taughtSub}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center">
                              {r.grades}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center bg-indigo-50/50">
                              {r.codes.length > 0 ? (
                                <div className="flex flex-wrap justify-center gap-1">
                                  {r.codes.map((code) => (
                                    <button
                                      key={code}
                                      onClick={() => jumpToTimetable('teacher', code)}
                                      title="ចុចដើម្បីមើលកាលវិភាគគ្រូនេះ"
                                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                                    >
                                      {formatCodeSubscript(code)}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-semibold">
                              {r.reqHours}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/40">
                              {r.extraHours}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-bold text-emerald-800 bg-emerald-50/50">
                              {r.totalHours}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center font-bold bg-sky-50/50">
                              <span
                                className={
                                  diff === 0
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }
                              >
                                {liveHours} ម៉ោង
                              </span>
                            </td>
                            <td className="border border-slate-200 py-2 px-3 text-left">
                              <div className="font-semibold text-slate-800">{r.note}</div>
                              <div className="text-[11px] text-slate-500">{r.breakdown}</div>
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center no-print">
                              <button
                                onClick={() => openRosterModal(originalIndex)}
                                className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>កែ</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const rosterSource = state.serviceRoster || OFFICIAL_SERVICE_ROSTER;
                      let sumReq = 0;
                      let sumExtra = 0;
                      let sumTotal = 0;
                      let sumLive = 0;
                      rosterSource.forEach((r) => {
                        sumReq += Number(r.reqHours || 0);
                        sumExtra += Number(r.extraHours || 0);
                        sumTotal += Number(r.totalHours || 0);
                        sumLive += r.codes.reduce(
                          (acc, code) =>
                            acc + state.schedule.filter((s) => s.teacherId === code).length,
                          0
                        );
                      });
                      return (
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td
                            colSpan={11}
                            className="border border-slate-300 py-2.5 px-3 text-right"
                          >
                            សរុបរួម (បុគ្គលិក {rosterSource.length} នាក់)៖
                          </td>
                          <td className="border border-slate-300 py-2.5 px-2 text-center">
                            {sumReq} ម៉ោង
                          </td>
                          <td className="border border-slate-300 py-2.5 px-2 text-center text-amber-700">
                            {sumExtra} ម៉ោង
                          </td>
                          <td className="border border-slate-300 py-2.5 px-2 text-center text-emerald-700">
                            {sumTotal} ម៉ោង
                          </td>
                          <td className="border border-slate-300 py-2.5 px-2 text-center text-sky-700">
                            {sumLive} ម៉ោង
                          </td>
                          <td
                            colSpan={2}
                            className="border border-slate-300 py-2.5 px-3 text-xs text-slate-600"
                          >
                            បូករួមទាំងម៉ោងពលកម្ម (L1) ចំនួន ៦ ម៉ោងក្នុងតារាងកាលវិភាគ
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Subject Breakdown Cards (Pages 5 & 6 of Service File) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-emerald-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  📘 អក្សរសាស្ត្រខ្មែរ (K) • សរុប ៨៩ ម៉ោង
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>K₁ (ជុំ សុជាតិ):</strong> 12A(5h), 12B(5h), 10A(6h), 9A(6h) ={' '}
                    <span className="font-bold text-emerald-700">22 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>K₂ (អ៊ុន លីដា):</strong> 12C(3h), 11A(3h), 11B(3h), 10B(6h), 9B(6h) ={' '}
                    <span className="font-bold text-emerald-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>K₃ (អែ សារឹម):</strong> 11C(3h), 10C(6h), 8B(6h), 8C(6h) ={' '}
                    <span className="font-bold text-emerald-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>K₄ (ខេង ស្រីខួច):</strong> 8A(6h), 7C(6h) = 12h (+ Em₁ 9h) ={' '}
                    <span className="font-bold text-emerald-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>K₅ (ល័ក្ខ ណាគ្រី):</strong> 7A(6h), 7B(6h) = 12h (+ ES₂ 7h) ={' '}
                    <span className="font-bold text-emerald-700">19 ម៉ោង</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-indigo-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  📐 គណិតវិទ្យា (M) • សរុប ៨១ ម៉ោង
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>M₁ (ហាស់ សង្ហា):</strong> 12C(5h), 11A(5h), 11B(5h), 9A(5h) ={' '}
                    <span className="font-bold text-indigo-700">20 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>M₂ (ឆយ សុវ៉ាន់ណេត):</strong> 12A(3h), 12B(3h), 10ABC(15h) ={' '}
                    <span className="font-bold text-indigo-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>M₃ (ហ៊ុន សុខម៉េង):</strong> 11C(5h), 9B(5h), 8C(5h) = 15h (+ En₃ 4h) ={' '}
                    <span className="font-bold text-indigo-700">19 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>M₄ (ប៊ុន សុផាត):</strong> 8AB(10h), 7ABC(15h) = 25h (+ Ed₄ 2h) ={' '}
                    <span className="font-bold text-indigo-700">27 ម៉ោង</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-sky-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  ⚡ រូបវិទ្យា (P) និង គីមីវិទ្យា (C) • សរុប ៧៦ ម៉ោង
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>P₁ (ហន ឈុនហាក់):</strong> 12ABC(7h), 11ABC(9h), 10BC(4h), 9A(2h) ={' '}
                    <span className="font-bold text-sky-700">22 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>P₂ (រី ដារ៉ូ):</strong> 10A(2h), 9B(2h), 8ABC(6h), 7ABC(6h) = 16h (+ En₂ 2h) ={' '}
                    <span className="font-bold text-sky-700">18 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>C₁ (ខាត់ ចន្ថា):</strong> 12AB(4h), 10ABC(6h), 9A(2h), 7ABC(6h) ={' '}
                    <span className="font-bold text-purple-700">18 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>C₂ (វង ទី):</strong> 12C(3h), 11ABC(9h), 9B(2h), 8ABC(6h) ={' '}
                    <span className="font-bold text-purple-700">20 ម៉ោង</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-teal-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  🧬 ជីវវិទ្យា (B) និង ផែនដីវិទ្យា (ES) • សរុប ៦៤ ម៉ោង
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>B₁ (គុំ វណ្ណាត):</strong> 12BC(5h), 11ABC(9h), 7ABC(6h) ={' '}
                    <span className="font-bold text-teal-700">20 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>B₂ (ហ៊ី ថាត):</strong> 12A(2h), 10ABC(6h), 9AB(4h), 8ABC(6h) ={' '}
                    <span className="font-bold text-teal-700">18 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>ES₁ (គិន សុភា):</strong> 12ABC(6h), 11ABC(6h), 10AB(4h), 7ABC(3h) ={' '}
                    <span className="font-bold text-teal-700">19 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>ES₂ (ល័ក្ខ ណាគ្រី):</strong> 10C(2h), 9AB(2h), 8ABC(3h) ={' '}
                    <span className="font-bold text-teal-700">7 ម៉ោង</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-amber-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  🌍 ប្រវត្តិ (H) ភូមិ (G) និង ពលរដ្ឋ (I) • សរុប ៩៣ ម៉ោង
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>H₁ (សាយ ពិសិដ្ឋ):</strong> 12ABC(8h), 11ABC(6h), 10ABC(3h), 9A(1h), 7ABC(3h) ={' '}
                    <span className="font-bold text-amber-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>G₁ (ហូ សុធារិទ្ធ):</strong> 12ABC(8h), 11ABC(6h), 10ABC(6h) + H₂(9B=1h) ={' '}
                    <span className="font-bold text-amber-700">21 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>G₂ (គ្រោះ រ៉ែម):</strong> 9AB(4h), 8ABC(6h), 7ABC(6h) + H₃(8ABC=3h) ={' '}
                    <span className="font-bold text-amber-700">19 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>I₁ (មាឃ លឹមហ៊ាត):</strong> 12ABC(8h), 11ABC(6h), 9A(2h) + En₂(2h) ={' '}
                    <span className="font-bold text-amber-700">18 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>I₂/I₄ (អ៊ុក សាវឿន):</strong> 10ABC(6h), 9B(2h), 8AC(4h) •{' '}
                    <strong>I₃ (ចែម ភាសាល):</strong> 7ABC(6h), 8B(4h)
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-rose-800 border-b border-slate-200 pb-2 mb-2.5 text-sm">
                  🇬🇧 អង់គ្លេស (En) អប់រំកាយ (Ed) & សេដ្ឋកិច្ច (Em)
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>En₁ (អុន សុគន្ធា):</strong> 12ABC(6h), 11ABC(6h), 10ABC(6h), 9A(2h) ={' '}
                    <span className="font-bold text-rose-700">20 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>En₄ (ហ៊ុន ឈឿន):</strong> 7ABC(6h), 8C(2h) ={' '}
                    <span className="font-bold text-rose-700">8 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>Ed₁ (ហ៊ុល ហាក់ - នាយក):</strong> 8ABC(6h), 7A(2h) ={' '}
                    <span className="font-bold text-rose-700">8 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>Ed₂ (ស៊ី វណ្ណា - នាយករង):</strong> 10ABC(6h), 7B(2h) ={' '}
                    <span className="font-bold text-rose-700">8 ម៉ោង</span>
                  </li>
                  <li>
                    <strong>Ed₃ (ម៉ែន យុទ្ធា):</strong> 11ABC(6h), 9AB(4h) ={' '}
                    <span className="font-bold text-rose-700">10 ម៉ោង</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: CURRICULUM & AUTO-SCHEDULE CONFIG */}
        {activeTab === 'curriculum' && (
          <section className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-indigo-950 font-bold text-xs mb-1">
                  CURRICULUM & SMART AUTO-SCHEDULER
                </span>
                <h2 className="font-moul text-base md:text-lg text-amber-300">
                  កំណត់ផែនការម៉ោងសិក្សា ម៉ោងគ្រូសុំទំនេរ និងរៀបកាលវិភាគស្វ័យប្រវត្តិ
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  កំណត់ចំនួនម៉ោងក្នុង ១ សប្ដាហ៍តាមកម្រិតថ្នាក់ (ទី៧-១២ វិទ្យាសាស្ត្រពិត/សង្គម) និងកំណត់ថ្ងៃដែលគ្រូចង់បង្រៀន ឬសុំទំនេរ មុនពេលបញ្ជាឱ្យប្រព័ន្ធរៀបស្វ័យប្រវត្តិ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    updateState((prev) => {
                      const next = { ...prev, curriculumProfiles: {} };
                      return ensureCurriculumProfilesOnState(next);
                    });
                    showToast('បានផ្ទុកផែនការម៉ោងស្តង់ដាររបស់សាលាឡើងវិញ!');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm px-3.5 py-2.5 rounded-xl border border-white/20 transition cursor-pointer"
                >
                  🔄 ផ្ទុកផែនការម៉ោងស្តង់ដារសាលា
                </button>
                <button
                  onClick={() => {
                    setAutoModalMode('curriculum');
                    setAutoModalOpen(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>រៀបកាលវិភាគស្វ័យប្រវត្តិឥឡូវនេះ</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Curriculum Quota Editor */}
              <div className="lg:col-span-7 bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      ១. កំណត់ចំនួនម៉ោងសិក្សាប្រចាំសប្ដាហ៍ តាមកម្រិតថ្នាក់
                    </h3>
                    <p className="text-xs text-slate-500">
                      ជ្រើសរើសកម្រិតថ្នាក់ រួចកែប្រែចំនួនម៉ោងក្នុង ១ សប្ដាហ៍សម្រាប់មុខវិជ្ជានីមួយៗ
                    </p>
                  </div>
                  <select
                    value={selectedCurriculumProfile}
                    onChange={(e) => setSelectedCurriculumProfile(e.target.value)}
                    className="bg-indigo-50 border border-indigo-300 text-indigo-950 font-bold text-sm rounded-lg px-3 py-2"
                  >
                    {Object.entries(PROFILE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Stream Assignment Bar */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    📌 កំណត់ប្រភេទកម្មវិធីសិក្សា (Stream) សម្រាប់ថ្នាក់នីមួយៗ៖
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {state.classes.map((c) => {
                      const currentP = c.curriculumProfile || getDefaultProfileKeyForClass(c);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        >
                          <span className="font-bold text-slate-800">{c.id}:</span>
                          <select
                            value={currentP}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState((prev) => ({
                                ...prev,
                                classes: prev.classes.map((cls) =>
                                  cls.id === c.id ? { ...cls, curriculumProfile: val } : cls
                                ),
                              }));
                            }}
                            className="bg-transparent text-[11px] font-semibold text-indigo-700 focus:outline-none"
                          >
                            {Object.entries(PROFILE_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Hours Grid */}
                {(() => {
                  const profileMap =
                    state.curriculumProfiles?.[selectedCurriculumProfile] || {};
                  let totalHours = 0;
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {state.subjects.map((sub) => {
                          const hrs =
                            typeof profileMap[sub.name] === 'number'
                              ? profileMap[sub.name]
                              : sub.hoursPerWeek || 0;
                          totalHours += hrs;
                          const st = COLOR_STYLES[sub.color] || COLOR_STYLES.indigo;
                          return (
                            <div
                              key={sub.name}
                              className={`flex items-center justify-between p-2.5 rounded-lg border ${st.border} ${st.bg}`}
                            >
                              <div className="truncate pr-2">
                                <div className={`font-bold text-xs ${st.text} truncate`}>
                                  {sub.name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  កូដមុខវិជ្ជា៖ {sub.code || '-'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={15}
                                  value={hrs}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      Math.min(15, parseInt(e.target.value, 10) || 0)
                                    );
                                    updateState((prev) => ({
                                      ...prev,
                                      curriculumProfiles: {
                                        ...(prev.curriculumProfiles || {}),
                                        [selectedCurriculumProfile]: {
                                          ...(prev.curriculumProfiles?.[
                                            selectedCurriculumProfile
                                          ] || {}),
                                          [sub.name]: val,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-16 text-center font-bold text-sm bg-white border border-slate-300 rounded-md py-1 text-slate-900"
                                />
                                <span className="text-xs font-medium text-slate-600">ម៉ោង</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600">
                          សរុបម៉ោងសិក្សាក្នុង ១ សប្ដាហ៍សម្រាប់កម្រិតនេះ៖{' '}
                          <strong className="text-indigo-700 text-sm">{totalHours} ម៉ោង</strong>
                        </span>
                        <button
                          onClick={() => showToast('បានរក្សាទុកផែនការម៉ោងសិក្សា!')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          💾 រក្សាទុកផែនការម៉ោងនេះ
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Right 5 cols: Smart Auto-Generator Rules */}
              <div className="lg:col-span-5 bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-200 pb-3">
                  ២. លក្ខខណ្ឌឆ្លាតវៃសម្រាប់ការរៀបស្វ័យប្រវត្តិ (Auto-Generator Rules)
                </h3>

                <div className="space-y-3 text-xs md:text-sm">
                  <label className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulePreferWishes}
                      onChange={(e) => setRulePreferWishes(e.target.checked)}
                      className="mt-1 rounded text-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-emerald-950">
                        ⭐ ផ្តល់អាទិភាពថ្ងៃ/ម៉ោងដែលគ្រូចង់បង្រៀន (Preferred Days/Shifts)
                      </div>
                      <div className="text-xs text-emerald-700">
                        ប្រព័ន្ធនឹងជ្រើសរើសថ្ងៃ និងវេន (ព្រឹក/រសៀល) ដែលគ្រូបានស្នើសុំមុនគេបង្អស់
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/70 border border-rose-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleRespectUnavailable}
                      onChange={(e) => setRuleRespectUnavailable(e.target.checked)}
                      className="mt-1 rounded text-rose-600"
                    />
                    <div>
                      <div className="font-bold text-rose-950">
                        ⛔ ហាមដាក់ម៉ោងចំថ្ងៃ/ម៉ោងដែលគ្រូសុំទំនេរ (Respect Day-Offs)
                      </div>
                      <div className="text-xs text-rose-700">
                        ជៀសវាងដាច់ខាតនូវម៉ោង ឬថ្ងៃដែលគ្រូបានកំណត់ថារវល់ ឬសុំទំនេរ
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleDoubleBlocks}
                      onChange={(e) => setRuleDoubleBlocks(e.target.checked)}
                      className="mt-1 rounded text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-indigo-950">
                        🔗 រៀបជាប្លុក ២ ម៉ោងជាប់គ្នា (Double-Period Blocks)
                      </div>
                      <div className="text-xs text-indigo-700">
                        មុខវិជ្ជាដែលមានចាប់ពី ២ ម៉ោងឡើងទៅ នឹងត្រូវដាក់ ២ ម៉ោងជាប់គ្នាក្នុងវេនតែមួយ (ឧ. ម៉ោង ១-២ ឬ ៣-៤)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleSpreadDays}
                      onChange={(e) => setRuleSpreadDays(e.target.checked)}
                      className="mt-1 rounded text-amber-600"
                    />
                    <div>
                      <div className="font-bold text-amber-950">
                        📅 ពង្រាយមុខវិជ្ជាមិនឱ្យជាន់ថ្ងៃគ្នា (Spread Across Week)
                      </div>
                      <div className="text-xs text-amber-700">
                        ជៀសវាងដាក់មុខវិជ្ជាតែមួយលើសពី ២ ម៉ោងក្នុងថ្ងៃតែមួយសម្រាប់ថ្នាក់ដដែល
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg bg-sky-50/70 border border-sky-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleMorningCore}
                      onChange={(e) => setRuleMorningCore(e.target.checked)}
                      className="mt-1 rounded text-sky-600"
                    />
                    <div>
                      <div className="font-bold text-sky-950">
                        🌅 ផ្តល់អាទិភាពមុខវិជ្ជាគោលនៅវេនព្រឹក (Core Subjects Morning Priority)
                      </div>
                      <div className="text-xs text-sky-700">
                        ផ្តល់អាទិភាពដាក់ គណិតវិទ្យា អក្សរសាស្ត្រខ្មែរ រូប គីមី ជីវៈ នៅម៉ោងវេនព្រឹកមុន
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Teacher Preferences & Day-Off Quick Matrix */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    ៣. តារាងកំណត់ថ្ងៃចង់បង្រៀន និងថ្ងៃសុំទំនេររបស់គ្រូ (Teacher Wish & Day-Off Matrix)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ចុចលើថ្ងៃនីមួយៗរបស់គ្រូ ដើម្បីប្ដូរស្ថានភាព៖{' '}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      ⭐ ចង់បង្រៀន
                    </span>{' '}
                    ➔{' '}
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                      ⛔ សុំទំនេរពេញមួយថ្ងៃ
                    </span>{' '}
                    ➔{' '}
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      ✅ ទំនេរធម្មតា
                    </span>{' '}
                    (ឬចុច «ម៉ោងលម្អិត» ដើម្បីរើសម៉ោងទី១-ទី៩)
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={prefMatrixSearch}
                    onChange={(e) => setPrefMatrixSearch(e.target.value)}
                    placeholder="ស្វែងរកឈ្មោះគ្រូ ឬកូដ..."
                    className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-800 text-white text-center">
                      <th className="border border-slate-600 py-2.5 px-3 text-left">
                        កូដ & ឈ្មោះគ្រូបង្រៀន
                      </th>
                      <th className="border border-slate-600 py-2.5 px-2">មុខវិជ្ជា</th>
                      <th className="border border-slate-600 py-2.5 px-2">វេនចង់បង្រៀន</th>
                      <th className="border border-slate-600 py-2.5 px-2">ចន្ទ</th>
                      <th className="border border-slate-600 py-2.5 px-2">អង្គារ</th>
                      <th className="border border-slate-600 py-2.5 px-2">ពុធ</th>
                      <th className="border border-slate-600 py-2.5 px-2">ព្រហស្បតិ៍</th>
                      <th className="border border-slate-600 py-2.5 px-2">សុក្រ</th>
                      <th className="border border-slate-600 py-2.5 px-2">សៅរ៍</th>
                      <th className="border border-slate-600 py-2.5 px-2">កំណត់ម៉ោងលម្អិត</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.teachers
                      .filter((t) => {
                        const q = prefMatrixSearch.trim().toLowerCase();
                        return (
                          !q ||
                          t.name.toLowerCase().includes(q) ||
                          t.id.toLowerCase().includes(q) ||
                          t.subject.toLowerCase().includes(q)
                        );
                      })
                      .map((t) => {
                        const unavailable = t.unavailable || [];
                        const preferred = t.preferred || [];
                        const prefShift = t.preferredShift || 'any';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="border border-slate-200 py-2 px-3 font-bold text-slate-900">
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] mr-1.5">
                                {formatCodeSubscript(t.id)}
                              </span>
                              {t.name.replace(`${t.id} - `, '')}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center text-slate-600">
                              {t.subject}
                            </td>
                            <td className="border border-slate-200 py-2 px-2 text-center">
                              <select
                                value={prefShift}
                                onChange={(e) => {
                                  const val = e.target.value as 'any' | 'morning' | 'afternoon';
                                  updateState((prev) => ({
                                    ...prev,
                                    teachers: prev.teachers.map((item) =>
                                      item.id === t.id ? { ...item, preferredShift: val } : item
                                    ),
                                  }));
                                }}
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium"
                              >
                                <option value="any">គ្រប់វេន</option>
                                <option value="morning">🌅 ចង់បានវេនព្រឹក</option>
                                <option value="afternoon">☀️ ចង់បានវេនរសៀល</option>
                              </select>
                            </td>
                            {DAYS.map((d) => {
                              const daySlots = PERIODS.map((p) => `${d.id}_${p.id}`);
                              const unavailCount = daySlots.filter((k) =>
                                unavailable.includes(k)
                              ).length;
                              const prefCount = daySlots.filter((k) =>
                                preferred.includes(k)
                              ).length;

                              let btnClass =
                                'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300';
                              let label = '✅ ធម្មតា';
                              if (unavailCount === daySlots.length) {
                                btnClass =
                                  'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 font-bold';
                                label = '⛔ សុំទំនេរ';
                              } else if (prefCount === daySlots.length) {
                                btnClass =
                                  'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 font-bold';
                                label = '⭐ ចង់បង្រៀន';
                              } else if (unavailCount > 0 || prefCount > 0) {
                                btnClass =
                                  'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-semibold';
                                label = `⚙️ (${prefCount}⭐/${unavailCount}⛔)`;
                              }

                              return (
                                <td
                                  key={d.id}
                                  className="border border-slate-200 py-1.5 px-1.5 text-center"
                                >
                                  <button
                                    onClick={() => cycleTeacherDayPref(t.id, d.id)}
                                    className={`w-full py-1 px-1.5 rounded border text-[11px] transition cursor-pointer ${btnClass}`}
                                  >
                                    {label}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="border border-slate-200 py-1.5 px-2 text-center">
                              <button
                                onClick={() => setAvailModalTeacherId(t.id)}
                                className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 cursor-pointer"
                              >
                                ម៉ោងលម្អិត
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: TEACHERS MANAGEMENT */}
        {activeTab === 'teachers' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Teacher Form */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2.5">
                ➕ បន្ថែមគ្រូបង្រៀន / កូដគ្រូថ្មី
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    កូដគ្រូ (ឧ. K6, M5, P3) *
                  </label>
                  <input
                    type="text"
                    value={newTeacherCode}
                    onChange={(e) => setNewTeacherCode(e.target.value)}
                    placeholder="ឧ. K6"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    គោត្តនាម និងនាម *
                  </label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="ឧ. លោកគ្រូ សុខ វិបុល"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    មុខវិជ្ជាឯកទេស *
                  </label>
                  <select
                    value={newTeacherSub}
                    onChange={(e) => setNewTeacherSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {state.subjects.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ម៉ោងអតិបរមា/សប្ដាហ៍
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={newTeacherMax}
                      onChange={(e) => setNewTeacherMax(parseInt(e.target.value, 10) || 18)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      លេខទូរស័ព្ទ / សម្គាល់
                    </label>
                    <input
                      type="text"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(e.target.value)}
                      placeholder="បន្ទុកថ្នាក់..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const code = newTeacherCode.trim();
                    const name = newTeacherName.trim();
                    if (!name) {
                      showToast('សូមបញ្ចូលឈ្មោះគ្រូបង្រៀន!', 'error');
                      return;
                    }
                    const id = code || 'T' + Date.now();
                    if (state.teachers.some((t) => t.id === id)) {
                      showToast('កូដគ្រូនេះមានរួចហើយ!', 'error');
                      return;
                    }
                    updateState((prev) => ({
                      ...prev,
                      teachers: [
                        ...prev.teachers,
                        {
                          id,
                          name: code ? `${code} - ${name}` : name,
                          subject: newTeacherSub,
                          maxHours: newTeacherMax,
                          phone: newTeacherPhone.trim(),
                          unavailable: [],
                          preferred: [],
                          preferredShift: 'any',
                        },
                      ],
                    }));
                    setNewTeacherCode('');
                    setNewTeacherName('');
                    setNewTeacherPhone('');
                    showToast('បានបន្ថែមគ្រូបង្រៀនថ្មី!');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm cursor-pointer"
                >
                  រក្សាទុកគ្រូបង្រៀន
                </button>
              </div>
            </div>

            {/* Teachers List */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <h2 className="font-bold text-slate-800 text-base">
                  👨‍🏫 បញ្ជីកូដគ្រូបង្រៀន និងបន្ទុកម៉ោងបង្រៀន
                </h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="ស្វែងរកកូដ ឬឈ្មោះគ្រូ..."
                    className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs md:text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3 text-left">កូដ & ឈ្មោះគ្រូ</th>
                      <th className="py-2.5 px-3 text-left">មុខវិជ្ជា</th>
                      <th className="py-2.5 px-3 text-center">ម៉ោងបង្រៀន/សប្ដាហ៍</th>
                      <th className="py-2.5 px-3 text-center">ម៉ោងទំនេរ/សុំច្បាប់</th>
                      <th className="py-2.5 px-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.teachers
                      .filter((t) => {
                        const q = teacherSearch.trim().toLowerCase();
                        return (
                          !q ||
                          t.name.toLowerCase().includes(q) ||
                          t.subject.toLowerCase().includes(q) ||
                          t.id.toLowerCase().includes(q)
                        );
                      })
                      .map((t) => {
                        const assignedHours = state.schedule.filter(
                          (s) => s.teacherId === t.id
                        ).length;
                        const pct = Math.min(
                          100,
                          Math.round((assignedHours / (t.maxHours || 20)) * 100)
                        );
                        const barColor =
                          assignedHours > t.maxHours
                            ? 'bg-rose-500'
                            : assignedHours === t.maxHours
                            ? 'bg-emerald-500'
                            : 'bg-indigo-600';
                        const unavailCount = (t.unavailable || []).length;
                        const prefCount = (t.preferred || []).length;

                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800">{t.name}</div>
                              <div className="text-xs text-slate-500">
                                {t.phone || 'មិនមានសម្គាល់'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                {t.subject}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="text-xs font-bold mb-1">
                                {assignedHours} / {t.maxHours} ម៉ោង
                              </div>
                              <div className="w-28 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`${barColor} h-full`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setAvailModalTeacherId(t.id)}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                              >
                                ⚙️ ថ្ងៃចង់បង្រៀន/សុំទំនេរ ({prefCount}⭐ / {unavailCount}⛔)
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1">
                              <button
                                onClick={() =>
                                  setRenameModal({
                                    isOpen: true,
                                    teacherId: t.id,
                                    currentName: t.name,
                                  })
                                }
                                className="text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
                              >
                                ✏️ កែឈ្មោះ
                              </button>
                              <button
                                onClick={() => jumpToTimetable('teacher', t.id)}
                                className="text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
                              >
                                មើលកាលវិភាគ
                              </button>
                              <button
                                onClick={() => {
                                  askConfirm(
                                    'លុបគ្រូបង្រៀន',
                                    `តើអ្នកពិតជាចង់លុបគ្រូ "${t.name}" និងម៉ោងបង្រៀនរបស់គាត់មែនទេ?`,
                                    () => {
                                      updateState((prev) => ({
                                        ...prev,
                                        teachers: prev.teachers.filter((x) => x.id !== t.id),
                                        schedule: prev.schedule.filter(
                                          (s) => s.teacherId !== t.id
                                        ),
                                      }));
                                      showToast('បានលុបគ្រូបង្រៀន!');
                                    },
                                    { confirmLabel: 'លុបគ្រូ', isDanger: true }
                                  );
                                }}
                                className="text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
                              >
                                លុប
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: CLASSES & SUBJECTS */}
        {activeTab === 'classes' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes Management */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2.5">
                🏫 គ្រប់គ្រងថ្នាក់រៀន និងគ្រូបន្ទុកថ្នាក់
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  placeholder="កូដថ្នាក់ (ឧ. 7D)"
                  className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="ឈ្មោះថ្នាក់ (ឧ. ថ្នាក់ទី 7D)"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  placeholder="គ្រូបន្ទុកថ្នាក់"
                  className="w-40 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={() => {
                    const id = newClassId.trim() || 'C' + Date.now();
                    const name = newClassName.trim();
                    if (!name) {
                      showToast('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន!', 'error');
                      return;
                    }
                    updateState((prev) => ({
                      ...prev,
                      classes: [
                        ...prev.classes,
                        { id, name, room: newClassRoom.trim() },
                      ],
                    }));
                    setNewClassId('');
                    setNewClassName('');
                    setNewClassRoom('');
                    showToast('បានបន្ថែមថ្នាក់រៀនថ្មី!');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  បន្ថែមថ្នាក់
                </button>
              </div>
              <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                {state.classes.map((c) => {
                  const slotCount = state.schedule.filter((s) => s.classId === c.id).length;
                  return (
                    <div
                      key={c.id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        {c.room && (
                          <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {c.room}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-indigo-600 font-medium">
                          ({slotCount} ម៉ោង/សប្ដាហ៍)
                        </span>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => jumpToTimetable('class', c.id)}
                          className="text-xs text-indigo-600 hover:underline font-medium cursor-pointer"
                        >
                          មើលកាលវិភាគ
                        </button>
                        <button
                          onClick={() => {
                            askConfirm(
                              'លុបថ្នាក់រៀន',
                              `តើអ្នកពិតជាចង់លុប "${c.name}" មែនទេ?`,
                              () => {
                                updateState((prev) => ({
                                  ...prev,
                                  classes: prev.classes.filter((x) => x.id !== c.id),
                                  schedule: prev.schedule.filter((s) => s.classId !== c.id),
                                }));
                                showToast('បានលុបថ្នាក់រៀន!');
                              },
                              { confirmLabel: 'លុបថ្នាក់', isDanger: true }
                            );
                          }}
                          className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                        >
                          លុប
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subjects Management */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2.5">
                📚 គ្រប់គ្រងមុខវិជ្ជា និងចំនួនម៉ោងស្តង់ដារ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="ឈ្មោះមុខវិជ្ជាថ្មី"
                  className="sm:col-span-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={newSubColor}
                  onChange={(e) => setNewSubColor(e.target.value as ColorKey)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="indigo">ពណ៌ខៀវចាស់ (Indigo)</option>
                  <option value="emerald">ពណ៌បៃតង (Emerald)</option>
                  <option value="amber">ពណ៌លឿងទុំ (Amber)</option>
                  <option value="rose">ពណ៌ផ្កាឈូក (Rose)</option>
                  <option value="sky">ពណ៌ផ្ទៃមេឃ (Sky)</option>
                  <option value="purple">ពណ៌ស្វាយ (Purple)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newSubHours}
                    onChange={(e) => setNewSubHours(parseInt(e.target.value, 10) || 2)}
                    title="ម៉ោងក្នុង១សប្ដាហ៍/ថ្នាក់"
                    className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-sm text-center"
                  />
                  <button
                    onClick={() => {
                      const name = newSubName.trim();
                      if (!name) {
                        showToast('សូមបញ្ចូលឈ្មោះមុខវិជ្ជា!', 'error');
                        return;
                      }
                      if (state.subjects.some((s) => s.name === name)) {
                        showToast('មុខវិជ្ជានេះមានរួចហើយ!', 'error');
                        return;
                      }
                      updateState((prev) => ({
                        ...prev,
                        subjects: [
                          ...prev.subjects,
                          { name, color: newSubColor, hoursPerWeek: newSubHours },
                        ],
                      }));
                      setNewSubName('');
                      showToast('បានបន្ថែមមុខវិជ្ជាថ្មី!');
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    បន្ថែម
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto">
                {state.subjects.map((s) => {
                  const st = COLOR_STYLES[s.color] || COLOR_STYLES.indigo;
                  return (
                    <div
                      key={s.name}
                      className={`p-3 rounded-lg border ${st.border} ${st.bg} flex items-center justify-between`}
                    >
                      <div>
                        <div className={`font-bold text-sm ${st.text}`}>{s.name}</div>
                        <div className="text-xs opacity-75">
                          ស្តង់ដារ៖ {s.hoursPerWeek} ម៉ោង/សប្ដាហ៍
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          askConfirm(
                            'លុបមុខវិជ្ជា',
                            `តើអ្នកពិតជាចង់លុបមុខវិជ្ជា "${s.name}" មែនទេ?`,
                            () => {
                              updateState((prev) => ({
                                ...prev,
                                subjects: prev.subjects.filter((x) => x.name !== s.name),
                              }));
                              showToast('បានលុបមុខវិជ្ជា!');
                            },
                            { confirmLabel: 'លុបមុខវិជ្ជា', isDanger: true }
                          );
                        }}
                        className="text-xs text-rose-600 hover:bg-white/60 px-2 py-1 rounded font-semibold cursor-pointer"
                      >
                        លុប
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TAB 7: ADMINISTRATION CHRONO MANAGEMENT */}
        {activeTab === 'administration' && (
          <section className="space-y-5">
            {(() => {
              const adminData = state.administration || {
                schoolName: 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី',
                items: ADMIN_DEFAULT_ITEMS,
              };
              const q = adminSearchText.trim().toLowerCase();
              const filteredItems = adminData.items.filter((item) => {
                const matchRole =
                  adminCurrentRole === 'ALL' || item.role === adminCurrentRole;
                const matchSearch =
                  !q ||
                  item.title.toLowerCase().includes(q) ||
                  item.code.toLowerCase().includes(q) ||
                  item.category.toLowerCase().includes(q);
                return matchRole && matchSearch;
              });

              const countByRole = (r: 'ALL' | AdminRoleKey) =>
                r === 'ALL'
                  ? adminData.items.length
                  : adminData.items.filter((i) => i.role === r).length;

              return (
                <>
                  {/* Top Control Panel */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4 no-print">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs mb-1">
                          DOCUMENT CHRONO & BINDER SPINE LABELS
                        </span>
                        <h2 className="font-moul text-slate-800 text-base md:text-lg flex items-center gap-2">
                          <span>📁 ប្រព័ន្ធគ្រប់គ្រងបញ្ជីក្រូណូឯកសារ និងស្លាកខ្នងក្រូណូ</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          រៀបចំតាមស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា (នាយករងហិរញ្ញវត្ថុ នាយករង លេខានាយក និងគ្រូបង្រៀន)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openAdminModal()}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>បន្ថែមក្រូណូថ្មី</span>
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>បោះពុម្ព (Print A4)</span>
                        </button>
                        <button
                          onClick={() => {
                            askConfirm(
                              'កំណត់បញ្ជីក្រូណូដើមឡើងវិញ',
                              'តើអ្នកពិតជាចង់កំណត់បញ្ជីក្រូណូរដ្ឋបាលទាំង ៦៦ មុខឱ្យត្រឡប់ទៅទម្រង់ដើមវិញមែនទេ?',
                              () => {
                                updateState((prev) => ({
                                  ...prev,
                                  administration: {
                                    schoolName: 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី',
                                    items: JSON.parse(JSON.stringify(ADMIN_DEFAULT_ITEMS)),
                                  },
                                }));
                                showToast('🔄 បានកំណត់បញ្ជីក្រូណូរដ្ឋបាលដើមឡើងវិញ!');
                              },
                              { confirmLabel: 'កំណត់ដើមវិញ', isDanger: true }
                            );
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs md:text-sm px-3.5 py-2.5 rounded-lg transition cursor-pointer"
                        >
                          🔄 កំណត់ដើមវិញ
                        </button>
                      </div>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          🏫 ឈ្មោះសាលារៀន (បង្ហាញលើក្បាលតារាង និងស្លាកខ្នងក្រូណូ)៖
                        </label>
                        <input
                          type="text"
                          value={adminData.schoolName}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState((prev) => ({
                              ...prev,
                              administration: {
                                ...(prev.administration || {
                                  items: ADMIN_DEFAULT_ITEMS,
                                }),
                                schoolName: val,
                              },
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          🔍 ស្វែងរកឈ្មោះឯកសារ ឬលេខកូដក្រូណូ៖
                        </label>
                        <input
                          type="text"
                          value={adminSearchText}
                          onChange={(e) => setAdminSearchText(e.target.value)}
                          placeholder="វាយពាក្យគន្លឹះ (ឧ. ហវ-០១, GEIP, សិស្ស, គណនេយ្យ...)"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          👁️ ជ្រើសរើសទម្រង់បង្ហាញ និងបោះពុម្ព៖
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            onClick={() => setAdminCurrentView('table')}
                            className={`py-1.5 px-3 rounded-md font-bold text-xs md:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              adminCurrentView === 'table'
                                ? 'bg-indigo-700 text-white shadow'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>បញ្ជីក្រូណូ (តារាង)</span>
                          </button>
                          <button
                            onClick={() => setAdminCurrentView('spine')}
                            className={`py-1.5 px-3 rounded-md font-bold text-xs md:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              adminCurrentView === 'spine'
                                ? 'bg-indigo-700 text-white shadow'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                            <span>ស្លាកខ្នងក្រូណូ (Spines)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Role Filter Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(
                        [
                          ['ALL', 'ទាំងអស់'],
                          ['FINANCE', '១. នាយករងហិរញ្ញវត្ថុ'],
                          ['DEPUTY', '២. នាយករង'],
                          ['SECRETARY', '៣. លេខានាយក'],
                          ['TEACHER', '៤. គ្រូបង្រៀន/បន្ទុកថ្នាក់'],
                        ] as Array<['ALL' | AdminRoleKey, string]>
                      ).map(([rKey, rLabel]) => {
                        const isActive = adminCurrentRole === rKey;
                        return (
                          <button
                            key={rKey}
                            onClick={() => setAdminCurrentRole(rKey)}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                              isActive
                                ? 'bg-indigo-900 text-white shadow'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {rLabel} ({countByRole(rKey)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* View 1: Table View */}
                  {adminCurrentView === 'table' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
                        <p className="font-moul text-sm md:text-base text-slate-800">
                          ព្រះរាជាណាចក្រកម្ពុជា
                        </p>
                        <p className="font-moul text-xs md:text-sm text-slate-700 mt-0.5">
                          ជាតិ សាសនា ព្រះមហាក្សត្រ
                        </p>
                        <p className="font-bold text-slate-800 text-sm md:text-base mt-2">
                          {adminData.schoolName}
                        </p>
                        <h3 className="font-moul text-base md:text-lg text-indigo-950 mt-2">
                          បញ្ជីរាយនាមក្រូណូឯកសាររដ្ឋបាល និងបច្ចេកទេសតាមផ្នែក
                        </h3>
                      </div>

                      {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          មិនមានទិន្នន័យក្រូណូត្រូវនឹងការស្វែងរកនោះទេ...
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {(['FINANCE', 'DEPUTY', 'SECRETARY', 'TEACHER'] as AdminRoleKey[])
                            .filter(
                              (rk) => adminCurrentRole === 'ALL' || rk === adminCurrentRole
                            )
                            .map((roleKey) => {
                              const roleItems = filteredItems.filter(
                                (i) => i.role === roleKey
                              );
                              if (roleItems.length === 0) return null;

                              const headerColors: Record<AdminRoleKey, string> = {
                                FINANCE: 'bg-blue-900 text-white',
                                DEPUTY: 'bg-emerald-900 text-white',
                                SECRETARY: 'bg-purple-900 text-white',
                                TEACHER: 'bg-amber-800 text-white',
                              };

                              return (
                                <div key={roleKey}>
                                  <div
                                    className={`${headerColors[roleKey]} px-4 py-2.5 rounded-t-lg font-bold text-sm md:text-base flex justify-between items-center`}
                                  >
                                    <span>📌 ផ្នែក៖ {ADMIN_ROLES[roleKey]}</span>
                                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
                                      សរុប៖ {roleItems.length} ក្រូណូ
                                    </span>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-slate-300 text-xs md:text-sm">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-700">
                                          <th className="border border-slate-300 px-3 py-2 w-14 text-center">
                                            ល.រ
                                          </th>
                                          <th className="border border-slate-300 px-3 py-2 w-28 text-center">
                                            លេខកូដក្រូណូ
                                          </th>
                                          <th className="border border-slate-300 px-3 py-2 w-64 text-left">
                                            ជំពូក / ផ្នែករង
                                          </th>
                                          <th className="border border-slate-300 px-3 py-2 text-left">
                                            ឈ្មោះក្រូណូឯកសារ
                                          </th>
                                          <th className="border border-slate-300 px-3 py-2 w-28 text-center no-print">
                                            សកម្មភាព
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {roleItems.map((item, idx) => (
                                          <tr
                                            key={item.id}
                                            className="hover:bg-slate-50 transition"
                                          >
                                            <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-600">
                                              {idx + 1}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-center">
                                              <span className="inline-block font-bold px-2.5 py-0.5 rounded bg-slate-200 text-slate-900">
                                                {item.code}
                                              </span>
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-slate-600 font-medium">
                                              {item.category}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                                              {item.title}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-center no-print space-x-1">
                                              <button
                                                onClick={() => openAdminModal(item.id)}
                                                className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold cursor-pointer"
                                                title="កែប្រែ"
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                onClick={() => deleteAdminItem(item.id)}
                                                className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-xs font-bold cursor-pointer"
                                                title="លុប"
                                              >
                                                🗑️
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* View 2: Binder Spine Labels */}
                  {adminCurrentView === 'spine' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs md:text-sm text-amber-900 no-print">
                        💡 <strong>គន្លឹះបោះពុម្ពស្លាកខ្នងក្រូណូ៖</strong> ស្លាកខ្នងក្រូណូនីមួយៗត្រូវបានរចនាទំហំស្តង់ដារ{' '}
                        <strong>ទទឹង 5.5 cm × បណ្តោយ 27 cm</strong> (១ទំព័រ A4 បោះពុម្ពបាន ៣ ស្លាក) សម្រាប់កាត់បិទលើខ្នងសឺមីក្រូណូក្រាស់។ ចុចប៊ូតុង{' '}
                        <strong>បោះពុម្ព (Print A4)</strong> ខាងលើដើម្បីបោះពុម្ព។
                      </div>
                      <div className="flex flex-wrap gap-6 justify-center admin-spines">
                        {filteredItems.map((item) => {
                          const borderMap: Record<AdminRoleKey, string> = {
                            FINANCE: 'border-blue-800',
                            DEPUTY: 'border-emerald-800',
                            SECRETARY: 'border-purple-800',
                            TEACHER: 'border-amber-700',
                          };
                          const badgeMap: Record<AdminRoleKey, string> = {
                            FINANCE: 'bg-blue-900 text-white',
                            DEPUTY: 'bg-emerald-900 text-white',
                            SECRETARY: 'bg-purple-900 text-white',
                            TEACHER: 'bg-amber-800 text-white',
                          };
                          const subBgMap: Record<AdminRoleKey, string> = {
                            FINANCE: 'bg-blue-50 text-blue-950 border-blue-200',
                            DEPUTY: 'bg-emerald-50 text-emerald-950 border-emerald-200',
                            SECRETARY: 'bg-purple-50 text-purple-950 border-purple-200',
                            TEACHER: 'bg-amber-50 text-amber-950 border-amber-200',
                          };

                          return (
                            <div
                              key={item.id}
                              className={`admin-spine border-4 ${borderMap[item.role]} rounded-lg bg-white shadow-md flex flex-col justify-between p-2.5 text-center relative group`}
                            >
                              <div className="no-print absolute top-1 right-1 hidden group-hover:flex gap-1 bg-white/95 p-1 rounded shadow">
                                <button
                                  onClick={() => openAdminModal(item.id)}
                                  className="text-xs px-1.5 py-0.5 bg-blue-100 rounded cursor-pointer"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteAdminItem(item.id)}
                                  className="text-xs px-1.5 py-0.5 bg-rose-100 rounded cursor-pointer"
                                >
                                  🗑️
                                </button>
                              </div>

                              <div className="border-b-2 border-slate-800 pb-2">
                                <div className="text-[10px] font-bold text-slate-500">
                                  ក្រសួងអប់រំ យុវជន និងកីឡា
                                </div>
                                <div className="text-xs font-extrabold text-slate-900 mt-0.5 leading-tight">
                                  {adminData.schoolName}
                                </div>
                                <div
                                  className={`mt-1.5 inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                    badgeMap[item.role]
                                  }`}
                                >
                                  {item.roleName}
                                </div>
                              </div>

                              <div
                                className={`my-2 py-1.5 px-1 rounded border ${
                                  subBgMap[item.role]
                                } text-[11px] font-bold leading-snug`}
                              >
                                {item.category}
                              </div>

                              <div className="flex-1 flex items-center justify-center px-1 py-2 overflow-hidden">
                                <div className="admin-spine-title font-extrabold text-base text-slate-900 leading-snug">
                                  {item.title}
                                </div>
                              </div>

                              <div className="pt-2 border-t-2 border-slate-800 space-y-1.5">
                                <div className="w-8 h-8 rounded-full border-2 border-slate-400 mx-auto bg-slate-50 flex items-center justify-center text-[9px] text-slate-400">
                                  រន្ធដៃ
                                </div>
                                <div
                                  className={`${
                                    badgeMap[item.role]
                                  } py-1.5 rounded font-extrabold text-base tracking-wider`}
                                >
                                  {item.code}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-500">
                                  ឆ្នាំសិក្សា ២០២៦-២០២៧
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {/* TAB 8: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Completeness Report */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-bold text-slate-800 text-base border-b pb-2.5">
                  📊 របាយការណ៍ម៉ោងសិក្សាតាមថ្នាក់រៀន (Class Completeness)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b">
                        <th className="py-2.5 px-3 text-left">ថ្នាក់រៀន</th>
                        <th className="py-2.5 px-3 text-center">ម៉ោងបានរៀប</th>
                        <th className="py-2.5 px-3 text-center">ម៉ោងតាមផែនការ</th>
                        <th className="py-2.5 px-3 text-left">មុខវិជ្ជាដែលខ្វះម៉ោង</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {state.classes.map((c) => {
                        const slots = state.schedule.filter((s) => s.classId === c.id);
                        const planSlots = (state.officialServicePlan || []).filter(
                          (s) => s.classId === c.id
                        );
                        const quota = planSlots.length || slots.length;

                        const missing: string[] = [];
                        state.subjects.forEach((sub) => {
                          const target = planSlots.filter(
                            (p) => p.subjectName === sub.name
                          ).length;
                          if (target > 0) {
                            const count = slots.filter(
                              (s) => s.subjectName === sub.name
                            ).length;
                            if (count < target) {
                              missing.push(`${sub.code || sub.name} (-${target - count})`);
                            }
                          }
                        });

                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {c.name}{' '}
                              <span className="text-xs font-normal text-slate-500">
                                ({c.room || ''})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {slots.length} ម៉ោង
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600">
                              {quota} ម៉ោង
                            </td>
                            <td className="py-2.5 px-3 text-xs">
                              {missing.length === 0 ? (
                                <span className="text-emerald-600 font-semibold">
                                  ✅ គ្រប់ចំនួនម៉ោងតាមផែនការ
                                </span>
                              ) : (
                                <span className="text-amber-700">{missing.join(', ')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subject Distribution Report */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-bold text-slate-800 text-base border-b pb-2.5">
                  📈 ស្ថិតិម៉ោងសរុបតាមមុខវិជ្ជា និងគ្រូបង្រៀន
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b">
                        <th className="py-2.5 px-3 text-left">មុខវិជ្ជា</th>
                        <th className="py-2.5 px-3 text-center">ចំនួនកូដគ្រូ</th>
                        <th className="py-2.5 px-3 text-center">ម៉ោងបានរៀបសរុប</th>
                        <th className="py-2.5 px-3 text-center">ម៉ោងតាមផែនការសរុប</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {state.subjects.map((sub) => {
                        const teacherCount = state.teachers.filter(
                          (t) => t.subject === sub.name
                        ).length;
                        const assigned = state.schedule.filter(
                          (s) => s.subjectName === sub.name
                        ).length;
                        const needed = (state.officialServicePlan || []).filter(
                          (s) => s.subjectName === sub.name
                        ).length;
                        const st = COLOR_STYLES[sub.color] || COLOR_STYLES.indigo;

                        return (
                          <tr key={sub.name} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2.5 py-1 rounded font-semibold text-xs ${st.bg} ${st.text} border ${st.border}`}
                              >
                                {sub.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold">
                              {teacherCount} កូដ
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {assigned} ម៉ោង
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600">
                              {needed} ម៉ោង
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: ASSIGN / EDIT SLOT */}
      {slotModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  កំណត់ម៉ោងសិក្សា (Assign Slot)
                </h3>
                <p className="text-xs text-slate-500">
                  {DAYS.find((x) => x.id === slotModal.dayId)?.name || ''} •{' '}
                  {PERIODS.find((x) => x.id === slotModal.periodId)?.name || ''} (
                  {PERIODS.find((x) => x.id === slotModal.periodId)?.time || ''})
                </p>
              </div>
              <button
                onClick={() => setSlotModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ថ្នាក់រៀន
                </label>
                <select
                  value={slotModal.classId}
                  onChange={(e) =>
                    setSlotModal((prev) => ({ ...prev, classId: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {state.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.room || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  មុខវិជ្ជា
                </label>
                <select
                  value={slotModal.subjectName}
                  onChange={(e) => {
                    const nextSub = e.target.value;
                    const matching = state.teachers.filter((t) => t.subject === nextSub);
                    setSlotModal((prev) => ({
                      ...prev,
                      subjectName: nextSub,
                      teacherId: matching[0]?.id || prev.teacherId,
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {state.subjects.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  គ្រូបង្រៀន
                </label>
                <select
                  value={slotModal.teacherId}
                  onChange={(e) =>
                    setSlotModal((prev) => ({ ...prev, teacherId: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {(() => {
                    const matching = state.teachers.filter(
                      (t) => t.subject === slotModal.subjectName
                    );
                    const others = state.teachers.filter(
                      (t) => t.subject !== slotModal.subjectName
                    );
                    return (
                      <>
                        {matching.length > 0 && (
                          <optgroup label="គ្រូឯកទេសមុខវិជ្ជានេះ">
                            {matching.map((t) => {
                              const busy = state.schedule.find(
                                (s) =>
                                  s.day === slotModal.dayId &&
                                  s.period === slotModal.periodId &&
                                  s.teacherId === t.id &&
                                  s.classId !== slotModal.classId
                              );
                              const unavail = (t.unavailable || []).includes(
                                `${slotModal.dayId}_${slotModal.periodId}`
                              );
                              const tag = busy
                                ? ` [ជាប់ថ្នាក់ ${busy.classId}]`
                                : unavail
                                ? ' [សុំទំនេរ]'
                                : ' [ទំនេរ]';
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                  {tag}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        {others.length > 0 && (
                          <optgroup label="គ្រូមុខវិជ្ជាផ្សេងទៀត">
                            {others.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.subject})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  កំណត់សម្គាល់បន្ថែម (ជម្រើស)
                </label>
                <input
                  type="text"
                  value={slotModal.note}
                  onChange={(e) =>
                    setSlotModal((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="ឧ. បន្ទប់ពិសោធន៍, ពលកម្ម..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Live Conflict Warning */}
              {(() => {
                const busy = state.schedule.find(
                  (s) =>
                    s.day === slotModal.dayId &&
                    s.period === slotModal.periodId &&
                    s.teacherId === slotModal.teacherId &&
                    s.classId !== slotModal.classId
                );
                const teacher = getTeacherById(slotModal.teacherId);
                const unavail =
                  teacher &&
                  (teacher.unavailable || []).includes(
                    `${slotModal.dayId}_${slotModal.periodId}`
                  );

                if (!busy && !unavail) return null;

                return (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs font-medium">
                    {busy
                      ? `⚠️ ប្រយ័ត្ន៖ ${teacher?.name || ''} កំពុងជាប់បង្រៀននៅថ្នាក់ ${
                          busy.classId
                        } ក្នុងម៉ោងនេះរួចហើយ!`
                      : `⚠️ ចំណាំ៖ ${teacher?.name || ''} បានកំណត់សុំទំនេរនៅម៉ោងនេះ។`}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              {state.schedule.some(
                (s) =>
                  s.day === slotModal.dayId &&
                  s.period === slotModal.periodId &&
                  s.classId === slotModal.classId
              ) ? (
                <button
                  onClick={deleteSlotFromModal}
                  className="text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  🗑️ លុបម៉ោងនេះ
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSlotModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  onClick={saveSlotModal}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TEACHER AVAILABILITY */}
      {availModalTeacherId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {(() => {
              const teacher = getTeacherById(availModalTeacherId);
              if (!teacher) return null;
              return (
                <>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-800">
                        កំណត់ម៉ោងចង់បង្រៀន និងម៉ោងសុំទំនេររបស់គ្រូ
                      </h3>
                      <p className="text-xs text-slate-500">
                        {teacher.name} ({teacher.subject}) — ចុចលើប្រអប់ម៉ោងដើម្បីប្ដូរ៖{' '}
                        <span className="text-emerald-700 font-bold">✅ ទំនេរធម្មតា</span> ➔{' '}
                        <span className="text-amber-600 font-bold">⭐ ចង់បង្រៀន</span> ➔{' '}
                        <span className="text-rose-600 font-bold">⛔ សុំទំនេរ</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setAvailModalTeacherId(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="border border-slate-600 p-2">ម៉ោង / ថ្ងៃ</th>
                          {DAYS.map((d) => (
                            <th key={d.id} className="border border-slate-600 p-2">
                              {d.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((p) => (
                          <tr key={p.id}>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-semibold text-center">
                              {p.name}
                              <div className="text-[10px] text-slate-500">{p.time}</div>
                            </td>
                            {DAYS.map((d) => {
                              const key = `${d.id}_${p.id}`;
                              const isUnavail = (teacher.unavailable || []).includes(key);
                              const isPref = (teacher.preferred || []).includes(key);

                              let cellStyle =
                                'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
                              let cellText = '✅ ធម្មតា';
                              if (isUnavail) {
                                cellStyle =
                                  'bg-rose-100 text-rose-700 font-bold hover:bg-rose-200';
                                cellText = '⛔ សុំទំនេរ';
                              } else if (isPref) {
                                cellStyle =
                                  'bg-amber-100 text-amber-900 font-bold hover:bg-amber-200';
                                cellText = '⭐ ចង់បង្រៀន';
                              }

                              return (
                                <td
                                  key={d.id}
                                  onClick={() => cycleSingleSlotAvail(teacher.id, key)}
                                  className={`border border-slate-300 p-2 text-center cursor-pointer transition ${cellStyle}`}
                                >
                                  {cellText}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <button
                      onClick={() => setAvailModalTeacherId(null)}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      រួចរាល់
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: AUTO-SCHEDULER */}
      {autoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>រៀបកាលវិភាគស្វ័យប្រវត្តិ (Smart Auto-Schedule)</span>
              </h3>
              <button
                onClick={() => setAutoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ប្រព័ន្ធនឹងរៀបចំម៉ោងសិក្សាដោយស្វ័យប្រវត្តិ ដោយគោរពតាមលក្ខខណ្ឌមិនឱ្យជាន់ម៉ោងគ្រូ ម៉ោងគ្រូសុំទំនេរ ថ្ងៃគ្រូចង់បង្រៀន និងរៀបជាប្លុក ២ ម៉ោងជាប់គ្នា។
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ជ្រើសរើសវិសាលភាព៖
                </label>
                <select
                  value={autoModalScope}
                  onChange={(e) => setAutoModalScope(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">រៀបគ្រប់ថ្នាក់ទាំងអស់ (12A ដល់ 7C)</option>
                  <option value="current">រៀបតែថ្នាក់កំពុងជ្រើសរើសបច្ចុប្បន្ន</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ប្រភពផែនការម៉ោងសិក្សា៖
                </label>
                <select
                  value={autoModalMode}
                  onChange={(e) =>
                    setAutoModalMode(e.target.value as 'official' | 'curriculum')
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="official">
                    តាមតារាងបែងចែកសេវាបង្រៀនផ្លូវការរបស់សាលា (២៨នាក់)
                  </option>
                  <option value="curriculum">
                    តាមផែនការម៉ោងសិក្សាដែលអ្នកបានកំណត់ក្នុងផ្ទាំង «កំណត់ផែនការម៉ោង»
                  </option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setAutoModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => {
                  const targetClassId =
                    autoModalScope === 'current' && state.viewMode === 'class'
                      ? entitySelect
                      : 'all';
                  runSmartScheduler(targetClassId, autoModalMode, {
                    preferWishes: rulePreferWishes,
                    respectUnavailable: ruleRespectUnavailable,
                    doubleBlocks: ruleDoubleBlocks,
                    spreadDays: ruleSpreadDays,
                    morningCore: ruleMorningCore,
                  });
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-indigo-950 text-xs font-bold shadow-sm cursor-pointer"
              >
                ចាប់ផ្ដើមរៀបស្វ័យប្រវត្តិ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SERVICE ROSTER EDITOR */}
      {rosterModalIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  {rosterModalIndex >= 0
                    ? `✏️ កែប្រែព័ត៌មានបុគ្គលិក (${rosterForm.name || ''})`
                    : '➕ បន្ថែមបុគ្គលិកថ្មីក្នុងតារាងសេវាបង្រៀន'}
                </h3>
                <p className="text-xs text-slate-500">
                  កែសម្រួលឈ្មោះ ភេទ ថ្ងៃខែឆ្នាំកំណើត ក្របខណ្ឌ មុខវិជ្ជា ម៉ោងបង្រៀន និងកូដកាលវិភាគ
                </p>
              </div>
              <button
                onClick={() => setRosterModalIndex(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveRosterModal} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROSTER_FIELDS.map(([key, label, type]) => (
                  <div
                    key={key}
                    className={key === 'breakdown' || key === 'note' ? 'sm:col-span-3' : ''}
                  >
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={rosterForm[key] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRosterForm((prev) => {
                          const next = { ...prev, [key]: val };
                          if (key === 'reqHours' || key === 'extraHours') {
                            const req = Number(
                              key === 'reqHours' ? val : prev.reqHours || 0
                            );
                            const extra = Number(
                              key === 'extraHours' ? val : prev.extraHours || 0
                            );
                            next.totalHours = String(req + extra);
                          }
                          return next;
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                {rosterModalIndex >= 0 ? (
                  <button
                    type="button"
                    onClick={deleteRosterModalItem}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    🗑️ លុបបុគ្គលិកនេះ
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setRosterModalIndex(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    💾 រក្សាទុកការកែប្រែ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADMIN CHRONO ADD/EDIT */}
      {adminModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">
                {adminModal.editId !== null ? '✏️ កែប្រែឯកសារក្រូណូ' : '➕ បន្ថែមក្រូណូឯកសារថ្មី'}
              </h3>
              <button
                onClick={() => setAdminModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  តួនាទី / ផ្នែកទទួលបន្ទុក
                </label>
                <select
                  value={adminModal.role}
                  onChange={(e) =>
                    setAdminModal((prev) => ({
                      ...prev,
                      role: e.target.value as AdminRoleKey,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <option value="FINANCE">នាយករងហិរញ្ញវត្ថុ</option>
                  <option value="DEPUTY">នាយករង</option>
                  <option value="SECRETARY">លេខានាយក</option>
                  <option value="TEACHER">គ្រូបង្រៀន និងគ្រូបន្ទុកថ្នាក់</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខកូដសម្គាល់ក្រូណូ (ឧ. ហវ-០១, នរ-០១, លខ-០១, គ្រូ-០១)
                </label>
                <input
                  type="text"
                  value={adminModal.code}
                  onChange={(e) =>
                    setAdminModal((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="ឧ. ហវ-៣១"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ជំពូក / ផ្នែករង
                </label>
                <input
                  type="text"
                  value={adminModal.category}
                  onChange={(e) =>
                    setAdminModal((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="ឧ. ផ្នែកហិរញ្ញវត្ថុ និងគណនេយ្យ"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះក្រូណូឯកសារ
                </label>
                <input
                  type="text"
                  value={adminModal.title}
                  onChange={(e) =>
                    setAdminModal((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="ឧ. កិច្ចបញ្ជីការគណនេយ្យ ២០២៦"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setAdminModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={saveAdminModal}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                💾 រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RENAME TEACHER MODAL */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">
                ✏️ កែប្រែឈ្មោះគ្រូបង្រៀន ({renameModal.teacherId})
              </h3>
              <button
                onClick={() =>
                  setRenameModal({ isOpen: false, teacherId: '', currentName: '' })
                }
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ឈ្មោះគ្រូបង្រៀន៖
              </label>
              <input
                type="text"
                value={renameModal.currentName}
                onChange={(e) =>
                  setRenameModal((prev) => ({ ...prev, currentName: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() =>
                  setRenameModal({ isOpen: false, teacherId: '', currentName: '' })
                }
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => {
                  const trimmed = renameModal.currentName.trim();
                  if (!trimmed) {
                    showToast('សូមបញ្ចូលឈ្មោះគ្រូ!', 'error');
                    return;
                  }
                  const finalName = trimmed.startsWith(renameModal.teacherId)
                    ? trimmed
                    : `${renameModal.teacherId} - ${trimmed}`;
                  updateState((prev) => ({
                    ...prev,
                    teachers: prev.teachers.map((t) =>
                      t.id === renameModal.teacherId ? { ...t, name: finalName } : t
                    ),
                  }));
                  setRenameModal({ isOpen: false, teacherId: '', currentName: '' });
                  showToast('✅ បានកែប្រែឈ្មោះគ្រូបង្រៀនដោយជោគជ័យ!');
                }}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                💾 រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CONFIRMATION DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">{confirmDialog.title}</h3>
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  fn();
                }}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm cursor-pointer ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {confirmDialog.confirmLabel || 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 no-print">
        {toasts.map((t) => {
          const colors =
            t.type === 'error'
              ? 'bg-rose-600 text-white'
              : t.type === 'warning'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-900 text-white';
          return (
            <div
              key={t.id}
              className={`${colors} px-4 py-3 rounded-xl shadow-lg text-xs md:text-sm font-medium flex items-center gap-2 transition-all duration-300`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
