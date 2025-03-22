import React, { useState, useEffect } from 'react';
import { CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, LikeRequestModel } from '@in-one/shared-models';
import { Button, Card, Upload, message, Space, Typography, Modal, Form, Input } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';
import FormData from 'form-data';
import { PhotoHelpService } from '@in-one/shared-services';

const { Title } = Typography;

const PhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const photoService = new PhotoHelpService();

  useEffect(() => {
    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const fetchPhotos = async () => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await photoService.getAllPhotos();
      if (response.status === true) {
        setPhotos(response.data);
      } else {
        message.error('Failed to fetch photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      message.error('An error occurred while fetching photos');
    }
  };

  const handleUpload = async (file: File) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const createModel: CreatePhotoModel = {
      userId,
      caption: '',
      imageUrl: '',
      authorId: ''
    };
    try {
      const response = await photoService.uploadPhoto(createModel, file);
      if (response.status === true) {
        fetchPhotos();
        message.success('Photo uploaded successfully');
      } else {
        message.error(response.internalMessage || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('An error occurred while uploading the photo');
    }
  };

  const handleUpdate = async (values: { title?: string; description?: string }) => {
    if (!userId || !editingPhotoId) {
      console.error('User ID or Photo ID missing');
      return;
    }
    const updateModel: UpdatePhotoModel = {
      photoId: editingPhotoId,
      title: values.title,
      description: values.description,
    };
    try {
      const response = await photoService.updatePhoto(updateModel);
      if (response.status === true) {
        setEditingPhotoId(null);
        setIsModalVisible(false);
        form.resetFields();
        fetchPhotos();
        message.success('Photo updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update photo');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      message.error('An error occurred while updating the photo');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const reqModel: PhotoIdRequestModel = { photoId };
    try {
      const response = await photoService.deletePhoto(reqModel);
      if (response.status === true) {
        fetchPhotos();
        message.success('Photo deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      message.error('An error occurred while deleting the photo');
    }
  };

  const handleLike = async (photoId: string, isLiked: boolean) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const reqModel: LikeRequestModel = { photoId, userId };
    try {
      const response = isLiked
        ? await photoService.unlikePhoto(reqModel)
        : await photoService.likePhoto(reqModel);
      if (response.status === true) {
        fetchPhotos();
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
      title: photo.title,
      description: photo.description,
    });
  };

  if (!userId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Title level={3}>Please log in to view your photos</Title>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#fff',
        overflow: 'auto',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Photos
          </Title>
          <Upload
            beforeUpload={(file) => {
              handleUpload(file);
              return false; // Prevent default upload behavior
            }}
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />}>
              Upload Photo
            </Button>
          </Upload>
        </div>

        {/* Photos List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {photos.map((photo) => (
            <Card
              key={photo.photoId}
              title={photo.title || 'Untitled Photo'}
              extra={
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(photo)}
                  />
                  <Button
                    icon={photo.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                    onClick={() => handleLike(photo.photoId, photo.isLiked)}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(photo.photoId)}
                  />
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <img
                src={photo.url} // Assuming the photo URL is returned in the response
                alt={photo.title || 'Photo'}
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
              <p>{photo.description || 'No description'}</p>
              <p>Likes: {photo.likes || 0}</p>
            </Card>
          ))}
        </div>

        {/* Update Modal */}
        <Modal
          title="Edit Photo"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleUpdate} layout="vertical">
            <Form.Item name="title" label="Title">
              <Input placeholder="Photo Title" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} placeholder="Photo Description" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
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