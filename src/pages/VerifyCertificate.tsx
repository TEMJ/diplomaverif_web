import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, CertificateStatus, Program } from '../types';
import { CheckCircle, XCircle, Award, Camera, Search, X } from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const [qrHash, setQrHash] = useState('');
  const [studentId, setStudentId] = useState('');
  const [searchMode, setSearchMode] = useState<'qr' | 'id'>('qr');
  const [loading, setLoading] = useState(false);
  // The backend returns { data: { certificate: {...} } }
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [programTitle, setProgramTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // QR Scanner - Start camera
  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowQRScanner(true);
        scanQRCode();
      }
    } catch (error) {
      toast.error('Unable to access camera. Please ensure permissions are granted.');
    }
  };

  // QR Scanner - Simple frame capture and decode attempt
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scanInterval = setInterval(() => {
      if (!video.videoWidth) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Try to extract text from QR code (simplified - in production use a QR library like jsQR)
      // For now, we'll just capture and show to user or use text detection
      try {
        // This is a placeholder - in production, use jsQR or similar library
        // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // jsQR(imageData.data, imageData.width, imageData.height)?.data
      } catch (e) {
        // Continue scanning
      }
    }, 500);

    return () => clearInterval(scanInterval);
  };

  // Stop QR scanner
  const stopQRScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowQRScanner(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchValue = searchMode === 'qr' ? qrHash : studentId;
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      let endpoint = '';
      if (searchMode === 'qr') {
        endpoint = `/certificates/verify/${searchValue}`;
      } else {
        // Search by certificate ID or student ID
        endpoint = `/certificates/search/${searchValue}`;
      }

      const response = await axios.get(endpoint);
      const cert = response.data?.data?.certificate || response.data?.data;
      setCertificate(cert || null);
      if (cert) setShowVerificationForm(true);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // allow auto-verification when route param is provided (e.g. /verify/:qrHash)
  const params = useParams();
  useEffect(() => {
    const paramHash = params.qrHash as string | undefined;
    if (paramHash) {
      // populate the input and call the API directly
      setQrHash(paramHash);
      (async () => {
        setLoading(true);
        setNotFound(false);
        setCertificate(null);
        try {
          const response = await axios.get(`/certificates/verify/${paramHash}`);
          const cert = response.data?.data?.certificate;
          setCertificate(cert || null);
          if (cert) setShowVerificationForm(true);
        } catch (error: unknown) {
          const err = error as { response?: { status?: number } };
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error('Verification failed');
          }
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.qrHash]);

  // Resolve program title when backend only provides programId (UUID)
  useEffect(() => {
    const programId =
      (certificate as any)?.programId ||
      (certificate as any)?.program?.id ||
      certificate?.student?.programId;
    const universityId =
      (certificate as any)?.universityId ||
      (certificate as any)?.university?.id ||
      certificate?.student?.universityId;

    if (!certificate || !programId) {
      setProgramTitle(null);
      return;
    }

    // If backend already embeds the program object with title, prefer it
    const embeddedTitle =
      (certificate as any)?.program?.title ||
      (certificate as any)?.program?.name ||
      (certificate as any)?.programTitle ||
      (certificate as any)?.programName;
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
          const title = p?.title ?? p?.name ?? null;
          setProgramTitle(title ? String(title) : null);
        } else {
          setProgramTitle(null);
        }
      } catch {
        setProgramTitle(null);
      }
    })();
  }, [certificate]);

  // ...

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificate) return;

    try {
      await axios.post('/verifications', {
        certificateId: certificate.id,
        companyName,
        email,
        reason,
      });
      toast.success('Verification logged successfully');
      setCompanyName('');
      setEmail('');
      setReason('');
      setShowVerificationForm(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to log verification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
          <p className="text-gray-600">Verify the authenticity of diplomas and certificates</p>
        </div>

        <Card>
          {/* Search Mode Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setSearchMode('qr')}
              className={`pb-3 px-4 font-medium transition-colors ${
                searchMode === 'qr'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                QR Code / Hash
              </div>
            </button>
            <button
              onClick={() => setSearchMode('id')}
              className={`pb-3 px-4 font-medium transition-colors ${
                searchMode === 'id'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Certificate / Student ID
              </div>
            </button>
          </div>

          {/* QR Scanner */}
          {showQRScanner && searchMode === 'qr' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">QR Code Scanner</h3>
                <button
                  onClick={stopQRScanner}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black max-h-96 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-sm text-gray-600 mt-4">
                Position the QR code within the frame to scan it.
              </p>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleVerify}>
            {searchMode === 'qr' ? (
              <div className="space-y-4">
                <Input
                  label="QR Hash Code or URL"
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  placeholder="Paste QR hash or scan with camera"
                  required={!showQRScanner}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={startQRScanner}
                    disabled={showQRScanner}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Scan QR Code
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Verifying...' : 'Verify Certificate'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Certificate ID or Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter Certificate ID (e.g., CERT-2024-001) or Student ID (e.g., 2024001)"
                  required
                />
                <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  {loading ? 'Searching...' : 'Search Certificate'}
                </Button>
              </div>
            )}
          </form>
        </Card>

        {notFound && (
          <Card className="mt-6 border-2 border-red-500">
            <div className="flex items-center space-x-4">
              <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-600">Certificate Not Found</h3>
                <p className="text-gray-600 mt-1">
                  This certificate could not be found in our system. It may be invalid or revoked.
                </p>
              </div>
            </div>
          </Card>
        )}

        {certificate && (
          <>
            <Card className={`mt-6 border-2 ${
              certificate.status === CertificateStatus.ACTIVE
                ? 'border-green-500'
                : 'border-red-500'
            }`}>
              <div className="flex items-start space-x-4">
                {certificate.status === CertificateStatus.ACTIVE ? (
                  <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${
                    certificate.status === CertificateStatus.ACTIVE
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {certificate.status === CertificateStatus.ACTIVE
                      ? 'Valid Certificate'
                      : 'Revoked Certificate'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const raw = (certificate as any).finalMark;
                        const mark =
                          typeof raw === 'number' ? raw : raw !== undefined && raw !== null ? Number(raw) : NaN;
                        return Number.isFinite(mark) ? (
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="text-xs text-gray-600 font-medium">Final Mark</p>
                          <p className="text-2xl font-bold text-blue-600">{mark.toFixed(2)}%</p>
                        </div>
                        ) : null;
                      })()}
                      {certificate.degreeClassification && (
                        <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                          <p className="text-xs text-gray-600 font-medium">Classification</p>
                          <p className="text-lg font-bold text-green-600">{certificate.degreeClassification}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Student Information</h4>
                        {certificate.student ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              {certificate.student.photoUrl && (
                                <img src={certificate.student.photoUrl} alt="student" className="w-16 h-16 rounded-md object-cover" />
                              )}
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{certificate.student.firstName} {certificate.student.lastName}</div>
                                <div className="text-xs text-gray-500">ID: {certificate.student.studentId}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              Program:{' '}
                              {programTitle ||
                                certificate.student.programId ||
                                'N/A'}
                            </div>
                            <div className="text-sm text-gray-700">Enrollment: {certificate.student.enrollmentDate ? new Date(certificate.student.enrollmentDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">No student details available</div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">University Information & Seal</h4>
                        {certificate.university ? (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              {certificate.university.logoUrl && (
                                <img src={certificate.university.logoUrl} alt="university-logo" className="w-16 h-16 rounded-md object-contain" />
                              )}
                              <div>
                                <div className="text-sm text-gray-700 font-semibold">{certificate.university.name}</div>
                                <div className="text-xs text-gray-500">{certificate.university.address}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">UKPRN: {certificate.university.ukprn || 'N/A'}</div>
                            <div className="text-sm text-gray-700">Registrar: {certificate.university.registrarName || 'N/A'}</div>
                            <div className="text-sm text-gray-700">Contact: {certificate.university.contactEmail}</div>
                            
                            {/* Official Seal Display */}
                            {certificate.university.officialSealUrl && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Official Institutional Seal</p>
                                <img src={certificate.university.officialSealUrl} alt="official-seal" className="w-20 h-20 rounded object-contain border-2 border-gray-300" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">No university details available</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Graduation Date:</span>
                      <p className="text-gray-900">
                        {certificate.graduationDate ? new Date(certificate.graduationDate).toLocaleDateString() : ''}
                      </p>
                    </div>

                    {/* Module Grades */}
                    {certificate.grades && certificate.grades.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Module Grades</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Module Code</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Module Title</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Credits</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Mark</th>
                              </tr>
                            </thead>
                            <tbody>
                              {certificate.grades.map((grade: any) => (
                                <tr key={grade.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3">
                                    {grade.module?.code || grade.moduleId || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3">
                                    {grade.module?.name || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    {grade.module?.credits ?? 0}
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    {Number.isFinite(Number(grade.mark))
                                      ? `${Number(grade.mark).toFixed(2)}%`
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {showVerificationForm && certificate?.status === CertificateStatus.ACTIVE && (
              <Card className="mt-6" title="Log Your Verification">
                <p className="text-gray-600 mb-4">
                  Please provide your information to log this verification request.
                </p>
                <form onSubmit={handleSubmitVerification}>
                  <Input
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Verification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Verification
                  </Button>
                </form>
              </Card>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};
