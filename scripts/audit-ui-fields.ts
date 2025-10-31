import { FIELD_REGISTRY } from '../shared/config/field-registry';

// Extract all field IDs from registry grouped by category
const fieldsByCategory = new Map<string, string[]>();
FIELD_REGISTRY.forEach(field => {
  const category = field.category || 'uncategorized';
  if (!fieldsByCategory.has(category)) {
    fieldsByCategory.set(category, []);
  }
  fieldsByCategory.get(category)!.push(field.id);
});

// Fields currently in UI tabs (manually extracted from configuration-tabs.tsx)
const uiFields = new Set([
  // Core Settings
  "appTitle", "host", "port", "serverDomain", "sessionSecretKey", "sessionExpiry",
  
  // Security
  "jwtSecret", "jwtRefreshSecret", "credsKey", "credsIV", "emailVerificationRequired", 
  "allowUnverifiedEmailLogin", "minPasswordLength", "refreshTokenExpiry",
  
  // Database
  "mongoUri", "mongoRootUsername", "mongoRootPassword", "mongoDbName", 
  "redisUri", "redisUsername", "redisPassword", "redisKeyPrefix", "redisKeyPrefixVar", 
  "redisMaxListeners", "redisPingInterval", "redisUseAlternativeDNSLookup",
  
  // Core AI APIs
  "openaiApiKey", "openaiApiBase", "openaiReverseProxy", "openaiModeration", 
  "openaiModerationApiKey", "openaiModerationReverseProxy", 
  "anthropicApiKey", "googleApiKey", "groqApiKey", "mistralApiKey",
  
  // Extended AI APIs
  "deepseekApiKey", "perplexityApiKey", "fireworksApiKey", "togetheraiApiKey",
  "huggingfaceToken", "xaiApiKey", "nvidiaApiKey", "sambaNovaApiKey",
  "hyperbolicApiKey", "klusterApiKey", "nanogptApiKey", "glhfApiKey",
  "apipieApiKey", "unifyApiKey", "openrouterKey",
  
  // Azure
  "azureApiKey", "azureOpenaiApiInstanceName", "azureOpenaiApiDeploymentName", 
  "azureOpenaiApiVersion", "azureOpenaiModels",
  
  // AWS
  "awsAccessKeyId", "awsSecretAccessKey", "awsRegion", "awsBedrockRegion", 
  "awsEndpointURL", "awsBucketName",
  
  // Custom Endpoints
  "endpoints.custom",
  
  // Authentication
  "allowRegistration", "allowEmailLogin", "allowSocialLogin", "allowSocialRegistration",
  "allowPasswordReset", "registration.socialLogins", "registration.allowedDomains",
  
  // OAuth
  "googleClientId", "googleClientSecret", "googleCallbackUrl",
  "githubClientId", "githubClientSecret", "githubCallbackUrl",
  "discordClientId", "discordClientSecret", "discordCallbackUrl",
  
  // Email
  "emailFrom", "emailFromName", "emailService", "emailHost", "emailPort", 
  "emailUsername", "emailPassword", "emailEncryption",
  
  // File Storage
  "fileStorageStrategy", "fileUploadSizeLimit", "fileUploadMimeTypes",
  "firebaseAppId", "firebaseApiKey", "firebaseAuthDomain", "firebaseProjectId",
  "firebaseStorageBucket", "firebaseMessagingSenderId",
  "azureStorageAccountName", "azureStorageAccountKey", "azureStorageContainerName",
  "s3AccessKeyId", "s3SecretAccessKey", "s3Region", "s3BucketName", "s3Endpoint",
  
  // Search & APIs  
  "searchProvider", "bingApiKey", "bingSubscriptionKey",
  "googleSearchApiKey", "googleSearchEngineId",
  "serpApiKey", "serperApiKey",
  
  // Image Generation
  "dalleApiKey", "dalleReversProxy", "dalleMaxImages",
  
  // RAG API
  "ragApiUrl", "ragApiKey",
  
  // Rate & Security
  "limitConcurrentMessages", "concurrentMessageMax", "banViolations", "banDuration", "banInterval",
  "loginViolationScore", "registrationViolationScore", "concurrentViolationScore", 
  "messageViolationScore", "nonBrowserViolationScore", "loginMax", "loginWindow",
  
  // LDAP
  "ldapUrl", "ldapBindDn",
  
  // Features
  "interfacePresets", "interfaceSidePanel", "interfacePrompts", "interfaceBookmarks",
  "interfaceMultiConvo", "interfaceModelSelect",
  
  // MCP
  "mcpServers",
  
  // Code Execution
  "e2bProxyUrl", "e2bApiKey",
  
  // Speech
  "stt.baseURL", "stt.apiKey", "stt.model",
  "tts.baseURL", "tts.apiKey", "tts.model", "tts.voice", "tts.speed", "tts.quality",
  
  // Memory
  "memory.enabled", "memory.provider",
]);

console.log("================================================================================");
console.log("UI FIELD COVERAGE AUDIT");
console.log("================================================================================\n");

console.log(`Total fields in registry: ${FIELD_REGISTRY.length}`);
console.log(`Total fields in UI tabs: ${uiFields.size}\n`);

// Find missing fields by category
const missingByCategory = new Map<string, string[]>();
let totalMissing = 0;

fieldsByCategory.forEach((fields, category) => {
  const missing = fields.filter(id => !uiFields.has(id));
  if (missing.length > 0) {
    missingByCategory.set(category, missing);
    totalMissing += missing.length;
  }
});

console.log(`Missing from UI: ${totalMissing} fields\n`);

if (totalMissing > 0) {
  console.log("MISSING FIELDS BY CATEGORY:");
  console.log("================================================================================\n");
  
  Array.from(missingByCategory.entries())
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, fields]) => {
      console.log(`\n${category.toUpperCase()} (${fields.length} missing):`);
      fields.forEach(field => console.log(`  - ${field}`));
    });
}

console.log("\n================================================================================");
