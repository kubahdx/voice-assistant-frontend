import * as React from 'react';
import { motion } from 'framer-motion';

interface EntryAnimationProps {
  onComplete: () => void;
}

const EntryAnimation: React.FC<EntryAnimationProps> = ({ onComplete }) => {
  const gradientColors = ['#C3CB9C', '#A7B37B', '#8A9A5B', '#59651F']; // Shades of your theme green

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: `linear-gradient(-45deg, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]}, ${gradientColors[3]})`,
        backgroundSize: '400% 400%',
      }}
      initial={{ opacity: 1, backgroundPosition: '0% 50%' }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'], // Creates a flowing effect
        opacity: [1, 1, 1, 0], // Stays visible, then fades out
      }}
      transition={{
        backgroundPosition: {
          duration: 4,
          ease: 'easeInOut',
          repeat: 0, // Play the background animation once
        },
        opacity: {
          duration: 1.5, // Fade out duration
          delay: 3, // Start fading out after background animation has mostly played
          ease: 'easeOut',
        },
      }}
      onAnimationComplete={onComplete}
    >
      {/* You could add text or a logo here if desired, e.g., Reflecta fading in and out */}
      {/* <motion.h1 
        className="text-6xl font-bold text-white mix-blend-overlay"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
        transition={{
          opacity: { duration: 3, delay: 0.5, times: [0, 0.3, 0.7, 1] },
          y: { duration: 3, delay: 0.5, times: [0, 0.3, 0.7, 1] },
        }}
      >
        Reflecta
      </motion.h1> */}
    </motion.div>
  );
};

export default EntryAnimation; 