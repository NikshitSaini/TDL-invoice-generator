import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Dashboard from './pages/Dashboard';
import OnboardingModal from './components/OnboardingModal';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <ConfigProvider>
          <Toaster position="top-center" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public View Route */}
            <Route path="/:id" element={<InvoiceDetail />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <PrivateRoute>
                  <Invoices />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/invoices/create" 
              element={
                <PrivateRoute>
                  <CreateInvoice />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/invoices/:id" 
              element={
                <PrivateRoute>
                  <InvoiceDetail />
                </PrivateRoute>
              } 
            />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
