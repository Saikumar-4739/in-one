import React, { useState, useEffect } from 'react';
import { CreateNewsModel, UpdateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { Button, Card, message, Space, Typography, Input, Modal, Form, Pagination, List } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TechNewsPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [commentNewsId, setCommentNewsId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const newsService = new NewsHelpService();

  useEffect(() => {
    fetchTechNews();
  }, [currentPage]);

  const fetchTechNews = async () => {
    try {
      // Option 1: Use searchNews with a "technology" query
      const response = await newsService.searchNews('technology', { page: currentPage, limit: pageSize });
      // Option 2: Use getAllNews and filter client-side (uncomment if applicable)
      // const response = await newsService.getAllNews(currentPage, pageSize);
      if (response.status === true) {
        const techNews = response.data.news || response.data;
        // Filter client-side if category field exists and searchNews isn't category-specific
        // const techNews = (response.data.news || response.data).filter((item: any) => item.category === 'technology');
        setNews(techNews);
        setTotal(response.data.total || techNews.length);
      } else {
        message.error('Failed to fetch technology news');
      }
    } catch (error) {
      console.error('Error fetching technology news:', error);
      message.error('An error occurred while fetching technology news');
    }
  };

  const handleCreateNews = async (values: { title: string; content: string }) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    const createModel: CreateNewsModel = {
      userId,
      title: values.title,
      content: values.content,
      category: 'technology', // Add category for tech news
    };
    try {
      const response = await newsService.createNews(createModel);
      if (response.status === true) {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        fetchTechNews();
        message.success('Tech news created successfully');
      } else {
        message.error(response.internalMessage || 'Failed to create tech news');
      }
    } catch (error) {
      console.error('Error creating tech news:', error);
      message.error('An error occurred while creating tech news');
    }
  };

  const handleUpdateNews = async (values: { title?: string; content?: string }) => {
    if (!userId || !editingNewsId) {
      console.error('User ID or News ID missing');
      return;
    }
    const updateModel: UpdateNewsModel = {
      title: values.title,
      content: values.content,
      category: 'technology', // Ensure category remains technology
    };
    try {
      const response = await newsService.updateNews(editingNewsId, updateModel);
      if (response.status === true) {
        setIsUpdateModalVisible(false);
        setEditingNewsId(null);
        updateForm.resetFields();
        fetchTechNews();
        message.success('Tech news updated successfully');
      } else {
        message.error(response.internalMessage || 'Failed to update tech news');
      }
    } catch (error) {
      console.error('Error updating tech news:', error);
      message.error('An error occurred while updating tech news');
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      const response = await newsService.deleteNews(id);
      if (response.status === true) {
        fetchTechNews();
        message.success('Tech news deleted successfully');
      } else {
        message.error(response.internalMessage || 'Failed to delete tech news');
      }
    } catch (error) {
      console.error('Error deleting tech news:', error);
      message.error('An error occurred while deleting tech news');
    }
  };

  const handleToggleLike = async (id: string, isLiked: boolean) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await newsService.toggleLikeNews(id);
      if (response.status === true) {
        fetchTechNews();
        message.success(`Tech news ${isLiked ? 'unliked' : 'liked'} successfully`);
      } else {
        message.error(response.internalMessage || `Failed to ${isLiked ? 'unlike' : 'like'} tech news`);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} tech news:`, error);
      message.error(`An error occurred while ${isLiked ? 'unliking' : 'liking'} the tech news`);
    }
  };

  const handleAddComment = async (values: { content: string }) => {
    if (!userId || !commentNewsId) {
      console.error('User ID or News ID missing');
      return;
    }
    const commentModel: CreateCommentModel = {
      userId,
      newsId: commentNewsId,
      content: values.content,
    };
    try {
      const response = await newsService.addComment(commentModel);
      if (response.status === true) {
        setIsCommentModalVisible(false);
        commentForm.resetFields();
        fetchTechNews();
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
        fetchTechNews();
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
            Technology News
          </Title>
          {userId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Create Tech News
            </Button>
          )}
        </div>

        {/* News List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {news.map((newsItem) => (
            <Card
              key={newsItem.id}
              title={newsItem.title}
              extra={
                <Space>
                  <Button
                    icon={newsItem.isLiked ? <DislikeOutlined /> : <LikeOutlined />}
                    onClick={() => handleToggleLike(newsItem.id, newsItem.isLiked)}
                  />
                  <Button
                    icon={<CommentOutlined />}
                    onClick={() => handleComment(newsItem.id)}
                  />
                  {newsItem.userId === userId && (
                    <>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(newsItem)}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteNews(newsItem.id)}
                      />
                    </>
                  )}
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <Text>{newsItem.content}</Text>
              <p>Likes: {newsItem.likes || 0}</p>
              {newsItem.comments && newsItem.comments.length > 0 && (
                <List
                  dataSource={newsItem.comments}
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
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page) => setCurrentPage(page)}
          style={{ marginTop: '20px', textAlign: 'center' }}
        />

        {/* Create News Modal */}
        <Modal
          title="Create Technology News"
          visible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          footer={null}
        >
          <Form form={createForm} onFinish={handleCreateNews} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Tech News Title" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea rows={4} placeholder="Tech News Content" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Update News Modal */}
        <Modal
          title="Edit Technology News"
          visible={isUpdateModalVisible}
          onCancel={() => setIsUpdateModalVisible(false)}
          footer={null}
        >
          <Form form={updateForm} onFinish={handleUpdateNews} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Tech News Title" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea rows={4} placeholder="Tech News Content" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
            </Form.Item>
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
            <Form.Item
              name="content"
              label="Comment"
              rules={[{ required: true, message: 'Please enter a comment' }]}
            >
              <TextArea rows={4} placeholder="Your comment" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Add Comment
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default TechNewsPage;