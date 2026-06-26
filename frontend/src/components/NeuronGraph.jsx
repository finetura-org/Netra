import React, { useEffect, useRef, useState } from 'react';
import { Eye, ExternalLink, HelpCircle } from 'lucide-react';

const NeuronGraph = ({ findings = [], imageUrl }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastHoveredIdRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = 1100);
    let height = (canvas.height = 600);

    // Limit findings to top 35 to prevent clutter, keeping visual clarity high
    const maxNodes = 35;
    const displayFindings = [...findings]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxNodes);

    // Load source image
    const sourceImg = new Image();
    let imgLoaded = false;
    if (imageUrl) {
      sourceImg.src = imageUrl;
      sourceImg.onload = () => {
        imgLoaded = true;
      };
    }

    // Physics constants
    const kRepulsion = 1500;
    const kSpring = 0.05;
    const kGravity = 0.03;
    const friction = 0.88;

    // Node representation
    class Node {
      constructor(id, finding, angle, dist) {
        this.id = id;
        this.finding = finding;
        // Position initialized in a spiral around the center
        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;
        this.targetDist = dist;
        this.angle = angle;
        
        this.vx = 0;
        this.vy = 0;
        this.radius = finding ? Math.max(12, Math.min(25, finding.confidence / 3.5)) : 35; // Size proportional to confidence
        this.mass = this.radius * 0.8;
        this.pulseTime = Math.random() * 100;
        
        // Colors according to dangerness
        if (!finding) {
          this.color = '#0284c7'; // Center is blue
        } else {
          this.color = finding.confidence >= 70 
            ? '#ef4444' // Red - High Danger
            : finding.confidence >= 40 
            ? '#f59e0b' // Yellow/Orange - Medium Danger
            : '#10b981'; // Green - Low Danger
        }
      }

      update() {
        this.pulseTime += 0.05;
        // Introduce small slow wave drift when not dragged/touched to keep branches moving slightly
        if (this.id !== 0) {
          this.vx += Math.sin(this.pulseTime * 0.4 + this.id) * 0.04;
          this.vy += Math.cos(this.pulseTime * 0.4 - this.id) * 0.04;
        }

        // Clamp velocity to a maximum safe speed (15px per frame) to prevent numerical explosion
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 15;
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= friction;
        this.vy *= friction;
      }
    }

    // Initialize Nodes: Index 0 is the Central target node
    const nodes = [];
    nodes.push(new Node(0, null, 0, 0)); // Center

    // Add surrounding URL nodes
    displayFindings.forEach((f, idx) => {
      const angle = (idx / displayFindings.length) * Math.PI * 2;
      // Stagger distance slightly based on confidence (higher confidence closer to center)
      const dist = 140 + (100 - f.confidence) * 1.5 + (idx % 2 ? 30 : 0);
      nodes.push(new Node(idx + 1, f, angle, dist));
    });

    // Tracking mouse movements for interactive physics repulsion
    let mouse = { x: null, y: null, radius: 100 };
    let draggedNode = null;

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      mouse.x = clickX;
      mouse.y = clickY;
      
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - clickX;
        const dy = n.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clickTolerance = i === 0 ? n.radius + 15 : n.radius + 10;
        if (dist <= clickTolerance) {
          draggedNode = n;
          break;
        }
      }
    };

    const handleMouseUp = () => {
      draggedNode = null;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        mouse.x = mx;
        mouse.y = my;
        
        if (draggedNode && mx !== null && my !== null) {
          draggedNode.x = mx;
          draggedNode.y = my;
          draggedNode.vx = 0;
          draggedNode.vy = 0;
        }
      }
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      draggedNode = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Clicking a node redirects to its corresponding URL
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - clickX;
        const dy = n.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= n.radius) {
          if (n.finding && n.finding.source_url) {
            window.open(n.finding.source_url, '_blank');
          }
          break;
        }
      }
    };
    canvas.addEventListener('click', handleCanvasClick);

    const blobsResetCenter = () => {
      nodes[0].x = width / 2;
      nodes[0].y = height / 2;
    };
    blobsResetCenter();

    // Pulses traveling down axons (action potentials)
    const pulses = [];
    let pulseTimer = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Solve Physics Forces
      const center = nodes[0];
      // Keep center anchored or drifting slightly back to middle
      if (draggedNode === center) {
        if (mouse.x !== null && mouse.y !== null) {
          center.x = mouse.x;
          center.y = mouse.y;
        }
        center.vx = 0;
        center.vy = 0;
      } else {
        center.vx += (width / 2 - center.x) * 0.04;
        center.vy += (height / 2 - center.y) * 0.04;
      }

      // Apply forces to other nodes
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];

        if (draggedNode === n) {
          if (mouse.x !== null && mouse.y !== null) {
            n.x = mouse.x;
            n.y = mouse.y;
          }
          n.vx = 0;
          n.vy = 0;
          continue;
        }

        // Gravitational pull back to center
        n.vx += (center.x - n.x) * kGravity;
        n.vy += (center.y - n.y) * kGravity;

        // Spring force to maintain target circular distance
        const dxCenter = n.x - center.x;
        const dyCenter = n.y - center.y;
        const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter) || 1;
        const diffDist = n.targetDist - distCenter;
        
        n.vx += (dxCenter / distCenter) * diffDist * kSpring;
        n.vy += (dyCenter / distCenter) * diffDist * kSpring;

        // Mutual repulsion between nodes (Coulomb-like repulsion)
        for (let j = 1; j < nodes.length; j++) {
          if (i === j) continue;
          const other = nodes[j];
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 180) {
            // Added 800 softening factor to prevent division-by-zero numerical explosions
            const force = kRepulsion / (dist * dist + 800);
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        n.update();
      }
      center.update();

      // Check hover
      let currentHover = null;
      if (mouse.x !== null && mouse.y !== null) {
        for (let i = nodes.length - 1; i >= 0; i--) {
          const n = nodes[i];
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= n.radius) {
            currentHover = n;
            break;
          }
        }
      }
      const currentHoverId = currentHover ? currentHover.id : null;
      if (lastHoveredIdRef.current !== currentHoverId) {
        lastHoveredIdRef.current = currentHoverId;
        setHoveredNode(currentHover);
      }

      // 2. Draw Synaptic/Axon Connections
      ctx.lineWidth = 1;
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        // Draw slightly curved lines to make them look like neural branches
        const midX = (center.x + n.x) / 2 + Math.sin(n.pulseTime) * 8;
        const midY = (center.y + n.y) / 2 + Math.cos(n.pulseTime) * 8;
        ctx.quadraticCurveTo(midX, midY, n.x, n.y);
        
        // Highlight connection if node is hovered
        if (currentHover && (currentHover.id === n.id || currentHover.id === 0)) {
          ctx.strokeStyle = n.color;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(2, 132, 199, 0.18)';
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 3. Emit and update electrical pulses traveling down dendrites
      pulseTimer++;
      if (pulseTimer > 18 && nodes.length > 1) {
        pulseTimer = 0;
        const targetNodeIdx = Math.floor(Math.random() * (nodes.length - 1)) + 1;
        pulses.push({
          targetIdx: targetNodeIdx,
          progress: 0,
          speed: 0.02 + Math.random() * 0.02
        });
      }

      ctx.fillStyle = '#22d3ee';
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;
        const target = nodes[p.targetIdx];
        if (!target) {
          pulses.splice(i, 1);
          continue;
        }
        
        // Calculate point along curve
        const t = p.progress;
        const midX = (center.x + target.x) / 2 + Math.sin(target.pulseTime) * 8;
        const midY = (center.y + target.y) / 2 + Math.cos(target.pulseTime) * 8;
        const x = (1 - t) * (1 - t) * center.x + 2 * (1 - t) * t * midX + t * t * target.x;
        const y = (1 - t) * (1 - t) * center.y + 2 * (1 - t) * t * midY + t * t * target.y;

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#22d3ee';
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Remove completed pulses
        if (p.progress >= 1.0) {
          pulses.splice(i, 1);
        }
      }

      // 4. Draw Surrounding URL Nodes
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        
        ctx.beginPath();
        const pulseRadius = n.radius + Math.sin(n.pulseTime * 2) * 1.5;
        ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
        
        // Solid dark blue fill
        ctx.fillStyle = '#050814';
        ctx.fill();

        // Highlight ring on hover
        if (currentHover && currentHover.id === n.id) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = n.color;
        } else {
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Internal labels removed
      }

      // 5. Draw Central Nucleus (Source Sample Image)
      ctx.save();
      ctx.beginPath();
      const centerPulse = center.radius + Math.sin(center.pulseTime) * 2;
      ctx.arc(center.x, center.y, centerPulse, 0, Math.PI * 2);
      
      // Draw border
      if (currentHover && currentHover.id === 0) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0284c7';
      } else {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.clip();

      if (imgLoaded) {
        // Draw the image inside the circle boundary
        ctx.drawImage(
          sourceImg, 
          center.x - centerPulse, 
          center.y - centerPulse, 
          centerPulse * 2, 
          centerPulse * 2
        );
      } else {
        // Fallback placeholder
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(center.x - centerPulse, center.y - centerPulse, centerPulse * 2, centerPulse * 2);
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("TARGET", center.x, center.y);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [findings, imageUrl]);

  return (
    <div ref={containerRef} className="w-full relative bg-[#030612]/70 rounded-xl border border-slate-800 p-4 min-h-[500px]">
      
      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className={`w-full block bg-transparent cursor-pointer rounded-lg`}
      />

      {/* Floating Info card displaying details of hovered node */}
      <div className="absolute bottom-6 left-6 right-6 max-w-sm pointer-events-none">
        {hoveredNode && hoveredNode.finding ? (
          <div className="bg-slate-950/95 border border-cyan-500/30 p-4 rounded-lg shadow-2xl font-mono text-left animate-[stagger-slide-up_0.2s_ease-out_forwards]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">
                {hoveredNode.finding.source_provider?.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                hoveredNode.finding.confidence >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                hoveredNode.finding.confidence >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                CONFIDENCE: {Math.round(hoveredNode.finding.confidence)}%
              </span>
            </div>
            
            <p className="text-xs font-bold text-slate-100 truncate mb-1" title={hoveredNode.finding.page_title}>
              {hoveredNode.finding.page_title || "Visual Match Target Link"}
            </p>
            <p className="text-[10px] text-slate-400 truncate mb-3" title={hoveredNode.finding.source_url}>
              {hoveredNode.finding.source_url}
            </p>
            
            <span className="text-[9px] text-cyan-300 flex items-center gap-1 font-bold">
              <Eye className="w-3.5 h-3.5" /> CLICK NODE TO OPEN EVIDENCE URL
            </span>
          </div>
        ) : hoveredNode && hoveredNode.id === 0 ? (
          <div className="bg-slate-950/95 border border-cyan-500/30 p-4 rounded-lg shadow-2xl font-mono text-left">
            <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">Forensics Ingestion Nucleus</span>
            <p className="text-xs font-bold text-slate-100 mb-1">Target Case Artifact File</p>
            <p className="text-[10px] text-slate-400">Total matched branches: {findings.length} axons</p>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-slate-650" /> Hover over a neuron terminal to decrypt matched URLs
          </div>
        )}
      </div>

      {/* Quick instructions indicator overlay */}
      <div className="absolute top-6 left-6 text-[10px] font-mono text-slate-500 select-none uppercase tracking-widest pointer-events-none">
        SYNAPSE TRACING ENGINE • ACTIVE
      </div>
    </div>
  );
};

export default NeuronGraph;
