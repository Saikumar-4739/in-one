import React, { useState, useEffect } from 'react';
import { CreateNewsModel, UpdateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { Button, Card, message, Space, Typography, Input, Modal, Form, Pagination, List, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LikeOutlined, DislikeOutlined, CommentOutlined, UploadOutlined } from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
};

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(8);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isFullViewModalVisible, setIsFullViewModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [commentNewsId, setCommentNewsId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const newsService = new NewsHelpService();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchNews();
  }, [currentPage]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAllNews(currentPage, pageSize);
      if (response.status) {
        setNews(response.data.news || []);
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
        'public',
        false,
        false,
        new Date()
      );

      const response = await newsService.createNews(createModel);
      if (response.status) {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        setFileList([]);
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
      };
      const response = await newsService.updateNews(editingNewsId, updateModel);
      if (response.status) {
        setIsUpdateModalVisible(false);
        setEditingNewsId(null);
        updateForm.resetFields();
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
        fetchNews();
        setIsFullViewModalVisible(false);
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
    setEditingNewsId(newsItem.id);
    setIsUpdateModalVisible(true);
    updateForm.setFieldsValue({
      title: newsItem.title,
      content: newsItem.content,
    });
  };

  const handleComment = (newsId: string) => {
    setCommentNewsId(newsId);
    setIsCommentModalVisible(true);
  };

  const handleFullView = (newsItem: any) => {
    setSelectedNews(newsItem);
    setIsFullViewModalVisible(true);
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

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: "#fff",
      padding: '80px 20px 20px',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        padding: '24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
        News
          </Title>
          {userId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              style={{
                background: 'linear-gradient(45deg, #1890ff, #40c4ff)',
                border: 'none',
              }}
            >
              Create News
            </Button>
          )}
        </motion.div>

        <AnimatePresence>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Loading...</Text>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {news.map((newsItem) => (
                <motion.div
                  key={newsItem.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ duration: 0.4 }}
                  onClick={() => handleFullView(newsItem)}
                >
                  <Card
                    hoverable
                    cover={
                      getNewsImage(newsItem) ? (
                        <img
                          alt={newsItem.title}
                          src={getNewsImage(newsItem)}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '12px 12px 0 0',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '200px',
                          background: '#f0f2f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px 12px 0 0',
                        }}>
                          No Image
                        </div>
                      )
                    }
                    style={{
                      borderRadius: '12px',
                      border: 'none',
                      overflow: 'hidden',
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      {newsItem.title.slice(0, 60)}{newsItem.title.length > 60 ? '...' : ''}
                    </Text>
                    <Space>
                      <Text><LikeOutlined /> {newsItem.likes || 0}</Text>
                      <Text><CommentOutlined /> {newsItem.comments?.length || 0}</Text>
                    </Space>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page) => setCurrentPage(page)}
          style={{ marginTop: '32px', textAlign: 'center' }}
          disabled={loading}
        />

        {/* Create Modal */}
        <Modal
          title="Create News"
          visible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          footer={null}
        >
          <Form form={createForm} onFinish={handleCreateNews} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="tags" label="Tags">
              <Input placeholder="comma-separated tags" />
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

        {/* Update Modal */}
        <Modal
          title="Update News"
          visible={isUpdateModalVisible}
          onCancel={() => setIsUpdateModalVisible(false)}
          footer={null}
        >
          <Form form={updateForm} onFinish={handleUpdateNews} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update
            </Button>
          </Form>
        </Modal>

        {/* Comment Modal */}
        <Modal
          title="Add Comment"
          visible={isCommentModalVisible}
          onCancel={() => setIsCommentModalVisible(false)}
          footer={null}
        >
          <Form form={commentForm} onFinish={handleAddComment} layout="vertical">
            <Form.Item name="content" label="Comment" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Add Comment
            </Button>
          </Form>
        </Modal>

        {/* Full View Modal */}
        <Modal
          title={selectedNews?.title}
          visible={isFullViewModalVisible}
          onCancel={() => setIsFullViewModalVisible(false)}
          footer={[
            <Space key="actions">
              <Button
                icon={selectedNews?.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                onClick={() => handleToggleLike(selectedNews.id, selectedNews.isLiked)}
                loading={loading}
              >
                {selectedNews?.likes || 0}
              </Button>
              <Button
                icon={<CommentOutlined />}
                onClick={() => handleComment(selectedNews?.id)}
              >
                {selectedNews?.comments?.length || 0}
              </Button>
              {selectedNews?.userId === userId && (
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
            </Space>,
          ]}
          width="80%"
        >
          {selectedNews && (
            <>
              {getNewsImage(selectedNews) && (
                <img
                  src={getNewsImage(selectedNews)}
                  alt={selectedNews.title}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', marginBottom: '16px' }}
                />
              )}
              <Text strong>Category:</Text> <Text>{selectedNews.category}</Text><br />
              <Text strong>Published:</Text> <Text>{new Date(selectedNews.publishedAt).toLocaleString()}</Text><br />
              <Text strong>Content:</Text> <p>{selectedNews.content}</p>
              {selectedNews.tags?.length > 0 && (
                <div>
                  <Text strong>Tags:</Text>{' '}
                  {selectedNews.tags.map((tag: string) => (
                    <span key={tag} style={{ marginRight: '8px' }}>#{tag}</span>
                  ))}
                </div>
              )}
              {selectedNews.comments?.length > 0 && (
                <List
                  header={<Text strong>Comments</Text>}
                  dataSource={selectedNews.comments}
                  renderItem={(comment: any) => (
                    <List.Item
                      actions={
                        comment.userId === userId
                          ? [<Button type="link" onClick={() => handleDeleteComment(comment.id)}>Delete</Button>]
                          : []
                      }
                    >
                      <List.Item.Meta
                        title={comment.userName || 'Anonymous'}
                        description={comment.content}
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default NewsPage;