// React import not required with the new JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Universities } from './pages/Universities';
import { Students } from './pages/Students';
import { Certificates } from './pages/Certificates';
import { Verifications } from './pages/Verifications';
import { StudentRecords } from './pages/StudentRecords';
import { VerifyCertificate } from './pages/VerifyCertificate';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          {/* Support direct links from QR codes like /verify/:qrHash */}
          <Route path="/verify/:qrHash" element={<VerifyCertificate />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/universities"
            element={
              <ProtectedRoute>
                <Layout>
                  <Universities />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <Layout>
                  <Certificates />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/verifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Verifications />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-records"
            element={
              <ProtectedRoute>
                <Layout>
                  <StudentRecords />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
