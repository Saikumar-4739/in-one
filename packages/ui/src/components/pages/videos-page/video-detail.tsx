import React, { useEffect, useState } from 'react';
import { Typography, Avatar, Button, List, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import './video-page.css';
import { GetVideoByIdModel } from '@in-one/shared-models';

const { Title, Text } = Typography;

interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface CommentType {
  id: string;
  author?: User;
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
  author?: User;
  comments?: CommentType[];
}

// VideoHelpService configured for POST request
const BASE_URL = 'http://localhost:3005'; // Backend base URL
class VideoHelpService {
  async getVideoById(model: GetVideoByIdModel) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      console.log(`Fetching video from: ${BASE_URL}/videos/getVideoById`); // Debug log
      const response = await fetch(`${BASE_URL}/videos/getVideoById`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify({ videoId: model.videoId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, StatusText: ${response.statusText}`);
      }
      const result = await response.json();
      console.log('Raw API response:', result); // Debug log
      return {
        status: result.status,
        data: result.data, // Extract the video object from response.data
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Fetch error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
      }); // Detailed error logging
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds');
      }
      throw new Error(`Failed to fetch video: ${error.message}`);
    }
  }
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const videoHelpService = new VideoHelpService();

  useEffect(() => {
    let isMounted = true;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        if (!id) {
          throw new Error('Invalid video ID');
        }
        console.log('Extracted id:', id); // Debug log
        const requestModel: GetVideoByIdModel = { videoId: id };
        const response = await videoHelpService.getVideoById(requestModel);
        console.log('Processed API response:', response); // Debug log

        if (isMounted && response.status && response.data) {
          setVideo(response.data);
        } else if (isMounted) {
          message.error('Failed to fetch video details');
          setVideo(null);
        }
      } catch (error: any) {
        if (isMounted) {
          message.error('Error fetching video details');
          console.error('Error fetching video:', error.message, error.stack);
          setVideo(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      console.log('Fetching video with ID:', id); // Debug log
      fetchVideo();
    } else {
      console.error('No video ID provided in URL'); // Debug log
      message.error('No video ID provided');
      setLoading(false);
    }

    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, [id]);

  // Handle loading state
  if (loading) {
    return (
      <div className="video-detail-page">
        <Text>Loading...</Text>
      </div>
    );
  }

  // Check if video or video.author is missing
  if (!video || !video.author) {
    return (
      <div className="video-detail-page">
        <Text>Video or author not found</Text>
      </div>
    );
  }

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

        <div className="video-player-section" style={{ marginTop: '24px' }}>
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
              {video.author.avatarUrl
                ? null
                : video.author.username[0]?.toUpperCase() || '?'}
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
                      src={comment.author?.avatarUrl}
                      size={32}
                      style={{ marginRight: '8px' }}
                    >
                      {comment.author?.avatarUrl
                        ? null
                        : comment.author?.username[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <div className="comment-meta">
                      <Text strong>{comment.author?.username || 'Unknown'}</Text>
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