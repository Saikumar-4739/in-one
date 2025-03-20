import React, { useState, useEffect } from 'react';
import { CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';
import { NotesCalenderHelpService } from '@in-one/shared-services';
import { Button, Card, Input, Form, Space, Typography, Badge, message, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  FolderOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const notesService = new NotesCalenderHelpService();

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const fetchNotes = async () => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await notesService.findAll(userId);
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
    attachments?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
    voiceNoteUrl?: string;
  }) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      if (editingNoteId) {
        const updateNote: UpdateNoteModel = values;
        const response = await notesService.update(editingNoteId, updateNote);
        if (response.status === true) {
          setEditingNoteId(null);
          form.resetFields();
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
          values.attachments || [],
          values.isArchived || false,
          values.isPinned || false,
          values.voiceNoteUrl || undefined
        );
        const response = await notesService.create(newNote);
        if (response.status === true) {
          form.resetFields();
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

  const handleDelete = async (id: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await notesService.delete(id);
      if (response.status === true) {
        fetchNotes();
        message.success('Note deleted successfully');
      } else {
        message.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('An error occurred while deleting the note');
    }
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    form.setFieldsValue({
      title: note.title,
      content: note.content,
      attachments: note.attachments?.join(', ') || '', // Convert array to string for display
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      voiceNoteUrl: note.voiceNoteUrl,
    });
  };

  const handlePinToggle = async (id: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      await notesService.togglePin(id);
      fetchNotes();
      message.success('Pin status updated');
    } catch (error) {
      console.error('Error toggling pin:', error);
      message.error('Failed to toggle pin');
    }
  };

  const handleArchiveToggle = async (id: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      await notesService.toggleArchive(id);
      fetchNotes();
      message.success('Archive status updated');
    } catch (error) {
      console.error('Error toggling archive:', error);
      message.error('Failed to toggle archive');
    }
  };

  if (!userId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Title level={3}>Please log in to view your notes</Title>
      </div>
    );
  }

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
            Notes
          </Title>
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingNoteId(null);
                form.resetFields();
              }}
            >
              Add Note
            </Button>
          </Space>
        </div>

        {/* Note Creation/Update Form */}
        <Form
          form={form}
          onFinish={(values) => {
            // Convert attachments string to array
            const attachments = values.attachments
              ? values.attachments.split(',').map((url: string) => url.trim())
              : [];
            handleCreateOrUpdate({ ...values, attachments });
          }}
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <Form.Item
            name="title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Note Title" />
          </Form.Item>
          <Form.Item
            name="content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <TextArea rows={4} placeholder="Note Content" />
          </Form.Item>
          <Form.Item name="attachments">
            <Input
              prefix={<UploadOutlined />}
              placeholder="Attachments (comma-separated URLs)"
            />
          </Form.Item>
          <Form.Item name="voiceNoteUrl" label="Voice Note URL">
            <Input placeholder="Voice Note URL (optional)" />
          </Form.Item>
          <Form.Item name="isPinned" label="Pinned" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isArchived" label="Archived" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingNoteId ? 'Update Note' : 'Create Note'}
            </Button>
          </Form.Item>
        </Form>

        {/* Notes List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {notes.map((note) => (
            <Card
              key={note.id}
              title={note.title}
              extra={
                <Space>
                  <Button
                    icon={<PushpinOutlined />}
                    type={note.isPinned ? 'primary' : 'default'}
                    onClick={() => handlePinToggle(note.id)}
                  />
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(note)}
                  />
                  <Button
                    icon={<FolderOutlined />}
                    type={note.isArchived ? 'primary' : 'default'}
                    onClick={() => handleArchiveToggle(note.id)}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(note.id)}
                  />
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <p>{note.content}</p>
              {note.attachments && note.attachments.length > 0 && (
                <div>
                  <p>Attachments:</p>
                  <ul>
                    {note.attachments.map((url: string, index: number) => (
                      <li key={index}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Attachment {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {note.voiceNoteUrl && (
                <p>
                  <a href={note.voiceNoteUrl} target="_blank" rel="noopener noreferrer">
                    Voice Note
                  </a>
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Total Notes Count */}
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Badge count={notes.length} showZero>
            <span style={{ marginRight: '10px' }}>Total Notes</span>
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;