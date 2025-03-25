// VideoDetail.tsx
import React from 'react';
import { Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import './video-page.css';

const { Title, Text } = Typography;

interface Video {
  id: string;
  videoUrl: string;
  title: string;
  description?: string;
  uploadDate: string;
  views?: number;
  likes?: { user: { id: string } }[];
}

const VideoDetail: React.FC = () => {
  const { state } = useLocation();
  const video: Video = state?.video;

  if (!video) return <div className="video-detail-page"><Text>Video not found</Text></div>;

  return (
    <div className="video-detail-page">
      <div className="video-detail-container">
        <div className="video-player-section">
          <video src={video.videoUrl} controls autoPlay className="detail-video-player" />
          <div className="video-info">
            <Title level={3}>{video.title}</Title>
            <Text type="secondary">
              {new Date(video.uploadDate).toLocaleDateString()} • {video.views || 0} views
            </Text>
          </div>
        </div>
        <div className="video-details-section">
          <Text>{video.description || 'No description'}</Text>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;