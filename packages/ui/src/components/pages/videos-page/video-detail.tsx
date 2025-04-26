import React, { useEffect, useState } from 'react';
import { Typography, Avatar, Button, List, message, Spin, Input } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { DeleteOutlined, ArrowLeftOutlined, LikeOutlined, LikeFilled, EditOutlined } from '@ant-design/icons';
import './video-page.css';
import { VideoIdRequestModel, TogglelikeModel, VideoCommentModel, CommentIdRequestModel, VideoUpdateCommentModel } from '@in-one/shared-models';
import { VideoHelpService } from '@in-one/shared-services';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  views: number;
  likes: { user: { id: string } }[];
  likeCount: number;
  author: User;
  comments: CommentType[];
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
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const videoService = new VideoHelpService();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');


  useEffect(() => {
    let isMounted = true;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('Invalid video ID');
        const requestModel = new VideoIdRequestModel(id);
        const response = await videoService.getVideoById(requestModel);

        if (isMounted && response.status && response.data) {
          setVideo({
            ...response.data,
            likeCount: response.data.likes.length,
          });
        } else if (isMounted) {
          message.error('Failed to fetch video details');
          setVideo(null);
        }
      } catch (error: any) {
        if (isMounted) {
          message.error('Error fetching video details');
          setVideo(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchVideo();
    } else {
      message.error('No video ID provided');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const refreshComments = async (videoId: string) => {
    const response = await videoService.getVideoComments(new VideoIdRequestModel(videoId));
    if (response.status && response.data) {
      setVideo((prev) => prev ? { ...prev, comments: response.data } : prev);
    }
  };

  const handleLike = async (videoId: string, isLiked: boolean): Promise<void> => {
    if (!userId) {
      message.error('User not logged in');
      return;
    }

    if (!video) {
      message.error('Video not loaded');
      return;
    }

    const originalVideo = { ...video };
    setVideo({
      ...video,
      likes: isLiked
        ? video.likes.filter((l) => l.user.id !== userId)
        : [...video.likes, { user: { id: userId } }],
      likeCount: isLiked ? video.likeCount - 1 : video.likeCount + 1,
    });

    try {
      const response = await videoService.toggleLike(new TogglelikeModel(videoId, userId));
      if (!response.status) {
        setVideo(originalVideo);
        message.error(response.internalMessage || 'Failed to toggle like');
      }
    } catch (error) {
      setVideo(originalVideo);
      message.error('Error toggling like');
    }
  };


  const handleAddComment = async (): Promise<void> => {
    if (!userId || !video) {
      message.error('User not logged in or video not found');
      return;
    }

    if (!newComment.trim()) {
      message.warning('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    const commentModel = new VideoCommentModel(newComment.trim(), video.id, userId);

    try {
      const response = await videoService.createComment(commentModel);
      if (response.status) {
        message.success(response.internalMessage);
        setNewComment('');
        await refreshComments(video.id);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error) {
      message.error('Error adding comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await videoService.deleteComment(new CommentIdRequestModel(commentId));
      if (response.status) {
        message.success('Comment deleted');
        setVideo((prev) =>
          prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev
        );
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  if (loading) {
    return (
      <div className="video-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin
          tip="Loading video..."
          size="large"
          style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        />
      </div>
    );
  }


  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingContent.trim() || !editingCommentId) {
      message.warning('Comment cannot be empty');
      return;
    }

    try {
      const updateModel = new VideoUpdateCommentModel(editingCommentId, editingContent.trim());
      const response = await videoService.updateComment(updateModel);

      if (response.status) {
        message.success('Comment updated');
        setEditingCommentId(null);
        setEditingContent('');
        if (video) {
          await refreshComments(video.id);
        }
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };


  if (!video || !video.author) {
    return (
      <div className="video-detail-page">
        <Text>Video or author not found</Text>
      </div>
    );
  }

  const isLiked = video.likes.some((l) => l.user.id === userId);

  return (
    <div className="video-detail-page">
      <div className="video-detail-container">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</Button>

        <div className="video-player-section">
          <video src={video.videoUrl} controls autoPlay className="detail-video-player" />
          <div className="video-info">
            <Title level={3}>{video.title}</Title>
            <Text type="secondary"> {formatTimeAgo(video.createdAt)} • {video.likeCount} likes</Text>
            <Button type="text" icon={isLiked ? <LikeFilled /> : <LikeOutlined />} onClick={() => handleLike(video.id, isLiked)} style={{ marginLeft: 8 }}>
              {isLiked ? 'Unlike' : 'Like'}
            </Button>
          </div>
        </div>

        <div className="video-details-section">
          <div className="author-section">
            <Avatar src={video.author.avatarUrl} size={48} style={{ marginRight: 12 }}>
              {video.author.avatarUrl
                ? null
                : video.author.username[0]?.toUpperCase() || '?'}
            </Avatar>
            <div className="author-details">
              <Text strong>{video.author.username}</Text>
            </div>
          </div>

          <div>
            <label>Description: </label>
            <Text className="j-video-description">  {video.description || 'No description'} </Text>
          </div>

          <div className="comments-section">
            <Title level={4}>Comments</Title>
            <TextArea rows={3} placeholder="Write your comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <Button type="primary" loading={submitting} onClick={handleAddComment} style={{ marginTop: 8 }}>
              Post Comment
            </Button>

            <List
              dataSource={video.comments || []}
              renderItem={(comment: CommentType) => {
                const isAuthor = comment.author?.id === userId;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div className="comment-item" style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <div className="comment-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Avatar src={comment.author?.avatarUrl} size={32} style={{ marginRight: 8 }} >
                        {comment.author?.avatarUrl
                          ? null
                          : comment.author?.username[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <div className="comment-meta" style={{ flex: 1 }}>
                        <Text strong>{comment.author?.username || 'Unknown'}</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}> {formatTimeAgo(comment.createdAt)}</Text>
                      </div>
                      {isAuthor && !isEditing && (
                        <div className="comment-actions" style={{ display: 'flex', gap: '8px' }}>
                          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditComment(comment)} />
                          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteComment(comment.id)} danger />
                        </div>
                      )}
                    </div>

                    <div className="comment-content">
                      {isEditing ? (
                        <>
                          <TextArea rows={2} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} style={{ marginBottom: 8 }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button type="primary" size="small" onClick={handleUpdateComment}>Save</Button>
                            <Button size="small" onClick={() => { setEditingCommentId(null); setEditingContent(''); }}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <Text>{comment.content}</Text>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
