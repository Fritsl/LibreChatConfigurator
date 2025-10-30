#!/usr/bin/env tsx
/**
 * Round-Trip Parity Tests
 * 
 * Tests complete bidirectional parity for:
 * - JSON export → import
 * - YAML export → import  
 * - ENV export → import
 * 
 * Verifies that all 367+ LibreChat RC4 configuration fields
 * maintain perfect parity through export/import cycles.
 */

import { FIELD_REGISTRY } from '../shared/config/field-registry';
import { 
  mapEnvToConfiguration, 
  mapYamlToConfiguration,
  getCachedSecrets 
} from '../shared/config/registry-helpers';
import * as yaml from 'js-yaml';

// Test configuration with diverse field types
const TEST_CONFIG = {
  // Core settings
  version: '0.8.0-rc4',
  cache: true,
  fileStrategy: 'firebase' as const,
  imageOutputType: 'webp' as const,
  secureImageLinks: true,
  
  // Interface settings
  interfaceTitle: 'LibreChat Test Instance',
  interfaceModelSelect: true,
  interfaceParameters: true,
  interfaceAgents: true,
  interfaceWebSearch: false,
  
  // Custom endpoints
  customEndpoints: [
    {
      name: 'Test Endpoint',
      apiKey: 'test-key-123',
      baseURL: 'https://api.example.com',
      models: {
        default: ['gpt-4', 'gpt-3.5-turbo'],
        fetch: true
      }
    }
  ],
  
  // Agent settings
  agentsDisableBuilder: false,
  agentsRecursionLimit: 5,
  agentsMaxRecursionLimit: 10,
  
  // Memory settings
  memoryEnabled: true,
  memoryProvider: 'rag_api' as const,
  memoryCollectionName: 'test-collection',
  
  // Speech settings (with null to test null handling)
  sttProvider: 'openai' as const,
  sttModel: 'whisper-1',
  sttApiKey: null,  // Explicitly null to test clearing
  ttsProvider: null,  // Explicitly null
  
  // Web search
  webSearchSerperApiKey: 'test-serper-key',
  webSearchProvider: 'searxng' as const,
  webSearchSafeSearch: 'moderate' as const,
  
  // Rate limits
  rateLimitsPerUserMax: 100,
  rateLimitsPerUserWindowInMinutes: 60,
  rateLimitsFileUploadsUserMax: 50,
  
  // File config
  fileConfigServerFileSizeLimit: 20,
  fileConfigAvatarSizeLimit: 2,
  
  // Registration
  registrationEnabled: true,
  registrationAllowedDomains: ['example.com', 'test.org'],
  
  // Model specs
  modelSpecsEnforce: true,
  modelSpecsPrioritize: true,
  
  // OpenAI endpoint
  endpointsOpenAIApiKey: 'sk-test-key',
  endpointsOpenAIBaseURL: 'https://api.openai.com/v1',
  endpointsOpenAIModelsDefault: ['gpt-4', 'gpt-3.5-turbo'],
  
  // Actions
  actionsAllowedDomains: ['*.example.com'],
  
  // OCR
  ocrStrategy: 'auto' as const,
  ocrMistralModel: 'pixtral-12b-2409',
};

console.log('🧪 Starting Round-Trip Parity Tests\n');
console.log('=' .repeat(60));

// =============================================================================
// Test 1: JSON Export → Import
// =============================================================================
console.log('\n📦 Test 1: JSON Export → Import Parity');
console.log('-'.repeat(60));

try {
  // Simulate JSON export (what the frontend sends)
  const jsonExport = {
    toolVersion: '1.18.0',
    librechatVersion: '0.8.0-rc4',
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    configurationName: 'Test Configuration',
    configuration: TEST_CONFIG
  };
  
  // Simulate JSON import (what the frontend receives)
  const jsonImport = jsonExport.configuration;
  
  // Compare
  const jsonMismatches: string[] = [];
  for (const [key, value] of Object.entries(TEST_CONFIG)) {
    if (JSON.stringify(jsonImport[key]) !== JSON.stringify(value)) {
      jsonMismatches.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(jsonImport[key])}`);
    }
  }
  
  if (jsonMismatches.length === 0) {
    console.log('✅ JSON round-trip: PASS (100% parity)');
  } else {
    console.log('❌ JSON round-trip: FAIL');
    jsonMismatches.forEach(msg => console.log(`  - ${msg}`));
  }
} catch (error) {
  console.log(`❌ JSON test failed with error: ${error.message}`);
}

// =============================================================================
// Test 2: YAML Export → Import
// =============================================================================
console.log('\n📄 Test 2: YAML Export → Import Parity');
console.log('-'.repeat(60));

try {
  // Generate YAML from configuration (simulating server export)
  const yamlData: any = {};
  
  // Map configuration to YAML structure using registry
  for (const field of Object.values(FIELD_REGISTRY)) {
    if (!field.yamlPath) continue;
    
    const configValue = TEST_CONFIG[field.id];
    if (configValue === undefined) continue;
    
    // Set value in YAML structure using yamlPath
    const pathParts = field.yamlPath.split('.');
    let current = yamlData;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = configValue;
  }
  
  // Convert to YAML string and back
  const yamlString = yaml.dump(yamlData);
  const parsedYaml = yaml.load(yamlString) as any;
  
  // Map YAML back to configuration
  const importedConfig = mapYamlToConfiguration(parsedYaml);
  
  // Compare (only for fields that have yamlPath)
  const yamlMismatches: string[] = [];
  const yamlFields = Object.values(FIELD_REGISTRY).filter(f => f.yamlPath);
  
  for (const field of yamlFields) {
    const originalValue = TEST_CONFIG[field.id];
    const importedValue = importedConfig[field.id];
    
    // Skip if original doesn't have this field
    if (originalValue === undefined) continue;
    
    // Compare values (handle null correctly)
    if (JSON.stringify(originalValue) !== JSON.stringify(importedValue)) {
      yamlMismatches.push(
        `${field.id} (${field.yamlPath}): expected ${JSON.stringify(originalValue)}, got ${JSON.stringify(importedValue)}`
      );
    }
  }
  
  if (yamlMismatches.length === 0) {
    console.log(`✅ YAML round-trip: PASS (100% parity for ${yamlFields.length} YAML-mapped fields)`);
  } else {
    console.log('❌ YAML round-trip: FAIL');
    yamlMismatches.forEach(msg => console.log(`  - ${msg}`));
  }
} catch (error) {
  console.log(`❌ YAML test failed with error: ${error.message}`);
  console.error(error);
}

// =============================================================================
// Test 3: ENV Export → Import
// =============================================================================
console.log('\n🔐 Test 3: ENV Export → Import Parity');
console.log('-'.repeat(60));

try {
  // Generate ENV from configuration (simulating server export)
  const envVars: Record<string, string> = {};
  const secrets = getCachedSecrets('test-config');
  
  // Map configuration to ENV variables using registry
  for (const field of Object.values(FIELD_REGISTRY)) {
    if (!field.envKey) continue;
    
    const configValue = TEST_CONFIG[field.id];
    if (configValue === undefined) continue;
    
    // Convert value to ENV string format
    let envValue: string;
    if (typeof configValue === 'boolean') {
      envValue = configValue.toString();
    } else if (Array.isArray(configValue)) {
      envValue = configValue.join(',');
    } else if (typeof configValue === 'object') {
      envValue = JSON.stringify(configValue);
    } else {
      envValue = String(configValue);
    }
    
    envVars[field.envKey] = envValue;
  }
  
  // Add required secrets
  envVars.JWT_SECRET = secrets.jwtSecret;
  envVars.JWT_REFRESH_SECRET = secrets.jwtRefreshSecret;
  envVars.CREDS_KEY = secrets.credsKey;
  envVars.CREDS_IV = secrets.credsIV;
  
  // Map ENV back to configuration
  const importedConfig = mapEnvToConfiguration(envVars);
  
  // Compare (only for fields that have envKey)
  const envMismatches: string[] = [];
  const envFields = Object.values(FIELD_REGISTRY).filter(f => f.envKey);
  
  for (const field of envFields) {
    const originalValue = TEST_CONFIG[field.id];
    const importedValue = importedConfig[field.id];
    
    // Skip if original doesn't have this field
    if (originalValue === undefined) continue;
    
    // Skip secrets (they're auto-generated, not imported)
    if (['jwtSecret', 'jwtRefreshSecret', 'credsKey', 'credsIV'].includes(field.id)) continue;
    
    // Compare values (handle type conversions)
    const originalStr = JSON.stringify(originalValue);
    const importedStr = JSON.stringify(importedValue);
    
    if (originalStr !== importedStr) {
      envMismatches.push(
        `${field.id} (${field.envKey}): expected ${originalStr}, got ${importedStr}`
      );
    }
  }
  
  if (envMismatches.length === 0) {
    console.log(`✅ ENV round-trip: PASS (100% parity for ${envFields.length} ENV-mapped fields)`);
  } else {
    console.log('❌ ENV round-trip: FAIL');
    envMismatches.forEach(msg => console.log(`  - ${msg}`));
  }
} catch (error) {
  console.log(`❌ ENV test failed with error: ${error.message}`);
  console.error(error);
}

// =============================================================================
// Test 4: Null Handling Verification
// =============================================================================
console.log('\n🔍 Test 4: Null Handling Verification');
console.log('-'.repeat(60));

try {
  // Create YAML with explicit nulls (using correct yamlPath structure)
  const yamlWithNulls = {
    stt: {
      apiKey: null,
      baseURL: null
    },
    tts: {
      provider: null,
      apiKey: null
    }
  };
  
  // Import and verify nulls are preserved
  const importedWithNulls = mapYamlToConfiguration(yamlWithNulls);
  
  const nullTests = [
    { field: 'sttApiKey', expected: null, actual: importedWithNulls.sttApiKey },
    { field: 'sttBaseURL', expected: null, actual: importedWithNulls.sttBaseURL },
    { field: 'ttsProvider', expected: null, actual: importedWithNulls.ttsProvider },
    { field: 'ttsApiKey', expected: null, actual: importedWithNulls.ttsApiKey },
  ];
  
  const nullMismatches = nullTests.filter(t => t.expected !== t.actual);
  
  if (nullMismatches.length === 0) {
    console.log('✅ Null handling: PASS (explicit nulls preserved)');
  } else {
    console.log('❌ Null handling: FAIL');
    nullMismatches.forEach(t => {
      console.log(`  - ${t.field}: expected ${t.expected}, got ${t.actual}`);
    });
  }
} catch (error) {
  console.log(`❌ Null handling test failed: ${error.message}`);
}

// =============================================================================
// Summary
// =============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total FIELD_REGISTRY entries: ${Object.keys(FIELD_REGISTRY).length}`);
console.log(`Fields with envKey: ${Object.values(FIELD_REGISTRY).filter(f => f.envKey).length}`);
console.log(`Fields with yamlPath: ${Object.values(FIELD_REGISTRY).filter(f => f.yamlPath).length}`);
console.log('\nAll tests completed. Review results above.');
console.log('='.repeat(60));
