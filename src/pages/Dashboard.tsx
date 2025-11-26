import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import axios from '../lib/axios';
import { Role } from '../types';
import { Building2, Users, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Stats {
  universities?: number;
  students?: number;
  certificates?: number;
  verifications?: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const requests = [];
      const params: Record<string, any> = {};
      
      // Prepare requests based on role
      if (user?.role === Role.ADMIN) {
        requests.push(
          axios.get('/universities').then(res => ({ key: 'universities', data: res.data })),
          axios.get('/students').then(res => ({ key: 'students', data: res.data }))
        );
      } else if (user?.role === Role.UNIVERSITY && user.universityId) {
        params.universityId = user.universityId;
        requests.push(
          axios.get('/students', { params }).then(res => ({ key: 'students', data: res.data }))
        );
      }

      // Always fetch certificates and verifications
      requests.push(
        axios.get('/certificates', { params }).then(res => ({ key: 'certificates', data: res.data })),
        axios.get('/verifications', { params }).then(res => ({ key: 'verifications', data: res.data }))
      );

      // Wait for all requests and process results
      const results = await Promise.all(requests);
      
      // Initialize new stats
      const newStats: Stats = {
        universities: 0,
        students: 0,
        certificates: 0,
        verifications: 0
      };

      // Process each result
      results.forEach(result => {
        const count = result.data?.data?.length ?? result.data?.length ?? 0;
        newStats[result.key as keyof Stats] = count;
      });

      console.log('Fetched stats:', newStats); // For debugging
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Universities',
      value: stats.universities,
      icon: Building2,
      color: 'bg-blue-500',
      show: user?.role === Role.ADMIN,
    },
    {
      title: 'Students',
      value: stats.students,
      icon: Users,
      color: 'bg-green-500',
      show: user?.role === Role.ADMIN || user?.role === Role.UNIVERSITY,
    },
    {
      title: 'Certificates',
      value: stats.certificates,
      icon: Award,
      color: 'bg-yellow-500',
      show: true,
    },
    {
      title: 'Verifications',
      value: stats.verifications,
      icon: CheckCircle,
      color: 'bg-purple-500',
      show: user?.role === Role.ADMIN || user?.role === Role.UNIVERSITY,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <Card key={card.title}>
              <div className="flex items-center justify-between">
                <div className={`${card.color} p-3 rounded-full`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          ))}
      </div>

      <Card title="Welcome to DiplomaVerif">
        <p className="text-gray-600">
          {user?.role === Role.ADMIN &&
            'As an administrator, you have full access to manage universities, students, certificates, and verifications.'}
          {user?.role === Role.UNIVERSITY &&
            'As a university, you can manage your students, issue certificates, and view verifications.'}
          {user?.role === Role.STUDENT &&
            'As a student, you can view your certificates and academic records.'}
        </p>
      </Card>
    </div>
  );
};
