import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, CertificateStatus, Program } from '../types';
import { 
  CheckCircle2, XCircle, Award, Search, 
  User, School, FileText, ArrowLeft, ShieldCheck, 
  GraduationCap, Calendar, Mail, MapPin, Hash
} from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const { qrHash } = useParams();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [programTitle, setProgramTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // --- LOGIQUE DE RECHERCHE ---
  const performVerification = async (value: string, mode: 'id' | 'qr') => {
    if (!value.trim()) return;

    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      // Utilisation des endpoints originaux : /verify/ pour le hash, /search/ pour l'ID
      const endpoint = mode === 'qr' 
        ? `/certificates/verify/${value}` 
        : `/certificates/search/${value}`;

      const response = await axios.get(endpoint);
      
      // Adaptation à la structure de données de ton API
      const cert = response.data?.data?.certificate || response.data?.data;
      
      if (cert) {
        setCertificate(cert);
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Verification service temporarily unavailable');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- AUTO-VERIFICATION VIA URL (qrHash) ---
  useEffect(() => {
    if (qrHash) {
      setStudentId(qrHash);
      performVerification(qrHash, 'qr');
    }
  }, [qrHash]);

  // --- RESOLUTION DU TITRE DU PROGRAMME ---
  useEffect(() => {
    if (!certificate) {
      setProgramTitle(null);
      return;
    }

    const programId = (certificate as any)?.programId || (certificate as any)?.program?.id || certificate?.student?.programId;
    const universityId = (certificate as any)?.universityId || (certificate as any)?.university?.id || certificate?.student?.universityId;

    const embeddedTitle = (certificate as any)?.program?.title || (certificate as any)?.program?.name || (certificate as any)?.programTitle;
    
    if (embeddedTitle) {
      setProgramTitle(String(embeddedTitle));
      return;
    }

    if (programId) {
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
    }
  }, [certificate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(studentId, 'id');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-80 bg-blue-600 skew-y-[-3deg] origin-top-left -z-10 shadow-2xl"></div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-12">
          <Link to="/login" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            Système Sécurisé DiplomaVerif
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Vérification de Diplôme
          </h1>
          <p className="text-blue-100 text-lg opacity-90 max-w-xl mx-auto font-medium">
            Validez instantanément l'authenticité des titres académiques via notre registre numérique.
          </p>
        </div>

        {/* Search Engine Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 p-3 mb-12 transform hover:scale-[1.01] transition-transform">
          <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Entrez l'ID du certificat ou de l'étudiant..."
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all text-slate-700 font-semibold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-blue-200 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Vérifier
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Logic */}
        <div className="space-y-8">
          {notFound && (
            <div className="bg-white border-2 border-red-100 rounded-[2rem] p-10 text-center animate-in fade-in zoom-in duration-300 shadow-xl">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Certificat Introuvable</h3>
              <p className="text-slate-500 mt-3 max-w-sm mx-auto font-medium">
                Aucun enregistrement ne correspond à cet identifiant. Le document est peut-être invalide ou révoqué.
              </p>
            </div>
          )}

          {certificate && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Status Banner */}
              <div className={`rounded-[2rem] p-8 flex items-center justify-between shadow-xl border-b-4 ${
                certificate.status === CertificateStatus.ACTIVE 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                : 'bg-red-50 border-red-500 text-red-900'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${certificate.status === CertificateStatus.ACTIVE ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg shadow-current/20`}>
                    {certificate.status === CertificateStatus.ACTIVE 
                      ? <CheckCircle2 className="w-10 h-10 text-white" />
                      : <XCircle className="w-10 h-10 text-white" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">Résultat du contrôle</p>
                    <h3 className="text-3xl font-black italic">
                      {certificate.status === CertificateStatus.ACTIVE ? 'DOCUMENT AUTHENTIQUE' : 'CERTIFICAT RÉVOQUÉ'}
                    </h3>
                  </div>
                </div>
                <Award className={`w-16 h-16 opacity-10 hidden md:block`} />
              </div>

              {/* Data Grid */}
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left Column: Student */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <User className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Profil de l'Étudiant</h4>
                  </div>
                  
                  <div className="flex flex-col items-center text-center pb-8 border-b border-slate-50">
                    <div className="relative mb-6">
                      {certificate.student?.photoUrl ? (
                        <img src={certificate.student.photoUrl} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" alt="Student" />
                      ) : (
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center shadow-inner border-2 border-slate-50">
                          <User className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-lg shadow-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      {certificate.student?.firstName} {certificate.student?.lastName}
                    </h2>
                    <p className="text-blue-600 font-bold mt-2">ID: {certificate.student?.studentId}</p>
                  </div>

                  <div className="pt-8 space-y-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Programme</span>
                      <span className="font-bold text-slate-800 leading-snug">{programTitle || 'Non spécifié'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remis le</span>
                        <span className="font-bold text-slate-700">
                          {certificate.graduationDate ? new Date(certificate.graduationDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {certificate.degreeClassification && (
                        <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700 text-sm font-black">
                          {certificate.degreeClassification}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: University & Grades */}
                <div className="lg:col-span-3 space-y-6">
                  {/* University Card */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <School className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Établissement Émetteur</h4>
                    </div>
                    
                    <div className="flex items-start gap-6 mb-8">
                      {certificate.university?.logoUrl && (
                        <img src={certificate.university.logoUrl} className="w-20 h-20 object-contain rounded-xl p-2 bg-slate-50" alt="Univ Logo" />
                      )}
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{certificate.university?.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm font-medium">
                          <MapPin className="w-4 h-4" />
                          {certificate.university?.address}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registraire</p>
                        <p className="font-serif italic text-slate-800 font-bold">{certificate.university?.registrarName || 'Service Académique'}</p>
                      </div>
                      <div className="flex justify-end">
                        {certificate.university?.officialSealUrl && (
                          <img src={certificate.university.officialSealUrl} className="w-16 h-16 opacity-30 grayscale" alt="Sceau" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grades Card */}
                  {certificate.grades && certificate.grades.length > 0 && (
                    <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl text-white">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/10 rounded-xl text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold uppercase tracking-wider text-sm">Relevé de Notes</h4>
                      </div>
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {certificate.grades.map((grade: any) => (
                          <div key={grade.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <div>
                              <p className="font-bold text-sm">{grade.module?.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-widest">{grade.module?.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-blue-400">{Number(grade.mark).toFixed(1)}%</p>
                              <p className="text-[10px] text-slate-500">{grade.module?.credits} Crédits</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Blockchain Verified Infrastructure
          </p>
          <div className="inline-flex gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
             {/* Tu peux ajouter des logos de partenaires ici */}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};