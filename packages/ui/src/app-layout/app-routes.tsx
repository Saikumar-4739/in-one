// src/app-layout/app-routes.tsx
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import AppLayout from './app-layout';
import LoginPage from '../components/pages/authentication/login-page';
import HomePage from '../components/pages/home-page/home-page';
import ChatPage from '../components/pages/chat-groups/chat-page';
import NotesPage from '../components/pages/note-page/notes-page';
import VideosPage, { VideoDetail } from '../components/pages/videos-page/videos-page';
import NewsPage from '../components/pages/news-media/news-page';
import Chatbot from '../components/pages/ai-bot-page/ai-bot-page';
import PhotosPage from '../components/pages/photos-page/photos-page';

const ProtectedRoute: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<AppLayout />}>
          {/* Core Features */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/ai-bot" element={<Chatbot />} />
          {/* Media */}
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/photos" element={<PhotosPage />} />
          {/* News */}
          <Route path="/news" element={<NewsPage />} />
          {/* Social Settings */}
          {/* Catch-all for protected routes */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Route>
      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
    </Routes>
  );
};

export default AppRoutes;
