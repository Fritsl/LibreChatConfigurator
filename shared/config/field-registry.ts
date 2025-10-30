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
  
  {
    id: 'deepseekApiKey',
    envKey: 'DEEPSEEK_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'DeepSeek API Key',
  },
  {
    id: 'perplexityApiKey',
    envKey: 'PERPLEXITY_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Perplexity API Key',
  },
  {
    id: 'fireworksApiKey',
    envKey: 'FIREWORKS_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Fireworks AI API Key',
  },
  {
    id: 'togetheraiApiKey',
    envKey: 'TOGETHERAI_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Together AI API Key',
  },
  {
    id: 'huggingfaceToken',
    envKey: 'HUGGINGFACE_TOKEN',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Hugging Face Token',
  },
  {
    id: 'xaiApiKey',
    envKey: 'XAI_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'xAI API Key',
  },
  {
    id: 'nvidiaApiKey',
    envKey: 'NVIDIA_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'NVIDIA API Key',
  },
  {
    id: 'sambanovaApiKey',
    envKey: 'SAMBANOVA_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'SambaNova API Key',
  },
  {
    id: 'hyperbolicApiKey',
    envKey: 'HYPERBOLIC_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Hyperbolic API Key',
  },
  {
    id: 'klusterApiKey',
    envKey: 'KLUSTER_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Kluster API Key',
  },
  {
    id: 'nanogptApiKey',
    envKey: 'NANOGPT_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'NanoGPT API Key',
  },
  {
    id: 'glhfApiKey',
    envKey: 'GLHF_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'GLHF API Key',
  },
  {
    id: 'apipieApiKey',
    envKey: 'APIPIE_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'APIPie API Key',
  },
  {
    id: 'unifyApiKey',
    envKey: 'UNIFY_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Unify API Key',
  },
  {
    id: 'openrouterKey',
    envKey: 'OPENROUTER_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'OpenRouter API Key',
  },
  
  // =============================================================================
  // Azure OpenAI
  // =============================================================================
  {
    id: 'azureApiKey',
    envKey: 'AZURE_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Azure OpenAI API Key',
  },
  {
    id: 'azureOpenaiApiInstanceName',
    envKey: 'AZURE_OPENAI_API_INSTANCE_NAME',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Azure OpenAI Instance Name',
  },
  {
    id: 'azureOpenaiApiDeploymentName',
    envKey: 'AZURE_OPENAI_API_DEPLOYMENT_NAME',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Azure OpenAI Deployment Name',
  },
  {
    id: 'azureOpenaiApiVersion',
    envKey: 'AZURE_OPENAI_API_VERSION',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Azure OpenAI API Version',
  },
  {
    id: 'azureOpenaiModels',
    envKey: 'AZURE_OPENAI_MODELS',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'Azure OpenAI Models (comma-separated)',
  },
  
  // =============================================================================
  // AWS Bedrock
  // =============================================================================
  {
    id: 'bedrockAccessKeyId',
    envKey: 'BEDROCK_ACCESS_KEY_ID',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'AWS Bedrock Access Key ID',
  },
  {
    id: 'bedrockSecretAccessKey',
    envKey: 'BEDROCK_SECRET_ACCESS_KEY',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'AWS Bedrock Secret Access Key',
  },
  {
    id: 'bedrockRegion',
    envKey: 'BEDROCK_REGION',
    type: 'string',
    defaultValue: '',
    category: 'ai-providers',
    description: 'AWS Bedrock Region',
  },
  
  // =============================================================================
  // Web Search
  // =============================================================================
  {
    id: 'serperApiKey',
    envKey: 'SERPER_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Serper API Key',
  },
  {
    id: 'searxngInstanceUrl',
    envKey: 'SEARXNG_INSTANCE_URL',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'SearXNG Instance URL',
  },
  {
    id: 'searxngApiKey',
    envKey: 'SEARXNG_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'SearXNG API Key',
  },
  {
    id: 'firecrawlApiKey',
    envKey: 'FIRECRAWL_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Firecrawl API Key',
  },
  {
    id: 'firecrawlApiUrl',
    envKey: 'FIRECRAWL_API_URL',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Firecrawl API URL',
  },
  {
    id: 'jinaApiKey',
    envKey: 'JINA_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Jina API Key',
  },
  {
    id: 'jinaApiUrl',
    envKey: 'JINA_API_URL',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Jina API URL',
  },
  {
    id: 'cohereApiKey',
    envKey: 'COHERE_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'web-search',
    description: 'Cohere API Key (for reranking)',
  },
  
  // =============================================================================
  // Database Configuration
  // =============================================================================
  {
    id: 'mongoUri',
    envKey: 'MONGO_URI',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'MongoDB Connection URI',
  },
  {
    id: 'mongoRootUsername',
    envKey: 'MONGO_ROOT_USERNAME',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'MongoDB Root Username',
  },
  {
    id: 'mongoRootPassword',
    envKey: 'MONGO_ROOT_PASSWORD',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'MongoDB Root Password',
  },
  {
    id: 'mongoDbName',
    envKey: 'MONGO_DB_NAME',
    type: 'string',
    defaultValue: 'LibreChat',
    category: 'database',
    description: 'MongoDB Database Name',
  },
  {
    id: 'redisUri',
    envKey: 'REDIS_URI',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'Redis Connection URI',
  },
  {
    id: 'redisUsername',
    envKey: 'REDIS_USERNAME',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'Redis Username',
  },
  {
    id: 'redisPassword',
    envKey: 'REDIS_PASSWORD',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'Redis Password',
  },
  {
    id: 'redisKeyPrefix',
    envKey: 'REDIS_KEY_PREFIX',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'Redis Key Prefix',
  },
  {
    id: 'redisKeyPrefixVar',
    envKey: 'REDIS_KEY_PREFIX_VAR',
    type: 'string',
    defaultValue: '',
    category: 'database',
    description: 'Redis Key Prefix Variable',
  },
  {
    id: 'redisMaxListeners',
    envKey: 'REDIS_MAX_LISTENERS',
    type: 'number',
    defaultValue: 10,
    category: 'database',
    description: 'Redis Max Listeners',
    min: 1,
    max: 100,
  },
  {
    id: 'redisPingInterval',
    envKey: 'REDIS_PING_INTERVAL',
    type: 'number',
    defaultValue: 30000,
    category: 'database',
    description: 'Redis Ping Interval (ms)',
    min: 1000,
    max: 300000,
  },
  {
    id: 'redisUseAlternativeDNSLookup',
    envKey: 'REDIS_USE_ALTERNATIVE_DNS_LOOKUP',
    type: 'boolean',
    defaultValue: false,
    category: 'database',
    description: 'Redis Use Alternative DNS Lookup',
    envTransformer: (val) => val === 'true',
  },
  
  // =============================================================================
  // Security Configuration
  // =============================================================================
  {
    id: 'jwtSecret',
    envKey: 'JWT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'security',
    description: 'JWT Secret Key',
  },
  {
    id: 'jwtRefreshSecret',
    envKey: 'JWT_REFRESH_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'security',
    description: 'JWT Refresh Secret Key',
  },
  {
    id: 'credsKey',
    envKey: 'CREDS_KEY',
    type: 'string',
    defaultValue: '',
    category: 'security',
    description: 'Credentials Encryption Key',
  },
  {
    id: 'credsIV',
    envKey: 'CREDS_IV',
    type: 'string',
    defaultValue: '',
    category: 'security',
    description: 'Credentials Initialization Vector',
  },
  {
    id: 'minPasswordLength',
    envKey: 'MIN_PASSWORD_LENGTH',
    type: 'number',
    defaultValue: 8,
    category: 'security',
    description: 'Minimum Password Length',
    min: 4,
    max: 64,
  },
  {
    id: 'emailVerificationRequired',
    envKey: 'EMAIL_VERIFICATION_REQUIRED',
    type: 'boolean',
    defaultValue: false,
    category: 'security',
    description: 'Require Email Verification',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'allowUnverifiedEmailLogin',
    envKey: 'ALLOW_UNVERIFIED_EMAIL_LOGIN',
    type: 'boolean',
    defaultValue: true,
    category: 'security',
    description: 'Allow Unverified Email Login',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'sessionExpiry',
    envKey: 'SESSION_EXPIRY',
    type: 'number',
    defaultValue: 900000,
    category: 'security',
    description: 'Session Expiry (ms)',
    min: 60000,
    max: 86400000,
  },
  {
    id: 'refreshTokenExpiry',
    envKey: 'REFRESH_TOKEN_EXPIRY',
    type: 'number',
    defaultValue: 604800000,
    category: 'security',
    description: 'Refresh Token Expiry (ms)',
    min: 3600000,
    max: 2592000000,
  },
  
  // =============================================================================
  // Authentication Configuration
  // =============================================================================
  {
    id: 'allowRegistration',
    envKey: 'ALLOW_REGISTRATION',
    type: 'boolean',
    defaultValue: true,
    category: 'auth',
    description: 'Allow User Registration',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'allowEmailLogin',
    envKey: 'ALLOW_EMAIL_LOGIN',
    type: 'boolean',
    defaultValue: true,
    category: 'auth',
    description: 'Allow Email/Password Login',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'allowSocialLogin',
    envKey: 'ALLOW_SOCIAL_LOGIN',
    type: 'boolean',
    defaultValue: false,
    category: 'auth',
    description: 'Allow Social Login',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'allowSocialRegistration',
    envKey: 'ALLOW_SOCIAL_REGISTRATION',
    type: 'boolean',
    defaultValue: false,
    category: 'auth',
    description: 'Allow Social Registration',
    envTransformer: (val) => val === 'true',
  },
  {
    id: 'allowPasswordReset',
    envKey: 'ALLOW_PASSWORD_RESET',
    type: 'boolean',
    defaultValue: true,
    category: 'auth',
    description: 'Allow Password Reset',
    envTransformer: (val) => val === 'true',
  },
  
  // =============================================================================
  // Email Configuration
  // =============================================================================
  {
    id: 'emailService',
    envKey: 'EMAIL_SERVICE',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Email Service Provider',
  },
  {
    id: 'emailUsername',
    envKey: 'EMAIL_USERNAME',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Email Username/Address',
  },
  {
    id: 'emailPassword',
    envKey: 'EMAIL_PASSWORD',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Email Password',
  },
  {
    id: 'emailFrom',
    envKey: 'EMAIL_FROM',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Email From Address',
  },
  {
    id: 'emailFromName',
    envKey: 'EMAIL_FROM_NAME',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Email From Name',
  },
  {
    id: 'mailgunApiKey',
    envKey: 'MAILGUN_API_KEY',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Mailgun API Key',
  },
  {
    id: 'mailgunDomain',
    envKey: 'MAILGUN_DOMAIN',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Mailgun Domain',
  },
  {
    id: 'mailgunHost',
    envKey: 'MAILGUN_HOST',
    type: 'string',
    defaultValue: '',
    category: 'email',
    description: 'Mailgun Host',
  },
  
  // =============================================================================
  // OAuth Providers
  // =============================================================================
  {
    id: 'googleClientId',
    envKey: 'GOOGLE_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Google OAuth Client ID',
  },
  {
    id: 'googleClientSecret',
    envKey: 'GOOGLE_CLIENT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Google OAuth Client Secret',
  },
  {
    id: 'googleCallbackUrl',
    envKey: 'GOOGLE_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Google OAuth Callback URL',
  },
  {
    id: 'githubClientId',
    envKey: 'GITHUB_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'GitHub OAuth Client ID',
  },
  {
    id: 'githubClientSecret',
    envKey: 'GITHUB_CLIENT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'GitHub OAuth Client Secret',
  },
  {
    id: 'githubCallbackUrl',
    envKey: 'GITHUB_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'GitHub OAuth Callback URL',
  },
  {
    id: 'discordClientId',
    envKey: 'DISCORD_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Discord OAuth Client ID',
  },
  {
    id: 'discordClientSecret',
    envKey: 'DISCORD_CLIENT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Discord OAuth Client Secret',
  },
  {
    id: 'discordCallbackUrl',
    envKey: 'DISCORD_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Discord OAuth Callback URL',
  },
  {
    id: 'facebookClientId',
    envKey: 'FACEBOOK_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Facebook OAuth Client ID',
  },
  {
    id: 'facebookClientSecret',
    envKey: 'FACEBOOK_CLIENT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Facebook OAuth Client Secret',
  },
  {
    id: 'facebookCallbackUrl',
    envKey: 'FACEBOOK_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Facebook OAuth Callback URL',
  },
  {
    id: 'appleClientId',
    envKey: 'APPLE_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Apple OAuth Client ID',
  },
  {
    id: 'applePrivateKey',
    envKey: 'APPLE_PRIVATE_KEY',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Apple OAuth Private Key',
  },
  {
    id: 'appleKeyId',
    envKey: 'APPLE_KEY_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Apple OAuth Key ID',
  },
  {
    id: 'appleTeamId',
    envKey: 'APPLE_TEAM_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Apple OAuth Team ID',
  },
  {
    id: 'appleCallbackUrl',
    envKey: 'APPLE_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'Apple OAuth Callback URL',
  },
  {
    id: 'openidUrl',
    envKey: 'OPENID_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect URL',
  },
  {
    id: 'openidClientId',
    envKey: 'OPENID_CLIENT_ID',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Client ID',
  },
  {
    id: 'openidClientSecret',
    envKey: 'OPENID_CLIENT_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Client Secret',
  },
  {
    id: 'openidCallbackUrl',
    envKey: 'OPENID_CALLBACK_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Callback URL',
  },
  {
    id: 'openidScope',
    envKey: 'OPENID_SCOPE',
    type: 'string',
    defaultValue: 'openid profile email',
    category: 'oauth',
    description: 'OpenID Connect Scope',
  },
  {
    id: 'openidSessionSecret',
    envKey: 'OPENID_SESSION_SECRET',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Session Secret',
  },
  {
    id: 'openidIssuer',
    envKey: 'OPENID_ISSUER',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Issuer',
  },
  {
    id: 'openidButtonLabel',
    envKey: 'OPENID_BUTTON_LABEL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Button Label',
  },
  {
    id: 'openidImageUrl',
    envKey: 'OPENID_IMAGE_URL',
    type: 'string',
    defaultValue: '',
    category: 'oauth',
    description: 'OpenID Connect Image URL',
  },
  
  // =============================================================================
  // Enabled Endpoints
  // =============================================================================
  {
    id: 'enabledEndpoints',
    envKey: 'ENDPOINTS',
    type: 'array',
    defaultValue: [],
    category: 'endpoints',
    description: 'Enabled Endpoints (comma-separated in ENV)',
    arrayItemType: 'string',
    envTransformer: (val) => val.split(',').map(v => v.trim()).filter(v => v),
  },
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
