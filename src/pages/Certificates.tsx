import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, Student, CertificateStatus, Program } from '../types';
import { Plus, Eye, Ban, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { calculateDegreeClassification } from '../lib/degreeClassification';

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    degreeTitle: '',
    specialization: '',
    graduationDate: '',
    pdfUrl: '',
  });
  // (studentMarks supprimé : non utilisé)

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
      let certs = certificatesRes.data.data || certificatesRes.data;

      // Fetch programs (needed for displaying program title even when API doesn't embed relations)
      let loadedPrograms: Program[] = programs;
      try {
        const programParams: Record<string, any> = {};
        // If API requires a university filter, try to provide one (university user OR infer from certificates list)
        const inferredUniversityId =
          user?.universityId ||
          (Array.isArray(certs) && certs.length > 0 ? (certs[0] as any).universityId : undefined);
        if (inferredUniversityId) programParams.universityId = inferredUniversityId;
        const programsRes = await axios.get('/programs', { params: programParams });
        loadedPrograms = programsRes.data.data || programsRes.data;
        if (Array.isArray(loadedPrograms)) setPrograms(loadedPrograms);
      } catch {
        // Non-blocking: program listing can still work with embedded student.program if present
      }
      const programsById = new Map<string, Program>(
        Array.isArray(loadedPrograms) ? loadedPrograms.map((p) => [p.id, p]) : []
      );

      let loadedStudents: Student[] = students;
      if (user?.role !== Role.STUDENT) {
        const studentParams = user?.role === Role.UNIVERSITY && user.universityId
          ? { universityId: user.universityId }
          : {};
        const studentsRes = await axios.get('/students', { params: studentParams });
        loadedStudents = studentsRes.data.data || studentsRes.data;
        setStudents(loadedStudents);
      }

      // Inject program into certificate.student if missing
      certs = certs.map((cert: Certificate) => {
        let student = cert.student || loadedStudents.find((s) => s.id === cert.studentId);
        if (student && !student.program && student.programId) {
          const fromStudentList = loadedStudents.find((s) => s.id === student?.id);
          if (fromStudentList?.program) student = { ...student, program: fromStudentList.program };
          else {
            const fromPrograms = programsById.get(student.programId);
            if (fromPrograms) student = { ...student, program: fromPrograms };
          }
        }
        return { ...cert, student };
      });
      setCertificates(certs);
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

    if (students.length === 0) {
      toast.error('No students available. Please add students first.');
      return;
    }

    // Debug: log the current formData at submit time
    console.log('formData at submit:', formData);

    try {
      // Validation
      const requiredFields = ['studentId', 'degreeTitle', 'specialization', 'graduationDate'];
      const missing = requiredFields.filter((key) => {
        const val = (formData as any)[key];
        return !(val !== undefined && val !== null && String(val).trim().length > 0);
      });
      if (!formData.studentId || formData.studentId === '') {
        toast.error('Please select a student from the dropdown list.');
        return;
      }
      if (missing.length > 0) {
        toast.error(`All fields are required. Missing: ${missing.join(', ')}`);
        return;
      }
      // Récupérer l'étudiant sélectionné et son universityId
      const selectedStudent = students.find((s) => s.id === formData.studentId);
      const universityId = user?.universityId || selectedStudent?.universityId;
      if (!universityId) {
        toast.error('Unable to determine university for this certificate. Please ensure the student belongs to a university.');
        return;
      }

      // Récupérer les notes de l'étudiant (grades)
      let marks: Array<{ mark: number; credits: number }> = [];
      if (selectedStudent && selectedStudent.grades && Array.isArray(selectedStudent.grades)) {
        marks = selectedStudent.grades.map((g: any) => ({
          mark: g.mark,
          credits: g.module?.credits || 0,
        })).filter((g) => typeof g.mark === 'number' && typeof g.credits === 'number');
      }

      // Calculer la moyenne pondérée (finalMark)
      let finalMark: number | undefined = undefined;
      if (marks.length > 0) {
        finalMark = calculateDegreeClassification(marks).averageMark;
      }

      // Préparer le payload
      const payload: any = {
        studentId: String(formData.studentId),
        degreeTitle: String(formData.degreeTitle).trim(),
        specialization: String(formData.specialization).trim(),
        graduationDate: formData.graduationDate,
        universityId,
        pdfUrl: 'https://example.com/placeholder.pdf',
      };
      if (finalMark !== undefined) payload.finalMark = finalMark;

      console.log('Issuing certificate - payload:', payload);
      const res = await axios.post('/certificates', payload);
      console.log('Certificate creation response:', res);
      toast.success('Certificate created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: any; status?: number } };
      const serverMessage = err.response?.data?.message || err.response?.data || (err as any).message;
      if (typeof serverMessage === 'object') {
        const errorText = JSON.stringify(serverMessage, null, 2);
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

  const handleViewDetails = async (certificate: Certificate) => {
    // Open immediately with what we have, then hydrate with full details (grades, relations, etc.)
    setViewingCertificate(certificate);
    setViewingLoading(true);
    try {
      const res = await axios.get(`/certificates/${certificate.id}`);
      const raw = res.data;
      // Try several common backend envelope patterns
      const full: any =
        (raw && (raw.data?.certificate || raw.data?.result || raw.data)) ||
        raw.certificate ||
        raw.result ||
        raw;

      // Debug helper: see exactly what we got from backend
      console.log('Certificate details response:', raw, 'resolved certificate:', full);

      if (full && typeof full === 'object') {
        setViewingCertificate(full as Certificate);
      }
    } catch (error) {
      // Non-blocking; keep modal open with basic info
      console.error('Failed to fetch certificate details:', error);
    } finally {
      setViewingLoading(false);
    }
  };

  const handleDownloadPDF = async (certificateId: string) => {
    try {
      const response = await axios.get(`/certificates/${certificateId}/pdf`, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `certificate-${new Date().getTime()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download certificate PDF');
    }
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
    {
      header: 'Program',
      accessor: ((row: Certificate) => {
        const getProgramTitle = (p: any) => p?.title ?? p?.name ?? p?.label ?? p?.programTitle ?? p?.programName;
        const anyRow: any = row as any;
        const student = row.student || students.find((st) => st.id === row.studentId);

        // 1) Try embedded student.program
        const titleFromStudent = getProgramTitle(student?.program);
        if (titleFromStudent) return titleFromStudent;

        // 2) Try programId from student, then from certificate itself
        const programId = student?.programId ?? anyRow.programId;
        if (!programId) return '—';
        const program = programs.find((p) => p.id === programId);
        return getProgramTitle(program) || '—';
      }) as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Student',
      accessor: ((row: Certificate) => {
        const s = row.student || students.find((st) => st.id === row.studentId);
        if (!s) return '—';
        const first = s.firstName;
        const last = s.lastName;
        const full = `${(first || '').trim()} ${(last || '').trim()}`.trim();
        return full || s.studentId || s.id || '—';
      }) as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Final Mark',
      accessor: ((row: Certificate) => {
        const raw = (row as any).finalMark;
        const mark = typeof raw === 'number' ? raw : raw !== undefined && raw !== null ? Number(raw) : NaN;
        return Number.isFinite(mark) ? `${mark.toFixed(2)}%` : '—';
      }) as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Degree Classification',
      accessor: ((row: Certificate) => row.degreeClassification || '—') as (row: Certificate) => React.ReactNode,
    },
    {
      header: 'Graduation Date',
      accessor: ((row: Certificate) => new Date(row.graduationDate).toLocaleDateString()) as (row: Certificate) => React.ReactNode,
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
          {viewingLoading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Student</label>
                <p className="text-gray-900">
                  {formatStudentDisplay(viewingCertificate.student || students.find((st) => st.id === viewingCertificate.studentId))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Graduation Date</label>
                <p className="text-gray-900">
                  {new Date(viewingCertificate.graduationDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Final Mark</label>
                <p className="text-gray-900 font-medium">
                  {(() => {
                    const raw = (viewingCertificate as any).finalMark;
                    const mark =
                      typeof raw === 'number' ? raw : raw !== undefined && raw !== null ? Number(raw) : NaN;
                    return Number.isFinite(mark) ? `${mark.toFixed(2)}%` : '—';
                  })()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Degree Classification</label>
                <p className="text-gray-900 font-medium">
                  {viewingCertificate.degreeClassification || '—'}
                </p>
              </div>
            </div>

            {/* Grades Table */}
            {viewingCertificate.grades && viewingCertificate.grades.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Grades</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Code
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          Credits
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          Mark
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingCertificate.grades.map((grade) => (
                        <tr key={grade.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">
                            {grade.module?.code || (grade as any).moduleId || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {grade.module?.credits || 0}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {Number.isFinite(Number(grade.mark)) ? Number(grade.mark).toFixed(2) : '—'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Average Grade (legacy, if present) */}
                {viewingCertificate.averageGrade !== undefined && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Grade</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {viewingCertificate.averageGrade.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
            {!viewingLoading &&
              (!viewingCertificate.grades || viewingCertificate.grades.length === 0) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Grades</h3>
                <p className="text-sm text-gray-600">
                  No module grades available for this certificate.
                </p>
              </div>
            )}

            {/* QR Code */}
            <div className="border-t pt-6">
              <label className="text-sm font-medium text-gray-600">QR Code for Verification</label>
              <div className="mt-4 flex justify-center">
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

            {/* PDF Download Button */}
            {viewingCertificate.status === CertificateStatus.ACTIVE && (
              <div className="border-t pt-6">
                <Button
                  onClick={() => handleDownloadPDF(viewingCertificate.id)}
                  className="w-full flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Download Certificate as PDF
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
