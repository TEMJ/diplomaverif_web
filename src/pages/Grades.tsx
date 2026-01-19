import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Grade, Module, Student } from '../types';
import axios from '../lib/axios';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Select } from '../components/common/Select';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    moduleId: '',
    mark: '',
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  const canManage = user?.role === Role.ADMIN || user?.role === Role.UNIVERSITY;

  useEffect(() => {
    fetchGrades();
    if (canManage) {
      fetchStudents();
      fetchModules();
    }
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/grades');
      setGrades(res.data.data || res.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/students');
      setStudents(res.data.data || res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await axios.get('/modules');
      setModules(res.data.data || res.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleOpenModal = (grade?: Grade) => {
    if (grade) {
      setEditingId(grade.id);
      setFormData({
        studentId: grade.studentId,
        moduleId: grade.moduleId,
        mark: grade.mark.toString(),
      });
    } else {
      setEditingId(null);
      setFormData({ studentId: '', moduleId: '', mark: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const validateMark = (markValue: number): boolean => {
    if (isNaN(markValue) || markValue < 0 || markValue > 100) {
      toast.error('Mark must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!formData.studentId || !formData.moduleId || !formData.mark) {
      toast.error('Please fill in all fields');
      return;
    }

    const markValue = parseFloat(formData.mark);
    if (!validateMark(markValue)) {
      return;
    }

    try {
      const payload = {
        studentId: formData.studentId,
        moduleId: formData.moduleId,
        mark: markValue,
      };

      if (editingId) {
        await axios.put(`/grades/${editingId}`, payload);
        toast.success('Grade updated successfully');
      } else {
        await axios.post('/grades', payload);
        toast.success('Grade assigned successfully');
      }

      fetchGrades();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving grade:', error);
      toast.error(error.response?.data?.message || 'Failed to save grade');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    try {
      await axios.delete(`/grades/${id}`);
      toast.success('Grade deleted successfully');
      fetchGrades();
    } catch (error: any) {
      console.error('Error deleting grade:', error);
      toast.error(error.response?.data?.message || 'Failed to delete grade');
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  };

  const getModuleName = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    return module ? `${module.name} (${module.code})` : 'Unknown';
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">You do not have permission to manage grades</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Student Grades</h1>
        <Button onClick={() => handleOpenModal()}>Assign Grade</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : grades.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No grades assigned yet</p>
        </div>
      ) : (
        <Table
          columns={[
            {
              header: 'Student',
              accessor: ((grade: Grade) => getStudentName(grade.studentId)) as (row: Grade) => React.ReactNode,
            },
            {
              header: 'Module',
              accessor: ((grade: Grade) => getModuleName(grade.moduleId)) as (row: Grade) => React.ReactNode,
            },
            {
              header: 'Mark',
              accessor: ((grade: Grade) => `${grade.mark.toFixed(2)}%`) as (row: Grade) => React.ReactNode,
            },
            {
              header: 'Date',
              accessor: ((grade: Grade) => new Date(grade.date).toLocaleDateString()) as (row: Grade) => React.ReactNode,
            },
            {
              header: 'Actions',
              accessor: ((grade: Grade) => (
                <div key={grade.id} className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenModal(grade)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(grade.id)}
                  >
                    Delete
                  </Button>
                </div>
              )) as (row: Grade) => React.ReactNode,
            },
          ]}
          data={grades}
        />
      )}

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Grade' : 'Assign Grade'}
        onClose={handleCloseModal}
      >
        <div className="space-y-4">
          <Select
            label="Student"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={students.map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName}`,
            }))}
          />
          <Select
            label="Module"
            value={formData.moduleId}
            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
            options={modules.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.code})`,
            }))}
          />
          <Input
            label="Mark (0-100)"
            type="number"
            value={formData.mark}
            onChange={(e) => setFormData({ ...formData, mark: e.target.value })}
            placeholder="Enter mark"
          />
          <div className="flex gap-2 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
