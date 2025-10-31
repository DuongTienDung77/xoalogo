import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ResetZoomIcon } from './icons/ResetZoomIcon';
import { HandIcon } from './icons/HandIcon';
import { PencilIcon } from './icons/PencilIcon';

interface DrawingCanvasProps {
  imageUrl: string;
  onMaskUpdate: (dataUrl: string | null) => void;
}

const MIN_BRUSH_SIZE = 2;
const MAX_BRUSH_SIZE = 50;
const DEFAULT_BRUSH_SIZE = 5;
const MIN_SCALE = 0.2;
const MAX_SCALE = 10;
const ZOOM_SENSITIVITY = 0.001;

const BRUSH_CORE_COLOR = '#FFFFFF';
const BRUSH_GLOW_COLOR = '#00BFFF'; // DeepSkyBlue
const BRUSH_GLOW_BLUR = 15;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ imageUrl, onMaskUpdate }) => {
  const visibleCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for mask data
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'draw' | 'pan'>('draw');
  const [aspectRatio, setAspectRatio] = useState('1 / 1');

  const getCoords = useCallback((event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in event ? event.touches[0] : null;
    const clientX = touch ? touch.clientX : (event as MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (event as MouseEvent).clientY;

    // Translate screen coordinates to canvas coordinates
    const canvasX = (clientX - rect.left) / scale;
    const canvasY = (clientY - rect.top) / scale;
    
    return { x: canvasX, y: canvasY };
  }, [scale]);
  
  // --- Drawing Logic ---
  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const coords = getCoords(event.nativeEvent);
    if (!coords) return;
    setIsDrawing(true);
    lastPos.current = coords;
  }, [getCoords]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const coords = getCoords(event.nativeEvent);
    if (!coords || !lastPos.current) return;
    
    const visibleCtx = visibleCanvasRef.current?.getContext('2d');
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!visibleCtx || !maskCtx) return;

    const drawLine = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.closePath();
    };

    drawLine(visibleCtx);
    drawLine(maskCtx);
    
    lastPos.current = coords;
  }, [isDrawing, getCoords]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    
    const dataCanvas = maskCanvasRef.current;
    const ctx = dataCanvas?.getContext('2d');
    if (!ctx || !dataCanvas || dataCanvas.width === 0 || dataCanvas.height === 0) return;

    const isCanvasBlank = !ctx.getImageData(0, 0, dataCanvas.width, dataCanvas.height).data.some(channel => channel !== 0);
    if (isCanvasBlank) {
      onMaskUpdate(null);
      return;
    }

    const finalMaskCanvas = document.createElement('canvas');
    finalMaskCanvas.width = dataCanvas.width;
    finalMaskCanvas.height = dataCanvas.height;
    const finalMaskCtx = finalMaskCanvas.getContext('2d');

    if (finalMaskCtx) {
      finalMaskCtx.fillStyle = 'black';
      finalMaskCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
      finalMaskCtx.globalCompositeOperation = 'destination-out';
      finalMaskCtx.drawImage(dataCanvas, 0, 0);
      finalMaskCtx.globalCompositeOperation = 'destination-over';
      finalMaskCtx.fillStyle = 'white';
      finalMaskCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
      
      onMaskUpdate(finalMaskCanvas.toDataURL('image/png'));
    }
  }, [isDrawing, onMaskUpdate]);
  
  // --- Interaction (Pan/Draw) Logic ---
  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const touch = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0] : null;
      const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
      const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

      setDragStartPoint({ x: clientX, y: clientY });
      setIsDragging(true);

      if (interactionMode === 'draw') {
          startDrawing(e);
      }
  }, [interactionMode, startDrawing]);

  const handleInteractionMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const touch = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0] : null;
      const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
      const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

      if (interactionMode === 'pan') {
          const dx = clientX - dragStartPoint.x;
          const dy = clientY - dragStartPoint.y;
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          setDragStartPoint({ x: clientX, y: clientY });
      } else {
          draw(e);
      }
  }, [isDragging, interactionMode, dragStartPoint.x, dragStartPoint.y, draw]);
  
  const handleInteractionEnd = useCallback(() => {
      if(interactionMode === 'draw') {
          stopDrawing();
      }
      setIsDragging(false);
  }, [interactionMode, stopDrawing]);
  
  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scroll = e.deltaY * -ZOOM_SENSITIVITY;

      const newScale = Math.min(Math.max(scale + scroll, MIN_SCALE), MAX_SCALE);
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
    const zoomFactor = 1.2;
    const newScale = direction === 'in' ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const newOffsetX = centerX - (centerX - offset.x) * (clampedScale / scale);
      const newOffsetY = centerY - (centerY - offset.y) * (clampedScale / scale);

      setScale(clampedScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };
  
  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const clearCanvas = () => {
    const canvases = [visibleCanvasRef.current, maskCanvasRef.current];
    canvases.forEach(canvas => {
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    onMaskUpdate(null);
  };
  
  const setupCanvas = useCallback(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (image && container) {
      const { width, height } = container.getBoundingClientRect();
      const canvases = [visibleCanvasRef.current, maskCanvasRef.current];
      
      canvases.forEach((canvas) => {
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
        }
      });
      
      const visibleCtx = visibleCanvasRef.current?.getContext('2d');
      if (visibleCtx) {
        visibleCtx.strokeStyle = BRUSH_CORE_COLOR;
        visibleCtx.lineWidth = brushSize;
        visibleCtx.lineCap = 'round';
        visibleCtx.lineJoin = 'round';
        visibleCtx.shadowColor = BRUSH_GLOW_COLOR;
        visibleCtx.shadowBlur = BRUSH_GLOW_BLUR;
      }

      const maskCtx = maskCanvasRef.current?.getContext('2d');
      if (maskCtx) {
        maskCtx.strokeStyle = BRUSH_CORE_COLOR;
        maskCtx.lineWidth = brushSize;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';
      }
    }
  }, [brushSize]);

  useEffect(() => {
    const visibleCtx = visibleCanvasRef.current?.getContext('2d');
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (visibleCtx) {
        visibleCtx.lineWidth = brushSize;
        visibleCtx.shadowColor = BRUSH_GLOW_COLOR;
        visibleCtx.shadowBlur = BRUSH_GLOW_BLUR;
    }
    if(maskCtx) {
        maskCtx.lineWidth = brushSize;
    }
  }, [brushSize]);

  useEffect(() => {
    const image = imageRef.current;
    if (image) {
      const handleResize = () => setupCanvas();
      const handleLoad = () => {
        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
          setAspectRatio(`${image.naturalWidth} / ${image.naturalHeight}`);
        }
        setupCanvas();
      };

      if (image.complete && image.naturalWidth > 0) {
        handleLoad();
      } else {
        image.addEventListener('load', handleLoad);
      }
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        image.removeEventListener('load', handleLoad);
      }
    }
  }, [imageUrl, setupCanvas]);

  const changeBrushSize = (amount: number) => {
    setBrushSize(prev => Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, prev + amount)));
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full flex items-center justify-center touch-none overflow-hidden bg-gray-900/50"
      style={{ aspectRatio }}
      onWheel={handleWheel}
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      onTouchEnd={handleInteractionEnd}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: interactionMode === 'pan' ? 'grab' : 'crosshair'
        }}
       >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Draw mask here"
          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          crossOrigin="anonymous"
          draggable="false"
        />
        <canvas
          ref={maskCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ display: 'none' }} 
        />
        <canvas
          ref={visibleCanvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      <div className="absolute bottom-2 right-2 z-10">
        <button onClick={clearCanvas} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
          Xóa Bản Vẽ
        </button>
      </div>
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-gray-900/70 backdrop-blur-sm p-1.5 rounded-lg border border-gray-700">
        {/* Pan/Draw Toggle */}
        <button onClick={() => setInteractionMode('draw')} className={`p-2 rounded-md text-gray-200 transition-colors ${interactionMode === 'draw' ? 'bg-blue-500' : 'hover:bg-gray-700'}`} aria-label="Chế độ vẽ">
          <PencilIcon className="h-5 w-5" />
        </button>
        <button onClick={() => setInteractionMode('pan')} className={`p-2 rounded-md text-gray-200 transition-colors ${interactionMode === 'pan' ? 'bg-blue-500' : 'hover:bg-gray-700'}`} aria-label="Chế độ kéo">
          <HandIcon className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        {/* Brush Size */}
        <button onClick={() => changeBrushSize(-5)} disabled={brushSize <= MIN_BRUSH_SIZE} className="p-1 rounded-md text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <MinusIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white w-8 text-center" title="Kích thước cọ">{brushSize}</span>
        <button onClick={() => changeBrushSize(5)} disabled={brushSize >= MAX_BRUSH_SIZE} className="p-1 rounded-md text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <PlusIcon className="h-5 w-5" />
        </button>
         <div className="w-px h-6 bg-gray-600 mx-1"></div>
        {/* Zoom Controls */}
         <button onClick={() => handleZoom('out')} disabled={scale <= MIN_SCALE} className="p-2 rounded-md text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Thu nhỏ">
          <ZoomOutIcon className="h-5 w-5" />
        </button>
        <button onClick={() => handleZoom('in')} disabled={scale >= MAX_SCALE} className="p-2 rounded-md text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Phóng to">
          <ZoomInIcon className="h-5 w-5" />
        </button>
        <button onClick={resetTransform} className="p-2 rounded-md text-gray-200 hover:bg-gray-700 transition-colors" aria-label="Đặt lại chế độ xem">
          <ResetZoomIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};