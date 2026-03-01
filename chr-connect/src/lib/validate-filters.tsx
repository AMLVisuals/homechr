
import { JOB_FILTERS_MAPPING } from './job-filters-mapping';
import { mockMissions } from './mock-data';

const professions = Object.keys(JOB_FILTERS_MAPPING);
let totalErrors = 0;
let totalMissions = 0;

professions.forEach(prof => {
  const config = JOB_FILTERS_MAPPING[prof];
  const missions = mockMissions.filter(m => m.type === prof);
  totalMissions += missions.length;

  if (missions.length === 0) {
    console.warn(`  WARNING: No missions found for ${prof}`);
  }

  // Check filters
  config.categories.forEach(cat => {
    // Check if missions have this attribute
    const missionsWithAttr = missions.filter(m => m.attributes && (m.attributes as any)[cat.id]);

    if (missions.length > 0 && missionsWithAttr.length === 0) {
        console.error(`  ERROR: No missions have attribute '${cat.id}' matching filter!`);
        totalErrors++;
    }
  });
});

if (totalErrors > 0) {
    process.exit(1);
}
