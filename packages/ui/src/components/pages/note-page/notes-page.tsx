import React, { useState, useEffect } from 'react';
import { CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';
import { Button, Card, Input, Form, Space, Typography, Badge, message, Select, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  PushpinOutlined,
  FolderOutlined,
  SearchOutlined,
  ShareAltOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import './notes-page.css';
import { NotesHelpService } from '@in-one/shared-services';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [previewNote, setPreviewNote] = useState<any | null>(null);
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const notesService = new NotesHelpService();

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Yellow', value: '#fff9b1' },
    { name: 'Orange', value: '#ffcc99' },
    { name: 'Green', value: '#ccffcc' },
    { name: 'Blue', value: '#cce5ff' },
  ];

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const fetchNotes = async () => {
    if (!userId) return;
    try {
      const response = await notesService.getUserNotes(userId);
      if (response.status === true) {
        setNotes(response.data);
      } else {
        message.error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      message.error('An error occurred while fetching notes');
    }
  };

  const handleCreateOrUpdate = async (values: {
    title: string;
    content: string;
    color?: string;
  }) => {
    if (!userId) return;
    try {
      if (editingNoteId) {
        const updateNote: UpdateNoteModel = values;
        const response = await notesService.updateNote(editingNoteId, updateNote, userId);
        if (response.status === true) {
          setEditingNoteId(null);
          form.resetFields();
          setIsFormVisible(false);
          fetchNotes();
          message.success('Note updated successfully');
        } else {
          message.error(response.internalMessage || 'Failed to update note');
        }
      } else {
        const newNote = new CreateNoteModel(
          values.title,
          values.content,
          userId,
          [],
          false,
          false,
          undefined,
          []
        );
        (newNote as any).color = values.color || '#ffffff';
        const response = await notesService.createNote(newNote);
        if (response.status === true) {
          form.resetFields();
          setIsFormVisible(false);
          setSelectedColor('#ffffff');
          fetchNotes();
          message.success('Note created successfully');
        } else {
          message.error(response.internalMessage || 'Failed to create note');
        }
      }
    } catch (error: any) {
      console.error('Error creating/updating note:', error);
      message.error('An error occurred while saving the note');
    }
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setIsFormVisible(true);
    form.setFieldsValue({
      title: note.title,
      content: note.content,
      color: note.color || '#ffffff',
    });
    setSelectedColor(note.color || '#ffffff');
    setContentLength(note.content.length);
  };

  const handlePinToggle = async (id: string) => {
    if (!userId) return;
    try {
      await notesService.togglePin(id, userId);
      fetchNotes();
      message.success('Pin status updated');
    } catch (error) {
      console.error('Error toggling pin:', error);
      message.error('Failed to toggle pin');
    }
  };

  const handleArchiveToggle = async (id: string) => {
    if (!userId) return;
    try {
      await notesService.toggleArchive(id, userId);
      fetchNotes();
      message.success('Archive status updated');
    } catch (error) {
      console.error('Error toggling archive:', error);
      message.error('Failed to toggle archive');
    }
  };

  const handleShare = (note: any) => {
    message.info(`Note "${note.title}" shared to chat!`);
    console.log('Shared note:', note);
  };

  const handlePreview = (note: any) => {
    setPreviewNote(note);
  };

  // const handleClearAllNotes = async () => {
  //   if (!userId) return;
  //   try {
  //     // Assuming NotesHelpService has a method to clear all notes
  //     await notesService.clearAllNotes(userId);
  //     setNotes([]);
  //     fetchNotes();
  //     message.success('All notes cleared successfully');
  //   } catch (error) {
  //     console.error('Error clearing notes:', error);
  //     message.error('Failed to clear all notes');
  //   }
  // };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return (
      <div className="login-prompt">
        <Title level={3}>Please log in to view your notes</Title>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="notes-container">
        {/* Header */}
        <div className="notes-header">
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <Button
              type="default"
              icon={<DeleteOutlined />}
              onClick={() => setIsClearModalVisible(true)}
              className="clear-all-btn"
              disabled={notes.length === 0}
            >
              Clear All
            </Button>
          </Space>
        </div>

        {/* Note Creation Form */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isFormVisible ? 'auto' : 0, opacity: isFormVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="form-container"
          style={{ backgroundColor: selectedColor }}
        >
          <Form form={form} onFinish={handleCreateOrUpdate}>
            <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]}>
              <Input placeholder="Title" className="form-title" />
            </Form.Item>
            <Form.Item
              name="content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea
                rows={4}
                placeholder="Take a note..."
                className="form-content"
                maxLength={500}
                onChange={(e) => setContentLength(e.target.value.length)}
              />
            </Form.Item>
            <div className="content-counter">{contentLength}/500</div>
            <Form.Item name="color" label="Color">
              <Select value={selectedColor} onChange={setSelectedColor}>
                {colors.map((color) => (
                  <Option key={color.value} value={color.value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color.value,
                          marginRight: '8px',
                          border: '1px solid #d9d9d9',
                        }}
                      />
                      {color.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" className="action-btn save-btn">
                  {editingNoteId ? 'Update' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setIsFormVisible(false);
                    setEditingNoteId(null);
                    form.resetFields();
                    setSelectedColor('#ffffff');
                    setContentLength(0);
                  }}
                  className="action-btn cancel-btn"
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </motion.div>

        {/* Add Note Button */}
        {!isFormVisible && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="add-note-btn-container"
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingNoteId(null);
                form.resetFields();
                setIsFormVisible(true);
                setContentLength(0);
              }}
              className="action-btn add-note-btn"
            >
              Add Note
            </Button>
          </motion.div>
        )}

        {/* Notes Grid */}
        <motion.div layout className="notes-grid">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => handlePreview(note)}
              >
                <Card
                  className={`note-card ${note.isPinned ? 'pinned' : ''} ${note.isArchived ? 'archived' : ''}`}
                  style={{ backgroundColor: note.color || '#ffffff' }}
                  title={
                    <div className="card-title">
                      <span>{note.title}</span>
                      <Badge dot={note.isPinned} color="yellow" />
                    </div>
                  }
                  actions={[
                    <PushpinOutlined
                      key="pin"
                      className={note.isPinned ? 'pinned-icon' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinToggle(note.id);
                      }}
                    />,
                    <EditOutlined
                      key="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                    />,
                    <FolderOutlined
                      key="archive"
                      className={note.isArchived ? 'archived-icon' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveToggle(note.id);
                      }}
                    />,
                    <ShareAltOutlined
                      key="share"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(note);
                      }}
                    />,
                  ]}
                >
                  <p>{note.content.length > 100 ? `${note.content.substring(0, 100)}...` : note.content}</p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Notes Count */}
        <div className="notes-count">
          <Badge count={filteredNotes.length} showZero>
            <span>Total Notes</span>
          </Badge>
        </div>

        {/* Preview Modal */}
        <Modal
          title={previewNote?.title}
          open={!!previewNote}
          onCancel={() => setPreviewNote(null)}
          footer={[
            <Button key="close" onClick={() => setPreviewNote(null)} className="action-btn">
              Close
            </Button>,
          ]}
          className="preview-modal"
        >
          <div style={{ backgroundColor: previewNote?.color || '#ffffff', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>{previewNote?.content}</p>
            {previewNote?.attachments && previewNote.attachments.length > 0 && (
              <div className="attachments" style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', color: '#888' }}>Attachments:</p>
                <ul>
                  {previewNote.attachments.map((url: string, index: number) => (
                    <li key={index}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#6200ea' }}>
                        Attachment {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>

        {/* Clear All Confirmation Modal */}
        <Modal
          title="Clear All Notes"
          open={isClearModalVisible}
          onOk={() => {
            // handleClearAllNotes();
            setIsClearModalVisible(false);
          }}
          onCancel={() => setIsClearModalVisible(false)}
          okText="Confirm"
          cancelText="Cancel"
          okButtonProps={{ className: 'action-btn save-btn' }}
          cancelButtonProps={{ className: 'action-btn cancel-btn' }}
        >
          <p>Are you sure you want to delete all your notes? This action cannot be undone.</p>
        </Modal>
      </div>
    </div>
  );
};

export default NotesPage;
