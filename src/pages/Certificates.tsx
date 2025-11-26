import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, Student, CertificateStatus } from '../types';
import { Plus, Eye, Ban, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { QRCodeCanvas } from 'qrcode.react';

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    degreeTitle: '',
    specialization: '',
    graduationDate: '',
    pdfUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const params: Record<string, string> = {};
      if (user?.role === Role.UNIVERSITY && user.universityId) {
        params.universityId = user.universityId;
      } else if (user?.role === Role.STUDENT && user.studentId) {
        params.studentId = user.studentId;
      }

      const certificatesRes = await axios.get('/certificates', { params });
      setCertificates(certificatesRes.data.data || certificatesRes.data);

      if (user?.role !== Role.STUDENT) {
        const studentParams = user?.role === Role.UNIVERSITY && user.universityId
          ? { universityId: user.universityId }
          : {};
        const studentsRes = await axios.get('/students', { params: studentParams });
        setStudents(studentsRes.data.data || studentsRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data || check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    // Si un seul étudiant disponible, le pré-sélectionner
    // Sinon, laisser vide mais avertir l'utilisateur
    const defaultStudentId = students.length === 1 ? students[0].id : '';
    
    setFormData({
      studentId: defaultStudentId,
      degreeTitle: '',
      specialization: '',
      graduationDate: '',
      pdfUrl: '',
    });
    
    // Si plusieurs étudiants et aucun n'est présélectionné, avertir l'utilisateur
    if (students.length > 1) {
      toast.error('Please select a student from the dropdown list.');
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier d'abord si des étudiants sont disponibles
    if (students.length === 0) {
      toast.error('No students available. Please add students first.');
      return;
    }

    // Debug: log the current formData at submit time
    console.log('formData at submit:', formData);

    try {
      // Client-side validation
      const requiredFields = ['studentId', 'degreeTitle', 'specialization', 'graduationDate'];
      const missing = requiredFields.filter((key) => {
        const val = (formData as any)[key];
        return !(val !== undefined && val !== null && String(val).trim().length > 0);
      });

      // Vérification spécifique pour studentId
      if (!formData.studentId || formData.studentId === '') {
        toast.error('Please select a student from the dropdown list.');
        return;
      }

      if (missing.length > 0) {
        console.warn('Certificate form missing fields:', missing, 'formData:', formData);
        toast.error(`All fields are required. Missing: ${missing.join(', ')}`);
        return;
      }
      // Derive universityId either from current user (if UNIVERSITY) or from selected student
      const selectedStudent = students.find((s) => s.id === formData.studentId);
      const universityId = user?.universityId || selectedStudent?.universityId;

      console.log('Selected student:', selectedStudent);
      console.log('User universityId:', user?.universityId);
      console.log('Final universityId:', universityId);

      if (!universityId) {
        toast.error('Unable to determine university for this certificate. Please ensure the student belongs to a university.');
        return;
      }

      // Prepare payload. Use null for optional fields instead of empty strings
      const payload = {
        studentId: String(formData.studentId),
        degreeTitle: String(formData.degreeTitle).trim(),
        specialization: String(formData.specialization).trim(),
        graduationDate: formData.graduationDate,
        universityId,
        pdfUrl: 'https://example.com/placeholder.pdf', // URL temporaire obligatoire
      };

      console.log('Issuing certificate - payload:', payload);
      const res = await axios.post('/certificates', payload);
      console.log('Certificate creation response:', res);
      toast.success('Certificate created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: any; status?: number } };
      console.error('Certificate creation error:', err.response?.data ?? err);

      console.error('Full error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data type:', typeof err.response?.data);
      
      // Afficher le contenu complet de l'erreur
      if (err.response?.data) {
        console.error('Error data content:', JSON.stringify(err.response.data, null, 2));
      }

      // If backend provides validation details, show the full payload; otherwise show message
      const serverMessage = err.response?.data?.message || err.response?.data || (err as any).message;
      // Prefer a human-friendly message but include details for debugging
      if (typeof serverMessage === 'object') {
        const errorText = JSON.stringify(serverMessage, null, 2);
        console.error('Parsed error object:', errorText);
        toast.error(`Server error: ${errorText}`);
      } else if (typeof serverMessage === 'string') {
        toast.error(serverMessage);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;

    try {
      await axios.patch(`/certificates/${id}/revoke`);
      toast.success('Certificate revoked successfully');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Revoke failed');
    }
  };

  const handleViewDetails = (certificate: Certificate) => {
    setViewingCertificate(certificate);
  };

  // Helper to robustly extract student name fields from API objects that may use different keys
  const formatStudentDisplay = (s: any) => {
    if (!s) return '—';
    const first = s.firstName ?? s.firstname ?? s.first_name ?? '';
    const last = s.lastName ?? s.lastname ?? s.last_name ?? '';
    const matricule = s.matricule ?? s.matriculeNumber ?? s.registration ?? '';
    const full = `${(first || '').trim()} ${(last || '').trim()}`.trim();

    // If we have a full name, prefer showing "Name (Matricule)" when matricule exists
    if (full) return matricule ? `${full} (${matricule})` : full;

    // If no separate first/last but there is a combined name field, use it
    const alt = s.name ?? s.fullName ?? s.title ?? '';
    if (alt) return matricule ? `${alt} (${matricule})` : alt;

    // If no name available, but we have a matricule, show matricule (useful identifier)
    if (matricule) return matricule;

    // Fallback to id if nothing else
    if (s.id) return s.id;

    return '—';
  };

  const columns = [
    { header: 'Degree Title', accessor: 'degreeTitle' as keyof Certificate },
    {
      header: 'Student',
      accessor: ((row: Certificate) => {
        const s = row.student || students.find((st) => st.id === row.studentId);
        if (!s) return '—';
        
        // Afficher seulement le nom complet
        const first = s.firstName;
        const last = s.lastName;
        const full = `${(first || '').trim()} ${(last || '').trim()}`.trim();
        
        if (full) return full;
        
        // Fallback au matricule si aucun nom n'est disponible
        const matricule = s.matricule;
        return matricule || s.id || '—';
      }) as (row: Certificate) => React.ReactNode,
    },
    { header: 'Specialization', accessor: 'specialization' as keyof Certificate },
    {
      header: 'Graduation Date',
      accessor: ((row: Certificate) => new Date(row.graduationDate).toLocaleDateString()) as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Status',
      accessor: ((row: Certificate) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.status === CertificateStatus.ACTIVE
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status}
        </span>
      )) as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Actions',
      accessor: ((row: Certificate) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Eye className="w-5 h-5" />
          </button>
          {user?.role !== Role.STUDENT && row.status === CertificateStatus.ACTIVE && (
            <button
              onClick={() => handleRevoke(row.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Ban className="w-5 h-5" />
            </button>
          )}
          <a
            href={row.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      )) as (row: Certificate) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
        {user?.role !== Role.STUDENT && (
          <Button onClick={handleOpenModal}>
            <Plus className="w-5 h-5 mr-2 inline" />
            Issue Certificate
          </Button>
        )}
      </div>

      <Card>
        <Table columns={columns} data={certificates} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Certificate"
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Student"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={students.map((s) => ({ value: s.id, label: formatStudentDisplay(s) }))}
            required
          />
          <Input
            label="Degree Title"
            value={formData.degreeTitle}
            onChange={(e) => setFormData({ ...formData, degreeTitle: e.target.value })}
            required
          />
          <Input
            label="Specialization"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            required
          />
          <Input
            label="Graduation Date"
            type="date"
            value={formData.graduationDate}
            onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Issue Certificate</Button>
          </div>
        </form>
      </Modal>

      {viewingCertificate && (
        <Modal
          isOpen={true}
          onClose={() => setViewingCertificate(null)}
          title="Certificate Details"
          size="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Degree Title</label>
              <p className="text-gray-900">{viewingCertificate.degreeTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Student</label>
              <p className="text-gray-900">
                {formatStudentDisplay(viewingCertificate.student || students.find((st) => st.id === viewingCertificate.studentId))}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Specialization</label>
              <p className="text-gray-900">{viewingCertificate.specialization}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Graduation Date</label>
              <p className="text-gray-900">
                {new Date(viewingCertificate.graduationDate).toLocaleDateString()}
              </p>
            </div>
            {/* <div>
              <label className="text-sm font-medium text-gray-600">QR Hash</label>
              <p className="text-gray-900 font-mono text-sm break-all">
                {viewingCertificate.qrHash}
              </p>
            </div> */}
            <div>
              <label className="text-sm font-medium text-gray-600">QR Code</label>
              <div className="mt-2">
                <QRCodeCanvas
                  value={`${window.location.origin}/verify/${viewingCertificate.qrHash}`}
                  size={200}
                  bgColor="white"
                  fgColor="black"
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
