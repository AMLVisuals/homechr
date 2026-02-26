'use client';

import { useState } from 'react';
import { Search, MapPin, Star } from 'lucide-react';
import { VenueFormData } from '@/types/venue';
import { clsx } from 'clsx';

interface VenueSearchModalProps {
  onSelect: (venue: VenueFormData) => void;
  onCancel: () => void;
}

// Mock Google Places Results
const MOCK_PLACES = [
  {
    id: 'g1',
    name: "Le Fouquet's Paris",
    address: "99 Av. des Champs-Élysées, 75008 Paris",
    rating: 4.5,
    reviews: 3400,
    type: "Restaurant français",
    photo: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop"
  },
  {
    id: 'g2',
    name: "L'Ambroisie",
    address: "9 Pl. des Vosges, 75004 Paris",
    rating: 4.8,
    reviews: 850,
    type: "Haute cuisine",
    photo: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 'g3',
    name: "Septime",
    address: "80 Rue de Charonne, 75011 Paris",
    rating: 4.7,
    reviews: 1200,
    type: "Restaurant moderne",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function VenueSearchModal({ onSelect, onCancel }: VenueSearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof MOCK_PLACES>([]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      // Simulate API delay
      setTimeout(() => {
        setResults(MOCK_PLACES.filter(p => p.name.toLowerCase().includes(val.toLowerCase())));
        setIsSearching(false);
      }, 500);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold mb-4">Rechercher votre établissement</h2>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nom, adresse..."
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
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
                  city: 'Paris', // Simplified for mock
                  zipCode: '75000', // Simplified
                  category: place.type,
                  photoUrl: place.photo,
                  rating: place.rating,
                  reviewCount: place.reviews
                })}
                className="w-full flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{place.name}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {place.address}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" /> {place.rating} ({place.reviews})
                    </span>
                    <span>• {place.type}</span>
                  </div>
                </div>
              </button>
            ))}
            
            {query.length > 2 && results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={onCancel}
          className="w-full py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
