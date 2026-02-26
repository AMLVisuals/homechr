
import { JOB_FILTERS_MAPPING } from './job-filters-mapping';
import { mockMissions } from './mock-data';

console.log("Starting Intelligent Filter System Validation...");
console.log("===============================================");

const professions = Object.keys(JOB_FILTERS_MAPPING);
let totalErrors = 0;
let totalMissions = 0;

professions.forEach(prof => {
  const config = JOB_FILTERS_MAPPING[prof];
  const missions = mockMissions.filter(m => m.type === prof);
  totalMissions += missions.length;
  
  console.log(`\n[${prof.toUpperCase()}]`);
  console.log(`  Found ${missions.length} missions`);
  
  if (missions.length === 0) {
    console.warn(`  ⚠️ WARNING: No missions found for ${prof}`);
  }

  // Check filters
  config.categories.forEach(cat => {
    // Check if missions have this attribute
    const missionsWithAttr = missions.filter(m => m.attributes && (m.attributes as any)[cat.id]);
    const coverage = missions.length > 0 ? Math.round((missionsWithAttr.length / missions.length) * 100) : 0;
    
    console.log(`  Filter '${cat.label}' (${cat.id}): ${coverage}% coverage`);
    
    if (missions.length > 0 && missionsWithAttr.length === 0) {
        console.error(`  ❌ ERROR: No missions have attribute '${cat.id}' matching filter!`);
        totalErrors++;
    }
  });
});

console.log("\n===============================================");
console.log(`Total Missions Checked: ${totalMissions}`);
console.log(`Validation Complete. Total Errors: ${totalErrors}`);

if (totalErrors === 0) {
    console.log("✅ INTELLIGENT FILTER SYSTEM VALIDATED SUCCESSFULLY");
} else {
    console.log("❌ VALIDATION FAILED");
    process.exit(1);
}
