import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Student, University, Program } from '../types';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface StudentFormData {
  universityId: string;
  programId: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentDate: string;
  dateOfBirth: string;
  photoFile: File | null;
  photoPreview: string;
}

export const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [generatedStudentId, setGeneratedStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    universityId: '',
    programId: '',
    firstName: '',
    lastName: '',
    email: '',
    enrollmentDate: '',
    dateOfBirth: '',
    photoFile: null,
    photoPreview: '',
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setStudents([]);
    setUniversities([]);
    setPrograms([]);

    try {
      // Debug: log formData.universityId (not universityId)
      console.log('=== DEBUG STUDENT FETCH ===');
      console.log({
        universityId: formData.universityId,
        programId: formData.programId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        enrollmentDate: formData.enrollmentDate,
        dateOfBirth: formData.dateOfBirth,
        photoFile: formData.photoFile,
      });
      if (!user?.role) {
        throw new Error('User not authenticated or role missing');
      }

      const params: Record<string, any> = {};
      if (user.role === Role.UNIVERSITY) {
        if (!user.universityId) {
          throw new Error('University ID missing for UNIVERSITY role');
        }
        params.universityId = user.universityId;
      }

      const studentsRes = await axios.get('/students', { params });

      if (!studentsRes.data) {
        throw new Error('Empty response from server');
      }

      const studentsList = studentsRes.data.data || studentsRes.data;
      if (!Array.isArray(studentsList)) {
        console.error('Unexpected response format:', studentsList);
        throw new Error('Invalid data format');
      }

      setStudents(studentsList);

      if (user.role === Role.ADMIN) {
        const universitiesRes = await axios.get('/universities');
        const universitiesList = universitiesRes.data.data || universitiesRes.data;

        if (!Array.isArray(universitiesList)) {
          console.error('Unexpected universities response format:', universitiesList);
          throw new Error('Invalid universities data format');
        }

        setUniversities(universitiesList);
      }

      // Fetch programs
      const programsRes = await axios.get('/programs', { params });
      const programsList = programsRes.data.data || programsRes.data;
      if (Array.isArray(programsList)) {
        setPrograms(programsList);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error retrieving data';

      console.error('Fetch data error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setGeneratedStudentId(null);
      setFormData({
        universityId: student.universityId,
        programId: student.programId || '',
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        photoFile: null,
        photoPreview: student.photoUrl || '',
        enrollmentDate: student.enrollmentDate ? student.enrollmentDate.split('T')[0] : '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      });
    } else {
      setEditingStudent(null);
      setGeneratedStudentId(null);
      setFormData({
        universityId: user?.role === Role.UNIVERSITY ? user.universityId || '' : '',
        programId: '',
        firstName: '',
        lastName: '',
        email: '',
        photoFile: null,
        photoPreview: '',
        enrollmentDate: '',
        dateOfBirth: '',
      });
    }
    setIsModalOpen(true);
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG images are allowed');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return false;
    }
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setFormData({ ...formData, photoFile: file, photoPreview: preview });
    };
    reader.readAsDataURL(file);
  };

  const clearPhotoFile = () => {
    setFormData({ ...formData, photoFile: null, photoPreview: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Always define universityId at the top
    let universityId = formData.universityId;
    if (user?.role === Role.UNIVERSITY && user.universityId) {
      universityId = user.universityId;
    }

    if (!universityId || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('University ID, first name, last name, and email are required');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Envoyer les données principales en JSON
      const studentPayload = {
        universityId,
        programId: formData.programId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        enrollmentDate: formData.enrollmentDate,
        dateOfBirth: formData.dateOfBirth,
      };

      let studentId = editingStudent?.id;
      let newStudent = null;

      if (editingStudent) {
        // Update main data
        await axios.put(`/students/${editingStudent.id}`, studentPayload);
        studentId = editingStudent.id;
        toast.success('Student updated successfully');
      } else {
        // Create student
        const res = await axios.post('/students', studentPayload);
        newStudent = res.data.data || res.data;
        studentId = newStudent.studentId || newStudent.id;
        setGeneratedStudentId(studentId ?? null);
        toast.success(`Student created successfully! ID: ${studentId}`);
      }

      // 2. Si une photo est présente, upload séparé
      if (formData.photoFile && studentId) {
        const photoForm = new FormData();
        photoForm.append('photo', formData.photoFile);
        await axios.put(`/students/${studentId}/photo`, photoForm);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
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
      header: 'Student ID',
      accessor: ((row: Student) => row.studentId) as (row: Student) => React.ReactNode,
    },
    {
      header: 'Full Name',
      accessor: ((row: Student) => `${row.firstName} ${row.lastName}`) as (row: Student) => React.ReactNode,
    },
    {
      header: 'Program',
      accessor: ((row: Student) => row.program?.title || '—') as (row: Student) => React.ReactNode,
    },
    { header: 'Email', accessor: 'email' as keyof Student },
    {
      header: 'Enrollment Date',
      accessor: ((row: Student) => row.enrollmentDate ? new Date(row.enrollmentDate).toLocaleDateString() : 'N/A') as (row: Student) => React.ReactNode,
    },
    {
      header: 'Date of Birth',
      accessor: ((row: Student) => row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : 'N/A') as (row: Student) => React.ReactNode,
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
          <div className="space-y-4">
            {/* Academic Enrollment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Enrollment</h3>
              {user?.role === Role.ADMIN && (
                <Select
                  label="University"
                  value={formData.universityId}
                  onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                  options={universities.map((u) => ({ value: u.id, label: u.name }))}
                  required
                />
              )}
              <Select
                label="Program"
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                options={programs.map((p) => ({ value: p.id, label: p.title }))}
                required
              />
              <Input
                label="Enrollment Date"
                type="date"
                value={formData.enrollmentDate}
                onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
              />
            </div>

            {/* Personal Identity */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Identity</h3>
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="Exact spelling as per official ID"
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Exact spelling as per official ID"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
              <Input
                label="Contact Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Student ID */}
            {editingStudent && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Identification</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Student ID (Auto-generated)</p>
                  <p className="text-lg font-bold text-blue-600">{editingStudent.studentId}</p>
                  <p className="text-xs text-gray-500 mt-2">This ID is automatically generated by the system and cannot be changed.</p>
                </div>
              </div>
            )}

            {generatedStudentId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Generated Student ID:</p>
                <p className="text-lg font-bold text-green-600">{generatedStudentId}</p>
              </div>
            )}

            {/* Identity Photo */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Photo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Mandatory file upload (JPG/PNG). Maximum 5MB. Square (1:1) aspect ratio required for certificate template.
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag</p>
                      <p className="text-xs text-gray-500">Square format required (1:1)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoChange}
                      // required removed: photo is now optional at creation
                    />
                  </label>
                </div>

                {formData.photoPreview && (
                  <div className="relative">
                    <img
                      src={formData.photoPreview}
                      alt="Student photo preview"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={clearPhotoFile}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingStudent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
