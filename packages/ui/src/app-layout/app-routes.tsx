import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./app-layout";
import LoginPage from "../components/pages/authentication/login-page";
import HomePage from "./home-page";
import UserDashboard from "../components/pages/dashboard/user-dashboard";
import ChatPage from "../components/pages/chat-groups/chat-page";
import GroupsPage from "../components/pages/chat-groups/groups-page";
import NotesPage from "../components/pages/note-calender/notes-page";
import CalendarPage from "../components/pages/note-calender/calender-page";
import VideosPage from "../components/pages/entertainment/videos-page";
import PhotosPage from "../components/pages/entertainment/photos-page";
import ReelsPage from "../components/pages/entertainment/reels-page";
import NewsPage from "../components/pages/news-media/news-page";
import TechNewsPage from "../components/pages/news-media/tech-news-page";
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
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} 
      />

      {/* Protected Routes (Requires Authentication) */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/ai-bot" element={<AIBotPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/latest-news" element={<NewsPage />} />
          <Route path="/technology-news" element={<TechNewsPage />} />
          <Route path="/plugins" element={<PluginsPage />} />
          {/* Keeping the original home page route */}
          <Route path="/home" element={<HomePage />} />
        </Route>
      </Route>

      {/* Catch-all Route */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;