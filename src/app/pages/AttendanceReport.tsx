import { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, FileSpreadsheet, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const TOTAL_MEETINGS = 16;

type ReportMode = 'pertemuan' | 'mahasiswa';

interface MeetingAttendance {
  [meetingNo: number]: 'H' | 'A' | 'I' | '-';
}

interface StudentSummary {
  studentId: string;
  name: string;
  nim: string;
  meetings: MeetingAttendance;
  hadir: number;
  alfa: number;
  izin: number;
  persentase: string;
}

interface MeetingRecord {
  meetingNo: number;
  date: string;
  students: { name: string; nim: string; status: string; note: string }[];
}

export function AttendanceReport() {
  const { students, courses, attendances } = useData();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [reportMode, setReportMode] = useState<ReportMode>('mahasiswa');
  const printRef = useRef<HTMLDivElement>(null);

  // ── Build per-student summary ──────────────────────────────────────────────
  const buildStudentSummary = (): StudentSummary[] => {
    return students.map((student) => {
      const studentAttendances = attendances.filter(
        (a) => a.studentId === student.id && (selectedCourse === 'all' || a.course === selectedCourse)
      );
      const meetings: MeetingAttendance = {};
      for (let i = 1; i <= TOTAL_MEETINGS; i++) meetings[i] = '-';

      studentAttendances.forEach((a) => {
        if (a.meeting >= 1 && a.meeting <= TOTAL_MEETINGS) {
          meetings[a.meeting] =
            a.status === 'Hadir' ? 'H' : a.status === 'Alfa' ? 'A' : 'I';
        }
      });

      const hadir = Object.values(meetings).filter((v) => v === 'H').length;
      const alfa = Object.values(meetings).filter((v) => v === 'A').length;
      const izin = Object.values(meetings).filter((v) => v === 'I').length;
      const total = hadir + alfa + izin;
      const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) + '%' : '-';

      return { studentId: student.id, name: student.name, nim: student.nim || '', meetings, hadir, alfa, izin, persentase };
    });
  };

  // ── Build per-meeting records ──────────────────────────────────────────────
  const buildMeetingRecords = (): MeetingRecord[] => {
    const records: MeetingRecord[] = [];
    for (let m = 1; m <= TOTAL_MEETINGS; m++) {
      const meetingAttendances = attendances.filter(
        (a) => a.meeting === m && (selectedCourse === 'all' || a.course === selectedCourse)
      );
      if (meetingAttendances.length === 0) continue;
      const date = meetingAttendances[0]?.date || '';
      const studentsData = students.map((s) => {
        const record = meetingAttendances.find((a) => a.studentId === s.id);
        return {
          name: s.name,
          nim: s.nim || '',
          status: record ? record.status : 'Hadir',
          note: record?.note || '',
        };
      });
      records.push({ meetingNo: m, date, students: studentsData });
    }
    return records;
  };

  // ── Export Excel ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const courseName = selectedCourse === 'all' ? 'Semua Mata Kuliah' : selectedCourse;

    // Sheet 1: Rekap per Mahasiswa
    const summaryData = buildStudentSummary();
    const headerRow1 = ['No', 'Nama Mahasiswa', 'NIM', ...Array.from({ length: TOTAL_MEETINGS }, (_, i) => `P${i + 1}`), 'Hadir', 'Alfa', 'Izin', 'Kehadiran'];
    const rows1 = summaryData.map((s, idx) => [
      idx + 1,
      s.name,
      s.nim,
      ...Array.from({ length: TOTAL_MEETINGS }, (_, i) => s.meetings[i + 1]),
      s.hadir,
      s.alfa,
      s.izin,
      s.persentase,
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([
      [`REKAP ABSENSI MAHASISWA`],
      [`Mata Kuliah: ${courseName}`],
      [`Kelas PAI A2 23 - UNIRA Malang`],
      [],
      headerRow1,
      ...rows1,
    ]);
    ws1['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 14 }, ...Array(TOTAL_MEETINGS).fill({ wch: 5 }), { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Mahasiswa');

    // Sheet 2: Rekap per Pertemuan
    const meetingRecords = buildMeetingRecords();
    if (meetingRecords.length > 0) {
      const rows2: (string | number)[][] = [
        [`REKAP ABSENSI PER PERTEMUAN`],
        [`Mata Kuliah: ${courseName}`],
        [`Kelas PAI A2 23 - UNIRA Malang`],
        [],
      ];
      meetingRecords.forEach((m) => {
        rows2.push([`Pertemuan ${m.meetingNo}`, `Tanggal: ${m.date ? new Date(m.date).toLocaleDateString('id-ID') : '-'}`]);
        rows2.push(['No', 'Nama Mahasiswa', 'NIM', 'Status', 'Keterangan']);
        m.students.forEach((s, idx) => {
          rows2.push([idx + 1, s.name, s.nim, s.status, s.note]);
        });
        rows2.push([]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(rows2);
      ws2['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Pertemuan');
    }

    XLSX.writeFile(wb, `Rekap_Absensi_${courseName.replace(/ /g, '_')}.xlsx`);
  };

  // ── Print PDF ──────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const summaryData = buildStudentSummary();
  const meetingRecords = buildMeetingRecords();
  const courseName = selectedCourse === 'all' ? 'Semua Mata Kuliah' : selectedCourse;

  return (
    <>
      {/* Print CSS - Folio/F4 paper */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; }
          @page {
            size: 215mm 330mm;
            margin: 15mm 15mm 15mm 20mm;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; font-size: 8pt; }
          th, td { border: 1px solid #333; padding: 2px 4px; }
          th { background: #2D7A3E !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          .status-H { color: #16a34a; font-weight: bold; }
          .status-A { color: #dc2626; font-weight: bold; }
          .status-I { color: #d97706; font-weight: bold; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Controls - no-print */}
        <div className="no-print">
          <h1 className="text-3xl mb-2">Rekap Absensi</h1>
          <p className="text-muted-foreground">Export rekap kehadiran dalam format PDF atau Excel</p>
        </div>

        <Card className="no-print">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label className="mb-1 block">Mata Kuliah</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Semua Mata Kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Tampilan Rekap</Label>
                <Select value={reportMode} onValueChange={(v) => setReportMode(v as ReportMode)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mahasiswa">Per Mahasiswa</SelectItem>
                    <SelectItem value="pertemuan">Per Pertemuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportExcel} className="bg-emerald-700 hover:bg-emerald-800">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button onClick={handlePrint} className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  <Printer className="h-4 w-4 mr-2" />
                  Print / PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── PRINT AREA ─────────────────────────────────────────────────── */}
        <div id="print-area" ref={printRef}>

          {/* == REKAP PER MAHASISWA == */}
          {(reportMode === 'mahasiswa') && (
            <Card>
              <CardHeader className="pb-2">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold uppercase">Rekap Absensi Mahasiswa</h2>
                  <p className="text-sm font-medium">Mata Kuliah: {courseName}</p>
                  <p className="text-sm text-muted-foreground">Kelas PAI A2 23 — UNIRA Malang</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#2D7A3E] text-white">
                        <th className="border border-gray-400 px-1 py-2 text-center w-8">No</th>
                        <th className="border border-gray-400 px-2 py-2 text-left min-w-40">Nama Mahasiswa</th>
                        <th className="border border-gray-400 px-1 py-2 text-center min-w-24">NIM</th>
                        {Array.from({ length: TOTAL_MEETINGS }, (_, i) => (
                          <th key={i + 1} className="border border-gray-400 px-0.5 py-2 text-center w-7">
                            P{i + 1}
                          </th>
                        ))}
                        <th className="border border-gray-400 px-1 py-2 text-center w-10">H</th>
                        <th className="border border-gray-400 px-1 py-2 text-center w-10">A</th>
                        <th className="border border-gray-400 px-1 py-2 text-center w-10">I</th>
                        <th className="border border-gray-400 px-1 py-2 text-center w-16">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map((s, idx) => (
                        <tr key={s.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-1 py-1.5 text-center">{idx + 1}</td>
                          <td className="border border-gray-300 px-2 py-1.5 font-medium">{s.name}</td>
                          <td className="border border-gray-300 px-1 py-1.5 text-center">{s.nim}</td>
                          {Array.from({ length: TOTAL_MEETINGS }, (_, i) => {
                            const val = s.meetings[i + 1];
                            return (
                              <td key={i + 1} className={`border border-gray-300 px-0.5 py-1.5 text-center font-bold ${val === 'H' ? 'text-green-600 status-H' : val === 'A' ? 'text-red-600 status-A' : val === 'I' ? 'text-yellow-600 status-I' : 'text-gray-300'}`}>
                                {val}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 px-1 py-1.5 text-center text-green-700 font-medium">{s.hadir}</td>
                          <td className="border border-gray-300 px-1 py-1.5 text-center text-red-600 font-medium">{s.alfa}</td>
                          <td className="border border-gray-300 px-1 py-1.5 text-center text-yellow-600 font-medium">{s.izin}</td>
                          <td className="border border-gray-300 px-1 py-1.5 text-center font-semibold">{s.persentase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex gap-4">
                  <span><strong className="text-green-600">H</strong> = Hadir</span>
                  <span><strong className="text-red-600">A</strong> = Alfa</span>
                  <span><strong className="text-yellow-600">I</strong> = Izin</span>
                  <span><strong>-</strong> = Belum ada data</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* == REKAP PER PERTEMUAN == */}
          {(reportMode === 'pertemuan') && (
            <div className="space-y-6">
              <div className="text-center space-y-1 no-print">
                <h2 className="text-lg font-bold uppercase">Rekap Absensi Per Pertemuan</h2>
                <p className="text-sm font-medium">Mata Kuliah: {courseName}</p>
                <p className="text-sm text-muted-foreground">Kelas PAI A2 23 — UNIRA Malang</p>
              </div>
              {/* Print-only title */}
              <div className="hidden print-only text-center space-y-1">
                <h2 className="text-lg font-bold uppercase">Rekap Absensi Per Pertemuan</h2>
                <p className="text-sm font-medium">Mata Kuliah: {courseName}</p>
                <p className="text-sm text-muted-foreground">Kelas PAI A2 23 — UNIRA Malang</p>
              </div>

              {meetingRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Belum ada data absensi untuk mata kuliah ini
                  </CardContent>
                </Card>
              ) : (
                meetingRecords.map((m, mIdx) => (
                  <Card key={m.meetingNo} className={mIdx > 0 ? 'page-break' : ''}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#2D7A3E]" />
                        Pertemuan {m.meetingNo}
                        {m.date && (
                          <span className="font-normal text-muted-foreground">
                            — {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#2D7A3E] text-white">
                            <th className="border border-gray-400 px-2 py-2 text-center w-8">No</th>
                            <th className="border border-gray-400 px-2 py-2 text-left">Nama Mahasiswa</th>
                            <th className="border border-gray-400 px-2 py-2 text-center">NIM</th>
                            <th className="border border-gray-400 px-2 py-2 text-center w-16">Status</th>
                            <th className="border border-gray-400 px-2 py-2 text-left">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.students.map((s, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                              <td className="border border-gray-300 px-2 py-1.5 font-medium">{s.name}</td>
                              <td className="border border-gray-300 px-2 py-1.5 text-center">{s.nim}</td>
                              <td className={`border border-gray-300 px-2 py-1.5 text-center font-bold ${s.status === 'Hadir' ? 'text-green-600' : s.status === 'Alfa' ? 'text-red-600' : 'text-yellow-600'}`}>
                                {s.status}
                              </td>
                              <td className="border border-gray-300 px-2 py-1.5 text-gray-500">{s.note || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-medium text-xs">
                            <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right">Total:</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              {m.students.filter(s => s.status === 'Hadir').length} Hadir
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-xs text-muted-foreground">
                              {m.students.filter(s => s.status === 'Alfa').length} Alfa · {m.students.filter(s => s.status === 'Izin').length} Izin
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Tanda tangan - hanya muncul saat print */}
          <div className="mt-8 hidden" style={{ display: 'none' }} id="ttd-section">
            <div className="flex justify-end">
              <div className="text-center text-xs space-y-12">
                <p>Malang, ___________________</p>
                <p>Dosen Pengampu</p>
                <p className="font-bold border-t border-black pt-1">____________________________</p>
              </div>
            </div>
          </div>

        </div>
        {/* end print-area */}

      </div>
    </>
  );
}