import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./app-layout";
import LoginPage from "../components/pages/authentication/login-page";
import HomePage from "../components/pages/home-page/home-page";
import ChatPage from "../components/pages/chat-groups/chat-page";
import NotesPage from "../components/pages/note-page/notes-page";
import VideosPage, { VideoDetail } from "../components/pages/videos-page/videos-page";
import Chatbot from "../components/pages/ai-bot-page/ai-bot-page";
import PhotosPage from "../components/pages/photos-page/photos-page";
import DashboardPage from "./dashboard";
import NewsPageMain from "../components/pages/news-media/news-page-view";


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
          <Route path="/ai-bot" element={<Chatbot />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/news" element={<NewsPageMain />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
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
