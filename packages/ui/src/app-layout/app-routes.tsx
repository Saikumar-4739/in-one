import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './app-layout';
import LoginPage from '../components/pages/authentication/login-page';

const AppRoutes: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  ); // Check authentication status

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route path="/" element={
        isAuthenticated ? 
          <AppLayout children={undefined} /> : 
          <Navigate to="/login" />
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

export default AppRoutes;