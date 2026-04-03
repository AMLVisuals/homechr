'use client';

import { useState } from 'react';
import { Search, MapPin, Star } from 'lucide-react';
import { VenueFormData } from '@/types/venue';
import { clsx } from 'clsx';
import { useVenuesStore } from '@/store/useVenuesStore';

interface VenueSearchModalProps {
  onSelect: (venue: VenueFormData) => void;
  onCancel: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviews: number;
  type: string;
  photo: string;
}

export default function VenueSearchModal({ onSelect, onCancel }: VenueSearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const venues = useVenuesStore((s) => s.venues);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      // Search existing venues from store
      setTimeout(() => {
        const q = val.toLowerCase();
        const matched = venues
          .filter(v => v.name.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q))
          .map(v => ({
            id: v.id,
            name: v.name,
            address: v.address || '',
            rating: 0,
            reviews: 0,
            type: v.category || 'Restaurant',
            photo: v.photoUrl || '',
          }));
        setResults(matched);
        setIsSearching(false);
      }, 200);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] text-[var(--text-primary)]">
      <div className="p-6 border-b border-[var(--border)]">
        <h2 className="text-xl font-bold mb-4">Rechercher votre établissement</h2>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nom, adresse..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((place) => (
              <button
                key={place.id}
                onClick={() => onSelect({
                  name: place.name,
                  address: place.address.split(',')[0],
                  city: place.address.split(',').pop()?.trim() || '',
                  zipCode: '',
                  category: place.type,
                  photoUrl: place.photo,
                  rating: place.rating,
                  reviewCount: place.reviews
                })}
                className="w-full flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] transition-all text-left group"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{place.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {place.address}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" /> {place.rating} ({place.reviews})
                    </span>
                    <span>• {place.type}</span>
                  </div>
                </div>
              </button>
            ))}
            
            {query.length > 2 && results.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)]">
                Aucun résultat trouvé. <br/>
                <button 
                  onClick={() => onSelect({ name: query, address: '', city: '', zipCode: '', category: 'Restaurant' })}
                  className="text-blue-400 hover:underline mt-2"
                >
                  Créer manuellement "{query}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <button 
          onClick={onCancel}
          className="w-full py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
