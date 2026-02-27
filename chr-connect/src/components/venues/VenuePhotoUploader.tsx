import { useState, useRef } from 'react';
import { VenuePhoto } from '@/types/venue';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VenuePhotoUploaderProps {
  photos: VenuePhoto[];
  onChange: (photos: VenuePhoto[]) => void;
}

export default function VenuePhotoUploader({ photos, onChange }: VenuePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const newPhotos: VenuePhoto[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      type: 'OTHER',
      uploadedAt: new Date().toISOString(),
      caption: file.name
    }));

    onChange([...photos, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter(p => p.id !== id));
  };

  const updatePhotoType = (id: string, type: VenuePhoto['type']) => {
    onChange(photos.map(p => p.id === id ? { ...p, type } : p));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)]'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          multiple 
          accept="image/*" 
          className="hidden" 
        />
        <div className="p-3 rounded-full bg-[var(--bg-hover)] mb-2">
          <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Glisser des photos ou cliquer pour ajouter
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group bg-[var(--bg-input)] border border-[var(--border)] rounded-xl overflow-hidden"
            >
              <div className="aspect-video relative">
                <img src={photo.url} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                  <select
                    value={photo.type}
                    onChange={(e) => updatePhotoType(photo.id, e.target.value as VenuePhoto['type'])}
                    className="w-full bg-black/60 backdrop-blur-md text-xs text-white border border-[var(--border-strong)] rounded-lg p-1.5 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="FACADE">Façade</option>
                    <option value="DINING_ROOM">Salle</option>
                    <option value="KITCHEN">Cuisine</option>
                    <option value="BAR">Bar</option>
                    <option value="ACCESS">Accès</option>
                    <option value="ELECTRICAL_PANEL">Tableau Elec</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
