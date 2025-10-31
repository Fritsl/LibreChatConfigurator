import fs from 'fs';
import { FIELD_REGISTRY } from '../shared/config/field-registry';

// Read the CSV file
const csvContent = fs.readFileSync('attached_assets/librechat_0.8.0_rc4_complete_config_1761905592586.csv', 'utf-8');
const lines = csvContent.split('\n').slice(1); // Skip header

const envVarsFromCSV = new Set<string>();
const yamlPathsFromCSV = new Set<string>();

// Parse CSV
lines.forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  const configFile = parts[0];
  const fieldPath = parts[1];
  const fieldName = parts[2];
  
  if (configFile === '.env') {
    envVarsFromCSV.add(fieldName);
  } else if (configFile === 'librechat.yaml') {
    yamlPathsFromCSV.add(fieldPath);
  }
});

// Extract ENV keys and YAML paths from registry
const envKeysInRegistry = new Set<string>();
const yamlPathsInRegistry = new Set<string>();

FIELD_REGISTRY.forEach(field => {
  if (field.envKey) {
    envKeysInRegistry.add(field.envKey);
  }
  if (field.yamlPath) {
    yamlPathsInRegistry.add(field.yamlPath);
  }
});

console.log('='.repeat(80));
console.log('COVERAGE VERIFICATION REPORT');
console.log('='.repeat(80));
console.log();

// Check ENV coverage
console.log(`ENV Variables in CSV: ${envVarsFromCSV.size}`);
console.log(`ENV Variables in Registry: ${envKeysInRegistry.size}`);

const missingEnvVars = Array.from(envVarsFromCSV).filter(v => !envKeysInRegistry.has(v));
const extraEnvVars = Array.from(envKeysInRegistry).filter(v => !envVarsFromCSV.has(v));

console.log(`Missing from Registry: ${missingEnvVars.length}`);
console.log(`Extra in Registry: ${extraEnvVars.length}`);
console.log();

if (missingEnvVars.length > 0) {
  console.log('⚠️  Missing ENV Variables:');
  missingEnvVars.slice(0, 20).forEach(v => console.log(`  - ${v}`));
  if (missingEnvVars.length > 20) {
    console.log(`  ... and ${missingEnvVars.length - 20} more`);
  }
  console.log();
}

// Check YAML coverage
console.log(`YAML Fields in CSV: ${yamlPathsFromCSV.size}`);
console.log(`YAML Fields in Registry: ${yamlPathsInRegistry.size}`);

const missingYamlPaths = Array.from(yamlPathsFromCSV).filter(p => !yamlPathsInRegistry.has(p));
const extraYamlPaths = Array.from(yamlPathsInRegistry).filter(p => !yamlPathsFromCSV.has(p));

console.log(`Missing from Registry: ${missingYamlPaths.length}`);
console.log(`Extra in Registry (detailed fields): ${extraYamlPaths.length}`);
console.log();

if (missingYamlPaths.length > 0) {
  console.log('⚠️  Missing YAML Paths:');
  missingYamlPaths.slice(0, 20).forEach(p => console.log(`  - ${p}`));
  if (missingYamlPaths.length > 20) {
    console.log(`  ... and ${missingYamlPaths.length - 20} more`);
  }
  console.log();
}

// Summary
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const envCoverage = ((envVarsFromCSV.size - missingEnvVars.length) / envVarsFromCSV.size * 100).toFixed(1);
const yamlCoverage = ((yamlPathsFromCSV.size - missingYamlPaths.length) / yamlPathsFromCSV.size * 100).toFixed(1);

console.log(`ENV Coverage: ${envCoverage}% (${envVarsFromCSV.size - missingEnvVars.length}/${envVarsFromCSV.size})`);
console.log(`YAML Coverage: ${yamlCoverage}% (${yamlPathsFromCSV.size - missingYamlPaths.length}/${yamlPathsFromCSV.size})`);
console.log();

if (missingEnvVars.length === 0 && missingYamlPaths.length === 0) {
  console.log('✅ COMPLETE: All LibreChat RC4 fields are covered!');
} else {
  console.log(`⚠️  INCOMPLETE: ${missingEnvVars.length + missingYamlPaths.length} fields missing`);
}

console.log('='.repeat(80));
