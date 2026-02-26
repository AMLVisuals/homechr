'use client';

import { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import { MapPin, Zap, Flame, Users, Wrench, Music, Monitor, Lightbulb } from 'lucide-react';
import { Mission, MissionType } from '@/types/missions';
import L from 'leaflet';
import { createRoot } from 'react-dom/client';

interface MissionPinProps {
  mission: Mission;
  onClick: () => void;
}

export function MissionPin({ mission, onClick }: MissionPinProps) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    const root = createRoot(el);
    
    const { icon: IconComp, color } = getIconAndColor(mission.type);
    
    root.render(
      <div className="relative group">
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full ${color} shadow-lg border-2 border-white/20 transition-transform duration-200 group-hover:scale-110`}>
          {mission.urgent && (
            <div className={`absolute inset-0 rounded-full ${color} animate-ping opacity-75`} />
          )}
          <div className="text-white relative z-10">
            {IconComp}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap border border-white/10">
            {mission.price}€
          </div>
        </div>
      </div>
    );

    const customIcon = L.divIcon({
      className: 'custom-marker bg-transparent border-none',
      html: el,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    setIcon(customIcon);
    
    return () => {
        setTimeout(() => root.unmount(), 0);
    };
  }, [mission]);

  if (!icon || !mission.location) return null;

  return (
    <Marker
      position={[mission.location.lat, mission.location.lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    />
  );
}

function getIconAndColor(type: MissionType | undefined) {
    switch (type) {
      case 'cold': return { icon: <Wrench className="h-4 w-4" />, color: 'bg-cyan-500' };
      case 'hot': return { icon: <Flame className="h-4 w-4" />, color: 'bg-orange-500' };
      case 'staff': return { icon: <Users className="h-4 w-4" />, color: 'bg-purple-500' };
      case 'sound': return { icon: <Music className="h-4 w-4" />, color: 'bg-pink-500' };
      case 'video': return { icon: <Monitor className="h-4 w-4" />, color: 'bg-blue-500' };
      case 'light': return { icon: <Lightbulb className="h-4 w-4" />, color: 'bg-yellow-500' };
      default: return { icon: <MapPin className="h-4 w-4" />, color: 'bg-blue-500' };
    }
}
