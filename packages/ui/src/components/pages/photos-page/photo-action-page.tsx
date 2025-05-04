import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, List, Avatar, Input } from 'antd';
import { LikeOutlined, DislikeOutlined, CommentOutlined, CloseOutlined } from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import { message } from 'antd';
import { PhotoIdRequestModel, PhotoTogglelikeModel, PhotoCommentModel } from '@in-one/shared-models';

const { Text } = Typography;
const { TextArea } = Input;

interface PhotoActionPageProps {
  selectedPhoto: any;
  setSelectedPhoto: (photo: any) => void;
  userId: string | null;
  fetchPhotos: (offset?: number, append?: boolean) => Promise<void>;
}

const PhotoActionPage: React.FC<PhotoActionPageProps> = ({
  selectedPhoto,
  setSelectedPhoto,
  userId,
  fetchPhotos,
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const photoService = new PhotoHelpService();

  const previewVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  useEffect(() => {
    if (selectedPhoto?.photoId) {
      fetchComments(selectedPhoto.photoId);
    }
  }, [selectedPhoto]);

  const fetchComments = async (photoId: string) => {
    try {
      const reqModel: PhotoIdRequestModel = { photoId };
      const response = await photoService.getPhotoComments(reqModel);
      if (response.status === true) {
        setComments(response.data);
      } else {
        message.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      message.error('An error occurred while fetching comments');
    }
  };

  const handleLike = async (photoId: string, isLiked: boolean) => {
    if (!userId) return;
    const reqModel: PhotoTogglelikeModel = { photoId, userId };
    try {
      const response = await photoService.toggleLike(reqModel);
      if (response.status === true) {
        await fetchPhotos();
        setSelectedPhoto({
          ...selectedPhoto,
          isLiked: !isLiked,
          likes: isLiked ? selectedPhoto.likes - 1 : selectedPhoto.likes + 1,
        });
        message.success(`Photo ${isLiked ? 'unliked' : 'liked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isLiked ? 'unlike' : 'like'} photo`);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} photo:`, error);
      message.error(`An error occurred while ${isLiked ? 'unliking' : 'liking'} the photo`);
    }
  };

  const handleComment = async (photoId: string) => {
    if (!userId || !newComment.trim()) return;
    const commentModel: PhotoCommentModel = { photoId, userId, content: newComment };
    try {
      const response = await photoService.createComment(commentModel);
      if (response.status === true) {
        setNewComment('');
        fetchComments(photoId);
        message.success('Comment added successfully');
      } else {
        message.error(response.internalMessage || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('An error occurred while adding the comment');
    }
  };

  const handleClosePreview = () => {
    setSelectedPhoto(null);
    setComments([]);
  };

  return (
    <AnimatePresence>
      {selectedPhoto && (
        <motion.div
          className="preview-container active"
          variants={previewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Button
            type="text"
            icon={<CloseOutlined />}
            className="close-preview"
            onClick={handleClosePreview}
          />
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || 'Photo'}
            className="preview-image"
          />
          <div className="preview-details">
            <Space className="preview-actions">
              <Button
                type="text"
                icon={selectedPhoto.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                onClick={() => handleLike(selectedPhoto.photoId, selectedPhoto.isLiked)}
                className={selectedPhoto.isLiked ? 'liked' : ''}
              >
                {selectedPhoto.likes || 0} Likes
              </Button>
              <Button type="text" icon={<CommentOutlined />}>
                {comments.length} Comments
              </Button>
            </Space>
            <Text className="preview-caption">{selectedPhoto.caption || ''}</Text>
            <List
              className="comment-list"
              dataSource={comments}
              renderItem={(item: any) => (
                <List.Item className="custom-comment">
                  <Space>
                    <Avatar>{item.author?.username?.[0] || 'U'}</Avatar>
                    <div>
                      <Text strong>{item.author?.username || 'User'}</Text>
                      <Text style={{ marginLeft: 8 }}>{item.content}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
            <div className="comment-input">
              <TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                autoSize={{ minRows: 1, maxRows: 3 }}
              />
              <Button
                type="link"
                onClick={() => handleComment(selectedPhoto.photoId)}
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoActionPage;