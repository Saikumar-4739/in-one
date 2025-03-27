import React, { useState, useEffect } from 'react';
import { Avatar, Modal, Button, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import './stories.css';
import { CreateStoryModel } from '@in-one/shared-models';
import { UploadChangeParam } from 'antd/es/upload';
import { StoriesHelpService } from '@in-one/shared-services';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


const Stories: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
  const [isAddStoryModalVisible, setIsAddStoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [storyContent, setStoryContent] = useState('');

  const storiesService = new StoriesHelpService();
  const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage

  useEffect(() => {
    if (userId) {
      fetchStories();
    } else {
      setFetchError('Please log in to view stories');
    }
  }, [userId]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await storiesService.getAllStories(1, 10);
      console.log('API Response:', response);
      if (response.status == true && response.data && response.data.stories) {
        setStories(response.data.stories);
      } else {
        setFetchError('No stories found');
        setStories([]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setFetchError('Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const openStory = async (story: any) => {
    setSelectedStory(story);
    setIsStoryModalVisible(true);
    if (!userId) {
      message.error('Please log in to view stories');
      return;
    }
    try {
      await storiesService.markStoryAsViewed(story.id, userId);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      message.error('Failed to mark story as viewed');
    }
  };

  const handleAddStoryClick = () => {
    if (!userId) {
      message.error('Please log in to create a story');
      return;
    }
    setIsAddStoryModalVisible(true);
  };

  const handleUploadChange = (info: UploadChangeParam) => {
    setFileList(info.fileList);
  };

  const handleCreateStory = async () => {
    if (!userId) {
      message.error('Please log in to create a story');
      return;
    }
    if (fileList.length === 0) {
      message.error('Please upload an image');
      return;
    }
  
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', fileList[0].originFileObj); // Must match 'image' in FileInterceptor
      formData.append('userId', userId);
      formData.append('content', storyContent);
      formData.append('visibility', 'public');
  
      const response = await storiesService.createStory(formData as any);
      console.log('Create Story Response:', response);
      if (response.status == true) {
        message.success('Story created successfully');
        setIsAddStoryModalVisible(false);
        setFileList([]);
        setStoryContent('');
        fetchStories();
      } else {
        throw new Error('Story creation failed');
      }
    } catch (error) {
      console.error('Error creating story:', error);
      message.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="stories-container">
      <div className="stories-list">
        {/* Add Story Button */}
        <div className="story-item add-story">
          <Button
            type="dashed"
            shape="circle"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddStoryClick}
            loading={loading}
            disabled={loading || !userId}
          />
          <p>Add Story</p>
        </div>

        {/* Display Stories */}
        {loading && !isAddStoryModalVisible ? (
          <div className="loading-lottie-co">
          <DotLottieReact className="loading-lottie"
          src="https://lottie.host/40a4dda9-19ed-44ca-a714-21abb0a8df4b/c5FKGuDCTv.lottie"
          loop
          autoplay
        />
        </div>
        ) : fetchError ? (
          <p className='j-stories-error-msg'>{fetchError}</p>
        ) : stories.length === 0 ? (
          <p className='j-stories-error-msg'>No stories available</p>
        ) : (
          stories.map((story) => (
            <motion.div
              key={story.id}
              whileTap={{ scale: 0.9 }}
              className="story-item"
              onClick={() => openStory(story)}
            >
              <Avatar size={64} src={story.imageUrl} />
              <p>{story.username}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Story Preview Modal */}
      <Modal
        open={isStoryModalVisible}
        footer={null}
        onCancel={() => setIsStoryModalVisible(false)}
        width={400}
        className="story-modal"
      >
        {selectedStory && (
          <div className="story-preview">
            <img
              src={selectedStory.imageUrl || selectedStory.storyUrl}
              alt="Story"
              className="story-image"
            />
            <p className="story-caption">@{selectedStory.username}</p>
            {selectedStory.content && (
              <p className="story-content">{selectedStory.content}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Add Story Modal */}
      <Modal
        title="Create New Story"
        open={isAddStoryModalVisible}
        onOk={handleCreateStory}
        onCancel={() => {
          setIsAddStoryModalVisible(false);
          setFileList([]);
          setStoryContent('');
        }}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <Upload
          listType="picture"
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={() => false}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>
        <textarea
          value={storyContent}
          onChange={(e) => setStoryContent(e.target.value)}
          placeholder="Add a caption..."
          className="story-textarea"
          rows={4}
          style={{ width: '100%', marginTop: '10px' }}
        />
      </Modal>
    </div>
  );
};

export default Stories;