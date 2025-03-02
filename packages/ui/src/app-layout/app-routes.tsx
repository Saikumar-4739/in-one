import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './app-layout';
import About from '../components/pages/layout-pages/about-page';
import Home from '../components/pages/layout-pages/home-page';
import Profile from '../components/pages/layout-pages/profile-page';
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
      {isAuthenticated ? (
        <>
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          <Route path="/about" element={<AppLayout><About /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
        </>
      ) : (
        // Redirect unauthorized users to login
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
};

export default AppRoutes;