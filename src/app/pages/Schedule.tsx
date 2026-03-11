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
import { Calendar, Plus, Trash2, Edit } from 'lucide-react';

export function Schedule() {
  const { schedules, addSchedule, deleteSchedule } = useData();
  const { isAdmin } = useAuth();
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('Genap 2025/2026');
  const [newSchedule, setNewSchedule] = useState({
    day: '',
    course: '',
    lecturer: '',
    time: '',
    room: '',
    semester: 'Genap 2025/2026',
  });

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const semesters = ['Genap 2025/2026', 'Ganjil 2026/2027'];

  const handleAddSchedule = () => {
    if (newSchedule.day && newSchedule.course && newSchedule.lecturer && newSchedule.time && newSchedule.room) {
      addSchedule(newSchedule);
      setNewSchedule({
        day: '',
        course: '',
        lecturer: '',
        time: '',
        room: '',
        semester: selectedSemester,
      });
      setIsAddingSchedule(false);
    }
  };

  const filteredSchedules = schedules.filter(s => s.semester === selectedSemester);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Jadwal Kuliah</h1>
          <p className="text-muted-foreground">Jadwal perkuliahan Kelas PAI A2 23</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
            <DialogTrigger asChild>
              <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Hari</Label>
                  <Select
                    value={newSchedule.day}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hari" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mata Kuliah</Label>
                  <Input
                    value={newSchedule.course}
                    onChange={(e) => setNewSchedule({ ...newSchedule, course: e.target.value })}
                    placeholder="Nama mata kuliah"
                  />
                </div>
                <div>
                  <Label>Dosen</Label>
                  <Input
                    value={newSchedule.lecturer}
                    onChange={(e) => setNewSchedule({ ...newSchedule, lecturer: e.target.value })}
                    placeholder="Nama dosen pengampu"
                  />
                </div>
                <div>
                  <Label>Jam</Label>
                  <Input
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    placeholder="Contoh: 08:00 - 10:00"
                  />
                </div>
                <div>
                  <Label>Ruangan</Label>
                  <Input
                    value={newSchedule.room}
                    onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                    placeholder="Contoh: Ruang 301"
                  />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={newSchedule.semester}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, semester: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((sem) => (
                        <SelectItem key={sem} value={sem}>
                          {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddSchedule} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  Simpan Jadwal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Semester Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter Semester:</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2D7A3E]" />
            Jadwal {selectedSemester}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada jadwal untuk semester ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hari</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Ruangan</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.day}</TableCell>
                      <TableCell>{schedule.course}</TableCell>
                      <TableCell className="text-sm">{schedule.lecturer}</TableCell>
                      <TableCell>{schedule.time}</TableCell>
                      <TableCell>{schedule.room}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSchedule(schedule.id)}
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
