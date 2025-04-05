import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Feature {
  name: string;
  color: string;
  icon: string | React.ReactNode;
}

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20, duration: 0.5 },
  },
  hover: {
    scale: 1.1,
    boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)',
    transition: { type: 'spring', stiffness: 300 },
  },
};

const textVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.2, duration: 0.4 },
  },
  hover: {
    color: '#ff6b6b',
    transition: { duration: 0.3 },
  },
};

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <Link to={`/${feature.name.toLowerCase().replace(' ', '-')}`} key={index}>
      <motion.div 
        style={{
          flex: '1 0 clamp(80px, 20%, 120px)',
          maxWidth: 'clamp(80px, 20%, 120px)',
          minWidth: '80px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }} 
        whileHover="hover"
      >
        <motion.div
          variants={circleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            backgroundColor: feature.color,
            borderRadius: '50%',
            width: 'clamp(50px, 12vw, 100px)',
            height: 'clamp(50px, 12vw, 100px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'clamp(16px, 4vw, 36px)',
            cursor: 'pointer',
            marginBottom: 'clamp(2px, 1vw, 5px)', 
          }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
        >
          {feature.icon}
        </motion.div>
        <motion.div
          variants={textVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            fontSize: 'clamp(12px, 2.5vw, 18px)',
            fontWeight: 'bold',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {feature.name}
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default FeatureCard;