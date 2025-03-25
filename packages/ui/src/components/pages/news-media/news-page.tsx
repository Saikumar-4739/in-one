import React, { useState, useEffect, useRef } from 'react';
import { CreateNewsModel, UpdateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { Button, Card, message, Space, Typography, Input, Form, List, Upload, Select, Modal, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LikeOutlined, DislikeOutlined, CommentOutlined, UploadOutlined, CloseOutlined, ShareAltOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadFile } from 'antd/es/upload/interface';
import './news-page.css';

const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAC8CAMAAAB8Zmf2AAAAA1BMVEX///+nxBvIAAAAIElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAADwGxiKAAEvqP0yAAAAAElFTkSuQmCC';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(6);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [commentNewsId, setCommentNewsId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const newsService = new NewsHelpService();
  const [loading, setLoading] = useState<boolean>(false);
  const newsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNews();
  }, [currentPage, categoryFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && news.length < total) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    if (newsContainerRef.current) {
      newsContainerRef.current.appendChild(sentinel);
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel && newsContainerRef.current) {
        observer.unobserve(sentinel);
        newsContainerRef.current.removeChild(sentinel);
      }
    };
  }, [loading, news.length, total]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAllNews(currentPage, pageSize);
      if (response.status) {
        let filteredNews = response.data.news || [];
        if (categoryFilter) {
          filteredNews = filteredNews.filter((item: any) => item.category === categoryFilter);
        }
        setNews((prev) => {
          const newNews = currentPage === 1 ? filteredNews : [...prev, ...filteredNews];
          const uniqueNews = Array.from(new Map(newNews.map((item: { id: any; }) => [item.id, item])).values());
          return uniqueNews;
        });
        setTotal(response.data.total || 0);
      } else {
        message.error(response.internalMessage || 'Failed to fetch news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while fetching news');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (values: any) => {
    if (!userId) {
      message.error('Please log in to create news');
      return;
    }

    setLoading(true);
    try {
      let imageBase64: string[] = [];
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const base64DataUrl = await fileToBase64(fileList[0].originFileObj);
        imageBase64 = [base64DataUrl.split(',')[1]];
      }

      const createModel: CreateNewsModel = new CreateNewsModel(
        values.title,
        values.content,
        userId,
        values.summary || '',
        values.category,
        values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        imageBase64.length > 0 ? imageBase64 : undefined,
        values.thumbnail || '',
        'draft',
        values.visibility || 'public',
        values.isFeatured || false,
        values.isBreaking || false,
        new Date()
      );

      const response = await newsService.createNews(createModel);
      if (response.status) {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        setFileList([]);
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success('News created successfully');
      } else {
        message.error(response.internalMessage || 'Failed to create news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while creating news');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNews = async (values: any) => {
    if (!userId || !editingNewsId) {
      message.error('User ID or News ID missing');
      return;
    }

    setLoading(true);
    try {
      const updateModel: UpdateNewsModel = {
        title: values.title,
        content: values.content,
        newsId: editingNewsId,
        visibility: values.visibility,
      };
      const response = await newsService.updateNews(editingNewsId, updateModel);
      if (response.status) {
        setIsUpdateModalVisible(false);
        setEditingNewsId(null);
        updateForm.resetFields();
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success('News updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while updating news');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    setLoading(true);
    try {
      const response = await newsService.deleteNews(id);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        setSelectedNews(null);
        message.success('News deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while deleting news');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (id: string, isLiked: boolean) => {
    if (!userId) {
      message.error('Please log in to like news');
      return;
    }

    setLoading(true);
    try {
      const response = await newsService.toggleLikeNews(id);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success(`News ${isLiked ? 'unliked' : 'liked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isLiked ? 'unlike' : 'like'} news`);
      }
    } catch (error: any) {
      message.error(error.message || `An error occurred while ${isLiked ? 'unliking' : 'liking'} news`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDislike = async (id: string, isDisliked: boolean) => {
    if (!userId) {
      message.error('Please log in to dislike news');
      return;
    }

    setLoading(true);
    try {
      const response = await newsService.toggleDislikeNews(id);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success(`News ${isDisliked ? 'undisliked' : 'disliked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isDisliked ? 'undislike' : 'dislike'} news`);
      }
    } catch (error: any) {
      message.error(error.message || `An error occurred while ${isDisliked ? 'undisliking' : 'disliking'} news`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareNews = async (id: string) => {
    if (!userId) {
      message.error('Please log in to share news');
      return;
    }

    setLoading(true);
    try {
      const platform = prompt('Enter platform to share (e.g., Twitter, Facebook):') || 'General';
      const response = await newsService.shareNews(id, platform);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success(`News shared on ${platform} successfully`);
      } else {
        message.error(response.internalMessage || 'Failed to share news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while sharing news');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkImportant = async (id: string, isImportant: boolean) => {
    if (!userId) {
      message.error('Please log in to mark news');
      return;
    }

    setLoading(true);
    try {
      const response = await newsService.markNewsAsImportant(id, !isImportant);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success(`News marked as ${!isImportant ? 'important' : 'not important'} successfully`);
      } else {
        message.error(response.internalMessage || 'Failed to mark news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while marking news');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (values: { content: string }) => {
    if (!userId || !commentNewsId) {
      message.error('User ID or News ID missing');
      return;
    }

    setLoading(true);
    try {
      const commentModel: CreateCommentModel = {
        authorId: userId,
        newsId: commentNewsId,
        content: values.content,
      };
      const response = await newsService.addComment(commentModel);
      if (response.status) {
        setIsCommentModalVisible(false);
        commentForm.resetFields();
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success('Comment added successfully');
      } else {
        message.error(response.internalMessage || 'Failed to add comment');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while adding comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setLoading(true);
    try {
      const response = await newsService.deleteComment(commentId);
      if (response.status) {
        setCurrentPage(1);
        setNews([]);
        fetchNews();
        message.success('Comment deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete comment');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while deleting comment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (newsItem: any) => {
    if (newsItem.author.id !== userId) {
      message.error('You can only edit news you created');
      return;
    }
    setEditingNewsId(newsItem.id);
    setIsUpdateModalVisible(true);
    updateForm.setFieldsValue({
      title: newsItem.title,
      content: newsItem.content,
      visibility: newsItem.visibility,
    });
  };

  const handleComment = (newsId: string) => {
    setCommentNewsId(newsId);
    setIsCommentModalVisible(true);
  };

  const handleFullView = async (newsItem: any) => {
    setLoading(true);
    try {
      const updatedNews = { ...newsItem, views: (newsItem.views || 0) + 1 };
      setSelectedNews(updatedNews);
      await newsService.updateNews(newsItem.id, { views: updatedNews.views } as any);
      setNews((prev) => prev.map((item) => (item.id === newsItem.id ? updatedNews : item)));
    } catch (error: any) {
      message.error(error.message || 'An error occurred while updating view count');
    } finally {
      setLoading(false);
    }
  };

  const closeFullView = () => {
    setSelectedNews(null);
  };

  const getNewsImage = (newsItem: any) =>
    newsItem.images && newsItem.images.length > 0 ? newsItem.images[0] : null;

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: UploadFile) => {
      setFileList([file]);
      return false;
    },
    fileList,
    accept: 'image/*',
    maxCount: 1,
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const breakingNews = news.find((item) => item.isBreaking) || null;
  const categories = Array.from(new Set(news.map((item) => item.category)));

  return (
    <div className="news-page-container">
      <div className="news-content-wrapper">
        <motion.div
          className="news-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {userId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              className="create-news-btn"
            >
              Create News
            </Button>
          )}
        </motion.div>

        {breakingNews && (
          <motion.div
            className="breaking-news-wrapper"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="breaking-news-section">
              Breaking: {breakingNews.title}
            </div>
            <Select
              className="category-dropdown-inline"
              placeholder="Select Category"
              onChange={(value: string) => {
                setCategoryFilter(value);
                setCurrentPage(1);
                setNews([]);
              }}
              allowClear
              onClear={() => {
                setCategoryFilter(null);
                setCurrentPage(1);
                setNews([]);
              }}
            >
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </motion.div>
        )}

        <div className="main-content">
          <div className={`news-grid-container ${selectedNews ? 'with-full-view' : ''}`} ref={newsContainerRef}>
            <motion.div variants={sectionVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {loading && news.length === 0 ? (
                  <div className="loading-text">
                    <Text>Loading...</Text>
                  </div>
                ) : news.length === 0 ? (
                  <div className="no-news-text">
                    <Text>No news available.</Text>
                  </div>
                ) : (
                  <div className="latest-news-grid">
                    {news.length > 0 && (
                      (() => {
                        // Find the news item with the most views
                        const mostViewedNews = news.reduce((prev, current) =>
                          (prev.views || 0) > (current.views || 0) ? prev : current
                        );
                        const otherNews = news.filter((item) => item.id !== mostViewedNews.id);

                        return (
                          <>
                            {/* Big Card for Most Viewed News */}
                            <motion.div
                              key={mostViewedNews.id}
                              variants={cardVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover="hover"
                              transition={{ duration: 0.4 }}
                              className="big-card-wrapper"
                            >
                              <Card
                                className="news-card big-card"
                                hoverable
                                onClick={() => handleFullView(mostViewedNews)}
                                cover={
                                  getNewsImage(mostViewedNews) ? (
                                    <img
                                      alt={mostViewedNews.title}
                                      src={getNewsImage(mostViewedNews)}
                                      className="news-card-image big-card-image"
                                      onError={(e) => {
                                        e.currentTarget.src = placeholderImage;
                                      }}
                                    />
                                  ) : (
                                    <div className="news-card-placeholder big-card-placeholder">
                                      <img src={placeholderImage} alt="No Image" />
                                    </div>
                                  )
                                }
                              >
                                <Text className="news-card-title big-card-title">
                                  {mostViewedNews.title.slice(0, 80)}
                                  {mostViewedNews.title.length > 80 ? '...' : ''}
                                </Text>
                                <Space className="news-card-meta big-card-meta">
                                  <Text>
                                    <LikeOutlined /> {mostViewedNews.likes || 0}
                                  </Text>
                                  <Text>
                                    <DislikeOutlined /> {mostViewedNews.dislikes || 0}
                                  </Text>
                                  <Text>
                                    <CommentOutlined /> {mostViewedNews.comments?.length || 0}
                                  </Text>
                                  <Text>
                                    <EyeOutlined /> {mostViewedNews.views || 0}
                                  </Text>
                                </Space>
                              </Card>
                            </motion.div>

                            {/* Normal Cards for Other News */}
                            {otherNews.map((newsItem) => (
                              <motion.div
                                key={newsItem.id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                transition={{ duration: 0.4 }}
                              >
                                <Card
                                  className="news-card"
                                  hoverable
                                  onClick={() => handleFullView(newsItem)}
                                  cover={
                                    getNewsImage(newsItem) ? (
                                      <img
                                        alt={newsItem.title}
                                        src={getNewsImage(newsItem)}
                                        className="news-card-image"
                                        onError={(e) => {
                                          e.currentTarget.src = placeholderImage;
                                        }}
                                      />
                                    ) : (
                                      <div className="news-card-placeholder">
                                        <img src={placeholderImage} alt="No Image" />
                                      </div>
                                    )
                                  }
                                >
                                  <Text className="news-card-title">
                                    {newsItem.title.slice(0, 60)}
                                    {newsItem.title.length > 60 ? '...' : ''}
                                  </Text>
                                  <Space className="news-card-meta">
                                    <Text>
                                      <LikeOutlined /> {newsItem.likes || 0}
                                    </Text>
                                    <Text>
                                      <DislikeOutlined /> {newsItem.dislikes || 0}
                                    </Text>
                                    <Text>
                                      <CommentOutlined /> {newsItem.comments?.length || 0}
                                    </Text>
                                    <Text>
                                      <EyeOutlined /> {newsItem.views || 0}
                                    </Text>
                                  </Space>
                                </Card>
                              </motion.div>
                            ))}
                          </>
                        );
                      })()
                    )}
                  </div>
                )}
              </AnimatePresence>
              {loading && news.length > 0 && (
                <div className="loading-text">
                  <Text>Loading more...</Text>
                </div>
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {selectedNews && (
              <motion.div
                className="full-view-container"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <div className="full-view-header">
                  <Text strong className="full-view-title">{selectedNews.title}</Text>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={closeFullView}
                    className="close-full-view-btn"
                  />
                </div>
                <div className="full-view-content">
                  {getNewsImage(selectedNews) ? (
                    <img
                      src={getNewsImage(selectedNews)}
                      alt={selectedNews.title}
                      className="full-view-image"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage;
                      }}
                    />
                  ) : (
                    <div className="full-view-placeholder">
                      <img src={placeholderImage} alt="No Image" />
                    </div>
                  )}
                  <div>
                    <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
                      Category:
                    </Text>
                    <Text style={{ display: 'inline', marginLeft: '5px' }}>
                      {selectedNews.category || 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
                      Published:
                    </Text>{' '}
                    <Text style={{ display: 'inline', marginLeft: '5px' }}>
                      {selectedNews.publishedAt ? new Date(selectedNews.publishedAt).toLocaleString() : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ display: 'inline', fontWeight: 'bold' }}>
                      Visibility:
                    </Text>{' '}
                    <Text style={{ display: 'inline', marginLeft: '5px' }}>
                      {selectedNews.visibility}
                    </Text>
                  </div>
                  <Text strong>Content:</Text> <p>{selectedNews.content || 'No content available.'}</p>
                  {selectedNews.tags?.length > 0 && (
                    <div>
                      <Text strong>Tags:</Text>{' '}
                      {selectedNews.tags.map((tag: string) => (
                        <Tag key={tag} color="purple" className="news-tag">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <Space className="full-view-actions">
                    <Button
                      icon={<LikeOutlined />}
                      onClick={() => handleToggleLike(selectedNews.id, selectedNews.isLiked)}
                      loading={loading}
                    >
                      {selectedNews.likes || 0}
                    </Button>
                    <Button
                      icon={<DislikeOutlined />}
                      onClick={() => handleToggleDislike(selectedNews.id, selectedNews.isDisliked)}
                      loading={loading}
                    >
                      {selectedNews.dislikes || 0}
                    </Button>
                    <Button
                      icon={<ShareAltOutlined />}
                      onClick={() => handleShareNews(selectedNews.id)}
                      loading={loading}
                    >
                      {selectedNews.shares || 0}
                    </Button>
                    <Button
                      icon={<StarOutlined />}
                      onClick={() => handleMarkImportant(selectedNews.id, selectedNews.isImportant)}
                      loading={loading}
                      type={selectedNews.isImportant ? 'primary' : 'default'}
                    >
                      {selectedNews.isImportant ? 'Important' : 'Mark Important'}
                    </Button>
                    <Button
                      icon={<CommentOutlined />}
                      onClick={() => handleComment(selectedNews.id)}
                    >
                      {selectedNews.comments?.length || 0}
                    </Button>
                    {selectedNews.author.id === userId && (
                      <>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(selectedNews)}
                        >
                          Edit
                        </Button>
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => handleDeleteNews(selectedNews.id)}
                          loading={loading}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Space>
                  {selectedNews.comments?.length > 0 ? (
                    <List
                      header={<Text strong>Comments</Text>}
                      dataSource={selectedNews.comments}
                      renderItem={(comment: any) => (
                        <List.Item
                          actions={
                            comment.authorId === userId
                              ? [
                                <Button
                                  type="link"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  Delete
                                </Button>,
                              ]
                              : []
                          }
                        >
                          <List.Item.Meta
                            title={comment.userName || 'Anonymous'}
                            description={comment.content || 'No content'}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text>No comments available.</Text>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Modal
          title="Create News"
          open={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          footer={null}
        >
          <Form form={createForm} onFinish={handleCreateNews} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Please enter content' }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please enter a category' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="tags" label="Tags">
              <Input placeholder="comma-separated tags" />
            </Form.Item>
            <Form.Item name="visibility" label="Visibility" initialValue="public">
              <Select>
                <Option value="public">Public</Option>
                <Option value="private">Private</Option>
              </Select>
            </Form.Item>
            <Form.Item name="image" label="Image">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create
            </Button>
          </Form>
        </Modal>

        <Modal
          title="Update News"
          open={isUpdateModalVisible}
          onCancel={() => setIsUpdateModalVisible(false)}
          footer={null}
        >
          <Form form={updateForm} onFinish={handleUpdateNews} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Please enter content' }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="visibility" label="Visibility">
              <Select>
                <Option value="public">Public</Option>
                <Option value="private">Private</Option>
              </Select>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update
            </Button>
          </Form>
        </Modal>

        <Modal
          title="Add Comment"
          open={isCommentModalVisible}
          onCancel={() => setIsCommentModalVisible(false)}
          footer={null}
        >
          <Form form={commentForm} onFinish={handleAddComment} layout="vertical">
            <Form.Item name="content" label="Comment" rules={[{ required: true, message: 'Please enter a comment' }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Add Comment
            </Button>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default NewsPage;