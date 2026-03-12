import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addDocument: (doc: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<Pick<StoredDocument, 'name' | 'category' | 'description' | 'tags'>>) => void;
}

// Mock documents for demo
const MOCK_DOCUMENTS: StoredDocument[] = [
  {
    id: 'doc-1',
    name: 'Facture Metro - Mars 2026',
    category: 'FACTURE',
    description: 'Commande alimentaire du mois',
    fileUrl: '',
    fileType: 'application/pdf',
    fileSize: 245000,
    venueId: 'v1',
    createdAt: '2026-03-05T10:30:00Z',
    updatedAt: '2026-03-05T10:30:00Z',
    tags: ['metro', 'alimentation'],
  },
  {
    id: 'doc-2',
    name: 'Devis réparation four',
    category: 'DEVIS',
    description: 'Devis ThermoService pour remplacement résistance',
    fileUrl: '',
    fileType: 'image/jpeg',
    fileSize: 1200000,
    venueId: 'v1',
    createdAt: '2026-03-02T14:15:00Z',
    updatedAt: '2026-03-02T14:15:00Z',
    tags: ['four', 'réparation'],
  },
  {
    id: 'doc-3',
    name: 'Contrat assurance local',
    category: 'CONTRAT',
    description: 'Assurance multirisque professionnelle AXA',
    fileUrl: '',
    fileType: 'application/pdf',
    fileSize: 890000,
    venueId: 'v1',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
    tags: ['assurance', 'axa'],
  },
  {
    id: 'doc-4',
    name: 'Facture Sysco - Février 2026',
    category: 'FACTURE',
    description: 'Produits frais et surgelés',
    fileUrl: '',
    fileType: 'application/pdf',
    fileSize: 312000,
    venueId: 'v1',
    createdAt: '2026-02-28T11:00:00Z',
    updatedAt: '2026-02-28T11:00:00Z',
    tags: ['sysco', 'alimentation'],
  },
  {
    id: 'doc-5',
    name: 'Attestation URSSAF',
    category: 'ATTESTATION',
    description: 'Attestation de vigilance URSSAF T1 2026',
    fileUrl: '',
    fileType: 'application/pdf',
    fileSize: 156000,
    venueId: 'v1',
    createdAt: '2026-01-20T08:30:00Z',
    updatedAt: '2026-01-20T08:30:00Z',
    tags: ['urssaf', 'social'],
  },
];

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set) => ({
      documents: MOCK_DOCUMENTS,

      addDocument: (doc) => {
        const now = new Date().toISOString();
        const newDoc: StoredDocument = {
          ...doc,
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
    }),
    {
      name: 'documents-store-v1',
    }
  )
);
