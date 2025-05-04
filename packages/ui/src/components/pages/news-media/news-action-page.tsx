import React from 'react';
import { motion } from 'framer-motion';
import { Button, Typography, Space, List, Tag } from 'antd';
import { CloseOutlined, LikeOutlined, DislikeOutlined, ShareAltOutlined, StarOutlined, CommentOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';
import { message } from 'antd';
import './news-page.css';
import noImage from '../../../assets/No Image Available (1).png'

const { Text } = Typography;
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAC8CAMAAAB8Zmf2AAAAA1BMVEX///+nxBvIAAAAIElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAADwGxiKAAEvqP0yAAAAAElFTkSuQmCC';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  images: string[];
  category: string;
  likes: number;
  dislikes: number;
  comments: any[];
  views: number;
  author: { id: string; username: string };
  isLiked?: boolean;
  isDisliked?: boolean;
  isImportant?: boolean;
  shares?: number;
  publishedAt?: string;
  visibility?: string;
  tags?: string[];
}

interface NewsActionsProps {
  selectedNews: NewsItem;
  userId: string | null;
  newsService: NewsHelpService;
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  closeFullView: () => void;
  setIsNewsModalVisible: (visible: boolean) => void;
  setEditingNewsId: (id: string | null) => void;
  setIsCommentModalVisible: (visible: boolean) => void;
  setCommentNewsId: (id: string | null) => void;
}

const NewsActions: React.FC<NewsActionsProps> = ({
  selectedNews,
  userId,
  newsService,
  setNews,
  closeFullView,
  setIsNewsModalVisible,
  setEditingNewsId,
  setIsCommentModalVisible,
  setCommentNewsId,
}) => {
  const [loading, setLoading] = React.useState(false);

  const getNewsImage = (newsItem: NewsItem): string | undefined =>
    newsItem.images && newsItem.images.length > 0 ? newsItem.images[0] : undefined;

  const handleToggleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!userId) {
      message.error(`Please log in to ${reactionType} news`);
      return;
    }
    setLoading(true);
    try {
      const response = await newsService.toggleReactionNews({
        newsId: selectedNews.id,
        userId,
        reactionType,
      });
      if (response.status) {
        setNews((prev) =>
          prev.map((item) =>
            item.id === selectedNews.id
              ? {
                ...item,
                likes: response.data.likes,
                dislikes: response.data.dislikes,
                isLiked: response.data.isLiked,
                isDisliked: response.data.isDisliked,
              }
              : item
          )
        );
        message.success(`News ${reactionType === 'like' ? (response.data.isLiked ? 'liked' : 'unliked') : (response.data.isDisliked ? 'disliked' : 'undisliked')} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${reactionType === 'like' ? (selectedNews.isLiked ? 'unlike' : 'like') : (selectedNews.isDisliked ? 'undislike' : 'dislike')} news`);
      }
    } catch (error: any) {
      message.error(error.message || `An error occurred while ${reactionType === 'like' ? (selectedNews.isLiked ? 'unliking' : 'liking') : (selectedNews.isDisliked ? 'undisliking' : 'disliking')} news`);
    } finally {
      setLoading(false);
    }
  };


  const handleShareNews = async () => {
    if (!userId) {
      message.error('Please log in to share news');
      return;
    }
    setLoading(true);
    try {
      const platform = prompt('Enter platform to share (e.g., Twitter, Facebook):') || 'General';
      const response = await newsService.shareNews(selectedNews.id, platform);
      if (response.status) {
        setNews((prev) =>
          prev.map((item) =>
            item.id === selectedNews.id ? { ...item, shares: (item.shares || 0) + 1 } : item
          )
        );
        message.success(`News shared on ${platform} successfully`);
      } else {
        message.error(response.internalMessage || 'Failed to share news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while sharing news');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.deleteNews(selectedNews.id);
      if (response.status) {
        setNews((prev) => prev.filter((item) => item.id !== selectedNews.id));
        closeFullView();
        message.success('News deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while deleting news');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (selectedNews.author.id !== userId) {
      message.error('You can only edit news you created');
      return;
    }
    setEditingNewsId(selectedNews.id);
    setIsNewsModalVisible(true);
  };

  const handleComment = () => {
    setCommentNewsId(selectedNews.id);
    setIsCommentModalVisible(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    setLoading(true);
    try {
      const response = await newsService.deleteComment(commentId);
      if (response.status) {
        setNews((prev) =>
          prev.map((item) =>
            item.id === selectedNews.id
              ? { ...item, comments: item.comments.filter((c) => c.id !== commentId) }
              : item
          )
        );
        message.success('Comment deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete comment');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while deleting comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="full-view-container"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="full-view-header">
        <Text strong className="full-view-title">{selectedNews.title}</Text>
        <Button
          icon={<CloseOutlined />}
          onClick={closeFullView}
          className="close-full-view-btn"
        />
      </div>
      <div className="full-view-content">
        <img src={getNewsImage(selectedNews) || noImage} className="news-card-image" onError={(e) => { e.currentTarget.src = noImage; }} alt="news" />
        <div>
          <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
            Category:
          </Text>
          <Text style={{ display: 'inline', marginLeft: '5px' }}>
            {selectedNews.category || 'N/A'}
          </Text>
        </div>
        <div>
          <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
            Published:
          </Text>{' '}
          <Text style={{ display: 'inline', marginLeft: '5px' }}>
            {selectedNews.publishedAt ? new Date(selectedNews.publishedAt).toLocaleString() : 'N/A'}
          </Text>
        </div>
        <div>
          <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
            Visibility:
          </Text>{' '}
          <Text style={{ display: 'inline', marginLeft: '5px' }}>
            {selectedNews.visibility}
          </Text>
        </div>
        <Text strong>Content:</Text> <p>{selectedNews.content || 'No content available.'}</p>
        {Array.isArray(selectedNews.tags) && selectedNews.tags.length > 0 && (
          <div>
            <Text strong>Tags:</Text>{' '}
            {selectedNews.tags.map((tag) => (
              <Tag key={tag} color="purple" className="news-tag">
                {tag}
              </Tag>
            ))}
          </div>
        )}
        <Space className="full-view-actions">
          <Button
            icon={<LikeOutlined />}
            onClick={() => handleToggleReaction('like')}
            loading={loading}
          >
            {selectedNews.likes || 0}
          </Button>
          <Button
            icon={<DislikeOutlined />}
            onClick={() => handleToggleReaction('dislike')}
            loading={loading}
          >
            {selectedNews.dislikes || 0}
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            onClick={handleShareNews}
            loading={loading}
          >
            {selectedNews.shares || 0}
          </Button>
          <Button
            icon={<CommentOutlined />}
            onClick={handleComment}
          >
            {selectedNews.comments?.length || 0}
          </Button>
          {selectedNews.author.id === userId && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDeleteNews}
                loading={loading}
              >
              </Button>
            </>
          )}
        </Space>
        {selectedNews.comments?.length > 0 ? (
          <List
            header={<Text strong>Comments</Text>}
            dataSource={selectedNews.comments}
            renderItem={(comment: any) => (
              <List.Item
                actions={
                  comment.authorId === userId
                    ? [
                      <Button
                        type="link"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>,
                    ]
                    : []
                }
              >
                <List.Item.Meta
                  title={comment.userName || 'Anonymous'}
                  description={comment.content || 'No content'}
                />
              </List.Item>
            )}
          />
        ) : (
          <Text>No comments available.</Text>
        )}
      </div>
    </motion.div>
  );
};

export default NewsActions;