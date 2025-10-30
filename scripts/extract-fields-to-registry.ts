/**
 * Field Extraction Script
 * 
 * Extracts all configuration fields from existing codebase and generates
 * a complete field registry. This is a one-time migration script.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedField {
  id: string;
  envKey?: string;
  yamlPath?: string;
  type: string;
  defaultValue: any;
  category?: string;
  description?: string;
}

const extractedFields: Map<string, ExtractedField> = new Map();

// Step 1: Extract ENV key mappings from home.tsx
function extractEnvMappings() {
  console.log('📖 Extracting ENV key mappings from home.tsx...');
  
  const homePath = path.join(__dirname, '../client/src/pages/home.tsx');
  const content = fs.readFileSync(homePath, 'utf-8');
  
  // Find the mapEnvToConfiguration function
  const funcMatch = content.match(/const mapEnvToConfiguration[^{]*{([\s\S]*?)^\s{2}};/m);
  if (!funcMatch) {
    console.error('Could not find mapEnvToConfiguration function!');
    return;
  }
  
  const funcBody = funcMatch[1];
  
  // Extract case statements: case 'ENV_KEY':
  const caseRegex = /case ['"]([A-Z_]+)['"]/g;
  let match;
  while ((match = caseRegex.exec(funcBody)) !== null) {
    const envKey = match[1];
    
    // Find the corresponding field assignment
    const afterCase = funcBody.substring(match.index);
    const assignMatch = afterCase.match(/\.(\w+)\s*=\s*([^;]+)/);
    
    if (assignMatch) {
      const fieldId = assignMatch[1];
      
      if (!extractedFields.has(fieldId)) {
        extractedFields.set(fieldId, {
          id: fieldId,
          envKey,
          type: 'string',
          defaultValue: '',
        });
      } else {
        extractedFields.get(fieldId)!.envKey = envKey;
      }
    }
  }
  
  console.log(`   Found ${extractedFields.size} ENV mappings`);
}

// Step 2: Extract YAML paths from generateYamlFile in routes.ts
function extractYamlPaths() {
  console.log('📖 Extracting YAML paths from server/routes.ts...');
  
  const routesPath = path.join(__dirname, '../server/routes.ts');
  const content = fs.readFileSync(routesPath, 'utf-8');
  
  // Extract yaml path assignments like: yamlContent.interface.customWelcome = config.customWelcome
  const yamlRegex = /yamlContent\.([a-zA-Z0-9.]+)\s*=\s*config\.(\w+)/g;
  let match;
  let count = 0;
  
  while ((match = yamlRegex.exec(content)) !== null) {
    const yamlPath = match[1];
    const fieldId = match[2];
    
    if (extractedFields.has(fieldId)) {
      extractedFields.get(fieldId)!.yamlPath = yamlPath;
    } else {
      extractedFields.set(fieldId, {
        id: fieldId,
        yamlPath,
        type: 'string',
        defaultValue: '',
      });
    }
    count++;
  }
  
  console.log(`   Found ${count} YAML path mappings`);
}

// Step 3: Extract field types and defaults from configuration-defaults.ts
function extractDefaults() {
  console.log('📖 Extracting defaults from configuration-defaults.ts...');
  
  const defaultsPath = path.join(__dirname, '../client/src/lib/configuration-defaults.ts');
  const content = fs.readFileSync(defaultsPath, 'utf-8');
  
  // Extract object property definitions
  const propertyRegex = /(\w+):\s*({[^}]*}|"[^"]*"|\d+|true|false|\[\])/g;
  let match;
  let count = 0;
  
  while ((match = propertyRegex.exec(content)) !== null) {
    const fieldId = match[1];
    const valueStr = match[2];
    
    let defaultValue: any = '';
    let type = 'string';
    
    // Infer type from value
    if (valueStr === 'true' || valueStr === 'false') {
      type = 'boolean';
      defaultValue = valueStr === 'true';
    } else if (valueStr.match(/^\d+$/)) {
      type = 'number';
      defaultValue = parseInt(valueStr);
    } else if (valueStr === '[]') {
      type = 'array';
      defaultValue = [];
    } else if (valueStr.startsWith('{')) {
      type = 'object';
      defaultValue = {};
    } else {
      defaultValue = valueStr.replace(/^"|"$/g, '');
    }
    
    if (extractedFields.has(fieldId)) {
      const field = extractedFields.get(fieldId)!;
      field.defaultValue = defaultValue;
      field.type = type;
    } else {
      extractedFields.set(fieldId, {
        id: fieldId,
        type,
        defaultValue,
      });
    }
    count++;
  }
  
  console.log(`   Processed ${count} default values`);
}

// Step 4: Categorize fields
function categorizeFields() {
  console.log('📂 Categorizing fields...');
  
  const categories: Record<string, string[]> = {
    'app': ['appTitle', 'customWelcome', 'customFooter', 'helpAndFAQURL', 'version', 'cache'],
    'server': ['host', 'port', 'nodeEnv', 'domainClient', 'domainServer', 'noIndex'],
    'security': ['jwtSecret', 'jwtRefreshSecret', 'credsKey', 'credsIV', 'sessionExpiry'],
    'database': ['mongoUri', 'mongoDbName', 'redisUri', 'redisPassword'],
    'auth': ['allowRegistration', 'allowEmailLogin', 'emailVerificationRequired'],
    'email': ['emailService', 'emailUsername', 'emailPassword', 'emailFrom'],
    'ai-providers': ['openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'groqApiKey'],
    'interface': ['modelSelect', 'parameters', 'sidePanel', 'presets', 'agents'],
  };
  
  for (const [category, fieldIds] of Object.entries(categories)) {
    for (const fieldId of fieldIds) {
      if (extractedFields.has(fieldId)) {
        extractedFields.get(fieldId)!.category = category;
      }
    }
  }
  
  // Default category for uncategorized fields
  for (const field of extractedFields.values()) {
    if (!field.category) {
      field.category = 'other';
    }
  }
}

// Step 5: Generate registry file
function generateRegistryFile() {
  console.log('📝 Generating field-registry.ts...');
  
  const fields = Array.from(extractedFields.values());
  
  // Sort by category then by id
  fields.sort((a, b) => {
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.id.localeCompare(b.id);
  });
  
  // Generate TypeScript code
  const lines: string[] = [
    '/**',
    ' * AUTO-GENERATED Field Registry',
    ' * Generated by scripts/extract-fields-to-registry.ts',
    ' * DO NOT EDIT MANUALLY - Run the script to regenerate',
    ' */',
    '',
    'import { z } from "zod";',
    '',
    'export type FieldType = "string" | "boolean" | "number" | "array" | "object" | "enum" | "url" | "email";',
    '',
    'export interface FieldDescriptor {',
    '  id: string;',
    '  envKey?: string;',
    '  yamlPath?: string;',
    '  type: FieldType;',
    '  defaultValue: any;',
    '  category: string;',
    '  description?: string;',
    '  exportToEnv?: boolean;',
    '  exportToYaml?: boolean;',
    '}',
    '',
    'export const FIELD_REGISTRY: FieldDescriptor[] = [',
  ];
  
  let currentCategory = '';
  for (const field of fields) {
    if (field.category !== currentCategory) {
      if (currentCategory) {
        lines.push('');
      }
      lines.push(`  // ${field.category?.toUpperCase()}`);
      currentCategory = field.category || '';
    }
    
    const props: string[] = [
      `id: '${field.id}'`,
    ];
    
    if (field.envKey) {
      props.push(`envKey: '${field.envKey}'`);
    }
    
    if (field.yamlPath) {
      props.push(`yamlPath: '${field.yamlPath}'`);
    }
    
    props.push(`type: '${field.type}'`);
    
    // Format default value
    let defaultStr: string;
    if (typeof field.defaultValue === 'string') {
      defaultStr = `'${field.defaultValue}'`;
    } else if (Array.isArray(field.defaultValue)) {
      defaultStr = '[]';
    } else if (typeof field.defaultValue === 'object') {
      defaultStr = '{}';
    } else {
      defaultStr = String(field.defaultValue);
    }
    props.push(`defaultValue: ${defaultStr}`);
    
    props.push(`category: '${field.category}'`);
    
    lines.push(`  { ${props.join(', ')} },`);
  }
  
  lines.push('];');
  lines.push('');
  
  // Add helper functions
  lines.push('export function getFieldById(id: string): FieldDescriptor | undefined {');
  lines.push('  return FIELD_REGISTRY.find(f => f.id === id);');
  lines.push('}');
  lines.push('');
  lines.push('export function getFieldByEnvKey(envKey: string): FieldDescriptor | undefined {');
  lines.push('  return FIELD_REGISTRY.find(f => f.envKey === envKey);');
  lines.push('}');
  lines.push('');
  lines.push('export function getFieldByYamlPath(yamlPath: string): FieldDescriptor | undefined {');
  lines.push('  return FIELD_REGISTRY.find(f => f.yamlPath === yamlPath);');
  lines.push('}');
  lines.push('');
  lines.push('export function getAllEnvKeys(): Set<string> {');
  lines.push('  return new Set(FIELD_REGISTRY.filter(f => f.envKey).map(f => f.envKey!));');
  lines.push('}');
  lines.push('');
  lines.push('export function getAllYamlPaths(): Set<string> {');
  lines.push('  return new Set(FIELD_REGISTRY.filter(f => f.yamlPath).map(f => f.yamlPath!));');
  lines.push('}');
  
  const outputPath = path.join(__dirname, '../shared/config/field-registry-generated.ts');
  fs.writeFileSync(outputPath, lines.join('\n'));
  
  console.log(`✅ Generated registry with ${fields.length} fields`);
  console.log(`   Output: ${outputPath}`);
}

// Main execution
function main() {
  console.log('🚀 Starting field extraction...\n');
  
  extractEnvMappings();
  extractYamlPaths();
  extractDefaults();
  categorizeFields();
  generateRegistryFile();
  
  console.log('\n✨ Extraction complete!');
  console.log(`📊 Total fields extracted: ${extractedFields.size}`);
}

main();
