import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button } from 'antd';
import { motion } from 'framer-motion';
import { BulbOutlined, MessageOutlined, FileTextOutlined, VideoCameraOutlined, PictureOutlined, LineChartOutlined } from '@ant-design/icons';
import FeatureCard from './features-card';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.15 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const features = [
    { icon: <FileTextOutlined />, name: 'Notes', color: '#ff6b6b' },
    { icon: <LineChartOutlined />, name: 'News', color: '#4ecdc4' },
    { icon: <MessageOutlined />, name: 'Chat', color: '#45b7d1' },
    { icon: <BulbOutlined />, name: 'AI Bot', color: '#96ceb4' },
    { icon: <VideoCameraOutlined />, name: 'Videos', color: '#8a2be2' },
    { icon: <PictureOutlined />, name: 'Photos', color: '#333' },
  ];

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        backgroundColor: '#ffffff',
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          minHeight: '50vh',
          width: '100%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          borderRadius: '0 0 40% 40%',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            padding: 'clamp(16px, 4vw, 32px)',
            textAlign: 'center',
            maxWidth: '1200px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div variants={textVariants}>
            <Title
              style={{
                color: '#000',
                fontSize: 'clamp(50px, 8vw, 32px)',
                marginBottom: 'clamp(16px, 3vw, 32px)',
                fontWeight: 800,
                lineHeight: 1.2,
                fontFamily: "'Montserrat', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 'clamp(8px, 2vw, 12px)',
              }}
            >
              Welcome to Your
              <span
                style={{
                  width: 'clamp(40px, 12vw, 60px)',
                  height: 'clamp(40px, 12vw, 60px)',
                  background: '#8a2be2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 'clamp(25px, 4vw, 24px)',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                IN
              </span>
              One
            </Title>
            <Paragraph
              style={{
                color: '#000',
                fontSize: 'clamp(14px, 3vw, 18px)',
                maxWidth: '800px',
                margin: '0 auto',
                lineHeight: 1.5,
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
              }}
            >
              Discover a seamless experience with powerful features designed to boost productivity and creativity.
            </Paragraph>
          </motion.div>
          <motion.div
            variants={textVariants}
            style={{ marginTop: 'clamp(16px, 4vw, 24px)' }}
          >
            <Link to="/chat">
              <Button
                size="large"
                style={{
                  padding: '0 clamp(20px, 5vw, 32px)',
                  height: 'clamp(40px, 10vw, 48px)',
                  backgroundColor: '#8a2be2',
                  borderColor: '#8a2be2',
                  color: '#fff',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: 800,
                  fontFamily: "'Montserrat', sans-serif",
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a1bb2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8a2be2'}
              >
                Get Started
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    
      {/* Features Section */}
      <div
        style={{
          flexGrow: 1,
          width: '100%',
          padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 32px)',
          textAlign: 'center',
        }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 'clamp(24px, 6vw, 40px)',
            fontSize: 'clamp(20px, 5vw, 32px)',
            color: '#333',
            fontWeight: 800,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Explore Our Features
        </Title>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'clamp(16px, 4vw, 24px)',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              initial="hidden"
              animate="visible"
              style={{
                maxWidth: '500px',
                transition: 'transform 0.3s ease',
              }}
            >
              <FeatureCard feature={feature} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;