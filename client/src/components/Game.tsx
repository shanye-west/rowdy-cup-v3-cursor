import React, { useRef, useEffect } from 'react';

const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  // Set willReadFrequently attribute
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  // ... rest of the canvas setup code ...
}, []);

// ... rest of the code ... 