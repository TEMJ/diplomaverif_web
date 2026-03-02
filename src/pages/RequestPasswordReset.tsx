import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Award } from 'lucide-react';

export const RequestPasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await axios.post('/auth/request-password-reset', { email });
      toast.success('Reset code sent to your email (valid 5 minutes).');
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send reset code');
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
            Forgot your password?
          </h1>
          <p className="mt-4 text-slate-600 max-w-lg">
            Enter the email associated with your DiplomaVerif account. We will send you a one-time
            code to reset your password. The code is valid for 5 minutes.
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

            <h2 className="text-2xl font-bold text-slate-900">Request reset code</h2>
            <p className="mt-1 text-sm text-slate-600">
              We will send a 6-digit code to your email address.
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

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send reset code'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

