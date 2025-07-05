import { useEffect, useState } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

export default function RotatingSubtitle() {
  const theme = useTheme();
  const subtitles = [
    "downloading confidence",
    "installing curiosity", 
    "upgrading potential"
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % subtitles.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [subtitles.length]);
  
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: theme.fonts.mono,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: theme.colors.text.secondary,
          fontSize: '0.9em'
        }}
      >
        {subtitles[currentIndex]}_
      </motion.span>
    </AnimatePresence>
  );
}
