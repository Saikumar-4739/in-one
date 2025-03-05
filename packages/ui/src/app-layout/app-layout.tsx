import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link } from 'react-router-dom';
import { ProjectOutlined, LineChartOutlined, DollarOutlined, PictureOutlined, CalendarOutlined, MessageOutlined, FileOutlined, BulbOutlined, BellOutlined, LogoutOutlined, AppstoreAddOutlined, VideoCameraOutlined, GlobalOutlined,FullscreenOutlined,} from '@ant-design/icons';
import './app-layout.css';
import { UserHelpService } from '@in-one/shared-services';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const userService = new UserHelpService();

  const logoutUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found in localStorage');
      await userService.logoutUser(userId);
      localStorage.removeItem('userId');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Layout className="app-layout">
      <Header className="header">
        <div className="header-left">
          <div className="sidebar-logo" onClick={() => console.log('Logo Clicked')}>
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

      <Layout>
        <Sider collapsed={collapsed} width={260} className="sidebar">
          <Menu mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Divider />
            <Menu.Item key="1" icon={<ProjectOutlined />}><Link to="/dashboard">Dashboard</Link></Menu.Item>
            <Menu.Divider />

            <Menu.ItemGroup title="CHAT & GROUPS">
              <Menu.Item key="2" icon={<MessageOutlined />}><Link to="/chat">Chat</Link></Menu.Item>
              <Menu.Item key="3" icon={<MessageOutlined />}><Link to="/chat">Groups</Link></Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup title="NOTES & CALENDAR">
              <Menu.Item key="4" icon={<FileOutlined />}><Link to="/notes">Notes</Link></Menu.Item>
              <Menu.Item key="5" icon={<CalendarOutlined />}><Link to="/calendar">Calendar</Link></Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup title="ARTIFICIAL INTELLIGENCE">
              <Menu.Item key="6" icon={<BulbOutlined />}><Link to="/ai-bot">AI Bot</Link></Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup title="ENTERTAINMENT">
              <Menu.Item key="7" icon={<VideoCameraOutlined />}><Link to="/videos">Videos</Link></Menu.Item>
              <Menu.Item key="8" icon={<PictureOutlined />}><Link to="/photos">Photos</Link></Menu.Item>
              <Menu.Item key="9" icon={<DollarOutlined />}><Link to="/reels">Reels</Link></Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup title="NEWS & MEDIA">
              <Menu.Item key="10" icon={<LineChartOutlined />}><Link to="/latest-news">Latest News</Link></Menu.Item>
              <Menu.Item key="11" icon={<GlobalOutlined />}><Link to="/technology-news">Technology News</Link></Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup title="PLUGINS">
              <Menu.Item key="12" icon={<AppstoreAddOutlined />}><Link to="/plugins">Plugins</Link></Menu.Item>
            </Menu.ItemGroup>
          </Menu>
        </Sider>

        <Layout className="content-layout">
          <Content className="content-container">{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
