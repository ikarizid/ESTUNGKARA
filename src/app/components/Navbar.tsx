import { Link, useLocation } from 'react-router';
import { Menu, X, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const menuItems = [
    { name: 'Beranda', path: '/' },
    { name: 'Galeri', path: '/galeri' },
    { name: 'Jurnal', path: '/jurnal' },
    { name: 'Jadwal Kuliah', path: '/jadwal' },
    { name: 'Presentasi', path: '/presentasi' },
    { name: 'Absensi', path: '/absensi' },
    { name: 'Tugas', path: '/tugas' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#2D7A3E] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#C9A45C] rounded-full flex items-center justify-center">
              <span className="text-white font-bold">PAI</span>
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-lg">Kelas PAI A2 23</div>
              <div className="text-xs text-green-100">UNIRA Malang</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#48B461] text-white'
                    : 'text-green-100 hover:bg-[#1f5a2d] hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Admin Controls */}
          <div className="hidden lg:flex items-center space-x-2">
            {isAdmin ? (
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#2D7A3E]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout Admin
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-[#2D7A3E]"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-[#1f5a2d]"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#1f5a2d]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base ${
                  isActive(item.path)
                    ? 'bg-[#48B461] text-white'
                    : 'text-green-100 hover:bg-[#2D7A3E] hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-green-600">
              {isAdmin ? (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base text-green-100 hover:bg-[#2D7A3E] hover:text-white flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout Admin
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base text-green-100 hover:bg-[#2D7A3E] hover:text-white flex items-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
