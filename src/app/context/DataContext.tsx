import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Photo {
  id: string;
  url: string;
  category: 'Perkuliahan' | 'Kegiatan Kampus' | 'Presentasi Kelompok';
  caption: string;
  date: string;
}

export interface Journal {
  id: string;
  title: string;
  author: string;
  course: string;
  fileUrl: string;
  date: string;
}

export interface Schedule {
  id: string;
  day: string;
  course: string;
  lecturer: string;
  time: string;
  room: string;
  semester: string;
}

export interface Presentation {
  id: string;
  date: string;
  course: string;
  groupName: string;
  members: string[];
  status: 'Belum' | 'Sudah';
}

export interface Student {
  id: string;
  name: string;
  nim: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  course: string;
  meeting: number;
  status: 'Hadir' | 'Alfa' | 'Izin';
  note?: string;
}

export interface Assignment {
  id: string;
  type: 'Individu' | 'Kelompok';
  studentIds: string[];
  course: string;
  fileUrl: string;
  submittedAt: string;
}

interface DataContextType {
  announcements: Announcement[];
  photos: Photo[];
  journals: Journal[];
  schedules: Schedule[];
  presentations: Presentation[];
  students: Student[];
  attendances: Attendance[];
  assignments: Assignment[];
  courses: string[];
  loading: boolean;
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => Promise<void>;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addPhoto: (photo: Omit<Photo, 'id'>, file?: File) => Promise<void>;
  deletePhoto: (id: string, url: string) => Promise<void>;
  addJournal: (journal: Omit<Journal, 'id'>, file?: File) => Promise<void>;
  updateJournal: (id: string, journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  addSchedules: (schedules: Omit<Schedule, 'id'>[]) => Promise<void>;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  addPresentations: (presentations: Omit<Presentation, 'id'>[]) => Promise<void>;
  updatePresentation: (id: string, presentation: Partial<Presentation>) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
  deletePresentations: (ids: string[]) => Promise<void>;
  addAttendance: (attendance: Omit<Attendance, 'id'>) => Promise<void>;
  addAttendances: (attendances: Omit<Attendance, 'id'>[]) => Promise<void>;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>, file?: File) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const COURSES = [
  'Pendidikan Agama Islam',
  'Aqidah Akhlak',
  'Fiqih',
  'Sejarah Peradaban Islam',
  'Al-Quran Hadits',
  'Bahasa Arab',
];

// ── Fallback data mahasiswa (dipakai jika Supabase kosong) ──────────────────
const FALLBACK_STUDENTS: Student[] = [
  { id: '1',  name: 'Syifa Fatimah Azzahra',            nim: '23862081030' },
  { id: '2',  name: 'Riyadlatul Ummah',                  nim: '23862081035' },
  { id: '3',  name: 'Feri Afandi',                       nim: '23862081037' },
  { id: '4',  name: 'Muhamad Fakhrur Rozzi',             nim: '23862081038' },
  { id: '5',  name: 'Karimatul Aziza',                   nim: '23862081039' },
  { id: '6',  name: 'A. Baihaqi Al Farizi',              nim: '23862081040' },
  { id: '7',  name: 'Ahmad Zaroby',                      nim: '23862081043' },
  { id: '8',  name: 'Risma Eka Lusida',                  nim: '23862081044' },
  { id: '9',  name: 'Mochamad Fakhridzal Aidi Irchamni', nim: '23862081045' },
  { id: '10', name: 'Najib Azhar Muaffaq',               nim: '23862081046' },
  { id: '11', name: 'Masruroh',                          nim: '23862081047' },
  { id: '12', name: 'Lailatul Mubarokah',                nim: '23862081048' },
  { id: '13', name: 'Adel Adi Aqsa Syachira',            nim: '23862081049' },
  { id: '14', name: 'Naswa Cahya Mutiara',               nim: '23862081051' },
  { id: '15', name: "Khuril 'Aini",                      nim: '23862081052' },
  { id: '16', name: 'Laila',                             nim: '23862081053' },
  { id: '17', name: 'Ikrima Warda Lestari',              nim: '23862081056' },
  { id: '18', name: 'Nurul Hidayah',                     nim: '23862081057' },
  { id: '19', name: 'Muhammad Wildan Rizqy',             nim: '23862081058' },
  { id: '20', name: 'Tri Ratna Mila',                    nim: '23862081059' },
  { id: '21', name: 'Yulia Nur Kholifah',                nim: '23862081060' },
  { id: '22', name: 'Prila Listya Apsari',               nim: '23862081061' },
  { id: '23', name: 'Malik Al-Azis',                     nim: '23862081063' },
];

// Helper: upload file ke Supabase Storage
async function uploadFile(bucket: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// Helper: hapus file dari Supabase Storage
async function deleteFile(bucket: string, url: string) {
  const fileName = url.split('/').pop();
  if (!fileName) return;
  await supabase.storage.from(bucket).remove([fileName]);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [students, setStudents] = useState<Student[]>(FALLBACK_STUDENTS);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load semua data dari Supabase saat mount
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [
        { data: ann },
        { data: pho },
        { data: jou },
        { data: sch },
        { data: pre },
        { data: stu },
        { data: att },
        { data: asg },
      ] = await Promise.all([
        supabase.from('announcements').select('*').order('date', { ascending: false }),
        supabase.from('photos').select('*').order('date', { ascending: false }),
        supabase.from('journals').select('*').order('date', { ascending: false }),
        supabase.from('schedules').select('*'),
        supabase.from('presentations').select('*').order('date', { ascending: true }),
        supabase.from('students').select('*').order('name'),
        supabase.from('attendances').select('*').order('date', { ascending: false }),
        supabase.from('assignments').select('*').order('submitted_at', { ascending: false }),
      ]);

      setAnnouncements(ann ?? []);
      setPhotos(pho ?? []);
      setJournals(jou ?? []);
      setSchedules(sch ?? []);
      setPresentations(pre ?? []);
      // Pakai data Supabase jika ada, fallback ke hardcode jika kosong
      setStudents(stu && stu.length > 0 ? stu : FALLBACK_STUDENTS);
      setAttendances((att ?? []).map((a: any) => ({
        ...a,
        studentId: a.student_id,
      })));
      setAssignments((asg ?? []).map((a: any) => ({
        ...a,
        studentIds: a.student_ids,
        fileUrl: a.file_url,
        submittedAt: a.submitted_at,
      })));
      setLoading(false);
    }
    fetchAll();
  }, []);

  // ── ANNOUNCEMENTS ──────────────────────────────────────────────
  const addAnnouncement = async (data: Omit<Announcement, 'id'>) => {
    const { data: row, error } = await supabase.from('announcements').insert(data).select().single();
    if (!error && row) setAnnouncements(prev => [row, ...prev]);
  };

  const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    const { data: row, error } = await supabase.from('announcements').update(data).eq('id', id).select().single();
    if (!error && row) setAnnouncements(prev => prev.map(a => a.id === id ? row : a));
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // ── PHOTOS ─────────────────────────────────────────────────────
  const addPhoto = async (data: Omit<Photo, 'id'>, file?: File) => {
    let url = data.url;
    if (file) url = await uploadFile('photos', file);
    const { data: row, error } = await supabase.from('photos').insert({ ...data, url }).select().single();
    if (!error && row) setPhotos(prev => [row, ...prev]);
  };

  const deletePhoto = async (id: string, url: string) => {
    await supabase.from('photos').delete().eq('id', id);
    if (url.includes('supabase')) await deleteFile('photos', url);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // ── JOURNALS ───────────────────────────────────────────────────
  const addJournal = async (data: Omit<Journal, 'id'>, file?: File) => {
    let fileUrl = data.fileUrl;
    if (file) fileUrl = await uploadFile('journals', file);
    const { data: row, error } = await supabase
      .from('journals')
      .insert({ ...data, file_url: fileUrl })
      .select().single();
    if (!error && row) setJournals(prev => [{ ...row, fileUrl: row.file_url }, ...prev]);
  };

  const updateJournal = async (id: string, data: Partial<Journal>) => {
    const payload: any = { ...data };
    if (data.fileUrl) { payload.file_url = data.fileUrl; delete payload.fileUrl; }
    const { data: row, error } = await supabase.from('journals').update(payload).eq('id', id).select().single();
    if (!error && row) setJournals(prev => prev.map(j => j.id === id ? { ...row, fileUrl: row.file_url } : j));
  };

  const deleteJournal = async (id: string) => {
    await supabase.from('journals').delete().eq('id', id);
    setJournals(prev => prev.filter(j => j.id !== id));
  };

  // ── SCHEDULES ──────────────────────────────────────────────────
  const addSchedule = async (data: Omit<Schedule, 'id'>) => {
    const { data: row, error } = await supabase.from('schedules').insert(data).select().single();
    if (!error && row) setSchedules(prev => [...prev, row]);
  };

  const addSchedules = async (data: Omit<Schedule, 'id'>[]) => {
    const { data: rows, error } = await supabase.from('schedules').insert(data).select();
    if (!error && rows) setSchedules(prev => [...prev, ...rows]);
  };

  const updateSchedule = async (id: string, data: Partial<Schedule>) => {
    const { data: row, error } = await supabase.from('schedules').update(data).eq('id', id).select().single();
    if (!error && row) setSchedules(prev => prev.map(s => s.id === id ? row : s));
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // ── PRESENTATIONS ──────────────────────────────────────────────
  const addPresentations = async (data: Omit<Presentation, 'id'>[]) => {
    // Supabase insert array of objects
    const { data: rows, error } = await supabase.from('presentations').insert(data).select();
    if (!error && rows) {
      setPresentations(prev => {
        const sorted = [...prev, ...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return sorted;
      });
    }
  };

  const updatePresentation = async (id: string, data: Partial<Presentation>) => {
    const { data: row, error } = await supabase.from('presentations').update(data).eq('id', id).select().single();
    if (!error && row) setPresentations(prev => prev.map(p => p.id === id ? row : p));
  };

  const deletePresentation = async (id: string) => {
    await supabase.from('presentations').delete().eq('id', id);
    setPresentations(prev => prev.filter(p => p.id !== id));
  };

  const deletePresentations = async (ids: string[]) => {
    await supabase.from('presentations').delete().in('id', ids);
    setPresentations(prev => prev.filter(p => !ids.includes(p.id)));
  };

  // ── ATTENDANCES ────────────────────────────────────────────────
  const addAttendance = async (data: Omit<Attendance, 'id'>) => {
    const payload = { ...data, student_id: data.studentId };
    delete (payload as any).studentId;
    const { data: row, error } = await supabase.from('attendances').insert(payload).select().single();
    if (!error && row) setAttendances(prev => [{ ...row, studentId: row.student_id }, ...prev]);
  };

  const addAttendances = async (data: Omit<Attendance, 'id'>[]) => {
    const payload = data.map(item => {
      const p = { ...item, student_id: item.studentId };
      delete (p as any).studentId;
      return p;
    });
    const { data: rows, error } = await supabase.from('attendances').insert(payload).select();
    if (!error && rows) {
      setAttendances(prev => [...(rows.map((row: any) => ({ ...row, studentId: row.student_id }))), ...prev]);
    }
  };

  const updateAttendance = async (id: string, data: Partial<Attendance>) => {
    const payload: any = { ...data };
    if (data.studentId) { payload.student_id = data.studentId; delete payload.studentId; }
    const { data: row, error } = await supabase.from('attendances').update(payload).eq('id', id).select().single();
    if (!error && row) setAttendances(prev => prev.map(a => a.id === id ? { ...row, studentId: row.student_id } : a));
  };

  // ── ASSIGNMENTS ────────────────────────────────────────────────
  const addAssignment = async (data: Omit<Assignment, 'id'>, file?: File) => {
    let fileUrl = data.fileUrl;
    if (file) fileUrl = await uploadFile('assignments', file);
    const payload = {
      type: data.type,
      student_ids: data.studentIds,
      course: data.course,
      file_url: fileUrl,
      submitted_at: data.submittedAt,
    };
    const { data: row, error } = await supabase.from('assignments').insert(payload).select().single();
    if (!error && row) setAssignments(prev => [{
      ...row,
      studentIds: row.student_ids,
      fileUrl: row.file_url,
      submittedAt: row.submitted_at,
    }, ...prev]);
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <DataContext.Provider value={{
      announcements,
      photos,
      journals,
      schedules,
      presentations,
      students,
      attendances,
      assignments,
      courses: COURSES,
      loading,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addPhoto,
      deletePhoto,
      addJournal,
      updateJournal,
      deleteJournal,
      addSchedule,
      addSchedules,
      updateSchedule,
      deleteSchedule,
      addPresentations,
      updatePresentation,
      deletePresentation,
      deletePresentations,
      addAttendance,
      addAttendances,
      updateAttendance,
      addAssignment,
      deleteAssignment,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}