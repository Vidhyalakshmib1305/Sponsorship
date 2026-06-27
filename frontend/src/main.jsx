// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { AuthProvider, useAuth } from './hooks/useAuth';
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard  from './pages/Dashboard';
import Pitches    from './pages/Pitches';
import Brands     from './pages/Brands';
import Settings   from './pages/Settings';
import Layout     from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0005] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing */}
          <Route path="/"       element={<Landing />} />
          <Route path="/login"  element={<Login />} />

          {/* Protected onboarding */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Protected app — all nested routes live under /app */}
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index              element={<Dashboard />} />
            <Route path="pitches"     element={<Pitches />} />
            <Route path="brands"      element={<Brands />} />
            <Route path="settings"    element={<Settings />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
