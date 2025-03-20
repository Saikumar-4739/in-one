import React, { useState, useEffect } from 'react';
import { UpdateVideoModel, VideoIdRequestModel, LikeVideoModel } from '@in-one/shared-models';
import { Button, Card, Upload, message, Space, Typography, Input, Modal, Form } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';
import FormData from 'form-data';
import { VideoHelpService } from '@in-one/shared-services';

const { Title } = Typography;

const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const videoService = new VideoHelpService();

  useEffect(() => {
    if (userId) {
      fetchVideos();
    }
  }, [userId]);

  const fetchVideos = async () => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await videoService.getAllVideos();
      if (response.status === true) {
        setVideos(response.data);
      } else {
        message.error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      message.error('An error occurred while fetching videos');
    }
  };

  const handleUpload = async (file: File) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', userId);

    try {
      const response = await videoService.uploadVideo(formData);
      if (response.status === true) {
        fetchVideos();
        message.success('Video uploaded successfully');
      } else {
        message.error(response.internalMessage || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      message.error('An error occurred while uploading the video');
    }
  };

  const handleUpdate = async (values: { title?: string; description?: string }) => {
    if (!userId || !editingVideoId) {
      console.error('User ID or Video ID missing');
      return;
    }
    const updateModel: UpdateVideoModel = {
      videoId: editingVideoId,
      title: values.title,
      description: values.description,
    };
    try {
      const response = await videoService.updateVideo(updateModel);
      if (response.status === true) {
        setEditingVideoId(null);
        setIsModalVisible(false);
        form.resetFields();
        fetchVideos();
        message.success('Video updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      message.error('An error occurred while updating the video');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const reqModel: VideoIdRequestModel = { videoId };
    try {
      const response = await videoService.deleteVideo(reqModel);
      if (response.status === true) {
        fetchVideos();
        message.success('Video deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      message.error('An error occurred while deleting the video');
    }
  };

  const handleLike = async (videoId: string, isLiked: boolean) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const reqModel: LikeVideoModel = { videoId, userId };
    try {
      const response = isLiked
        ? await videoService.unlikeVideo(reqModel)
        : await videoService.likeVideo(reqModel);
      if (response.status === true) {
        fetchVideos();
        message.success(`Video ${isLiked ? 'unliked' : 'liked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isLiked ? 'unlike' : 'like'} video`);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} video:`, error);
      message.error(`An error occurred while ${isLiked ? 'unliking' : 'liking'} the video`);
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideoId(video.videoId);
    setIsModalVisible(true);
    form.setFieldsValue({
      title: video.title,
      description: video.description,
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
          backgroundColor: '#fff',
        }}
      >
        <Title level={3}>Please log in to view your videos</Title>
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
            Videos
          </Title>
          <Upload
            beforeUpload={(file) => {
              handleUpload(file);
              return false; // Prevent default upload behavior
            }}
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />}>
              Upload Video
            </Button>
          </Upload>
        </div>

        {/* Videos List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {videos.map((video) => (
            <Card
              key={video.videoId}
              title={video.title || 'Untitled Video'}
              extra={
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(video)}
                  />
                  <Button
                    icon={video.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                    onClick={() => handleLike(video.videoId, video.isLiked)}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(video.videoId)}
                  />
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <video
                controls
                src={video.url} // Assuming the video URL is returned in the response
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
              <p>{video.description || 'No description'}</p>
              <p>Likes: {video.likes || 0}</p>
            </Card>
          ))}
        </div>

        {/* Update Modal */}
        <Modal
          title="Edit Video"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleUpdate} layout="vertical">
            <Form.Item name="title" label="Title">
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
      </div>
    </div>
  );
};

export default VideosPage;