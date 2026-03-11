import { useState } from 'react';
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
import { ClipboardList, Plus, Download } from 'lucide-react';

export function Attendance() {
  const { students, courses, attendances, addAttendance } = useData();
  const { isAdmin } = useAuth();
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [newAttendance, setNewAttendance] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    course: '',
    meeting: 1,
    status: 'Hadir' as 'Hadir' | 'Alfa' | 'Izin',
    note: '',
  });

  const handleAddAttendance = () => {
    if (newAttendance.studentId && newAttendance.course) {
      addAttendance(newAttendance);
      setNewAttendance({
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        course: '',
        meeting: 1,
        status: 'Hadir',
        note: '',
      });
      setIsAddingAttendance(false);
    }
  };

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown';
  };

  // Group attendances by course and meeting
  const filteredAttendances = selectedCourse === 'all'
    ? attendances
    : attendances.filter(a => a.course === selectedCourse);

  // Get summary statistics
  const getAttendanceSummary = () => {
    if (selectedCourse === 'all') return null;
    
    const courseAttendances = attendances.filter(a => a.course === selectedCourse);
    const totalRecords = courseAttendances.length;
    const hadir = courseAttendances.filter(a => a.status === 'Hadir').length;
    const alfa = courseAttendances.filter(a => a.status === 'Alfa').length;
    const izin = courseAttendances.filter(a => a.status === 'Izin').length;

    return { totalRecords, hadir, alfa, izin };
  };

  const summary = getAttendanceSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Absensi Mahasiswa</h1>
          <p className="text-muted-foreground">Rekap kehadiran mahasiswa PAI A2 23</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
            <DialogTrigger asChild>
              <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Absensi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Absensi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Mahasiswa</Label>
                  <Select
                    value={newAttendance.studentId}
                    onValueChange={(value) => setNewAttendance({ ...newAttendance, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mahasiswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.nim})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mata Kuliah</Label>
                  <Select
                    value={newAttendance.course}
                    onValueChange={(value) => setNewAttendance({ ...newAttendance, course: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata kuliah" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={newAttendance.date}
                    onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pertemuan Ke-</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newAttendance.meeting}
                    onChange={(e) => setNewAttendance({ ...newAttendance, meeting: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Status Kehadiran</Label>
                  <Select
                    value={newAttendance.status}
                    onValueChange={(value: any) => setNewAttendance({ ...newAttendance, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hadir">Hadir</SelectItem>
                      <SelectItem value="Alfa">Alfa</SelectItem>
                      <SelectItem value="Izin">Izin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newAttendance.status === 'Izin' && (
                  <div>
                    <Label>Keterangan</Label>
                    <Textarea
                      value={newAttendance.note}
                      onChange={(e) => setNewAttendance({ ...newAttendance, note: e.target.value })}
                      placeholder="Alasan izin..."
                      rows={3}
                    />
                  </div>
                )}
                <Button onClick={handleAddAttendance} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  Simpan Absensi
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#2D7A3E]" />
              Daftar Absensi
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedCourse === 'all'
                ? 'Belum ada data absensi'
                : 'Belum ada data absensi untuk mata kuliah ini'
              }
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
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>Pertemuan {attendance.meeting}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            attendance.status === 'Hadir'
                              ? 'default'
                              : attendance.status === 'Alfa'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            attendance.status === 'Hadir'
                              ? 'bg-green-600'
                              : attendance.status === 'Izin'
                              ? 'bg-yellow-600'
                              : ''
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