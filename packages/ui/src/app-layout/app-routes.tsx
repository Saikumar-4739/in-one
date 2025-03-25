import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./app-layout";
import LoginPage from "../components/pages/authentication/login-page";
import HomePage from "./home-page";
import ChatPage from "../components/pages/chat-groups/chat-page";
import NotesPage from "../components/pages/note-calender/notes-page";
import CalendarPage from "../components/pages/note-calender/calender-page";
import VideosPage, { VideoDetail } from "../components/pages/entertainment/videos-page";
import PhotosPage from "../components/pages/entertainment/photos-page";
import NewsPage from "../components/pages/news-media/news-page";
import PluginsPage from "../components/pages/plugins/plugin-page";
import AIBotPage from "../components/pages/artificial-intelligence/ai-bot-page";


const ProtectedRoute: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    // Listen for authentication state changes
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
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
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/ai-bot" element={<AIBotPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/latest-news" element={<NewsPage />} />
          <Route path="/plugins" element={<PluginsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/video/:id" element={<VideoDetail />} />
        </Route>
      </Route>

      {/* Catch-all Route */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;