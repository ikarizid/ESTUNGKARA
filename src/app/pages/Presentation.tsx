import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Presentation as PresentationType } from '../context/DataContext';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

export function Presentation() {
  const { presentations, updatePresentation } = useData();
  const { isAdmin } = useAuth();

  const handleToggleStatus = (id: string, currentStatus: 'Belum' | 'Sudah') => {
    updatePresentation(id, {
      status: currentStatus === 'Belum' ? 'Sudah' : 'Belum'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Jadwal Presentasi Kelompok</h1>
        <p className="text-muted-foreground">Jadwal presentasi kelompok mata kuliah</p>
      </div>

      {/* Presentations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2D7A3E]" />
            Daftar Presentasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presentations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada jadwal presentasi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Nama Kelompok</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presentations.map((presentation) => (
                    <TableRow key={presentation.id}>
                      <TableCell className="font-medium">
                        {new Date(presentation.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{presentation.course}</TableCell>
                      <TableCell className="font-medium">{presentation.groupName}</TableCell>
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
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(presentation.id, presentation.status)}
                            className="hover:bg-[#2D7A3E] hover:text-white"
                          >
                            {presentation.status === 'Belum' ? 'Tandai Selesai' : 'Tandai Belum'}
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#2D7A3E]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Presentasi</p>
                <p className="text-2xl font-bold text-[#2D7A3E]">{presentations.length}</p>
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
                  {presentations.filter(p => p.status === 'Sudah').length}
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
                  {presentations.filter(p => p.status === 'Belum').length}
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
