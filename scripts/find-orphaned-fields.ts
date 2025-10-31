import * as fs from 'fs';

const configTabsContent = fs.readFileSync('client/src/components/configuration-tabs.tsx', 'utf-8');

// Extract all field IDs from settings arrays
const settingsRegex = /settings:\s*\[([\s\S]*?)\]/g;
const allReferencedFields = new Set<string>();

let match;
while ((match = settingsRegex.exec(configTabsContent)) !== null) {
  const settingsContent = match[1];
  const fieldMatches = settingsContent.match(/"([^"]+)"/g);
  if (fieldMatches) {
    fieldMatches.forEach(field => {
      allReferencedFields.add(field.replace(/"/g, ''));
    });
  }
}

// Extract all field IDs defined in fieldMap
const fieldMapStart = configTabsContent.indexOf('const fieldMap: Record<string, {');
const fieldMapSection = configTabsContent.substring(fieldMapStart);
const fieldDefRegex = /^\s{6}([a-zA-Z][a-zA-Z0-9]*?):\s*\{/gm;
const definedFields = new Set<string>();

let fieldMatch;
while ((fieldMatch = fieldDefRegex.exec(fieldMapSection)) !== null) {
  definedFields.add(fieldMatch[1]);
}

// Find orphaned fields
const orphanedFields = Array.from(allReferencedFields).filter(field => !definedFields.has(field));

console.log('================================================================================');
console.log('ORPHANED FIELD ANALYSIS');
console.log('================================================================================');
console.log(`\nTotal fields referenced in settings arrays: ${allReferencedFields.size}`);
console.log(`Total fields defined in fieldMap: ${definedFields.size}`);
console.log(`\nOrphaned fields (referenced but not defined): ${orphanedFields.length}`);

if (orphanedFields.length > 0) {
  console.log('\nORPHANED FIELDS:');
  orphanedFields.sort().forEach(field => {
    console.log(`  - ${field}`);
  });
}

console.log('\n================================================================================');
