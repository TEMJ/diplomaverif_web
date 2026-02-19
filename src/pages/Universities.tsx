import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { University } from '../types';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';

interface UniversityFormData {
  name: string;
  address: string;
  contactEmail: string;
  phone: string;
  ukprn: string;
  registrarName: string;
  logoFile: File | null;
  logoPreview: string;
  sealFile: File | null;
  sealPreview: string;
  signatureFile: File | null;
  signaturePreview: string;
}

export const Universities: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<UniversityFormData>({
    name: '',
    address: '',
    contactEmail: '',
    phone: '',
    ukprn: '',
    registrarName: '',
    logoFile: null,
    logoPreview: '',
    sealFile: null,
    sealPreview: '',
    signatureFile: null,
    signaturePreview: '',
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Instant (debounced) search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUniversities();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchUniversities = async () => {
    try {
      const params: Record<string, any> = { limit: 1000 };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const response = await axios.get('/universities', { params });
      setUniversities(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (university?: University) => {
    if (university) {
      setEditingUniversity(university);
      setFormData({
        name: university.name,
        address: university.address,
        contactEmail: university.contactEmail,
        phone: university.phone,
        ukprn: university.ukprn || '',
        registrarName: university.registrarName || '',
        logoFile: null,
        logoPreview: university.logoUrl || '',
        sealFile: null,
        sealPreview: university.officialSealUrl || '',
        signatureFile: null,
        signaturePreview: university.signatureUrl || '',
      });
    } else {
      setEditingUniversity(null);
      setFormData({
        name: '',
        address: '',
        contactEmail: '',
        phone: '',
        ukprn: '',
        registrarName: '',
        logoFile: null,
        logoPreview: '',
        sealFile: null,
        sealPreview: '',
        signatureFile: null,
        signaturePreview: '',
      });
    }
    setIsModalOpen(true);
  };

  const validateFile = (file: File, fieldName: string): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`${fieldName}: Only JPG and PNG images are allowed`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${fieldName}: File size must be less than 5MB`);
      return false;
    }
    return true;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldType: 'logo' | 'seal' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      if (fieldType === 'logo') {
        setFormData({ ...formData, logoFile: file, logoPreview: preview });
      } else if (fieldType === 'seal') {
        setFormData({ ...formData, sealFile: file, sealPreview: preview });
      } else if (fieldType === 'signature') {
        setFormData({ ...formData, signatureFile: file, signaturePreview: preview });
      }
    };
    reader.readAsDataURL(file);
  };

  const clearFile = (fieldType: 'logo' | 'seal' | 'signature') => {
    if (fieldType === 'logo') {
      setFormData({ ...formData, logoFile: null, logoPreview: '' });
    } else if (fieldType === 'seal') {
      setFormData({ ...formData, sealFile: null, sealPreview: '' });
    } else if (fieldType === 'signature') {
      setFormData({ ...formData, signatureFile: null, signaturePreview: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name?.trim() || '';
    const address = formData.address?.trim() || '';
    const contactEmail = formData.contactEmail?.trim() || '';
    const phone = formData.phone?.trim() || '';

    if (!name || !address || !contactEmail || !phone) {
      toast.error('Name, address, email and phone are required');
      return;
    }

    setIsSubmitting(true);

    try {
      let universityId: string;

      if (editingUniversity) {
        // UPDATE: Keep existing behavior (JSON + separate file uploads)
        universityId = editingUniversity.id;
        const payload = {
          name,
          address,
          contactEmail,
          phone,
          ukprn: formData.ukprn?.trim() || '',
          registrarName: formData.registrarName?.trim() || '',
        };

        await axios.put(`/universities/${universityId}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        toast.success('University updated successfully');

        // Upload files separately if any are present
        if (formData.logoFile) {
          const logoForm = new FormData();
          logoForm.append('logo', formData.logoFile);
          await axios.put(`/universities/${universityId}/logo`, logoForm);
        }
        if (formData.sealFile) {
          const sealForm = new FormData();
          sealForm.append('seal', formData.sealFile);
          await axios.put(`/universities/${universityId}/seal`, sealForm);
        }
        if (formData.signatureFile) {
          const sigForm = new FormData();
          sigForm.append('signature', formData.signatureFile);
          await axios.put(`/universities/${universityId}/signature`, sigForm);
        }
      } else {
        // CREATE: Use multipart/form-data with all data and files in one request
        const formDataToSend = new FormData();
        
        // Text fields
        formDataToSend.append('name', name);
        formDataToSend.append('address', address);
        formDataToSend.append('contactEmail', contactEmail);
        formDataToSend.append('phone', phone);
        
        if (formData.ukprn?.trim()) {
          formDataToSend.append('ukprn', formData.ukprn.trim());
        }
        if (formData.registrarName?.trim()) {
          formDataToSend.append('registrarName', formData.registrarName.trim());
        }

        // Files (optional - can create university without files)
        if (formData.logoFile) {
          formDataToSend.append('logo', formData.logoFile);
        }
        if (formData.sealFile) {
          formDataToSend.append('seal', formData.sealFile);
        }
        if (formData.signatureFile) {
          formDataToSend.append('signature', formData.signatureFile);
        }

        // POST with FormData - axios will automatically set Content-Type with boundary
        // Do NOT set Content-Type header manually - browser will set it correctly
        const res = await axios.post('/universities', formDataToSend);
        universityId = res.data.data?.id || res.data.id;
        toast.success('University created successfully');
      }

      setIsModalOpen(false);
      fetchUniversities();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      console.error('Submission error:', err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text: string | null | undefined): React.ReactNode => {
    const term = searchTerm.trim();
    if (!text) return '';
    if (!term) return text;

    // Support multi-word searches by highlighting each token independently
    const tokens = term.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return text;

    const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
    const lowerTokens = sortedTokens.map((t) => t.toLowerCase());

    const regex = new RegExp(`(${sortedTokens.map(escapeRegExp).join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, idx) => {
          const isMatch = lowerTokens.includes(part.toLowerCase());
          return isMatch ? (
            <span key={idx} className="bg-yellow-200 font-semibold">
              {part}
            </span>
          ) : (
            <React.Fragment key={idx}>{part}</React.Fragment>
          );
        })}
      </span>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;

    try {
      await axios.delete(`/universities/${id}`);
      toast.success('University deleted successfully');
      fetchUniversities();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: ((row: University) => highlightText(row.name)) as (
        row: University
      ) => React.ReactNode,
    },
    {
      header: 'Address',
      accessor: ((row: University) => highlightText(row.address)) as (
        row: University
      ) => React.ReactNode,
    },
    {
      header: 'Email',
      accessor: ((row: University) => highlightText(row.contactEmail)) as (
        row: University
      ) => React.ReactNode,
    },
    {
      header: 'Phone',
      accessor: ((row: University) => highlightText(row.phone)) as (
        row: University
      ) => React.ReactNode,
    },
    {
      header: 'UKPRN',
      accessor: ((row: University) => highlightText(row.ukprn)) as (
        row: University
      ) => React.ReactNode,
    },
    {
      header: 'Actions',
      accessor: ((row: University) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )) as (row: University) => React.ReactNode,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add University
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Input
            label=""
            placeholder="Search by name or UKPRN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-0"
          />
        </div>
        <Table columns={columns} data={universities} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUniversity ? 'Edit University' : 'Add University'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <Input
                label="University Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <Input
                label="UKPRN (UK Provider Reference Number)"
                value={formData.ukprn}
                onChange={(e) => setFormData({ ...formData, ukprn: e.target.value })}
                required
                placeholder="e.g., 10000001"
              />
            </div>

            {/* Contact Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <Input
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            {/* Institutional Authority */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Institutional Authority</h3>
              <Input
                label="Registrar Name"
                value={formData.registrarName}
                onChange={(e) => setFormData({ ...formData, registrarName: e.target.value })}
                required
                placeholder="Full name of the signing authority"
              />
            </div>

            {/* Assets Upload Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Institutional Assets</h3>
              <p className="text-sm text-gray-600 mb-4">Maximum file size: 5MB. Allowed formats: JPG, PNG</p>

              {/* University Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University Logo <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, 'logo')}
                      />
                    </label>
                  </div>
                  {formData.logoPreview && (
                    <div className="relative">
                      <img
                        src={formData.logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => clearFile('logo')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Official Seal */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Official University Seal <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">PNG with transparency preferred for embossed stamp on certificate</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, 'seal')}
                      />
                    </label>
                  </div>
                  {formData.sealPreview && (
                    <div className="relative">
                      <img
                        src={formData.sealPreview}
                        alt="Seal preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => clearFile('seal')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Registrar Signature */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registrar Signature <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Scanned handwritten signature of {formData.registrarName || 'the registrar'}</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, 'signature')}
                      />
                    </label>
                  </div>
                  {formData.signaturePreview && (
                    <div className="relative">
                      <img
                        src={formData.signaturePreview}
                        alt="Signature preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => clearFile('signature')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingUniversity ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
