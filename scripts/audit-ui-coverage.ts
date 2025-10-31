import { FIELD_REGISTRY } from '../shared/config/field-registry';
import * as fs from 'fs';
import * as path from 'path';

// Read configuration-tabs.tsx and extract all field IDs from settings arrays
const configTabsPath = path.join(process.cwd(), 'client/src/components/configuration-tabs.tsx');
const configTabsContent = fs.readFileSync(configTabsPath, 'utf-8');

// Extract field IDs from settings arrays using regex
const settingsRegex = /settings:\s*\[([\s\S]*?)\]/g;
const fieldIdRegex = /"([^"]+)"/g;

const uiFieldIds = new Set<string>();
let match;

while ((match = settingsRegex.exec(configTabsContent)) !== null) {
  const settingsContent = match[1];
  let fieldMatch;
  while ((fieldMatch = fieldIdRegex.exec(settingsContent)) !== null) {
    uiFieldIds.add(fieldMatch[1]);
  }
}

// Also extract from field definitions (fieldMap/fieldDefinitions object)
const fieldDefRegex = /^\s+(\w+):\s*\{/gm;
while ((match = fieldDefRegex.exec(configTabsContent)) !== null) {
  const fieldId = match[1];
  // Skip common object keys that aren't field IDs
  if (!['type', 'description', 'label', 'technical', 'docUrl', 'placeholder', 'options', 'min', 'max'].includes(fieldId)) {
    uiFieldIds.add(fieldId);
  }
}

console.log("================================================================================");
console.log("COMPREHENSIVE UI FIELD COVERAGE AUDIT");
console.log("================================================================================\n");

console.log(`Total fields in registry: ${FIELD_REGISTRY.length}`);
console.log(`Total unique field IDs in UI: ${uiFieldIds.size}\n`);

// Find registry fields missing from UI
const missingFromUI: string[] = [];
const presentInUI: string[] = [];

FIELD_REGISTRY.forEach(field => {
  if (uiFieldIds.has(field.id)) {
    presentInUI.push(field.id);
  } else {
    missingFromUI.push(field.id);
  }
});

console.log(`Fields present in UI: ${presentInUI.length}`);
console.log(`Fields missing from UI: ${missingFromUI.length}\n`);

if (missingFromUI.length > 0) {
  console.log("FIELDS MISSING FROM UI:");
  console.log("================================================================================\n");
  
  // Group by category
  const missingByCategory = new Map<string, string[]>();
  FIELD_REGISTRY.forEach(field => {
    if (missingFromUI.includes(field.id)) {
      const category = field.category || 'uncategorized';
      if (!missingByCategory.has(category)) {
        missingByCategory.set(category, []);
      }
      missingByCategory.get(category)!.push(field.id);
    }
  });
  
  Array.from(missingByCategory.entries())
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, fields]) => {
      console.log(`\n${category.toUpperCase()} (${fields.length} missing):`);
      fields.forEach(field => console.log(`  - ${field}`));
    });
} else {
  console.log("🎉 SUCCESS! All ${FIELD_REGISTRY.length} registry fields are accessible in the UI!\n");
}

// Find UI fields not in registry (possible orphans)
const orphanFields: string[] = [];
Array.from(uiFieldIds).forEach(id => {
  const found = FIELD_REGISTRY.find(f => f.id === id);
  if (!found) {
    orphanFields.push(id);
  }
});

if (orphanFields.length > 0) {
  console.log("\n================================================================================");
  console.log("ORPHAN FIELDS IN UI (not in registry):");
  console.log("================================================================================\n");
  orphanFields.forEach(id => console.log(`  - ${id}`));
}

console.log("\n================================================================================");
console.log("SUMMARY");
console.log("================================================================================");
console.log(`UI Coverage: ${((presentInUI.length / FIELD_REGISTRY.length) * 100).toFixed(1)}% (${presentInUI.length}/${FIELD_REGISTRY.length})`);

if (missingFromUI.length === 0 && orphanFields.length === 0) {
  console.log("✅ PERFECT: 100% coverage with no orphans!");
} else if (missingFromUI.length === 0) {
  console.log(`⚠️  COMPLETE: All registry fields in UI, but ${orphanFields.length} orphan fields found`);
} else {
  console.log(`❌ INCOMPLETE: ${missingFromUI.length} fields still missing from UI`);
}
console.log("================================================================================\n");
