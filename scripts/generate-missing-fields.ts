import fs from 'fs';
import { FIELD_REGISTRY } from '../shared/config/field-registry';

// Read the CSV file
const csvContent = fs.readFileSync('attached_assets/librechat_0.8.0_rc4_complete_config_1761905592586.csv', 'utf-8');
const lines = csvContent.split('\n').slice(1); // Skip header

interface CSVField {
  configFile: string;
  fieldPath: string;
  fieldName: string;
  dataType: string;
  description: string;
  defaultValue: string;
  required: string;
}

const envVarsFromCSV: CSVField[] = [];

// Parse CSV
lines.forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  
  if (parts[0] === '.env') {
    envVarsFromCSV.push({
      configFile: parts[0],
      fieldPath: parts[1],
      fieldName: parts[2],
      dataType: parts[3],
      description: parts[4],
      defaultValue: parts[5],
      required: parts[6]
    });
  }
});

// Extract ENV keys from registry
const envKeysInRegistry = new Set<string>();
FIELD_REGISTRY.forEach(field => {
  if (field.envKey) {
    envKeysInRegistry.add(field.envKey);
  }
});

// Find missing ENV variables
const missingEnvVars = envVarsFromCSV.filter(v => !envKeysInRegistry.has(v.fieldName));

console.log(`Found ${missingEnvVars.length} missing ENV variables\n`);

// Group by category
const authVars = missingEnvVars.filter(v => 
  v.fieldName.includes('APPLE_') || 
  v.fieldName.includes('SAML_') || 
  v.fieldName.includes('OPENID_') ||
  v.fieldName.includes('LDAP_') ||
  v.fieldName === 'ASSISTANTS_API_KEY'
);

const azureVars = missingEnvVars.filter(v => v.fieldName.startsWith('AZURE_AI_SEARCH_'));
const mongoVars = missingEnvVars.filter(v => v.fieldName.startsWith('MONGO_') && !['MONGO_URI'].includes(v.fieldName));
const violationVars = missingEnvVars.filter(v => v.fieldName.includes('VIOLATION') || v.fieldName.includes('_MAX') || v.fieldName.includes('_WINDOW'));
const emailVars = missingEnvVars.filter(v => v.fieldName.startsWith('EMAIL_') && !['EMAIL_FROM', 'EMAIL_FROM_NAME', 'EMAIL_SERVICE', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USERNAME', 'EMAIL_PASSWORD'].includes(v.fieldName));
const debugVars = missingEnvVars.filter(v => v.fieldName.startsWith('DEBUG_'));
const otherVars = missingEnvVars.filter(v => 
  !authVars.includes(v) && 
  !azureVars.includes(v) && 
  !mongoVars.includes(v) && 
  !violationVars.includes(v) &&
  !emailVars.includes(v) &&
  !debugVars.includes(v)
);

console.log(`Authentication: ${authVars.length}`);
console.log(`Azure AI Search: ${azureVars.length}`);
console.log(`MongoDB: ${mongoVars.length}`);
console.log(`Rate Limiting: ${violationVars.length}`);
console.log(`Email: ${emailVars.length}`);
console.log(`Debug: ${debugVars.length}`);
console.log(`Other: ${otherVars.length}\n`);

// Generate field definitions
function generateFieldDef(field: CSVField, category: string): string {
  const id = field.fieldName.toLowerCase();
  const type = field.dataType === 'number' ? 'number' : field.dataType === 'boolean' ? 'boolean' : 'string';
  const defaultVal = field.defaultValue === 'N/A' || !field.defaultValue ? '' : field.defaultValue;
  
  return `  {
    id: '${id}',
    envKey: '${field.fieldName}',
    type: '${type}',
    defaultValue: ${type === 'boolean' ? defaultVal.toLowerCase() : type === 'number' ? (defaultVal || '0') : `'${defaultVal}'`},
    category: '${category}',
    description: '${field.description.replace(/'/g, "\\'")}',
  },`;
}

console.log('// ===== AUTHENTICATION VARIABLES =====');
authVars.forEach(v => console.log(generateFieldDef(v, 'authentication')));

console.log('\n// ===== AZURE AI SEARCH =====');
azureVars.forEach(v => console.log(generateFieldDef(v, 'search')));

console.log('\n// ===== MONGODB CONNECTION POOL =====');
mongoVars.forEach(v => console.log(generateFieldDef(v, 'database')));

console.log('\n// ===== RATE LIMITING =====');
violationVars.forEach(v => console.log(generateFieldDef(v, 'security')));

console.log('\n// ===== EMAIL CONFIGURATION =====');
emailVars.forEach(v => console.log(generateFieldDef(v, 'email')));

console.log('\n// ===== DEBUG SETTINGS =====');
debugVars.forEach(v => console.log(generateFieldDef(v, 'system')));

console.log('\n// ===== OTHER SETTINGS =====');
otherVars.forEach(v => console.log(generateFieldDef(v, 'system')));
