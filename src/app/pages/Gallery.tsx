import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Gallery() {
  const { photos, addPhoto, deletePhoto } = useData();
  const { isAdmin } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    url: '',
    category: 'Perkuliahan' as 'Perkuliahan' | 'Kegiatan Kampus' | 'Presentasi Kelompok',
    caption: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['Perkuliahan', 'Kegiatan Kampus', 'Presentasi Kelompok'];

  const handleAddPhoto = () => {
    if (newPhoto.url && newPhoto.caption) {
      addPhoto(newPhoto);
      setNewPhoto({
        url: '',
        category: 'Perkuliahan',
        caption: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIsAddingPhoto(false);
    }
  };

  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Galeri Foto</h1>
          <p className="text-muted-foreground">Dokumentasi kegiatan kelas PAI A2 23</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddingPhoto} onOpenChange={setIsAddingPhoto}>
            <DialogTrigger asChild>
              <Button className="bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Foto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Foto Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>URL Foto</Label>
                  <Input
                    value={newPhoto.url}
                    onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={newPhoto.category}
                    onValueChange={(value: any) => setNewPhoto({ ...newPhoto, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Caption</Label>
                  <Input
                    value={newPhoto.caption}
                    onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                    placeholder="Deskripsi foto"
                  />
                </div>
                <div>
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddPhoto} className="w-full bg-[#2D7A3E] hover:bg-[#1f5a2d]">
                  Simpan Foto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="Perkuliahan">Perkuliahan</TabsTrigger>
          <TabsTrigger value="Kegiatan Kampus">Kegiatan Kampus</TabsTrigger>
          <TabsTrigger value="Presentasi Kelompok">Presentasi</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredPhotos.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada foto dalam kategori ini</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedPhoto(photo.url)}
                    />
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <span className="inline-block px-2 py-1 bg-[#2D7A3E] text-white text-xs rounded mb-2">
                      {photo.category}
                    </span>
                    <p className="font-medium text-sm mb-1">{photo.caption}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Viewer Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img src={selectedPhoto} alt="Full size" className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
