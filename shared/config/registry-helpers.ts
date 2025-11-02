import { FIELD_REGISTRY, FieldDescriptor, getFieldByEnvKey, getFieldByYamlPath, getAllEnvKeys, getAllYamlPaths, getYamlFields } from './field-registry';
import { useLibreChatDefault } from './field-overrides';
import type { Configuration } from '../schema';

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
// Secret Generation Helpers
// =============================================================================

interface CachedSecrets {
  jwtSecret: string;
  jwtRefreshSecret: string;
  credsKey: string;
  credsIV: string;
}

const secretsCache = new Map<string, CachedSecrets>();

export function getCachedSecrets(configName: string): CachedSecrets {
  if (!secretsCache.has(configName)) {
    secretsCache.set(configName, {
      jwtSecret: generateSecureSecret(32),
      jwtRefreshSecret: generateSecureSecret(32),
      credsKey: generateHexSecret(32),
      credsIV: generateHexSecret(16),
    });
  }
  return secretsCache.get(configName)!;
}

function generateSecureSecret(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateHexSecret(byteLength: number): string {
  const hexChars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < byteLength * 2; i++) {
    result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return result;
}

// =============================================================================
// ENV Import Helpers
// =============================================================================

/**
 * Validate ENV variables against registry
 * Returns list of unsupported variables and YAML-only field violations
 * 
 * DUAL-PLACEMENT POLICY (LibreChat Beta Safety):
 * LibreChat RC4 is in active beta with bugs allowing some fields in both .env and YAML.
 * For security, this tool prioritizes .env for ANY field with an envKey (including dual-placement).
 * Only pure YAML-only fields (no envKey) are rejected from .env imports.
 * 
 * Policy: "If it has an envKey, it belongs in .env" - keeps API keys secure.
 */
export function validateEnvVars(envVars: Record<string, string>): {
  valid: boolean;
  unmappedVars: string[];
  yamlOnlyVars: Array<{ envKey: string; yamlPath: string }>;
} {
  const supportedKeys = getAllEnvKeys();
  const unmappedVars: string[] = [];
  const yamlOnlyVars: Array<{ envKey: string; yamlPath: string }> = [];
  
  for (const varName of Object.keys(envVars)) {
    // Skip empty lines and comments
    if (!varName || varName.startsWith('#')) continue;
    
    // Check if this field exists in registry
    const field = getFieldByEnvKey(varName);
    
    if (field && field.envKey) {
      // ✅ VALID: Field has envKey, so it CAN be in .env
      // This includes:
      //   - Pure .env fields (envKey only)
      //   - Dual-placement fields (envKey + yamlPath) ← LibreChat beta bugs
      // For security, dual-placement fields go to .env to protect API keys
      continue;
    } else if (field && field.yamlPath && !field.envKey) {
      // ❌ YAML-ONLY: Field has yamlPath but NO envKey - pure YAML field
      yamlOnlyVars.push({ envKey: varName, yamlPath: field.yamlPath });
    } else if (!supportedKeys.has(varName)) {
      // ❌ UNMAPPED: Field not found in registry at all
      unmappedVars.push(varName);
    }
  }
  
  return {
    valid: unmappedVars.length === 0 && yamlOnlyVars.length === 0,
    unmappedVars,
    yamlOnlyVars
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
 * Helper: Extract value from nested YAML path (e.g., 'webSearch.serperApiKey')
 */
function getValueFromYamlPath(yamlData: any, path: string): any {
  const parts = path.split('.');
  let value = yamlData;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Helper: Check if a value is an env var placeholder like "${OPENAI_API_KEY}"
 * These should be skipped during import since they're just references
 */
function isEnvPlaceholder(value: any): boolean {
  return typeof value === 'string' && value.startsWith('${') && value.endsWith('}');
}

/**
 * Map YAML data to configuration object using FULLY AUTOMATED registry-driven approach
 * 
 * This function is now TRULY registry-driven:
 * - Iterates through FIELD_REGISTRY
 * - Uses yamlPath metadata to extract values
 * - Applies yamlTransformer if defined
 * - NO hardcoded field mappings
 * 
 * Special cases are handled through:
 * - yamlTransformer in field descriptor
 * - Registry metadata
 * 
 * This ensures the registry is the single source of truth.
 */
export function mapYamlToConfiguration(yamlData: any): Record<string, any> {
  const config: Record<string, any> = {};
  
  // Get all fields that have YAML paths defined
  const yamlFields = getYamlFields();
  
  // Process each field from the registry
  for (const field of yamlFields) {
    // Extract value from YAML data using the field's yamlPath
    const yamlValue = getValueFromYamlPath(yamlData, field.yamlPath!);
    
    // Skip if value doesn't exist (but allow explicit nulls to clear fields)
    // This enables users to intentionally set fields to null in YAML
    if (yamlValue === undefined) continue;
    if (isEnvPlaceholder(yamlValue)) continue;
    
    // Apply transformer if defined, otherwise use value as-is
    let configValue: any;
    if (field.yamlTransformer) {
      configValue = field.yamlTransformer(yamlValue);
    } else {
      configValue = yamlValue;
    }
    
    // Store in config object
    // If configPath is defined, use it to store at the correct nested location
    // This handles structural mismatches between YAML and internal schema
    // (e.g., LibreChat's speech.stt.openai.url → our stt.baseURL)
    if (field.configPath) {
      setNestedValue(config, field.configPath, configValue);
    } else {
      // Default: store using field ID
      config[field.id] = configValue;
    }
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

/**
 * Set nested value in object using dot notation path
 * Creates intermediate objects as needed
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  // Navigate to the parent of the final property
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the final property
  const finalPart = parts[parts.length - 1];
  current[finalPart] = value;
}

// =============================================================================
// ENV Export Helpers
// =============================================================================

/**
 * Generate .env file content from configuration using registry
 * This is a comprehensive implementation that handles:
 * - Cached secrets for security fields
 * - Nested structure access (webSearch.*, interface.*, etc.)
 * - Conditional output based on config values
 * - Default value comments
 * 
 * DUAL-PLACEMENT POLICY (LibreChat Beta Safety):
 * LibreChat RC4 has bugs allowing some fields in both .env and YAML.
 * For security, this tool exports ALL fields with envKey to .env (including dual-placement).
 * This keeps API keys and secrets secure in .env rather than YAML.
 * Policy: "If it has an envKey, export it to .env" - even if it also has yamlPath.
 */
export function generateEnvFile(config: Record<string, any>): string {
  const currentDate = new Date().toISOString().split('T')[0];
  const configName = config.configurationName || 'default';
  const cachedSecrets = getCachedSecrets(configName);
  
  const lines: string[] = [
    '# =============================================================================',
    '# LibreChat Environment Configuration (RC4)',
    `# Generated on ${currentDate}`,
    '# =============================================================================',
    '#',
    '# NOTE: Some fields appear here that could also be in librechat.yaml.',
    '# This is due to LibreChat beta bugs. For security, we keep them in .env',
    '# to protect API keys and secrets. This will normalize when LibreChat stabilizes.',
    '#'
  ];
  
  // Group fields by category for organized output
  const byCategory = new Map<string, FieldDescriptor[]>();
  for (const field of FIELD_REGISTRY) {
    // Check if field should be exported to .env
    let shouldExport = false;
    
    if (field.envKey && field.exportToEnv !== false) {
      // ✅ DUAL-PLACEMENT POLICY: Export ALL fields with envKey to .env
      // This includes:
      //   - Pure .env fields (envKey only)
      //   - Dual-placement fields (envKey + yamlPath) ← LibreChat beta bugs
      // For security, dual-placement fields go to .env to protect API keys
      shouldExport = true;
    }
    
    if (!shouldExport) continue;
    
    if (!byCategory.has(field.category)) {
      byCategory.set(field.category, []);
    }
    byCategory.get(field.category)!.push(field);
  }
  
  // Define category display names and order
  const categoryOrder = [
    'app',
    'server',
    'security',
    'database',
    'auth',
    'email',
    'oauth',
    'ai-providers',
    'file-storage',
    'web-search',
    'meilisearch',
    'rate-limiting',
    'ldap',
    'turnstile',
    'features',
    'caching',
    'mcp',
    'code-execution',
    'artifacts',
    'user-management',
    'debug',
    'misc'
  ];
  
  const categoryDisplayNames: Record<string, string> = {
    'app': 'App Configuration',
    'server': 'Server Configuration',
    'security': 'Security Configuration',
    'database': 'Database Configuration',
    'auth': 'Authentication Configuration',
    'email': 'Email Configuration',
    'oauth': 'OAuth Providers Configuration',
    'ai-providers': 'Core AI API Keys',
    'file-storage': 'File Storage Configuration',
    'web-search': 'Web Search Configuration',
    'meilisearch': 'MeiliSearch Configuration',
    'rate-limiting': 'Rate Limiting & Security Configuration',
    'ldap': 'LDAP Configuration',
    'turnstile': 'Turnstile Configuration',
    'features': 'Features Configuration',
    'caching': 'Caching Configuration',
    'mcp': 'MCP Configuration',
    'code-execution': 'Code Execution Configuration',
    'artifacts': 'Artifacts Configuration (Generative UI)',
    'user-management': 'User Management Configuration',
    'debug': 'Debug Configuration',
    'misc': 'Miscellaneous Configuration'
  };
  
  // Generate ENV file with category headers in specific order
  for (const category of categoryOrder) {
    const fields = byCategory.get(category);
    if (!fields || fields.length === 0) continue;
    
    lines.push('');
    lines.push('# =============================================================================');
    lines.push(`# ${categoryDisplayNames[category] || category.toUpperCase().replace(/-/g, ' ')}`);
    lines.push('# =============================================================================');
    
    for (const field of fields) {
      const envLine = generateEnvLine(field, config, cachedSecrets);
      lines.push(envLine);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate a single ENV line for a field
 */
function generateEnvLine(field: FieldDescriptor, config: Record<string, any>, cachedSecrets: CachedSecrets): string {
  // Get value - handle nested structures
  let value = getConfigValue(config, field);
  
  // Check if field should use LibreChat default
  // IMPORTANT: If fieldOverrides is undefined (legacy configs), treat all fields as explicit
  // This maintains backward compatibility with existing saved configurations
  const shouldUseDefault = config.fieldOverrides 
    ? useLibreChatDefault(config as Configuration, field.id)
    : false; // Legacy configs: treat all fields as explicit
  
  // Add bug warning header if field has known LibreChat bug
  const bugWarning = field.librechatBug
    ? [
        '',
        `# ⚠️  KNOWN LIBRECHAT BUG - ${field.envKey || field.id}`,
        `# ${field.librechatBug.description}`,
        `# Workaround: ${field.librechatBug.workaround}`,
        field.librechatBug.affectedVersions ? `# Affected: ${field.librechatBug.affectedVersions}` : null
      ].filter(line => line !== null).join('\n') + '\n' // Add trailing newline
    : '';
  
  // Special handling for security fields with cached secrets
  const securityFields: Record<string, keyof CachedSecrets> = {
    'JWT_SECRET': 'jwtSecret',
    'JWT_REFRESH_SECRET': 'jwtRefreshSecret',
    'CREDS_KEY': 'credsKey',
    'CREDS_IV': 'credsIV'
  };
  
  if (field.envKey && securityFields[field.envKey]) {
    if (value) {
      // Check fieldOverrides even for security fields
      if (shouldUseDefault) {
        return bugWarning + `# ${field.envKey}=${value}  # Using LibreChat default`;
      }
      return bugWarning + `${field.envKey}=${value}`;
    } else {
      const cachedValue = cachedSecrets[securityFields[field.envKey]];
      return bugWarning + `# ${field.envKey}=${cachedValue} (auto-generated - configure in Security settings to export)`;
    }
  }
  
  // Format the value for ENV
  const envValue = formatEnvValue(value, field);
  
  // Export strategy: Output uncommented if field has ANY value
  // This ensures old saved configs with broken fieldOverrides still export properly
  // The fieldOverrides system is for UI state only, not export decisions
  if (envValue !== '') {
    return bugWarning + `${field.envKey}=${envValue}`;
  }
  
  // If no value and shouldUseDefault, add helpful comment
  const defaultComment = getDefaultComment(field);
  if (shouldUseDefault) {
    return bugWarning + `# ${field.envKey}=${defaultComment}  # Using LibreChat default`;
  }
  
  // If no value, output commented with default
  return bugWarning + `# ${field.envKey}=${defaultComment}`;
}

/**
 * Get configuration value, handling nested structures
 */
function getConfigValue(config: Record<string, any>, field: FieldDescriptor): any {
  // PRIORITY 1: Try nested access via yamlPath first (e.g., interface.customWelcome)
  // This ensures we read from the correct location even if a top-level field exists
  if (field.yamlPath) {
    const value = getNestedValue(config, field.yamlPath);
    if (value !== undefined) {
      return value;
    }
  }
  
  // PRIORITY 2: Fall back to direct field access
  if (config[field.id] !== undefined) {
    return config[field.id];
  }
  
  return undefined;
}

/**
 * Get default comment for a field
 */
function getDefaultComment(field: FieldDescriptor): string {
  if (field.defaultValue === undefined || field.defaultValue === null || field.defaultValue === '') {
    return '';
  }
  
  switch (field.type) {
    case 'boolean':
      return field.defaultValue ? 'true' : 'false';
    case 'number':
      return String(field.defaultValue);
    case 'array':
      return Array.isArray(field.defaultValue) ? field.defaultValue.join(',') : '';
    default:
      // Escape double quotes and wrap string in quotes
      const escapedValue = String(field.defaultValue).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escapedValue}"`;
  }
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
      // Escape backslashes and double quotes, then wrap in quotes
      // This ensures .env files can handle spaces, special characters, and multi-line values
      const escapedValue = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escapedValue}"`;
  }
}

// =============================================================================
// YAML Export Helpers
// =============================================================================

/**
 * Escape single quotes in YAML strings
 * In YAML, single quotes are escaped by doubling them
 */
export function escapeYamlString(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Canonicalize configuration by removing duplicate fields that map to the same envKey
 * This prevents duplicate key errors in JSON and ensures only registry-canonical fields persist
 * 
 * ROOT CAUSE FIX: Historical duplicate field definitions in FIELD_REGISTRY allowed imports
 * to create multiple fields for the same envKey (e.g., awsEndpointURL + awsEndpointUrl).
 * Once duplicates entered saved configs, they persisted indefinitely through load/save cycles.
 * 
 * @param config - Configuration object that may contain duplicate fields
 * @returns Canonicalized configuration with only the first registered field for each envKey
 */
export function canonicalizeConfiguration(config: any): any {
  if (!config || typeof config !== 'object') return config;
  
  // Build map of canonical field IDs (fields that are IN the registry)
  const registeredFieldIds = new Set<string>();
  const envKeyToCanonical = new Map<string, string>();
  
  for (const field of FIELD_REGISTRY) {
    registeredFieldIds.add(field.id);
    if (field.envKey) {
      if (!envKeyToCanonical.has(field.envKey)) {
        // First field for this envKey is the canonical one
        envKeyToCanonical.set(field.envKey, field.id);
      }
    }
  }
  
  // Remove ANY field from config that's not in the registry
  // This removes historical duplicates like 'awsEndpointUrl' that were deleted from registry
  const canonicalized: any = {};
  for (const key in config) {
    if (registeredFieldIds.has(key)) {
      // Field is in registry - keep it
      canonicalized[key] = config[key];
    }
    // Otherwise skip it - it's a legacy duplicate or unknown field
  }
  
  return canonicalized;
}

/**
 * Escape double-quoted YAML strings to prevent injection
 * Escapes: backslashes, newlines, carriage returns, tabs, and double quotes
 */
export function escapeYamlDoubleQuoted(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

/**
 * Format a YAML field respecting fieldOverrides
 * If field should use LibreChat default, formats as comment
 * Otherwise formats normally
 * 
 * @param config - Configuration object (must be Configuration type or compatible)
 * @param fieldId - Field identifier from registry
 * @param yamlKey - The YAML key name (e.g., 'agents', 'modelSelect')
 * @param value - The value to output
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted YAML line (commented if using default, normal if explicitly set)
 */
function formatYamlField(
  config: any,
  fieldId: string,
  yamlKey: string,
  value: any,
  indent: number = 2
): string {
  const indentStr = ' '.repeat(indent);
  const formattedValue = typeof value === 'string' && value.includes('"')
    ? `"${escapeYamlDoubleQuoted(value)}"`
    : String(value);
  
  // Export strategy: Output uncommented if field has ANY value
  // This ensures old saved configs with broken fieldOverrides still export properly
  // The fieldOverrides system is for UI state only, not export decisions
  
  // Find the field in registry to check if value matches default
  const field = FIELD_REGISTRY.find(f => f.id === fieldId);
  if (field) {
    // If value matches the default, check if user wants to use LibreChat default
    const valueMatchesDefault = value === field.defaultValue;
    const shouldUseDefault = config.fieldOverrides && useLibreChatDefault(config as Configuration, fieldId);
    
    if (valueMatchesDefault && shouldUseDefault) {
      return `${indentStr}# ${yamlKey}: ${formattedValue}  # Using LibreChat default`;
    }
  }
  
  // Field has a value (even if it matches default), output normally
  return `${indentStr}${yamlKey}: ${formattedValue}`;
}

/**
 * Generate YAML file content from configuration using registry-based approach
 * This replaces the manual template literal implementation with a structured approach
 * 
 * DUAL-PLACEMENT POLICY (LibreChat Beta Safety):
 * LibreChat RC4 has bugs allowing some fields in both .env and YAML.
 * For security, this tool exports fields with envKey to .env ONLY (not YAML).
 * YAML generation skips dual-placement fields and only includes pure YAML-only fields.
 * Policy: "If it has an envKey, skip it in YAML" - keep API keys secure in .env.
 */
export function generateYamlFile(config: Record<string, any>): string {
  const lines: string[] = [
    '# =============================================================================',
    '# LibreChat Configuration for v0.8.0-RC4',
    '# =============================================================================',
    '#',
    '# NOTE: API keys and secrets are stored in .env for security.',
    '# This file contains only non-sensitive configuration fields.',
    '# Due to LibreChat beta bugs, some fields that could be here are in .env instead.',
    '#',
    '',
    `version: ${config.version || "0.8.0-rc4"}`,
    `cache: ${config.cache ?? true}`,
    ''
  ];
  
  // MCP Servers Configuration
  const mcpSection = generateMcpServersSection(config);
  if (mcpSection) {
    lines.push(mcpSection, '');
  }
  
  // Endpoints Configuration
  const endpointsSection = generateEndpointsSection(config);
  if (endpointsSection) {
    lines.push(endpointsSection, '');
  }
  
  // Interface Configuration
  const interfaceSection = generateInterfaceSection(config);
  if (interfaceSection) {
    lines.push(interfaceSection, '');
  }
  
  // Model Specs Configuration
  const modelSpecsSection = generateModelSpecsSection(config);
  if (modelSpecsSection) {
    lines.push(modelSpecsSection, '');
  }
  
  // File Configuration
  const fileConfigSection = generateFileConfigSection(config);
  if (fileConfigSection) {
    lines.push(fileConfigSection, '');
  }
  
  // Rate Limits
  const rateLimitsSection = generateRateLimitsSection(config);
  lines.push(rateLimitsSection, '');
  
  // Memory Configuration
  const memorySection = generateMemorySection(config);
  if (memorySection) {
    lines.push(memorySection, '');
  }
  
  // Web Search Configuration
  const webSearchSection = generateWebSearchSection(config);
  lines.push(webSearchSection, '');
  
  // OCR Configuration
  const ocrSection = generateOcrSection(config);
  lines.push(ocrSection, '');
  
  // Speech Configuration (includes STT, TTS, and UI speech settings)
  const speechSection = generateSpeechSection(config);
  lines.push(speechSection, '');
  
  // Actions Configuration
  const actionsSection = generateActionsSection(config);
  lines.push(actionsSection, '');
  
  return lines.join('\n');
}

/**
 * Generate MCP Servers section
 */
function generateMcpServersSection(config: any): string {
  // Skip MCP servers if E2B proxy is enabled (HTTP proxy conflicts with MCP)
  if (config.e2bProxyEnabled) return '';
  
  if (!config.mcpServers) return '';
  
  // Handle both array and object formats
  let serversToProcess: [string, any][] = [];
  
  if (Array.isArray(config.mcpServers)) {
    if (config.mcpServers.length === 0) return '';
    serversToProcess = config.mcpServers.map((server: any) => [
      server.name || 'unnamed-server',
      server
    ]);
  } else if (typeof config.mcpServers === 'object') {
    const keys = Object.keys(config.mcpServers);
    if (keys.length === 0) return '';
    serversToProcess = Object.entries(config.mcpServers);
  } else {
    return '';
  }
  
  const lines = ['# MCP Servers Configuration', 'mcpServers:'];
  
  for (const [serverName, server] of serversToProcess) {
    lines.push(`  '${escapeYamlString(serverName)}':`);
    lines.push(`    type: "${escapeYamlDoubleQuoted(server.type || 'streamable-http')}"`);
    
    if (server.url) {
      lines.push(`    url: "${escapeYamlDoubleQuoted(server.url)}"`);
    }
    
    if (server.command) {
      lines.push(`    command: "${escapeYamlDoubleQuoted(server.command)}"`);
    }
    
    if (server.args && server.args.length > 0) {
      lines.push(`    args:`);
      server.args.forEach((arg: string) => {
        lines.push(`      - "${escapeYamlDoubleQuoted(arg)}"`);
      });
    }
    
    lines.push(`    timeout: ${server.timeout || 30000}`);
    
    if (server.initTimeout) {
      lines.push(`    initTimeout: ${server.initTimeout}`);
    }
    
    if (server.headers && Object.keys(server.headers).length > 0) {
      lines.push(`    headers:`);
      Object.entries(server.headers).forEach(([k, v]) => {
        lines.push(`      '${escapeYamlString(k)}': "${escapeYamlDoubleQuoted(String(v))}"`);
      });
    }
    
    if (server.serverInstructions !== undefined) {
      if (typeof server.serverInstructions === 'boolean') {
        lines.push(`    serverInstructions: ${server.serverInstructions}`);
      } else if (typeof server.serverInstructions === 'string') {
        lines.push(`    serverInstructions: |`);
        server.serverInstructions.split('\n').forEach((line: string) => {
          lines.push(`      ${line}`);
        });
      }
    }
    
    if (server.iconPath) {
      lines.push(`    iconPath: "${escapeYamlDoubleQuoted(server.iconPath)}"`);
    }
    
    if (server.chatMenu !== undefined) {
      lines.push(`    chatMenu: ${server.chatMenu}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Endpoints section
 * 
 * DUAL-PLACEMENT POLICY: API keys (openaiApiKey, anthropicApiKey, googleApiKey, 
 * groqApiKey, mistralApiKey, custom endpoint apiKey) are NOT included in YAML.
 * They're exported to .env for security. Only non-sensitive configuration appears in YAML.
 */
function generateEndpointsSection(config: any): string {
  const hasAgents = config.endpoints?.agents;
  const hasOpenAI = config.enabledEndpoints?.includes('openAI') && config.openaiApiKey && (config.endpoints?.openAI?.titleConvo !== undefined || config.endpoints?.openAI?.titleModel);
  const hasAnthropic = config.enabledEndpoints?.includes('anthropic') && config.anthropicApiKey;
  const hasGoogle = config.enabledEndpoints?.includes('google') && config.googleApiKey;
  const hasCustom = config.endpoints?.custom && config.endpoints.custom.length > 0;
  const hasGroqOrMistral = config.groqApiKey || config.mistralApiKey;
  
  if (!hasAgents && !hasOpenAI && !hasAnthropic && !hasGoogle && !hasCustom && !hasGroqOrMistral) return '';
  
  const lines = [
    '# Endpoints Configuration', 
    '# NOTE: API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, etc.)',
    '# are stored in .env for security. Only non-sensitive settings appear here.',
    'endpoints:'
  ];
  
  // Agents endpoint
  const agentsConfig = config.endpoints?.agents || {};
  const agentsDisableBuilder = agentsConfig.disableBuilder ?? config.endpointsAgentsDisableBuilder;
  const agentsRecursionLimit = agentsConfig.recursionLimit ?? config.endpointsAgentsRecursionLimit;
  const agentsMaxRecursionLimit = agentsConfig.maxRecursionLimit ?? config.endpointsAgentsMaxRecursionLimit;
  const agentsCapabilities = agentsConfig.capabilities ?? config.endpointsAgentsCapabilities;
  const agentsMaxCitations = agentsConfig.maxCitations ?? config.endpointsAgentsMaxCitations;
  const agentsMaxCitationsPerFile = agentsConfig.maxCitationsPerFile ?? config.endpointsAgentsMaxCitationsPerFile;
  const agentsMinRelevanceScore = agentsConfig.minRelevanceScore ?? config.endpointsAgentsMinRelevanceScore;
  
  if (config.endpoints?.agents || agentsDisableBuilder !== undefined || agentsRecursionLimit !== undefined || agentsMaxRecursionLimit !== undefined || agentsCapabilities || agentsMaxCitations !== undefined || agentsMaxCitationsPerFile !== undefined || agentsMinRelevanceScore !== undefined) {
    lines.push('  agents:');
    if (agentsDisableBuilder !== undefined) {
      lines.push(`    disableBuilder: ${agentsDisableBuilder}`);
    }
    if (agentsRecursionLimit !== undefined) {
      lines.push(`    recursionLimit: ${agentsRecursionLimit}`);
    }
    if (agentsMaxRecursionLimit !== undefined) {
      lines.push(`    maxRecursionLimit: ${agentsMaxRecursionLimit}`);
    }
    if (agentsCapabilities) {
      lines.push(`    capabilities:`);
      const caps = Array.isArray(agentsCapabilities) 
        ? agentsCapabilities 
        : Object.keys(agentsCapabilities).filter((k: string) => agentsCapabilities[k]);
      caps.forEach((cap: string) => lines.push(`      - ${cap}`));
    }
    if (agentsMaxCitations !== undefined) {
      lines.push(`    maxCitations: ${agentsMaxCitations}`);
    }
    if (agentsMaxCitationsPerFile !== undefined) {
      lines.push(`    maxCitationsPerFile: ${agentsMaxCitationsPerFile}`);
    }
    if (agentsMinRelevanceScore !== undefined) {
      lines.push(`    minRelevanceScore: ${agentsMinRelevanceScore}`);
    }
  }
  
  // Assistants endpoint
  const assistantsConfig = config.endpoints?.assistants || {};
  const hasAssistantsConfig = Object.keys(assistantsConfig).length > 0;
  const assistantsCapabilities = assistantsConfig.capabilities ?? config.endpointsAssistantsCapabilities;
  const assistantsDisableBuilder = assistantsConfig.disableBuilder ?? config.endpointsAssistantsDisableBuilder;
  const assistantsSupportedIds = assistantsConfig.supportedIds ?? config.endpointsAssistantsSupportedIds;
  const assistantsExcludedIds = assistantsConfig.excludedIds ?? config.endpointsAssistantsExcludedIds;
  const assistantsPrivateAssistants = assistantsConfig.privateAssistants ?? config.endpointsAssistantsPrivateAssistants;
  const assistantsRetrievalModels = assistantsConfig.retrievalModels ?? config.endpointsAssistantsRetrievalModels;
  const assistantsPollIntervalMs = assistantsConfig.pollIntervalMs ?? config.endpointsAssistantsPollIntervalMs;
  const assistantsTimeoutMs = assistantsConfig.timeoutMs ?? config.endpointsAssistantsTimeoutMs;
  
  if (hasAssistantsConfig || assistantsCapabilities || assistantsDisableBuilder !== undefined || assistantsSupportedIds || assistantsExcludedIds || assistantsPrivateAssistants !== undefined || assistantsRetrievalModels || assistantsPollIntervalMs !== undefined || assistantsTimeoutMs !== undefined) {
    lines.push('  assistants:');
    if (assistantsDisableBuilder !== undefined) {
      lines.push(`    disableBuilder: ${assistantsDisableBuilder}`);
    }
    if (assistantsCapabilities) {
      lines.push(`    capabilities:`);
      const caps = Array.isArray(assistantsCapabilities) 
        ? assistantsCapabilities 
        : Object.keys(assistantsCapabilities).filter((k: string) => assistantsCapabilities[k]);
      caps.forEach((cap: string) => lines.push(`      - ${cap}`));
    }
    if (assistantsSupportedIds && assistantsSupportedIds.length > 0) {
      lines.push(`    supportedIds:`);
      assistantsSupportedIds.forEach((id: string) => lines.push(`      - "${escapeYamlDoubleQuoted(id)}"`));
    }
    if (assistantsExcludedIds && assistantsExcludedIds.length > 0) {
      lines.push(`    excludedIds:`);
      assistantsExcludedIds.forEach((id: string) => lines.push(`      - "${escapeYamlDoubleQuoted(id)}"`));
    }
    if (assistantsPrivateAssistants !== undefined) {
      lines.push(`    privateAssistants: ${assistantsPrivateAssistants}`);
    }
    if (assistantsRetrievalModels && assistantsRetrievalModels.length > 0) {
      lines.push(`    retrievalModels:`);
      assistantsRetrievalModels.forEach((model: string) => lines.push(`      - "${escapeYamlDoubleQuoted(model)}"`));
    }
    if (assistantsPollIntervalMs !== undefined) {
      lines.push(`    pollIntervalMs: ${assistantsPollIntervalMs}`);
    }
    if (assistantsTimeoutMs !== undefined) {
      lines.push(`    timeoutMs: ${assistantsTimeoutMs}`);
    }
  }
  
  // OpenAI endpoint
  if (hasOpenAI) {
    lines.push('  openAI:');
    lines.push('    title: "OpenAI"');
    lines.push('    apiKey: "${OPENAI_API_KEY}"');
    lines.push('    models:');
    lines.push('      fetch: true');
    lines.push('    dropParams:');
    lines.push('      - "frequency_penalty"');
    lines.push('      - "presence_penalty"');
    lines.push('      - "stop"');
    lines.push('      - "user"');
    if (config.endpoints?.openAI?.titleConvo !== undefined) {
      lines.push(`    titleConvo: ${config.endpoints.openAI.titleConvo}`);
    }
    if (config.endpoints?.openAI?.titleModel) {
      lines.push(`    titleModel: "${escapeYamlDoubleQuoted(config.endpoints.openAI.titleModel)}"`);
    }
  }
  
  // Anthropic endpoint
  if (hasAnthropic) {
    lines.push('  anthropic:');
    lines.push('    title: "Anthropic"');
    lines.push('    apiKey: "${ANTHROPIC_API_KEY}"');
    lines.push('    models:');
    lines.push('      fetch: true');
    lines.push('    dropParams:');
    lines.push('      - "frequency_penalty"');
    lines.push('      - "presence_penalty"');
    lines.push('    titleConvo: true');
    lines.push('    titleModel: "claude-3-haiku-20240307"');
  }
  
  // Google endpoint
  if (hasGoogle) {
    lines.push('  google:');
    lines.push('    title: "Google AI"');
    lines.push('    apiKey: "${GOOGLE_API_KEY}"');
    lines.push('    models:');
    lines.push('      fetch: true');
    lines.push('    dropParams:');
    lines.push('      - "frequency_penalty"');
    lines.push('      - "presence_penalty"');
    lines.push('      - "stop"');
    lines.push('    titleConvo: true');
    lines.push('    titleModel: "gemini-1.5-flash"');
  }
  
  // Custom endpoints
  if (hasCustom) {
    lines.push('  custom:');
    for (const endpoint of config.endpoints.custom) {
      lines.push(`    - name: '${escapeYamlString(endpoint.name)}'`);
      // ❌ SECURITY: apiKey excluded from YAML - stored in .env instead
      // LibreChat reads API keys from .env automatically
      lines.push(`      baseURL: '${escapeYamlString(endpoint.baseURL)}'`);
      lines.push(`      models:`);
      if (endpoint.models?.fetch !== undefined) {
        lines.push(`        fetch: ${endpoint.models.fetch}`);
      }
      if (endpoint.models?.default && endpoint.models.default.length > 0) {
        lines.push(`        default:`);
        endpoint.models.default.forEach((model: string) => {
          lines.push(`          - "${model}"`);
        });
      }
      if (endpoint.titleConvo !== undefined) {
        lines.push(`      titleConvo: ${endpoint.titleConvo}`);
      }
      if (endpoint.titleModel) {
        lines.push(`      titleModel: '${escapeYamlString(endpoint.titleModel)}'`);
      }
      if (endpoint.titleMethod) {
        lines.push(`      titleMethod: '${escapeYamlString(endpoint.titleMethod)}'`);
      }
      if (endpoint.titlePrompt) {
        lines.push(`      titlePrompt: '${escapeYamlString(endpoint.titlePrompt)}'`);
      }
      if (endpoint.titlePromptTemplate) {
        lines.push(`      titlePromptTemplate: '${escapeYamlString(endpoint.titlePromptTemplate)}'`);
      }
      if (endpoint.titleEndpoint) {
        lines.push(`      titleEndpoint: '${escapeYamlString(endpoint.titleEndpoint)}'`);
      }
      if (endpoint.summarize !== undefined) {
        lines.push(`      summarize: ${endpoint.summarize}`);
      }
      if (endpoint.summaryModel) {
        lines.push(`      summaryModel: '${escapeYamlString(endpoint.summaryModel)}'`);
      }
      if (endpoint.forcePrompt !== undefined) {
        lines.push(`      forcePrompt: ${endpoint.forcePrompt}`);
      }
      if (endpoint.modelDisplayLabel) {
        lines.push(`      modelDisplayLabel: '${escapeYamlString(endpoint.modelDisplayLabel)}'`);
      }
      if (endpoint.addParams && Object.keys(endpoint.addParams).length > 0) {
        lines.push(`      addParams:`);
        Object.entries(endpoint.addParams).forEach(([key, value]) => {
          lines.push(`        ${key}: ${JSON.stringify(value)}`);
        });
      }
      if (endpoint.dropParams && endpoint.dropParams.length > 0) {
        lines.push(`      dropParams:`);
        endpoint.dropParams.forEach((param: string) => {
          lines.push(`        - '${escapeYamlString(param)}'`);
        });
      }
      if (endpoint.headers && Object.keys(endpoint.headers).length > 0) {
        lines.push(`      headers:`);
        Object.entries(endpoint.headers).forEach(([key, value]) => {
          lines.push(`        ${escapeYamlString(key)}: '${escapeYamlString(value as string)}'`);
        });
      }
    }
  } else if (hasGroqOrMistral) {
    // Auto-add Groq/Mistral endpoints if API keys present
    lines.push('  custom:');
    if (config.groqApiKey) {
      lines.push(`    - name: 'groq'`);
      // ❌ SECURITY: apiKey excluded from YAML - stored in .env instead
      lines.push(`      baseURL: 'https://api.groq.com/openai/v1/'`);
      lines.push(`      models:`);
      lines.push(`        fetch: false`);
      lines.push(`        default:`);
      lines.push(`          - "llama3-70b-8192"`);
      lines.push(`          - "llama3-8b-8192"`);
      lines.push(`          - "llama2-70b-4096"`);
      lines.push(`          - "mixtral-8x7b-32768"`);
      lines.push(`          - "gemma-7b-it"`);
      lines.push(`      titleConvo: true`);
      lines.push(`      titleModel: 'mixtral-8x7b-32768'`);
      lines.push(`      modelDisplayLabel: 'Groq'`);
    }
    if (config.mistralApiKey) {
      lines.push(`    - name: 'Mistral'`);
      // ❌ SECURITY: apiKey excluded from YAML - stored in .env instead
      lines.push(`      baseURL: 'https://api.mistral.ai/v1'`);
      lines.push(`      models:`);
      lines.push(`        fetch: true`);
      lines.push(`        default:`);
      lines.push(`          - "mistral-tiny"`);
      lines.push(`          - "mistral-small"`);
      lines.push(`          - "mistral-medium"`);
      lines.push(`          - "mistral-large-latest"`);
      lines.push(`      titleConvo: true`);
      lines.push(`      titleModel: 'mistral-tiny'`);
      lines.push(`      modelDisplayLabel: 'Mistral'`);
      lines.push(`      dropParams:`);
      lines.push(`        - 'stop'`);
      lines.push(`        - 'user'`);
      lines.push(`        - 'frequency_penalty'`);
      lines.push(`        - 'presence_penalty'`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Interface section
 */
function generateInterfaceSection(config: any): string {
  const hasInterfaceValues = config.interface && Object.keys(config.interface).some(key => config.interface[key] !== undefined && config.interface[key] !== null && config.interface[key] !== '');
  const hasTemporaryChatRetention = config.temporaryChatRetention !== undefined;
  // Note: customFooter excluded from YAML due to LibreChat bug (use .env instead)
  const hasTopLevelInterfaceFields = config.customWelcome;
  
  if (!hasInterfaceValues && !hasTemporaryChatRetention && !hasTopLevelInterfaceFields) return '';
  
  const lines = ['# Interface Configuration', 'interface:'];
  
  // Use formatYamlField() to respect fieldOverrides
  if (config.interface?.agents !== undefined) {
    lines.push(formatYamlField(config, 'interfaceAgents', 'agents', config.interface.agents));
  }
  if (config.interface?.modelSelect !== undefined) {
    lines.push(formatYamlField(config, 'interfaceModelSelect', 'modelSelect', config.interface.modelSelect));
  }
  if (config.interface?.parameters !== undefined) {
    lines.push(formatYamlField(config, 'interfaceParameters', 'parameters', config.interface.parameters));
  }
  if (config.interface?.sidePanel !== undefined) {
    lines.push(formatYamlField(config, 'interfaceSidePanel', 'sidePanel', config.interface.sidePanel));
  }
  if (config.interface?.presets !== undefined) {
    lines.push(formatYamlField(config, 'interfacePresets', 'presets', config.interface.presets));
  }
  if (config.interface?.prompts !== undefined) {
    lines.push(`  prompts: ${config.interface.prompts}`);
  }
  if (config.interface?.bookmarks !== undefined) {
    lines.push(`  bookmarks: ${config.interface.bookmarks}`);
  }
  if (config.interface?.multiConvo !== undefined) {
    lines.push(`  multiConvo: ${config.interface.multiConvo}`);
  }
  if (config.interface?.webSearch !== undefined) {
    lines.push(`  webSearch: ${config.interface.webSearch}`);
  }
  if (config.interface?.fileSearch !== undefined) {
    lines.push(`  fileSearch: ${config.interface.fileSearch}`);
  }
  if (config.interface?.fileCitations !== undefined) {
    lines.push(`  fileCitations: ${config.interface.fileCitations}`);
  }
  if (config.interface?.runCode !== undefined) {
    lines.push(`  runCode: ${config.interface.runCode}`);
  }
  if (config.interface?.artifacts !== undefined) {
    lines.push(`  artifacts: ${config.interface.artifacts}`);
  }
  if (config.interface?.endpointsMenu !== undefined) {
    lines.push(`  endpointsMenu: ${config.interface.endpointsMenu}`);
  }
  if (config.temporaryChatRetention !== undefined) {
    lines.push(`  temporaryChatRetention: ${config.temporaryChatRetention}`);
  }
  if (config.interface?.defaultPreset) {
    lines.push(`  defaultPreset: "${escapeYamlDoubleQuoted(config.interface.defaultPreset)}"`);
  }
  if (config.interface?.customWelcome || config.customWelcome) {
    lines.push(`  customWelcome: "${escapeYamlDoubleQuoted(config.interface?.customWelcome || config.customWelcome)}"`);
  }
  // NOTE: customFooter intentionally excluded from YAML due to LibreChat RC4 bug
  // The frontend TypeScript interface is missing the customFooter field definition,
  // causing it to be filtered out before reaching the UI. Use CUSTOM_FOOTER in .env instead.
  // This is a temporary workaround until LibreChat fixes the TypeScript definitions.
  
  const termsModalAcceptance = config.interface?.termsOfService?.modalAcceptance ?? config.interfaceTermsOfServiceModalAcceptance;
  const termsModalTitle = config.interface?.termsOfService?.modalTitle ?? config.interfaceTermsOfServiceModalTitle;
  const termsModalSubmitText = config.interface?.termsOfService?.modalSubmitText ?? config.interfaceTermsOfServiceModalSubmitText;
  const termsExternalUrl = config.interface?.termsOfService?.externalUrl ?? config.interfaceTermsOfServiceExternalUrl;
  const termsOpenNewTab = config.interface?.termsOfService?.openNewTab ?? config.interfaceTermsOfServiceOpenNewTab;
  
  if (termsModalAcceptance !== undefined || termsModalTitle || termsModalSubmitText || termsExternalUrl || termsOpenNewTab !== undefined) {
    lines.push('  termsOfService:');
    if (termsModalAcceptance !== undefined) {
      lines.push(`    modalAcceptance: ${termsModalAcceptance}`);
    }
    if (termsModalTitle) {
      lines.push(`    modalTitle: "${escapeYamlDoubleQuoted(termsModalTitle)}"`);
    }
    if (termsModalSubmitText) {
      lines.push(`    modalSubmitText: "${escapeYamlDoubleQuoted(termsModalSubmitText)}"`);
    }
    if (termsExternalUrl) {
      lines.push(`    externalUrl: "${escapeYamlDoubleQuoted(termsExternalUrl)}"`);
    }
    if (termsOpenNewTab !== undefined) {
      lines.push(`    openNewTab: ${termsOpenNewTab}`);
    }
  }
  
  const privacyExternalUrl = config.interface?.privacyPolicy?.externalUrl ?? config.interfacePrivacyPolicyExternalUrl;
  const privacyOpenNewTab = config.interface?.privacyPolicy?.openNewTab ?? config.interfacePrivacyPolicyOpenNewTab;
  
  if (privacyExternalUrl || privacyOpenNewTab !== undefined) {
    lines.push('  privacyPolicy:');
    if (privacyExternalUrl) {
      lines.push(`    externalUrl: "${escapeYamlDoubleQuoted(privacyExternalUrl)}"`);
    }
    if (privacyOpenNewTab !== undefined) {
      lines.push(`    openNewTab: ${privacyOpenNewTab}`);
    }
  }
  
  const marketplaceUse = config.interface?.marketplace?.use ?? config.interfaceMarketplaceUse;
  if (marketplaceUse !== undefined) {
    lines.push('  marketplace:');
    lines.push(`    use: ${marketplaceUse}`);
  }
  
  const peoplePickerUsers = config.interface?.peoplePicker?.users ?? config.interfacePeoplePickerUsers;
  const peoplePickerRoles = config.interface?.peoplePicker?.roles ?? config.interfacePeoplePickerRoles;
  const peoplePickerGroups = config.interface?.peoplePicker?.groups ?? config.interfacePeoplePickerGroups;
  
  if (peoplePickerUsers !== undefined || peoplePickerRoles !== undefined || peoplePickerGroups !== undefined) {
    lines.push('  peoplePicker:');
    if (peoplePickerUsers !== undefined) {
      lines.push(`    users: ${peoplePickerUsers}`);
    }
    if (peoplePickerRoles !== undefined) {
      lines.push(`    roles: ${peoplePickerRoles}`);
    }
    if (peoplePickerGroups !== undefined) {
      lines.push(`    groups: ${peoplePickerGroups}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Model Specs section
 */
function generateModelSpecsSection(config: any): string {
  if (!config.modelSpecs) return '';
  
  const lines: string[] = [];
  
  // Simple list with addedEndpoints
  if (config.modelSpecs.addedEndpoints && config.modelSpecs.addedEndpoints.length > 0) {
    lines.push('# Model Specs Configuration');
    lines.push('modelSpecs:');
    lines.push('  list:');
    lines.push('    - addedEndpoints:');
    config.modelSpecs.addedEndpoints.forEach((endpoint: string) => {
      lines.push(`        - "${endpoint}"`);
    });
  }
  
  // Detailed presets list
  if (config.modelSpecs.list && config.modelSpecs.list.length > 0) {
    if (lines.length === 0) {
      lines.push('# Model Specs Presets Configuration');
      lines.push('modelSpecs:');
    }
    if (config.modelSpecs.enforce !== undefined) {
      lines.push(`  enforce: ${config.modelSpecs.enforce}`);
    }
    if (config.modelSpecs.prioritize !== undefined) {
      lines.push(`  prioritize: ${config.modelSpecs.prioritize}`);
    }
    lines.push('  list:');
    config.modelSpecs.list.forEach((preset: any) => {
      lines.push(`    - name: "${escapeYamlDoubleQuoted(preset.name)}"`);
      if (preset.label) {
        lines.push(`      label: "${escapeYamlDoubleQuoted(preset.label)}"`);
      }
      if (preset.description) {
        lines.push(`      description: "${escapeYamlDoubleQuoted(preset.description)}"`);
      }
      if (preset.default) {
        lines.push(`      default: ${preset.default}`);
      }
      lines.push(`      preset:`);
      lines.push(`        endpoint: "${preset.preset.endpoint}"`);
      if (preset.preset.model) {
        lines.push(`        model: "${escapeYamlDoubleQuoted(preset.preset.model)}"`);
      }
      if (preset.preset.agent_id) {
        lines.push(`        agent_id: "${escapeYamlDoubleQuoted(preset.preset.agent_id)}"`);
      }
    });
  }
  
  return lines.join('\n');
}

/**
 * Generate File Configuration section
 */
function generateFileConfigSection(config: any): string {
  const serverFileSizeLimit = config.fileConfig?.serverFileSizeLimit ?? config.fileConfigServerFileSizeLimit;
  const avatarSizeLimit = config.fileConfig?.avatarSizeLimit ?? config.fileConfigAvatarSizeLimit;
  const clientImageResizeEnabled = config.fileConfig?.clientImageResize?.enabled ?? config.fileConfigClientImageResizeEnabled;
  const clientImageResizeMaxWidth = config.fileConfig?.clientImageResize?.maxWidth ?? config.fileConfigClientImageResizeMaxWidth;
  const clientImageResizeMaxHeight = config.fileConfig?.clientImageResize?.maxHeight ?? config.fileConfigClientImageResizeMaxHeight;
  const clientImageResizeQuality = config.fileConfig?.clientImageResize?.quality ?? config.fileConfigClientImageResizeQuality;
  const clientImageResizeCompressFormat = config.fileConfig?.clientImageResize?.compressFormat ?? config.fileConfigClientImageResizeCompressFormat;
  
  const hasFileConfig = config.fileConfig || serverFileSizeLimit !== undefined || avatarSizeLimit !== undefined || clientImageResizeEnabled !== undefined || clientImageResizeMaxWidth !== undefined || clientImageResizeMaxHeight !== undefined || clientImageResizeQuality !== undefined || clientImageResizeCompressFormat;
  
  if (!hasFileConfig) return '';
  
  const lines = ['# File Configuration', 'fileConfig:'];
  
  if (config.fileConfig?.endpoints && Object.keys(config.fileConfig.endpoints).length > 0) {
    lines.push('  endpoints:');
    Object.entries(config.fileConfig.endpoints).forEach(([endpointName, limits]: [string, any]) => {
      lines.push(`    ${endpointName}:`);
      if (limits.disabled !== undefined) {
        lines.push(`      disabled: ${limits.disabled}`);
      }
      if (limits.fileLimit !== undefined) {
        lines.push(`      fileLimit: ${limits.fileLimit}`);
      }
      if (limits.fileSizeLimit !== undefined) {
        lines.push(`      fileSizeLimit: ${limits.fileSizeLimit}`);
      }
      if (limits.totalSizeLimit !== undefined) {
        lines.push(`      totalSizeLimit: ${limits.totalSizeLimit}`);
      }
      if (limits.supportedMimeTypes !== undefined) {
        if (limits.supportedMimeTypes.length > 0) {
          lines.push(`      supportedMimeTypes:`);
          limits.supportedMimeTypes.forEach((type: string) => {
            lines.push(`        - "${type}"`);
          });
        } else {
          lines.push(`      supportedMimeTypes: []`);
        }
      }
    });
  }
  
  if (serverFileSizeLimit !== undefined) {
    lines.push(`  serverFileSizeLimit: ${serverFileSizeLimit}`);
  }
  if (avatarSizeLimit !== undefined) {
    lines.push(`  avatarSizeLimit: ${avatarSizeLimit}`);
  }
  
  if (clientImageResizeEnabled !== undefined || clientImageResizeMaxWidth !== undefined || clientImageResizeMaxHeight !== undefined || clientImageResizeQuality !== undefined || clientImageResizeCompressFormat) {
    lines.push(`  clientImageResize:`);
    if (clientImageResizeEnabled !== undefined) {
      lines.push(`    enabled: ${clientImageResizeEnabled}`);
    }
    if (clientImageResizeMaxWidth !== undefined) {
      lines.push(`    maxWidth: ${clientImageResizeMaxWidth}`);
    }
    if (clientImageResizeMaxHeight !== undefined) {
      lines.push(`    maxHeight: ${clientImageResizeMaxHeight}`);
    }
    if (clientImageResizeQuality !== undefined) {
      lines.push(`    quality: ${clientImageResizeQuality}`);
    }
    if (clientImageResizeCompressFormat) {
      lines.push(`    compressFormat: "${clientImageResizeCompressFormat}"`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Rate Limits section
 */
function generateRateLimitsSection(config: any): string {
  if (!config.rateLimits) return '# Rate limits not configured';
  
  const lines = ['# Rate Limits', 'rateLimits:'];
  
  if (config.rateLimits.fileUploads) {
    lines.push('  fileUploads:');
    if (config.rateLimits.fileUploads.ipMax !== undefined) {
      lines.push(`    ipMax: ${config.rateLimits.fileUploads.ipMax}`);
    }
    if (config.rateLimits.fileUploads.ipWindowInMinutes !== undefined) {
      lines.push(`    ipWindowInMinutes: ${config.rateLimits.fileUploads.ipWindowInMinutes}`);
    }
    if (config.rateLimits.fileUploads.userMax !== undefined) {
      lines.push(`    userMax: ${config.rateLimits.fileUploads.userMax}`);
    }
    if (config.rateLimits.fileUploads.userWindowInMinutes !== undefined) {
      lines.push(`    userWindowInMinutes: ${config.rateLimits.fileUploads.userWindowInMinutes}`);
    }
  }
  
  if (config.rateLimits.conversationsImport) {
    lines.push('  conversationsImport:');
    if (config.rateLimits.conversationsImport.ipMax !== undefined) {
      lines.push(`    ipMax: ${config.rateLimits.conversationsImport.ipMax}`);
    }
    if (config.rateLimits.conversationsImport.ipWindowInMinutes !== undefined) {
      lines.push(`    ipWindowInMinutes: ${config.rateLimits.conversationsImport.ipWindowInMinutes}`);
    }
    if (config.rateLimits.conversationsImport.userMax !== undefined) {
      lines.push(`    userMax: ${config.rateLimits.conversationsImport.userMax}`);
    }
    if (config.rateLimits.conversationsImport.userWindowInMinutes !== undefined) {
      lines.push(`    userWindowInMinutes: ${config.rateLimits.conversationsImport.userWindowInMinutes}`);
    }
  }
  
  if (config.rateLimits.stt) {
    lines.push('  stt:');
    if (config.rateLimits.stt.ipMax !== undefined) {
      lines.push(`    ipMax: ${config.rateLimits.stt.ipMax}`);
    }
    if (config.rateLimits.stt.ipWindowInMinutes !== undefined) {
      lines.push(`    ipWindowInMinutes: ${config.rateLimits.stt.ipWindowInMinutes}`);
    }
    if (config.rateLimits.stt.userMax !== undefined) {
      lines.push(`    userMax: ${config.rateLimits.stt.userMax}`);
    }
    if (config.rateLimits.stt.userWindowInMinutes !== undefined) {
      lines.push(`    userWindowInMinutes: ${config.rateLimits.stt.userWindowInMinutes}`);
    }
  }
  
  if (config.rateLimits.tts) {
    lines.push('  tts:');
    if (config.rateLimits.tts.ipMax !== undefined) {
      lines.push(`    ipMax: ${config.rateLimits.tts.ipMax}`);
    }
    if (config.rateLimits.tts.ipWindowInMinutes !== undefined) {
      lines.push(`    ipWindowInMinutes: ${config.rateLimits.tts.ipWindowInMinutes}`);
    }
    if (config.rateLimits.tts.userMax !== undefined) {
      lines.push(`    userMax: ${config.rateLimits.tts.userMax}`);
    }
    if (config.rateLimits.tts.userWindowInMinutes !== undefined) {
      lines.push(`    userWindowInMinutes: ${config.rateLimits.tts.userWindowInMinutes}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Memory section
 */
function generateMemorySection(config: any): string {
  // LIBRECHAT RC4 BUG: Memory configuration block causes YAML validation errors
  // LibreChat's strict YAML validator rejects incomplete memory configurations,
  // which prevents the entire configuration file from loading.
  // 
  // WORKAROUND: Memory configuration is disabled in YAML exports to prevent validation errors.
  // This allows core UI customizations (footer, welcome, terms) to load successfully.
  //
  // IMPACT:
  // ✅ YAML configuration loads without errors
  // ✅ Interface customizations work properly  
  // ❌ Memory-based conversation context disabled
  // ❌ Adaptive memory management unavailable
  // ❌ Entity extraction and semantic search disabled
  //
  // This is a temporary trade-off until LibreChat fixes the memory validator strictness.
  
  return '# Memory Configuration: Disabled due to LibreChat RC4 YAML validation issues\n# Incomplete memory blocks cause the entire YAML file to be rejected.\n# This feature is disabled to ensure core configuration loads successfully.';
}

/**
 * Generate Web Search section
 * 
 * DUAL-PLACEMENT POLICY: API keys (serperApiKey, jinaApiKey, cohereApiKey, firecrawlApiKey) 
 * are NOT included in YAML - they're exported to .env for security.
 * Only non-sensitive configuration fields appear in YAML.
 */
function generateWebSearchSection(config: any): string {
  const searchProvider = config.webSearch?.searchProvider ?? config.webSearchProvider;
  if (!searchProvider || searchProvider === 'none') {
    return '# Web search is not configured';
  }
  
  const lines = [
    '# Web Search Configuration',
    '# NOTE: API keys (SERPER_API_KEY, JINA_API_KEY, COHERE_API_KEY, FIRECRAWL_API_KEY)',
    '# are stored in .env for security. Only non-sensitive settings appear here.',
    'webSearch:'
  ];
  lines.push(`  searchProvider: "${searchProvider}"`);
  
  const searxngInstanceUrl = config.webSearch?.searxngInstanceUrl ?? config.webSearchSearxngInstanceUrl;
  const scraperType = config.webSearch?.scraperType ?? config.webSearchScraperType;
  const scraperTimeout = config.webSearch?.scraperTimeout ?? config.webSearchScraperTimeout;
  const safeSearch = config.webSearch?.safeSearch ?? config.webSearchSafeSearch;
  const rerankerType = config.webSearch?.rerankerType ?? config.webSearchRerankerType;
  const jinaApiUrl = config.webSearch?.jinaApiUrl ?? config.webSearchJinaApiUrl;
  const firecrawlApiUrl = config.webSearch?.firecrawlApiUrl ?? config.webSearchFirecrawlApiUrl;
  
  // ✅ NON-SENSITIVE: URLs and configuration settings (not secrets)
  if (searxngInstanceUrl && searchProvider === 'searxng') {
    lines.push(`  searxngInstanceUrl: "${searxngInstanceUrl}"`);
  }
  if (scraperType && scraperType !== 'none') {
    lines.push(`  scraperType: "${scraperType}"`);
  }
  if (scraperTimeout !== undefined && scraperTimeout !== 30000) {
    lines.push(`  scraperTimeout: ${scraperTimeout}`);
  }
  if (safeSearch !== undefined && safeSearch !== 0) {
    lines.push(`  safeSearch: ${safeSearch}`);
  }
  if (rerankerType && rerankerType !== 'none') {
    lines.push(`  rerankerType: "${rerankerType}"`);
  }
  if (jinaApiUrl && jinaApiUrl !== 'https://r.jina.ai') {
    lines.push(`  jinaApiUrl: "${jinaApiUrl}"`);
  }
  if (firecrawlApiUrl && scraperType === 'firecrawl' && firecrawlApiUrl !== 'https://api.firecrawl.dev') {
    lines.push(`  firecrawlApiUrl: "${firecrawlApiUrl}"`);
  }
    
  // Firecrawl options (configuration, not secrets)
  if (scraperType === 'firecrawl') {
    const formats = config.webSearch?.firecrawlOptions?.formats ?? config.webSearchFirecrawlOptionsFormats;
    const includeTags = config.webSearch?.firecrawlOptions?.includeTags ?? config.webSearchFirecrawlOptionsIncludeTags;
    const excludeTags = config.webSearch?.firecrawlOptions?.excludeTags ?? config.webSearchFirecrawlOptionsExcludeTags;
    const headers = config.webSearch?.firecrawlOptions?.headers ?? config.webSearchFirecrawlOptionsHeaders;
    const onlyMainContent = config.webSearch?.firecrawlOptions?.onlyMainContent ?? config.webSearchFirecrawlOptionsOnlyMainContent;
    const timeout = config.webSearch?.firecrawlOptions?.timeout ?? config.webSearchFirecrawlOptionsTimeout;
    const waitFor = config.webSearch?.firecrawlOptions?.waitFor ?? config.webSearchFirecrawlOptionsWaitFor;
    const blockAds = config.webSearch?.firecrawlOptions?.blockAds ?? config.webSearchFirecrawlOptionsBlockAds;
    const removeBase64Images = config.webSearch?.firecrawlOptions?.removeBase64Images ?? config.webSearchFirecrawlOptionsRemoveBase64Images;
    const parsePDF = config.webSearch?.firecrawlOptions?.parsePDF ?? config.webSearchFirecrawlOptionsParsePDF;
    const mobile = config.webSearch?.firecrawlOptions?.mobile ?? config.webSearchFirecrawlOptionsMobile;
    const maxAge = config.webSearch?.firecrawlOptions?.maxAge ?? config.webSearchFirecrawlOptionsMaxAge;
    const proxy = config.webSearch?.firecrawlOptions?.proxy ?? config.webSearchFirecrawlOptionsProxy;
    const skipTlsVerification = config.webSearch?.firecrawlOptions?.skipTlsVerification ?? config.webSearchFirecrawlOptionsSkipTlsVerification;
    const storeInCache = config.webSearch?.firecrawlOptions?.storeInCache ?? config.webSearchFirecrawlOptionsStoreInCache;
    const zeroDataRetention = config.webSearch?.firecrawlOptions?.zeroDataRetention ?? config.webSearchFirecrawlOptionsZeroDataRetention;
    const location = config.webSearch?.firecrawlOptions?.location ?? config.webSearchFirecrawlOptionsLocation;
    const changeTrackingOptions = config.webSearch?.firecrawlOptions?.changeTrackingOptions ?? config.webSearchFirecrawlOptionsChangeTrackingOptions;
    
    if (formats || includeTags || excludeTags || headers || onlyMainContent !== undefined || timeout !== undefined || waitFor !== undefined || blockAds !== undefined || removeBase64Images !== undefined || parsePDF !== undefined || mobile !== undefined || maxAge !== undefined || proxy || skipTlsVerification !== undefined || storeInCache !== undefined || zeroDataRetention !== undefined || location || changeTrackingOptions) {
      lines.push(`  firecrawlOptions:`);
      if (formats) {
        lines.push(`    formats: [${formats?.map((f: string) => `"${f}"`).join(', ') || '"markdown", "links"'}]`);
      }
      if (includeTags && includeTags.length > 0) {
        lines.push(`    includeTags: [${includeTags.map((tag: string) => `"${tag}"`).join(', ')}]`);
      }
      if (excludeTags && excludeTags.length > 0) {
        lines.push(`    excludeTags: [${excludeTags.map((tag: string) => `"${tag}"`).join(', ')}]`);
      }
      if (headers && Object.keys(headers).length > 0) {
        lines.push(`    headers:`);
        Object.entries(headers).forEach(([key, value]) => {
          lines.push(`      ${key}: "${value}"`);
        });
      }
      if (onlyMainContent !== undefined) {
        lines.push(`    onlyMainContent: ${onlyMainContent ?? true}`);
      }
      if (timeout !== undefined) {
        lines.push(`    timeout: ${timeout ?? 20000}`);
      }
      if (waitFor !== undefined) {
        lines.push(`    waitFor: ${waitFor ?? 1000}`);
      }
      if (blockAds !== undefined) {
        lines.push(`    blockAds: ${blockAds ?? true}`);
      }
      if (removeBase64Images !== undefined) {
        lines.push(`    removeBase64Images: ${removeBase64Images ?? true}`);
      }
      if (parsePDF !== undefined) {
        lines.push(`    parsePDF: ${parsePDF ?? true}`);
      }
      if (mobile !== undefined) {
        lines.push(`    mobile: ${mobile ?? true}`);
      }
      if (maxAge !== undefined) {
        lines.push(`    maxAge: ${maxAge ?? 0}`);
      }
      if (proxy) {
        lines.push(`    proxy: "${proxy ?? 'auto'}"`);
      }
      if (skipTlsVerification !== undefined) {
        lines.push(`    skipTlsVerification: ${skipTlsVerification ?? false}`);
      }
      if (storeInCache !== undefined) {
        lines.push(`    storeInCache: ${storeInCache ?? true}`);
      }
      if (zeroDataRetention !== undefined) {
        lines.push(`    zeroDataRetention: ${zeroDataRetention ?? false}`);
      }
      if (location) {
        lines.push(`    location:`);
        if (location.country) {
          lines.push(`      country: "${location.country}"`);
        }
        if (location.languages && location.languages.length > 0) {
          lines.push(`      languages: [${location.languages.map((lang: string) => `"${lang}"`).join(', ')}]`);
        }
      }
      if (changeTrackingOptions) {
        lines.push(`    changeTrackingOptions:`);
        if (changeTrackingOptions.enabled !== undefined) {
          lines.push(`      enabled: ${changeTrackingOptions.enabled}`);
        }
        if (changeTrackingOptions.threshold !== undefined) {
          lines.push(`      threshold: ${changeTrackingOptions.threshold}`);
        }
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate OCR section
 */
function generateOcrSection(config: any): string {
  const ocrProvider = config.ocr?.strategy ?? config.ocrProvider ?? config.ocrStrategy;
  const ocrApiKey = config.ocr?.apiKey ?? config.ocrApiKey;
  const ocrBaseUrl = config.ocr?.baseURL ?? config.ocrApiBase;
  const ocrMistralModel = config.ocr?.mistralModel ?? config.ocrMistralModel;
  
  if (!ocrProvider) return '# OCR is not configured';
  
  const lines = ['# OCR Configuration', 'ocr:'];
  lines.push(`  strategy: "${ocrProvider === 'mistral' ? 'mistral_ocr' : ocrProvider === 'custom' ? 'custom_ocr' : 'mistral_ocr'}"`);
  if (ocrProvider === 'mistral' || ocrMistralModel) {
    lines.push(`  mistralModel: "${ocrMistralModel || 'mistral-ocr-latest'}"`);
  }
  // ❌ SECURITY: OCR_API_KEY excluded from YAML - stored in .env instead
  if (ocrBaseUrl) {
    lines.push(`  baseURL: "${ocrBaseUrl}"`);
  }
  
  return lines.join('\n');
}

/**
 * Generate unified Speech section in LibreChat-compatible format
 * Merges STT, TTS, and UI speech configuration under a single speech: section
 * with provider-specific nesting (speech.stt.openai.*, speech.tts.openai.*)
 */
function generateSpeechSection(config: any): string {
  // LIBRECHAT RC4 BUG: Speech configuration block causes YAML validation errors
  // LibreChat's strict YAML validator rejects incomplete speech configurations,
  // which prevents the entire configuration file from loading.
  // 
  // WORKAROUND: Speech configuration is disabled in YAML exports to prevent validation errors.
  // This allows core UI customizations (footer, welcome, terms) to load successfully.
  //
  // IMPACT:
  // ✅ YAML configuration loads without errors
  // ✅ Interface customizations work properly  
  // ❌ Speech-to-Text (STT) functionality disabled
  // ❌ Text-to-Speech (TTS) functionality disabled
  // ❌ Voice interaction capabilities unavailable
  // ❌ Speech tab UI elements and controls disabled
  // ❌ Provider selection for speech services unavailable
  //
  // This is a temporary trade-off until LibreChat fixes the speech validator strictness.
  
  return '# Speech Configuration: Disabled due to LibreChat RC4 YAML validation issues\n# Incomplete speech blocks (STT/TTS) cause the entire YAML file to be rejected.\n# This feature is disabled to ensure core configuration loads successfully.';
}

/**
 * Generate Actions section
 */
function generateActionsSection(config: any): string {
  const allowedDomains = config.actions?.allowedDomains ?? config.actionsAllowedDomains;
  const hasActions = config.e2bProxyEnabled || (allowedDomains && allowedDomains.length > 0);
  if (!hasActions) return '# Actions are not configured';
  
  const lines = ['# Actions Configuration', 'actions:'];
  
  if (allowedDomains && allowedDomains.length > 0) {
    lines.push('  allowedDomains:');
    allowedDomains.forEach((domain: string) => {
      lines.push(`    - "${domain}"`);
    });
  }
  
  if (config.e2bProxyEnabled) {
    lines.push('  e2b_code_execution:');
    lines.push('    openAPISpec: ./e2b-code-execution-openapi.yaml');
    lines.push('    authentication:');
    lines.push('      type: none');
    lines.push('    availableTools:');
    lines.push('      - e2b_execute_code');
  }
  
  return lines.join('\n');
}
