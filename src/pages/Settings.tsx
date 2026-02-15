import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Lock, Building2 } from 'lucide-react';
import { Role } from '../types';

interface UniversityFormData {
  name: string;
  address: string;
  contactEmail: string;
  phone: string;
  website: string;
  ukprn: string;
  registrarName: string;
}

const initialUniversityForm: UniversityFormData = {
  name: '',
  address: '',
  contactEmail: '',
  phone: '',
  website: '',
  ukprn: '',
  registrarName: '',
};

export const Settings: React.FC = () => {
  const { user, university, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});

  const [universityForm, setUniversityForm] = useState<UniversityFormData>(initialUniversityForm);
  const [universityLoading, setUniversityLoading] = useState(false);
  const [universityErrors, setUniversityErrors] = useState<Record<string, string>>({});

  const isUniversity = user?.role === Role.UNIVERSITY && university;

  useEffect(() => {
    if (university) {
      setUniversityForm({
        name: university.name ?? '',
        address: university.address ?? '',
        contactEmail: university.contactEmail ?? '',
        phone: university.phone ?? '',
        website: university.website ?? '',
        ukprn: university.ukprn ?? '',
        registrarName: university.registrarName ?? '',
      });
    }
  }, [university]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!currentPassword.trim()) e.currentPassword = 'Current password is required';
    if (!newPassword.trim()) e.newPassword = 'New password is required';
    else if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateUniversity = (): boolean => {
    const e: Record<string, string> = {};
    if (!universityForm.name.trim()) e.name = 'Name is required';
    if (!universityForm.address.trim()) e.address = 'Address is required';
    if (!universityForm.contactEmail.trim()) e.contactEmail = 'Contact email is required';
    if (!universityForm.phone.trim()) e.phone = 'Phone is required';
    setUniversityErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUniversity || !validateUniversity() || universityLoading) return;
    setUniversityLoading(true);
    setUniversityErrors({});
    try {
      await axios.put(`/universities/${university.id}`, {
        name: universityForm.name.trim(),
        address: universityForm.address.trim(),
        contactEmail: universityForm.contactEmail.trim(),
        phone: universityForm.phone.trim(),
        website: universityForm.website.trim() || undefined,
        ukprn: universityForm.ukprn.trim() || undefined,
        registrarName: universityForm.registrarName.trim() || undefined,
      });
      toast.success('University information updated successfully');
      await refreshUser();
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.response?.data?.error ?? 'Failed to update university';
      toast.error(message);
      setUniversityErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setUniversityLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    setErrors({});
    try {
      await axios.post('/auth/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.response?.data?.error ?? 'Failed to change password';
      toast.error(message);
      setErrors((prev) => ({ ...prev, currentPassword: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="flex flex-wrap gap-6 items-start">
      <Card
        title="Change password"
        className="flex-1 min-w-[280px] max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <Lock className="w-5 h-5" />
            <p className="text-sm">Update your password. You will need your current password.</p>
          </div>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
            error={errors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            error={errors.newPassword}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            error={errors.confirmPassword}
          />
          <div className="mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </Card>
      {isUniversity && (
        <Card title="University information" className="flex-1 min-w-[280px] max-w-2xl">
          <form onSubmit={handleUniversitySubmit} className="space-y-0">
            <div className="flex items-center gap-2 mb-4 text-gray-600">
              <Building2 className="w-5 h-5" />
              <p className="text-sm">Update your university details. Changes will be reflected in the navbar and across the app.</p>
            </div>
            {universityErrors.form && (
              <p className="text-red-500 text-sm mb-3">{universityErrors.form}</p>
            )}
            <Input
              label="University name"
              value={universityForm.name}
              onChange={(e) => setUniversityForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="University name"
              required
              error={universityErrors.name}
            />
            <Input
              label="Address"
              value={universityForm.address}
              onChange={(e) => setUniversityForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Full address"
              required
              error={universityErrors.address}
            />
            <Input
              label="Contact email"
              type="email"
              value={universityForm.contactEmail}
              onChange={(e) => setUniversityForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="contact@university.edu"
              required
              error={universityErrors.contactEmail}
            />
            <Input
              label="Phone"
              value={universityForm.phone}
              onChange={(e) => setUniversityForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
              required
              error={universityErrors.phone}
            />
            <Input
              label="Website"
              value={universityForm.website}
              onChange={(e) => setUniversityForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://www.university.edu"
              error={universityErrors.website}
            />
            <Input
              label="UKPRN (optional)"
              value={universityForm.ukprn}
              onChange={(e) => setUniversityForm((f) => ({ ...f, ukprn: e.target.value }))}
              placeholder="UK Provider Reference Number"
            />
            <Input
              label="Registrar name (optional)"
              value={universityForm.registrarName}
              onChange={(e) => setUniversityForm((f) => ({ ...f, registrarName: e.target.value }))}
              placeholder="Name of the registrar"
            />
            <div className="mt-4">
              <Button type="submit" disabled={universityLoading}>
                {universityLoading ? 'Saving…' : 'Save university information'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      
      </div>
    </div>
  );
};
