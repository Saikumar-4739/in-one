import React, { useState, useEffect } from 'react';
import { UpdateVideoModel, VideoIdRequestModel, LikeVideoModel } from '@in-one/shared-models';
import { Button, Card, Upload, message, Typography, Modal, Form, Progress, Input } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoHelpService } from '@in-one/shared-services';
import './video-page.css';
import { AxiosProgressEvent } from 'axios';
import FormData from 'form-data';

const { Title, Text } = Typography;

interface UploadRequestOption {
  file: File | Blob | string;
  filename?: string;
  data?: any;
  headers?: any;
  onProgress?: (event: ProgressEvent) => void;
  onError?: (event: Error) => void;
  onSuccess?: (body: any, xhr?: XMLHttpRequest) => void;
}

const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const videoService = new VideoHelpService();

  useEffect(() => {
    if (userId) fetchVideos();
  }, [userId]);

  const fetchVideos = async () => {
    try {
      const response = await videoService.getAllVideos();
      if (response.status) setVideos(response.data);
      else message.error('Failed to fetch videos');
    } catch (error) {
      message.error('Error fetching videos');
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
        message.error(response.internalMessage || 'Upload failed');
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

  const handleDelete = async (videoId: string) => {
    const reqModel: VideoIdRequestModel = { videoId };
    try {
      const response = await videoService.deleteVideo(reqModel);
      if (response.status) {
        fetchVideos();
        message.success('Video deleted');
      }
    } catch (error) {
      message.error('Delete failed');
    }
  };

  const handleLike = async (videoId: string, isLiked: boolean) => {
    const reqModel: LikeVideoModel = { videoId, userId: userId! };
    try {
      const response = isLiked
        ? await videoService.unlikeVideo(reqModel)
        : await videoService.likeVideo(reqModel);
      if (response.status) {
        fetchVideos();
        message.success(`Video ${isLiked ? 'unliked' : 'liked'}`);
      }
    } catch (error) {
      message.error('Like action failed');
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setIsModalVisible(true);
    form.setFieldsValue({ title: video.title, description: video.description });
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
      <div className="container">
        {/* YouTube-like Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="header"
        >
          <Title level={2} style={{ margin: 0 }}>
            Videos
          </Title>
          <Upload
            beforeUpload={() => false}
            onChange={handleFileChange}
            showUploadList={false}
            disabled={isUploading}
          >
            <Button
              type="default"
              icon={<UploadOutlined />}
              loading={isUploading}
              style={{ borderRadius: '4px' }}
            >
              Upload
            </Button>
          </Upload>
        </motion.div>

        {isUploading && (
          <Progress percent={uploadProgress} className="upload-progress" />
        )}

        {/* Video Grid */}
        <AnimatePresence>
          <div className="video-grid">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  hoverable
                  cover={
                    <div className="video-container">
                      {video.videoUrl.endsWith('.mp4') ? (
                        <video
                          src={video.videoUrl}
                          controls
                          preload="metadata"
                          className="video-player"
                        />
                      ) : (
                        <img
                          src={video.videoUrl}
                          alt={video.title}
                          className="image-player"
                        />
                      )}
                      <PlayCircleOutlined className="play-icon" />
                    </div>
                  }
                  actions={[
                    <EditOutlined key="edit" onClick={() => handleEdit(video)} />,
                    <span
                      onClick={() => handleLike(video.id, video.likes?.some((l: any) => l.user?.id === userId))}
                      className="like-action"
                    >
                      {video.likes?.some((l: any) => l.user?.id === userId) ? (
                        <DislikeOutlined />
                      ) : (
                        <LikeOutlined />
                      )}
                      <Text>{video.likes?.length || 0}</Text>
                    </span>,
                    <DeleteOutlined key="delete" onClick={() => handleDelete(video.id)} />,
                    <EyeOutlined key="views" />,
                    <Text>{video.views || 0}</Text>,
                  ]}
                  style={{ border: 'none' }}
                >
                  <Card.Meta
                    title={<Text strong>{video.title}</Text>}
                    description={
                      <div>
                        <Text ellipsis={{ tooltip: video.description }}>
                          {video.description || 'No description'}
                        </Text>
                        <Text type="secondary" className="views-text">
                          {new Date(video.uploadDate).toLocaleDateString()} • {video.views || 0} views
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Edit Modal */}
        <Modal
          title="Edit Video"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          centered
        >
          <Form form={form} onFinish={handleUpdate} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
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
        </Modal>

        {/* Upload Modal */}
        <Modal
          title="Upload New Video"
          open={isUploadModalVisible}
          onCancel={() => {
            setIsUploadModalVisible(false);
            setSelectedFile(null);
            uploadForm.resetFields();
          }}
          footer={null}
          centered
        >
          <Form form={uploadForm} onFinish={handleUpload} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
              initialValue={selectedFile?.name || 'Untitled Video'}
            >
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