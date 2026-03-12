import React, { useState } from 'react';
import { X, Download, FileText, Image, Tag, Calendar, HardDrive, Edit3, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { StoredDocument, DocumentCategory, useDocumentsStore } from '@/store/useDocumentsStore';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FACTURE: 'Facture',
  DEVIS: 'Devis',
  CONTRAT: 'Contrat',
  ATTESTATION: 'Attestation',
  AUTRE: 'Autre',
};

interface DocumentViewerProps {
  doc: StoredDocument;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose }) => {
  const { updateDocument } = useDocumentsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.name);
  const [editCategory, setEditCategory] = useState(doc.category);
  const [editDescription, setEditDescription] = useState(doc.description || '');

  const handleSave = () => {
    updateDocument(doc.id, {
      name: editName,
      category: editCategory,
      description: editDescription || undefined,
    });
    setIsEditing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = () => {
    if (!doc.fileUrl) return;
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = `${doc.name}.${doc.fileType.split('/')[1] || 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = doc.fileType.startsWith('image/');
  const isPdf = doc.fileType === 'application/pdf';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              {isImage ? <Image className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="min-w-0">
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-primary)] w-full focus:outline-none focus:border-blue-500/50"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">{doc.name}</h2>
              )}
              <span className={clsx("text-xs font-bold uppercase", "text-[var(--text-muted)]")}>
                {CATEGORY_LABELS[doc.category]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            {doc.fileUrl && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto">
          {doc.fileUrl ? (
            <div className="bg-[var(--bg-hover)] flex items-center justify-center min-h-[300px]">
              {isImage ? (
                <img src={doc.fileUrl} alt={doc.name} className="max-w-full max-h-[50vh] object-contain" />
              ) : isPdf ? (
                <iframe src={doc.fileUrl} className="w-full h-[50vh]" title={doc.name} />
              ) : (
                <div className="py-16 text-center">
                  <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
                  <p className="text-sm text-[var(--text-muted)]">Aperçu non disponible</p>
                  <button
                    onClick={handleDownload}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
                  >
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-hover)] flex items-center justify-center py-16">
              <div className="text-center">
                <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">Document mock — aucun fichier attaché</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-5 space-y-4">
            {/* Description */}
            {isEditing ? (
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ajouter une description..."
                  rows={2}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ) : doc.description ? (
              <p className="text-sm text-[var(--text-secondary)]">{doc.description}</p>
            ) : null}

            {/* Category edit */}
            {isEditing && (
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setEditCategory(key)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                        editCategory === key
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ajouté le</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] font-medium">{formatDate(doc.createdAt)}</p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Taille</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] font-medium">{formatFileSize(doc.fileSize)}</p>
              </div>
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-[var(--bg-active)] border border-[var(--border)] text-xs text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};
