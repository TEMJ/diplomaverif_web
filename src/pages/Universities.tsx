import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { University } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const Universities: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
    phone: '',
    logoUrl: '',
  });

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await axios.get('/universities', { params: { limit: 1000 } });
      setUniversities(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (university?: University) => {
    if (university) {
      setEditingUniversity(university);
      setFormData({
        name: university.name,
        address: university.address,
        contactEmail: university.contactEmail,
        phone: university.phone,
        logoUrl: university.logoUrl || '',
      });
    } else {
      setEditingUniversity(null);
      setFormData({
        name: '',
        address: '',
        contactEmail: '',
        phone: '',
        logoUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUniversity) {
        await axios.put(`/universities/${editingUniversity.id}`, formData);
        toast.success('University updated successfully');
      } else {
        await axios.post('/universities', formData);
        toast.success('University created successfully');
      }
      setIsModalOpen(false);
      fetchUniversities();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;

    try {
      await axios.delete(`/universities/${id}`);
      toast.success('University deleted successfully');
      fetchUniversities();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof University },
    { header: 'Address', accessor: 'address' as keyof University },
    { header: 'Email', accessor: 'contactEmail' as keyof University },
    { header: 'Phone', accessor: 'phone' as keyof University },
    {
      header: 'Actions',
      accessor: ((row: University) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )) as (row: University) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add University
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={universities} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUniversity ? 'Edit University' : 'Add University'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="University Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <Input
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Logo URL (optional)"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingUniversity ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
