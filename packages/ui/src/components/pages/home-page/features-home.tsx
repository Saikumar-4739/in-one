import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used

// Define the Feature type
interface Feature {
  name: string;
  color: string;
  icon: string | React.ReactNode; // Icon can be a string (e.g., emoji) or a React component
}

// Define animation variants for the circle
const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      duration: 0.5,
    },
  },
  hover: {
    scale: 1.1,
    boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)',
    transition: {
      type: 'spring',
      stiffness: 300,
    },
  },
};

// Define text animation variants
const textVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.4,
    },
  },
  hover: {
    color: '#ff6b6b', // Change color on hover (customize as needed)
    transition: { duration: 0.3 },
  },
};

// Define the props for the FeatureCard component
interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <Link to={`/${feature.name.toLowerCase().replace(' ', '-')}`} key={index}>
      <motion.div
        style={{
          flex: '1 1 clamp(80px, 20vw, 120px)', // Responsive base width
          maxWidth: 'clamp(80px, 20vw, 120px)', // Scales with screen
          textAlign: 'center',
        }}
        whileHover="hover" // Trigger hover state for the entire card
      >
        <motion.div
          variants={circleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          whileHover="hover" // Individual hover effect for the circle
          style={{
            backgroundColor: feature.color,
            borderRadius: '50%',
            width: 'clamp(50px, 12vw, 100px)',
            height: 'clamp(50px, 12vw, 100px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto clamp(2px, 1vw, 5px)',
            color: '#fff',
            fontSize: 'clamp(16px, 4vw, 36px)',
            cursor: 'pointer', // Indicates interactivity
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
            marginBottom: 'clamp(2px, 1vw, 5px)',
          }}
        >
          {feature.name}
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default FeatureCard;