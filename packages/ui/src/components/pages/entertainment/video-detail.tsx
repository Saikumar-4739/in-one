import React from 'react';
import { Typography, Avatar, Button, List } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'; // Added ArrowLeftOutlined
import './video-page.css';

const { Title, Text } = Typography;

interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface CommentType {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

interface Video {
  id: string;
  videoUrl: string;
  title: string;
  description?: string;
  createdAt: string;
  views?: number;
  likes?: { user: { id: string } }[];
  author: User;
  comments?: CommentType[];
}

const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const created = new Date(date);
  const diffMs = now.getTime() - created.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds} sec ago`;
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return created.toLocaleDateString();
};

const VideoDetail: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate(); // Added for navigation
  const video: Video = state?.video;

  if (!video)
    return (
      <div className="video-detail-page">
        <Text>Video not found</Text>
      </div>
    );

  const handleDeleteComment = (commentId: string) => {
    console.log(`Delete comment with id: ${commentId}`);
    // Implement your delete logic here
  };

  return (
    <div className="video-detail-page">
      <div className="video-detail-container">
        {/* Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back
        </Button>

        <div className="video-player-section" style={{ marginTop: '24px' }}> {/* Added margin-top */}
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="detail-video-player"
          />
          <div className="video-info">
            <Title level={3}>{video.title}</Title>
            <Text type="secondary">
              {formatTimeAgo(video.createdAt)} • {video.views || 0} views
            </Text>
          </div>
        </div>
        <div className="video-details-section">
          <div className="author-section" style={{ marginTop: '16px' }}>
            <Avatar
              src={video.author.avatarUrl}
              size={40}
              style={{ marginRight: '12px' }}
            >
              {!video.author.avatarUrl &&
                video.author.username[0].toUpperCase()}
            </Avatar>
            <div className="author-details">
              <Text strong>{video.author.username}</Text>
            </div>
          </div>
          <Text className="j-video-description">
            Description :- {video.description || 'No description'}
          </Text>

          {/* Comments Section */}
          <div className="comments-section" style={{ marginTop: '24px' }}>
            <Title level={4}>Comments</Title>
            <List
              dataSource={video.comments || []}
              renderItem={(comment: CommentType) => (
                <div className="comment-item">
                  <div className="comment-header">
                    <Avatar
                      src={comment.author.avatarUrl}
                      size={32}
                      style={{ marginRight: '8px' }}
                    >
                      {!comment.author.avatarUrl &&
                        comment.author.username[0].toUpperCase()}
                    </Avatar>
                    <div className="comment-meta">
                      <Text strong>{comment.author.username}</Text>
                      <Text type="secondary" style={{ marginLeft: '8px' }}>
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </div>
                  </div>
                  <div
                    className="comment-content"
                    style={{ marginLeft: '40px' }}
                  >
                    <Text>{comment.content}</Text>
                  </div>
                  <div
                    className="comment-actions"
                    style={{ marginLeft: '40px' }}
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteComment(comment.id)}
                      danger
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;