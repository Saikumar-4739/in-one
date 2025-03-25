import React, { useState } from 'react';
import { Avatar, Modal, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import './stories.css'; // Import styles

const dummyStories = [
  {
    id: 1,
    username: 'John',
    imageUrl: 'https://picsum.photos/100/100?1',
    storyUrl: 'https://picsum.photos/400/700?1',
  },
  {
    id: 2,
    username: 'Sarah',
    imageUrl: 'https://picsum.photos/100/100?2',
    storyUrl: 'https://picsum.photos/400/700?2',
  },
  {
    id: 3,
    username: 'Mike',
    imageUrl: 'https://picsum.photos/100/100?3',
    storyUrl: 'https://picsum.photos/400/700?3',
  },
  {
    id: 4,
    username: 'Emily',
    imageUrl: 'https://picsum.photos/100/100?4',
    storyUrl: 'https://picsum.photos/400/700?4',
  },
];

const Stories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);

  const openStory = (story: any) => {
    setSelectedStory(story);
    setIsStoryModalVisible(true);
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
          />
          <p>Add Story</p>
        </div>

        {/* Display Dummy Stories */}
        {dummyStories.map((story) => (
          <motion.div
            key={story.id}
            whileTap={{ scale: 0.9 }}
            className="story-item"
            onClick={() => openStory(story)}
          >
            <Avatar size={64} src={story.imageUrl} />
            <p>{story.username}</p>
          </motion.div>
        ))}
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
              src={selectedStory.storyUrl}
              alt="Story"
              className="story-image"
            />
            <p className="story-caption">@{selectedStory.username}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stories;
