import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Award } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success('Password updated successfully. You can now login.');
      navigate('/login');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl" />
        <div className="absolute -right-24 top-28 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9)_0,_rgba(255,255,255,0.75)_40%,_rgba(255,255,255,1)_70%)]" />
      </div>

      <div className="relative w-full max-w-4xl grid gap-8 lg:grid-cols-2 items-center">
        <div className="hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-white transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
              <Award className="w-3.5 h-3.5" />
            </span>
            Home
          </Link>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
            Enter your reset code
          </h1>
          <p className="mt-4 text-slate-600 max-w-lg">
            Check your inbox for the 6-digit code we just sent you. It is valid for 5 minutes.
            Enter it below along with your new password.
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-lg font-bold text-slate-900">DiplomaVerif</p>
                  <p className="text-xs text-slate-500">Password reset</p>
                </div>
              </div>

              <Link to="/login" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                Back to login
              </Link>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Reset your password</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use the code from your email and choose a strong new password.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.com"
                required
              />

              <Input
                label="Reset code (OTP)"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                required
              />

              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />

              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

