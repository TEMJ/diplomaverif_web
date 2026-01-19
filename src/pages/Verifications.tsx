import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { Verification, Role } from '../types';
import { useAuth } from '../context/AuthContext';

export const Verifications: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, [user]);

  const fetchVerifications = async () => {
    try {
      const params: Record<string, any> = {};
      
      // Filter by university if user is UNIVERSITY role
      if (user?.role === Role.UNIVERSITY && user.universityId) {
        params.universityId = user.universityId;
      }
      // ADMIN sees all verifications (no filter)

      const response = await axios.get('/verifications', { params });
      setVerifications(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Company Name', accessor: 'companyName' as keyof Verification },
    { header: 'Email', accessor: 'email' as keyof Verification },
    { header: 'Reason', accessor: 'reason' as keyof Verification },
    {
      header: 'Date',
      accessor: ((row: Verification) =>
        new Date(row.verificationDate).toLocaleString()) as (row: Verification) => React.ReactNode,
    },
    // { header: 'IP Address', accessor: 'ipAddress' as keyof Verification },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Verifications</h1>
      </div>

      <Card>
        <Table columns={columns} data={verifications} loading={loading} />
      </Card>
    </div>
  );
};
