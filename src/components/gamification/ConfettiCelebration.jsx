
import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import useWindowSize from '@/hooks/useWindowSize';

const ConfettiCelebration = ({ onComplete }) => {
  const { width, height } = useWindowSize();
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRunning(false);
    }, 5000); // Run confetti for 5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <ReactConfetti
      width={width}
      height={height}
      recycle={isRunning}
      numberOfPieces={isRunning ? 200 : 0}
      onConfettiComplete={() => {
        if (!isRunning) {
          onComplete();
        }
      }}
      className="!fixed top-0 left-0 w-full h-full z-[100]"
    />
  );
};

export default ConfettiCelebration;
