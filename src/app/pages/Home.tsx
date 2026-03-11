import { Link } from 'react-router';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Bell, 
  BookOpen, 
  Calendar, 
  Camera, 
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

export function Home() {
  const { announcements, journals, photos, addAnnouncement, deleteAnnouncement } = useData();
  const { isAdmin } = useAuth();
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      addAnnouncement(newAnnouncement);
      setNewAnnouncement({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
      setIsAddingAnnouncement(false);
    }
  };

  const latestJournals = journals.slice(0, 3);
  const latestPhotos = photos.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2D7A3E] to-[#48B461] text-white rounded-lg p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl mb-4">Kelas PAI A2 23 UNIRA</h1>
        <p className="text-lg md:text-xl text-green-50 max-w-3xl">
          Selamat datang di portal informasi Kelas Pendidikan Agama Islam A2 Angkatan 2023. 
          Portal ini menyediakan informasi lengkap tentang kegiatan kelas, jadwal, pengumuman, dan lainnya.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#2D7A3E]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pengumuman</p>
                <p className="text-2xl font-bold text-[#2D7A3E]">{announcements.length}</p>
              </div>
              <Bell className="h-8 w-8 text-[#2D7A3E]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#48B461]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jurnal</p>
                <p className="text-2xl font-bold text-[#48B461]">{journals.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-[#48B461]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#C9A45C]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Foto</p>
                <p className="text-2xl font-bold text-[#C9A45C]">{photos.length}</p>
              </div>
              <Camera className="h-8 w-8 text-[#C9A45C]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#1f5a2d]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jadwal</p>
                <p className="text-2xl font-bold text-[#1f5a2d]">Aktif</p>
              </div>
              <Calendar className="h-8 w-8 text-[#1f5a2d]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#2D7A3E]" />
              Pengumuman Terbaru
            </CardTitle>
            {isAdmin && (
              <Dialog open={isAddingAnnouncement} onOpenChange={setIsAddingAnnouncement}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengumuman</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Judul</Label>
                      <Input
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        placeholder="Judul pengumuman"
                      />
                    </div>
                    <div>
                      <Label>Konten</Label>
                      <Textarea
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        placeholder="Isi pengumuman"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Tanggal</Label>
                      <Input
                        type="date"
                        value={newAnnouncement.date}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddAnnouncement} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                      Simpan Pengumuman
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada pengumuman</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-[#C9A45C] bg-secondary/50 p-4 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(announcement.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm">{announcement.content}</p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Journals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#2D7A3E]" />
                Jurnal Terbaru
              </CardTitle>
              <Link to="/jurnal">
                <Button variant="link" className="text-[#2D7A3E]">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestJournals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Belum ada jurnal</p>
              ) : (
                latestJournals.map((journal) => (
                  <div key={journal.id} className="border rounded-lg p-3 hover:border-[#2D7A3E] transition-colors">
                    <h4 className="font-semibold text-sm mb-1">{journal.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {journal.author} • {journal.course}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#2D7A3E]" />
                Galeri Foto Terbaru
              </CardTitle>
              <Link to="/galeri">
                <Button variant="link" className="text-[#2D7A3E]">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {latestPhotos.length === 0 ? (
                <p className="col-span-3 text-center text-muted-foreground py-4">Belum ada foto</p>
              ) : (
                latestPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover hover:scale-110 transition-transform"
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
