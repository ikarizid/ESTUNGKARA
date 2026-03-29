import { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { ClipboardList, Plus, Download, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Attendance as AttendanceType } from '../context/DataContext';

type AbsenceStatus = 'Alfa' | 'Izin';

interface StudentAbsence {
  checked: boolean;
  status: AbsenceStatus;
  note: string;
}

export function Attendance() {
  const { students, courses, attendances, addAttendance, addAttendances } = useData();
  const { isAdmin } = useAuth();
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state untuk sesi absensi
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    course: '',
    meeting: 1,
  });

  // State checklist: key = studentId, value = { checked, status, note }
  const [absences, setAbsences] = useState<Record<string, StudentAbsence>>({});

  const handleToggleAbsence = (studentId: string, checked: boolean) => {
    setAbsences(prev => {
      if (!checked) {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      }
      return {
        ...prev,
        [studentId]: { checked: true, status: 'Alfa', note: '' },
      };
    });
  };

  const handleAbsenceStatus = (studentId: string, status: AbsenceStatus) => {
    setAbsences(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleAbsenceNote = (studentId: string, note: string) => {
    setAbsences(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  };

  const handleSaveAttendance = () => {
    if (!sessionForm.course) return;

    // Simpan semua mahasiswa: yang tidak diceklis = Hadir
    const attendanceData = students.map(student => {
      const absence = absences[student.id];
      return {
        studentId: student.id,
        date: sessionForm.date,
        course: sessionForm.course,
        meeting: sessionForm.meeting,
        status: (absence ? absence.status : 'Hadir') as 'Hadir' | 'Alfa' | 'Izin',
        note: absence ? absence.note : '',
      };
    });

    addAttendances(attendanceData);

    // Reset
    setAbsences({});
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      course: '',
      meeting: 1,
    });
    setIsAddingAttendance(false);
  };

  // ── EXCEL LOGIC ────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const templateData = students.map(s => ({
      "Nama": s.name,
      "NIM": s.nim,
      "Status (Hadir/Alfa/Izin)": "Hadir",
      "Keterangan": "",
      "Mata Kuliah": sessionForm.course || courses[0],
      "Tanggal (YYYY-MM-DD)": sessionForm.date,
      "Pertemuan Ke-": sessionForm.meeting
    }));

    const ws = utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 20 }, 
      { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 15 }
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template Absensi");
    writeFile(wb, `Template_Absensi_${sessionForm.course || 'Kelas'}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const rawData = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = read(rawData, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = utils.sheet_to_json<any>(ws);

        const attendancesToAdd: Omit<AttendanceType, 'id'>[] = [];

        data.forEach(row => {
          // Cari mahasiswa berdasarkan nama atau NIM
          const student = students.find(s => 
            s.name.toLowerCase() === row["Nama"]?.toString().toLowerCase() || 
            s.nim === row["NIM"]?.toString()
          );

          if (student) {
            attendancesToAdd.push({
              studentId: student.id,
              date: row["Tanggal (YYYY-MM-DD)"]?.toString() || sessionForm.date,
              course: row["Mata Kuliah"]?.toString() || sessionForm.course || courses[0],
              meeting: parseInt(row["Pertemuan Ke-"]) || sessionForm.meeting,
              status: (row["Status (Hadir/Alfa/Izin)"]?.toString() || "Hadir") as any,
              note: row["Keterangan"]?.toString() || ""
            });
          }
        });

        if (attendancesToAdd.length > 0) {
          await addAttendances(attendancesToAdd);
          alert(`Berhasil mengimpor ${attendancesToAdd.length} data absensi!`);
        } else {
          alert('Data mahasiswa tidak ditemukan atau format salah.');
        }
      } catch (error) {
        console.error(error);
        alert('Gagal membaca file Excel.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown';
  };

  const filteredAttendances = selectedCourse === 'all'
    ? attendances
    : attendances.filter(a => a.course === selectedCourse);

  const getAttendanceSummary = () => {
    if (selectedCourse === 'all') return null;
    const courseAttendances = attendances.filter(a => a.course === selectedCourse);
    return {
      totalRecords: courseAttendances.length,
      hadir: courseAttendances.filter(a => a.status === 'Hadir').length,
      alfa: courseAttendances.filter(a => a.status === 'Alfa').length,
      izin: courseAttendances.filter(a => a.status === 'Izin').length,
    };
  };

  const summary = getAttendanceSummary();
  const absentCount = Object.keys(absences).length;
  const presentCount = students.length - absentCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Absensi Mahasiswa</h1>
          <p className="text-muted-foreground">Rekap kehadiran mahasiswa PAI A2 23</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="hidden sm:flex hover:bg-green-50">
              <Download className="mr-2 h-4 w-4 text-green-600" />
              Template Excel
            </Button>
            
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="hidden sm:flex"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>

            <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
              <DialogTrigger asChild>
                <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Absensi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Catat Absensi Pertemuan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Info Sesi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mata Kuliah</Label>
                      <Select
                        value={sessionForm.course}
                        onValueChange={(value) => setSessionForm({ ...sessionForm, course: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih mata kuliah" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course} value={course}>{course}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pertemuan Ke-</Label>
                      <Input
                        type="number"
                        min="1"
                        value={sessionForm.meeting}
                        onChange={(e) => setSessionForm({ ...sessionForm, meeting: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    />
                  </div>

                  {/* Keterangan */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                    Centang mahasiswa yang <strong>tidak hadir</strong>. Mahasiswa yang tidak dicentang otomatis tercatat <strong>Hadir</strong>.
                  </div>

                  {/* Counter */}
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">✓ Hadir: {presentCount}</span>
                    <span className="text-red-600 font-medium">✗ Tidak hadir: {absentCount}</span>
                  </div>

                  {/* Daftar Mahasiswa */}
                  <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                    {students.map((student) => {
                      const absence = absences[student.id];
                      const isAbsent = !!absence;
                      return (
                        <div key={student.id} className={`p-3 space-y-2 ${isAbsent ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`absent-${student.id}`}
                              checked={isAbsent}
                              onCheckedChange={(checked) => handleToggleAbsence(student.id, !!checked)}
                            />
                            <label
                              htmlFor={`absent-${student.id}`}
                              className="flex-1 cursor-pointer text-sm font-medium"
                            >
                              {student.name}
                              {student.nim && (
                                <span className="text-muted-foreground font-normal ml-2">({student.nim})</span>
                              )}
                            </label>
                            {!isAbsent && (
                              <Badge className="bg-green-600 text-xs">Hadir</Badge>
                            )}
                          </div>

                          {/* Jika dicentang, pilih Alfa atau Izin */}
                          {isAbsent && (
                            <div className="ml-7 space-y-2">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAbsenceStatus(student.id, 'Alfa')}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    absence.status === 'Alfa'
                                      ? 'bg-red-600 text-white border-red-600'
                                      : 'bg-white text-red-600 border-red-400 hover:bg-red-50'
                                  }`}
                                >
                                  Alfa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAbsenceStatus(student.id, 'Izin')}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    absence.status === 'Izin'
                                      ? 'bg-yellow-500 text-white border-yellow-500'
                                      : 'bg-white text-yellow-600 border-yellow-400 hover:bg-yellow-50'
                                  }`}
                                >
                                  Izin
                                </button>
                              </div>
                              {absence.status === 'Izin' && (
                                <Textarea
                                  placeholder="Keterangan izin..."
                                  value={absence.note}
                                  onChange={(e) => handleAbsenceNote(student.id, e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleSaveAttendance}
                    disabled={!sessionForm.course}
                    className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]"
                  >
                    Simpan Absensi ({students.length} mahasiswa)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Course Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter Mata Kuliah:</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#2D7A3E]">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Record</p>
              <p className="text-2xl font-bold">{summary.totalRecords}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Hadir</p>
              <p className="text-2xl font-bold text-green-600">{summary.hadir}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Alfa</p>
              <p className="text-2xl font-bold text-red-600">{summary.alfa}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Izin</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.izin}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#2D7A3E]" />
            Daftar Absensi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAttendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedCourse === 'all'
                ? 'Belum ada data absensi'
                : 'Belum ada data absensi untuk mata kuliah ini'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pertemuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        {getStudentName(attendance.studentId)}
                      </TableCell>
                      <TableCell>{attendance.course}</TableCell>
                      <TableCell>
                        {new Date(attendance.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>Pertemuan {attendance.meeting}</TableCell>
                      <TableCell>
                        <Badge
                          variant={attendance.status === 'Hadir' ? 'default' : attendance.status === 'Alfa' ? 'destructive' : 'secondary'}
                          className={
                            attendance.status === 'Hadir' ? 'bg-green-600' :
                            attendance.status === 'Izin' ? 'bg-yellow-600' : ''
                          }
                        >
                          {attendance.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {attendance.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}