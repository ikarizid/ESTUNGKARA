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
import { Checkbox } from '../components/ui/checkbox';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';

export function Assignment() {
  const { students, courses, assignments, addAssignment, deleteAssignment } = useData();
  const { isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [formData, setFormData] = useState({
    type: 'Individu' as 'Individu' | 'Kelompok',
    studentIds: [] as string[],
    course: '',
    fileUrl: '',
    manualNim: '',
  });

  const handleTypeChange = (type: 'Individu' | 'Kelompok') => {
    setFormData({ ...formData, type, studentIds: [] });
  };

  const handleStudentToggle = (studentId: string) => {
    if (formData.type === 'Individu') {
      setFormData({ ...formData, studentIds: [studentId] });
    } else {
      const newIds = formData.studentIds.includes(studentId)
        ? formData.studentIds.filter(id => id !== studentId)
        : [...formData.studentIds, studentId];
      setFormData({ ...formData, studentIds: newIds });
    }
  };

  const handleSubmit = () => {
    if (formData.studentIds.length > 0 && formData.course && formData.fileUrl) {
      addAssignment({
        type: formData.type,
        studentIds: formData.studentIds,
        course: formData.course,
        fileUrl: formData.fileUrl,
        submittedAt: new Date().toISOString(),
      });
      setFormData({
        type: 'Individu',
        studentIds: [],
        course: '',
        fileUrl: '',
        manualNim: '',
      });
      setIsSubmitting(false);
    }
  };

  const getStudentNames = (studentIds: string[]) => {
    return studentIds
      .map(id => students.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesCourse = selectedCourse === 'all' || assignment.course === selectedCourse;
    const matchesStudent = selectedStudent === 'all' || assignment.studentIds.includes(selectedStudent);
    return matchesCourse && matchesStudent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Pengumpulan Tugas</h1>
          <p className="text-muted-foreground">Sistem pengumpulan tugas mahasiswa PAI A2 23</p>
        </div>
        <Dialog open={isSubmitting} onOpenChange={setIsSubmitting}>
          <DialogTrigger asChild>
            <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
              <Plus className="h-4 w-4 mr-2" />
              Submit Tugas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Pengumpulan Tugas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipe Tugas</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => handleTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individu">Individu</SelectItem>
                    <SelectItem value="Kelompok">Kelompok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {formData.type === 'Individu' 
                    ? 'Pilih Mahasiswa (1 orang)' 
                    : 'Pilih Anggota Kelompok (bisa lebih dari 1)'}
                </Label>
                <Card>
                  <CardContent className="pt-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={student.id}
                            checked={formData.studentIds.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <label
                            htmlFor={student.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {student.name} ({student.nim})
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.studentIds.length} mahasiswa dipilih
                </p>
              </div>

              <div>
                <Label>NIM Manual (Opsional)</Label>
                <Input
                  value={formData.manualNim}
                  onChange={(e) => setFormData({ ...formData, manualNim: e.target.value })}
                  placeholder="Masukkan NIM manual jika diperlukan"
                />
              </div>

              <div>
                <Label>Mata Kuliah</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => setFormData({ ...formData, course: value })}
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
                <Label>Upload File Tugas</Label>
                <Input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="Link atau URL file tugas"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Masukkan link Google Drive, Dropbox, atau URL file lainnya
                </p>
              </div>

              <Button onClick={handleSubmit} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                <Upload className="h-4 w-4 mr-2" />
                Submit Tugas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Filter Mata Kuliah</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua mata kuliah" />
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
            <div>
              <Label>Filter Mahasiswa</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua mahasiswa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all Student">Semua Mahasiswa</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.nim})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#2D7A3E]">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Tugas</p>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#48B461]">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Tugas Individu</p>
            <p className="text-2xl font-bold text-[#48B461]">
              {assignments.filter(a => a.type === 'Individu').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#C9A45C]">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Tugas Kelompok</p>
            <p className="text-2xl font-bold text-[#C9A45C]">
              {assignments.filter(a => a.type === 'Kelompok').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2D7A3E]" />
            Daftar Tugas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada tugas yang dikumpulkan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Waktu Submit</TableHead>
                    <TableHead>File</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assignment.type === 'Individu' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {assignment.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="line-clamp-2">
                          {getStudentNames(assignment.studentIds)}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.course}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(assignment.submittedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(assignment.fileUrl, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
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