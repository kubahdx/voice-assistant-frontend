import * as React from 'react';
import { motion } from 'framer-motion';

interface EntryAnimationProps {
  onComplete: () => void;
}

const EntryAnimation: React.FC<EntryAnimationProps> = ({ onComplete }) => {
  // Rozszerzona paleta zieleni, od jaśniejszego do ciemniejszego
  const gradientColors = [
    '#D9E0B3', // Jaśniejszy odcień
    '#C3CB9C', 
    '#A7B37B',
    '#8A9A5B',
    '#707D4A', // Dodatkowy pośredni odcień
    '#59651F',
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-16 z-[100]" // Pasek na dole, wysokość np. h-16 (64px)
      style={{
        background: `linear-gradient(-45deg, ${gradientColors.join(', ')})`,
        backgroundSize: '600% 600%', // Zwiększony rozmiar dla płynniejszego przejścia z większą liczbą kolorów
      }}
      initial={{ opacity: 1, backgroundPosition: '0% 50%', height: '4rem' }} // height: '4rem' to odpowiednik h-16
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        opacity: [1, 1, 0], // Pozostaje widoczny, potem zanika
      }}
      transition={{
        backgroundPosition: {
          duration: 2.5, // Krótszy czas płynięcia gradientu
          ease: 'easeInOut',
          repeat: 0,
        },
        opacity: {
          duration: 1, // Czas zanikania
          delay: 2,    // Zacznij zanikać po 2s
          ease: 'easeOut',
        },
      }}
      onAnimationComplete={onComplete}
    />
  );
};

export default EntryAnimation; 