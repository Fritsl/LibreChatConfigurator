import { FIELD_REGISTRY, FieldDescriptor, getFieldByEnvKey, getFieldByYamlPath, getAllEnvKeys, getAllYamlPaths } from './field-registry';

/**
 * Registry-Driven Import/Export Helpers
 * 
 * These functions use the field registry to automatically handle:
 * - ENV import validation
 * - ENV import mapping
 * - YAML import validation  
 * - YAML import mapping
 * - ENV export generation
 * - YAML export generation
 */

// =============================================================================
// ENV Import Helpers
// =============================================================================

/**
 * Validate ENV variables against registry
 * Returns list of unsupported variables
 */
export function validateEnvVars(envVars: Record<string, string>): {
  valid: boolean;
  unmappedVars: string[];
} {
  const supportedKeys = getAllEnvKeys();
  const unmappedVars: string[] = [];
  
  for (const varName of Object.keys(envVars)) {
    // Skip empty lines and comments
    if (!varName || varName.startsWith('#')) continue;
    
    if (!supportedKeys.has(varName)) {
      unmappedVars.push(varName);
    }
  }
  
  return {
    valid: unmappedVars.length === 0,
    unmappedVars
  };
}

/**
 * Map ENV variables to configuration object using registry
 */
export function mapEnvToConfiguration(envVars: Record<string, string>): Record<string, any> {
  const config: Record<string, any> = {};
  
  for (const [envKey, envValue] of Object.entries(envVars)) {
    const field = getFieldByEnvKey(envKey);
    if (!field) continue; // Skip unknown fields
    
    // Apply transformer if defined, otherwise use type-based conversion
    let value: any;
    if (field.envTransformer) {
      value = field.envTransformer(envValue);
    } else {
      value = convertEnvValue(envValue, field);
    }
    
    config[field.id] = value;
  }
  
  return config;
}

/**
 * Convert ENV string value to typed value based on field type
 */
function convertEnvValue(value: string, field: FieldDescriptor): any {
  if (!value) return field.defaultValue;
  
  switch (field.type) {
    case 'boolean':
      return value === 'true' || value === '1';
    case 'number':
      const num = parseInt(value);
      return isNaN(num) ? field.defaultValue : num;
    case 'array':
      // Arrays in ENV are comma-separated
      return value.split(',').map(v => v.trim()).filter(v => v);
    case 'string':
    case 'url':
    case 'email':
    default:
      return value;
  }
}

// =============================================================================
// YAML Import Helpers
// =============================================================================

/**
 * Validate YAML fields against registry
 * Returns list of unsupported fields
 */
export function validateYamlFields(yamlData: any): {
  valid: boolean;
  unmappedFields: string[];
} {
  const unmappedFields: string[] = [];
  
  // Recursively check all paths in YAML data
  function checkPaths(obj: any, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      // Check if this path exists in registry
      const field = getFieldByYamlPath(path);
      
      if (!field && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Might be a nested object - recurse
        checkPaths(value, path);
      } else if (!field) {
        // Leaf node with no matching field
        unmappedFields.push(path);
      }
    }
  }
  
  checkPaths(yamlData);
  
  return {
    valid: unmappedFields.length === 0,
    unmappedFields
  };
}

/**
 * Map YAML data to configuration object using registry
 */
export function mapYamlToConfiguration(yamlData: any): Record<string, any> {
  const config: Record<string, any> = {};
  
  // For each field in registry, extract from YAML if present
  for (const field of FIELD_REGISTRY) {
    if (!field.yamlPath) continue;
    
    const value = getNestedValue(yamlData, field.yamlPath);
    if (value === undefined) continue;
    
    // Apply transformer if defined
    const finalValue = field.yamlTransformer ? field.yamlTransformer(value) : value;
    config[field.id] = finalValue;
  }
  
  return config;
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

// =============================================================================
// ENV Export Helpers
// =============================================================================

/**
 * Generate .env file content from configuration using registry
 */
export function generateEnvFile(config: Record<string, any>): string {
  const lines: string[] = [];
  
  // Group fields by category for organized output
  const byCategory = new Map<string, FieldDescriptor[]>();
  for (const field of FIELD_REGISTRY) {
    if (!field.envKey || field.exportToEnv === false) continue;
    if (!byCategory.has(field.category)) {
      byCategory.set(field.category, []);
    }
    byCategory.get(field.category)!.push(field);
  }
  
  // Generate ENV file with category headers
  for (const [category, fields] of byCategory) {
    lines.push('');
    lines.push(`# ${category.toUpperCase().replace(/-/g, ' ')}`);
    lines.push('');
    
    for (const field of fields) {
      const value = config[field.id];
      const envValue = formatEnvValue(value, field);
      
      // Only export if value is set (not empty/default)
      if (envValue) {
        lines.push(`${field.envKey}=${envValue}`);
      } else {
        // Comment out if not set
        lines.push(`# ${field.envKey}=`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Format value for ENV file
 */
function formatEnvValue(value: any, field: FieldDescriptor): string {
  if (value === null || value === undefined || value === '') return '';
  
  switch (field.type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return String(value);
    case 'array':
      return Array.isArray(value) ? value.join(',') : '';
    default:
      return String(value);
  }
}

// =============================================================================
// YAML Export Helpers
// =============================================================================

/**
 * Generate YAML file content from configuration using registry
 */
export function generateYamlFile(config: Record<string, any>): string {
  // Build nested YAML structure from flat config
  const yamlStructure: any = {};
  
  for (const field of FIELD_REGISTRY) {
    if (!field.yamlPath || field.exportToYaml === false) continue;
    
    const value = config[field.id];
    if (value === undefined || value === null || value === '') continue;
    
    // Skip if value equals default (don't export defaults)
    if (value === field.defaultValue) continue;
    
    setNestedValue(yamlStructure, field.yamlPath, value);
  }
  
  // Convert structure to YAML string (simplified - full implementation would use yaml library)
  return JSON.stringify(yamlStructure, null, 2);
}

/**
 * Set nested value in object using dot notation path
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}
