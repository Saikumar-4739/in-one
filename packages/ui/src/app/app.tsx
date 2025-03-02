import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../app-layout/app-routes';
import { ConfigProvider, theme, Button } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          // You can change more theme tokens here, e.g., primary color, text color, etc.
        },
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <BrowserRouter> 
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
