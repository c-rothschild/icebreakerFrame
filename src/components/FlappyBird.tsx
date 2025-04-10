import React, { useEffect, useRef, useState } from 'react';

interface Bird {
  y: number;
  velocity: number;
  width: number;
  height: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  width: number;
  gap: number;
  passed: boolean;
}

interface FlappyBirdProps {
  width?: number;
  height?: number;
}

const FlappyBird: React.FC<FlappyBirdProps> = ({ width = 350, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  
  // Game state
  const [bird, setBird] = useState<Bird>({
    y: height / 2.5,
    velocity: 0,
    width: 30,
    height: 24
  });
  
  const [pipes, setPipes] = useState<Pipe[]>([]);
  
  // Game constants
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -8;
  const PIPE_SPEED = 2;
  const PIPE_WIDTH = 50;
  const PIPE_GAP = 150;
  const PIPE_SPAWN_INTERVAL = 120;
  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;
  
  // Frame counting for pipe spawning
  const frameCountRef = useRef(0);
  const requestIdRef = useRef<number | null>(null);
  
  const drawBird = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#FFDE59';
    ctx.beginPath();
    ctx.ellipse(
      50, 
      bird.y, 
      bird.width / 2, 
      bird.height / 2, 
      0, 
      0, 
      2 * Math.PI
    );
    ctx.fill();
    
    // Draw eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(60, bird.y - 5, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw pupil
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(62, bird.y - 5, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw beak
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.moveTo(65, bird.y);
    ctx.lineTo(75, bird.y - 5);
    ctx.lineTo(75, bird.y + 5);
    ctx.closePath();
    ctx.fill();
  };
  
  const drawPipes = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#4dabf7';
    
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      // Bottom pipe
      ctx.fillRect(
        pipe.x, 
        pipe.topHeight + pipe.gap, 
        pipe.width, 
        pipe.bottomHeight
      );
    });
  };
  
  const drawScore = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 30);
  };
  
  const drawStartScreen = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    ctx.font = '16px sans-serif';
    ctx.fillText(
      gameOver ? 'Game Over! Click to restart' : 'Click to start', 
      CANVAS_WIDTH / 2, 
      CANVAS_HEIGHT / 2
    );
    
    if (gameOver) {
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
  };
  
  const updateGame = () => {
    if (!gameStarted || gameOver) return;
    
    // Update bird
    setBird(prev => ({
      ...prev,
      y: prev.y + prev.velocity,
      velocity: prev.velocity + GRAVITY
    }));
    
    // Spawn new pipes
    frameCountRef.current += 1;
    if (frameCountRef.current >= PIPE_SPAWN_INTERVAL) {
      frameCountRef.current = 0;
      
      const topHeight = Math.floor(Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 80)) + 20;
      
      setPipes(prev => [
        ...prev,
        {
          x: CANVAS_WIDTH,
          topHeight,
          bottomHeight: CANVAS_HEIGHT - topHeight - PIPE_GAP,
          width: PIPE_WIDTH,
          gap: PIPE_GAP,
          passed: false
        }
      ]);
    }
    
    // Update pipes
    setPipes(prev => prev
      .map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED,
        passed: pipe.passed || (pipe.x + pipe.width < 50)
      }))
      .filter(pipe => pipe.x + pipe.width > 0)
    );
    
    // Check for collisions
    const birdRect = {
      left: 50 - bird.width / 2,
      right: 50 + bird.width / 2,
      top: bird.y - bird.height / 2,
      bottom: bird.y + bird.height / 2
    };
    
    // Check if bird hits ground or ceiling
    if (birdRect.bottom > CANVAS_HEIGHT || birdRect.top < 0) {
      endGame();
      return;
    }
    
    // Check for pipe collisions
    pipes.forEach(pipe => {
      // Skip pipes that are already passed
      if (pipe.x + pipe.width < birdRect.left) return;
      
      if (
        // Bird is horizontally aligned with pipe
        birdRect.right > pipe.x && birdRect.left < pipe.x + pipe.width &&
        // Bird touches top or bottom pipe
        (birdRect.top < pipe.topHeight || birdRect.bottom > pipe.topHeight + pipe.gap)
      ) {
        endGame();
        return;
      }
      
      // Update score
      if (!pipe.passed && pipe.x + pipe.width < 50) {
        setScore(prev => prev + 1);
      }
    });
  };
  
  const endGame = () => {
    setGameOver(true);
    setHighScore(prev => Math.max(prev, score));
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
  };
  
  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      setBird({
        y: height / 2.5,
        velocity: 0,
        width: 30,
        height: 24
      });
      setPipes([]);
      frameCountRef.current = 0;
    } else if (!gameOver) {
      setBird(prev => ({
        ...prev,
        velocity: JUMP_STRENGTH
      }));
    } else {
      // Restart game
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      setBird({
        y: height / 2.5,
        velocity: 0,
        width: 30,
        height: 24
      });
      setPipes([]);
      frameCountRef.current = 0;
    }
  };
  
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update canvas dimensions if they've changed
    if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Draw grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 10);
    
    // Draw game elements
    drawPipes(ctx);
    drawBird(ctx);
    drawScore(ctx);
    
    // Draw start/game over screen
    if (!gameStarted || gameOver) {
      drawStartScreen(ctx);
    }
    
    // Update game state
    updateGame();
    
    // Continue game loop
    if (gameStarted && !gameOver) {
      requestIdRef.current = requestAnimationFrame(renderGame);
    }
  };
  
  useEffect(() => {
    // Set up game loop
    requestIdRef.current = requestAnimationFrame(renderGame);
    
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [gameStarted, gameOver, bird, pipes, score, canvasSize]);

  // Add this useEffect to handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        // Update canvas size state
        setCanvasSize({
          width: containerWidth,
          height: containerHeight
        });
        
        // Also update the bird position when resizing
        setBird(prev => ({
          ...prev,
          y: containerHeight / 2.5
        }));
      }
    };
    
    // Set initial size
    updateSize();
    
    // Update on resize
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-screen">
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        className="w-full h-full border-0 touch-manipulation"
        style={{ touchAction: "manipulation" }}
      />
    </div>
  );
};

export default FlappyBird;