'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  Move,
  Type,
  MapPin,
  PenTool,
  Save,
  Trash2,
  Check,
  MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageAnnotation {
  id: string;
  type: 'POINT' | 'LINE';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  endX?: number; // Percentage 0-100
  endY?: number; // Percentage 0-100
  text?: string;
  color?: string;
}

interface ImageAnnotatorProps {
  imageUrl: string;
  initialAnnotations?: ImageAnnotation[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (annotations: ImageAnnotation[]) => void;
  readonly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ImageAnnotator({
  imageUrl,
  initialAnnotations = [],
  isOpen,
  onClose,
  onSave,
  readonly = false
}: ImageAnnotatorProps) {
  // Viewer State
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(initialAnnotations);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [mode, setMode] = useState<'PAN' | 'POINT' | 'LINE'>('PAN');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Transform State
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotation = useMotionValue(0);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const transformStartRef = useRef<{ x: number; y: number; scale: number; rotation: number } | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Line drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<ImageAnnotation> | null>(null);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setAnnotations(initialAnnotations);
      resetTransform();
      setMode(readonly ? 'PAN' : 'PAN');
    }
  }, [isOpen, initialAnnotations, readonly]);

  // Sync zoom display
  useEffect(() => {
    return scale.on("change", (s) => setZoomDisplay(Math.round(s * 100)));
  }, []);

  const resetTransform = useCallback(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
    rotation.set(0);
  }, [x, y, scale, rotation]);

  // ============================================================================
  // TRANSFORM LOGIC (Reused from DocumentManager)
  // ============================================================================

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentScale = scale.get();
    const nextStep = Math.floor(currentScale * 2 + 1) / 2;
    scale.set(Math.min(nextStep, 10));
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentScale = scale.get();
    const prevStep = Math.ceil(currentScale * 2 - 1) / 2;
    scale.set(Math.max(prevStep, 1));
  }, []);

  const rotate90 = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentRotation = rotation.get();
    const snappedRotation = Math.round(currentRotation / 90) * 90;
    rotation.set((snappedRotation + 90) % 360);
  }, [rotation]);

  const toggleFullscreen = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    
    // Only zoom if in PAN mode or holding Ctrl
    if (mode !== 'PAN' && !e.ctrlKey) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    const delta = Math.sign(e.deltaY);
    const factor = 1.1;
    const scaleMultiplier = delta > 0 ? factor : 1 / factor; // Wheel down = zoom out (usually), but let's stick to standard map zoom
    // Actually standard is Wheel Down = Zoom Out (positive deltaY), Wheel Up = Zoom In (negative deltaY)
    // My previous code: delta > 0 ? factor : 1/factor => Positive deltaY (down) -> factor (grow). Wait.
    // Usually Wheel Down (positive) -> content moves away (zoom out).
    // Let's invert: delta < 0 ? factor : 1/factor.
    
    const zoomFactor = e.deltaY < 0 ? factor : 1 / factor;

    const currentScale = scale.get();
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 1), 10);
    
    const currentX = x.get();
    const currentY = y.get();
    
    const newX = mouseX - (mouseX - currentX) * (newScale / currentScale);
    const newY = mouseY - (mouseY - currentY) * (newScale / currentScale);
    
    scale.set(newScale);
    x.set(newX);
    y.set(newY);
  };

  // ============================================================================
  // INTERACTION LOGIC
  // ============================================================================

  const getRelativeCoords = (e: React.PointerEvent | MouseEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate position relative to the image element
    const relX = (e.clientX - rect.left) / rect.width * 100;
    const relY = (e.clientY - rect.top) / rect.height * 100;
    
    return { x: relX, y: relY };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (mode === 'PAN') {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      transformStartRef.current = { 
        x: x.get(), 
        y: y.get(), 
        scale: scale.get(), 
        rotation: rotation.get() 
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else if (mode === 'POINT') {
      const { x, y } = getRelativeCoords(e);
      // Add point immediately
      const newAnnotation: ImageAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'POINT',
        x,
        y,
        text: ''
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setSelectedAnnotationId(newAnnotation.id);
      setMode('PAN'); // Switch back to pan after adding
    } else if (mode === 'LINE') {
      const { x, y } = getRelativeCoords(e);
      setIsDrawing(true);
      setCurrentDrawing({
        id: Math.random().toString(36).substring(2, 9),
        type: 'LINE',
        x,
        y,
        endX: x,
        endY: y,
        text: ''
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (mode === 'PAN' && dragStartRef.current && transformStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      x.set(transformStartRef.current.x + dx);
      y.set(transformStartRef.current.y + dy);
    } else if (mode === 'LINE' && isDrawing && currentDrawing) {
      const { x, y } = getRelativeCoords(e);
      setCurrentDrawing(prev => ({ ...prev, endX: x, endY: y }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (mode === 'PAN') {
      dragStartRef.current = null;
      transformStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } else if (mode === 'LINE' && isDrawing && currentDrawing) {
      setIsDrawing(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      
      // Finalize line
      const finalAnnotation = currentDrawing as ImageAnnotation;
      setAnnotations(prev => [...prev, finalAnnotation]);
      setSelectedAnnotationId(finalAnnotation.id);
      setCurrentDrawing(null);
      setMode('PAN');
    }
  };

  // Update annotation text
  const updateAnnotationText = (id: string, text: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    if (selectedAnnotationId) return; // Don't hide if editing annotation

    controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
    }, 3000);
  }, [selectedAnnotationId]);

  useEffect(() => {
    window.addEventListener('mousemove', resetControlsTimeout);
    return () => {
        window.removeEventListener('mousemove', resetControlsTimeout);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={viewerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      >
        {/* ================= HEADER CONTROLS ================= */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300",
          !showControls && !selectedAnnotationId && "-translate-y-full"
        )}>
          <div className="flex items-center gap-4">
             <div className="bg-[var(--bg-active)] rounded-lg p-1 flex items-center gap-1 border border-[var(--border)] backdrop-blur-md">
                <button
                  onClick={() => setMode('PAN')}
                  className={cn("p-2 rounded-md transition-colors", mode === 'PAN' ? "bg-blue-500 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
                  title="Déplacer"
                >
                  <Move className="w-5 h-5" />
                </button>
                {!readonly && (
                  <>
                    <button
                      onClick={() => setMode('POINT')}
                      className={cn("p-2 rounded-md transition-colors", mode === 'POINT' ? "bg-blue-500 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
                      title="Ajouter une note (Point)"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setMode('LINE')}
                      className={cn("p-2 rounded-md transition-colors", mode === 'LINE' ? "bg-blue-500 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
                      title="Dessiner une ligne"
                    >
                      <PenTool className="w-5 h-5" />
                    </button>
                  </>
                )}
             </div>
             
             <div className="bg-[var(--bg-active)] rounded-lg p-1 flex items-center gap-1 border border-[var(--border)] backdrop-blur-md">
                <button onClick={handleZoomOut} className="p-2 hover:bg-[var(--bg-active)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-center">{zoomDisplay}%</span>
                <button onClick={handleZoomIn} className="p-2 hover:bg-[var(--bg-active)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <ZoomIn className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="flex items-center gap-2">
            {!readonly && (
              <button
                onClick={() => { onSave(annotations); onClose(); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-[var(--bg-active)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ================= MAIN VIEWPORT ================= */}
        <div 
          ref={containerRef}
          className="w-full h-full overflow-hidden cursor-crosshair relative touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          <motion.div
            className="absolute left-1/2 top-1/2 origin-center will-change-transform"
            style={{ x, y, scale, rotate: rotation }}
          >
             {/* IMAGE CONTAINER */}
             <div className="relative">
               <img
                 ref={imageRef}
                 src={imageUrl}
                 alt="Annotation target"
                 className="max-w-none max-h-[85vh] shadow-2xl pointer-events-none select-none"
                 draggable={false}
               />
               
               {/* ANNOTATIONS OVERLAY */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                 {/* Existing Lines */}
                 {annotations.filter(a => a.type === 'LINE').map(a => (
                   <line
                     key={a.id}
                     x1={`${a.x}%`}
                     y1={`${a.y}%`}
                     x2={`${a.endX}%`}
                     y2={`${a.endY}%`}
                     stroke={selectedAnnotationId === a.id ? "#3b82f6" : "#ef4444"}
                     strokeWidth="4"
                     strokeLinecap="round"
                     className="drop-shadow-md transition-colors duration-200"
                   />
                 ))}
                 
                 {/* Current Drawing Line */}
                 {isDrawing && currentDrawing && currentDrawing.type === 'LINE' && (
                   <line
                     x1={`${currentDrawing.x}%`}
                     y1={`${currentDrawing.y}%`}
                     x2={`${currentDrawing.endX}%`}
                     y2={`${currentDrawing.endY}%`}
                     stroke="#3b82f6"
                     strokeWidth="4"
                     strokeLinecap="round"
                     strokeDasharray="8 4"
                   />
                 )}
               </svg>

               {/* ANNOTATION MARKERS (HTML for interactivity) */}
               {annotations.map(a => (
                 <div
                   key={a.id}
                   className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto"
                   style={{ 
                     left: `${a.type === 'POINT' ? a.x : (a.x + (a.endX || a.x)) / 2}%`, 
                     top: `${a.type === 'POINT' ? a.y : (a.y + (a.endY || a.y)) / 2}%`,
                     zIndex: selectedAnnotationId === a.id ? 50 : 10
                   }}
                   onClick={(e) => {
                     e.stopPropagation();
                     setSelectedAnnotationId(a.id);
                   }}
                 >
                   {a.type === 'POINT' ? (
                     <div className={cn(
                       "w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                       selectedAnnotationId === a.id ? "bg-blue-500 scale-125" : "bg-red-500"
                     )}>
                       <MapPin className="w-5 h-5 text-white" />
                     </div>
                   ) : (
                     <div className={cn(
                       "w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                       selectedAnnotationId === a.id ? "bg-blue-500 scale-125" : "bg-red-500"
                     )}>
                       <PenTool className="w-3 h-3 text-white" />
                     </div>
                   )}
                   
                   {/* Tooltip Label */}
                   {a.text && selectedAnnotationId !== a.id && (
                     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap pointer-events-none">
                       {a.text}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </motion.div>
        </div>

        {/* ================= ANNOTATION EDITOR POPUP ================= */}
        <AnimatePresence>
          {selectedAnnotationId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                  {annotations.find(a => a.id === selectedAnnotationId)?.type === 'POINT' ? <MapPin className="w-4 h-4 text-blue-400" /> : <PenTool className="w-4 h-4 text-blue-400" />}
                  Modifier la note
                </span>
                <button onClick={() => setSelectedAnnotationId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <textarea
                value={annotations.find(a => a.id === selectedAnnotationId)?.text || ''}
                onChange={(e) => updateAnnotationText(selectedAnnotationId, e.target.value)}
                placeholder="Ajouter une note ou une observation..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500/50 min-h-[80px] resize-none"
                autoFocus
              />
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => deleteAnnotation(selectedAnnotationId)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
                <button
                  onClick={() => setSelectedAnnotationId(null)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
