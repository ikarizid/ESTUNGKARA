import { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Users, CheckCircle2, XCircle, Download, Upload, CalendarPlus, Trash2, CheckSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { read, utils, writeFile } from 'xlsx';
import { Presentation as PresentationType } from '../context/DataContext';

export function Presentation() {
  const { presentations, updatePresentation, addPresentations, deletePresentation, deletePresentations, courses: contextCourses } = useData();
  const { isAdmin } = useAuth();
  
  const [selectedCourse, setSelectedCourse] = useState<string>('semua');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fitur Select Multiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Gabungkan semua `courses` yang ada di database dengan `courses` bawaan (agar mapel yang baru di-upload tetap tampil)
  const allAvailableCourses = Array.from(new Set([
    ...contextCourses,
    ...presentations.map(p => p.course)
  ])).sort();

  const filteredPresentations = selectedCourse === 'semua' 
    ? presentations 
    : presentations.filter(p => p.course === selectedCourse);

  const handleToggleStatus = (id: string, currentStatus: 'Belum' | 'Sudah') => {
    updatePresentation(id, {
      status: currentStatus === 'Belum' ? 'Sudah' : 'Belum'
    });
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      await deletePresentation(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.size} jadwal yang dipilih?`)) {
      await deletePresentations(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPresentations.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // ── FITUR DOWNLOAD TEMPLATE EXCEL ──────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([{
      "Tanggal (YYYY-MM-DD)": "2024-05-10",
      "Jam (HH:MM)": "08:00",
      "Mata Kuliah": allAvailableCourses[0] || "Pendidikan Agama Islam",
      "Pertemuan Ke-": "1",
      "Nama Kelompok": "Kelompok 1",
      "Anggota (Pisahkan koma)": "Ahmad, Budi, Siti"
    }]);
    
    // Auto resize column
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 30 }, 
      { wch: 15 }, { wch: 20 }, { wch: 40 }
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template Jadwal");
    writeFile(wb, "Template_Jadwal_Presentasi.xlsx");
  };

  // ── FITUR UPLOAD & BACA EXCEL ──────────────────────────────────
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
        // Menggunakan default json parser agar cell data Excel Date dibaca as-is (sebagai Serial Number atau string biasa)
        const data = utils.sheet_to_json<any>(ws);

        const presentationsToAdd: Omit<PresentationType, 'id'>[] = data.map(row => {
          const dateVal = row["Tanggal (YYYY-MM-DD)"] || row["Tanggal"];
          const timeVal = row["Jam (HH:MM)"] || row["Jam"] || "08:00";
          
          let y = 0, m = 0, d = 0;
          let hh = 8, mm = 0;

          // Parsing Tanggal (Nomor Seri Excel VS String Manual)
          if (typeof dateVal === 'number') {
            const excelEpoch = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            y = excelEpoch.getUTCFullYear();
            m = excelEpoch.getUTCMonth();
            d = excelEpoch.getUTCDate();
          } else if (typeof dateVal === 'string') {
            const dt = new Date(dateVal);
            if (!isNaN(dt.getTime())) {
              y = dt.getFullYear(); m = dt.getMonth(); d = dt.getDate();
            }
          }

          // Parsing Jam (Fraksi Hari Excel VS String Manual '08:00')
          if (typeof timeVal === 'number') {
            const totalMins = Math.round(timeVal * 24 * 60);
            hh = Math.floor(totalMins / 60);
            mm = totalMins % 60;
          } else if (typeof timeVal === 'string') {
            const parts = timeVal.split(':');
            if (parts.length >= 2) {
              hh = parseInt(parts[0], 10) || 8;
              mm = parseInt(parts[1], 10) || 0;
            }
          }

          // Fallback jika sama sekali tidak dapat tahun
          if (y === 0) {
            const now = new Date();
            y = now.getFullYear(); m = now.getMonth(); d = now.getDate();
          }

          const parsedDate = new Date(y, m, d, hh, mm, 0);

          const pertemuan = row["Pertemuan Ke-"] || row["Pertemuan"];
          const kelompok = row["Nama Kelompok"] || row["Kelompok"];
          // Jika kosong, jadikan string default
          const groupNameRaw = (kelompok || "Tanpa Kelompok").toString();
          const groupName = pertemuan ? `Pertemuan ${pertemuan} - ${groupNameRaw}` : groupNameRaw;

          const membersRaw = (row["Anggota (Pisahkan koma)"] || row["Anggota"] || "").toString();
          const members = membersRaw.split(',').map((s: string) => s.trim()).filter(Boolean);

          const courseName = (row["Mata Kuliah"] || allAvailableCourses[0] || "Mata Kuliah Tidak Diketahui").toString();

          return {
            date: parsedDate.toISOString(),
            course: courseName,
            groupName: groupName,
            members: members,
            status: 'Belum' as const
          };
        });

        if (presentationsToAdd.length > 0) {
          await addPresentations(presentationsToAdd);
          alert(`Berhasil mengimpor ${presentationsToAdd.length} jadwal presentasi! Mapel baru akan otomatis masuk ke filter (Pilih Mata Kuliah).`);
        } else {
          alert('Data excel kosong atau tidak sesuai template.');
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert('Terjadi kesalahan saat membaca file Excel.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── FITUR TAMBAH KE KALENDER (DOWNLOAD .ICS) ───────────────────
  const handleDownloadIcs = (presentation: PresentationType) => {
    const startDate = new Date(presentation.date);
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    // Format YYYYMMDDTHHMMSSZ
    const tplDate = `${startDate.getUTCFullYear()}${pad(startDate.getUTCMonth()+1)}${pad(startDate.getUTCDate())}T${pad(startDate.getUTCHours())}${pad(startDate.getUTCMinutes())}00Z`;

    // Asumsi durasi presentasi 90 menit (1.5 jam)
    const endDate = new Date(startDate.getTime() + (90 * 60000));
    const tplEndDate = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth()+1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kelas Akademik//Jadwal Presentasi//ID
BEGIN:VEVENT
DTSTAMP:${tplDate}
DTSTART:${tplDate}
DTEND:${tplEndDate}
SUMMARY:Presentasi ${presentation.course} - ${presentation.groupName}
DESCRIPTION:Anggota Kelompok:\\n${presentation.members.join('\\n')}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Pengingat Presentasi: ${presentation.course}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Presentasi_${presentation.course.replace(/\\s+/g, '_')}_${presentation.groupName.replace(/\\s+/g, '')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllSelected = filteredPresentations.length > 0 && selectedIds.size === filteredPresentations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Jadwal Presentasi Kelompok</h1>
          <p className="text-muted-foreground">Jadwal presentasi kelompok per mata kuliah dan pertemuan</p>
        </div>
        
        {/* Tombol Admin Panel */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="hover:bg-green-50">
              <Download className="mr-2 h-4 w-4 text-green-600" />
              Unduh Template Excel
            </Button>
            
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="bg-[#2D7A3E] hover:bg-[#1f5a2d]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Mengunggah...' : 'Upload Jadwal'}
            </Button>
          </div>
        )}
      </div>

      {/* Filter Mata Kuliah */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter Mata Kuliah:</span>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Pilih Mata Kuliah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Mata Kuliah</SelectItem>
            {allAvailableCourses.map(course => (
              <SelectItem key={course} value={course}>{course}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Panel jika ada row yang difilter dan ada yang diselect (Hanya Admin) */}
        {isAdmin && selectedIds.size > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="ml-auto flex animate-in slide-in-from-right-4"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus {selectedIds.size} Terpilih
          </Button>
        )}
      </div>

      {/* Presentations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2D7A3E]" />
            Daftar Presentasi {selectedCourse !== 'semua' && `- ${selectedCourse}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPresentations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada jadwal presentasi untuk rute ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && (
                      <TableHead className="w-[50px] text-center">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                    )}
                    <TableHead>Waktu</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Info Kelompok</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPresentations.map((presentation) => {
                    const dt = new Date(presentation.date);
                    return (
                    <TableRow key={presentation.id}>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.has(presentation.id)}
                            onCheckedChange={(checked) => handleSelectRow(presentation.id, !!checked)}
                            aria-label={`Pilih jadwal ${presentation.course}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium whitespace-nowrap">
                        {dt.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-xs text-muted-foreground mt-1">
                          {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{presentation.course}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {presentation.groupName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm line-clamp-2">
                            {presentation.members.join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={presentation.status === 'Sudah' ? 'default' : 'secondary'}
                          className={
                            presentation.status === 'Sudah'
                              ? 'bg-[#2D7A3E] hover:bg-[#1f5a2d]'
                              : 'bg-gray-200 text-gray-700'
                          }
                        >
                          {presentation.status === 'Sudah' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {presentation.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Tombol Publik: Atur Kalender */}
                          <Button
                            size="sm"
                            title="Tambah ke Kalender HP / PC"
                            onClick={() => handleDownloadIcs(presentation)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CalendarPlus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Atur Alarm</span>
                          </Button>

                          {/* Tombol Admin */}
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(presentation.id, presentation.status)}
                                className="hover:bg-[#2D7A3E] hover:text-white"
                              >
                                {presentation.status === 'Belum' ? 'Selesai' : 'Batal'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDelete(presentation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#2D7A3E]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Presentasi</p>
                <p className="text-2xl font-bold text-[#2D7A3E]">{filteredPresentations.length}</p>
              </div>
              <Users className="h-8 w-8 text-[#2D7A3E]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sudah Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPresentations.filter(p => p.status === 'Sudah').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Belum Selesai</p>
                <p className="text-2xl font-bold text-gray-600">
                  {filteredPresentations.filter(p => p.status === 'Belum').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
