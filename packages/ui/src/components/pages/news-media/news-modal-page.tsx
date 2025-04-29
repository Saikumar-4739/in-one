import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { UploadFile } from 'antd/es/upload/interface';
import './news-page.css';
import { UpdateNewsModel, CreateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { NewsHelpService } from '@in-one/shared-services';
import { NewsItem } from './news-model';

const { TextArea } = Input;
const { Option } = Select;

interface NewsModalsProps {
  userId: string | null;
  newsService: NewsHelpService;
  isNewsModalVisible: boolean;
  setIsNewsModalVisible: (visible: boolean) => void;
  isCommentModalVisible: boolean;
  setIsCommentModalVisible: (visible: boolean) => void;
  editingNewsId: string | null;
  setEditingNewsId: (id: string | null) => void;
  commentNewsId: string | null;
  selectedNews: NewsItem | null;
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  setCurrentPage: (page: number) => void;
}

const NewsModals: React.FC<NewsModalsProps> = ({
  userId,
  newsService,
  isNewsModalVisible,
  setIsNewsModalVisible,
  isCommentModalVisible,
  setIsCommentModalVisible,
  editingNewsId,
  setEditingNewsId,
  commentNewsId,
  selectedNews,
  setNews,
  setCurrentPage,
}) => {
  const [newsForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Set initial form values when editing
  useEffect(() => {
    if (editingNewsId && selectedNews) {
      newsForm.setFieldsValue({
        title: selectedNews.title,
        content: selectedNews.content,
        category: selectedNews.category,
        tags: selectedNews.tags ? selectedNews.tags.join(', ') : '',
        visibility: selectedNews.visibility,
      });
    } else {
      newsForm.resetFields();
      setFileList([]);
    }
  }, [editingNewsId, selectedNews, newsForm]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: UploadFile): boolean => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!file.type || !allowedTypes.includes(file.type)) {
      message.error('Please upload a PNG or JPEG image');
      return false;
    }
    if (file.size && file.size > maxSize) {
      message.error('Image size must be less than 5MB');
      return false;
    }
    return true;
  };

  const handleNewsSubmit = async (values: any) => {
    if (!userId) {
      message.error('Please log in to perform this action');
      return;
    }

    setLoading(true);
    try {
      if (editingNewsId) {
        // Update news
        const updateModel: UpdateNewsModel = {
          authorId: userId,
          title: values.title,
          content: values.content,
          newsId: editingNewsId,
          visibility: values.visibility,
        };
        const response = await newsService.updateNews(editingNewsId, updateModel);
        if (response.status) {
          setNews((prev) =>
            prev.map((item) =>
              item.id === editingNewsId ? { ...item, ...updateModel } : item
            )
          );
          message.success('News updated successfully');
        } else {
          message.error(response.internalMessage || 'Failed to update news');
        }
      } else {
        // Create news
        let imageBase64: string[] = [];
        if (fileList.length > 0 && fileList[0].originFileObj) {
          if (!validateFile(fileList[0])) {
            setLoading(false);
            return;
          }
          const base64DataUrl = await fileToBase64(fileList[0].originFileObj);
          console.log('Base64 Data URL:', base64DataUrl); // Debug: Log full data URL
          imageBase64 = [base64DataUrl.split(',')[1]];
          console.log('Base64 String:', imageBase64[0]); // Debug: Log Base64 string
        }

        const createModel: CreateNewsModel = new CreateNewsModel(
          userId,
          values.title,
          values.content,
          values.summary || '',
          values.category,
          values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
          imageBase64,
          values.thumbnail || '',
          'draft',
          values.visibility || 'public',
          values.isFeatured || false,
          values.isBreaking || false,
          new Date()
        );

        console.log('CreateNewsModel:', createModel); // Debug: Log model sent to backend
        const response = await newsService.createNews(createModel);
        console.log('API Response:', response); // Debug: Log backend response
        if (response.status) {
          setCurrentPage(1);
          setNews([]);
          message.success('News created successfully');
        } else {
          message.error(response.internalMessage || 'Failed to create news');
        }
      }
    } catch (error: any) {
      console.error('Error creating/updating news:', error); // Debug: Log error
      message.error(error.message || 'An error occurred');
    } finally {
      setIsNewsModalVisible(false);
      setEditingNewsId(null);
      newsForm.resetFields();
      setFileList([]);
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
        setNews((prev) =>
          prev.map((item) =>
            item.id === commentNewsId
              ? {
                  ...item,
                  comments: [
                    ...(item.comments || []),
                    { id: response.data.id, content: values.content, authorId: userId, userName: 'You' },
                  ],
                }
              : item
          )
        );
        message.success('Comment added successfully');
      } else {
        message.error(response.internalMessage || 'Failed to add comment');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while adding comment');
    } finally {
      setIsCommentModalVisible(false);
      commentForm.resetFields();
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: UploadFile) => {
      if (validateFile(file)) {
        setFileList([file]);
      }
      return false; // Prevent automatic upload
    },
    fileList,
    accept: 'image/png,image/jpeg,image/jpg',
    maxCount: 1,
  };

  return (
    <>
      <Modal
        title={editingNewsId ? 'Update News' : 'Create News'}
        open={isNewsModalVisible}
        onCancel={() => {
          setIsNewsModalVisible(false);
          setEditingNewsId(null);
          newsForm.resetFields();
          setFileList([]);
        }}
        footer={null}
      >
        <Form form={newsForm} onFinish={handleNewsSubmit} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Please enter content' }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please enter a category' }]}>
            <Input disabled={!!editingNewsId} />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Input placeholder="comma-separated tags" disabled={!!editingNewsId} />
          </Form.Item>
          <Form.Item name="visibility" label="Visibility" initialValue="public">
            <Select>
              <Option value="public">Public</Option>
              <Option value="private">Private</Option>
            </Select>
          </Form.Item>
          {!editingNewsId && (
            <Form.Item name="image" label="Image">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" loading={loading} block>
            {editingNewsId ? 'Update' : 'Create'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add Comment"
        open={isCommentModalVisible}
        onCancel={() => {
          setIsCommentModalVisible(false);
          commentForm.resetFields();
        }}
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
    </>
  );
};

export default NewsModals;