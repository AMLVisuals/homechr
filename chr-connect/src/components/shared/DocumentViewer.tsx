import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { AudioWaveformViewer } from './AudioWaveformViewer';
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  Sun,
  Moon,
  Download,
  Move,
  RefreshCw,
  MapPin,
  PenTool,
  Save,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EquipmentDocument, DocumentType, ImageAnnotation } from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface DocumentViewerProps {
  document: EquipmentDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedDoc: EquipmentDocument) => void;
  readonly?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'MANUAL', label: 'Manuel utilisateur' },
  { value: 'INVOICE', label: 'Facture' },
  { value: 'WARRANTY', label: 'Garantie' },
  { value: 'TECHNICAL_SHEET', label: 'Fiche technique' },
  { value: 'MAINTENANCE_REPORT', label: 'Rapport maintenance' },
  { value: 'OTHER', label: 'Autre' },
];

const getTypeLabel = (type: DocumentType) => {
  const typeInfo = DOCUMENT_TYPES.find(t => t.value === type);
  return typeInfo ? typeInfo.label : 'Document';
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentViewer({ document: initialDoc, isOpen, onClose, onSave, readonly = false }: DocumentViewerProps) {
  // Local state for the document being viewed (to handle annotations before save)
  const [viewingDocument, setViewingDocument] = useState<EquipmentDocument | null>(null);

  useEffect(() => {
    if (isOpen && initialDoc) {
      setViewingDocument(JSON.parse(JSON.stringify(initialDoc))); // Deep copy to avoid mutating props
    } else {
      setViewingDocument(null);
    }
  }, [isOpen, initialDoc]);

  const [viewerPage, setViewerPage] = useState(0);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Transform State (Motion Values for Performance)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotation = useMotionValue(0);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  
  const [interactionMode, setInteractionMode] = useState<'PAN' | 'ROTATE' | 'POINT' | 'LINE'>('PAN');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<ImageAnnotation> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const transformStartRef = useRef<{ x: number; y: number; scale: number; rotation: number } | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

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

  // Reset viewer state when opening new doc
  useEffect(() => {
    if (isOpen) {
      setViewerPage(0);
      resetTransform();
      setInteractionMode('PAN');
      setIsHighContrast(false);
      setShowControls(true);
    }
  }, [isOpen, resetTransform]);

  const nextViewerPage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (viewingDocument && viewingDocument.pages && viewerPage < viewingDocument.pages.length - 1) {
      setViewerPage(prev => prev + 1);
      resetTransform();
    }
  }, [viewingDocument, viewerPage, resetTransform]);

  const prevViewerPage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (viewerPage > 0) {
      setViewerPage(prev => prev - 1);
      resetTransform();
    }
  }, [viewerPage, resetTransform]);

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentScale = scale.get();
    // Snap to next 0.5 step (e.g. 1.2 -> 1.5, 1.5 -> 2.0)
    const nextStep = Math.floor(currentScale * 2 + 1) / 2;
    scale.set(Math.min(nextStep, 10));
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentScale = scale.get();
    // Snap to previous 0.5 step (e.g. 1.7 -> 1.5, 1.5 -> 1.0)
    const prevStep = Math.ceil(currentScale * 2 - 1) / 2;
    scale.set(Math.max(prevStep, 1));
  }, []);

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

  const rotate90 = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentRotation = rotation.get();
    const snappedRotation = Math.round(currentRotation / 90) * 90;
    rotation.set((snappedRotation + 90) % 360);
  }, [rotation]);

  const toggleContrast = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsHighContrast(prev => !prev);
  }, []);

  // Annotation Helpers
  const getRelativeCoords = (e: React.PointerEvent | MouseEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * 100;
    const relY = (e.clientY - rect.top) / rect.height * 100;
    return { x: relX, y: relY };
  };

  const updateAnnotationText = (id: string, text: string) => {
    if (!viewingDocument) return;
    const updatedAnnotations = (viewingDocument.annotations || []).map(a => 
      a.id === id ? { ...a, text } : a
    );
    setViewingDocument({ ...viewingDocument, annotations: updatedAnnotations });
  };

  const deleteAnnotation = (id: string) => {
    if (!viewingDocument) return;
    const updatedAnnotations = (viewingDocument.annotations || []).filter(a => a.id !== id);
    setViewingDocument({ ...viewingDocument, annotations: updatedAnnotations });
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  // Save changes to the parent
  const handleSave = () => {
    if (!viewingDocument || !onSave) return;
    onSave(viewingDocument);
  };

  // Pointer/Mouse Events for Drag & Rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (interactionMode === 'PAN' || interactionMode === 'ROTATE') {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      transformStartRef.current = { 
        x: x.get(), 
        y: y.get(), 
        scale: scale.get(), 
        rotation: rotation.get() 
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else if (interactionMode === 'POINT' && viewingDocument) {
      const { x, y } = getRelativeCoords(e);
      const newAnnotation: ImageAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'POINT',
        x,
        y,
        text: ''
      };
      const currentAnnotations = viewingDocument.annotations || [];
      setViewingDocument({
        ...viewingDocument,
        annotations: [...currentAnnotations, newAnnotation]
      });
      setSelectedAnnotationId(newAnnotation.id);
      setInteractionMode('PAN');
    } else if (interactionMode === 'LINE' && viewingDocument) {
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

    if ((interactionMode === 'PAN' || interactionMode === 'ROTATE') && isDragging && dragStartRef.current && transformStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (interactionMode === 'PAN') {
        x.set(transformStartRef.current.x + dx);
        y.set(transformStartRef.current.y + dy);
      } else if (interactionMode === 'ROTATE') {
        rotation.set((transformStartRef.current.rotation + dx * 0.5) % 360);
      }
    } else if (interactionMode === 'LINE' && isDrawing && currentDrawing) {
      const { x, y } = getRelativeCoords(e);
      setCurrentDrawing(prev => ({ ...prev, endX: x, endY: y }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (interactionMode === 'PAN' || interactionMode === 'ROTATE') {
      setIsDragging(false);
      dragStartRef.current = null;
      transformStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } else if (interactionMode === 'LINE' && isDrawing && currentDrawing && viewingDocument) {
      setIsDrawing(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      
      const finalAnnotation = currentDrawing as ImageAnnotation;
      const currentAnnotations = viewingDocument.annotations || [];
      setViewingDocument({
        ...viewingDocument,
        annotations: [...currentAnnotations, finalAnnotation]
      });
      setSelectedAnnotationId(finalAnnotation.id);
      setCurrentDrawing(null);
      setInteractionMode('PAN');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    const delta = Math.sign(e.deltaY);
    const factor = 1.1;
    const scaleMultiplier = delta > 0 ? factor : 1 / factor;

    const currentScale = scale.get();
    const newScale = Math.min(Math.max(currentScale * scaleMultiplier, 1), 10);
    
    const currentX = x.get();
    const currentY = y.get();
    
    const newX = mouseX - (mouseX - currentX) * (newScale / currentScale);
    const newY = mouseY - (mouseY - currentY) * (newScale / currentScale);
    
    scale.set(newScale);
    x.set(newX);
    y.set(newY);
  };

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          nextViewerPage();
          break;
        case 'ArrowLeft':
          prevViewerPage();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=': 
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          rotate90();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextViewerPage, prevViewerPage, onClose, handleZoomIn, handleZoomOut, toggleFullscreen, rotate90]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Don't hide if rotating, dragging, OR editing an annotation
    if (interactionMode === 'ROTATE' || isDragging || selectedAnnotationId) return;

    controlsTimeoutRef.current = setTimeout(() => {
      if (scale.get() === 1 && !isDragging) { 
        setShowControls(false);
      }
    }, 3000);
  }, [scale, isDragging, interactionMode, selectedAnnotationId]);

  // Adjust textarea height when opening annotation editor
  useEffect(() => {
    if (selectedAnnotationId) {
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [selectedAnnotationId, adjustTextareaHeight]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', resetControlsTimeout);
      window.addEventListener('touchstart', resetControlsTimeout);
      resetControlsTimeout(); 
      return () => {
        window.removeEventListener('mousemove', resetControlsTimeout);
        window.removeEventListener('touchstart', resetControlsTimeout);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
    }
  }, [isOpen, resetControlsTimeout]);

  // If not open or no document, don't render
  if (!isOpen || !viewingDocument) return null;

  const isAudio = viewingDocument?.mimeType?.startsWith('audio/') ?? false;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={viewerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
          onClick={onClose}
        >
          <div 
            className="relative w-full h-full max-w-[98vw] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] flex flex-col ring-1 ring-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className={cn(
                "flex-none p-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md z-10 transition-transform duration-300 absolute top-0 left-0 right-0",
                !showControls && "translate-y-[-100%]"
              )} 
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold">{viewingDocument.name}</h3>
                  <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                    {getTypeLabel(viewingDocument.type)}
                    {viewingDocument.pages && viewingDocument.pages.length > 1 && (
                      <>
                        <span>•</span>
                        <span>Page {viewerPage + 1} / {viewingDocument.pages.length}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--bg-hover)] rounded-lg p-1 mr-2 border border-[var(--border)]">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-[var(--bg-active)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    title="Zoom arrière (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-center">
                    {zoomDisplay}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-[var(--bg-active)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    title="Zoom avant (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-8 w-[1px] bg-[var(--bg-active)] mx-1" />

                {/* Mode Toggles */}
                <div className="flex items-center gap-1 bg-[var(--bg-hover)] rounded-lg p-1 border border-[var(--border)]">
                  <button
                    onClick={() => setInteractionMode('PAN')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      interactionMode === 'PAN' ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                    )}
                    title="Mode Déplacement (Grab)"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  {!readonly && (viewingDocument.mimeType?.startsWith('image/') || viewingDocument.url.startsWith('blob:')) && (
                    <>
                      <button
                        onClick={() => setInteractionMode('POINT')}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          interactionMode === 'POINT' ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                        )}
                        title="Ajouter une note (Point)"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInteractionMode('LINE')}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          interactionMode === 'LINE' ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                        )}
                        title="Dessiner une ligne"
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setInteractionMode('ROTATE')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      interactionMode === 'ROTATE' ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                    )}
                    title="Mode Rotation Libre"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {!readonly && onSave && (viewingDocument.annotations?.length || 0) > 0 && (
                  <button
                    onClick={handleSave}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-2"
                    title="Enregistrer les annotations"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={rotate90}
                  className="p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Pivoter 90° (R)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleContrast}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isHighContrast ? "bg-white text-black" : "hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                  title="Contraste élevé"
                >
                  {isHighContrast ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
                  title={isFullscreen ? "Quitter plein écran (F)" : "Plein écran (F)"}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>

                <div className="h-8 w-[1px] bg-[var(--bg-active)] mx-1" />

                <a 
                  href={viewingDocument.url} 
                  download={viewingDocument.name}
                  className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Télécharger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-[var(--text-muted)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div 
              className={cn(
                "flex-1 relative overflow-hidden bg-[var(--bg-card)]",
                !isAudio && "touch-none"
              )}
              onPointerDown={isAudio ? undefined : handlePointerDown}
              onPointerMove={isAudio ? undefined : handlePointerMove}
              onPointerUp={isAudio ? undefined : handlePointerUp}
              onPointerLeave={isAudio ? undefined : handlePointerUp}
              onWheel={isAudio ? undefined : handleWheel}
            >
              <div 
                className={cn(
                  "w-full h-full flex items-center justify-center transition-all duration-300",
                  showControls ? "py-24" : "p-0"
                )}
              >
                {viewingDocument.mimeType?.startsWith('image/') || (viewingDocument.url.startsWith('blob:') && !viewingDocument.mimeType?.startsWith('video/') && !viewingDocument.mimeType?.startsWith('audio/')) ? (
                  <motion.div
                      className="relative origin-center will-change-transform"
                      style={{
                        x,
                        y,
                        scale,
                        rotate: rotation,
                        cursor: interactionMode === 'PAN' 
                          ? (isDragging ? 'grabbing' : 'grab') 
                          : interactionMode === 'ROTATE' ? 'ew-resize' : 'crosshair',
                      }}
                    >
                    <div className="relative">
                      <img
                        ref={imageRef}
                        key={viewerPage}
                        src={viewingDocument.pages ? viewingDocument.pages[viewerPage] : viewingDocument.url}
                        alt={`Page ${viewerPage + 1}`}
                        className={cn(
                          "max-w-none max-h-[80vh] object-contain shadow-2xl pointer-events-none select-none",
                          isHighContrast && "brightness-125 contrast-125 grayscale"
                        )}
                        draggable={false}
                      />

                      {/* ANNOTATIONS OVERLAY */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {(viewingDocument.annotations || []).filter(a => a.type === 'LINE').map(a => (
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
                            className="drop-shadow-sm"
                          />
                        )}
                      </svg>

                      {/* ANNOTATION MARKERS */}
                      {(viewingDocument.annotations || []).map(a => (
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
                          
                          {a.text && selectedAnnotationId !== a.id && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap pointer-events-none z-20">
                              {a.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : viewingDocument.mimeType?.startsWith('video/') ? (
                  <motion.div
                    className="relative origin-center will-change-transform"
                    style={{
                      x,
                      y,
                      scale,
                      rotate: rotation,
                    }}
                  >
                    <video
                      src={viewingDocument.url}
                      controls
                      className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl"
                    />
                  </motion.div>
                ) : viewingDocument.mimeType?.startsWith('audio/') ? (
                  <AudioWaveformViewer 
                    url={viewingDocument.url} 
                    name={viewingDocument.name} 
                  />
                ) : (
                  <div className="text-center p-12 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border)] z-10 relative">
                    <FileText className="w-24 h-24 text-[var(--text-muted)] mx-auto mb-6" />
                    <p className="text-xl text-[var(--text-primary)] font-medium mb-2">Aperçu non disponible</p>
                    <p className="text-[var(--text-muted)] mb-6">Ce type de fichier ne peut pas être prévisualisé ici.</p>
                    <a 
                      href={viewingDocument.url} 
                      download={viewingDocument.name}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-5 h-5" />
                      Télécharger le fichier
                    </a>
                  </div>
                )}
              </div>

              {/* Navigation Controls (Floating) */}
              {viewingDocument.pages && viewingDocument.pages.length > 1 && (
                <>
                  <button
                    onClick={prevViewerPage}
                    disabled={viewerPage === 0}
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-[var(--border)] text-white disabled:opacity-0 disabled:pointer-events-none hover:bg-[var(--bg-active)] transition-all backdrop-blur-sm z-20",
                      !showControls && "opacity-0 hover:opacity-100"
                    )}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextViewerPage}
                    disabled={viewerPage === viewingDocument.pages.length - 1}
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-[var(--border)] text-white disabled:opacity-0 disabled:pointer-events-none hover:bg-[var(--bg-active)] transition-all backdrop-blur-sm z-20",
                      !showControls && "opacity-0 hover:opacity-100"
                    )}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Footer */}
            {viewingDocument.pages && viewingDocument.pages.length > 1 && (
              <div 
                className={cn(
                  "flex-none p-4 bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border)] overflow-x-auto z-10 transition-transform duration-300 absolute bottom-0 left-0 right-0",
                  !showControls && "translate-y-[100%]"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center gap-3 min-w-min mx-auto">
                  {viewingDocument.pages.map((pageUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setViewerPage(idx);
                        resetTransform();
                      }}
                      className={cn(
                        "relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                        viewerPage === idx 
                          ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/20" 
                          : "border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <img 
                        src={pageUrl} 
                        alt={`Page ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                        <span className="text-[10px] text-[var(--text-primary)] font-medium">{idx + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* ANNOTATION EDITOR POPUP */}
            <AnimatePresence>
              {selectedAnnotationId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 flex flex-col gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                      {(viewingDocument.annotations || []).find(a => a.id === selectedAnnotationId)?.type === 'POINT' ? <MapPin className="w-4 h-4 text-blue-400" /> : <PenTool className="w-4 h-4 text-blue-400" />}
                      Modifier la note
                    </span>
                    <button onClick={() => setSelectedAnnotationId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    value={(viewingDocument.annotations || []).find(a => a.id === selectedAnnotationId)?.text || ''}
                    onChange={(e) => {
                      updateAnnotationText(selectedAnnotationId, e.target.value);
                      adjustTextareaHeight();
                    }}
                    placeholder="Ajouter une note ou une observation..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500/50 min-h-[80px] resize-none overflow-hidden"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
