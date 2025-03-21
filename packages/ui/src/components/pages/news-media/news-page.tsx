import React, { useState, useEffect } from 'react';
import { CreateNewsModel, UpdateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { Button, Card, message, Space, Typography, Input, Modal, Form, Pagination, List, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LikeOutlined, DislikeOutlined, CommentOutlined, UploadOutlined, } from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

  useEffect(() => {
    fetchNews();
  }, [currentPage]);

  const fetchNews = async () => {
    try {
      const response = await newsService.getAllNews(currentPage, pageSize);
      if (response.status === true) {
        setNews(response.data.news || response.data);
        setTotal(response.data.total || response.data.length);
      } else {
        message.error('Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      message.error('An error occurred while fetching news');
    }
  };

  const handleCreateNews = async (values: any) => {
    if (!userId) {
      message.error('Please log in to create news');
      return;
    }

    let imageBase64: string[] = [];
    if (fileList.length > 0 && fileList[0].originFileObj) {
      try {
        const base64DataUrl = await fileToBase64(fileList[0].originFileObj);
        console.log('Full Base64 Data URL:', base64DataUrl); // Log full data URL for debugging
        const base64String = base64DataUrl.split(',')[1]; // Strip prefix (e.g., "data:image/jpeg;base64,")
        console.log('Stripped Base64 String:', base64String); // Log stripped Base64 for debugging
        imageBase64 = [base64String];
      } catch (error) {
        console.error('Error converting image to Base64:', error);
        message.error('Failed to process the uploaded image');
        return;
      }
    } else {
      console.warn('No image file selected or file object missing');
    }

    const createModel: CreateNewsModel = new CreateNewsModel(
      values.title || '',
      values.content || '',
      userId,
      values.summary,
      values.category || '',
      values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : undefined,
      imageBase64.length > 0 ? imageBase64 : undefined,
      values.thumbnail,
      'draft',
      'public',
      false,
      false,
      new Date()
    );

    console.log('CreateNewsModel:', createModel); // Log the model to verify data

    try {
      const response = await newsService.createNews(createModel);
      console.log('Backend Response:', response); // Log the response for debugging
      if (response.status === true) {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        setFileList([]);
        fetchNews();
        message.success('News created successfully');
      } else {
        message.error(response.internalMessage || 'Failed to create news');
      }
    } catch (error) {
      console.error('Error creating news:', error);
      message.error('An error occurred while creating news');
    }
  };

  const handleUpdateNews = async (values: any) => {
    if (!userId || !editingNewsId) {
      message.error('User ID or News ID missing');
      return;
    }
    const updateModel: UpdateNewsModel = {
      title: values.title,
      content: values.content,
      newsId: editingNewsId,
    };
    try {
      const response = await newsService.updateNews(editingNewsId, updateModel);
      if (response.status === true) {
        setIsUpdateModalVisible(false);
        setEditingNewsId(null);
        updateForm.resetFields();
        fetchNews();
        message.success('News updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update news');
      }
    } catch (error) {
      console.error('Error updating news:', error);
      message.error('An error occurred while updating news');
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      const response = await newsService.deleteNews(id);
      if (response.status === true) {
        fetchNews();
        message.success('News deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete news');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      message.error('An error occurred while deleting news');
    }
  };

  const handleToggleLike = async (id: string, isLiked: boolean) => {
    if (!userId) {
      message.error('Please log in to like news');
      return;
    }
    try {
      const response = await newsService.toggleLikeNews(id);
      if (response.status === true) {
        fetchNews();
        message.success(`News ${isLiked ? 'unliked' : 'liked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isLiked ? 'unlike' : 'like'} news`);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} news:`, error);
      message.error(`An error occurred while ${isLiked ? 'unliking' : 'liking'} the news`);
    }
  };

  const handleAddComment = async (values: { content: string }) => {
    if (!userId || !commentNewsId) {
      message.error('User ID or News ID missing');
      return;
    }
    const commentModel: CreateCommentModel = {
      authorId: userId,
      newsId: commentNewsId,
      content: values.content,
    };
    try {
      const response = await newsService.addComment(commentModel);
      if (response.status === true) {
        setIsCommentModalVisible(false);
        commentForm.resetFields();
        fetchNews();
        message.success('Comment added successfully');
      } else {
        message.error(response.internalMessage || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('An error occurred while adding the comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await newsService.deleteComment(commentId);
      if (response.status === true) {
        fetchNews();
        message.success('Comment deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      message.error('An error occurred while deleting the comment');
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
    commentForm.resetFields();
  };

  const handleFullView = (newsItem: any) => {
    setSelectedNews(newsItem);
    setIsFullViewModalVisible(true);
  };

  const getNewsImage = (newsItem: any) =>
    newsItem.images && newsItem.images.length > 0 ? newsItem.images[0] : null;

  const uploadProps = {
    onRemove: (file: UploadFile) => {
      setFileList(fileList.filter((item) => item.uid !== file.uid));
    },
    beforeUpload: (file: UploadFile) => {
      setFileList([file]);
      return false; // Prevent automatic upload
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
    <div style={{ width: '100%', height: '100vh', padding: '20px', backgroundColor: '#fff', overflow: 'auto', scrollbarWidth: "none" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        >
          <Title level={2} style={{ margin: 0, color: '#000' }}>
            Latest News
          </Title>
          {userId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '8px' }}
            >
              Create News
            </Button>
          )}
        </motion.div>

        {/* News List with Square Cards */}
        <AnimatePresence>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {news.map((newsItem) => (
              <motion.div
                key={newsItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleFullView(newsItem)}
              >
                <Card
                  hoverable
                  cover={
                    getNewsImage(newsItem) ? (
                      <img
                        alt="News Image"
                        src={getNewsImage(newsItem)}
                        style={{
                          width: '250px',
                          height: '250px',
                          objectFit: 'cover',
                          borderRadius: '8px 8px 0 0',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '250px',
                          height: '250px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          color: '#bfbfbf',
                          fontSize: '18px',
                          borderRadius: '8px 8px 0 0',
                          textAlign: 'center',
                        }}
                      >
                        <span>News Image</span>
                      </div>
                    )
                  }
                  style={{
                    width: '250px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: '10px' }}
                >
                  <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                    {newsItem.title.slice(0, 50)}{newsItem.title.length > 50 ? '...' : ''}
                  </Text>
                  <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#fa8c16' }}>
                      <LikeOutlined /> {newsItem.likes || 0}
                    </Text>
                    <Text style={{ color: '#eb2f96' }}>
                      <CommentOutlined /> {newsItem.comments?.length || 0}
                    </Text>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Pagination */}
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page) => setCurrentPage(page)}
          style={{ marginTop: '20px', textAlign: 'center', color: '#1890ff' }}
        />

        {/* Create News Modal */}
        <Modal
          title={<Text strong style={{ color: '#ff4d4f' }}>Create News</Text>}
          visible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          footer={null}
          bodyStyle={{ padding: '24px', backgroundColor: '#fff' }}
        >
          <Form form={createForm} onFinish={handleCreateNews} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="News Title" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea rows={4} placeholder="News Content" />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please enter a category' }]}
            >
              <Input placeholder="e.g., Science, Technology" />
            </Form.Item>
            <Form.Item name="tags" label="Tags (comma-separated)">
              <Input placeholder="e.g., news, update, science" />
            </Form.Item>
            <Form.Item name="image" label="Upload Image">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '8px' }}
              >
                Create
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Update News Modal */}
        <Modal
          title={<Text strong style={{ color: '#ff4d4f' }}>Edit News</Text>}
          visible={isUpdateModalVisible}
          onCancel={() => setIsUpdateModalVisible(false)}
          footer={null}
          bodyStyle={{ backgroundColor: '#fff' }}
        >
          <Form form={updateForm} onFinish={handleUpdateNews} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="News Title" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea rows={4} placeholder="News Content" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '8px' }}
              >
                Update
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Comment Modal */}
        <Modal
          title={<Text strong style={{ color: '#ff4d4f' }}>Add Comment</Text>}
          visible={isCommentModalVisible}
          onCancel={() => setIsCommentModalVisible(false)}
          footer={null}
          bodyStyle={{ backgroundColor: '#fff' }}
        >
          <Form form={commentForm} onFinish={handleAddComment} layout="vertical">
            <Form.Item
              name="content"
              label="Comment"
              rules={[{ required: true, message: 'Please enter a comment' }]}
            >
              <TextArea rows={4} placeholder="Your comment" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '8px' }}
              >
                Add Comment
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Full View News Modal */}
        <Modal
          title={<Text strong style={{ color: '#ff4d4f' }}>{selectedNews?.title}</Text>}
          visible={isFullViewModalVisible}
          onCancel={() => setIsFullViewModalVisible(false)}
          footer={[
            <Space key="actions">
              <Button
                icon={selectedNews?.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                onClick={() => handleToggleLike(selectedNews.id, selectedNews.isLiked)}
                style={{ color: '#fa8c16' }}
              >
                {selectedNews?.likes || 0}
              </Button>
              <Button
                icon={<CommentOutlined />}
                onClick={() => handleComment(selectedNews.id)}
                style={{ color: '#eb2f96' }}
              >
                {selectedNews?.comments?.length || 0}
              </Button>
              {selectedNews?.userId === userId && (
                <>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(selectedNews)}
                    style={{ color: '#1890ff' }}
                  >
                    Edit
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteNews(selectedNews.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Space>,
          ]}
          width="80%"
          bodyStyle={{ padding: '24px', backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}
        >
          {selectedNews && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {getNewsImage(selectedNews) ? (
                <img
                  src={getNewsImage(selectedNews)}
                  alt={selectedNews.title}
                  style={{ width: '600px', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
                />
              ) : (
                <div
                  style={{
                    width: '600px',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#bfbfbf',
                    fontSize: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                  }}
                >
                  No Image
                </div>
              )}
              <Text strong style={{ color: '#1890ff' }}>Category:</Text>{' '}
              <Text>{selectedNews.category || 'Uncategorized'}</Text>
              <br />
              <Text strong style={{ color: '#1890ff' }}>Published:</Text>{' '}
              <Text>{new Date(selectedNews.publishedAt).toLocaleString()}</Text>
              <br />
              <Text strong style={{ color: '#1890ff' }}>Content:</Text>
              <p style={{ marginTop: '10px', color: '#595959' }}>{selectedNews.content}</p>
              {selectedNews.tags && (
                <div>
                  <Text strong style={{ color: '#1890ff' }}>Tags:</Text>{' '}
                  {selectedNews.tags.map((tag: string) => (
                    <span key={tag} style={{ marginRight: '8px', color: '#722ed1' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {selectedNews.comments && selectedNews.comments.length > 0 && (
                <List
                  header={<Text strong style={{ color: '#eb2f96' }}>Comments</Text>}
                  dataSource={selectedNews.comments}
                  renderItem={(comment: any) => (
                    <List.Item
                      actions={
                        comment.userId === userId
                          ? [<Button type="link" onClick={() => handleDeleteComment(comment.id)} style={{ color: '#ff4d4f' }}>Delete</Button>]
                          : []
                      }
                    >
                      <List.Item.Meta
                        title={<Text style={{ color: '#fa8c16' }}>{comment.userName || 'Anonymous'}</Text>}
                        description={<Text style={{ color: '#595959' }}>{comment.content}</Text>}
                      />
                    </List.Item>
                  )}
                />
              )}
            </motion.div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default NewsPage;