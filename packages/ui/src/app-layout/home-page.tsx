import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Carousel } from 'antd';
import { motion } from 'framer-motion';
import {
  BulbOutlined,
  MessageOutlined,
  CalendarOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import FeatureCard from '../components/pages/home/features-home';

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

  const circleVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -45 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.8, type: 'spring', bounce: 0.3 },
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
    { icon: <CalendarOutlined />, name: 'Calendar', color: '#4ecdc4' },
    { icon: <MessageOutlined />, name: 'Chat', color: '#45b7d1' },
    { icon: <BulbOutlined />, name: 'AI Bot', color: '#96ceb4' },
    { icon: <VideoCameraOutlined />, name: 'Videos', color: '#8a2be2' },
  ];

  const carouselImages = [
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
  ];

  return (
    <div
      style={{
        height: '80vh', // Full viewport height
        overflowY: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero Section with Carousel */}
      <div style={{ position: 'relative', height: '60%', flexShrink: 0 }}>
        <Carousel autoplay effect="fade" style={{ height: '100%' }}>
          {carouselImages.map((image, index) => (
            <div key={index}>
              <div
                style={{
                  height: '100%',
                  backgroundImage: `url(${image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
          ))}
        </Carousel>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 'clamp(10px, 3vw, 20px)', // Responsive padding
            textAlign: 'center',
            color: '#000',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <motion.div variants={textVariants}>
            <Title
              style={{
                color: '#000',
                fontSize: 'clamp(20px, 5vw, 48px)', // Scales better on small screens
                marginBottom: 'clamp(5px, 2vw, 10px)', // Responsive margin
                lineHeight: 1.2, // Prevents text overlap
              }}
            >
              Welcome to Your{' '}
              <span style={{ color: '#8a2be2', fontWeight: 'bold' }}>IN</span>
              -One
            </Title>
            <Paragraph
              style={{
                color: '#000',
                fontSize: 'clamp(12px, 2.5vw, 18px)',
                maxWidth: '90%', // Prevents overflow on small screens
                margin: '0 auto',
              }}
            >
              Discover a seamless experience with powerful features designed to
              boost productivity and creativity.
            </Paragraph>
          </motion.div>
          <motion.div
            variants={textVariants}
            style={{ marginTop: 'clamp(10px, 3vw, 20px)' }} // Responsive margin
          >
            <Link to="/chat">
              <Button
                type="primary"
                size="large"
                style={{
                  padding: '0 clamp(15px, 4vw, 30px)', // Responsive padding
                  backgroundColor: '#ffd700',
                  borderColor: '#ffd700',
                  color: '#000',
                  fontSize: 'clamp(12px, 2vw, 16px)',
                }}
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
          padding: 'clamp(5px, 2vw, 10px)', // Responsive padding
          backgroundColor: '#fff',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 'clamp(20px, 5vw, 40px)', // Reduced and responsive
            fontSize: 'clamp(18px, 4vw, 32px)',
          }}
        >
          Explore Our Features
        </Title>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'clamp(10px, 3vw, 30px)', // Responsive gap (smaller on mobile)
            padding: '0 10px', // Prevent edge clipping
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
