import React, { useState, useEffect, useRef } from 'react';
import { CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, LikeRequestModel } from '@in-one/shared-models';
import { Button, Card, Upload, message, Space, Typography, Modal, Form, Input, Select } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
  LoadingOutlined,
  PhoneOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import './photos-page.css';

const { Title } = Typography;

const PhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [form] = Form.useForm();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastOffset = useRef<number>(0);
  const photoService = new PhotoHelpService()

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const buttonVariants = {
    hover: { scale: 1.15 },
    tap: { scale: 0.9 },
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
      const response = await photoService.getAllPhotos({ params: { offset, limit } });
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
              (newPhoto: { photoId: any; }) => !prev.some((existing) => existing.photoId === newPhoto.photoId)
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

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      console.log('Scroll check:', { scrollTop, scrollHeight, clientHeight }); // Debug scroll position
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        console.log('Fetching more photos at offset:', offset);
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
      return;
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
    const reqModel: LikeRequestModel = { photoId, userId };
    try {
      const response = isLiked
        ? await photoService.unlikePhoto(reqModel)
        : await photoService.likePhoto(reqModel);
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
  };

  if (!userId) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="login-prompt">
        <Title level={3}>Please log in to view your photos</Title>
      </motion.div>
    );
  }

  return (
    <div className="photos-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="header"
      >
        <Title style={{ fontSize: '30px' }}>
          <PictureOutlined style={{ marginRight: '10px' }} />
          InstaView
          </Title>
        <Upload beforeUpload={handleUpload} showUploadList={false} disabled={loading}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button type="primary" icon={loading ? <LoadingOutlined /> : <UploadOutlined />} disabled={loading} className="upload-btn">
              Upload Photo
            </Button>
          </motion.div>
        </Upload>
      </motion.div>

      <div className="content-wrapper" ref={contentRef}>
        {loading && !photos.length ? (
          <div className="loading">
            <LoadingOutlined style={{ fontSize: 32 }} spin />
          </div>
        ) : photos.length === 0 ? (
          <div className="no-photos">
            <Title level={4}>No photos to display</Title>
          </div>
        ) : (
          <AnimatePresence>
            <div className="photo-grid">
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
                    <img src={photo.url} alt={photo.caption || 'Photo'} className="photo-img" />
                    <div className="photo-details">
                      <Space className="photo-actions">
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={photo.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(photo.photoId, photo.isLiked);
                            }}
                            className={photo.isLiked ? 'liked' : ''}
                          />
                        </motion.div>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(photo);
                            }}
                          />
                        </motion.div>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(photo.photoId);
                            }}
                          />
                        </motion.div>
                      </Space>
                      <div>
                        <p className="likes">{photo.likes || 0} likes</p>
                        <p className="caption">
                          <strong>{photo.caption || ''}</strong>
                        </p>
                        <p className="visibility">{photo.visibility === 'public' ? 'Public' : 'Private'}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            {loading && hasMore && (
              <div className="loader">
                <LoadingOutlined style={{ fontSize: 24 }} spin />
              </div>
            )}
          </AnimatePresence>
        )}
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
          <Form.Item name="visibility" label="Visibility" rules={[{ required: true, message: 'Please select visibility' }]}>
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

      <Modal
        open={isPreviewVisible}
        footer={null}
        onCancel={() => setIsPreviewVisible(false)}
        width={600}
        className="preview-modal"
        bodyStyle={{ padding: 0 }}
      >
        {selectedPhoto && (
          <div className="preview-container">
            <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Photo'} className="preview-image" />
            <div className="preview-details">
              <p className="preview-likes">
                <Button
                  type="text"
                  icon={selectedPhoto.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                  onClick={() => handleLike(selectedPhoto.photoId, selectedPhoto.isLiked)}
                  className={selectedPhoto.isLiked ? 'liked' : ''}
                >
                  {selectedPhoto.likes || 0} Likes
                </Button>
              </p>
              <p className="preview-caption">
                <strong>{selectedPhoto.caption || ''}</strong>
              </p>
              <p className="preview-visibility">{selectedPhoto.visibility === 'public' ? 'Public' : 'Private'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhotosPage;