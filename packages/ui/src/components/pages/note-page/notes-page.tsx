import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Form, Space, Typography, Badge, message, Select, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, PushpinOutlined, FolderOutlined, SearchOutlined, ShareAltOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import './notes-page.css';
import { NotesHelpService } from '@in-one/shared-services';
import { CreateNoteModel, UpdateNoteModel, GetUserNotesModel, NewsIdRequestModel, NotesIdRequestModel } from '@in-one/shared-models';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [previewNote, setPreviewNote] = useState<any | null>(null);
  const [contentLength, setContentLength] = useState(0);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const notesService = new NotesHelpService();

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Yellow', value: '#fefcbf' },
    { name: 'Pink', value: '#fed7e2' },
    { name: 'Blue', value: '#bee3f8' },
    { name: 'Green', value: '#c6f6d5' },
    { name: 'Red', value: '#feb2b2' },
    { name: 'Purple', value: '#e9d8fd' },
    { name: 'Orange', value: '#fbd38d' },
    { name: 'Teal', value: '#b2f5ea' },
    { name: 'Gray', value: '#e2e8f0' },
    { name: 'Brown', value: '#e4cbb3' },
    { name: 'Indigo', value: '#c3dafe' },
  ];

  const DEFAULT_COLOR = '#ffffff';


  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const fetchNotes = async () => {
    if (!userId) return;
    try {
      const reqModel = new GetUserNotesModel(userId, true);
      const response = await notesService.getUserNotes(reqModel);
      if (response.status === true) {
        setNotes(response.data);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  const handleCreateOrUpdate = async (values: { title: string; content: string; color?: string }) => {
    if (!userId) return;
    try {
      if (editingNoteId) {
        const updateNote = new UpdateNoteModel(editingNoteId, userId, values.title, values.content, values.color || '#ffffff');
        const response = await notesService.updateNote(updateNote);
        if (response.status === true) {
          setEditingNoteId(null);
          form.resetFields();
          setIsFormModalVisible(false);
          setSelectedColor('#ffffff');
          fetchNotes();
          message.success(response.internalMessage);
        } else {
          message.error(response.internalMessage);
        }
      } else {
        const newNote = new CreateNoteModel(values.title, values.content, userId, values.color || '#ffffff');
        const response = await notesService.createNote(newNote);
        if (response.status === true) {
          form.resetFields();
          setIsFormModalVisible(false);
          setSelectedColor('#ffffff');
          fetchNotes();
          message.success(response.internalMessage);
        } else {
          message.error(response.internalMessage);
        }
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setIsFormModalVisible(true);
    form.setFieldsValue({ title: note.title, content: note.content, color: note.color });
    setSelectedColor(note.color);
    setContentLength(note.content.length);
  };

  const handlePinToggle = async (noteId: string) => {
    if (!userId) return;
    try {
      const response = await notesService.togglePin(noteId, userId);
      if (response.status === true) {
        fetchNotes();
        message.success(response.internalMessage);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  const handleArchiveToggle = async (noteId: string) => {
    if (!userId) return;
    try {
      const response = await notesService.toggleArchive(noteId, userId);
      if (response.status === true) {
        fetchNotes();
        message.success(response.internalMessage);
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const req = new NotesIdRequestModel(noteId)
      const response = await notesService.deleteNote(req)
      if (response.status === true) {
        message.success('Notes Deleted SuccessFully')
        fetchNotes()
      } else {
        message.error(response.internalMessage)
      }
    } catch (error: any) {
      message.error(error)
    }
  }



  const filteredNotes = useMemo(() => {
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, notes]);


  if (!userId) {
    return (
      <div className="login-prompt">
        <Title level={3} className="login-title">
          Please log in to view your notes
        </Title>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="notes-container">

        <div className="notes-header">
          <Space className="header-space">
            <Input prefix={<SearchOutlined />} placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            <div className="notes-count-container">
              {/* Notes Count: <Badge count={filteredNotes.length} showZero className="notes-count" /> */}
            </div>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingNoteId(null); form.resetFields(); setIsFormModalVisible(true); setContentLength(0); setSelectedColor('#ffffff'); }} className="add-note-btn">New Note</Button>
            </motion.div>
          </Space>
        </div>

        <div style={{ padding: '16px' }} className="notes-grid-container">
          <motion.div layout className="notes-grid">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div key={note.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} style={{ cursor: 'pointer' }} onClick={() => setPreviewNote(note)}>
                  <Card
                    style={{ backgroundColor: note.color || '#ffffff', borderRadius: '10px', transition: 'box-shadow 0.3s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    bodyStyle={{ padding: '16px', flex: 1, overflow: 'hidden' }}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tooltip title={note.title}>
                          <span className="note-title">{note.title}</span>
                        </Tooltip>
                        {note.isPinned && <Badge dot color="#ffd700" />}
                      </div>
                    }
                    actions={[
                      <PushpinOutlined key="pin" style={{ color: note.isPinned ? '#ffd700' : 'inherit' }} onClick={(e) => { e.stopPropagation(); handlePinToggle(note.id); }} />,
                      <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(note); }} />,
                      <FolderOutlined key="archive" style={{ color: note.isArchived ? '#aaa' : 'inherit' }} onClick={(e) => { e.stopPropagation(); handleArchiveToggle(note.id); }} />,
                      <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} />,
                    ]}
                  >
                    <p style={{ margin: '0', wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {note.content.length > 100
                        ? `${note.content.substring(0, 100)}...`
                        : note.content}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        <Modal
          title={editingNoteId ? 'Edit Note' : 'New Note'}
          open={isFormModalVisible}
          onCancel={() => { setIsFormModalVisible(false); setEditingNoteId(null); form.resetFields(); setSelectedColor('#f5f5f5'); setContentLength(0); }}
          footer={null}
          className="form-modal"
          style={{ borderRadius: '12px', backgroundColor: '#fff' }}
        >
          <Form
            form={form}
            onFinish={handleCreateOrUpdate}
            layout="vertical"
            className="form-container"
            style={{ backgroundColor: selectedColor !== '#ffffff' ? selectedColor : '#ffffff', padding: '16px', borderRadius: '8px' }}
          >
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
              <Input placeholder="Note Title" style={{ borderRadius: '6px', padding: '8px', border: '1px solid #d9d9d9' }} />
            </Form.Item>

            <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Please enter content' }]}>
              <TextArea rows={6} placeholder="Write your note..." maxLength={1000} onChange={(e) => setContentLength(e.target.value.length)} showCount style={{ borderRadius: '6px', padding: '8px', border: '1px solid #d9d9d9' }} />
            </Form.Item>

            <Form.Item name="color" label="Background Color">
              <Select value={selectedColor} onChange={setSelectedColor} style={{ borderRadius: '6px' }} dropdownStyle={{ borderRadius: '6px' }}>
                {colors.map((color) => (
                  <Option key={color.value} value={color.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: color.value, borderRadius: '50%', border: '1px solid #ccc' }} />
                      {color.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" htmlType="submit" style={{ borderRadius: '6px', padding: '0 16px', backgroundColor: '#1890ff', borderColor: '#1890ff' }}>{editingNoteId ? 'Update' : 'Create'}</Button>
                <Button
                  onClick={() => { setIsFormModalVisible(false); setEditingNoteId(null); form.resetFields(); setSelectedColor('#f5f5f5'); setContentLength(0); }}
                  style={{ borderRadius: '6px', padding: '0 16px', backgroundColor: '#f0f0f0', borderColor: '#d9d9d9', color: '#000' }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {previewNote && (
          <Modal
            open={!!previewNote}
            onCancel={() => setPreviewNote(null)}
            className="preview-modal"
            footer={null}
            styles={{ body: { padding: '24px', paddingTop: 16, margin: '20px', backgroundColor: previewNote.color || '#f5f5f5', border: previewNote.color, overflow: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' } }}
            centered
          >
            <h3 style={{ marginBottom: '12px' }}>{previewNote?.title || 'Note Preview'}</h3>
            <div
              className="preview-container"
              style={{ padding: '20px', borderRadius: '10px', minHeight: '120px', marginBottom: '16px', overflow: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              <p className="preview-content" style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.6' }}>{previewNote.content}</p>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default NotesPage;