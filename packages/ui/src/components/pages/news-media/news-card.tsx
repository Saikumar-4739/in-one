import React from 'react';
import { motion } from 'framer-motion';
import { Card } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import './news-page.css';
import { NewsItem } from './news-model';
import noImage from '../../../assets/No Image Available (1).png'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
};

interface NewsCardProps {
  newsItem: NewsItem;
  handleFullView: (newsItem: NewsItem) => void | Promise<void>;
}

const getNewsImage = (newsItem: NewsItem): string | undefined =>
  newsItem.images && newsItem.images.length > 0 ? newsItem.images[0] : undefined;

const NewsCard = React.memo(({ newsItem, handleFullView }: NewsCardProps) => (
  <motion.div
    key={newsItem.id}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    transition={{ duration: 0.4 }}
  >
    <Card
      className="news-card"
      hoverable
      onClick={() => handleFullView(newsItem)}
      cover={ <img src={getNewsImage(newsItem) || noImage} className="news-card-image" onError={(e) => { e.currentTarget.src = noImage;}} alt="news"/>
      }
    >
      <div className="news-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis' }}>{newsItem.title}</span>
        <span style={{ marginLeft: '8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
          <EyeOutlined style={{ marginRight: 4 }} /> {newsItem.views || 0}
        </span>
      </div>
    </Card>
  </motion.div>
));

export default NewsCard;