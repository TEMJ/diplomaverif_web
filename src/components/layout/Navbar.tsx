import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types';

export const Navbar: React.FC = () => {
  const { user, university, student, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const goToSettings = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

  const displayLabel = (): string => {
    if (!user) return '';
    if (user.role === Role.UNIVERSITY && university) {
      return [university.name].filter(Boolean).join(' — ');
    }
    if (user.role === Role.STUDENT && student) {
      const name = [student.firstName, student.lastName].filter(Boolean).join(' ');
      const parts = [name];
      if (student.university?.name) parts.push(student.university.name);
      if (student.program?.title) parts.push(student.program.title);
      return parts.join(' · ');
    }
    return user.email;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">DiplomaVerif</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 max-w-md">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 shrink-0">
                  {user.role}
                </span>
                
                <span className="text-sm text-gray-700 truncate hidden sm:inline" title={displayLabel()}>
                  {displayLabel()}
                </span>
              </div>

              <div className="relative" ref={menuRef} >
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Profile menu"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className={`w-4 h-4 ml-0.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={goToSettings}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
