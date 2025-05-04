import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message, Checkbox } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import './news-page.css';

import { CreateNewsModel, UpdateNewsModel, CreateCommentModel } from '@in-one/shared-models';
import { NewsHelpService } from '@in-one/shared-services';
import { NewsItem } from './news-model';
import { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';


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

  useEffect(() => {
    if (editingNewsId && selectedNews) {
      newsForm.setFieldsValue({
        title: selectedNews.title,
        content: selectedNews.content,
        category: selectedNews.category,
        tags: selectedNews.tags?.join(', ') || '',
        visibility: selectedNews.visibility,
      });
    } else {
      newsForm.resetFields();
      setFileList([]);
    }
  }, [editingNewsId, selectedNews]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);  // <-- This must be a real File/Blob
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  


  const validateFile = (file: File) => {
    const isValidType = ['image/png', 'image/jpeg'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

    if (!isValidType) message.error('Invalid file type. Only PNG and JPEG are allowed.');
    if (!isValidSize) message.error('File size exceeds the 5MB limit.');

    return isValidType && isValidSize;
  };


  const handleNewsSubmit = async (values: any) => {
    if (!userId) {
      message.error('Please log in to perform this action');
      return;
    }

    setLoading(true);
    try {
      if (fileList.length === 0) {
        message.error('Please upload an image');
        return;
      }
      let imageBase64: string[] = [];
      for (const file of fileList) {
        if (file.originFileObj instanceof File) {
          const base64 = await fileToBase64(file.originFileObj);
          imageBase64.push(base64);
        } else {
          message.error('Invalid image file');
        }
      }
      


      if (editingNewsId) {
        const updateModel: UpdateNewsModel = {
          authorId: userId,
          newsId: editingNewsId,
          title: values.title,
          content: values.content,
          visibility: values.visibility || 'public',
          images: imageBase64,
        };
        const response = await newsService.updateNews(editingNewsId, updateModel);
        if (response.status) {
          setNews(prev => prev.map(item =>
            item.id === editingNewsId ? { ...item, ...updateModel } : item
          ));
          message.success('News updated successfully');
        } else {
          message.error(response.internalMessage || 'Failed to update news');
        }
      } else {
        const createModel = new CreateNewsModel(
          userId,
          values.title,
          values.content,
          values.summary || '',
          values.category,
          values.tags?.split(',').map((t: string) => t.trim()) || [],
          imageBase64,
          '',
          'draft',
          values.visibility || 'public',
          values.isFeatured || false,
          values.isBreaking || false,
          new Date()
        );

        const response = await newsService.createNews(createModel);
        if (response.status) {
          setCurrentPage(1);
          setNews([]);
          message.success('News created successfully');
        } else {
          message.error(response.internalMessage || 'Failed to create news');
        }
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setIsNewsModalVisible(false);
      setEditingNewsId(null);
      newsForm.resetFields();
      setFileList([]);
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
        setNews(prev =>
          prev.map(item =>
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
      message.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setIsCommentModalVisible(false);
      commentForm.resetFields();
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file: RcFile) => {
      if (validateFile(file)) {
        setFileList([
          {
            uid: file.uid,
            name: file.name,
            status: 'done',
            originFileObj: file,
            type: file.type,
            size: file.size,
          },
        ]);
      }
      return false; // prevent auto-upload
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
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Input />
          </Form.Item>
          <Form.Item name="visibility" label="Visibility" rules={[{ required: true, message: 'Please select visibility' }]}>
            <Select defaultValue="public">
              <Option value="public">Public</Option>
              <Option value="private">Private</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isFeatured" valuePropName="checked">
            <Checkbox>Featured</Checkbox>
          </Form.Item>
          <Form.Item name="isBreaking" valuePropName="checked">
            <Checkbox>Breaking</Checkbox>
          </Form.Item>
          <Form.Item label="Upload Image">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingNewsId ? 'Update News' : 'Create News'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Add Comment"
        open={isCommentModalVisible}
        onCancel={() => setIsCommentModalVisible(false)}
        footer={null}
      >
        <Form form={commentForm} onFinish={handleAddComment}>
          <Form.Item name="content" rules={[{ required: true, message: 'Please enter your comment' }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Add Comment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewsModals;
