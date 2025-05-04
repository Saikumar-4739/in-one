import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { LikeOutlined, DislikeOutlined, EditOutlined, DeleteOutlined, CommentOutlined, LoadingOutlined } from '@ant-design/icons';
import { PhotoHelpService } from '@in-one/shared-services';
import { PhotoIdRequestModel, PhotoTogglelikeModel } from '@in-one/shared-models';
import { motion, AnimatePresence } from 'framer-motion';

const { Text } = Typography;

interface PhotoCardSectionProps {
  photos: any[];
  loading: boolean;
  userId: string | null;
  fetchPhotos: (offset?: number, append?: boolean) => Promise<void>;
  handleEdit: (photo: any) => void;
  handlePreview: (photo: any) => void;
  selectedPhoto: any;
}

const PhotoCardSection: React.FC<PhotoCardSectionProps> = ({
  photos,
  loading,
  userId,
  fetchPhotos,
  handleEdit,
  handlePreview,
  selectedPhoto,
}) => {
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastOffset = useRef<number>(0);
  const photoService = new PhotoHelpService();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (offset !== lastOffset.current) {
          fetchPhotos(offset, true).then(() => {
            lastOffset.current = offset;
            setOffset((prev) => prev + 9);
          });
        }
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
  }, [loading, hasMore, offset, fetchPhotos]);

  const handleDelete = async (photoId: string) => {
    if (!userId) return;
    const reqModel: PhotoIdRequestModel = { photoId };
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
    }
  };

  const handleLike = async (photoId: string, isLiked: boolean) => {
    if (!userId) return;
    const reqModel: PhotoTogglelikeModel = { photoId, userId };
    try {
      const response = await photoService.toggleLike(reqModel);
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

  return (
    <motion.div
      className={`content-wrapper ${selectedPhoto ? 'preview-active' : ''}`}
      ref={contentRef}
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
                  <img src={photo.url} alt={photo.caption || 'Photo'} className="photo-img" />
                  <div className="photo-details">
                    <Space className="photo-actions">
                      <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                        <Button
                          type="text"
                          icon={photo.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleLike(photo.photoId, photo.isLiked);
                          }}
                          className={photo.isLiked ? 'liked' : ''}
                        >
                          {photo.likes || 0}
                        </Button>
                      </motion.div>
                      <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                        <Button
                          type="text"
                          icon={<CommentOutlined />}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handlePreview(photo);
                          }}
                        />
                      </motion.div>
                      <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={(e: React.MouseEvent) => {
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
  );
};

export default PhotoCardSection;