import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Upload, Camera, FileText, Image, File, Trash2, Eye, X, Plus, FolderOpen, Tag, Calendar, FileCode, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonTable } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useDocumentsStore, DocumentCategory, StoredDocument } from '@/store/useDocumentsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { DocumentViewer } from '../billing/InvoiceDetailView';
import FacturXInvoiceView from '../billing/FacturXInvoiceView';
import { createMockFacturXData, type FacturXData } from '@/lib/facturx-generator';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string; icon: typeof FileText }> = {
  FACTURE: { label: 'Facture', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: FileText },
  DEVIS: { label: 'Devis', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: File },
  CONTRAT: { label: 'Contrat', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: FileText },
  ATTESTATION: { label: 'Attestation', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: FileText },
  AUTRE: { label: 'Autre', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: File },
};

export default function InvoicesTab() {
  const { documents, syncAddDocument, syncRemoveDocument } = useDocumentsStore();
  const { activeVenueId } = useVenuesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | DocumentCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [facturXData, setFacturXData] = useState<FacturXData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredDocs = documents
    .filter(d => {
      if (activeVenueId && d.venueId && d.venueId !== activeVenueId) return false;
      if (filter !== 'ALL' && d.category !== filter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags?.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: documents.length,
    factures: documents.filter(d => d.category === 'FACTURE').length,
    devis: documents.filter(d => d.category === 'DEVIS').length,
    autres: documents.filter(d => !['FACTURE', 'DEVIS'].includes(d.category)).length,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    return FileText;
  };

  const handleFileUpload = (files: FileList | null, category: DocumentCategory = 'FACTURE') => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        syncAddDocument({
          name: file.name.replace(/\.[^.]+$/, ''),
          category,
          fileUrl: dataUrl,
          fileType: file.type,
          fileSize: file.size,
          thumbnailUrl: file.type.startsWith('image/') ? dataUrl : undefined,
          venueId: activeVenueId || undefined,
        });
      };
      reader.readAsDataURL(file);
    });

    setShowUploadModal(false);
  };

  const handleDelete = (docId: string) => {
    syncRemoveDocument(docId);
    if (selectedDoc?.id === docId) setSelectedDoc(null);
  };

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Header */}
        <div className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-4 md:mb-8 p-4 md:p-0">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
                Mes Documents
              </h2>
              <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">
                Stockez et organisez vos factures et documents
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFacturXData(createMockFacturXData())}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-green-900/20"
              >
                <FileCode className="w-4 h-4" />
                <span className="hidden sm:inline">Factur-X</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8 px-4 md:px-0">
            <div
              onClick={() => setFilter('ALL')}
              className={clsx(
                "bg-[var(--bg-card)] p-2 md:p-6 rounded-xl md:rounded-2xl border border-[var(--border)] flex flex-col justify-between cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition-all",
                filter === 'ALL' && "border-blue-500/30"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-blue-500/10 text-blue-400 mb-1">
                  <FolderOpen className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-center md:text-left">Total</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-[var(--text-primary)] mb-0 md:mb-1 text-center md:text-left">{stats.total}</div>
              <div className="hidden md:block text-xs md:text-sm text-[var(--text-secondary)]">documents</div>
            </div>

            <div
              onClick={() => setFilter('FACTURE')}
              className={clsx(
                "bg-[var(--bg-card)] p-2 md:p-6 rounded-xl md:rounded-2xl border border-[var(--border)] flex flex-col justify-between cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition-all",
                filter === 'FACTURE' && "border-blue-500/30"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-orange-500/10 text-orange-400 mb-1">
                  <FileText className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-center md:text-left">Factures</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-[var(--text-primary)] mb-0 md:mb-1 text-center md:text-left">{stats.factures}</div>
              <div className="hidden md:block text-sm text-[var(--text-secondary)]">factures</div>
            </div>

            <div
              onClick={() => setFilter('DEVIS')}
              className={clsx(
                "bg-[var(--bg-card)] p-2 md:p-6 rounded-xl md:rounded-2xl border border-[var(--border)] flex flex-col justify-between cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition-all",
                filter === 'DEVIS' && "border-blue-500/30"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-purple-500/10 text-purple-400 mb-1">
                  <File className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-center md:text-left">Devis</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-[var(--text-primary)] mb-0 md:mb-1 text-center md:text-left">{stats.devis}</div>
              <div className="hidden md:block text-sm text-[var(--text-secondary)]">devis</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 bg-[var(--bg-card)] rounded-t-3xl border-t border-[var(--border)] shadow-lg min-h-full md:z-auto md:bg-transparent md:rounded-none md:border-none md:shadow-none">
          {/* Search & Tabs */}
          <div className="sticky top-0 z-20 bg-[var(--bg-card)] pb-4 pt-4 px-4 md:px-0 rounded-t-3xl md:bg-transparent md:static md:z-auto md:rounded-none md:pt-0">
            <div className="px-4 md:px-0 pt-4 md:pt-0">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[var(--bg-card)] md:bg-[var(--bg-hover)] p-1 rounded-xl border border-[var(--border)] w-full mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Rechercher un document..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-0">
                {[
                  { key: 'ALL' as const, label: 'Tous' },
                  { key: 'FACTURE' as const, label: 'Factures' },
                  { key: 'DEVIS' as const, label: 'Devis' },
                  { key: 'CONTRAT' as const, label: 'Contrats' },
                  { key: 'ATTESTATION' as const, label: 'Attestations' },
                  { key: 'AUTRE' as const, label: 'Autres' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={clsx(
                      "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap px-2",
                      filter === tab.key ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {tab.label}
                    {filter === tab.key && (
                      <motion.div
                        layoutId="activeDocTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-3 pb-20 px-4 md:px-0">
            {filteredDocs.length === 0 && (
              <EmptyState
                icon={FolderOpen}
                title="Aucun document"
                description={filter !== 'ALL' ? "Aucun document dans cette catégorie." : "Ajoutez vos factures, devis et documents ici."}
              />
            )}

            {filteredDocs.map((doc) => {
              const FileIcon = getFileIcon(doc.fileType);
              const catConfig = CATEGORY_CONFIG[doc.category];

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--bg-card)] p-3 md:p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-all group flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 relative"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1 w-full md:w-auto">
                    {/* Thumbnail / Icon */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center shrink-0 overflow-hidden">
                      {doc.thumbnailUrl ? (
                        <img src={doc.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <FileIcon className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-secondary)]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors text-sm md:text-base truncate">
                        {doc.name}
                      </h4>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-[var(--text-secondary)] mt-0.5 md:mt-1">
                        <span className={clsx("px-2 py-0.5 rounded-full border text-[10px] font-bold", catConfig.color)}>
                          {catConfig.label}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                        <span className="text-[var(--text-muted)] truncate">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end mt-1 md:mt-0 pl-[52px] md:pl-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.createdAt)}
                      </div>
                      {doc.description && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[200px]">
                          {doc.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handleFileUpload}
            fileInputRef={fileInputRef}
          />
        )}
      </AnimatePresence>

      {/* Document Viewer */}
      <AnimatePresence>
        {selectedDoc && (
          <DocumentViewer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}
      </AnimatePresence>

      {/* Factur-X Invoice Viewer */}
      <AnimatePresence>
        {facturXData && (
          <FacturXInvoiceView data={facturXData} onClose={() => setFacturXData(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- Upload Modal -----

function UploadModal({
  onClose,
  onUpload,
  fileInputRef,
}: {
  onClose: () => void;
  onUpload: (files: FileList | null, category: DocumentCategory) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('FACTURE');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(e.target.files, selectedCategory);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Ajouter un document</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Photo, scan ou fichier PDF</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">
              Catégorie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [DocumentCategory, typeof CATEGORY_CONFIG[DocumentCategory]][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={clsx(
                    "p-3 rounded-xl border text-xs font-bold transition-all text-center",
                    selectedCategory === key
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Buttons */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-blue-500/50 bg-[var(--bg-hover)] hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Choisir un fichier</span>
              <span className="text-xs text-[var(--text-muted)]">PDF, images, documents</span>
            </button>

            <button
              onClick={() => {
                // Create a file input that captures from camera
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  onUpload(target.files, selectedCategory);
                };
                input.click();
              }}
              className="w-full py-3.5 rounded-xl bg-[var(--bg-active)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Prendre une photo</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
