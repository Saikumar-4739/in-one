import React, { useState, useEffect } from 'react';
import { CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, LikeRequestModel } from '@in-one/shared-models';
import { Button, Card, Upload, message, Space, Typography, Modal, Form, Input, Select } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';

const { Title } = Typography;

const PhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const photoService = new PhotoHelpService();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  useEffect(() => {
    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const fetchPhotos = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await photoService.getAllPhotos(); // Pass userId to get isLiked
      if (response.status === true) {
        // Transform the response data to match frontend expectations
        const transformedPhotos = response.data.map((photo: any) => ({
          photoId: photo.id,         // Map 'id' to 'photoId'
          url: photo.imageUrl,       // Map 'imageUrl' to 'url'
          caption: photo.caption,
          likes: photo.likes,
          visibility: photo.visibility,
          isLiked: photo.isLiked || false, // Default to false if not provided
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
          author: photo.author,
          comments: photo.comments,
        }));
        setPhotos(transformedPhotos);
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

  if (!userId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Title level={3} style={{ color: '#262626' }}>Please log in to view your photos</Title>
      </motion.div>
    );
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: '#fafafa', 
        paddingTop: '80px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      }}
    >
      <div style={{ maxWidth: '935px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0',
            borderBottom: '1px solid #dbdbdb',
          }}
        >
          <Title 
            level={2} 
            style={{ 
              margin: 0, 
              fontSize: '28px',
              fontWeight: 400,
              color: '#262626',
            }}
          >
            Photos
          </Title>
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
                style={{
                  background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 15px',
                  height: 'auto',
                  fontWeight: 600,
                }}
              >
                Upload Photo
              </Button>
            </motion.div>
          </Upload>
        </motion.div>

        {loading && !photos.length ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8e8e8e' }}>
            <LoadingOutlined style={{ fontSize: 32 }} spin />
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8e8e8e' }}>
            <Title level={4}>No photos to display</Title>
          </div>
        ) : (
          <AnimatePresence>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(293px, 1fr))',
                gap: '28px',
                padding: '20px 0',
              }}
            >
              {photos.map((photo) => (
                <motion.div
                  key={photo.photoId}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      border: 'none',
                      background: '#fff',
                    }}
                    bodyStyle={{ padding: 0 }}
                    hoverable
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      style={{
                        width: '100%',
                        height: '293px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div style={{ padding: '12px 15px' }}>
                      <Space style={{ marginBottom: '8px' }}>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={photo.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                            onClick={() => handleLike(photo.photoId, photo.isLiked)}
                            style={{ color: photo.isLiked ? '#ed4956' : '#262626' }}
                          />
                        </motion.div>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(photo)}
                            style={{ color: '#262626' }}
                          />
                        </motion.div>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDelete(photo.photoId)}
                          />
                        </motion.div>
                      </Space>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#262626' }}>
                          {photo.likes || 0} likes
                        </p>
                        <p style={{ margin: 0, color: '#262626', fontSize: '14px' }}>
                          <strong>{photo.caption || ''}</strong>
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#8e8e8e', fontSize: '12px' }}>
                          {photo.visibility === 'public' ? 'Public' : 'Private'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        <Modal
          title={<span style={{ fontWeight: 600, color: '#262626' }}>Edit Photo</span>}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          bodyStyle={{ padding: '24px' }}
        >
          <Form form={form} onFinish={handleUpdate} layout="vertical">
            <Form.Item 
              name="caption" 
              label={<span style={{ color: '#262626' }}>Caption</span>}
            >
              <Input 
                placeholder="Add a caption" 
                style={{ borderRadius: '4px', borderColor: '#dbdbdb' }}
              />
            </Form.Item>
            <Form.Item 
              name="visibility" 
              label={<span style={{ color: '#262626' }}>Visibility</span>}
              rules={[{ required: true, message: 'Please select visibility' }]}
            >
              <Select 
                placeholder="Select visibility"
                style={{ borderRadius: '4px' }}
              >
                <Select.Option value="public">Public</Select.Option>
                <Select.Option value="private">Private</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                style={{
                  background: '#0095f6',
                  border: 'none',
                  borderRadius: '8px',
                  height: '40px',
                  fontWeight: 600,
                }}
              >
                Update
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default PhotosPage;