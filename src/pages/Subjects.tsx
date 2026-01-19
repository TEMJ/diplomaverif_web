import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Subject } from '../types';
import axios from '../lib/axios';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Select } from '../components/common/Select';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', credits: '0' });
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');

  const canManage = user?.role === Role.ADMIN || user?.role === Role.UNIVERSITY;

  useEffect(() => {
    fetchSubjects();
    if (canManage) {
      fetchUniversities();
    }
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/subjects');
      setSubjects(res.data.data || res.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const res = await axios.get('/universities');
      setUniversities(res.data.data || res.data);
      if (res.data.data?.[0]) {
        setSelectedUniversity(res.data.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingId(subject.id);
      setFormData({
        name: subject.name,
        code: subject.code,
        credits: subject.credits.toString(),
      });
      setSelectedUniversity(subject.universityId);
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', credits: '0' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        credits: parseInt(formData.credits, 10),
        universityId: selectedUniversity,
      };

      if (editingId) {
        await axios.put(`/subjects/${editingId}`, payload);
        toast.success('Subject updated successfully');
      } else {
        await axios.post('/subjects', payload);
        toast.success('Subject created successfully');
      }

      fetchSubjects();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      toast.error(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await axios.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">You do not have permission to manage subjects</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
        <Button onClick={() => handleOpenModal()}>Add Subject</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No subjects found</p>
        </div>
      ) : (
        <Table
          columns={[
            { header: 'Name', accessor: 'name' as keyof Subject },
            { header: 'Code', accessor: 'code' as keyof Subject },
            { header: 'Credits', accessor: 'credits' as keyof Subject },
            {
              header: 'Actions',
              accessor: ((subject: Subject) => (
                <div key={subject.id} className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenModal(subject)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(subject.id)}
                  >
                    Delete
                  </Button>
                </div>
              )) as (row: Subject) => React.ReactNode,
            },
          ]}
          data={subjects}
        />
      )}

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Subject' : 'Add Subject'}
        onClose={handleCloseModal}
      >
        <div className="space-y-4">
          {user?.role === Role.ADMIN && (
            <Select
              label="University"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              options={universities.map((u) => ({ value: u.id, label: u.name }))}
            />
          )}
          <Input
            label="Subject Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mathematics"
          />
          <Input
            label="Subject Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., MATH101"
          />
          <Input
            label="Credits"
            type="number"
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
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
