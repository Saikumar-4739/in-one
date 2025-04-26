import React, { useState, useEffect } from 'react';
import { UpdateVideoModel } from '@in-one/shared-models';
import { Button, Upload, message, Typography, Modal, Form, Progress, Input, Tag } from 'antd';
import { UploadOutlined, PlayCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoHelpService } from '@in-one/shared-services';
import { AxiosProgressEvent } from 'axios';
import FormData from 'form-data';
import { useNavigate } from 'react-router-dom';
import './video-page.css';
import VideoDetail from './video-detail';

const { Title, Text } = Typography;

interface Video {
  id: string;
  videoUrl: string;
  title: string;
  description?: string;
  createdAt: string;
  views?: number;
  likes: { user: { id: string } }[];
  likeCount: number;
}

const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const pastDate = new Date(dateString);
  const diffInMs = now.getTime() - pastDate.getTime();

  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
};

const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const videoService = new VideoHelpService();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchVideos();
    }
  }, [userId, searchQuery]);

  const fetchVideos = async () => {
    try {
      const response = await videoService.getAllVideos();
      if (response.status) {
        setVideos(response.data);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  const handleFileChange = (info: any) => {
    const file = info.file as File;
    if (file) {
      setSelectedFile(file);
      setIsUploadModalVisible(true);
    }
  };

  const handleUpload = async (values: { title: string; description?: string }) => {
    if (!userId || !selectedFile) {
      message.error('Please select a file and log in');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', userId);
    formData.append('title', values.title);
    if (values.description) formData.append('description', values.description);

    try {
      const response = await videoService.uploadVideo(formData, {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const percent = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percent);
        },
      });

      if (response.status) {
        fetchVideos();
        message.success('Video uploaded successfully');
        setIsUploadModalVisible(false);
        uploadForm.resetFields();
        setSelectedFile(null);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error) {
      message.error('Upload error occurred');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async (values: { title?: string; description?: string }) => {
    if (!userId || !editingVideo) return;

    const updateModel: UpdateVideoModel = {
      videoId: editingVideo.id,
      title: values.title,
      description: values.description,
    };

    try {
      const response = await videoService.updateVideo(updateModel);
      if (response.status) {
        setIsModalVisible(false);
        form.resetFields();
        fetchVideos();
        message.success('Video updated');
      }
    } catch (error) {
      message.error('Update failed');
    }
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`, { state: { video } });
  };

  if (!userId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="login-message"
      >
        <Title level={3}>Please log in to view your videos</Title>
      </motion.div>
    );
  }

  return (
    <div className="video-page">

      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="j-header">
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0px 25px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <VideoCameraOutlined style={{ fontSize: 24, color: '#4A90E2', marginRight: 10 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}></Text>
          </div>
          <Upload beforeUpload={() => false} onChange={handleFileChange} showUploadList={false} disabled={isUploading}>
            <Button className="get-started-btn" type="primary" icon={<UploadOutlined />} loading={isUploading}>Upload</Button>
          </Upload>
        </div>
      </motion.div>


      <div className="container">

        {isUploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>Uploading...</Typography.Title>
            <Progress type="circle" percent={uploadProgress} strokeColor="#1890ff" />
          </motion.div>
        )}

        <AnimatePresence>
          <div
            className="video-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', overflowY: 'auto', scrollbarWidth: 'none', maxHeight: '100vh', paddingRight: 10 }}>
            {videos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="video-item"
                style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto', scrollbarWidth: 'none' }}>
                <div className="video-content" onClick={() => handleVideoClick(video)}>
                  <div className="video-thumbnail">
                    {video.videoUrl.endsWith('.mp4') ? (
                      <video src={video.videoUrl} preload="metadata" className="thumbnail-video" muted style={{ width: '100%' }} />
                    ) : (
                      <img src={video.videoUrl} alt={video.title} className="thumbnail-image" style={{ width: '100%' }} />
                    )}
                    <PlayCircleOutlined className="play-icon" />
                  </div>
                  <div className="video-details" style={{ padding: '8px' }}>
                    <Text strong className="video-title">{video.title}</Text>
                    <Text ellipsis={{ tooltip: video.description }} className="video-description">
                      {video.description || 'No description'}
                    </Text>
                    <div className="video-meta">
                      <Tag color="red">{getRelativeTime(video.createdAt)}</Tag>
                      <Tag color="blue">{video.views || 0} views</Tag>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        <Modal
          title="Edit Video"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          centered
          width={800}
          className="edit-modal"
        >
          <div className="edit-modal-content">
            {editingVideo && (<video src={editingVideo.videoUrl} controls className="modal-video-player" />)}
            <Form form={form} onFinish={handleUpdate} layout="vertical" className="edit-form">

              <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
                <Input placeholder="Video Title" />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} placeholder="Video Description" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Update
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Modal>

        <Modal
          title="Upload New Video"
          open={isUploadModalVisible}
          onCancel={() => { setIsUploadModalVisible(false); setSelectedFile(null); uploadForm.resetFields(); }}
          footer={null}
          centered
          className="upload-modal"
        >
          <Form form={uploadForm} onFinish={handleUpload} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]} initialValue={selectedFile?.name || 'Untitled Video'}>
              <Input placeholder="Video Title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} placeholder="Video Description" />
            </Form.Item>

            <Form.Item label="Selected File">
              <Text>{selectedFile?.name || 'No file selected'}</Text>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUploading}>
                Upload
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default VideosPage;
export { VideoDetail };