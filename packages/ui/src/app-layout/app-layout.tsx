import React, { useState, useCallback } from 'react';
import { Layout, Button, Avatar, Modal, Spin, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ProjectOutlined,
  DashboardOutlined,
  MessageOutlined,
  FileOutlined,
  BulbOutlined,
  PoweroffOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  LineChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './app-layout.css';
import { UserHelpService } from '@in-one/shared-services';
import { UserIdRequestModel } from '@in-one/shared-models';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status?: string;
  role?: string;
}

const AppLayout: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('role') === 'admin';
  const userService = new UserHelpService();

  const logoutUser = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      await userService.logoutUser(new UserIdRequestModel(userId));
      localStorage.clear();
      window.dispatchEvent(new Event('storage'));
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate, userService]);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      // const response = await userService.getUserProfile(new UserIdRequestModel(userId));
      // setUser(response);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userService]);

  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
    if (!user) {
      fetchUserProfile();
    }
  };

  const navItems = [
    { key: '1', icon: <ProjectOutlined />, label: 'Home', path: '/home' },
    { key: '2', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboard', adminOnly: true },
    { key: '3', icon: <MessageOutlined />, label: 'Messages', path: '/chat' },
    { key: '4', icon: <FileOutlined />, label: 'Notes', path: '/notes' },
    { key: '5', icon: <BulbOutlined />, label: 'AI Assistant', path: '/ai-bot' },
    { key: '6', icon: <VideoCameraOutlined />, label: 'Video Hub', path: '/videos' },
    { key: '7', icon: <PictureOutlined />, label: 'Photo Feed', path: '/photos' },
    { key: '8', icon: <LineChartOutlined />, label: 'News Feed', path: '/news' },
  ];

  return (
    <Layout className="app-layout">
      {/* Header */}
      <motion.header
        className="custom-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-container" onClick={() => setIsNavOpen(!isNavOpen)}>
          <div className="header-circle">IN</div>
          <Title level={3} className="header-title">
            One
          </Title>
        </div>

        <div className="header-actions">
          {/* <Avatar
            size={32}
            icon={<UserOutlined />}
            src={user?.profilePicture}
            className="profile-icon"
            onClick={handleProfileClick}
            style={{ 
              lineHeight: '32px',
            }}
          /> */}
          <Button
            icon={<PoweroffOutlined style={{ fontSize: '20px' }} />}
            onClick={(e) => {
              e.stopPropagation();
              logoutUser();
            }}
            loading={isLoggingOut}
            className="logout-button"
            style={{ 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 0,
              borderRadius: '50%',
            }}
          >
            {isLoggingOut ? '' : ''}
          </Button>
        </div>
      </motion.header>

      {/* Sidebar / Mobile Nav */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.nav
            className="side-nav"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <div className="nav-items">
              {navItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="nav-link"
                    onClick={() => setIsNavOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Content */}
      <Content className={`content-container ${isNavOpen ? 'nav-open' : ''}`}>
        {loading ? <Spin size="large" /> : <Outlet />}
      </Content>

      {/* Footer */}
      <Footer className="custom-footer">
        <Text className="footer-text">
          © {new Date().getFullYear()} InOne. All rights reserved.
        </Text>
      </Footer>

      {/* Profile Modal */}
      <Modal
        open={isProfileModalVisible}
        title={<Title level={4}>User Profile</Title>}
        onCancel={() => setIsProfileModalVisible(false)}
        centered
        className="profile-modal"
        footer={null}
      >
        {user ? (
          <div className="profile-content">
            <Avatar size={100} src={user.profilePicture} icon={<UserOutlined />} />
            <Text strong>{user.username}</Text>
            <Text type="secondary">{user.email}</Text>
            <div>
              <Text>Status: {user.status || 'Active'}</Text>
              <br />
              <Text>Role: {user.role || 'User'}</Text>
            </div>
          </div>
        ) : (
          <Spin tip="Loading profile..." />
        )}
      </Modal>
    </Layout>
  );
};

export default AppLayout;