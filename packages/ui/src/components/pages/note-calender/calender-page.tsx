import React, { useState, useEffect } from 'react';
import { CreateCalendarEventModel } from '@in-one/shared-models';
import { Button, Calendar, Modal, Form, Input, DatePicker, TimePicker, message, Space, Typography, Badge, Switch, Select } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import moment, { Moment } from 'moment';
import TextArea from 'antd/es/input/TextArea';
import { NotesCalenderHelpService } from '@in-one/shared-services';

const { Title } = Typography;
const { Option } = Select;

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Moment>(moment());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const notesService = new NotesCalenderHelpService();

  useEffect(() => {
    if (userId) {
      fetchCalendarsAndEvents();
    }
  }, [userId]);

  const fetchCalendarsAndEvents = async () => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const calendarResponse = await notesService.getAllCalendars(userId);
      if (calendarResponse.status === true) {
        setCalendars(calendarResponse.data);
        const allEvents = calendarResponse.data.flatMap((cal: any) => cal.events || []);
        setEvents(allEvents);
      } else {
        message.error('Failed to fetch calendars');
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      message.error('An error occurred while fetching calendars');
    }
  };

  const handleCreateOrUpdateEvent = async (values: {
    title: string;
    startDate: Moment;
    endDate: Moment;
    description?: string;
    location?: string;
    reminder?: Moment;
    isAllDay?: boolean;
    participants?: string;
    isRecurring?: boolean;
    recurringRule?: string;
    status?: 'upcoming' | 'completed' | 'cancelled';
  }) => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      return;
    }
    try {
      const calendarId = calendars.length > 0 ? calendars[0].id : null;
      if (!calendarId) {
        message.error('No calendar available. Please create a calendar first.');
        return;
      }

      const event = new CreateCalendarEventModel(
        values.title,
        values.description || '',
        values.startDate.toDate(), // Convert Moment to Date
        values.endDate.toDate(),   // Convert Moment to Date
        values.location || '',
        values.reminder ? values.reminder.toDate() : new Date(), // Default to now if not provided
        values.isAllDay || false,
        values.participants ? values.participants.split(',').map(p => p.trim()) : [],
        values.isRecurring || false,
        values.recurringRule || null,
        calendarId,
        values.status || 'upcoming'
      );

      if (editingEventId) {
        const response = await notesService.updateEvent(editingEventId, event);
        if (response.status === true) {
          setEditingEventId(null);
          form.resetFields();
          fetchCalendarsAndEvents();
          message.success('Event updated successfully');
        } else {
          message.error(response.internalMessage || 'Failed to update event');
        }
      } else {
        const response = await notesService.addEvent(calendarId, event);
        if (response.status === true) {
          form.resetFields();
          fetchCalendarsAndEvents();
          message.success('Event created successfully');
        } else {
          message.error(response.internalMessage || 'Failed to create event');
        }
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error creating/updating event:', error);
      message.error('An error occurred while saving the event');
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
        fetchCalendarsAndEvents();
        message.success('Event deleted successfully');
      } else {
        message.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('An error occurred while deleting the event');
    }
  };

  const handleSelect = (value: Moment) => {
    setSelectedDate(value);
    setIsModalVisible(true);
    setEditingEventId(null);
    form.resetFields();
    form.setFieldsValue({
      startDate: value.clone().startOf('hour'),
      endDate: value.clone().startOf('hour').add(1, 'hour'),
    });
  };

  const dateCellRender = (value: Moment) => {
    const dayEvents = events.filter((event) =>
      moment(event.startDate).isSame(value, 'day')
    );
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {dayEvents.map((event) => (
          <li
            key={event.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '4px',
              padding: '4px',
              marginBottom: '4px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setEditingEventId(event.id);
              setIsModalVisible(true);
              form.setFieldsValue({
                title: event.title,
                startDate: moment(event.startDate),
                endDate: moment(event.endDate),
                description: event.description,
                location: event.location,
                reminder: event.reminder ? moment(event.reminder) : null,
                isAllDay: event.isAllDay,
                participants: event.participants?.join(', ') || '',
                isRecurring: event.isRecurring,
                recurringRule: event.recurringRule,
                status: event.status,
              });
            }}
          >
            <Badge color="blue" text={event.title} />
            <br />
            <small>
              {moment(event.startDate).format('HH:mm')} - {moment(event.endDate).format('HH:mm')}
            </small>
          </li>
        ))}
      </ul>
    );
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
          backgroundColor: '#fff',
        }}
      >
        <Title level={3}>Please log in to view your calendar</Title>
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
            Calendar
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEventId(null);
                setIsModalVisible(true);
                form.resetFields();
                form.setFieldsValue({
                  startDate: selectedDate.clone().startOf('hour'),
                  endDate: selectedDate.clone().startOf('hour').add(1, 'hour'),
                });
              }}
            >
              New Event
            </Button>
          </Space>
        </div>

        {/* Calendar */}
        <Calendar
          value={selectedDate}
          onSelect={handleSelect}
          dateCellRender={dateCellRender}
          style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}
        />

        {/* Event Modal */}
        <Modal
          title={editingEventId ? 'Edit Event' : 'New Event'}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            onFinish={handleCreateOrUpdateEvent}
            layout="vertical"
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Event Title" />
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
              <TextArea rows={4} placeholder="Event Description" />
            </Form.Item>
            <Form.Item name="location" label="Location">
              <Input placeholder="Event Location" />
            </Form.Item>
            <Form.Item name="reminder" label="Reminder">
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="isAllDay" label="All Day Event" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="participants" label="Participants">
              <Input placeholder="Comma-separated list (e.g., user1@example.com, user2@example.com)" />
            </Form.Item>
            <Form.Item name="isRecurring" label="Recurring Event" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="recurringRule" label="Recurring Rule">
              <Input placeholder="e.g., DAILY, WEEKLY" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status">
                <Option value="upcoming">Upcoming</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingEventId ? 'Update' : 'Create'}
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