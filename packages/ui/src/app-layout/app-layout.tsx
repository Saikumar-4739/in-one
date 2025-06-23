import React, { useState, useCallback } from 'react';
import { Layout, Button, Avatar, Modal, Spin, Typography, Divider, Tag } from 'antd';
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
  TikTokOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  PhoneOutlined,
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
  isEmailVerified: boolean;
  profilePicture: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string; 
  isActive: boolean;
  role: 'admin' | 'user' | 'moderator' | 'guest';
  bio: string | null;
  phoneNumber: string | null;
  address: string | null;
  dateOfBirth: string | null; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt: string | null; // ISO date string
  resetPasswordExpires: string | null; // ISO date string
  coverPhoto ?: string | null;
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
      const response = await userService.getUserById(new UserIdRequestModel(userId));
      setUser(response.data);
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
    { key: '8', icon: <TikTokOutlined />, label: 'Music Player', path: '/music' },
    { key: '9', icon: <LineChartOutlined />, label: 'News Feed', path: '/news' },
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
          <Avatar
            size={32}
            icon={<UserOutlined />}
            src={user?.profilePicture}
            className="profile-icon"
            onClick={handleProfileClick}
            style={{
              lineHeight: '32px',
            }}
          />
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
        onCancel={() => setIsProfileModalVisible(false)}
        className="profile-modal"
        footer={null}
        width={400}
        centered
      >
        {user ? (
          <div className="profile-content">
            <div className="avatar-section" style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={120}
                src={user.profilePicture}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#1890ff',
                  fontSize: 48,
                  marginBottom: 16
                }}
              />
              <Typography.Title level={4} style={{ margin: 0 }}>
                {user.username}
              </Typography.Title>
              <Tag
                color={user.status === 'online' ? '#52c41a' : '#f5222d'}
                style={{ marginTop: 8 }}
              >
                {user.status || 'offline'}
              </Tag>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div className="user-details">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <MailOutlined style={{ color: '#1890ff', fontSize: 18, marginRight: 12 }} />
                <Text>{user.email}</Text>
                {user.isEmailVerified && (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <CrownOutlined style={{ color: '#faad14', fontSize: 18, marginRight: 12 }} />
                <Text>Role: {user.role || 'User'}</Text>
              </div>

              {user && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <PhoneOutlined style={{ color: '#13c2c2', fontSize: 18, marginRight: 12 }} />
                  <Text>{user.phoneNumber}</Text>
                </div>
              )}

              {user.bio && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    <EditOutlined style={{ marginRight: 8 }} />
                    About
                  </Text>
                  <Text type="secondary" style={{ paddingLeft: 24 }}>
                    {user.bio}
                  </Text>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
              tip="Loading profile..."
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AppLayout;