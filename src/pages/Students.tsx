import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Student, University } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    universityId: '',
    firstName: '',
    lastName: '',
    matricule: '',
    email: '',
    photoUrl: '',
    dateOfBirth: '',
    major: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setStudents([]);
    setUniversities([]);

    try {
      // Check if user is authenticated and has a role
      if (!user?.role) {
        throw new Error('User not authenticated or role missing');
      }

      // Prepare parameters based on user role
      const params: Record<string, any> = {};
      if (user.role === Role.UNIVERSITY) {
        if (!user.universityId) {
          throw new Error('University ID missing for UNIVERSITY role');
        }
        params.universityId = user.universityId;
      }

      // Fetch students with proper error handling
      const studentsRes = await axios.get('/students', { params });
      
      if (!studentsRes.data) {
        throw new Error('Empty response from server');
      }

      // Ensure we have an array of students
      const studentsList = studentsRes.data.data || studentsRes.data;
      if (!Array.isArray(studentsList)) {
        console.error('Unexpected response format:', studentsList);
        throw new Error('Invalid data format');
      }

      setStudents(studentsList);

      // Fetch universities if admin
      if (user.role === Role.ADMIN) {
        const universitiesRes = await axios.get('/universities');
        const universitiesList = universitiesRes.data.data || universitiesRes.data;
        
        if (!Array.isArray(universitiesList)) {
          console.error('Unexpected universities response format:', universitiesList);
          throw new Error('Invalid universities data format');
        }

        setUniversities(universitiesList);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Error retrieving data';
      
      console.error('Fetch data error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        universityId: student.universityId,
        firstName: student.firstName,
        lastName: student.lastName,
        matricule: student.matricule,
        email: student.email,
        photoUrl: student.photoUrl || '',
        dateOfBirth: student.dateOfBirth.split('T')[0],
        major: student.major,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        universityId: user?.role === Role.UNIVERSITY ? user.universityId || '' : '',
        firstName: '',
        lastName: '',
        matricule: '',
        email: '',
        photoUrl: '',
        dateOfBirth: '',
        major: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        await axios.put(`/students/${editingStudent.id}`, formData);
        toast.success('Student updated successfully');
      } else {
        await axios.post('/students', formData);
        toast.success('Student created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await axios.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: ((row: Student) => `${row.firstName} ${row.lastName}`) as (row: Student) => React.ReactNode,
    },
    { header: 'Matricule', accessor: 'matricule' as keyof Student },
    { header: 'Email', accessor: 'email' as keyof Student },
    { header: 'Specialization', accessor: 'major' as keyof Student },
    {
      header: 'Date of Birth',
      accessor: ((row: Student) => new Date(row.dateOfBirth).toLocaleDateString()) as (row: Student) => React.ReactNode,
    },
    {
      header: 'Actions',
      accessor: ((row: Student) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-5 h-5" />
          </button>
          {user?.role === Role.ADMIN && (
            <button
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      )) as (row: Student) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Student
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={students} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      >
        <form onSubmit={handleSubmit}>
          {user?.role === Role.ADMIN && (
            <Select
              label="University"
              value={formData.universityId}
              onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
              options={universities.map((u) => ({ value: u.id, label: u.name }))}
              required
            />
          )}
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <Input
            label="Matricule"
            value={formData.matricule}
            onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Major"
            value={formData.major}
            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            required
          />
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            required
          />
          <Input
            label="Photo URL (optional)"
            value={formData.photoUrl}
            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingStudent ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
