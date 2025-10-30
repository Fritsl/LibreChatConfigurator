import { FIELD_REGISTRY, FieldDescriptor, getFieldByEnvKey, getFieldByYamlPath, getAllEnvKeys, getAllYamlPaths, getYamlFields } from './field-registry';

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
 */
export function generateEnvFile(config: Record<string, any>): string {
  const currentDate = new Date().toISOString().split('T')[0];
  const configName = config.configurationName || 'default';
  const cachedSecrets = getCachedSecrets(configName);
  
  const lines: string[] = [
    '# =============================================================================',
    '# LibreChat Environment Configuration (RC4)',
    `# Generated on ${currentDate}`,
    '# ============================================================================='
  ];
  
  // Group fields by category for organized output
  const byCategory = new Map<string, FieldDescriptor[]>();
  for (const field of FIELD_REGISTRY) {
    if (!field.envKey || field.exportToEnv === false) continue;
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
  
  // Special handling for security fields with cached secrets
  const securityFields: Record<string, keyof CachedSecrets> = {
    'JWT_SECRET': 'jwtSecret',
    'JWT_REFRESH_SECRET': 'jwtRefreshSecret',
    'CREDS_KEY': 'credsKey',
    'CREDS_IV': 'credsIV'
  };
  
  if (field.envKey && securityFields[field.envKey]) {
    if (value) {
      return `${field.envKey}=${value}`;
    } else {
      const cachedValue = cachedSecrets[securityFields[field.envKey]];
      return `# ${field.envKey}=${cachedValue} (auto-generated - configure in Security settings to export)`;
    }
  }
  
  // Format the value for ENV
  const envValue = formatEnvValue(value, field);
  
  // If value exists, output uncommented
  if (envValue !== '') {
    return `${field.envKey}=${envValue}`;
  }
  
  // If no value, output commented with default
  const defaultComment = getDefaultComment(field);
  return `# ${field.envKey}=${defaultComment}`;
}

/**
 * Get configuration value, handling nested structures
 */
function getConfigValue(config: Record<string, any>, field: FieldDescriptor): any {
  // First try direct field access
  if (config[field.id] !== undefined) {
    return config[field.id];
  }
  
  // Try nested access for fields with yamlPath (e.g., interface.customWelcome)
  if (field.yamlPath) {
    const value = getNestedValue(config, field.yamlPath);
    if (value !== undefined) {
      return value;
    }
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
      return String(field.defaultValue);
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
      return String(value);
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
 * Generate YAML file content from configuration using registry-based approach
 * This replaces the manual template literal implementation with a structured approach
 */
export function generateYamlFile(config: Record<string, any>): string {
  const lines: string[] = [
    '# =============================================================================',
    '# LibreChat Configuration for v0.8.0-RC4',
    '# =============================================================================',
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
 */
function generateEndpointsSection(config: any): string {
  const hasAgents = config.endpoints?.agents;
  const hasOpenAI = config.enabledEndpoints?.includes('openAI') && config.openaiApiKey && (config.endpoints?.openAI?.titleConvo !== undefined || config.endpoints?.openAI?.titleModel);
  const hasAnthropic = config.enabledEndpoints?.includes('anthropic') && config.anthropicApiKey;
  const hasGoogle = config.enabledEndpoints?.includes('google') && config.googleApiKey;
  const hasCustom = config.endpoints?.custom && config.endpoints.custom.length > 0;
  const hasGroqOrMistral = config.groqApiKey || config.mistralApiKey;
  
  if (!hasAgents && !hasOpenAI && !hasAnthropic && !hasGoogle && !hasCustom && !hasGroqOrMistral) return '';
  
  const lines = ['# Endpoints Configuration', 'endpoints:'];
  
  // Agents endpoint
  if (config.endpoints?.agents) {
    lines.push('  agents:');
    if (config.endpoints.agents.disableBuilder !== undefined) {
      lines.push(`    disableBuilder: ${config.endpoints.agents.disableBuilder}`);
    }
    if (config.endpoints.agents.recursionLimit !== undefined) {
      lines.push(`    recursionLimit: ${config.endpoints.agents.recursionLimit}`);
    }
    if (config.endpoints.agents.maxRecursionLimit !== undefined) {
      lines.push(`    maxRecursionLimit: ${config.endpoints.agents.maxRecursionLimit}`);
    }
    if (config.endpoints.agents.capabilities) {
      lines.push(`    capabilities:`);
      const caps = Array.isArray(config.endpoints.agents.capabilities) 
        ? config.endpoints.agents.capabilities 
        : Object.keys(config.endpoints.agents.capabilities).filter((k: string) => config.endpoints.agents.capabilities[k]);
      caps.forEach((cap: string) => lines.push(`      - ${cap}`));
    }
    if (config.endpoints.agents.maxCitations !== undefined) {
      lines.push(`    maxCitations: ${config.endpoints.agents.maxCitations}`);
    }
    if (config.endpoints.agents.maxCitationsPerFile !== undefined) {
      lines.push(`    maxCitationsPerFile: ${config.endpoints.agents.maxCitationsPerFile}`);
    }
    if (config.endpoints.agents.minRelevanceScore !== undefined) {
      lines.push(`    minRelevanceScore: ${config.endpoints.agents.minRelevanceScore}`);
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
      if (endpoint.apiKey) {
        lines.push(`      apiKey: '${escapeYamlString(endpoint.apiKey)}'`);
      }
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
      lines.push(`      apiKey: '\${GROQ_API_KEY}'`);
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
      lines.push(`      apiKey: '\${MISTRAL_API_KEY}'`);
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
  const hasTopLevelInterfaceFields = config.customWelcome || config.customFooter;
  
  if (!hasInterfaceValues && !hasTemporaryChatRetention && !hasTopLevelInterfaceFields) return '';
  
  const lines = ['# Interface Configuration', 'interface:'];
  
  if (config.interface?.agents !== undefined) {
    lines.push(`  agents: ${config.interface.agents}`);
  }
  if (config.interface?.modelSelect !== undefined) {
    lines.push(`  modelSelect: ${config.interface.modelSelect}`);
  }
  if (config.interface?.parameters !== undefined) {
    lines.push(`  parameters: ${config.interface.parameters}`);
  }
  if (config.interface?.sidePanel !== undefined) {
    lines.push(`  sidePanel: ${config.interface.sidePanel}`);
  }
  if (config.interface?.presets !== undefined) {
    lines.push(`  presets: ${config.interface.presets}`);
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
  if (config.interface?.customFooter || config.customFooter) {
    lines.push(`  customFooter: "${escapeYamlDoubleQuoted(config.interface?.customFooter || config.customFooter)}"`);
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
  if (!config.fileConfig) return '';
  
  const lines = ['# File Configuration', 'fileConfig:'];
  
  if (config.fileConfig.endpoints && Object.keys(config.fileConfig.endpoints).length > 0) {
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
  
  if (config.fileConfig.serverFileSizeLimit !== undefined) {
    lines.push(`  serverFileSizeLimit: ${config.fileConfig.serverFileSizeLimit}`);
  }
  if (config.fileConfig.avatarSizeLimit !== undefined) {
    lines.push(`  avatarSizeLimit: ${config.fileConfig.avatarSizeLimit}`);
  }
  if (config.fileConfig.clientImageResize) {
    lines.push(`  clientImageResize:`);
    if (config.fileConfig.clientImageResize.enabled !== undefined) {
      lines.push(`    enabled: ${config.fileConfig.clientImageResize.enabled}`);
    }
    if (config.fileConfig.clientImageResize.maxWidth !== undefined) {
      lines.push(`    maxWidth: ${config.fileConfig.clientImageResize.maxWidth}`);
    }
    if (config.fileConfig.clientImageResize.maxHeight !== undefined) {
      lines.push(`    maxHeight: ${config.fileConfig.clientImageResize.maxHeight}`);
    }
    if (config.fileConfig.clientImageResize.quality !== undefined) {
      lines.push(`    quality: ${config.fileConfig.clientImageResize.quality}`);
    }
    if (config.fileConfig.clientImageResize.compressFormat) {
      lines.push(`    compressFormat: "${config.fileConfig.clientImageResize.compressFormat}"`);
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
  const hasMemoryConfig = config.memory && (
    (config.memory.disabled !== undefined && config.memory.disabled !== true) ||
    (config.memory.enabled !== undefined && config.memory.enabled !== false) ||
    (config.memory.personalize !== undefined && config.memory.personalize !== false) || 
    (config.memory.personalization !== undefined && config.memory.personalization !== true) ||
    (config.memory.windowSize !== undefined && config.memory.windowSize !== 5) ||
    (config.memory.messageWindowSize !== undefined && config.memory.messageWindowSize !== 5) ||
    (config.memory.validKeys && config.memory.validKeys.length > 0) || 
    (config.memory.tokenLimit !== undefined && config.memory.tokenLimit !== 1000) || 
    config.memory.agent
  );
  
  if (!hasMemoryConfig) return '';
  
  const lines = ['# Memory Configuration', 'memory:'];
  
  if (config.memory.disabled !== undefined && config.memory.disabled !== true) {
    lines.push(`  disabled: ${config.memory.disabled}`);
  }
  if (config.memory.enabled !== undefined && config.memory.disabled === undefined && config.memory.enabled !== false) {
    lines.push(`  enabled: ${config.memory.enabled}`);
  }
  if (config.memory.personalize !== undefined && config.memory.personalize !== false) {
    lines.push(`  personalize: ${config.memory.personalize}`);
  }
  if (config.memory.personalization !== undefined && config.memory.personalize === undefined && config.memory.personalization !== true) {
    lines.push(`  personalization: ${config.memory.personalization}`);
  }
  if (config.memory.validKeys && config.memory.validKeys.length > 0) {
    lines.push(`  validKeys:`);
    config.memory.validKeys.forEach((key: string) => {
      lines.push(`    - "${key}"`);
    });
  }
  if (config.memory.tokenLimit !== undefined && config.memory.tokenLimit !== 1000) {
    lines.push(`  tokenLimit: ${config.memory.tokenLimit}`);
  }
  if (config.memory.windowSize !== undefined && config.memory.windowSize !== 5) {
    lines.push(`  windowSize: ${config.memory.windowSize}`);
  }
  if (config.memory.messageWindowSize !== undefined && config.memory.windowSize === undefined && config.memory.messageWindowSize !== 5) {
    lines.push(`  messageWindowSize: ${config.memory.messageWindowSize}`);
  }
  
  if (config.memory.agent) {
    lines.push(`  agent:`);
    if (config.memory.agent.id) {
      lines.push(`    id: "${config.memory.agent.id}"`);
    }
    if (config.memory.agent.provider) {
      lines.push(`    provider: "${config.memory.agent.provider}"`);
    }
    if (config.memory.agent.model) {
      lines.push(`    model: "${config.memory.agent.model}"`);
    }
    if (config.memory.agent.instructions) {
      lines.push(`    instructions: |`);
      config.memory.agent.instructions.split('\n').forEach((line: string) => {
        lines.push(`      ${line}`);
      });
    }
    if (config.memory.agent.model_parameters) {
      lines.push(`    model_parameters:`);
      if (config.memory.agent.model_parameters.temperature !== undefined) {
        lines.push(`      temperature: ${config.memory.agent.model_parameters.temperature}`);
      }
      if (config.memory.agent.model_parameters.max_tokens) {
        lines.push(`      max_tokens: ${config.memory.agent.model_parameters.max_tokens}`);
      }
      if (config.memory.agent.model_parameters.top_p !== undefined) {
        lines.push(`      top_p: ${config.memory.agent.model_parameters.top_p}`);
      }
      if (config.memory.agent.model_parameters.frequency_penalty !== undefined) {
        lines.push(`      frequency_penalty: ${config.memory.agent.model_parameters.frequency_penalty}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Web Search section
 */
function generateWebSearchSection(config: any): string {
  if (!config.webSearch?.searchProvider || config.webSearch.searchProvider === 'none') {
    return '# Web search is not configured';
  }
  
  const lines = ['# Web Search Configuration', 'webSearch:'];
  lines.push(`  searchProvider: "${config.webSearch.searchProvider}"`);
  
  if (config.webSearch.serperApiKey || config.webSearch.searchProvider === 'serper') {
    lines.push(`  serperApiKey: "\${SERPER_API_KEY}"`);
  }
  if (config.webSearch.searxngInstanceUrl || config.webSearch.searchProvider === 'searxng') {
    lines.push(`  searxngInstanceUrl: "\${SEARXNG_INSTANCE_URL}"`);
  }
  if (config.webSearch.searchProvider === 'searxng') {
    lines.push(`  searxngApiKey: "${config.webSearch.searxngApiKey || ''}"`);
  }
  if (config.webSearch.scraperType && config.webSearch.scraperType !== 'none') {
    lines.push(`  scraperType: "${config.webSearch.scraperType}"`);
  }
  if (config.webSearch.firecrawlApiKey && config.webSearch.scraperType === 'firecrawl') {
    lines.push(`  firecrawlApiKey: "\${FIRECRAWL_API_KEY}"`);
    lines.push(`  firecrawlApiUrl: "${config.webSearch.firecrawlApiUrl || 'https://api.firecrawl.dev'}"`);
    if (config.webSearch.firecrawlOptions) {
      lines.push(`  firecrawlOptions:`);
      lines.push(`    formats: [${config.webSearch.firecrawlOptions.formats?.map((f: string) => `"${f}"`).join(', ') || '"markdown", "links"'}]`);
      lines.push(`    onlyMainContent: ${config.webSearch.firecrawlOptions.onlyMainContent ?? true}`);
      lines.push(`    timeout: ${config.webSearch.firecrawlOptions.timeout ?? 20000}`);
      lines.push(`    waitFor: ${config.webSearch.firecrawlOptions.waitFor ?? 1000}`);
      lines.push(`    blockAds: ${config.webSearch.firecrawlOptions.blockAds ?? true}`);
      lines.push(`    removeBase64Images: ${config.webSearch.firecrawlOptions.removeBase64Images ?? true}`);
      lines.push(`    mobile: ${config.webSearch.firecrawlOptions.mobile ?? true}`);
      lines.push(`    maxAge: ${config.webSearch.firecrawlOptions.maxAge ?? 0}`);
      lines.push(`    proxy: "${config.webSearch.firecrawlOptions.proxy ?? 'auto'}"`);
    }
  }
  if (config.webSearch.rerankerType && config.webSearch.rerankerType !== 'none') {
    lines.push(`  rerankerType: "${config.webSearch.rerankerType}"`);
  }
  if (config.webSearch.jinaApiKey && config.webSearch.rerankerType === 'jina') {
    lines.push(`  jinaApiKey: "\${JINA_API_KEY}"`);
    lines.push(`  jinaApiUrl: "${config.webSearch.jinaApiUrl || 'https://api.jina.ai/v1/rerank'}"`);
  }
  if (config.webSearch.cohereApiKey && config.webSearch.rerankerType === 'cohere') {
    lines.push(`  cohereApiKey: "\${COHERE_API_KEY}"`);
  }
  if (config.webSearch.scraperTimeout) {
    lines.push(`  scraperTimeout: ${config.webSearch.scraperTimeout}`);
  }
  if (config.webSearch.safeSearch !== undefined) {
    lines.push(`  safeSearch: ${config.webSearch.safeSearch ? 1 : 0}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate OCR section
 */
function generateOcrSection(config: any): string {
  if (!config.ocrProvider) return '# OCR is not configured';
  
  const lines = ['# OCR Configuration', 'ocr:'];
  lines.push(`  strategy: "${config.ocrProvider === 'mistral' ? 'mistral_ocr' : config.ocrProvider === 'custom' ? 'custom_ocr' : 'mistral_ocr'}"`);
  if (config.ocrProvider === 'mistral') {
    lines.push(`  mistralModel: "mistral-ocr-latest"`);
  }
  lines.push(`  apiKey: "\${OCR_API_KEY}"`);
  lines.push(`  baseURL: "\${OCR_BASEURL}"`);
  
  return lines.join('\n');
}

/**
 * Generate unified Speech section in LibreChat-compatible format
 * Merges STT, TTS, and UI speech configuration under a single speech: section
 * with provider-specific nesting (speech.stt.openai.*, speech.tts.openai.*)
 */
function generateSpeechSection(config: any): string {
  const hasStt = config.stt && config.stt.provider;
  const hasTts = config.tts && config.tts.provider;
  const hasSpeechTab = config.speech?.speechTab;
  
  if (!hasStt && !hasTts && !hasSpeechTab) {
    return '# Speech configuration is not configured';
  }
  
  const lines = ['# Speech Configuration (STT, TTS, and UI)', 'speech:'];
  
  // Generate STT section nested under provider
  if (hasStt) {
    const provider = config.stt.provider || 'openai';
    lines.push('  stt:');
    lines.push(`    ${provider}:`);
    
    // Note: LibreChat uses 'url' instead of 'baseURL'
    if (config.stt.baseURL) {
      lines.push(`      url: "${config.stt.baseURL}"`);
    }
    if (config.stt.apiKey) {
      lines.push(`      apiKey: "\${STT_API_KEY}"`);
    }
    if (config.stt.model) {
      lines.push(`      model: "${config.stt.model}"`);
    }
    if (config.stt.language) {
      lines.push(`      language: "${config.stt.language}"`);
    }
    if (config.stt.streaming !== undefined) {
      lines.push(`      streaming: ${config.stt.streaming}`);
    }
    if (config.stt.punctuation !== undefined) {
      lines.push(`      punctuation: ${config.stt.punctuation}`);
    }
    if (config.stt.profanityFilter !== undefined) {
      lines.push(`      profanityFilter: ${config.stt.profanityFilter}`);
    }
  }
  
  // Generate TTS section nested under provider
  if (hasTts) {
    const provider = config.tts.provider || 'openai';
    lines.push('  tts:');
    lines.push(`    ${provider}:`);
    
    // Note: LibreChat uses 'url' instead of 'baseURL'
    if (config.tts.baseURL) {
      lines.push(`      url: "${config.tts.baseURL}"`);
    }
    if (config.tts.apiKey) {
      lines.push(`      apiKey: "\${TTS_API_KEY}"`);
    }
    if (config.tts.model) {
      lines.push(`      model: "${config.tts.model}"`);
    }
    if (config.tts.voice) {
      lines.push(`      voice: "${config.tts.voice}"`);
    }
    if (config.tts.speed !== undefined) {
      lines.push(`      speed: ${config.tts.speed}`);
    }
    if (config.tts.quality) {
      lines.push(`      quality: "${config.tts.quality}"`);
    }
    if (config.tts.streaming !== undefined) {
      lines.push(`      streaming: ${config.tts.streaming}`);
    }
  }
  
  // Generate speechTab section (UI-level configuration)
  if (hasSpeechTab) {
    lines.push('  speechTab:');
    
    if (config.speech.speechTab.conversationMode !== undefined) {
      lines.push(`    conversationMode: ${config.speech.speechTab.conversationMode}`);
    }
    if (config.speech.speechTab.advancedMode !== undefined) {
      lines.push(`    advancedMode: ${config.speech.speechTab.advancedMode}`);
    }
    
    if (config.speech.speechTab.speechToText) {
      lines.push(`    speechToText:`);
      if (config.speech.speechTab.speechToText.engineSTT) {
        lines.push(`      engineSTT: "${config.speech.speechTab.speechToText.engineSTT}"`);
      }
      if (config.speech.speechTab.speechToText.languageSTT) {
        lines.push(`      languageSTT: "${config.speech.speechTab.speechToText.languageSTT}"`);
      }
      if (config.speech.speechTab.speechToText.autoTranscribeAudio !== undefined) {
        lines.push(`      autoTranscribeAudio: ${config.speech.speechTab.speechToText.autoTranscribeAudio}`);
      }
      if (config.speech.speechTab.speechToText.decibelValue !== undefined) {
        lines.push(`      decibelValue: ${config.speech.speechTab.speechToText.decibelValue}`);
      }
      if (config.speech.speechTab.speechToText.autoSendText !== undefined) {
        lines.push(`      autoSendText: ${config.speech.speechTab.speechToText.autoSendText}`);
      }
    }
    
    if (config.speech.speechTab.textToSpeech) {
      lines.push(`    textToSpeech:`);
      if (config.speech.speechTab.textToSpeech.engineTTS) {
        lines.push(`      engineTTS: "${config.speech.speechTab.textToSpeech.engineTTS}"`);
      }
      if (config.speech.speechTab.textToSpeech.voice) {
        lines.push(`      voice: "${config.speech.speechTab.textToSpeech.voice}"`);
      }
      if (config.speech.speechTab.textToSpeech.languageTTS) {
        lines.push(`      languageTTS: "${config.speech.speechTab.textToSpeech.languageTTS}"`);
      }
      if (config.speech.speechTab.textToSpeech.automaticPlayback !== undefined) {
        lines.push(`      automaticPlayback: ${config.speech.speechTab.textToSpeech.automaticPlayback}`);
      }
      if (config.speech.speechTab.textToSpeech.playbackRate !== undefined) {
        lines.push(`      playbackRate: ${config.speech.speechTab.textToSpeech.playbackRate}`);
      }
      if (config.speech.speechTab.textToSpeech.cacheTTS !== undefined) {
        lines.push(`      cacheTTS: ${config.speech.speechTab.textToSpeech.cacheTTS}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Actions section
 */
function generateActionsSection(config: any): string {
  const hasActions = config.e2bProxyEnabled || (config.actionsAllowedDomains && config.actionsAllowedDomains.length > 0);
  if (!hasActions) return '# Actions are not configured';
  
  const lines = ['# Actions Configuration', 'actions:'];
  
  if (config.actionsAllowedDomains && config.actionsAllowedDomains.length > 0) {
    lines.push('  allowedDomains:');
    config.actionsAllowedDomains.forEach((domain: string) => {
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
