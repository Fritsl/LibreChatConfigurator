// LibreChat v0.8.0-RC5 Essential Default Configuration Values
// Based on official LibreChat .env.example core settings

import { Configuration } from "@shared/schema";
import { defaultConfiguration } from "@/lib/configuration-defaults";

/**
 * Core LibreChat defaults based on .env.example file.
 * Only includes the essential fields that are explicitly set in LibreChat's official configuration.
 */
export const essentialDefaults: Partial<Configuration> = {
  // Core configuration metadata
  version: "1.2.8", // RC4 version
  cache: true, // Enable caching by default
  
  // Basic server settings from .env.example
  host: "0.0.0.0",
  port: 3080,
  debugLogging: true, // Enabled in .env.example
  debugConsole: false, // Disabled by default
  noIndex: true, // Prevent search engine indexing
  
  // Basic database configuration from .env.example
  mongoUri: "mongodb://127.0.0.1:27017/LibreChat",
  
  // Core authentication settings from .env.example 
  allowRegistration: true, // Allow new users
  allowEmailLogin: true, // Enable email/password auth
  allowSocialLogin: false, // Disabled by default (requires setup)
  minPasswordLength: 8, // Standard minimum
  
  // Basic application settings from .env.example
  appTitle: "LibreChat", // Default title
  allowSharedLinks: true, // Enabled in .env.example
  allowSharedLinksPublic: true, // Public sharing enabled
  
  // Model configuration defaults  
  titleConvo: false, // Disable auto titles
};

/**
 * Create a complete reset configuration that preserves user secrets but resets all settings to defaults.
 * Uses the full default configuration as the base to ensure no fields are lost.
 */
export function createResetConfiguration(currentConfig: Partial<Configuration> = {}): Configuration {
  
  // Define top-level secret/credential fields that exist in Configuration schema
  // This prevents data loss of user-configured API keys, passwords, and credentials
  const secretFields: (keyof Configuration)[] = [
    // Core Authentication & Security
    'jwtSecret', 'jwtRefreshSecret', 'credsKey', 'credsIV',
    
    // Core AI Provider API Keys (top-level fields)
    'openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'groqApiKey', 'mistralApiKey',
    
    // Additional AI Provider API Keys (top-level fields)
    'deepseekApiKey', 'perplexityApiKey', 'fireworksApiKey', 'togetheraiApiKey',
    'huggingfaceToken', 'xaiApiKey', 'nvidiaApiKey', 'sambaNovaApiKey', 
    'hyperbolicApiKey', 'klusterApiKey', 'nanogptApiKey', 'glhfApiKey',
    'apipieApiKey', 'unifyApiKey', 'openrouterKey',
    
    // Cloud Provider Keys (top-level fields)
    'azureApiKey', 'awsAccessKeyId', 'awsSecretAccessKey', 'firebaseApiKey',
    
    // OAuth Client Secrets (top-level fields)
    'googleClientSecret', 'githubClientSecret', 'discordClientSecret', 
    'facebookClientSecret', 'applePrivateKey', 'appleKeyId',
    'openidClientSecret', 'openidSessionSecret',
    
    // Email & Communication (top-level fields)
    'emailPassword', 'mailgunApiKey',
    
    // External Services (top-level fields)
    'googleSearchApiKey', 'bingSearchApiKey', 'openweatherApiKey', 'librechatCodeApiKey',
    
    // Database & Storage (top-level fields)
    'redisPassword', 'redisKeyPrefix', 'redisKeyPrefixVar', 
    'meilisearchMasterKey', 'mongoRootPassword',
    
    // LDAP & Security Services (top-level fields)
    'ldapBindCredentials', 'turnstileSiteKey', 'turnstileSecretKey',
    
    // RAG & Specialized APIs (top-level fields)
    'ragOpenaiApiKey'
  ];
  
  // Define known placeholder values that should NOT be preserved
  const placeholderValues = new Set([
    'user_provided',
    'your_api_key_here', 
    'your_secret_here',
    'your_token_here',
    'your_password_here',
    'your_key_here',
    'replace_with_your_key',
    'add_your_key_here',
    'insert_your_api_key',
    'example_key',
    'test_key',
    'placeholder'
  ]);
  
  // Preserve all configured secrets/credentials from current configuration
  const preservedSecrets: Partial<Configuration> = {};
  
  for (const field of secretFields) {
    const value = currentConfig[field];
    // Only preserve if the field has a non-empty value and isn't a known placeholder
    if (value && 
        typeof value === 'string' && 
        value.trim() !== '' && 
        !placeholderValues.has(value.toLowerCase()) &&
        !value.toLowerCase().includes('placeholder') &&
        !value.toLowerCase().includes('example')
       ) {
      (preservedSecrets as any)[field] = value;
    }
  }

  // Start with complete default configuration to ensure all fields are present
  const resetConfig: Configuration = {
    ...defaultConfiguration,
    // Override with LibreChat essentials from .env.example
    ...essentialDefaults,
    // Preserve user's configured secrets and API keys
    ...preservedSecrets,
    // Ensure RC4 metadata is correct
    version: "1.2.8",
  };

  return resetConfig;
}

/**
 * Get the essential LibreChat defaults.
 */
export function getEssentialDefaults(): Partial<Configuration> {
  return { ...essentialDefaults };
}

/**
 * Check if a field is set to its default value.
 */
export function isAtDefaultValue<K extends keyof Configuration>(
  field: K,
  value: Configuration[K]
): boolean {
  const defaultValue = essentialDefaults[field];
  return JSON.stringify(value) === JSON.stringify(defaultValue);
}