import { z } from "zod";

/**
 * Centralized Field Registry
 * 
 * SINGLE SOURCE OF TRUTH for all configuration fields.
 * Adding a new field requires only updating this registry - everything else is auto-generated.
 */

// Field types supported by the registry
export type FieldType = 
  | 'string' 
  | 'boolean' 
  | 'number' 
  | 'array' 
  | 'object'
  | 'enum'
  | 'url'
  | 'email';

// Field descriptor - defines all metadata for a configuration field
export interface FieldDescriptor {
  // Unique identifier (camelCase config field name)
  id: string;
  
  // Environment variable name (SCREAMING_SNAKE_CASE)
  envKey?: string;
  
  // YAML path (dot-notation for nested fields, e.g., "endpoints.openAI.titleModel")
  yamlPath?: string;
  
  // Field type
  type: FieldType;
  
  // Default value
  defaultValue: any;
  
  // Category for UI organization
  category: string;
  
  // Zod schema for validation (optional, for complex types)
  zodSchema?: z.ZodTypeAny;
  
  // For enum types
  enumValues?: readonly string[];
  
  // For array types
  arrayItemType?: FieldType;
  arrayItemSchema?: z.ZodTypeAny;
  
  // For number types
  min?: number;
  max?: number;
  
  // Description/documentation
  description?: string;
  
  // Whether this field should be exported to .env (some YAML-only fields shouldn't)
  exportToEnv?: boolean;
  
  // Whether this field should be exported to YAML (some .env-only fields shouldn't)
  exportToYaml?: boolean;
  
  // Custom transformer for env string -> typed value
  envTransformer?: (value: string) => any;
  
  // Custom transformer for YAML value -> config value
  yamlTransformer?: (value: any) => any;
  
  // For nested object fields - child fields
  children?: FieldDescriptor[];
}

/**
 * Field Registry - All configuration fields defined here
 * 
 * When adding a new field:
 * 1. Add it to this registry with complete metadata
 * 2. That's it! Import/export/validation/schema generation all happen automatically
 */
export const FIELD_REGISTRY: FieldDescriptor[] = [
  // =============================================================================
  // App Configuration
  // =============================================================================
  {
    id: 'version',
    yamlPath: 'version',
    type: 'string',
    defaultValue: '0.8.0-rc4',
    category: 'app',
    description: 'LibreChat version',
    exportToEnv: false,
    exportToYaml: true,
  },
  {
    id: 'cache',
    yamlPath: 'cache',
    type: 'boolean',
    defaultValue: true,
    category: 'app',
    description: 'Enable caching',
    exportToEnv: false,
    exportToYaml: true,
  },
  {
    id: 'appTitle',
    envKey: 'APP_TITLE',
    type: 'string',
    defaultValue: 'LibreChat',
    category: 'app',
    description: 'Application title',
  },
  {
    id: 'customWelcome',
    envKey: 'CUSTOM_WELCOME',
    yamlPath: 'interface.customWelcome',
    type: 'string',
    defaultValue: '',
    category: 'app',
    description: 'Custom welcome message',
  },
  {
    id: 'customFooter',
    envKey: 'CUSTOM_FOOTER',
    yamlPath: 'interface.customFooter',
    type: 'string',
    defaultValue: '',
    category: 'app',
    description: 'Custom footer text',
  },
  {
    id: 'helpAndFAQURL',
    envKey: 'HELP_AND_FAQ_URL',
    type: 'url',
    defaultValue: '',
    category: 'app',
    description: 'Help and FAQ URL',
  },
  
  // =============================================================================
  // Server Configuration
  // =============================================================================
  {
    id: 'host',
    envKey: 'HOST',
    type: 'string',
    defaultValue: '0.0.0.0',
    category: 'server',
    description: 'Server host',
  },
  {
    id: 'port',
    envKey: 'PORT',
    type: 'number',
    defaultValue: 3080,
    category: 'server',
    description: 'Server port',
    min: 1,
    max: 65535,
  },
  {
    id: 'nodeEnv',
    envKey: 'NODE_ENV',
    type: 'enum',
    enumValues: ['development', 'production', 'test'] as const,
    defaultValue: 'production',
    category: 'server',
    description: 'Node environment',
  },
  {
    id: 'domainClient',
    envKey: 'DOMAIN_CLIENT',
    type: 'string',
    defaultValue: '',
    category: 'server',
    description: 'Client domain',
  },
  {
    id: 'domainServer',
    envKey: 'DOMAIN_SERVER',
    type: 'string',
    defaultValue: '',
    category: 'server',
    description: 'Server domain',
  },
  {
    id: 'noIndex',
    envKey: 'NO_INDEX',
    type: 'boolean',
    defaultValue: false,
    category: 'server',
    description: 'Disable search engine indexing',
    envTransformer: (val) => val === 'true',
  },
  
  // =============================================================================
  // Core AI API Keys
  // =============================================================================
  {
    id: 'openaiApiKey',
    envKey: 'OPENAI_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'OpenAI API Key',
  },
  {
    id: 'openaiApiBase',
    envKey: 'OPENAI_API_BASE',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'OpenAI API Base URL',
  },
  {
    id: 'openaiReverseProxy',
    envKey: 'OPENAI_REVERSE_PROXY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'OpenAI Reverse Proxy URL (deprecated, use custom endpoints)',
  },
  {
    id: 'openaiModerationReverseProxy',
    envKey: 'OPENAI_MODERATION_REVERSE_PROXY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'OpenAI Moderation Reverse Proxy URL',
  },
  {
    id: 'anthropicApiKey',
    envKey: 'ANTHROPIC_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Anthropic API Key',
  },
  {
    id: 'googleApiKey',
    envKey: 'GOOGLE_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Google AI API Key',
  },
  {
    id: 'groqApiKey',
    envKey: 'GROQ_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Groq API Key',
  },
  {
    id: 'mistralApiKey',
    envKey: 'MISTRAL_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Mistral AI API Key',
  },
  
  // Additional AI providers will be added in next iteration...
];

/**
 * Helper: Get all fields that have ENV keys
 */
export function getEnvFields(): FieldDescriptor[] {
  return FIELD_REGISTRY.filter(f => f.envKey && f.exportToEnv !== false);
}

/**
 * Helper: Get all fields that have YAML paths
 */
export function getYamlFields(): FieldDescriptor[] {
  return FIELD_REGISTRY.filter(f => f.yamlPath && f.exportToYaml !== false);
}

/**
 * Helper: Get field by ID
 */
export function getFieldById(id: string): FieldDescriptor | undefined {
  return FIELD_REGISTRY.find(f => f.id === id);
}

/**
 * Helper: Get field by ENV key
 */
export function getFieldByEnvKey(envKey: string): FieldDescriptor | undefined {
  return FIELD_REGISTRY.find(f => f.envKey === envKey);
}

/**
 * Helper: Get field by YAML path
 */
export function getFieldByYamlPath(yamlPath: string): FieldDescriptor | undefined {
  return FIELD_REGISTRY.find(f => f.yamlPath === yamlPath);
}

/**
 * Helper: Get all ENV keys (for validation)
 */
export function getAllEnvKeys(): Set<string> {
  return new Set(getEnvFields().map(f => f.envKey!));
}

/**
 * Helper: Get all YAML paths (for validation)
 */
export function getAllYamlPaths(): Set<string> {
  return new Set(getYamlFields().map(f => f.yamlPath!));
}

/**
 * Helper: Generate default configuration object
 */
export function generateDefaults(): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  for (const field of FIELD_REGISTRY) {
    defaults[field.id] = field.defaultValue;
  }
  
  return defaults;
}
