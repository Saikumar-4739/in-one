import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './app-layout';
import About from '../components/pages/layout-pages/about-page';
import Home from '../components/pages/layout-pages/home-page';
import Profile from '../components/pages/layout-pages/profile-page';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/about" element={<AppLayout><About /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
    </Routes>
  );
};

export default AppRoutes;
