import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Button, Spin, Avatar, Modal, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ProjectOutlined,
  LineChartOutlined,
  PictureOutlined,
  CalendarOutlined,
  MessageOutlined,
  FileOutlined,
  BulbOutlined,
  PoweroffOutlined,
  AppstoreAddOutlined,
  VideoCameraOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './app-layout.css';
import { UserHelpService } from '@in-one/shared-services';
import { UserIdRequestModel } from '@in-one/shared-models';

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status?: string;
  role?: string;
}

const { Content } = Layout;
const { Title, Text } = Typography;

const AppLayout: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const userService = new UserHelpService();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutUser = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      console.log(userId, '............');
      if (!userId) throw new Error('User ID not found');
      const req = new UserIdRequestModel(userId);
      await userService.logoutUser(req);
      localStorage.clear();
      window.dispatchEvent(new Event('storage'));
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [navigate]);

  const navItems = [
    { key: '1', icon: <ProjectOutlined />, label: 'In Home', path: '/home' },
    { key: '2', icon: <MessageOutlined />, label: 'In Chat', path: '/chat' },
    { key: '4', icon: <FileOutlined />, label: 'In Notes', path: '/notes' },
    {
      key: '5',
      icon: <CalendarOutlined />,
      label: 'In Calendar',
      path: '/calendar',
    },
    { key: '6', icon: <BulbOutlined />, label: 'AI Bot', path: '/ai-bot' },
    {
      key: '7',
      icon: <VideoCameraOutlined />,
      label: 'In Stream',
      path: '/videos',
    },
    {
      key: '8',
      icon: <PictureOutlined />,
      label: 'InstaView',
      path: '/photos',
    },
    {
      key: '9',
      icon: <LineChartOutlined />,
      label: 'Insight 24x7',
      path: '/latest-news',
    },
    {
      key: '10',
      icon: <AppstoreAddOutlined />,
      label: 'Plugins',
      path: '/plugins',
    },
  ];

  const navVariants = {
    hidden: { x: '-100%', opacity: 0, skewX: '20deg' },
    visible: {
      x: 0,
      opacity: 1,
      skewX: '0deg',
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <Layout className="app-layout">
      <motion.div
        className="custom-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        onClick={() => setIsNavOpen(!isNavOpen)}
        whileHover={{ cursor: 'pointer' }}
      >
        <div className="header-container">
          <div className="header-circle">IN</div>
          <Title
            level={2}
            style={{ marginTop: '10px' }}
            className="header-title"
          >
            One
          </Title>
        </div>
        <div
          className="header-actions"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Button
            type="text"
            icon={<PoweroffOutlined style={{ color: '#8a2be2' }} />}
            onClick={(e) => {
              e.stopPropagation();
              logoutUser();
            }}
            style={{
              color: '#8a2be2',
              fontWeight: 'bold',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '4px 12px',
            }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            className="side-nav"
            variants={navVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="nav-items">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.key}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="nav-item"
                >
                  <Link to={item.path} onClick={() => setIsNavOpen(false)}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with dynamic margin */}
      <Content
        className="content-container"
        style={{
          marginLeft: isNavOpen ? '300px' : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {loading ? <Spin size="large" /> : <Outlet />}
      </Content>

      <Modal
        title={<Title level={4}>User Profile</Title>}
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        centered
      >
        {loading ? (
          <Spin tip="Loading user details..." />
        ) : user ? (
          <div style={{ textAlign: 'center' }}>
            <Avatar
              src={imageSrc}
              size={100}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Text strong style={{ display: 'block', fontSize: 18 }}>
              {user.username}
            </Text>
            <Text type="secondary">{user.email}</Text>
            <div style={{ marginTop: 16 }}>
              <Text>
                <strong>Status:</strong> {user.status || 'Active'}
              </Text>
              <br />
              <Text>
                <strong>Role:</strong> {user.role || 'User'}
              </Text>
            </div>
          </div>
        ) : (
          <Text type="danger">Unable to load user details.</Text>
        )}
      </Modal>
    </Layout>
  );
};

export default AppLayout;
