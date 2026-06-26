import React, { useEffect, useRef } from 'react';

const LightningBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    // Time variables for color cycling and phase movement
    let hueTime = 0;
    
    // Gradient blobs mapping to the blue-green theme from the image
    const blobs = [
      {
        baseX: width * 0.25,
        baseY: height * 0.3,
        baseRadius: Math.max(width, height) * 0.65,
        hue: 195, // Teal/Blue range
        speed: 0.005, // Faster drift
        phase: 0
      },
      {
        baseX: width * 0.75,
        baseY: height * 0.7,
        baseRadius: Math.max(width, height) * 0.7,
        hue: 155, // Green/Emerald range
        speed: 0.004,
        phase: Math.PI
      },
      {
        baseX: width * 0.65,
        baseY: height * 0.25,
        baseRadius: Math.max(width, height) * 0.55,
        hue: 180, // Turquoise range
        speed: 0.006,
        phase: Math.PI / 2
      },
      {
        baseX: width * 0.35,
        baseY: height * 0.75,
        baseRadius: Math.max(width, height) * 0.6,
        hue: 210, // Deep blue range
        speed: 0.0045,
        phase: Math.PI * 1.5
      }
    ];

    // Subtle floating data packets to make the background clearly live/active
    const particles = [];
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.6 - 0.2, // Drifts upwards
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(52, 211, 153, 0.4)'
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      blobs.forEach((blob, idx) => {
        const layoutCoords = [
          { x: width * 0.25, y: height * 0.3 },
          { x: width * 0.75, y: height * 0.7 },
          { x: width * 0.65, y: height * 0.25 },
          { x: width * 0.35, y: height * 0.75 }
        ];
        blob.baseX = layoutCoords[idx].x;
        blob.baseY = layoutCoords[idx].y;
        blob.baseRadius = Math.max(width, height) * 0.6;
      });
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      // Clear with dark blue-black base
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Faster hue offset increment for visible color "play"
      hueTime += 0.007;

      // Draw fluid mesh gradient color blobs
      ctx.globalCompositeOperation = 'screen';
      blobs.forEach((blob, idx) => {
        blob.phase += blob.speed;
        
        // Circular orbital movement
        const driftX = Math.sin(blob.phase) * (width * 0.15);
        const driftY = Math.cos(blob.phase * 0.7) * (height * 0.15);
        const currentX = blob.baseX + driftX;
        const currentY = blob.baseY + driftY;

        // Radial breathing scale
        const radius = blob.baseRadius + Math.sin(blob.phase * 1.3) * 60;

        // Shift color hue dynamically
        let currentHue;
        if (idx % 2 === 0) {
          // Teal-blue range oscillations (185 to 225)
          currentHue = 205 + Math.sin(hueTime + idx) * 20;
        } else {
          // Green-emerald range oscillations (130 to 170)
          currentHue = 150 + Math.cos(hueTime + idx) * 20;
        }

        // Draw radial glowing blob
        const grad = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, radius
        );
        grad.addColorStop(0, `hsla(${currentHue}, 80%, 42%, 0.38)`);
        grad.addColorStop(0.5, `hsla(${currentHue}, 85%, 35%, 0.15)`);
        grad.addColorStop(1, `hsla(${currentHue}, 85%, 35%, 0)`);

        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Restore default compositing
      ctx.globalCompositeOperation = 'source-over';

      // Draw faint, thin grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
      ctx.lineWidth = 0.5;
      const gridSize = 100;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw floating data packets (particles)
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        
        // Loop particles when they float off the top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.vx *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -10, // Explicitly place behind root elements
        pointerEvents: 'none',
      }}
    />
  );
};

export default LightningBackground;
