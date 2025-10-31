import fs from 'fs';
import { FIELD_REGISTRY } from '../shared/config/field-registry';

const csvContent = fs.readFileSync('attached_assets/librechat_0.8.0_rc4_complete_config_1761905592586.csv', 'utf-8');
const lines = csvContent.split('\n').slice(1);

interface CSVField {
  configFile: string;
  fieldPath: string;
  fieldName: string;
  dataType: string;
  description: string;
  defaultValue: string;
  required: string;
}

const allFieldsFromCSV: CSVField[] = [];

lines.forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  
  if (parts[0] === '.env') {
    allFieldsFromCSV.push({
      configFile: parts[0],
      fieldPath: parts[1],
      fieldName: parts[2],
      dataType: parts[3],
      description: parts[4] || '',
      defaultValue: parts[5] || '',
      required: parts[6]
    });
  }
});

const envKeysInRegistry = new Set<string>();
FIELD_REGISTRY.forEach(field => {
  if (field.envKey) envKeysInRegistry.add(field.envKey);
});

const missingEnvVars = allFieldsFromCSV.filter(v => !envKeysInRegistry.has(v.fieldName));

function cleanDescription(desc: string): string {
  return desc.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
}

function getCategory(fieldName: string): string {
  if (fieldName.includes('APPLE_') || fieldName.includes('FACEBOOK_') || fieldName.includes('GITHUB_') || 
      fieldName.includes('GOOGLE_') || fieldName.includes('DISCORD_') || fieldName === 'ASSISTANTS_API_KEY') return 'auth';
  if (fieldName.includes('SAML_')) return 'saml';
  if (fieldName.includes('OPENID_')) return 'openid';
  if (fieldName.includes('LDAP_')) return 'ldap';
  if (fieldName.includes('ENTRA_ID_')) return 'auth';
  if (fieldName.startsWith('AZURE_AI_SEARCH_')) return 'search';
  if (fieldName.startsWith('MONGO_')) return 'database';
  if (fieldName.includes('VIOLATION') || fieldName.includes('_MAX') || fieldName.includes('_WINDOW') || fieldName.includes('BAN_')) return 'security';
  if (fieldName.startsWith('EMAIL_')) return 'email';
  if (fieldName.startsWith('DEBUG_')) return 'debug';
  if (fieldName.startsWith('FLUX_')) return 'image-generation';
  if (fieldName.includes('API_KEY') && !fieldName.includes('OPENAI')) return 'external-apis';
  if (fieldName.startsWith('AWS_') || fieldName.startsWith('AZURE_STORAGE_') || fieldName.startsWith('FIREBASE_')) return 'file-storage';
  if (fieldName.includes('SESSION') || fieldName.includes('JWT') || fieldName.includes('REFRESH_TOKEN')) return 'auth';
  return 'system';
}

function getDefaultValue(field: CSVField): string {
  const val = field.defaultValue;
  const type = field.dataType;
  
  if (val === 'N/A' || val === '' || !val) {
    if (type === 'boolean') return 'false';
    if (type === 'number') return '0';
    return "''";
  }
  
  if (type === 'boolean') {
    return val.toLowerCase() === 'true' ? 'true' : 'false';
  }
  
  if (type === 'number') {
    // Extract numbers from strings like "1000 * 60 * 15"
    const match = val.match(/^\d+/);
    return match ? match[0] : '0';
  }
  
  // String type
  return `'${val.replace(/'/g, "\\'")}'`;
}

function generateFieldDef(field: CSVField): string {
  const id = field.fieldName.toLowerCase();
  const type = field.dataType === 'number' ? 'number' : field.dataType === 'boolean' ? 'boolean' : 'string';
  const category = getCategory(field.fieldName);
  const defaultVal = getDefaultValue(field);
  const desc = cleanDescription(field.description);
  
  return `  {
    id: '${id}',
    envKey: '${field.fieldName}',
    type: '${type}',
    defaultValue: ${defaultVal},
    category: '${category}',
    description: '${desc}',
  },`;
}

// Output all missing fields organized by category
const categories = {
  'auth': [] as CSVField[],
  'saml': [] as CSVField[],
  'openid': [] as CSVField[],
  'ldap': [] as CSVField[],
  'search': [] as CSVField[],
  'database': [] as CSVField[],
  'security': [] as CSVField[],
  'email': [] as CSVField[],
  'debug': [] as CSVField[],
  'image-generation': [] as CSVField[],
  'external-apis': [] as CSVField[],
  'file-storage': [] as CSVField[],
  'system': [] as CSVField[],
};

missingEnvVars.forEach(field => {
  const cat = getCategory(field.fieldName);
  if (categories[cat as keyof typeof categories]) {
    categories[cat as keyof typeof categories].push(field);
  }
});

console.log(`// Total missing: ${missingEnvVars.length} ENV variables\n`);

Object.entries(categories).forEach(([cat, fields]) => {
  if (fields.length > 0) {
    console.log(`\n  // ========== ${cat.toUpperCase()} (${fields.length} fields) ==========`);
    fields.forEach(f => console.log(generateFieldDef(f)));
  }
});
