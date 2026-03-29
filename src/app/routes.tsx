import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { Gallery } from './pages/Gallery';
import { Journals } from './pages/Journals';
import { Schedule } from './pages/Schedule';
import { Presentation } from './pages/Presentation';
import { Attendance } from './pages/Attendance';
import { Assignment } from './pages/Assignment';
import { Login } from './pages/Login';
import { AttendanceReport } from './pages/AttendanceReport';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'galeri', Component: Gallery },
      { path: 'jurnal', Component: Journals },
      { path: 'jadwal', Component: Schedule },
      { path: 'presentasi', Component: Presentation },
      { path: 'absensi', Component: Attendance },
      { path: 'tugas', Component: Assignment },
      { path: 'login', Component: Login },
      { path: 'rekap', Component: AttendanceReport },
    ],
  },
]);