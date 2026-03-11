import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BookOpen, Plus, Trash2, Edit, FileText, User, GraduationCap } from 'lucide-react';

export function Journals() {
  const { journals, courses, addJournal, deleteJournal } = useData();
  const { isAdmin } = useAuth();
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [newJournal, setNewJournal] = useState({
    title: '',
    author: '',
    course: '',
    fileUrl: '#',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddJournal = () => {
    if (newJournal.title && newJournal.author && newJournal.course) {
      addJournal(newJournal);
      setNewJournal({
        title: '',
        author: '',
        course: '',
        fileUrl: '#',
        date: new Date().toISOString().split('T')[0],
      });
      setIsAddingJournal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Galeri Jurnal & Artikel</h1>
          <p className="text-muted-foreground">Kumpulan jurnal dan artikel mahasiswa PAI A2 23</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddingJournal} onOpenChange={setIsAddingJournal}>
            <DialogTrigger asChild>
              <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jurnal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Jurnal Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Judul Jurnal</Label>
                  <Input
                    value={newJournal.title}
                    onChange={(e) => setNewJournal({ ...newJournal, title: e.target.value })}
                    placeholder="Masukkan judul jurnal"
                  />
                </div>
                <div>
                  <Label>Nama Penulis</Label>
                  <Input
                    value={newJournal.author}
                    onChange={(e) => setNewJournal({ ...newJournal, author: e.target.value })}
                    placeholder="Nama lengkap penulis"
                  />
                </div>
                <div>
                  <Label>Mata Kuliah</Label>
                  <Select
                    value={newJournal.course}
                    onValueChange={(value) => setNewJournal({ ...newJournal, course: value })}
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
                  <Label>Link/File Jurnal</Label>
                  <Input
                    value={newJournal.fileUrl}
                    onChange={(e) => setNewJournal({ ...newJournal, fileUrl: e.target.value })}
                    placeholder="URL atau link file jurnal"
                  />
                </div>
                <div>
                  <Label>Tanggal Publikasi</Label>
                  <Input
                    type="date"
                    value={newJournal.date}
                    onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddJournal} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  Simpan Jurnal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Journals Grid */}
      {journals.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada jurnal atau artikel</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#2D7A3E] to-[#48B461] text-white">
                <CardTitle className="flex items-start gap-2 text-base">
                  <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{journal.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{journal.author}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{journal.course}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(journal.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#2D7A3E] hover:bg-[#1f5a2d]"
                    onClick={() => window.open(journal.fileUrl, '_blank')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Lihat Jurnal
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteJournal(journal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
