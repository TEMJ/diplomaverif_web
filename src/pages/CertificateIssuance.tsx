import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Student, Module } from '../types';
import {
  Check,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  calculateDegreeClassification,
  validateAllMarksAssigned,
} from '../lib/degreeClassification';

export const CertificateIssuance: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'individual' | 'bulk'>('individual');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [marks, setMarks] = useState<Array<{ moduleId: string; mark: number; credits: number }>>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Store marks for each student in bulk mode: Map<studentId, Array<{moduleId, mark, credits}>>
  const [bulkMarks, setBulkMarks] = useState<Map<string, Array<{ moduleId: string; mark: number; credits: number }>>>(new Map());

  const canManage = user?.role === Role.ADMIN || user?.role === Role.UNIVERSITY;

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

      // Fetch students and certificates in parallel
      const [studentsRes, certificatesRes] = await Promise.all([
        axios.get('/students', { params }),
        axios.get('/certificates', { params }),
      ]);

      const studentsList = studentsRes.data.data || studentsRes.data;
      const certificatesList = certificatesRes.data.data || certificatesRes.data;

      // Extract studentIds that already have certificates
      const studentsWithCertificates = new Set<string>();
      if (Array.isArray(certificatesList)) {
        certificatesList.forEach((cert: any) => {
          if (cert.studentId) {
            studentsWithCertificates.add(cert.studentId);
          }
        });
      }

      // Filter out students who already have certificates
      const studentsWithoutCertificates = Array.isArray(studentsList)
        ? studentsList.filter((student) => !studentsWithCertificates.has(student.id))
        : studentsList;

      // Sort students alphabetically by last name, then first name
      const sortedStudents = Array.isArray(studentsWithoutCertificates)
        ? [...studentsWithoutCertificates].sort((a, b) => {
            const lastNameA = (a.lastName || '').toLowerCase();
            const lastNameB = (b.lastName || '').toLowerCase();
            if (lastNameA !== lastNameB) {
              return lastNameA.localeCompare(lastNameB);
            }
            const firstNameA = (a.firstName || '').toLowerCase();
            const firstNameB = (b.firstName || '').toLowerCase();
            return firstNameA.localeCompare(firstNameB);
          })
        : studentsWithoutCertificates;
      setStudents(sortedStudents);

      const modulesRes = await axios.get('/modules');
      setModules(modulesRes.data.data || modulesRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const currentStudent = students[currentStudentIndex];

  const handleIssueIndividual = async () => {
    if (!currentStudent) {
      toast.error('No student selected.');
      return;
    }

    // Validation stricte des champs requis
    if (!currentStudent.universityId || typeof currentStudent.universityId !== 'string' || !currentStudent.universityId.trim()) {
      toast.error('Missing universityId for the selected student.');
      return;
    }
    // Ici, degreeTitle et specialization sont hardcodés, mais on vérifie quand même
    const degreeTitle = 'Bachelor of Science';
    const specialization = 'Computer Science';
    if (!degreeTitle.trim() || !specialization.trim()) {
      toast.error('Degree title and specialization are required.');
      return;
    }
    // Graduation date (aujourd'hui ISO)
    const graduationDate = new Date().toISOString();
    if (!graduationDate) {
      toast.error('Graduation date is required.');
      return;
    }
    // Validation des marks
    const markData = marks.map((m) => ({
      studentId: currentStudent.id,
      moduleId: m.moduleId,
      mark: m.mark,
      credits: m.credits,
    }));
    if (!Array.isArray(markData) || markData.length === 0) {
      toast.error('No marks entered for this student.');
      return;
    }
    // Tous les modules doivent avoir une note et des crédits valides
    for (const m of markData) {
      if (!m.moduleId || typeof m.mark !== 'number' || isNaN(m.mark) || typeof m.credits !== 'number' || isNaN(m.credits)) {
        toast.error('Each module must have a valid mark and credits.');
        return;
      }
    }

    // Utilise uniquement les modules du programme courant pour la validation
    const filteredModules = currentStudent && currentStudent.programId
      ? modules.filter((m) => m.programId === currentStudent.programId)
      : modules;
    const validation = validateAllMarksAssigned(filteredModules, marks);
    if (!validation.isValid) {
      toast.error('All modules must have marks assigned');
      return;
    }

    try {
      setIsGenerating(true);
      // Calcul de la moyenne pondérée (finalMark = Weighted Average) et classification
      let finalMark: number | undefined = undefined;
      let degreeClassification: string | undefined = undefined;
      if (markData.length > 0) {
        const result = calculateDegreeClassification(markData);
        finalMark = result.averageMark; // Weighted Average
        degreeClassification = result.classification;
      }

      // Construction du payload
      const payload = {
        studentId: currentStudent.id,
        universityId: currentStudent.universityId,
        programId: currentStudent.programId,
        graduationDate,
        finalMark,
        degreeClassification,
        pdfUrl: 'https://example.com/placeholder.pdf',
        marks: markData,
      };
      console.log('Payload envoyé à /certificates:', JSON.stringify(payload, null, 2));

      // Issue certificate via API avec tous les champs requis
      await axios.post('/certificates', payload);

      toast.success('Certificate issued successfully');
      setMarks([]);
      // Refetch data to update the filtered list (student will be removed)
      await fetchData();
      // Reset index to 0 after filtering (student was removed from list)
      setCurrentStudentIndex(0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIssueBulk = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Select at least one student');
      return;
    }

    // Validate that all selected students have marks
    const studentIds = Array.from(selectedStudents);
    const studentsWithoutMarks: string[] = [];
    
    for (const studentId of studentIds) {
      const student = students.find((s) => s.id === studentId);
      if (!student) continue;
      
      const studentMarks = bulkMarks.get(studentId) || [];
      const filteredModules = student.programId
        ? modules.filter((m) => m.programId === student.programId)
        : modules;
      
      const validation = validateAllMarksAssigned(filteredModules, studentMarks);
      if (!validation.isValid) {
        studentsWithoutMarks.push(`${student.firstName} ${student.lastName}`);
      }
    }

    if (studentsWithoutMarks.length > 0) {
      toast.error(`Please enter marks for: ${studentsWithoutMarks.join(', ')}`);
      return;
    }

    try {
      setIsGenerating(true);
      const total = studentIds.length;

      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        const student = students.find((s) => s.id === studentId);
        if (!student) continue;

        const markData = bulkMarks.get(studentId) || [];
        
        // Calculate finalMark and degreeClassification
        let finalMark: number | undefined = undefined;
        let degreeClassification: string | undefined = undefined;
        if (markData.length > 0) {
          const result = calculateDegreeClassification(markData);
          finalMark = result.averageMark;
          degreeClassification = result.classification;
        }

        await axios.post('/certificates', {
          studentId,
          universityId: student.universityId,
          programId: student.programId,
          degreeTitle: 'Bachelor of Science',
          specialization: 'Computer Science',
          graduationDate: new Date().toISOString(),
          finalMark,
          degreeClassification,
          pdfUrl: 'https://example.com/placeholder.pdf',
          marks: markData.map((m) => ({
            studentId: student.id,
            moduleId: m.moduleId,
            mark: m.mark,
            credits: m.credits,
          })),
        });

        setGenerationProgress(((i + 1) / total) * 100);
      }

      toast.success(`${total} certificates issued successfully`);
      setSelectedStudents(new Set());
      setBulkMarks(new Map());
      setGenerationProgress(0);
      setShowConfirmation(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to issue certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">You do not have permission to issue certificates</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Certificate Issuance</h1>
        <div className="flex gap-2">
          <Button
            variant={currentView === 'individual' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('individual')}
          >
            Individual
          </Button>
          <Button
            variant={currentView === 'bulk' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('bulk')}
          >
            Bulk
          </Button>
        </div>
      </div>

      {currentView === 'individual' ? (
        <IndividualIssuanceView
          currentStudent={currentStudent}
          currentStudentIndex={currentStudentIndex}
          totalStudents={students.length}
          modules={modules}
          marks={marks}
          setMarks={setMarks}
          onNext={() =>
            setCurrentStudentIndex(Math.min(currentStudentIndex + 1, students.length - 1))
          }
          onPrevious={() =>
            setCurrentStudentIndex(Math.max(currentStudentIndex - 1, 0))
          }
          onIssue={handleIssueIndividual}
          isGenerating={isGenerating}
        />
      ) : (
        <BulkIssuanceView
          students={students}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
          onIssue={() => setShowConfirmation(true)}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
        />
      )}

      <Modal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setBulkMarks(new Map());
        }}
        title="Enter Marks for Selected Students"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-600">
            Please enter module marks for each selected student. All modules must have marks assigned.
          </p>

          {Array.from(selectedStudents).map((studentId) => {
            const student = students.find((s) => s.id === studentId);
            if (!student) return null;

            const filteredModules = student.programId
              ? modules.filter((m) => m.programId === student.programId)
              : modules;
            
            const studentMarks = bulkMarks.get(studentId) || [];
            const validation = validateAllMarksAssigned(filteredModules, studentMarks);
            const classificationData = studentMarks.length > 0 
              ? calculateDegreeClassification(studentMarks)
              : null;

            return (
              <div key={studentId} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{student.studentId}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    validation.isValid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {validation.isValid ? 'Ready' : 'Missing marks'}
                  </div>
                </div>

                {classificationData && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Weighted Average</p>
                    <p className="text-xl font-bold text-blue-600">
                      {classificationData.averageMark.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-700">{classificationData.classification}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {filteredModules.map((module) => {
                    const mark = studentMarks.find((m) => m.moduleId === module.id);

                    return (
                      <div key={module.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{module.name}</p>
                          <p className="text-xs text-gray-600">{module.code} • {module.credits} CATS</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={mark?.mark || ''}
                          onChange={(e) => {
                            const newMarks = new Map(bulkMarks);
                            const currentMarks = newMarks.get(studentId) || [];
                            const filteredMarks = currentMarks.filter((m) => m.moduleId !== module.id);
                            
                            if (e.target.value) {
                              filteredMarks.push({
                                moduleId: module.id,
                                mark: parseFloat(e.target.value),
                                credits: module.credits,
                              });
                            }
                            
                            newMarks.set(studentId, filteredMarks);
                            setBulkMarks(newMarks);
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0-100"
                        />
                        <span className="text-sm text-gray-500 w-8">%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirmation(false);
                setBulkMarks(new Map());
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueBulk}
              disabled={isGenerating}
            >
              {isGenerating ? 'Issuing...' : 'Issue All Certificates'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface IndividualIssuanceViewProps {
  currentStudent?: Student;
  currentStudentIndex: number;
  totalStudents: number;
  modules: Module[];
  marks: Array<{ moduleId: string; mark: number; credits: number }>;
  setMarks: (marks: Array<{ moduleId: string; mark: number; credits: number }>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onIssue: () => void;
  isGenerating: boolean;
}

function IndividualIssuanceView({
  currentStudent,
  currentStudentIndex,
  totalStudents,
  modules,
  marks,
  setMarks,
  onNext,
  onPrevious,
  onIssue,
  isGenerating,
}: IndividualIssuanceViewProps) {
  if (!currentStudent) {
    return <div className="text-center py-12">No students available</div>;
  }

  const classificationData = calculateDegreeClassification(marks);
  // Utiliser uniquement les modules du programme courant pour la validation
  const filteredModules = currentStudent && currentStudent.programId
    ? modules.filter((m) => m.programId === currentStudent.programId)
    : modules;
  const validation = validateAllMarksAssigned(filteredModules, marks);

  // filteredModules déjà défini ci-dessus

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Student Preview Card */}
      <Card className="col-span-1">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>

          {currentStudent.photoUrl && (
            <img
              src={currentStudent.photoUrl}
              alt={`${currentStudent.firstName} ${currentStudent.lastName}`}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-lg font-bold text-gray-900">
              {currentStudent.firstName} {currentStudent.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Student ID</p>
            <p className="text-lg font-mono text-gray-900">{currentStudent.studentId}</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Weighted Average</p>
            <p className="text-3xl font-bold text-blue-600">
              {classificationData.averageMark.toFixed(2)}%
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Classification</p>
            <p className="text-xl font-bold text-blue-600">
              {classificationData.classification}
            </p>
            <p className="text-sm text-gray-700">{classificationData.classificationFull}</p>
          </div>

          <div
            className={`rounded-lg p-3 flex items-center gap-2 ${
              validation.isValid
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {validation.isValid ? (
              <>
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Ready to issue</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Missing marks</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Marks Entry */}
      <div className="col-span-2 space-y-6">
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Module Marks</h2>

            <div className="space-y-3 max-h-96 overflow-auto">
              {filteredModules.map((module) => {
                const mark = marks.find((m) => m.moduleId === module.id);

                return (
                  <div key={module.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{module.name}</p>
                      <p className="text-sm text-gray-600">{module.code} • {module.credits} CATS</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mark?.mark || ''}
                      onChange={(e) => {
                        const newMarks = marks.filter((m) => m.moduleId !== module.id);
                        if (e.target.value) {
                          newMarks.push({
                            moduleId: module.id,
                            mark: parseFloat(e.target.value),
                            credits: module.credits,
                          });
                        }
                        setMarks(newMarks);
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="0-100"
                    />
                    <span className="text-sm text-gray-500 w-12">%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Navigation and Action */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onPrevious} disabled={currentStudentIndex === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={onNext}
              disabled={currentStudentIndex === totalStudents - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            {currentStudentIndex + 1} of {totalStudents}
          </div>

          <Button
            onClick={onIssue}
            disabled={isGenerating || !validation.isValid}
          >
            {isGenerating ? 'Issuing...' : 'Issue Certificate'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface BulkIssuanceViewProps {
  students: Student[];
  selectedStudents: Set<string>;
  setSelectedStudents: (students: Set<string>) => void;
  onIssue: () => void;
  isGenerating: boolean;
  generationProgress: number;
}

function BulkIssuanceView({
  students,
  selectedStudents,
  setSelectedStudents,
  onIssue,
  isGenerating,
  generationProgress,
}: BulkIssuanceViewProps) {
  return (
    <div className="space-y-6">
      {isGenerating && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Generating: {Math.round(generationProgress)} / 100 certificates completed
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Select Students</h2>
            <Button
              variant="secondary"
              onClick={() =>
                setSelectedStudents(
                  selectedStudents.size === students.length
                    ? new Set()
                    : new Set(students.map((s) => s.id))
                )
              }
            >
              {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-auto">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedStudents);
                    if (e.target.checked) {
                      newSet.add(student.id);
                    } else {
                      newSet.delete(student.id);
                    }
                    setSelectedStudents(newSet);
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{student.studentId}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={onIssue}
              disabled={isGenerating || selectedStudents.size === 0}
            >
              {isGenerating ? 'Issuing...' : 'Issue All Selected'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
