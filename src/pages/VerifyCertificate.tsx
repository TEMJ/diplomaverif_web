import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { CertificateStatus } from '../types';
import { 
  CheckCircle2, XCircle, Search, School, 
  FileText, ShieldCheck, Mail, 
  Linkedin, Twitter, Hash, Award, GraduationCap,
  RefreshCw
} from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const { qrHash } = useParams();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  // --- LOGIQUE DE VÉRIFICATION ---
  const performVerification = async (value: string, mode: 'id' | 'qr') => {
    if (!value.trim()) return;
    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      const endpoint = mode === 'qr' 
        ? `/certificates/verify/${value}` 
        : `/certificates/search/${value}`;
      const response = await axios.get(endpoint);
      
      // Récupération des données selon la structure de ta réponse API corrigée
      const certData = response.data?.data?.certificate || response.data?.data;
      
      if (certData) {
        setCertificate(certData);
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      if (error.response?.status === 404) setNotFound(true);
      else toast.error('Verification service unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Déclenchement automatique si hash présent dans l'URL (QR Code)
  useEffect(() => {
    if (qrHash) {
      setStudentId(qrHash);
      performVerification(qrHash, 'qr');
    }
  }, [qrHash]);

  // --- LOGIQUE DE CALCUL DU FINAL MARK ---
  const getFormattedFinalMark = (cert: any) => {
    const raw = cert.finalMark ?? cert.final_mark; // Supporte les deux formats
    const mark = typeof raw === 'number' ? raw : (raw !== undefined && raw !== null ? Number(raw) : NaN);
    return Number.isFinite(mark) ? `${mark.toFixed(2)}%` : '—';
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans antialiased">
      
      {/* --- HEADER --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold tracking-tight">DiplomaVerif<span className="text-blue-600">.uk</span></span>
          </div>
          </Link>
          <div className="flex items-center gap-6 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <Link to="/login" className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
      
        {notFound && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Record Not Found</h3>
            <p className="text-slate-500 text-sm mt-1">The provided credentials do not match our registry records.</p>
          </div>
        )}

        {certificate && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Status Indicator */}
            <div className={`p-5 rounded-xl border flex items-center justify-between ${
              certificate.status === CertificateStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center gap-4">
                {certificate.status === CertificateStatus.ACTIVE ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <span className="text-sm font-bold tracking-tight uppercase">
                  {certificate.status === CertificateStatus.ACTIVE ? 'Authenticated Official Record' : 'Invalid / Revoked Document'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold opacity-40 hidden sm:block">REF: {certificate.id?.substring(0,12).toUpperCase()}</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Student Details Card */}
              <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-4">
                    <img 
                      src={certificate.student?.photoUrl || `https://ui-avatars.com/api/?name=${certificate.student?.firstName}+${certificate.student?.lastName}&background=f8fafc&color=334155`} 
                      className="w-24 h-24 rounded-full border border-slate-100 p-1 object-cover" alt="Profile" 
                    />
                    <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-white">
                      <GraduationCap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold leading-tight uppercase tracking-tight">
                    {certificate.student?.firstName} {certificate.student?.lastName}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-blue-600 mt-2">
                    <Hash className="w-3 h-3" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{certificate.student?.studentId}</span>
                  </div>
                </div>
                
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div>
                    <Label>Degree Classification</Label>
                    <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {certificate.degreeClassification || certificate.degree_classification || 'Standard Pass'}
                    </span>
                  </div>
                  <div>
                    <Label>Registered Email</Label>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Mail className="w-3 h-3 text-slate-400" /> 
                      <span className="truncate">{certificate.student?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institution & Grades Card */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <School className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <Label>Awarding Body</Label>
                      <h3 className="text-lg font-bold">{certificate.university?.name || 'Authorized Institution'}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Qualification Name</Label>
                      <p className="text-sm font-bold text-slate-800">
                        {certificate.program?.name || certificate.program?.title || 'Academic Degree'}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Award Date</Label>
                      <p className="text-sm font-bold text-slate-800">
                        {certificate.graduationDate ? new Date(certificate.graduationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label>Final Academic Mark</Label>
                      <span className="text-3xl font-black text-blue-600 tracking-tighter">
                        {getFormattedFinalMark(certificate)}
                      </span>
                    </div>
                    <div className="flex items-end justify-end">
                       <Award className="w-10 h-10 text-slate-100" />
                    </div>
                  </div>
                </div>

                {/* Transcript Breakdown - Directement depuis l'objet certificate */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <Label>Transcript Records</Label>
                    <FileText className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {certificate.grades && certificate.grades.length > 0 ? (
                      certificate.grades.map((grade: any) => (
                        <div key={grade.id} className="px-8 py-4 flex justify-between items-center text-sm hover:bg-slate-50/50 transition-colors">
                          <div className="max-w-[70%]">
                            <p className="font-bold text-slate-700 leading-snug">{grade.module?.name || grade.module?.title}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{grade.module?.code}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900">{Number(grade.mark).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        No transcript records available for this credential.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-sm font-bold tracking-tighter uppercase">DiplomaVerif.uk</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">UK Higher Education Digital Registry</p>
          </div>
        </div>
      </footer>
    </div>
  );
};