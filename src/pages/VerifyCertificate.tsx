import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Certificate, CertificateStatus, Verification } from '../types';
import { CheckCircle, XCircle, Award } from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const [qrHash, setQrHash] = useState('');
  const [loading, setLoading] = useState(false);
  // Le backend retourne { data: { certificate: {...} } }
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      const response = await axios.get(`/certificates/verify/${qrHash}`);
      const cert = response.data?.data?.certificate;
      const ver = response.data?.data?.verification;
      setCertificate(cert || null);
      setVerification(ver || null);
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
          const ver = response.data?.data?.verification;
          setCertificate(cert || null);
          setVerification(ver || null);
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
          <form onSubmit={handleVerify}>
            <Input
              label="Enter QR Hash Code"
              value={qrHash}
              onChange={(e) => setQrHash(e.target.value)}
              placeholder="Enter the QR hash from the certificate"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
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
                    <div>
                      <span className="font-medium text-gray-700">Degree Title:</span>
                      <p className="text-gray-900">{certificate.degreeTitle}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Specialization:</span>
                      <p className="text-gray-900">{certificate.specialization}</p>
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
                                <div className="text-sm text-gray-700">{certificate.student.email}</div>
                                <div className="text-xs text-gray-500">Matricule: {certificate.student.matricule}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">Major: {certificate.student.major}</div>
                            <div className="text-sm text-gray-700">Date of Birth: {certificate.student.dateOfBirth ? new Date(certificate.student.dateOfBirth).toLocaleDateString() : ''}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">No student details available</div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">University Information</h4>
                        {certificate.university ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              {certificate.university.logoUrl && (
                                <img src={certificate.university.logoUrl} alt="university" className="w-16 h-16 rounded-md object-contain" />
                              )}
                              <div>
                                <div className="text-sm text-gray-700">{certificate.university.name}</div>
                                <div className="text-xs text-gray-500">{certificate.university.address}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">Contact: {certificate.university.contactEmail}</div>
                            <div className="text-sm text-gray-700">Phone: {certificate.university.phone}</div>
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
