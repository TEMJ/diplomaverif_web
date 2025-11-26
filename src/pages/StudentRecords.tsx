import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { StudentRecord, Student } from '../types';
import { Plus, Edit, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const StudentRecords: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentRecord | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    attendance: '',
    discipline: '',
    gradesPdfUrl: '',
    transcriptPdfUrl: '',
    diplomaPdfUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user?.role === Role.STUDENT && user.studentId) {
        const recordRes = await axios.get(`/student-records/student/${user.studentId}`);
        setRecords([recordRes.data.data || recordRes.data]);
      } else {  
        const recordsRes = await axios.get('/student-records');
        setRecords(recordsRes.data.data || recordsRes.data);

        if (user?.role !== Role.STUDENT) {
          const studentParams = user?.role === Role.UNIVERSITY && user.universityId
            ? { universityId: user.universityId }
            : {};
          const studentsRes = await axios.get('/students', { params: studentParams });
          setStudents(studentsRes.data.data || studentsRes.data);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: StudentRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        studentId: record.studentId,
        attendance: record.attendance.toString(),
        discipline: record.discipline,
        gradesPdfUrl: record.gradesPdfUrl,
        transcriptPdfUrl: record.transcriptPdfUrl,
        diplomaPdfUrl: record.diplomaPdfUrl,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        studentId: '',
        attendance: '',
        discipline: '',
        gradesPdfUrl: '',
        transcriptPdfUrl: '',
        diplomaPdfUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        attendance: parseInt(formData.attendance),
      };

      if (editingRecord) {
        await axios.put(`/student-records/${editingRecord.id}`, payload);
        toast.success('Record updated successfully');
      } else {
        await axios.post('/student-records', payload);
        toast.success('Record created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const columns = [
    {
      header: 'Student',
      accessor: ((row: StudentRecord) => row.student ? `${row.student.firstName} ${row.student.lastName}` : 'N/A') as (row: StudentRecord) => React.ReactNode,
    },
    {
      header: 'Attendance',
      accessor: ((row: StudentRecord) => `${row.attendance}%`) as (row: StudentRecord) => React.ReactNode,
    },
    {
      header: 'Discipline',
      accessor: ((row: StudentRecord) => row.discipline.substring(0, 50) + '...') as (row: StudentRecord) => React.ReactNode,
    },
    {
      header: 'Actions',
      accessor: ((row: StudentRecord) => (
        <div className="flex space-x-2">
          {user?.role !== Role.STUDENT && (
            <button
              onClick={() => handleOpenModal(row)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          <a
            href={row.gradesPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800"
            title="Grades"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      )) as (row: StudentRecord) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Records</h1>
        {user?.role !== Role.STUDENT && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 mr-2 inline" />
            Add Record
          </Button>
        )}
      </div>

      <Card>
        <Table columns={columns} data={records} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Student Record' : 'Add Student Record'}
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Student"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.matricule})` }))}
            required
            disabled={!!editingRecord}
          />
          <Input
            label="Attendance (%)"
            type="number"
            value={formData.attendance}
            onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discipline <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.discipline}
              onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Input
            label="Grades PDF URL"
            value={formData.gradesPdfUrl}
            onChange={(e) => setFormData({ ...formData, gradesPdfUrl: e.target.value })}
            required
          />
          <Input
            label="Transcript PDF URL"
            value={formData.transcriptPdfUrl}
            onChange={(e) => setFormData({ ...formData, transcriptPdfUrl: e.target.value })}
            required
          />
          <Input
            label="Diploma PDF URL"
            value={formData.diplomaPdfUrl}
            onChange={(e) => setFormData({ ...formData, diplomaPdfUrl: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRecord ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
