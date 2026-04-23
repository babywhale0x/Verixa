'use client';
import { useState, useEffect } from 'react';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

export function MatrixText({ 
  text, 
  delay = 0 
}: { 
  text: string; 
  delay?: number; 
}) {
  const [displayText, setDisplayText] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Convert delay from seconds to ms
    const startTimeout = setTimeout(() => {
      setIsDecoding(true);
      let iteration = 0;
      
      interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration || char === ' ' || char === '.') {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(interval);
          setIsDecoding(false);
          setDisplayText(text); // Ensure exactly finishing
        }
        
        // Increase iteration pace - smaller number = longer decode
        iteration += 1 / 4; 
      }, 30);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  // Keep layout stable before animation starts
  if (!isDecoding && displayText === '') {
    return <span className="opacity-0">{text}</span>;
  }

  return <span>{displayText}</span>;
}
