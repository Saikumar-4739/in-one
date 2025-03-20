import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, message, Space, Tag, Modal } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const PluginsPage: React.FC = () => {
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<any | null>(null);

  // Mock plugin data (replace with API call in real implementation)
  const mockPlugins = [
    {
      id: '1',
      name: 'Weather Widget',
      description: 'Display real-time weather updates on your dashboard.',
      category: 'Utility',
      version: '1.0.0',
    },
    {
      id: '2',
      name: 'Task Manager',
      description: 'Manage your tasks directly within the app.',
      category: 'Productivity',
      version: '2.1.3',
    },
    {
      id: '3',
      name: 'Music Player',
      description: 'Stream music while using the app.',
      category: 'Entertainment',
      version: '1.5.0',
    },
    {
      id: '4',
      name: 'AI Chat Enhancer',
      description: 'Enhance your AI Bot with advanced features.',
      category: 'AI',
      version: '0.9.2',
    },
  ];

  useEffect(() => {
    if (userId) {
      fetchPlugins();
    }
  }, [userId]);

  const fetchPlugins = async () => {
    try {
      // Simulate fetching plugins (replace with real API call)
      setPlugins(mockPlugins);
      // Simulate fetching installed plugins (e.g., from localStorage or backend)
      const installed = JSON.parse(localStorage.getItem('installedPlugins') || '[]');
      setInstalledPlugins(installed);
    } catch (error) {
      console.error('Error fetching plugins:', error);
      message.error('Failed to load plugins');
    }
  };

  const handleAddPlugin = (plugin: any) => {
    if (!userId) {
      message.error('Please log in to add plugins');
      return;
    }
    setSelectedPlugin(plugin);
    setIsModalVisible(true);
  };

  const confirmAddPlugin = async () => {
    if (!selectedPlugin || !userId) return;
    try {
      // Simulate plugin installation (replace with real API call)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay
      const updatedInstalled = [...installedPlugins, selectedPlugin.id];
      setInstalledPlugins(updatedInstalled);
      localStorage.setItem('installedPlugins', JSON.stringify(updatedInstalled));
      message.success(`${selectedPlugin.name} installed successfully!`);
      setIsModalVisible(false);
      setSelectedPlugin(null);
    } catch (error) {
      console.error('Error installing plugin:', error);
      message.error('Failed to install plugin');
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
        <Title level={3}>Please log in to view plugins</Title>
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
        <Title level={2} style={{ marginBottom: '20px' }}>
          Plugins
        </Title>
        <Text>Explore and add free plugins to enhance your app experience.</Text>

        {/* Plugins List */}
        <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
          {plugins.map((plugin) => (
            <Col xs={24} sm={12} md={8} key={plugin.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  title={plugin.name}
                  extra={
                    installedPlugins.includes(plugin.id) ? (
                      <Tag color="green">
                        <CheckOutlined /> Installed
                      </Tag>
                    ) : (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddPlugin(plugin)}
                      >
                        Add
                      </Button>
                    )
                  }
                  style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                >
                  <Text>{plugin.description}</Text>
                  <p>
                    <strong>Category:</strong> {plugin.category}
                  </p>
                  <p>
                    <strong>Version:</strong> {plugin.version}
                  </p>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Confirmation Modal */}
        <Modal
          title="Confirm Plugin Installation"
          visible={isModalVisible}
          onOk={confirmAddPlugin}
          onCancel={() => setIsModalVisible(false)}
          okText="Install"
          cancelText="Cancel"
        >
          <Text>
            Are you sure you want to install <strong>{selectedPlugin?.name}</strong>?
          </Text>
          <p>{selectedPlugin?.description}</p>
        </Modal>
      </div>
    </div>
  );
};

export default PluginsPage;