import React, { useState, useEffect, useRef } from 'react';
import {
  CreatePhotoModel,
  UpdatePhotoModel,
  PhotoIdRequestModel,
  PhotoTogglelikeModel,
  PhotoCommentModel,
} from '@in-one/shared-models';
import {
  Button,
  Card,
  Upload,
  message,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Avatar,
  List,
} from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
  LoadingOutlined,
  CommentOutlined,
  CloseOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import './photos-page.css';

const { Text } = Typography;
const { TextArea } = Input;

interface CommentModel {
  photoId: string;
  userId: string;
  content: string;
}

interface PhotoCommentsRequestModel {
  photoId: string;
}

const PhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [form] = Form.useForm();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastOffset = useRef<number>(0);
  const photoService = new PhotoHelpService();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  const previewVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  useEffect(() => {
    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const fetchPhotos = async (append = false) => {
    if (!userId || !hasMore || loading || (append && offset === lastOffset.current)) return;
    setLoading(true);
    try {
      const limit = 9;
      const response = await photoService.getAllPhotos({
        params: { offset, limit },
      });
      if (response.status === true) {
        const transformedPhotos = response.data.map((photo: any) => ({
          photoId: photo.id,
          url: photo.imageUrl,
          caption: photo.caption,
          likes: photo.likes,
          visibility: photo.visibility,
          isLiked: photo.isLiked || false,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
          author: photo.author,
        }));
        setPhotos((prev) => {
          if (append) {
            const newPhotos = transformedPhotos.filter(
              (newPhoto: { photoId: any }) =>
                !prev.some((existing) => existing.photoId === newPhoto.photoId)
            );
            return [...prev, ...newPhotos];
          }
          return transformedPhotos;
        });
        lastOffset.current = offset;
        setOffset((prev) => prev + transformedPhotos.length);
        setHasMore(transformedPhotos.length === limit);
      } else {
        message.error('Failed to fetch photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      message.error('An error occurred while fetching photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (photoId: string) => {
    try {
      const reqModel: PhotoCommentsRequestModel = { photoId };
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

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchPhotos(true);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading, hasMore]);

  const handleUpload = async (file: File) => {
    if (!userId) {
      message.error('Please login to upload photos');
      return false;
    }
    setLoading(true);
    const createModel: CreatePhotoModel = {
      userId,
      caption: '',
      imageUrl: '',
      authorId: userId,
    };
    try {
      const response = await photoService.uploadPhoto(createModel, file);
      if (response.status === true) {
        setOffset(0);
        lastOffset.current = 0;
        await fetchPhotos();
        message.success('Photo uploaded successfully');
      } else {
        message.error(response.internalMessage || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('An error occurred while uploading the photo');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleUpdate = async (values: { caption?: string; visibility?: 'public' | 'private' }) => {
    if (!userId || !editingPhotoId) return;
    const updateModel: UpdatePhotoModel = {
      photoId: editingPhotoId,
      caption: values.caption,
      visibility: values.visibility,
    };
    setLoading(true);
    try {
      const response = await photoService.updatePhoto(updateModel);
      if (response.status === true) {
        setEditingPhotoId(null);
        setIsModalVisible(false);
        form.resetFields();
        await fetchPhotos();
        message.success('Photo updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update photo');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      message.error('An error occurred while updating the photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!userId) return;
    const reqModel: PhotoIdRequestModel = { photoId };
    setLoading(true);
    try {
      const response = await photoService.deletePhoto(reqModel);
      if (response.status === true) {
        await fetchPhotos();
        message.success('Photo deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      message.error('An error occurred while deleting the photo');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (photoId: string, isLiked: boolean) => {
    if (!userId) return;
    const reqModel: PhotoTogglelikeModel = { photoId, userId };
    try {
      const response = await photoService.toggleLike(reqModel);
      if (response.status === true) {
        await fetchPhotos();
        if (selectedPhoto?.photoId === photoId) {
          setSelectedPhoto((prev: any) => ({
            ...prev,
            isLiked: !isLiked,
            likes: isLiked ? prev.likes - 1 : prev.likes + 1,
          }));
        }
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

  const handleEdit = (photo: any) => {
    setEditingPhotoId(photo.photoId);
    setIsModalVisible(true);
    form.setFieldsValue({
      caption: photo.caption,
      visibility: photo.visibility,
    });
  };

  const handlePreview = (photo: any) => {
    setSelectedPhoto(photo);
    setIsPreviewVisible(true);
    fetchComments(photo.photoId);
  };

  const handleClosePreview = () => {
    setIsPreviewVisible(false);
    setSelectedPhoto(null);
    setComments([]);
  };

  if (!userId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="login-prompt"
      >
        <Text strong style={{ fontSize: 18 }}>
          Please log in to view your photos
        </Text>
      </motion.div>
    );
  }

  return (
    <div className="photos-page">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="j-header"
      >
        <PictureOutlined style={{ fontSize: 24, color: '#4A90E2', marginRight: 10 }}  />
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={loading}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              icon={loading ? <LoadingOutlined /> : <UploadOutlined />}
              disabled={loading}
              className="upload-btn"
            >
              Upload Photo
            </Button>
          </motion.div>
        </Upload>
      </motion.div>

      <div className="main-container">
        <motion.div
          className="content-wrapper"
          ref={contentRef}
          animate={{
            width: isPreviewVisible ? '50%' : '100%',
            x: isPreviewVisible ? '-25%' : 0,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {loading && !photos.length ? (
            <div className="loading">
              <LoadingOutlined style={{ fontSize: 32 }} spin />
            </div>
          ) : photos.length === 0 ? (
            <div className="no-photos">
              <Text strong style={{ fontSize: 16 }}>
                No photos to display
              </Text>
            </div>
          ) : (
            <div className="photo-grid">
              <AnimatePresence>
                {photos.map((photo) => (
                  <motion.div
                    key={photo.photoId}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Card
                      className="photo-card"
                      bodyStyle={{ padding: 0 }}
                      hoverable
                      onClick={() => handlePreview(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="photo-img"
                      />
                      <div className="photo-details">
                        <Space className="photo-actions">
                          <motion.div
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              type="text"
                              icon={
                                photo.isLiked ? (
                                  <DislikeOutlined />
                                ) : (
                                  <LikeOutlined />
                                )
                              }
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleLike(photo.photoId, photo.isLiked);
                              }}
                              className={photo.isLiked ? 'liked' : ''}
                            >
                              {photo.likes || 0}
                            </Button>
                          </motion.div>
                          <motion.div
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              type="text"
                              icon={<CommentOutlined />}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handlePreview(photo);
                              }}
                            />
                          </motion.div>
                          <motion.div
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleEdit(photo);
                              }}
                            />
                          </motion.div>
                          <motion.div
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDelete(photo.photoId);
                              }}
                            />
                          </motion.div>
                        </Space>
                        <Text className="caption">{photo.caption || ''}</Text>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {loading && hasMore && (
            <div className="loader">
              <LoadingOutlined style={{ fontSize: 24 }} spin />
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {isPreviewVisible && selectedPhoto && (
            <motion.div
              className="preview-container"
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
                    icon={
                      selectedPhoto.isLiked ? (
                        <DislikeOutlined />
                      ) : (
                        <LikeOutlined />
                      )
                    }
                    onClick={() =>
                      handleLike(selectedPhoto.photoId, selectedPhoto.isLiked)
                    }
                    className={selectedPhoto.isLiked ? 'liked' : ''}
                  >
                    {selectedPhoto.likes || 0} Likes
                  </Button>
                  <Button type="text" icon={<CommentOutlined />}>
                    {comments.length} Comments
                  </Button>
                </Space>
                <Text className="preview-caption">
                  {selectedPhoto.caption || ''}
                </Text>
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
                          <Text
                            type="secondary"
                            style={{ display: 'block', fontSize: 12 }}
                          >
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
      </div>

      <Modal
        title={<span className="modal-title">Edit Photo</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="edit-modal"
      >
        <Form form={form} onFinish={handleUpdate} layout="vertical">
          <Form.Item name="caption" label="Caption">
            <Input placeholder="Add a caption" />
          </Form.Item>
          <Form.Item
            name="visibility"
            label="Visibility"
            rules={[{ required: true, message: 'Please select visibility' }]}
          >
            <Select placeholder="Select visibility">
              <Select.Option value="public">Public</Select.Option>
              <Select.Option value="private">Private</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PhotosPage;