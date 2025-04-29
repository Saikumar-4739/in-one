import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button, Select, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { NewsHelpService } from '@in-one/shared-services';
import './news-page.css';
import NewsCard from './news-card';
import NewsActions from './news-action-page';
import NewsModals from './news-modal-page';

const { Text } = Typography;
const { Option } = Select;

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  images: string[];
  category: string;
  likes: number;
  dislikes: number;
  comments: any[];
  views: number;
  author: { id: string; username: string };
  isLiked?: boolean;
  isDisliked?: boolean;
  isImportant?: boolean;
  isBreaking?: boolean;
}

const NewsPageMain: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(6);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isNewsModalVisible, setIsNewsModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [commentNewsId, setCommentNewsId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const newsService = new NewsHelpService();
  const newsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNews();
  }, [currentPage, categoryFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && news.length < total) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    if (newsContainerRef.current) {
      newsContainerRef.current.appendChild(sentinel);
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel && newsContainerRef.current) {
        observer.unobserve(sentinel);
        newsContainerRef.current.removeChild(sentinel);
      }
    };
  }, [loading, news.length, total]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAllNews(currentPage, pageSize);
      if (response.status) {
        let filteredNews = (response.data.news || []) as NewsItem[];
        if (categoryFilter) {
          filteredNews = filteredNews.filter((item) => item.category === categoryFilter);
        }
        setNews((prev) => {
          const newNews = currentPage === 1 ? filteredNews : [...prev, ...filteredNews];
          const uniqueNews = Array.from(
            new Map(newNews.map((item) => [item.id, item])).values()
          ) as NewsItem[];
          return uniqueNews;
        });
        setTotal(response.data.total || 0);
      } else {
        message.error(response.internalMessage || 'Failed to fetch news');
      }
    } catch (error: any) {
      message.error(error.message || 'An error occurred while fetching news');
    } finally {
      setLoading(false);
    }
  };

  const handleFullView = async (newsItem: NewsItem) => {
    setLoading(true);
    try {
      const updatedNews = { ...newsItem, views: (newsItem.views || 0) + 1 };
      setSelectedNews(updatedNews);
      setNews((prev) =>
        prev.map((item) => (item.id === newsItem.id ? updatedNews : item))
      );
      await newsService.updateNews(newsItem.id, { views: updatedNews.views } as any);
    } catch (error: any) {
      message.error(error.message || 'An error occurred while updating view count');
    } finally {
      setLoading(false);
    }
  };

  const closeFullView = () => {
    setSelectedNews(null);
  };

  const categories = Array.from(new Set(news.map((item) => item.category)));
  const breakingNews = news.find((item) => item.isBreaking) || null;

  return (
    <div className="news-page-container">
      <div className="news-content-wrapper">
        <motion.div
          className="news-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {userId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsNewsModalVisible(true)}
              className="create-news-btn"
            >
              Create News
            </Button>
          )}
        </motion.div>

        {breakingNews && (
          <motion.div
            className="breaking-news-wrapper"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="breaking-news-section">
              Breaking: {breakingNews.title}
            </div>
            <Select
              className="category-dropdown-inline"
              placeholder="Select Category"
              onChange={(value: string) => {
                setCategoryFilter(value);
                setCurrentPage(1);
                setNews([]);
              }}
              allowClear
              onClear={() => {
                setCategoryFilter(null);
                setCurrentPage(1);
                setNews([]);
              }}
            >
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </motion.div>
        )}

        <div className="main-content">
          <div className={`news-grid-container ${selectedNews ? 'with-full-view' : ''}`} ref={newsContainerRef}>
            <motion.div variants={sectionVariants} initial="hidden" animate="visible">
              {loading && news.length === 0 ? (
                <div className="loading-text">
                  <Text>Loading...</Text>
                </div>
              ) : news.length === 0 ? (
                <div className="no-news-text">
                  <Text>No news available.</Text>
                </div>
              ) : (
                <div className="latest-news-grid">
                  {news.map((newsItem) => (
                    <NewsCard key={newsItem.id} newsItem={newsItem} handleFullView={handleFullView} />
                  ))}
                </div>
              )}
              {loading && news.length > 0 && (
                <div className="loading-text">
                  <Text>Loading more...</Text>
                </div>
              )}
            </motion.div>
          </div>

          {selectedNews && (
            <NewsActions
              selectedNews={selectedNews}
              userId={userId}
              newsService={newsService}
              setNews={setNews}
              closeFullView={closeFullView}
              setIsNewsModalVisible={setIsNewsModalVisible}
              setEditingNewsId={setEditingNewsId}
              setIsCommentModalVisible={setIsCommentModalVisible}
              setCommentNewsId={setCommentNewsId}
            />
          )}
        </div>

        <NewsModals
          userId={userId}
          newsService={newsService}
          isNewsModalVisible={isNewsModalVisible}
          setIsNewsModalVisible={setIsNewsModalVisible}
          isCommentModalVisible={isCommentModalVisible}
          setIsCommentModalVisible={setIsCommentModalVisible}
          editingNewsId={editingNewsId}
          setEditingNewsId={setEditingNewsId}
          commentNewsId={commentNewsId}
          selectedNews={selectedNews}
          setNews={setNews}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default NewsPageMain;