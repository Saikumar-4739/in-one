import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Statistic, message, Button } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import {
  MessageOutlined,
  TeamOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { ChatHelpService, NotesCalenderHelpService, VideoHelpService, PhotoHelpService, NewsHelpService } from '@in-one/shared-services';


// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const { Title, Text } = Typography;

const UserDashboard: React.FC = () => {
  const [userId] = useState<string | null>(() => localStorage.getItem('username') || null);
  const [chatStats, setChatStats] = useState({ messages: 0, rooms: 0 });
  const [notesStats, setNotesStats] = useState({ notes: 0, events: 0 });
  const [mediaStats, setMediaStats] = useState({ videos: 0, photos: 0 });
  const [newsStats, setNewsStats] = useState({ articles: 0, comments: 0 });
  const chatService = new ChatHelpService();
  const notesService = new NotesCalenderHelpService();
  const videoService = new VideoHelpService();
  const photoService = new PhotoHelpService();
  const newsService = new NewsHelpService();

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // Chat Stats
      const chatRoomsRes = await chatService.getChatRooms({ userId: userId! });
      const privateMsgRes = await chatService.getAllUsers(); // Assuming this could fetch message count indirectly
      if (chatRoomsRes.status && privateMsgRes.status) {
        setChatStats({
          messages: privateMsgRes.data.length * 5, // Mock message count
          rooms: chatRoomsRes.data.length,
        });
      }

      // Notes and Calendar Stats
      const notesRes = await notesService.countUserNotes(userId!);
      const calendarsRes = await notesService.getAllCalendars(userId!);
      if (notesRes.status && calendarsRes.status) {
        setNotesStats({
          notes: notesRes.data.count || 0,
          events: calendarsRes.data.reduce((sum: number, cal: any) => sum + (cal.events?.length || 0), 0),
        });
      }

      // Media Stats
      const videosRes = await videoService.getAllVideos();
      const photosRes = await photoService.getAllPhotos();
      if (videosRes.status && photosRes.status) {
        setMediaStats({
          videos: videosRes.data.length,
          photos: photosRes.data.length,
        });
      }

      // News Stats
      const newsRes = await newsService.getAllNews(1, 10);
      if (newsRes.status) {
        const articles = newsRes.data.news || newsRes.data;
        setNewsStats({
          articles: articles.length,
          comments: articles.reduce((sum: number, article: any) => sum + (article.comments?.length || 0), 0),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    }
  };

  const chartData = {
    labels: ['Messages', 'Rooms', 'Notes', 'Events', 'Videos', 'Photos', 'News', 'Comments'],
    datasets: [
      {
        label: 'Activity',
        data: [
          chatStats.messages,
          chatStats.rooms,
          notesStats.notes,
          notesStats.events,
          mediaStats.videos,
          mediaStats.photos,
          newsStats.articles,
          newsStats.comments,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Your App Activity' },
    },
  };

  if (!userId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Title level={3}>Please log in to view your dashboard</Title>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#fff',
        overflow: 'auto',
        scrollbarWidth: 'none'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: '20px' }}>
          Dashboard
        </Title>
        <Text>Welcome back, {userId}! Here’s your app overview.</Text>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <Statistic
                  title="Messages"
                  value={chatStats.messages}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <Statistic
                  title="Groups"
                  value={chatStats.rooms}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <Statistic
                  title="Notes"
                  value={notesStats.notes}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <Statistic
                  title="Events"
                  value={notesStats.events}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <Statistic
                  title="Videos"
                  value={mediaStats.videos}
                  prefix={<VideoCameraOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <Statistic
                  title="Photos"
                  value={mediaStats.photos}
                  prefix={<PictureOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <Statistic
                  title="News Articles"
                  value={newsStats.articles}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fadb14' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card>
                <Statistic
                  title="AI Bot Queries"
                  value={0} // Placeholder; add service if available
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#d4380d' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Activity Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{ marginTop: '20px' }}
        >
          <Card title="Activity Overview">
            <Bar data={chartData} options={chartOptions} />
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <Space style={{ marginTop: '20px' }}>
          <Button type="primary" onClick={() => window.location.href = '/chat'}>Go to Chat</Button>
          <Button type="primary" onClick={() => window.location.href = '/groups'}>Go to Groups</Button>
          <Button type="primary" onClick={() => window.location.href = '/calendar'}>Go to Calendar</Button>
        </Space>
      </div>
    </div>
  );
};

export default UserDashboard;