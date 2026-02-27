import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  X,
  Bot,
  Sparkles,
  Check,
  File,
  Receipt,
  ShieldCheck,
  BookOpen,
  Wrench,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EquipmentDocument, DocumentType } from '@/types/equipment';
import { DocumentViewer } from '@/components/shared/DocumentViewer';

// ============================================================================
// TYPES
// ============================================================================

interface DocumentManagerProps {
  documents: EquipmentDocument[];
  onDocumentsChange: (docs: EquipmentDocument[]) => void;
  readonly?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: React.ElementType }[] = [
  { value: 'MANUAL', label: 'Manuel utilisateur', icon: BookOpen },
  { value: 'INVOICE', label: 'Facture', icon: Receipt },
  { value: 'WARRANTY', label: 'Garantie', icon: ShieldCheck },
  { value: 'TECHNICAL_SHEET', label: 'Fiche technique', icon: FileText },
  { value: 'MAINTENANCE_REPORT', label: 'Rapport maintenance', icon: Wrench },
  { value: 'OTHER', label: 'Autre', icon: File },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentManager({ documents, onDocumentsChange, readonly = false }: DocumentManagerProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addPageInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('OTHER');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Viewer State
  const [viewingDocument, setViewingDocument] = useState<EquipmentDocument | null>(null);



  // Handle file selection (Initial)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setDocName(files[0].name.split('.')[0]); // Default name from first file
      setAnalysisComplete(false);
      setShowUploadModal(true);
    }
  };

  // Handle adding more pages
  const handleAddPages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove a page from selection
  const handleRemovePage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      resetForm(); // Close if no files left
    }
  };

  // Simulate AI Analysis
  const analyzeDocument = () => {
    setIsAnalyzing(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      // Simulate AI findings based on filename keywords
      const name = selectedFiles[0]?.name.toLowerCase() || '';
      
      if (name.includes('facture') || name.includes('invoice')) {
        setDocType('INVOICE');
        setDocName((prev) => prev.replace(/facture/i, 'Facture').replace(/invoice/i, 'Facture'));
      } else if (name.includes('manuel') || name.includes('manual') || name.includes('guide')) {
        setDocType('MANUAL');
        setDocName((prev) => 'Manuel d\'utilisation');
      } else if (name.includes('garantie') || name.includes('warranty')) {
        setDocType('WARRANTY');
        setDocName((prev) => 'Certificat de garantie');
      } else if (name.includes('tech') || name.includes('spec')) {
        setDocType('TECHNICAL_SHEET');
      }
    }, 2000);
  };

  // Save document
  const handleSave = () => {
    if (selectedFiles.length === 0) return;

    // Create URLs for all files
    const fileUrls = selectedFiles.map(file => URL.createObjectURL(file));
    
    // Calculate total size
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    // Simulate upload - in real app, this would upload to S3/Cloudinary
    const newDoc: EquipmentDocument = {
      id: Math.random().toString(36).substring(2, 9),
      name: docName,
      type: docType,
      url: fileUrls[0], // Main preview is the first page
      pages: fileUrls, // Store all pages
      uploadedAt: new Date().toISOString(),
      fileSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      mimeType: selectedFiles[0].type,
      file: selectedFiles[0]
    };

    onDocumentsChange([...documents, newDoc]);
    resetForm();
  };

  const resetForm = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setDocName('');
    setDocType('OTHER');
    setAnalysisComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addPageInputRef.current) addPageInputRef.current.value = '';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening viewer
    onDocumentsChange(documents.filter(d => d.id !== id));
  };

  const getIcon = (type: DocumentType) => {
    const typeInfo = DOCUMENT_TYPES.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : File;
  };

  const getTypeLabel = (type: DocumentType) => {
    const typeInfo = DOCUMENT_TYPES.find(t => t.value === type);
    return typeInfo ? typeInfo.label : 'Document';
  };

  const openViewer = (doc: EquipmentDocument) => {
    setViewingDocument(doc);
  };

  const closeViewer = () => {
    setViewingDocument(null);
  };



  // Handle document save from viewer
  const handleDocumentSave = (updatedDoc: EquipmentDocument) => {
    const updatedDocs = documents.map(d => 
      d.id === updatedDoc.id ? updatedDoc : d
    );
    onDocumentsChange(updatedDocs);
    setViewingDocument(updatedDoc); // Update current view if needed
  };





  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text-primary)] font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Documents ({documents.length})
        </h3>
        {!readonly && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-blue-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            Ajouter
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple // Allow multiple files
        />
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-hover)]">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] text-sm">Aucun document</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => {
              const Icon = getIcon(doc.type);
              const pageCount = doc.pages ? doc.pages.length : 1;
              
              return (
                <div
                  key={doc.id}
                  onClick={() => openViewer(doc)}
                  className="group relative p-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-active)] transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-sidebar)] flex items-center justify-center flex-shrink-0 border border-[var(--border)] overflow-hidden">
                    {doc.mimeType?.startsWith('image/') ? (
                      <img src={doc.url} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <Icon className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] font-medium text-sm truncate pr-6">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
                        {getTypeLabel(doc.type)}
                      </span>
                      {doc.fileSize && (
                        <span className="text-[var(--text-muted)] text-xs">• {doc.fileSize}</span>
                      )}
                      {pageCount > 1 && (
                        <span className="text-blue-400/60 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {pageCount} pages
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                      title="Voir"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!readonly && (
                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {showUploadModal && selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Ajouter un document</h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* File Preview Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--text-muted)]">Pages ({selectedFiles.length})</label>
                    <button 
                      onClick={() => addPageInputRef.current?.click()}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Ajouter une page
                    </button>
                    <input
                      type="file"
                      ref={addPageInputRef}
                      className="hidden"
                      onChange={handleAddPages}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      multiple
                    />
                  </div>
                  
                  <div className="grid gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] text-sm font-medium truncate">{file.name}</p>
                          <p className="text-[var(--text-muted)] text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemovePage(idx)}
                          className="p-2 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {selectedFiles.length > 1 && (
                    <p className="text-center text-xs text-[var(--text-muted)]">
                      Ce document sera enregistré comme un fichier multi-pages
                    </p>
                  )}
                </div>

                {/* AI Analysis Button */}
                {!analysisComplete && !isAnalyzing && (
                  <button
                    onClick={analyzeDocument}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 transition-all group"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-purple-300 font-medium">Analyser avec l'IA</span>
                  </button>
                )}

                {/* Analysis Loading */}
                {isAnalyzing && (
                  <div className="py-8 text-center space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <Bot className="absolute inset-0 m-auto w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-purple-300 font-medium animate-pulse">
                      Analyse du document en cours...
                    </p>
                  </div>
                )}

                {/* Form Fields */}
                <div className={cn("space-y-4 transition-all duration-500", isAnalyzing ? "opacity-50 blur-sm pointer-events-none" : "opacity-100")}>
                  {analysisComplete && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm mb-4">
                      <Check className="w-4 h-4" />
                      Informations extraites avec succès
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-muted)]">Nom du document</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                      placeholder="Ex: Facture d'achat"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-muted)]">Type de document</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DOCUMENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setDocType(type.value)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left",
                              docType === type.value
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                                : "bg-[var(--bg-hover)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-active)]"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--border)] flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={!docName || isAnalyzing}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={closeViewer}
        onSave={handleDocumentSave}
        readonly={readonly}
      />
    </div>
  );
}