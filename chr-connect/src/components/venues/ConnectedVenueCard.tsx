import { useState } from 'react';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import VenueCard from './VenueCard';
import VenueSheet from './VenueSheet';

interface ConnectedVenueCardProps {
  venueId: string;
  isActive?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: () => void; // Optional override
}

export default function ConnectedVenueCard({ 
  venueId, 
  isActive, 
  compact, 
  className,
  onClick 
}: ConnectedVenueCardProps) {
  const { venues } = useVenuesStore();
  const { team } = useMissionsStore();
  const { equipment } = useEquipmentStore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const venue = venues.find(v => v.id === venueId);
  
  if (!venue) return null;

  // Calculate stats
  const teamCount = team.filter(t => t.venueId === venueId).length;
  const equipmentCount = equipment.filter(e => e.venueId === venueId).length;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsSheetOpen(true);
    }
  };

  return (
    <>
      <div className={className}>
        <VenueCard 
          venue={venue} 
          isActive={isActive} 
          compact={compact}
          teamCount={teamCount}
          equipmentCount={equipmentCount}
          onClick={handleClick}
          className="h-full"
        />
      </div>

      <VenueSheet 
        venue={venue}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}