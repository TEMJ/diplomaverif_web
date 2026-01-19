import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Module, Program } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Modules: React.FC = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchModulesByProgram(selectedProgram);
    }
  }, [selectedProgram]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (user?.role === Role.UNIVERSITY && user.universityId) {
        params.universityId = user.universityId;
      }

      const modulesRes = await axios.get('/modules', { params });
      setModules(modulesRes.data.data || modulesRes.data);

      const programsRes = await axios.get('/programs', { params });
      setPrograms(programsRes.data.data || programsRes.data);

      if (programsRes.data.data?.length > 0) {
        setSelectedProgram(programsRes.data.data[0].id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesByProgram = async (programId: string) => {
    try {
      const res = await axios.get(`/modules/program/${programId}`);
      setModules(res.data.data || res.data);
    } catch (error: any) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleOpenModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        code: module.code,
        name: module.name,
        credits: module.credits.toString(),
      });
    } else {
      setEditingModule(null);
      setFormData({
        code: '',
        name: '',
        credits: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.credits) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        credits: parseInt(formData.credits),
        programId: selectedProgram,
      };
      // Inject universityId if user is UNIVERSITY
      if (user?.role === Role.UNIVERSITY && user.universityId) {
        payload.universityId = user.universityId;
      }
      if (editingModule) {
        await axios.put(`/modules/${editingModule.id}`, payload);
        toast.success('Module updated successfully');
      } else {
        await axios.post('/modules', payload);
        toast.success('Module created successfully');
      }
      setIsModalOpen(false);
      fetchModulesByProgram(selectedProgram);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      await axios.delete(`/modules/${id}`);
      toast.success('Module deleted successfully');
      fetchModulesByProgram(selectedProgram);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'Code', accessor: 'code' as keyof Module },
    { header: 'Name', accessor: 'name' as keyof Module },
    {
      header: 'CATS Credits',
      accessor: 'credits' as keyof Module,
    },
    {
      header: 'Actions',
      accessor: ((row: Module) => (
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
      )) as (row: Module) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Module
        </Button>
      </div>

      <Card className="mb-6">
        <div className="mb-4">
          <Select
            label="Filter by Program"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            options={programs.map((p) => ({ value: p.id, label: p.title }))}
          />
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={modules} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Add Module'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Module Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Module Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="CATS Credits"
            type="number"
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingModule ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
