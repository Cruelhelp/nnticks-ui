
import React, { useEffect, useRef } from 'react';

interface TrainingAnimationProps {
  active: boolean;
  stats: {
    accuracy: number;
    epochs: number;
    loss: number;
  };
}

export const TrainingAnimation: React.FC<TrainingAnimationProps> = ({ active, stats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const drawNetwork = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw neural network visualization
      const layers = [4, 8, 8, 4];
      const layerSpacing = canvas.width / (layers.length + 1);

      for (let i = 0; i < layers.length; i++) {
        const y = canvas.height / 2;
        const x = (i + 1) * layerSpacing;

        // Draw nodes with glow effect
        ctx.shadowColor = 'hsl(var(--primary))';
        ctx.shadowBlur = active ? 15 : 5;
        ctx.fillStyle = active ? 'hsl(var(--primary))' : 'hsl(var(--muted))';

        for (let j = 0; j < layers[i]; j++) {
          const nodeY = y + (j - layers[i] / 2) * 30;
          ctx.beginPath();
          ctx.arc(x, nodeY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    let animationFrame: number;
    const animate = () => {
      drawNetwork();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [active, stats]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-64 bg-background/50"
      style={{ filter: active ? 'contrast(1.2)' : 'none' }}
    />
  );
};
