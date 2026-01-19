import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Program, University } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Programs: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    universityId: '',
    title: '',
    level: '',
    totalCreditsRequired: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (user?.role === Role.UNIVERSITY && user.universityId) {
        params.universityId = user.universityId;
      }

      const programsRes = await axios.get('/programs', { params });
      setPrograms(programsRes.data.data || programsRes.data);

      if (user?.role === Role.ADMIN) {
        const universitiesRes = await axios.get('/universities');
        setUniversities(universitiesRes.data.data || universitiesRes.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        universityId: program.universityId,
        title: program.title,
        level: program.level,
        totalCreditsRequired: program.totalCreditsRequired.toString(),
      });
    } else {
      setEditingProgram(null);
      setFormData({
        universityId: user?.role === Role.UNIVERSITY ? user.universityId || '' : '',
        title: '',
        level: '',
        totalCreditsRequired: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.level || !formData.totalCreditsRequired) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        universityId: formData.universityId,
        title: formData.title,
        level: formData.level,
        totalCreditsRequired: parseInt(formData.totalCreditsRequired),
      };

      if (editingProgram) {
        await axios.put(`/programs/${editingProgram.id}`, payload);
        toast.success('Program updated successfully');
      } else {
        await axios.post('/programs', payload);
        toast.success('Program created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      await axios.delete(`/programs/${id}`);
      toast.success('Program deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title' as keyof Program },
    { header: 'Level', accessor: 'level' as keyof Program },
    {
      header: 'Total Credits Required',
      accessor: 'totalCreditsRequired' as keyof Program,
    },
    {
      header: 'Actions',
      accessor: ((row: Program) => (
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
      )) as (row: Program) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Program
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={programs} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProgram ? 'Edit Program' : 'Add Program'}
      >
        <form onSubmit={handleSubmit}>
          {user?.role === Role.ADMIN && (
            <Select
              label="University"
              value={formData.universityId}
              onChange={(e) =>
                setFormData({ ...formData, universityId: e.target.value })
              }
              options={universities.map((u) => ({ value: u.id, label: u.name }))}
              required
            />
          )}
          <Input
            label="Program Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Select
            label="Level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            options={[
              { value: 'Undergraduate', label: 'Undergraduate' },
              { value: 'Postgraduate', label: 'Postgraduate' },
            ]}
            required
          />
          <Input
            label="Total Credits Required"
            type="number"
            value={formData.totalCreditsRequired}
            onChange={(e) =>
              setFormData({ ...formData, totalCreditsRequired: e.target.value })
            }
            required
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProgram ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
