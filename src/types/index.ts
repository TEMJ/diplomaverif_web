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
  logoUrl?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  universityId: string;
  matricule: string;
  email: string;
  photoUrl?: string;
  dateOfBirth: string;
  createdAt: string;
  major: string;
  university?: University;
}

export interface Certificate {
  id: string;
  studentId: string;
  universityId: string;
  degreeTitle: string;
  specialization: string;
  graduationDate: string;
  pdfUrl: string;
  qrCodeUrl: string;
  qrHash: string;
  status: CertificateStatus;
  createdAt: string;
  student?: Student;
  university?: University;
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

export interface StudentRecord {
  id: string;
  studentId: string;
  attendance: number;
  discipline: string;
  gradesPdfUrl: string;
  transcriptPdfUrl: string;
  diplomaPdfUrl: string;
  createdAt: string;
  student?: Student;
}
