import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './app-layout';
import LoginPage from '../components/pages/authentication/login-page';
import ChatPage from '../components/pages/chat-groups/chat-page';

const AppRoutes: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<AppLayout children={<ChatPage />} />} />

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