export enum Role {
  ADMIN = 'ADMIN',
  UNIVERSITY = 'UNIVERSITY',
  STUDENT = 'STUDENT'
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED'
}

export interface User {
  id: string;
  email: string;
  role: Role;
  universityId?: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  ukprn?: string;
  officialSealUrl?: string;
  registrarName?: string;
  signatureUrl?: string;
  createdAt: string;
}

export interface Program {
  id: string;
  universityId: string;
  title: string;
  level: 'Undergraduate' | 'Postgraduate';
  totalCreditsRequired: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  universityId?: string;
  programId?: string;
  code: string;
  name: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentId: string;
  universityId: string;
  programId?: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  enrollmentDate?: string;
  dateOfBirth?: string;
  createdAt: string;
  university?: University;
  program?: Program;
  grades?: Grade[];
}

export interface Subject {
  id: string;
  universityId: string;
  name: string;
  code: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  mark: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  module?: Module;
}

export interface Certificate {
  id: string;
  studentId: string;
  universityId: string;
  degreeTitle: string;
  specialization: string;
  graduationDate: string;
  finalMark?: number;
  degreeClassification?: string;
  pdfUrl: string;
  qrCodeUrl: string;
  qrHash: string;
  status: CertificateStatus;
  createdAt: string;
  student?: Student;
  university?: University;
  grades?: Array<{
    id: string;
    mark: number;
    module: Module;
  }>;
  averageGrade?: number;
}

export interface Verification {
  id: string;
  certificateId: string;
  companyName: string;
  email: string;
  reason: string;
  verificationDate: string;
  ipAddress: string;
  certificate?: Certificate;
}

// export interface StudentRecord {
//   id: string;
//   studentId: string;
//   attendance: number;
//   discipline: string;
//   gradesPdfUrl: string;
//   transcriptPdfUrl: string;
//   diplomaPdfUrl: string;
//   createdAt: string;
//   student?: Student;
// }