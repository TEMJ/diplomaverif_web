import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, CertificateStatus, Program } from '../types';
import { 
  CheckCircle2, XCircle, Award, Camera, Search, 
  User, School, Calendar, FileText, ArrowLeft, ShieldCheck 
} from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [programTitle, setProgramTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      toast.error('Please enter a valid ID');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      const endpoint = `/certificates/search/${studentId}`;
      const response = await axios.get(endpoint);
      const cert = response.data?.data?.certificate || response.data?.data;
      setCertificate(cert || null);
      if (cert) setShowVerificationForm(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logic pour récupérer le titre du programme (identique à ton code)
  useEffect(() => {
    const programId = (certificate as any)?.programId || (certificate as any)?.program?.id || certificate?.student?.programId;
    const universityId = (certificate as any)?.universityId || (certificate as any)?.university?.id || certificate?.student?.universityId;

    if (!certificate || !programId) {
      setProgramTitle(null);
      return;
    }

    const embeddedTitle = (certificate as any)?.program?.title || (certificate as any)?.program?.name;
    if (embeddedTitle) {
      setProgramTitle(String(embeddedTitle));
      return;
    }

    (async () => {
      try {
        const res = await axios.get('/programs', { params: universityId ? { universityId } : {} });
        const list: Program[] = res.data?.data || res.data;
        if (Array.isArray(list)) {
          const p = list.find((x) => x.id === programId) as any;
          setProgramTitle(p?.title ?? p?.name ?? null);
        }
      } catch {
        setProgramTitle(null);
      }
    })();
  }, [certificate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 skew-y-[-2deg] origin-top-left -z-10 shadow-xl"></div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-12">
          <Link to="/login" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to portal
          </Link>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-sm">
            <ShieldCheck className="w-4 h-4" />
            Secured by DiplomaVerif
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Verify Excellence.
          </h1>
          <p className="text-blue-100 text-lg opacity-90">
            Instantly validate academic credentials with our encrypted verification engine.
          </p>
        </div>

        {/* Search Engine Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 p-2 mb-10">
          <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Certificate or Student ID..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-200"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Now'}
            </button>
          </form>
        </div>

        {/* Results Logic */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {notFound && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-900">Credential Not Found</h3>
              <p className="text-red-700 mt-2">The ID provided does not match any record in our secure database.</p>
            </div>
          )}

          {certificate && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className={`rounded-3xl p-6 flex items-center justify-between shadow-sm border ${
                certificate.status === CertificateStatus.ACTIVE 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-orange-50 border-orange-100 text-orange-800'
              }`}>
                <div className="flex items-center gap-4">
                  {certificate.status === CertificateStatus.ACTIVE 
                    ? <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    : <XCircle className="w-10 h-10 text-orange-500" />
                  }
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider opacity-70">Status</p>
                    <h3 className="text-2xl font-extrabold">
                      {certificate.status === CertificateStatus.ACTIVE ? 'Authenticity Verified' : 'Credential Revoked'}
                    </h3>
                  </div>
                </div>
                <div className="hidden md:block">
                   <Award className={`w-12 h-12 opacity-20`} />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Profile */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">Student Profile</h4>
                  </div>
                  
                  <div className="flex flex-col items-center text-center pb-6 border-b border-slate-50">
                    {certificate.student?.photoUrl ? (
                      <img src={certificate.student.photoUrl} className="w-24 h-24 rounded-3xl object-cover shadow-md mb-4 border-4 border-white" alt="Avatar" />
                    ) : (
                      <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-4"><User className="w-10 h-10 text-slate-300" /></div>
                    )}
                    <h2 className="text-2xl font-bold text-slate-900">{certificate.student?.firstName} {certificate.student?.lastName}</h2>
                    <p className="text-slate-500 font-medium">ID: {certificate.student?.studentId}</p>
                  </div>

                  <div className="pt-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Program</span>
                      <span className="font-bold text-slate-700 text-right max-w-[180px]">{programTitle || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Graduation</span>
                      <span className="font-bold text-slate-700">
                        {certificate.graduationDate ? new Date(certificate.graduationDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Institution Profile */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <School className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg">Issuing Institution</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                        {certificate.university?.logoUrl && <img src={certificate.university.logoUrl} className="w-12 h-12 object-contain" alt="Logo" />}
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{certificate.university?.name}</p>
                          <p className="text-xs text-slate-500">{certificate.university?.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase mb-2">Registrar Signature</p>
                      <p className="font-serif italic text-lg text-slate-700">{certificate.university?.registrarName || 'Official Transcript'}</p>
                    </div>
                    {certificate.university?.officialSealUrl && (
                      <img src={certificate.university.officialSealUrl} className="w-16 h-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all" alt="Seal" />
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Table */}
              {certificate.grades && certificate.grades.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">Academic Records</h4>
                  </div>
                  <div className="overflow-x-auto -mx-8 px-8">
                    <table className="w-full">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-50">
                          <th className="text-left pb-4 font-bold italic">Module</th>
                          <th className="text-right pb-4 font-bold italic">Credits</th>
                          <th className="text-right pb-4 font-bold italic">Mark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {certificate.grades.map((grade: any) => (
                          <tr key={grade.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                              <p className="font-bold text-slate-700">{grade.module?.name}</p>
                              <p className="text-xs text-slate-400">{grade.module?.code}</p>
                            </td>
                            <td className="py-4 text-right font-medium text-slate-600">{grade.module?.credits}</td>
                            <td className="py-4 text-right">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-700">
                                {Number(grade.mark).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-12 text-center text-slate-400 text-sm italic">
          DiplomaVerif Node v3.1 • Blockchain Timestamped • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};