import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Modal, Spin } from 'antd';
import { Link } from 'react-router-dom';
import {
  ProjectOutlined,
  LineChartOutlined,
  DollarOutlined,
  WalletOutlined,
  PictureOutlined,
  CalendarOutlined,
  MessageOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  FileOutlined,
  QuestionCircleOutlined,
  MailOutlined,
  StarOutlined,
  BellOutlined,
  GlobalOutlined,
  SearchOutlined,
  FullscreenOutlined,
  BulbOutlined,
  SettingOutlined,
  LogoutOutlined,
  AppstoreAddOutlined,
  VideoCameraOutlined,
  UserOutlined,
  HomeOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import './app-layout.css';
import { UserHelpService } from '../../../libs/shared-services/src/authentication/user-help-service';

const { Header, Sider, Content, Footer } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState<any>(null); // State to store user data
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false); // Modal visibility state
  const userService = new UserHelpService();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const response = await userService.getUserById(userId);
          setUserData(response.data);
        } else {
          console.error('User ID not found in localStorage');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logoutUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found in localStorage');
      }

      console.log('Logging out user:', userId); // Debugging
      const response = await userService.logoutUser(userId);
      console.log('Logout API Response:', response); // Debugging API response

      // Clear local storage and redirect
      localStorage.removeItem('userId');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoClick: React.MouseEventHandler<HTMLDivElement> = () => {
    console.log("Logo Clicked");
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  return (
    <Layout className="app-layout">
      {/* Header */}
      <Header className="header">
        <div className="header-left">
          <div className="sidebar-logo" onClick={handleLogoClick}>
            <div className="logo-circle-f">IN</div>
            {!collapsed && <span className="logo-text-f">One</span>}
          </div>
        </div>
        <div className="header-right">
          <Button type="text" icon={<FullscreenOutlined />} className="header-icon" />
          <Button type="text" icon={<BulbOutlined />} className="header-icon" />
          <Button type="text" icon={<BellOutlined />} className="header-icon" />
          <Button type="text" icon={<LogoutOutlined />} className="header-icon" onClick={logoutUser} />
        </div>
      </Header>

      {/* Sidebar & Main Content */}
      <Layout>
        {/* Sidebar */}
        <Sider collapsed={collapsed} width={260} className="sidebar">
          <Menu mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<ProjectOutlined />}>
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<MessageOutlined />}>
              <Link to="/chat">Chat</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<FileOutlined />}>
              <Link to="/notes">Notes</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<CalendarOutlined />}>
              <Link to="/calendar">Calendar</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<BulbOutlined />}>
              <Link to="/ai-bot">AI Bot</Link>
            </Menu.Item>
            <Menu.Item key="6" icon={<TeamOutlined />}>
              <Link to="/community">Community</Link>
            </Menu.Item>
            <Menu.Item key="7" icon={<DollarOutlined />}>
              <Link to="/datiment">Entertainment</Link>
            </Menu.Item>
            <Menu.Item key="8" icon={<VideoCameraOutlined />}>
              <Link to="/videos">Videos</Link>
            </Menu.Item>
            <Menu.Item key="9" icon={<PictureOutlined />}>
              <Link to="/photos">Photos</Link>
            </Menu.Item>

            <Menu.Divider />

            <Menu.ItemGroup title="LATEST NEWS">
              <Menu.Item key="10" icon={<LineChartOutlined />}>
                <Link to="/latest-news">Latest News</Link>
              </Menu.Item>
              <Menu.Item key="11" icon={<GlobalOutlined />}>
                <Link to="/technology-news">Technology News</Link>
              </Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />

            <Menu.ItemGroup title="PLUGINS">
              <Menu.Item key="12" icon={<AppstoreAddOutlined />}>
                <Link to="/plugins">Plugins</Link>
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu>

          {/* Profile at Bottom */}
          <div className="sidebar-footer">
            {loading ? (
              <Spin size="small" />
            ) : (
              <>
                <div className="avatar-container" onClick={showModal}>
                  <Avatar src={userData?.profilePicture || "/profile.jpg"} size={40} />
                  {/* Green dot for online status */}
                  <div className="online-status-dot" />
                </div>
                {!collapsed && (
                  <div className="user-info">
                    <span className="username">{userData?.username || 'User Name'}</span>
                    <span className="email">{userData?.email || 'user@example.com'}</span>
                  </div>
                )}
              </>
            )}
          </div>

        </Sider>

        {/* Content & Footer */}
        <Layout className="content-layout">
          <Content className="content-container">{children}</Content>
          {/* <Footer className="footer">© 2025 In-One. All Rights Reserved.</Footer> */}
        </Layout>
      </Layout>

      {/* User Details Modal */}
      <Modal
        title={<div className="modal-title">User Details</div>}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        centered
        className="user-details-modal"
      >
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div className="user-details-container">
            <div className="user-detail-item">
              <UserOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{userData?.username || 'N/A'}</span>
              </div>
            </div>

            <div className="user-detail-item">
              <MailOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{userData?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="user-detail-item">
              <PhoneOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{userData?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="user-detail-item">
              <HomeOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{userData?.address || 'N/A'}</span>
              </div>
            </div>

            {/* Add any additional user details here following the same pattern */}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AppLayout;
