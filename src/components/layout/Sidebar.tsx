import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Award,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Role } from '../../types';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [Role.ADMIN, Role.UNIVERSITY, Role.STUDENT],
    },
    {
      path: '/universities',
      label: 'Universities',
      icon: Building2,
      roles: [Role.ADMIN],
    },
    {
      path: '/students',
      label: 'Students',
      icon: Users,
      roles: [Role.ADMIN, Role.UNIVERSITY],
    },
    {
      path: '/certificates',
      label: 'Certificates',
      icon: Award,
      roles: [Role.ADMIN, Role.UNIVERSITY, Role.STUDENT],
    },
    {
      path: '/verifications',
      label: 'Verifications',
      icon: CheckCircle,
      roles: [Role.ADMIN, Role.UNIVERSITY],
    },
    {
      path: '/student-records',
      label: 'Student Records',
      icon: FileText,
      roles: [Role.ADMIN, Role.UNIVERSITY, Role.STUDENT],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
