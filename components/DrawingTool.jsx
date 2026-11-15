'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Pages where the pen button appears. Change this list to show it elsewhere.
const SHOW_ON = ['/test', '/student', '/teacher', '/client'];

const COLORS = ['#e11d2e', '#111111', '#1d4ed8', '#16a34a', '#facc15', '#ffffff'];
const STICKERS = [
  ['stop', 'Stop'],
  ['giveway', 'Give way'],
  ['light', 'Traffic light'],
  ['zebra', 'Zebra'],
  ['roundabout', 'Roundabout'],
  ['junction', 'T-junction'],
  ['road', 'Road'],
];

function drawSticker(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'stop') {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i + Math.PI / 8;
      const px = Math.cos(a) * s * 0.5, py = Math.sin(a) * s * 0.5;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#d4101f'; ctx.fill();
    ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${s * 0.26}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('STOP', 0, 0);
  } else if (kind === 'giveway') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.4); ctx.lineTo(s * 0.5, -s * 0.4); ctx.lineTo(0, s * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = s * 0.1; ctx.strokeStyle = '#d4101f'; ctx.stroke();
  } else if (kind === 'light') {
    const w = s * 0.4, h = s * 1.1;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, s * 0.08); ctx.fill();
    ['#ef4444', '#f59e0b', '#22c55e'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath();
      ctx.arc(0, -h / 2 + h * (0.2 + i * 0.3), w * 0.3, 0, Math.PI * 2); ctx.fill();
    });
  } else if (kind === 'zebra') {
    const w = s * 1.3, h = s * 0.7;
    ctx.fillStyle = '#4b5563'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) ctx.fillRect(-w / 2 + w * (0.06 + i * 0.16), -h / 2, w * 0.09, h);
  } else if (kind === 'roundabout') {
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = s * 0.25;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
      ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.translate(0, -s * 0.42);
      ctx.beginPath(); ctx.moveTo(s * 0.09, 0); ctx.lineTo(-s * 0.05, -s * 0.08); ctx.lineTo(-s * 0.05, s * 0.08); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'junction') {
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(-s * 0.6, -s * 0.5, s * 1.2, s * 0.3);
    ctx.fillRect(-s * 0.15, -s * 0.5, s * 0.3, s * 1.1);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.03; ctx.setLineDash([s * 0.08, s * 0.08]);
    ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.35); ctx.lineTo(s * 0.6, -s * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.lineTo(0, s * 0.6); ctx.stroke();
  } else if (kind === 'road') {
    ctx.fillStyle = '#4b5563'; ctx.fillRect(-s * 0.2, -s * 0.6, s * 0.4, s * 1.2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.03; ctx.setLineDash([s * 0.1, s * 0.08]);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(0, s * 0.6); ctx.stroke();
  }
  ctx.restore();
}

function drawAction(ctx, a) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = a.color;
  ctx.fillStyle = a.color;
  ctx.lineWidth = a.size;
  ctx.globalAlpha = a.alpha ?? 1;
  ctx.globalCompositeOperation = a.type === 'erase' ? 'destination-out' : 'source-over';
  if (a.type === 'pen' || a.type === 'highlight' || a.type === 'erase') {
    ctx.beginPath();
    ctx.moveTo(a.pts[0].x, a.pts[0].y);
    if (a.pts.length === 1) ctx.lineTo(a.pts[0].x + 0.01, a.pts[0].y);
    a.pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  } else if (a.type === 'line' || a.type === 'arrow') {
    ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke();
    if (a.type === 'arrow') {
      const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
      const hl = Math.max(14, a.size * 4);
      ctx.beginPath();
      ctx.moveTo(a.x2, a.y2);
      ctx.lineTo(a.x2 - hl * Math.cos(ang - 0.4), a.y2 - hl * Math.sin(ang - 0.4));
      ctx.moveTo(a.x2, a.y2);
      ctx.lineTo(a.x2 - hl * Math.cos(ang + 0.4), a.y2 - hl * Math.sin(ang + 0.4));
      ctx.stroke();
    }
  } else if (a.type === 'circle') {
    ctx.beginPath();
    ctx.ellipse((a.x1 + a.x2) / 2, (a.y1 + a.y2) / 2, Math.abs(a.x2 - a.x1) / 2, Math.abs(a.y2 - a.y1) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (a.type === 'rect') {
    ctx.strokeRect(a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1);
  } else if (a.type === 'sticker') {
    ctx.globalAlpha = 1;
    drawSticker(ctx, a.kind, a.x, a.y, 90);
  }
  ctx.restore();
}

export default function DrawingTool() {
  const pathname = usePathname() || '';
  const canvasRef = useRef(null);
  const actions = useRef([]);
  const current = useRef(null);
  const [open, setOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [sticker, setSticker] = useState('stop');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(5);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    actions.current.forEach((a) => drawAction(ctx, a));
    if (current.current) drawAction(ctx, current.current);
  }, []);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    redraw();
  }, [redraw]);

  const shouldShow = SHOW_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!shouldShow) return;
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [shouldShow, resize]);

  const undo = useCallback(() => { actions.current.pop(); redraw(); }, [redraw]);
  const clearAll = () => { actions.current = []; redraw(); };

  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && drawing) { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shouldShow, drawing, undo]);

  if (!shouldShow) return null;

  const pos = (e) => ({ x: e.clientX, y: e.clientY });

  const onDown = (e) => {
    if (!drawing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === 'sticker') {
      actions.current.push({ type: 'sticker', kind: sticker, x: p.x, y: p.y });
      redraw();
      return;
    }
    const base = { type: tool, color, size: tool === 'highlight' ? size * 3 : tool === 'erase' ? size * 4 : size, alpha: tool === 'highlight' ? 0.35 : 1 };
    current.current = ['pen', 'highlight', 'erase'].includes(tool)
      ? { ...base, pts: [p] }
      : { ...base, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    redraw();
  };
  const onMove = (e) => {
    if (!drawing || !current.current) return;
    const p = pos(e);
    if (current.current.pts) current.current.pts.push(p);
    else { current.current.x2 = p.x; current.current.y2 = p.y; }
    redraw();
  };
  const onUp = () => {
    if (!current.current) return;
    actions.current.push(current.current);
    current.current = null;
    redraw();
  };

  const btn = (active) => ({
    padding: '6px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    border: active ? '2px solid #e11d2e' : '1px solid #d1d5db',
    background: active ? '#fee2e2' : '#fff', color: '#111', fontWeight: 600,
  });

  const tools = [
    ['pen', 'Pen'], ['highlight', 'Highlighter'], ['erase', 'Eraser'],
    ['line', 'Line'], ['arrow', 'Arrow'], ['circle', 'Circle'], ['rect', 'Box'],
  ];

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9990,
          pointerEvents: drawing ? 'auto' : 'none', touchAction: 'none',
          cursor: drawing ? 'crosshair' : 'default',
        }}
      />
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
        {open && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 12,
            width: 300, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 10px 30px rgba(0,0,0,.25)', marginBottom: 10,
          }}>
            <button
              onClick={() => setDrawing((d) => !d)}
              style={{ ...btn(drawing), width: '100%', marginBottom: 10, background: drawing ? '#e11d2e' : '#111', color: '#fff', border: 'none', padding: '10px' }}
            >
              {drawing ? 'Drawing ON - tap to use the page' : 'Drawing OFF - tap to start drawing'}
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {tools.map(([k, label]) => (
                <button key={k} style={btn(tool === k)} onClick={() => { setTool(k); setDrawing(true); }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COLORS.map((c) => (
                <button key={c} aria-label={c} onClick={() => setColor(c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: color === c ? '3px solid #e11d2e' : '2px solid #9ca3af' }} />
              ))}
            </div>
            <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 10 }}>
              Thickness
              <input type="range" min="2" max="24" value={size} onChange={(e) => setSize(+e.target.value)} style={{ width: '100%' }} />
            </label>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Road signs (tap, then tap the screen)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {STICKERS.map(([k, label]) => (
                <button key={k} style={btn(tool === 'sticker' && sticker === k)}
                  onClick={() => { setTool('sticker'); setSticker(k); setDrawing(true); }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={btn(false)} onClick={undo}>Undo</button>
              <button style={btn(false)} onClick={clearAll}>Clear all</button>
              <button style={{ ...btn(false), marginLeft: 'auto' }} onClick={() => { setDrawing(false); setOpen(false); }}>Close</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Drawing pen"
          style={{
            width: 54, height: 54, borderRadius: '50%', border: '3px solid #fff', cursor: 'pointer',
            background: '#e11d2e', color: '#fff', fontSize: 24, boxShadow: '0 6px 18px rgba(0,0,0,.35)', float: 'right',
          }}
        >
          ✏️
        </button>
      </div>
    </>
  );
}
