import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Mission, MissionType } from "@/types/missions"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types that follow the STAFF workflow (personnel/extra)
export const STAFFING_TYPES: MissionType[] = ['staff', 'security', 'cleaning'];

// Types that follow the TECH workflow (technicien/maintenance)
export const MAINTENANCE_TYPES: MissionType[] = ['cold', 'hot', 'plumbing', 'electricity', 'coffee', 'beer'];

export function getMissionFlowType(mission: Pick<Mission, 'type' | 'category'>): 'STAFF' | 'TECH' {
  if (mission.type && STAFFING_TYPES.includes(mission.type)) return 'STAFF';
  if (mission.type && MAINTENANCE_TYPES.includes(mission.type)) return 'TECH';
  // Fallback on category
  if (mission.category === 'STAFFING') return 'STAFF';
  return 'TECH';
}
