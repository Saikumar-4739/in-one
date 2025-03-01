import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link } from 'react-router-dom';
import { LoginOutlined, UserOutlined, MessageOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import './app-layout.css';

const { Header, Content, Sider, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header className="header">
        <div className="toggle-icon">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ color: '#F5F5F5', fontSize: '18px' }} // Make sure the icon is white
          />
          <span className="logo-text">IN-ONE</span>
        </div>

        <div className="header-actions">
          <Button
            type="text"
            icon={<UserOutlined />}
            className="header-icon"
            style={{ marginLeft: 16, color: '#F5F5F5' }} // White icon for user
          />
          <Button
            type="text"
            icon={<SettingOutlined />}
            className="header-icon"
            style={{ marginLeft: 16, color: '#F5F5F5' }} // White icon for settings
          />
        </div>
      </Header>


      {/* Sidebar */}
      <Layout>
        <Sider
          width={250}
          className="sidebar"
          collapsible
          collapsed={collapsed}
          onCollapse={toggleSidebar}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            className="sidebar-menu"
          >
            <Menu.Item key="1" icon={<MessageOutlined />} style={{ color: '#000000' }}>
              <Link to="/">Chat</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />} style={{ color: '#000000' }}>
              <Link to="/profile">Profile</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<SettingOutlined />} style={{ color: '#000000' }}>
              <Link to="/settings">Settings</Link>
            </Menu.Item>
          </Menu>
        </Sider>

        {/* Content Area */}
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#FFFFFF', // Light Grey background for content
            }}
          >
            {children}
          </Content>
          <Footer style={{ textAlign: 'center', background: '#FFFFFF' }}>
            © 2025 In-One. All Rights Reserved.
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
