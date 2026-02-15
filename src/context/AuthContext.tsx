import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../lib/axios';
import { User, University, Student, Program, Role } from '../types';

interface AuthContextType {
  user: User | null;
  university: University | null;
  student: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUniversity = async (universityId: string): Promise<University | null> => {
    try {
      const res = await axios.get(`/universities/${universityId}`);
      const data = res.data?.data ?? res.data;
      return data || null;
    } catch {
      try {
        const res = await axios.get('/universities', { params: { limit: 1000 } });
        const list = res.data?.data ?? res.data;
        const arr = Array.isArray(list) ? list : [];
        return arr.find((u: University) => u.id === universityId) ?? null;
      } catch {
        return null;
      }
    }
  };

  const fetchProgram = async (programId: string, universityId?: string): Promise<Program | null> => {
    try {
      const params = universityId ? { universityId } : {};
      const res = await axios.get('/programs', { params });
      const list = res.data?.data ?? res.data;
      const arr = Array.isArray(list) ? list : [];
      return arr.find((p: Program) => p.id === programId) ?? null;
    } catch {
      return null;
    }
  };

  const fetchStudent = async (studentId: string): Promise<Student | null> => {
    let stu: Student | null = null;
    try {
      const res = await axios.get(`/students/${studentId}`);
      const data = res.data?.data ?? res.data;
      stu = data || null;
    } catch {
      try {
        const res = await axios.get('/students', { params: { limit: 1000 } });
        const list = res.data?.data ?? res.data;
        const arr = Array.isArray(list) ? list : [];
        stu = arr.find((s: Student) => s.id === studentId) ?? null;
      } catch {
        return null;
      }
    }
    if (!stu) return null;
    if (!stu.university && stu.universityId) {
      const uni = await fetchUniversity(stu.universityId);
      if (uni) stu = { ...stu, university: uni };
    }
    if (!stu.program && stu.programId) {
      const prog = await fetchProgram(stu.programId, stu.universityId);
      if (prog) stu = { ...stu, program: prog };
    }
    return stu;
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      const userData = response.data.data || response.data;
      setUser(userData);
      setUniversity(null);
      setStudent(null);

      if (userData?.role === Role.UNIVERSITY && userData.universityId) {
        const uni = await fetchUniversity(userData.universityId);
        setUniversity(uni ?? null);
      } else if (userData?.role === Role.STUDENT && userData.studentId) {
        const stu = await fetchStudent(userData.studentId);
        setStudent(stu ?? null);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data; // Extract from response.data.data
    localStorage.setItem('token', token);
    setUser(userData);
    setUniversity(null);
    setStudent(null);

    if (!userData) {
      throw new Error('User data not received from server');
    }

    if (userData.role === Role.UNIVERSITY && userData.universityId) {
      const uni = await fetchUniversity(userData.universityId);
      setUniversity(uni ?? null);
    } else if (userData.role === Role.STUDENT && userData.studentId) {
      const stu = await fetchStudent(userData.studentId);
      setStudent(stu ?? null);
    }

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUniversity(null);
    setStudent(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, university, student, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
