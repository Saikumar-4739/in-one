import React, { useState, useEffect } from 'react';
import { Button, Calendar, Modal, Form, Input, DatePicker, message, Space, Typography, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs'; // Replace moment with dayjs
import TextArea from 'antd/es/input/TextArea';
import { NotesCalenderHelpService } from '@in-one/shared-services';
import { MeetingEventModel } from '@in-one/shared-models';
import './calender-page.css'

const { Title } = Typography;

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // Use Dayjs
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const notesService = new NotesCalenderHelpService();

  const holidays = [
    { date: '2025-12-25', name: 'Christmas Day' },
    { date: '2025-01-01', name: 'New Year\'s Day' },
    { date: '2025-07-04', name: 'Independence Day' },
  ];

  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId]);

  const fetchEvents = async () => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await notesService.getUserEvents(userId);
      if (response.status === true) {
        setEvents(response.data || []);
      } else {
        message.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('An error occurred while fetching events');
    }
  };

  const handleCreateOrUpdateEvent = async (values: {
    title: string;
    startDate: Dayjs; // Use Dayjs
    endDate: Dayjs;   // Use Dayjs
    description?: string;
    participantIds?: string;
  }) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const event: MeetingEventModel = {
        title: values.title,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        description: values.description || '',
        participantIds: values.participantIds ? values.participantIds.split(',').map(p => p.trim()) : [],
      };

      if (editingEventId) {
        const response = await notesService.updateEvent(editingEventId, event);
        if (response.status === true) {
          setEditingEventId(null);
          form.resetFields();
          fetchEvents();
          message.success('Meeting updated successfully');
        } else {
          message.error(response.internalMessage || 'Failed to update meeting');
        }
      } else {
        const response = await notesService.createEvent(userId, event);
        if (response.status === true) {
          form.resetFields();
          fetchEvents();
          message.success('Meeting scheduled successfully');
        } else {
          message.error(response.internalMessage || 'Failed to schedule meeting');
        }
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error creating/updating meeting:', error);
      message.error('An error occurred while saving the meeting');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const response = await notesService.deleteEvent(id);
      if (response.status === true) {
        fetchEvents();
        message.success('Meeting deleted successfully');
      } else {
        message.error('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      message.error('An error occurred while deleting the meeting');
    }
  };

  const handleSelect = (value: Dayjs) => { // Use Dayjs
    setSelectedDate(value);
    setIsModalVisible(true);
    setEditingEventId(null);
    form.resetFields();
    form.setFieldsValue({
      startDate: value.startOf('hour'),
      endDate: value.startOf('hour').add(1, 'hour'),
    });
  };

  const cellRender = (value: Dayjs) => { // Replace dateCellRender with cellRender
    const dayEvents = events.filter((event) =>
      dayjs(event.startDate).isSame(value, 'day')
    );
    const holiday = holidays.find(h => dayjs(h.date).isSame(value, 'day'));

    return (
      <div className="date-cell">
        {holiday && (
          <Badge
            count={holiday.name}
            style={{ backgroundColor: '#ff4d4f', marginBottom: '4px' }}
            className="holiday-badge"
          />
        )}
        <ul className="event-list">
          {dayEvents.map((event) => (
            <li
              key={event.id}
              className="event-item"
              onClick={() => {
                setEditingEventId(event.id);
                setIsModalVisible(true);
                form.setFieldsValue({
                  title: event.title,
                  startDate: dayjs(event.startDate), // Use dayjs
                  endDate: dayjs(event.endDate),     // Use dayjs
                  description: event.description,
                  participantIds: event.participants?.join(', ') || '',
                });
              }}
            >
              <Badge color="#1890ff" text={event.title} />
              <br />
              <small>
                {dayjs(event.startDate).format('HH:mm')} - {dayjs(event.endDate).format('HH:mm')}
              </small>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="login-prompt">
        <Title level={3}>Please log in to view your calendar</Title>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <div className="header">
          <Title level={2} className="header-title">Meetings</Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEventId(null);
                setIsModalVisible(true);
                form.resetFields();
                form.setFieldsValue({
                  startDate: selectedDate.startOf('hour'),
                  endDate: selectedDate.startOf('hour').add(1, 'hour'),
                });
              }}
            >
              Schedule Meeting
            </Button>
          </Space>
        </div>

        <Calendar
          value={selectedDate}
          onSelect={handleSelect}
          cellRender={cellRender} // Use cellRender instead of dateCellRender
          className="teams-calendar"
        />

        <Modal
          title={editingEventId ? 'Edit Meeting' : 'Schedule Meeting'}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          className="event-modal"
        >
          <Form
            form={form}
            onFinish={handleCreateOrUpdateEvent}
            layout="vertical"
            className="event-form"
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Meeting Title" />
            </Form.Item>
            <Form.Item
              name="startDate"
              label="Start Date & Time"
              rules={[{ required: true, message: 'Please select a start date' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="End Date & Time"
              rules={[{ required: true, message: 'Please select an end date' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Meeting Description" />
            </Form.Item>
            <Form.Item name="participantIds" label="Participants">
              <Input placeholder="Comma-separated user IDs (e.g., user1, user2)" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingEventId ? 'Update' : 'Schedule'}
                </Button>
                {editingEventId && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      handleDeleteEvent(editingEventId);
                      setIsModalVisible(false);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CalendarPage;