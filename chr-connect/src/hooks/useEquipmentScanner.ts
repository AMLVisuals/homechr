// ============================================================================
// useEquipmentScanner - Custom Hook for OCR Equipment Scanning
// Manages camera, OCR processing, and scan state
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import type { OCRResult, EquipmentCategory, EquipmentFormData } from '@/types/equipment';
import { scanPlate, identifyEquipment } from '@/lib/ai-service.mock';

// ============================================================================
// TYPES
// ============================================================================

export type ScanStatus = 'idle' | 'capturing' | 'processing' | 'success' | 'error';

export interface ScanState {
  status: ScanStatus;
  progress: number; // 0-100
  result: OCRResult | null;
  error: string | null;
  capturedImage: string | null;
}

export interface UseEquipmentScannerReturn {
  // State
  scanState: ScanState;
  isScanning: boolean;

  // Actions
  startCapture: () => void;
  processImage: (file: File) => Promise<OCRResult>;
  processImageUrl: (dataUrl: string) => Promise<OCRResult>;
  reset: () => void;

  // Utilities
  extractFormData: () => Partial<EquipmentFormData> | null;
  getConfidenceLevel: () => 'high' | 'medium' | 'low';

  // Camera ref for external control
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: ScanState = {
  status: 'idle',
  progress: 0,
  result: null,
  error: null,
  capturedImage: null,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useEquipmentScanner(): UseEquipmentScannerReturn {
  const [scanState, setScanState] = useState<ScanState>(INITIAL_STATE);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera capture
  const startCapture = useCallback(async () => {
    setScanState((prev) => ({ ...prev, status: 'capturing', error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Impossible d\'accéder à la caméra';
      setScanState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
    }
  }, []);

  // Stop camera stream
  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture frame from video and process
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Camera not initialized');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Cannot get canvas context');
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Get image as blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture image'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, []);

  // Process an image file through OCR
  const processImage = useCallback(async (file: File): Promise<OCRResult> => {
    setScanState((prev) => ({
      ...prev,
      status: 'processing',
      progress: 0,
      error: null,
    }));

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setScanState((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + 15, 90),
      }));
    }, 300);

    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setScanState((prev) => ({ ...prev, capturedImage: imageUrl }));

      // Process with mock AI service
      const result = await scanPlate(file);

      clearInterval(progressInterval);

      setScanState((prev) => ({
        ...prev,
        status: result.success ? 'success' : 'error',
        progress: 100,
        result,
        error: result.success
          ? null
          : 'Impossible de lire la plaque signalétique. Essayez avec une meilleure luminosité.',
      }));

      return result;
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setScanState((prev) => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  // Process image from data URL (from canvas capture)
  const processImageUrl = useCallback(
    async (dataUrl: string): Promise<OCRResult> => {
      // Convert data URL to File
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      return processImage(file);
    },
    [processImage]
  );

  // Reset scanner state
  const reset = useCallback(() => {
    stopCapture();
    if (scanState.capturedImage) {
      URL.revokeObjectURL(scanState.capturedImage);
    }
    setScanState(INITIAL_STATE);
  }, [stopCapture, scanState.capturedImage]);

  // Extract form data from OCR result
  const extractFormData = useCallback((): Partial<EquipmentFormData> | null => {
    const { result } = scanState;
    if (!result || !result.success) return null;

    // Determine category from brand (simplified logic)
    let category: EquipmentCategory = 'OTHER';
    const brand = result.brand?.toLowerCase() || '';

    if (brand.includes('marzocco') || brand.includes('simonelli') || brand.includes('cimbali')) {
      category = 'COFFEE_MACHINE';
    } else if (brand.includes('hoshizaki') || brand.includes('liebherr') || brand.includes('foster')) {
      category = 'FRIDGE';
    } else if (brand.includes('rational') || brand.includes('unox') || brand.includes('convotherm')) {
      category = 'OVEN';
    } else if (brand.includes('winterhalter') || brand.includes('hobart') || brand.includes('meiko')) {
      category = 'DISHWASHER';
    } else if (brand.includes('scotsman') || brand.includes('brema')) {
      category = 'ICE_MACHINE';
    } else if (brand.includes('lindr') || brand.includes('micro matic')) {
      category = 'BEER_TAP';
    }

    return {
      category,
      brand: result.brand || '',
      model: result.model || '',
      serialNumber: result.serialNumber,
      specifications: {
        voltage: result.voltage,
        power: result.power,
      },
    };
  }, [scanState]);

  // Get confidence level for UI display
  const getConfidenceLevel = useCallback((): 'high' | 'medium' | 'low' => {
    const confidence = scanState.result?.confidence || 0;
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }, [scanState.result]);

  return {
    scanState,
    isScanning: scanState.status === 'capturing' || scanState.status === 'processing',
    startCapture,
    processImage,
    processImageUrl,
    reset,
    extractFormData,
    getConfidenceLevel,
    videoRef,
    canvasRef,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for equipment category identification from photo
 */
export function useEquipmentIdentifier() {
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<{
    category: EquipmentCategory;
    confidence: number;
    suggestions: EquipmentCategory[];
  } | null>(null);

  const identify = useCallback(async (file: File) => {
    setIdentifying(true);
    try {
      const identificationResult = await identifyEquipment(file);
      setResult(identificationResult);
      return identificationResult;
    } finally {
      setIdentifying(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { identifying, result, identify, reset };
}
