import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Typography, Modal, Form, Input, Select } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { CreatePhotoModel, UpdatePhotoModel } from '@in-one/shared-models';
import { motion } from 'framer-motion';
import './photos-page.css';
import PhotoCardSection from './photo-card-section';
import PhotoActionPage from './photo-action-page';
import Stories from './stories';

const { Text } = Typography;

interface PhotoMainPageProps {}

const PhotoMainPage: React.FC<PhotoMainPageProps> = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const photoService = new PhotoHelpService();

  const fetchPhotos = async (offset = 0, append = false) => {
    if (!userId || loading) return;
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
              (newPhoto: { photoId: any }) => !prev.some((existing) => existing.photoId === newPhoto.photoId)
            );
            return [...prev, ...newPhotos];
          }
          return transformedPhotos;
        });
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
    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

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
  };

  if (!userId) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="login-prompt">
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
        className="upload-section"
      >
        <Upload beforeUpload={handleUpload} showUploadList={false} disabled={loading}>
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
      {/* <Stories/> */}
      <div className="main-container">
        <PhotoCardSection
          photos={photos}
          loading={loading}
          userId={userId}
          fetchPhotos={fetchPhotos}
          handleEdit={handleEdit}
          handlePreview={handlePreview}
          selectedPhoto={selectedPhoto}
        />
        <PhotoActionPage
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
          userId={userId}
          fetchPhotos={fetchPhotos}
        />
      </div>

      <Modal
        title="Edit Photo"
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

export default PhotoMainPage;