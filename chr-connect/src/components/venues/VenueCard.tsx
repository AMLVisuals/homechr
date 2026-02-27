import { Venue } from '@/types/venue';
import { MapPin, Star, ShieldCheck, Users, Ruler, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface VenueCardProps {
  venue: Venue;
  isActive?: boolean;
  onClick?: () => void;
  compact?: boolean;
  teamCount?: number;
  equipmentCount?: number;
  className?: string;
}

export default function VenueCard({ venue, isActive, onClick, compact = false, teamCount, equipmentCount, className }: VenueCardProps) {
  // Get main photo or fallback
  const displayPhoto = venue.photos && venue.photos.length > 0 ? venue.photos[0].url : venue.photoUrl;

  // Use props if provided, otherwise fallback to venue object
  const displayTeamCount = teamCount !== undefined ? teamCount : venue.teamSize;
  const displayEquipmentCount = equipmentCount; // Venue object doesn't have this by default yet

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left transition-all duration-200 group relative overflow-hidden flex flex-col justify-center",
        compact ? "p-3 rounded-xl" : "p-4 rounded-2xl",
        isActive 
          ? "bg-[var(--bg-active)] border-2 border-blue-500 shadow-lg shadow-blue-500/20" 
          : "bg-[var(--bg-hover)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)]",
        className
      )}
    >
      {/* Hover Preview Hint - Only show in non-compact mode */}
      {!compact && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-[var(--bg-active)] px-4 py-2 rounded-full border border-[var(--border-strong)] backdrop-blur-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Voir la fiche</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center relative z-10">
        {/* Photo */}
        <div className={clsx(
          "relative overflow-hidden bg-gray-800 flex-shrink-0",
          compact ? "w-12 h-12 rounded-lg" : "w-20 h-20 rounded-xl"
        )}>
          {displayPhoto ? (
            <img src={displayPhoto} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs font-bold">
              NO IMG
            </div>
          )}
          {venue.isVerified && (
            <div className="absolute top-0 right-0 bg-blue-500 p-1 rounded-bl-lg z-10">
              <ShieldCheck className="w-3 h-3 text-[var(--text-primary)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={clsx("font-bold text-[var(--text-primary)] truncate", compact ? "text-sm" : "text-lg")}>
            {venue.name}
          </h3>
          <p className="text-[var(--text-secondary)] text-xs truncate mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {venue.address}
          </p>
          
          {!compact && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mt-2">
              {venue.rating && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  {venue.rating}
                </span>
              )}
              <span className="truncate px-2 py-0.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border)]">
                {venue.category}
              </span>
              {displayTeamCount !== undefined && displayTeamCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {displayTeamCount}
                </span>
              )}
              {venue.surface && venue.surface > 0 && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  {venue.surface}m²
                </span>
              )}
            </div>
          )}
        </div>

        {/* Checkmark for active state */}
        {isActive && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/50 z-20">
             <svg className="w-4 h-4 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
             </svg>
          </div>
        )}
      </div>
    </button>
  );
}
