import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getDocumentsByOwner,
  createDocument,
  deleteDocument,
} from '@/lib/supabase-helpers';

export type DocumentCategory = 'FACTURE' | 'DEVIS' | 'CONTRAT' | 'ATTESTATION' | 'AUTRE';

export interface StoredDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  description?: string;
  /** Data URL (base64) or blob URL for the uploaded file */
  fileUrl: string;
  /** MIME type */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** Thumbnail data URL for images */
  thumbnailUrl?: string;
  venueId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface DocumentsState {
  documents: StoredDocument[];
  isLoading: boolean;
  error: string | null;

  // Existing local actions (backward compat)
  addDocument: (doc: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<Pick<StoredDocument, 'name' | 'category' | 'description' | 'tags'>>) => void;

  // Async Supabase actions
  fetchDocuments: (ownerId: string) => Promise<void>;
  syncAddDocument: (doc: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  syncRemoveDocument: (id: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      isLoading: false,
      error: null,

      // ── Existing local actions (backward compat) ──────────────────────
      addDocument: (doc) => {
        const now = new Date().toISOString();
        const newDoc: StoredDocument = {
          ...doc,
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ documents: [newDoc, ...state.documents] }));
      },

      removeDocument: (id) => {
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      // ── Async Supabase actions ────────────────────────────────────────
      fetchDocuments: async (ownerId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await getDocumentsByOwner(ownerId);
          set({ documents: (data as StoredDocument[] | null) ?? [], isLoading: false });
        } catch (err) {
          console.error('[useDocumentsStore] fetchDocuments failed, keeping local data:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors du chargement des documents' });
        }
      },

      syncAddDocument: async (doc) => {
        const now = new Date().toISOString();
        const newDoc: StoredDocument = {
          ...doc,
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        };

        set({ isLoading: true, error: null });
        try {
          const { error } = await createDocument(newDoc);
          if (error) throw new Error(error.message || 'Échec création document');
          set((state) => ({ documents: [newDoc, ...state.documents], isLoading: false }));
        } catch (err) {
          console.error('[useDocumentsStore] syncAddDocument failed:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout du document' });
          throw err;
        }
      },

      syncRemoveDocument: async (id: string) => {
        const previousDocuments = get().documents;
        // Optimistic delete
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));

        try {
          await deleteDocument(id);
        } catch (err) {
          console.error('[useDocumentsStore] syncRemoveDocument failed:', err);
          // Revert
          set({
            documents: previousDocuments,
            error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
          });
        }
      },
    }),
    {
      name: 'documents-store-v1',
    }
  )
);
