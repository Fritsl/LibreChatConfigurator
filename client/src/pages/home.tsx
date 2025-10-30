import { useState, useEffect } from "react";
import { ConfigurationTabs } from "@/components/configuration-tabs";
import { PreviewModal } from "@/components/preview-modal";
import { useConfiguration } from "@/hooks/use-configuration";
import { useBackendAvailability } from "@/hooks/use-backend-availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { defaultConfiguration } from "@/lib/configuration-defaults";
import { createResetConfiguration } from "@/lib/librechat-defaults";
import { deepMerge } from "@/lib/merge-utils";
import { Search, Download, Save, Upload, CheckCircle, Eye, Rocket, ChevronDown, FolderOpen, FileText, Settings, TestTube, Zap, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; 
import { Label } from "@/components/ui/label";
import { ConfigurationHistory } from "@/components/ConfigurationHistory";
import { getToolVersion, getVersionInfo } from "@shared/version";
import yaml from "js-yaml";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSelfTestConfirmation, setShowSelfTestConfirmation] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showMergeResults, setShowMergeResults] = useState(false);
  const [mergeDetails, setMergeDetails] = useState<{ name: string; fields: string[] } | null>(null);
  const [showUnsupportedFieldsDialog, setShowUnsupportedFieldsDialog] = useState(false);
  const [unsupportedFieldsData, setUnsupportedFieldsData] = useState<{ type: 'yaml' | 'env'; fields: string[] } | null>(null);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [importSummaryData, setImportSummaryData] = useState<{ 
    type: 'yaml' | 'env'; 
    fileName: string;
    totalFields: number;
    newFields: number;
    updatedFields: number;
    unchangedFields: number;
    fieldDetails: { name: string; status: 'new' | 'updated' | 'unchanged' }[];
  } | null>(null);
  const { configuration, updateConfiguration, saveProfile, generatePackage, loadDemoConfiguration, verifyConfiguration } = useConfiguration();
  const { isBackendAvailable, isDemo } = useBackendAvailability();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    try {
      // ⚠️ REMINDER: Always update version in shared/version.ts when making changes!
      
      // Create a complete configuration with ALL fields for 1:1 backup
      // Use createResetConfiguration which ensures all fields are present
      const completeDefaults = createResetConfiguration();
      const completeConfiguration = deepMerge(completeDefaults, configuration);
      
      // Create versioned export metadata
      const { createExportMetadata } = await import("@shared/version");
      const metadata = createExportMetadata(configuration.configurationName);
      
      // Create profile data with configuration and versioned metadata
      const versionInfo = getVersionInfo();
      const profileData = {
        name: configuration.configurationName,
        description: `Configuration profile created on ${new Date().toLocaleDateString()}`,
        configuration: completeConfiguration,
        metadata: metadata, // ✨ NEW: Structured version metadata for migration support
        // Legacy fields for backward compatibility
        toolVersion: versionInfo.toolVersion,
        librechatTarget: versionInfo.librechatTarget,
        createdAt: new Date().toISOString(),
        exportedFrom: `LibreChat Configuration Manager v${versionInfo.toolVersion}`,
        lastUpdated: versionInfo.lastUpdated,
        changelog: versionInfo.changelog
      };

      // Download as JSON file with Save As dialog
      const { downloadJSON } = await import("@/lib/download-utils");
      const filename = `${configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}-LibreChatConfigSettings.json`;
      const success = await downloadJSON(profileData, filename);

      if (success) {
        toast({
          title: "Configuration Saved",
          description: `Configuration "${configuration.configurationName}" downloaded successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save LibreChat configuration settings.",
        variant: "destructive",
      });
    }
  };

  const parseEnvFile = (envContent: string) => {
    const envVars: Record<string, string> = {};
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
    return envVars;
  };

  // Helper function to analyze configuration changes
  // IMPORTANT: Only compares fields present in newUpdates to avoid cross-contamination between .env and YAML imports
  const analyzeConfigurationChanges = (oldConfig: any, newUpdates: any) => {
    const fieldDetails: { name: string; status: 'new' | 'updated' | 'unchanged' }[] = [];
    let newFields = 0;
    let updatedFields = 0;
    let unchangedFields = 0;

    const processObject = (oldObj: any, newObj: any, prefix = '') => {
      Object.keys(newObj).forEach(key => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const newValue = newObj[key];
        const oldValue = oldObj?.[key];

        // Skip null/undefined values
        if (newValue === null || newValue === undefined) return;

        // Handle nested objects (but not arrays)
        if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue !== null) {
          processObject(oldValue || {}, newValue, fullPath);
          return;
        }

        // Compare values using deep equality
        const oldValueStr = JSON.stringify(oldValue);
        const newValueStr = JSON.stringify(newValue);

        // Determine status based on old value state
        if (oldValue === undefined || oldValue === null || oldValue === '') {
          fieldDetails.push({ name: fullPath, status: 'new' });
          newFields++;
        } else if (oldValueStr !== newValueStr) {
          fieldDetails.push({ name: fullPath, status: 'updated' });
          updatedFields++;
        } else {
          fieldDetails.push({ name: fullPath, status: 'unchanged' });
          unchangedFields++;
        }
      });
    };

    processObject(oldConfig, newUpdates);

    return {
      totalFields: fieldDetails.length,
      newFields,
      updatedFields,
      unchangedFields,
      fieldDetails
    };
  };

  const mapEnvToConfiguration = (envVars: Record<string, string>) => {
    const config: any = {};
    
    // App Configuration
    if (envVars.APP_TITLE) config.appTitle = envVars.APP_TITLE;
    if (envVars.CUSTOM_WELCOME) config.customWelcome = envVars.CUSTOM_WELCOME;
    if (envVars.CUSTOM_FOOTER) config.customFooter = envVars.CUSTOM_FOOTER;
    if (envVars.HELP_AND_FAQ_URL) config.helpAndFAQURL = envVars.HELP_AND_FAQ_URL;
    
    // Server Configuration
    if (envVars.HOST) config.host = envVars.HOST;
    if (envVars.PORT) config.port = parseInt(envVars.PORT) || 3080;
    if (envVars.ENDPOINTS) config.enabledEndpoints = envVars.ENDPOINTS.split(',');
    if (envVars.NODE_ENV) config.nodeEnv = envVars.NODE_ENV;
    if (envVars.DOMAIN_CLIENT) config.domainClient = envVars.DOMAIN_CLIENT;
    if (envVars.DOMAIN_SERVER) config.domainServer = envVars.DOMAIN_SERVER;
    if (envVars.NO_INDEX !== undefined) config.noIndex = envVars.NO_INDEX === 'true';
    
    // Security Configuration
    if (envVars.JWT_SECRET) config.jwtSecret = envVars.JWT_SECRET;
    if (envVars.JWT_REFRESH_SECRET) config.jwtRefreshSecret = envVars.JWT_REFRESH_SECRET;
    if (envVars.CREDS_KEY) config.credsKey = envVars.CREDS_KEY;
    if (envVars.CREDS_IV) config.credsIV = envVars.CREDS_IV;
    if (envVars.MIN_PASSWORD_LENGTH) config.minPasswordLength = parseInt(envVars.MIN_PASSWORD_LENGTH) || 8;
    if (envVars.EMAIL_VERIFICATION_REQUIRED !== undefined) config.emailVerificationRequired = envVars.EMAIL_VERIFICATION_REQUIRED === 'true';
    if (envVars.ALLOW_UNVERIFIED_EMAIL_LOGIN !== undefined) config.allowUnverifiedEmailLogin = envVars.ALLOW_UNVERIFIED_EMAIL_LOGIN === 'true';
    if (envVars.SESSION_EXPIRY) config.sessionExpiry = parseInt(envVars.SESSION_EXPIRY) || 900000;
    if (envVars.REFRESH_TOKEN_EXPIRY) config.refreshTokenExpiry = parseInt(envVars.REFRESH_TOKEN_EXPIRY) || 604800000;
    
    // Database Configuration
    if (envVars.MONGO_URI) config.mongoUri = envVars.MONGO_URI;
    if (envVars.MONGO_ROOT_USERNAME) config.mongoRootUsername = envVars.MONGO_ROOT_USERNAME;
    if (envVars.MONGO_ROOT_PASSWORD) config.mongoRootPassword = envVars.MONGO_ROOT_PASSWORD;
    if (envVars.MONGO_DB_NAME) config.mongoDbName = envVars.MONGO_DB_NAME;
    if (envVars.REDIS_URI) config.redisUri = envVars.REDIS_URI;
    if (envVars.REDIS_USERNAME) config.redisUsername = envVars.REDIS_USERNAME;
    if (envVars.REDIS_PASSWORD) config.redisPassword = envVars.REDIS_PASSWORD;
    if (envVars.REDIS_KEY_PREFIX) config.redisKeyPrefix = envVars.REDIS_KEY_PREFIX;
    if (envVars.REDIS_KEY_PREFIX_VAR) config.redisKeyPrefixVar = envVars.REDIS_KEY_PREFIX_VAR;
    if (envVars.REDIS_MAX_LISTENERS) config.redisMaxListeners = parseInt(envVars.REDIS_MAX_LISTENERS) || 10;
    if (envVars.REDIS_PING_INTERVAL) config.redisPingInterval = parseInt(envVars.REDIS_PING_INTERVAL) || 30000;
    if (envVars.REDIS_USE_ALTERNATIVE_DNS_LOOKUP !== undefined) config.redisUseAlternativeDNSLookup = envVars.REDIS_USE_ALTERNATIVE_DNS_LOOKUP === 'true';
    
    // Authentication Configuration
    if (envVars.ALLOW_REGISTRATION !== undefined) config.allowRegistration = envVars.ALLOW_REGISTRATION === 'true';
    if (envVars.ALLOW_EMAIL_LOGIN !== undefined) config.allowEmailLogin = envVars.ALLOW_EMAIL_LOGIN === 'true';
    if (envVars.ALLOW_SOCIAL_LOGIN !== undefined) config.allowSocialLogin = envVars.ALLOW_SOCIAL_LOGIN === 'true';
    if (envVars.ALLOW_SOCIAL_REGISTRATION !== undefined) config.allowSocialRegistration = envVars.ALLOW_SOCIAL_REGISTRATION === 'true';
    if (envVars.ALLOW_PASSWORD_RESET !== undefined) config.allowPasswordReset = envVars.ALLOW_PASSWORD_RESET === 'true';
    
    // Email Configuration
    if (envVars.EMAIL_SERVICE) config.emailService = envVars.EMAIL_SERVICE;
    if (envVars.EMAIL_USERNAME) config.emailUsername = envVars.EMAIL_USERNAME;
    if (envVars.EMAIL_PASSWORD) config.emailPassword = envVars.EMAIL_PASSWORD;
    if (envVars.EMAIL_FROM) config.emailFrom = envVars.EMAIL_FROM;
    if (envVars.EMAIL_FROM_NAME) config.emailFromName = envVars.EMAIL_FROM_NAME;
    if (envVars.MAILGUN_API_KEY) config.mailgunApiKey = envVars.MAILGUN_API_KEY;
    if (envVars.MAILGUN_DOMAIN) config.mailgunDomain = envVars.MAILGUN_DOMAIN;
    if (envVars.MAILGUN_HOST) config.mailgunHost = envVars.MAILGUN_HOST;
    
    // OAuth Providers
    if (envVars.GOOGLE_CLIENT_ID) config.googleClientId = envVars.GOOGLE_CLIENT_ID;
    if (envVars.GOOGLE_CLIENT_SECRET) config.googleClientSecret = envVars.GOOGLE_CLIENT_SECRET;
    if (envVars.GOOGLE_CALLBACK_URL) config.googleCallbackURL = envVars.GOOGLE_CALLBACK_URL;
    if (envVars.GITHUB_CLIENT_ID) config.githubClientId = envVars.GITHUB_CLIENT_ID;
    if (envVars.GITHUB_CLIENT_SECRET) config.githubClientSecret = envVars.GITHUB_CLIENT_SECRET;
    if (envVars.GITHUB_CALLBACK_URL) config.githubCallbackURL = envVars.GITHUB_CALLBACK_URL;
    if (envVars.DISCORD_CLIENT_ID) config.discordClientId = envVars.DISCORD_CLIENT_ID;
    if (envVars.DISCORD_CLIENT_SECRET) config.discordClientSecret = envVars.DISCORD_CLIENT_SECRET;
    if (envVars.DISCORD_CALLBACK_URL) config.discordCallbackURL = envVars.DISCORD_CALLBACK_URL;
    if (envVars.FACEBOOK_CLIENT_ID) config.facebookClientId = envVars.FACEBOOK_CLIENT_ID;
    if (envVars.FACEBOOK_CLIENT_SECRET) config.facebookClientSecret = envVars.FACEBOOK_CLIENT_SECRET;
    if (envVars.FACEBOOK_CALLBACK_URL) config.facebookCallbackURL = envVars.FACEBOOK_CALLBACK_URL;
    if (envVars.APPLE_CLIENT_ID) config.appleClientId = envVars.APPLE_CLIENT_ID;
    if (envVars.APPLE_PRIVATE_KEY) config.applePrivateKey = envVars.APPLE_PRIVATE_KEY;
    if (envVars.APPLE_KEY_ID) config.appleKeyId = envVars.APPLE_KEY_ID;
    if (envVars.APPLE_TEAM_ID) config.appleTeamId = envVars.APPLE_TEAM_ID;
    if (envVars.APPLE_CALLBACK_URL) config.appleCallbackURL = envVars.APPLE_CALLBACK_URL;
    if (envVars.OPENID_URL) config.openidURL = envVars.OPENID_URL;
    if (envVars.OPENID_CLIENT_ID) config.openidClientId = envVars.OPENID_CLIENT_ID;
    if (envVars.OPENID_CLIENT_SECRET) config.openidClientSecret = envVars.OPENID_CLIENT_SECRET;
    if (envVars.OPENID_CALLBACK_URL) config.openidCallbackURL = envVars.OPENID_CALLBACK_URL;
    if (envVars.OPENID_SCOPE) config.openidScope = envVars.OPENID_SCOPE;
    if (envVars.OPENID_SESSION_SECRET) config.openidSessionSecret = envVars.OPENID_SESSION_SECRET;
    if (envVars.OPENID_ISSUER) config.openidIssuer = envVars.OPENID_ISSUER;
    if (envVars.OPENID_BUTTON_LABEL) config.openidButtonLabel = envVars.OPENID_BUTTON_LABEL;
    if (envVars.OPENID_IMAGE_URL) config.openidImageURL = envVars.OPENID_IMAGE_URL;
    
    // Core AI API Keys
    if (envVars.OPENAI_API_KEY) config.openaiApiKey = envVars.OPENAI_API_KEY;
    if (envVars.OPENAI_API_BASE) config.openaiApiBase = envVars.OPENAI_API_BASE;
    if (envVars.OPENAI_REVERSE_PROXY) config.openaiReverseProxy = envVars.OPENAI_REVERSE_PROXY;
    if (envVars.OPENAI_MODERATION_REVERSE_PROXY) config.openaiModerationReverseProxy = envVars.OPENAI_MODERATION_REVERSE_PROXY;
    if (envVars.ANTHROPIC_API_KEY) config.anthropicApiKey = envVars.ANTHROPIC_API_KEY;
    if (envVars.GOOGLE_API_KEY) config.googleApiKey = envVars.GOOGLE_API_KEY;
    if (envVars.GROQ_API_KEY) config.groqApiKey = envVars.GROQ_API_KEY;
    if (envVars.MISTRAL_API_KEY) config.mistralApiKey = envVars.MISTRAL_API_KEY;
    
    // Extended AI API Keys
    if (envVars.DEEPSEEK_API_KEY) config.deepseekApiKey = envVars.DEEPSEEK_API_KEY;
    if (envVars.PERPLEXITY_API_KEY) config.perplexityApiKey = envVars.PERPLEXITY_API_KEY;
    if (envVars.FIREWORKS_API_KEY) config.fireworksApiKey = envVars.FIREWORKS_API_KEY;
    if (envVars.TOGETHERAI_API_KEY) config.togetheraiApiKey = envVars.TOGETHERAI_API_KEY;
    if (envVars.HUGGINGFACE_TOKEN) config.huggingfaceToken = envVars.HUGGINGFACE_TOKEN;
    if (envVars.XAI_API_KEY) config.xaiApiKey = envVars.XAI_API_KEY;
    if (envVars.NVIDIA_API_KEY) config.nvidiaApiKey = envVars.NVIDIA_API_KEY;
    if (envVars.SAMBANOVA_API_KEY) config.sambaNovaApiKey = envVars.SAMBANOVA_API_KEY;
    if (envVars.HYPERBOLIC_API_KEY) config.hyperbolicApiKey = envVars.HYPERBOLIC_API_KEY;
    if (envVars.KLUSTER_API_KEY) config.klusterApiKey = envVars.KLUSTER_API_KEY;
    if (envVars.NANOGPT_API_KEY) config.nanogptApiKey = envVars.NANOGPT_API_KEY;
    if (envVars.GLHF_API_KEY) config.glhfApiKey = envVars.GLHF_API_KEY;
    if (envVars.APIPIE_API_KEY) config.apipieApiKey = envVars.APIPIE_API_KEY;
    if (envVars.UNIFY_API_KEY) config.unifyApiKey = envVars.UNIFY_API_KEY;
    if (envVars.OPENROUTER_KEY) config.openrouterKey = envVars.OPENROUTER_KEY;
    
    // Azure OpenAI
    if (envVars.AZURE_API_KEY) config.azureApiKey = envVars.AZURE_API_KEY;
    if (envVars.AZURE_OPENAI_API_INSTANCE_NAME) config.azureOpenaiApiInstanceName = envVars.AZURE_OPENAI_API_INSTANCE_NAME;
    if (envVars.AZURE_OPENAI_API_DEPLOYMENT_NAME) config.azureOpenaiApiDeploymentName = envVars.AZURE_OPENAI_API_DEPLOYMENT_NAME;
    if (envVars.AZURE_OPENAI_API_VERSION) config.azureOpenaiApiVersion = envVars.AZURE_OPENAI_API_VERSION;
    if (envVars.AZURE_OPENAI_MODELS) config.azureOpenaiModels = envVars.AZURE_OPENAI_MODELS;
    
    // AWS Bedrock
    if (envVars.AWS_ACCESS_KEY_ID) config.awsAccessKeyId = envVars.AWS_ACCESS_KEY_ID;
    if (envVars.AWS_SECRET_ACCESS_KEY) config.awsSecretAccessKey = envVars.AWS_SECRET_ACCESS_KEY;
    if (envVars.AWS_REGION) config.awsRegion = envVars.AWS_REGION;
    if (envVars.AWS_BEDROCK_REGION) config.awsBedrockRegion = envVars.AWS_BEDROCK_REGION;
    if (envVars.AWS_ENDPOINT_URL) config.awsEndpointURL = envVars.AWS_ENDPOINT_URL;
    if (envVars.AWS_BUCKET_NAME) config.awsBucketName = envVars.AWS_BUCKET_NAME;
    
    // File Storage
    if (envVars.FILE_UPLOAD_PATH) config.fileUploadPath = envVars.FILE_UPLOAD_PATH;
    if (envVars.FIREBASE_API_KEY) config.firebaseApiKey = envVars.FIREBASE_API_KEY;
    if (envVars.FIREBASE_AUTH_DOMAIN) config.firebaseAuthDomain = envVars.FIREBASE_AUTH_DOMAIN;
    if (envVars.FIREBASE_PROJECT_ID) config.firebaseProjectId = envVars.FIREBASE_PROJECT_ID;
    if (envVars.FIREBASE_STORAGE_BUCKET) config.firebaseStorageBucket = envVars.FIREBASE_STORAGE_BUCKET;
    if (envVars.FIREBASE_MESSAGING_SENDER_ID) config.firebaseMessagingSenderId = envVars.FIREBASE_MESSAGING_SENDER_ID;
    if (envVars.FIREBASE_APP_ID) config.firebaseAppId = envVars.FIREBASE_APP_ID;
    if (envVars.AZURE_STORAGE_CONNECTION_STRING) config.azureStorageConnectionString = envVars.AZURE_STORAGE_CONNECTION_STRING;
    if (envVars.AZURE_STORAGE_PUBLIC_ACCESS !== undefined) config.azureStoragePublicAccess = envVars.AZURE_STORAGE_PUBLIC_ACCESS === 'true';
    if (envVars.AZURE_CONTAINER_NAME) config.azureContainerName = envVars.AZURE_CONTAINER_NAME;
    
    // Search & External APIs
    if (envVars.GOOGLE_SEARCH_API_KEY) config.googleSearchApiKey = envVars.GOOGLE_SEARCH_API_KEY;
    if (envVars.GOOGLE_CSE_ID) config.googleCSEId = envVars.GOOGLE_CSE_ID;
    if (envVars.BING_SEARCH_API_KEY) config.bingSearchApiKey = envVars.BING_SEARCH_API_KEY;
    if (envVars.OPENWEATHER_API_KEY) config.openweatherApiKey = envVars.OPENWEATHER_API_KEY;
    
    // Web Search (LibreChat webSearch section) - nested object
    if (envVars.SERPER_API_KEY || envVars.SEARXNG_INSTANCE_URL || envVars.SEARXNG_API_KEY ||
        envVars.FIRECRAWL_API_KEY || envVars.FIRECRAWL_API_URL ||
        envVars.JINA_API_KEY || envVars.JINA_API_URL || envVars.COHERE_API_KEY) {
      config.webSearch = config.webSearch || {};
      if (envVars.SERPER_API_KEY) config.webSearch.serperApiKey = envVars.SERPER_API_KEY;
      if (envVars.SEARXNG_INSTANCE_URL) config.webSearch.searxngInstanceUrl = envVars.SEARXNG_INSTANCE_URL;
      if (envVars.SEARXNG_API_KEY) config.webSearch.searxngApiKey = envVars.SEARXNG_API_KEY;
      if (envVars.FIRECRAWL_API_KEY) config.webSearch.firecrawlApiKey = envVars.FIRECRAWL_API_KEY;
      if (envVars.FIRECRAWL_API_URL) config.webSearch.firecrawlApiUrl = envVars.FIRECRAWL_API_URL;
      if (envVars.JINA_API_KEY) config.webSearch.jinaApiKey = envVars.JINA_API_KEY;
      if (envVars.JINA_API_URL) config.webSearch.jinaApiUrl = envVars.JINA_API_URL;
      if (envVars.COHERE_API_KEY) config.webSearch.cohereApiKey = envVars.COHERE_API_KEY;
    }
    
    // DALL-E Image Generation
    if (envVars.DALLE_API_KEY) config.dalleApiKey = envVars.DALLE_API_KEY;
    if (envVars.DALLE3_API_KEY) config.dalle3ApiKey = envVars.DALLE3_API_KEY;
    if (envVars.DALLE2_API_KEY) config.dalle2ApiKey = envVars.DALLE2_API_KEY;
    if (envVars.DALLE_REVERSE_PROXY) config.dalleReverseProxy = envVars.DALLE_REVERSE_PROXY;
    if (envVars.DALLE3_BASEURL) config.dalle3BaseUrl = envVars.DALLE3_BASEURL;
    if (envVars.DALLE2_BASEURL) config.dalle2BaseUrl = envVars.DALLE2_BASEURL;
    if (envVars.DALLE3_SYSTEM_PROMPT) config.dalle3SystemPrompt = envVars.DALLE3_SYSTEM_PROMPT;
    if (envVars.DALLE2_SYSTEM_PROMPT) config.dalle2SystemPrompt = envVars.DALLE2_SYSTEM_PROMPT;
    
    // RAG API
    if (envVars.RAG_API_URL) config.ragApiURL = envVars.RAG_API_URL;
    if (envVars.RAG_OPENAI_API_KEY) config.ragOpenaiApiKey = envVars.RAG_OPENAI_API_KEY;
    if (envVars.RAG_PORT) config.ragPort = parseInt(envVars.RAG_PORT);
    if (envVars.RAG_HOST) config.ragHost = envVars.RAG_HOST;
    if (envVars.COLLECTION_NAME) config.collectionName = envVars.COLLECTION_NAME;
    if (envVars.CHUNK_SIZE) config.chunkSize = parseInt(envVars.CHUNK_SIZE);
    if (envVars.CHUNK_OVERLAP) config.chunkOverlap = parseInt(envVars.CHUNK_OVERLAP);
    if (envVars.EMBEDDINGS_PROVIDER) config.embeddingsProvider = envVars.EMBEDDINGS_PROVIDER;
    
    // MeiliSearch
    if (envVars.MEILISEARCH_URL) config.meilisearchURL = envVars.MEILISEARCH_URL;
    if (envVars.MEILISEARCH_MASTER_KEY) config.meilisearchMasterKey = envVars.MEILISEARCH_MASTER_KEY;
    if (envVars.MEILI_NO_ANALYTICS !== undefined) config.meiliNoAnalytics = envVars.MEILI_NO_ANALYTICS === 'true';
    
    // Rate Limiting & Security
    if (envVars.LIMIT_CONCURRENT_MESSAGES !== undefined) config.limitConcurrentMessages = envVars.LIMIT_CONCURRENT_MESSAGES === 'true';
    if (envVars.CONCURRENT_MESSAGE_MAX) config.concurrentMessageMax = parseInt(envVars.CONCURRENT_MESSAGE_MAX);
    if (envVars.BAN_VIOLATIONS !== undefined) config.banViolations = envVars.BAN_VIOLATIONS === 'true';
    if (envVars.BAN_DURATION) config.banDuration = parseInt(envVars.BAN_DURATION);
    if (envVars.BAN_INTERVAL) config.banInterval = parseInt(envVars.BAN_INTERVAL);
    if (envVars.LOGIN_VIOLATION_SCORE) config.loginViolationScore = parseInt(envVars.LOGIN_VIOLATION_SCORE);
    if (envVars.REGISTRATION_VIOLATION_SCORE) config.registrationViolationScore = parseInt(envVars.REGISTRATION_VIOLATION_SCORE);
    if (envVars.CONCURRENT_VIOLATION_SCORE) config.concurrentViolationScore = parseInt(envVars.CONCURRENT_VIOLATION_SCORE);
    if (envVars.MESSAGE_VIOLATION_SCORE) config.messageViolationScore = parseInt(envVars.MESSAGE_VIOLATION_SCORE);
    if (envVars.NON_BROWSER_VIOLATION_SCORE) config.nonBrowserViolationScore = parseInt(envVars.NON_BROWSER_VIOLATION_SCORE);
    if (envVars.LOGIN_MAX) config.loginMax = parseInt(envVars.LOGIN_MAX);
    if (envVars.LOGIN_WINDOW) config.loginWindow = parseInt(envVars.LOGIN_WINDOW);
    
    // LDAP
    if (envVars.LDAP_URL) config.ldapURL = envVars.LDAP_URL;
    if (envVars.LDAP_BIND_DN) config.ldapBindDN = envVars.LDAP_BIND_DN;
    if (envVars.LDAP_BIND_CREDENTIALS) config.ldapBindCredentials = envVars.LDAP_BIND_CREDENTIALS;
    if (envVars.LDAP_SEARCH_BASE) config.ldapSearchBase = envVars.LDAP_SEARCH_BASE;
    if (envVars.LDAP_SEARCH_FILTER) config.ldapSearchFilter = envVars.LDAP_SEARCH_FILTER;
    
    // Turnstile
    if (envVars.TURNSTILE_SITE_KEY) config.turnstileSiteKey = envVars.TURNSTILE_SITE_KEY;
    if (envVars.TURNSTILE_SECRET_KEY) config.turnstileSecretKey = envVars.TURNSTILE_SECRET_KEY;
    
    // Features
    if (envVars.ALLOW_SHARED_LINKS !== undefined) config.allowSharedLinks = envVars.ALLOW_SHARED_LINKS === 'true';
    if (envVars.ALLOW_SHARED_LINKS_PUBLIC !== undefined) config.allowSharedLinksPublic = envVars.ALLOW_SHARED_LINKS_PUBLIC === 'true';
    if (envVars.TITLE_CONVO !== undefined) config.titleConvo = envVars.TITLE_CONVO === 'true';
    if (envVars.SUMMARY_CONVO !== undefined) config.summaryConvo = envVars.SUMMARY_CONVO === 'true';
    
    // Caching
    if (envVars.STATIC_CACHE_MAX_AGE) config.staticCacheMaxAge = envVars.STATIC_CACHE_MAX_AGE;
    if (envVars.STATIC_CACHE_S_MAX_AGE) config.staticCacheSMaxAge = envVars.STATIC_CACHE_S_MAX_AGE;
    if (envVars.INDEX_CACHE_CONTROL) config.indexCacheControl = envVars.INDEX_CACHE_CONTROL;
    if (envVars.INDEX_PRAGMA) config.indexPragma = envVars.INDEX_PRAGMA;
    if (envVars.INDEX_EXPIRES) config.indexExpires = envVars.INDEX_EXPIRES;
    
    // MCP OAuth
    if (envVars.MCP_OAUTH_ON_AUTH_ERROR) config.mcpOauthOnAuthError = envVars.MCP_OAUTH_ON_AUTH_ERROR;
    if (envVars.MCP_OAUTH_DETECTION_TIMEOUT) config.mcpOauthDetectionTimeout = parseInt(envVars.MCP_OAUTH_DETECTION_TIMEOUT);
    
    // Code Execution
    if (envVars.LIBRECHAT_CODE_API_KEY) config.librechatCodeApiKey = envVars.LIBRECHAT_CODE_API_KEY;
    if (envVars.LIBRECHAT_CODE_BASEURL) config.librechatCodeBaseUrl = envVars.LIBRECHAT_CODE_BASEURL;
    if (envVars.E2B_API_KEY) config.e2bApiKey = envVars.E2B_API_KEY;
    if (envVars.E2B_PROXY_ENABLED !== undefined) config.e2bProxyEnabled = envVars.E2B_PROXY_ENABLED === 'true';
    if (envVars.E2B_PROXY_PORT) config.e2bProxyPort = parseInt(envVars.E2B_PROXY_PORT);
    if (envVars.E2B_PUBLIC_BASE_URL) config.e2bPublicBaseUrl = envVars.E2B_PUBLIC_BASE_URL;
    if (envVars.E2B_FILE_TTL_DAYS) config.e2bFileTTLDays = parseInt(envVars.E2B_FILE_TTL_DAYS);
    if (envVars.E2B_MAX_FILE_SIZE) config.e2bMaxFileSize = parseInt(envVars.E2B_MAX_FILE_SIZE);
    if (envVars.E2B_PER_USER_SANDBOX !== undefined) config.e2bPerUserSandbox = envVars.E2B_PER_USER_SANDBOX === 'true';
    
    // Artifacts
    if (envVars.SANDPACK_BUNDLER_URL) config.sandpackBundlerUrl = envVars.SANDPACK_BUNDLER_URL;
    
    // User Management
    if (envVars.UID) config.uid = parseInt(envVars.UID);
    if (envVars.GID) config.gid = parseInt(envVars.GID);
    
    // Debug
    if (envVars.DEBUG_LOGGING !== undefined) config.debugLogging = envVars.DEBUG_LOGGING === 'true';
    if (envVars.DEBUG_CONSOLE !== undefined) config.debugConsole = envVars.DEBUG_CONSOLE === 'true';
    if (envVars.CONSOLE_JSON !== undefined) config.consoleJSON = envVars.CONSOLE_JSON === 'true';
    
    // Miscellaneous
    if (envVars.CDN_PROVIDER) config.cdnProvider = envVars.CDN_PROVIDER;
    if (envVars.OCR_API_KEY) config.ocrApiKey = envVars.OCR_API_KEY;
    if (envVars.OCR_BASEURL) config.ocrApiBase = envVars.OCR_BASEURL;
    
    // STT/TTS nested objects
    if (envVars.STT_API_KEY) {
      config.stt = config.stt || {};
      config.stt.apiKey = envVars.STT_API_KEY;
    }
    if (envVars.TTS_API_KEY) {
      config.tts = config.tts || {};
      config.tts.apiKey = envVars.TTS_API_KEY;
    }
    
    // Subdirectory Hosting
    if (envVars.BASE_PATH) config.basePath = envVars.BASE_PATH;
    if (envVars.APP_URL) config.appUrl = envVars.APP_URL;
    if (envVars.PUBLIC_SUB_PATH) config.publicSubPath = envVars.PUBLIC_SUB_PATH;
    
    return config;
  };

  const mapYamlToConfiguration = (yamlData: any) => {
    const config: any = {};
    
    // Helper: Check if a value is an env var placeholder like "${OPENAI_API_KEY}"
    // These should be skipped during import since they're just references
    const isEnvPlaceholder = (value: any): boolean => {
      return typeof value === 'string' && value.startsWith('${') && value.endsWith('}');
    };
    
    // Basic settings
    if (yamlData.version) config.version = yamlData.version;
    if (yamlData.cache !== undefined) config.cache = yamlData.cache;
    
    // MCP Servers
    if (yamlData.mcpServers) {
      config.mcpServers = Object.entries(yamlData.mcpServers).map(([name, server]: [string, any]) => ({
        name,
        type: server.type || 'streamable-http',
        url: server.url || '',
        timeout: server.timeout || 30000,
        headers: server.headers || {},
        env: server.env || {},
        instructions: server.serverInstructions || server.instructions || ''
      }));
    }
    
    // UI Settings
    if (yamlData.ui) {
      if (yamlData.ui.modelSelect !== undefined) config.showModelSelect = yamlData.ui.modelSelect;
      if (yamlData.ui.parameters !== undefined) config.showParameters = yamlData.ui.parameters;
      if (yamlData.ui.sidePanel !== undefined) config.showSidePanel = yamlData.ui.sidePanel;
      if (yamlData.ui.presets !== undefined) config.showPresets = yamlData.ui.presets;
      if (yamlData.ui.prompts !== undefined) config.showPrompts = yamlData.ui.prompts;
      if (yamlData.ui.bookmarks !== undefined) config.showBookmarks = yamlData.ui.bookmarks;
      if (yamlData.ui.multiConvo !== undefined) config.showMultiConvo = yamlData.ui.multiConvo;
      if (yamlData.ui.agents !== undefined) config.showAgents = yamlData.ui.agents;
      if (yamlData.ui.webSearch !== undefined) config.showWebSearch = yamlData.ui.webSearch;
      if (yamlData.ui.fileSearch !== undefined) config.showFileSearch = yamlData.ui.fileSearch;
      if (yamlData.ui.fileCitations !== undefined) config.showFileCitations = yamlData.ui.fileCitations;
      if (yamlData.ui.runCode !== undefined) config.showRunCode = yamlData.ui.runCode;
    }
    
    // Agent Configuration
    if (yamlData.agents) {
      if (yamlData.agents.defaultRecursionLimit) config.agentDefaultRecursionLimit = yamlData.agents.defaultRecursionLimit;
      if (yamlData.agents.maxRecursionLimit) config.agentMaxRecursionLimit = yamlData.agents.maxRecursionLimit;
      if (yamlData.agents.allowedProviders) config.agentAllowedProviders = yamlData.agents.allowedProviders;
      if (yamlData.agents.allowedCapabilities) config.agentAllowedCapabilities = yamlData.agents.allowedCapabilities;
      if (yamlData.agents.citations) {
        if (yamlData.agents.citations.totalLimit) config.agentCitationsTotalLimit = yamlData.agents.citations.totalLimit;
        if (yamlData.agents.citations.perFileLimit) config.agentCitationsPerFileLimit = yamlData.agents.citations.perFileLimit;
        if (yamlData.agents.citations.threshold !== undefined) config.agentCitationsThreshold = yamlData.agents.citations.threshold;
      }
    }
    
    // Rate Limits
    if (yamlData.rateLimits) {
      if (yamlData.rateLimits.perUser) config.rateLimitsPerUser = yamlData.rateLimits.perUser;
      if (yamlData.rateLimits.perIP) config.rateLimitsPerIP = yamlData.rateLimits.perIP;
      // Handle both 'uploads' and 'fileUploads' (LibreChat RC4 alias)
      if (yamlData.rateLimits.uploads) config.rateLimitsUploads = yamlData.rateLimits.uploads;
      if (yamlData.rateLimits.fileUploads) config.rateLimitsUploads = yamlData.rateLimits.fileUploads;
      // Handle both 'imports' and 'conversationsImport' (LibreChat RC4 alias)
      if (yamlData.rateLimits.imports) config.rateLimitsImports = yamlData.rateLimits.imports;
      if (yamlData.rateLimits.conversationsImport) config.rateLimitsImports = yamlData.rateLimits.conversationsImport;
      if (yamlData.rateLimits.tts) config.rateLimitsTTS = yamlData.rateLimits.tts;
      if (yamlData.rateLimits.stt) config.rateLimitsSTT = yamlData.rateLimits.stt;
    }
    
    // File Configuration (complete mapping for all endpoints)
    if (yamlData.fileConfig) {
      config.fileConfig = { endpoints: {} };
      if (yamlData.fileConfig.endpoints) {
        // Map all endpoint file configs
        Object.entries(yamlData.fileConfig.endpoints).forEach(([endpointName, limits]: [string, any]) => {
          config.fileConfig.endpoints[endpointName] = {
            disabled: limits.disabled,
            fileLimit: limits.fileLimit,
            fileSizeLimit: limits.fileSizeLimit,
            totalSizeLimit: limits.totalSizeLimit,
            supportedMimeTypes: limits.supportedMimeTypes
          };
        });
      }
      // Also map legacy fields for backward compatibility
      if (yamlData.fileConfig.endpoints?.openAI) {
        const fileConfig = yamlData.fileConfig.endpoints.openAI;
        if (fileConfig.fileLimit) config.filesMaxFilesPerRequest = fileConfig.fileLimit;
        if (fileConfig.fileSizeLimit) config.filesMaxSizeMB = fileConfig.fileSizeLimit;
        if (fileConfig.supportedMimeTypes) config.filesAllowedMimeTypes = fileConfig.supportedMimeTypes;
      }
      if (yamlData.fileConfig.serverFileSizeLimit) config.filesServerMaxSize = yamlData.fileConfig.serverFileSizeLimit;
      if (yamlData.fileConfig.avatarSizeLimit) config.filesAvatarSize = yamlData.fileConfig.avatarSizeLimit;
      // LibreChat RC4 clientImageResize field
      if (yamlData.fileConfig.clientImageResize !== undefined) config.filesClientImageResize = yamlData.fileConfig.clientImageResize;
    }
    
    // Search Configuration (legacy - kept for backward compatibility)
    if (yamlData.search) {
      if (yamlData.search.provider) config.searchProvider = yamlData.search.provider;
      if (yamlData.search.scraper) config.searchScraper = yamlData.search.scraper;
      if (yamlData.search.reranker) config.searchReranker = yamlData.search.reranker;
      if (yamlData.search.safeSearch !== undefined) config.searchSafeSearch = yamlData.search.safeSearch;
      if (yamlData.search.timeout) config.searchTimeout = yamlData.search.timeout;
    }
    
    // Web Search Configuration (NEW - RC4 nested structure)
    if (yamlData.webSearch) {
      config.webSearch = config.webSearch || {};
      if (yamlData.webSearch.searchProvider) config.webSearch.searchProvider = yamlData.webSearch.searchProvider;
      if (yamlData.webSearch.scraperType) config.webSearch.scraperType = yamlData.webSearch.scraperType;
      if (yamlData.webSearch.rerankerType) config.webSearch.rerankerType = yamlData.webSearch.rerankerType;
      if (yamlData.webSearch.serperApiKey && !isEnvPlaceholder(yamlData.webSearch.serperApiKey)) config.webSearch.serperApiKey = yamlData.webSearch.serperApiKey;
      if (yamlData.webSearch.searxngInstanceUrl && !isEnvPlaceholder(yamlData.webSearch.searxngInstanceUrl)) config.webSearch.searxngInstanceUrl = yamlData.webSearch.searxngInstanceUrl;
      if (yamlData.webSearch.searxngApiKey && !isEnvPlaceholder(yamlData.webSearch.searxngApiKey)) config.webSearch.searxngApiKey = yamlData.webSearch.searxngApiKey;
      if (yamlData.webSearch.braveApiKey && !isEnvPlaceholder(yamlData.webSearch.braveApiKey)) config.webSearch.braveApiKey = yamlData.webSearch.braveApiKey;
      if (yamlData.webSearch.tavilyApiKey && !isEnvPlaceholder(yamlData.webSearch.tavilyApiKey)) config.webSearch.tavilyApiKey = yamlData.webSearch.tavilyApiKey;
      if (yamlData.webSearch.perplexityApiKey && !isEnvPlaceholder(yamlData.webSearch.perplexityApiKey)) config.webSearch.perplexityApiKey = yamlData.webSearch.perplexityApiKey;
      if (yamlData.webSearch.googleSearchApiKey && !isEnvPlaceholder(yamlData.webSearch.googleSearchApiKey)) config.webSearch.googleSearchApiKey = yamlData.webSearch.googleSearchApiKey;
      if (yamlData.webSearch.googleCSEId && !isEnvPlaceholder(yamlData.webSearch.googleCSEId)) config.webSearch.googleCSEId = yamlData.webSearch.googleCSEId;
      if (yamlData.webSearch.bingSearchApiKey && !isEnvPlaceholder(yamlData.webSearch.bingSearchApiKey)) config.webSearch.bingSearchApiKey = yamlData.webSearch.bingSearchApiKey;
      if (yamlData.webSearch.firecrawlApiKey && !isEnvPlaceholder(yamlData.webSearch.firecrawlApiKey)) config.webSearch.firecrawlApiKey = yamlData.webSearch.firecrawlApiKey;
      if (yamlData.webSearch.firecrawlApiUrl && !isEnvPlaceholder(yamlData.webSearch.firecrawlApiUrl)) config.webSearch.firecrawlApiUrl = yamlData.webSearch.firecrawlApiUrl;
      if (yamlData.webSearch.firecrawlOptions) config.webSearch.firecrawlOptions = yamlData.webSearch.firecrawlOptions;
      if (yamlData.webSearch.jinaApiKey && !isEnvPlaceholder(yamlData.webSearch.jinaApiKey)) config.webSearch.jinaApiKey = yamlData.webSearch.jinaApiKey;
      if (yamlData.webSearch.jinaApiUrl && !isEnvPlaceholder(yamlData.webSearch.jinaApiUrl)) config.webSearch.jinaApiUrl = yamlData.webSearch.jinaApiUrl;
      if (yamlData.webSearch.cohereApiKey && !isEnvPlaceholder(yamlData.webSearch.cohereApiKey)) config.webSearch.cohereApiKey = yamlData.webSearch.cohereApiKey;
      if (yamlData.webSearch.scraperTimeout) config.webSearch.scraperTimeout = yamlData.webSearch.scraperTimeout;
      if (yamlData.webSearch.safeSearch !== undefined) config.webSearch.safeSearch = yamlData.webSearch.safeSearch;
    }
    
    // Memory Configuration
    if (yamlData.memory) {
      config.memory = config.memory || {};
      // Handle both 'enabled' and 'disabled' (disabled is inverse of enabled)
      if (yamlData.memory.enabled !== undefined) config.memory.enabled = yamlData.memory.enabled;
      if (yamlData.memory.disabled !== undefined) config.memory.enabled = !yamlData.memory.disabled;
      // Handle both 'personalization' and 'personalize'
      if (yamlData.memory.personalization !== undefined) config.memory.personalization = yamlData.memory.personalization;
      if (yamlData.memory.personalize !== undefined) config.memory.personalization = yamlData.memory.personalize;
      // Handle both 'windowSize' and 'messageWindowSize'
      if (yamlData.memory.windowSize) config.memory.windowSize = yamlData.memory.windowSize;
      if (yamlData.memory.messageWindowSize) config.memory.windowSize = yamlData.memory.messageWindowSize;
      if (yamlData.memory.tokenLimit) config.memory.tokenLimit = yamlData.memory.tokenLimit;
      if (yamlData.memory.validKeys) config.memory.validKeys = yamlData.memory.validKeys;
      if (yamlData.memory.agent) config.memory.agent = yamlData.memory.agent;
    }
    
    // OCR Configuration
    if (yamlData.ocr) {
      config.ocr = config.ocr || {};
      if (yamlData.ocr.provider) config.ocr.provider = yamlData.ocr.provider;
      if (yamlData.ocr.model) config.ocr.model = yamlData.ocr.model;
      if (yamlData.ocr.baseURL) config.ocr.baseURL = yamlData.ocr.baseURL;
      if (yamlData.ocr.apiKey && !isEnvPlaceholder(yamlData.ocr.apiKey)) config.ocr.apiKey = yamlData.ocr.apiKey;
      // Legacy fields
      if (yamlData.ocr.apiBase) config.ocrApiBase = yamlData.ocr.apiBase;
    }
    
    // STT Configuration
    if (yamlData.stt) {
      config.stt = config.stt || {};
      if (yamlData.stt.provider) config.stt.provider = yamlData.stt.provider;
      if (yamlData.stt.model) config.stt.model = yamlData.stt.model;
      if (yamlData.stt.baseURL) config.stt.baseURL = yamlData.stt.baseURL;
      if (yamlData.stt.apiKey && !isEnvPlaceholder(yamlData.stt.apiKey)) config.stt.apiKey = yamlData.stt.apiKey;
      if (yamlData.stt.language) config.stt.language = yamlData.stt.language;
    }
    
    // TTS Configuration
    if (yamlData.tts) {
      config.tts = config.tts || {};
      if (yamlData.tts.provider) config.tts.provider = yamlData.tts.provider;
      if (yamlData.tts.model) config.tts.model = yamlData.tts.model;
      if (yamlData.tts.baseURL) config.tts.baseURL = yamlData.tts.baseURL;
      if (yamlData.tts.apiKey && !isEnvPlaceholder(yamlData.tts.apiKey)) config.tts.apiKey = yamlData.tts.apiKey;
      if (yamlData.tts.voice) config.tts.voice = yamlData.tts.voice;
      if (yamlData.tts.speed) config.tts.speed = yamlData.tts.speed;
      if (yamlData.tts.quality) config.tts.quality = yamlData.tts.quality;
      if (yamlData.tts.streaming !== undefined) config.tts.streaming = yamlData.tts.streaming;
    }
    
    // Speech (UI-level) Configuration
    if (yamlData.speech) {
      config.speech = config.speech || {};
      // speech.speechTab for UI settings
      if (yamlData.speech.speechTab) {
        config.speech.speechTab = {};
        const speechTab = yamlData.speech.speechTab;
        if (speechTab.conversationMode !== undefined) config.speech.speechTab.conversationMode = speechTab.conversationMode;
        if (speechTab.advancedMode !== undefined) config.speech.speechTab.advancedMode = speechTab.advancedMode;
        if (speechTab.speechToText) {
          config.speech.speechTab.speechToText = speechTab.speechToText;
        }
        if (speechTab.textToSpeech) {
          config.speech.speechTab.textToSpeech = speechTab.textToSpeech;
        }
      }
      // speech.stt and speech.tts (alternative location for STT/TTS config)
      if (yamlData.speech.stt) {
        config.stt = config.stt || {};
        Object.assign(config.stt, yamlData.speech.stt);
      }
      if (yamlData.speech.tts) {
        config.tts = config.tts || {};
        Object.assign(config.tts, yamlData.speech.tts);
      }
    }
    
    // Actions Configuration
    if (yamlData.actions?.allowedDomains) {
      config.actionsAllowedDomains = yamlData.actions.allowedDomains;
    }
    
    // Temporary Chats
    if (yamlData.temporaryChats?.retentionHours) {
      config.temporaryChatsRetentionHours = yamlData.temporaryChats.retentionHours;
    }
    
    // Interface settings
    if (yamlData.interface) {
      if (yamlData.interface.customWelcome) config.customWelcome = yamlData.interface.customWelcome;
      if (yamlData.interface.customFooter) config.customFooter = yamlData.interface.customFooter;
      if (yamlData.interface.defaultPreset) config.interfaceDefaultPreset = yamlData.interface.defaultPreset;
      if (yamlData.interface.uploadAsText !== undefined) config.uploadAsTextUI = yamlData.interface.uploadAsText;
      if (yamlData.interface.temporaryChatRetention) config.temporaryChatRetentionHours = yamlData.interface.temporaryChatRetention;
      // LibreChat RC4 UI toggle fields (these map to UI visibility settings)
      if (yamlData.interface.agents !== undefined) config.interfaceShowAgents = yamlData.interface.agents;
      if (yamlData.interface.modelSelect !== undefined) config.interfaceShowModelSelect = yamlData.interface.modelSelect;
      if (yamlData.interface.parameters !== undefined) config.interfaceShowParameters = yamlData.interface.parameters;
      if (yamlData.interface.sidePanel !== undefined) config.interfaceShowSidePanel = yamlData.interface.sidePanel;
      if (yamlData.interface.presets !== undefined) config.interfaceShowPresets = yamlData.interface.presets;
      if (yamlData.interface.prompts !== undefined) config.interfaceShowPrompts = yamlData.interface.prompts;
      if (yamlData.interface.bookmarks !== undefined) config.interfaceShowBookmarks = yamlData.interface.bookmarks;
      if (yamlData.interface.multiConvo !== undefined) config.interfaceShowMultiConvo = yamlData.interface.multiConvo;
      if (yamlData.interface.webSearch !== undefined) config.interfaceShowWebSearch = yamlData.interface.webSearch;
      if (yamlData.interface.fileSearch !== undefined) config.interfaceShowFileSearch = yamlData.interface.fileSearch;
      if (yamlData.interface.fileCitations !== undefined) config.interfaceShowFileCitations = yamlData.interface.fileCitations;
      if (yamlData.interface.runCode !== undefined) config.interfaceShowRunCode = yamlData.interface.runCode;
      if (yamlData.interface.artifacts !== undefined) config.interfaceShowArtifacts = yamlData.interface.artifacts;
    }
    
    // Model Specs Configuration
    if (yamlData.modelSpecs) {
      config.modelSpecs = config.modelSpecs || {};
      if (yamlData.modelSpecs.enforce !== undefined) config.modelSpecs.enforce = yamlData.modelSpecs.enforce;
      if (yamlData.modelSpecs.prioritize !== undefined) config.modelSpecs.prioritize = yamlData.modelSpecs.prioritize;
      if (yamlData.modelSpecs.list) config.modelSpecs.list = yamlData.modelSpecs.list;
      // Handle addedEndpoints from list[0].addedEndpoints structure
      if (yamlData.modelSpecs.list?.[0]?.addedEndpoints) {
        config.modelSpecs.addedEndpoints = yamlData.modelSpecs.list[0].addedEndpoints;
      }
    }
    
    // Filtered and Included Tools
    if (yamlData.filteredTools) config.filteredTools = yamlData.filteredTools;
    if (yamlData.includedTools) config.includedTools = yamlData.includedTools;
    
    // Endpoints Configuration
    if (yamlData.endpoints) {
      // Agents endpoint
      if (yamlData.endpoints.agents) {
        const agents = yamlData.endpoints.agents;
        if (agents.disableBuilder !== undefined) config.agentBuilderDisabled = agents.disableBuilder;
        if (agents.recursionLimit) config.agentDefaultRecursionLimit = agents.recursionLimit;
        if (agents.maxRecursionLimit) config.agentMaxRecursionLimit = agents.maxRecursionLimit;
        // LibreChat RC4 citation settings
        if (agents.maxCitations) config.agentMaxCitations = agents.maxCitations;
        if (agents.maxCitationsPerFile) config.agentMaxCitationsPerFile = agents.maxCitationsPerFile;
        if (agents.minRelevanceScore !== undefined) config.agentMinRelevanceScore = agents.minRelevanceScore;
        // Capabilities can be object or array
        if (agents.capabilities) {
          if (Array.isArray(agents.capabilities)) {
            // Array format: capabilities as array of strings - store as-is
            config.agentCapabilitiesArray = agents.capabilities;
          } else if (typeof agents.capabilities === 'object') {
            // Object format: capabilities as key-value pairs
            if (agents.capabilities.codeInterpreter !== undefined) config.codeInterpreterEnabled = agents.capabilities.codeInterpreter;
            if (agents.capabilities.actions !== undefined) config.actionsEnabled = agents.capabilities.actions;
            if (agents.capabilities.fileSearch !== undefined) config.fileSearchEnabled = agents.capabilities.fileSearch;
            if (agents.capabilities.uploadAsText !== undefined) config.uploadAsTextAgent = agents.capabilities.uploadAsText;
          }
        }
      }
      
      // OpenAI endpoint
      if (yamlData.endpoints.openAI) {
        const openAIConfig = yamlData.endpoints.openAI;
        if (openAIConfig.titleConvo !== undefined) {
          config.endpointDefaults = { ...config.endpointDefaults, titling: openAIConfig.titleConvo };
        }
        if (openAIConfig.titleModel) {
          config.endpointDefaults = { ...config.endpointDefaults, titleModel: openAIConfig.titleModel };
        }
        if (openAIConfig.models?.default?.[0]) {
          config.defaultModel = openAIConfig.models.default[0];
        }
        // LibreChat RC4 additional fields
        if (openAIConfig.title) config.endpointOpenAITitle = openAIConfig.title;
        if (openAIConfig.apiKey && !isEnvPlaceholder(openAIConfig.apiKey)) config.endpointOpenAIApiKey = openAIConfig.apiKey;
        if (openAIConfig.baseURL) config.endpointOpenAIBaseURL = openAIConfig.baseURL;
        if (openAIConfig.dropParams) config.endpointOpenAIDropParams = openAIConfig.dropParams;
        if (openAIConfig.summaryModel) config.endpointOpenAISummaryModel = openAIConfig.summaryModel;
      }
      
      // Custom endpoints (array of endpoint configurations)
      if (yamlData.endpoints.custom) {
        // Deep clone and strip env placeholders from apiKey fields
        config.customEndpoints = yamlData.endpoints.custom.map((endpoint: any) => {
          const cleaned = { ...endpoint };
          if (cleaned.apiKey && isEnvPlaceholder(cleaned.apiKey)) {
            delete cleaned.apiKey;  // Remove env placeholder apiKey
          }
          return cleaned;
        });
      }
    }
    
    return config;
  };

  const handleImportProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const profileData = JSON.parse(event.target?.result as string);
            
            // Validate configuration structure
            if (!profileData.configuration) {
              throw new Error("Invalid configuration format: missing configuration data");
            }

            // ✨ NEW: Check version compatibility if metadata exists
            if (profileData.metadata) {
              const { checkVersionCompatibility } = await import("@shared/version");
              const compatibility = checkVersionCompatibility(profileData.metadata);
              
              if (compatibility.warnings.length > 0) {
                console.log("⚠️ [VERSION CHECK] Import compatibility warnings:");
                compatibility.warnings.forEach(w => console.log(`   - ${w}`));
                
                // Show version warning toast
                toast({
                  title: "⚠️ Version Mismatch Detected",
                  description: compatibility.warnings[0], // Show first warning
                  variant: "default",
                });
              }
            }

            console.log("📥 [CONFIG DEBUG] Loading configuration:");
            console.log("   - Name:", profileData.name);
            console.log("   - Config keys:", profileData.configuration ? Object.keys(profileData.configuration) : 'NO CONFIG');
            console.log("   - MCP servers count:", profileData.configuration?.mcpServers?.length || 0);
            console.log("   - MCP servers:", profileData.configuration?.mcpServers);
            
            // Validate structure - check for misplaced nested fields
            const webSearchFields = ['searchProvider', 'scraperType', 'rerankerType', 'serperApiKey', 
              'searxngInstanceUrl', 'searxngApiKey', 'braveApiKey', 'tavilyApiKey', 'perplexityApiKey',
              'googleSearchApiKey', 'googleCSEId', 'bingSearchApiKey', 'firecrawlApiKey', 'firecrawlApiUrl',
              'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'scraperTimeout', 'safeSearch'];
            
            const incomingConfig = profileData.configuration;
            const topLevelWebSearchFields = webSearchFields.filter(field => field in incomingConfig);
            
            if (topLevelWebSearchFields.length > 0) {
              console.error("❌ [IMPORT VALIDATION] Structure error - webSearch fields at top level:", topLevelWebSearchFields);
              toast({
                title: "❌ Invalid Configuration Structure",
                description: `Web search fields (${topLevelWebSearchFields.slice(0, 3).join(', ')}...) should be nested under "webSearch" key. Check console for correct format.`,
                variant: "destructive",
              });
              console.log(`Correct structure:\n{\n  "configuration": {\n    "webSearch": {\n      "searchProvider": "searxng",\n      ...\n    }\n  }\n}`);
              return; // Don't proceed with import
            }
            
            // Apply the configuration and name
            const importedName = profileData.name || `Imported ${new Date().toLocaleDateString()}`;
            updateConfiguration({ ...profileData.configuration, configurationName: importedName });
            
            toast({
              title: "Configuration Imported", 
              description: `Configuration "${importedName}" loaded successfully.`,
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Failed to import configuration. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportMerge = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const profileData = JSON.parse(event.target?.result as string);
            
            // Validate configuration structure
            if (!profileData.configuration) {
              throw new Error("Invalid configuration format: missing configuration data");
            }

            // ✨ NEW: Check version compatibility if metadata exists
            if (profileData.metadata) {
              const { checkVersionCompatibility } = await import("@shared/version");
              const compatibility = checkVersionCompatibility(profileData.metadata);
              
              if (compatibility.warnings.length > 0) {
                console.log("⚠️ [VERSION CHECK] Import compatibility warnings:");
                compatibility.warnings.forEach(w => console.log(`   - ${w}`));
                
                // Show version warning toast
                toast({
                  title: "⚠️ Version Mismatch Detected",
                  description: compatibility.warnings[0], // Show first warning
                  variant: "default",
                });
              }
            }

            // Collect imported field names for display
            const importedFields = Object.keys(profileData.configuration);
            
            // Validate structure - check for misplaced nested fields
            const webSearchFields = ['searchProvider', 'scraperType', 'rerankerType', 'serperApiKey', 
              'searxngInstanceUrl', 'searxngApiKey', 'braveApiKey', 'tavilyApiKey', 'perplexityApiKey',
              'googleSearchApiKey', 'googleCSEId', 'bingSearchApiKey', 'firecrawlApiKey', 'firecrawlApiUrl',
              'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'scraperTimeout', 'safeSearch'];
            
            const structureWarnings: string[] = [];
            const incomingConfig = profileData.configuration;
            
            // Check if webSearch fields are at top level (wrong location)
            const topLevelWebSearchFields = webSearchFields.filter(field => field in incomingConfig);
            if (topLevelWebSearchFields.length > 0) {
              structureWarnings.push(
                `⚠️ Web Search fields at wrong level: ${topLevelWebSearchFields.join(', ')}.\n\n` +
                `These fields should be nested under "webSearch" key.\n\n` +
                `Correct structure:\n` +
                `{\n` +
                `  "configuration": {\n` +
                `    "webSearch": {\n` +
                `      "searchProvider": "searxng",\n` +
                `      "scraperType": "firecrawl",\n` +
                `      ...\n` +
                `    }\n` +
                `  }\n` +
                `}`
              );
            }
            
            // If there are structure warnings, show error instead of merging
            if (structureWarnings.length > 0) {
              toast({
                title: "❌ Invalid Configuration Structure",
                description: structureWarnings[0].split('\n').slice(0, 2).join(' '),
                variant: "destructive",
              });
              console.error("❌ [MERGE VALIDATION] Structure errors:", structureWarnings);
              return; // Don't proceed with merge
            }
            
            // Full import - replace entire configuration with incoming data
            // Apply the incoming configuration as complete replacement (including name)
            const configWithName = profileData.name 
              ? { ...profileData.configuration, configurationName: profileData.name }
              : profileData.configuration;
            updateConfiguration(configWithName, true);
            
            // Show detailed merge results
            setMergeDetails({
              name: profileData.name || file.name,
              fields: importedFields
            });
            setShowMergeResults(true);
            
          } catch (error) {
            toast({
              title: "Merge Failed",
              description: "Failed to merge configuration. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Validation function to detect unmapped YAML fields
  // This must mirror EXACTLY what mapYamlToConfiguration supports
  const validateYamlFields = (yamlData: any): { valid: boolean; unmappedFields: string[] } => {
    const unmappedFields: string[] = [];
    
    // Define all supported top-level YAML keys (matching mapYamlToConfiguration)
    const supportedTopLevelKeys = new Set([
      'version', 'cache', 'mcpServers', 'ui', 'agents', 'rateLimits', 'fileConfig',
      'search', 'webSearch', 'memory', 'ocr', 'stt', 'tts', 'speech', 'actions',
      'temporaryChats', 'interface', 'modelSpecs', 'filteredTools', 'includedTools', 'endpoints'
    ]);
    
    // Check top-level keys
    for (const key of Object.keys(yamlData)) {
      if (!supportedTopLevelKeys.has(key)) {
        unmappedFields.push(key);
      }
    }
    
    // Validate nested sections (matching mapYamlToConfiguration structure)
    
    // 1. mcpServers array - validate nested structure
    if (yamlData.mcpServers && typeof yamlData.mcpServers === 'object') {
      for (const [serverName, server] of Object.entries(yamlData.mcpServers)) {
        if (typeof server === 'object' && server !== null) {
          const supportedMCPKeys = new Set(['type', 'url', 'timeout', 'headers', 'env', 'serverInstructions', 'instructions']);
          for (const key of Object.keys(server as any)) {
            if (!supportedMCPKeys.has(key)) {
              unmappedFields.push(`mcpServers.${serverName}.${key}`);
            }
          }
        }
      }
    }
    
    // 2. UI section
    if (yamlData.ui) {
      const supportedUIKeys = new Set(['modelSelect', 'parameters', 'sidePanel', 'presets', 'prompts', 'bookmarks', 'multiConvo', 'agents', 'webSearch', 'fileSearch', 'fileCitations', 'runCode']);
      for (const key of Object.keys(yamlData.ui)) {
        if (!supportedUIKeys.has(key)) {
          unmappedFields.push(`ui.${key}`);
        }
      }
    }
    
    // 3. Agents section (top-level)
    if (yamlData.agents) {
      const supportedAgentsKeys = new Set(['defaultRecursionLimit', 'maxRecursionLimit', 'allowedProviders', 'allowedCapabilities', 'citations']);
      for (const key of Object.keys(yamlData.agents)) {
        if (!supportedAgentsKeys.has(key)) {
          unmappedFields.push(`agents.${key}`);
        }
      }
      // Agents citations
      if (yamlData.agents.citations) {
        const supportedCitationsKeys = new Set(['totalLimit', 'perFileLimit', 'threshold']);
        for (const key of Object.keys(yamlData.agents.citations)) {
          if (!supportedCitationsKeys.has(key)) {
            unmappedFields.push(`agents.citations.${key}`);
          }
        }
      }
    }
    
    // 4. Rate Limits section
    if (yamlData.rateLimits) {
      const supportedRateLimitsKeys = new Set(['perUser', 'perIP', 'uploads', 'fileUploads', 'imports', 'conversationsImport', 'tts', 'stt']);
      for (const key of Object.keys(yamlData.rateLimits)) {
        if (!supportedRateLimitsKeys.has(key)) {
          unmappedFields.push(`rateLimits.${key}`);
        }
      }
    }
    
    // 5. FileConfig section - note structure change!
    if (yamlData.fileConfig) {
      const supportedFileConfigTopKeys = new Set(['endpoints', 'serverFileSizeLimit', 'avatarSizeLimit', 'clientImageResize']);
      for (const key of Object.keys(yamlData.fileConfig)) {
        if (!supportedFileConfigTopKeys.has(key)) {
          unmappedFields.push(`fileConfig.${key}`);
        }
      }
      // FileConfig.endpoints nested structure
      if (yamlData.fileConfig.endpoints) {
        for (const [endpointName, limits] of Object.entries(yamlData.fileConfig.endpoints)) {
          if (typeof limits === 'object' && limits !== null) {
            const supportedLimitKeys = new Set(['disabled', 'fileLimit', 'fileSizeLimit', 'totalSizeLimit', 'supportedMimeTypes']);
            for (const key of Object.keys(limits as any)) {
              if (!supportedLimitKeys.has(key)) {
                unmappedFields.push(`fileConfig.endpoints.${endpointName}.${key}`);
              }
            }
          }
        }
      }
    }
    
    // 6. Search section (LEGACY but still mapped for backward compatibility)
    if (yamlData.search) {
      const supportedSearchKeys = new Set(['provider', 'scraper', 'reranker', 'safeSearch', 'timeout']);
      for (const key of Object.keys(yamlData.search)) {
        if (!supportedSearchKeys.has(key)) {
          unmappedFields.push(`search.${key}`);
        }
      }
    }
    
    // 14. Interface section
    if (yamlData.interface) {
      const supportedInterfaceKeys = new Set([
        'customWelcome', 'customFooter', 'defaultPreset', 'uploadAsText', 'temporaryChatRetention', 
        'mcpServers', 'privacyPolicy', 'termsOfService',
        // LibreChat RC4 UI toggle fields
        'agents', 'modelSelect', 'parameters', 'sidePanel', 'presets', 'prompts', 'bookmarks', 
        'multiConvo', 'webSearch', 'fileSearch', 'fileCitations', 'runCode', 'artifacts'
      ]);
      for (const key of Object.keys(yamlData.interface)) {
        if (!supportedInterfaceKeys.has(key)) {
          unmappedFields.push(`interface.${key}`);
        }
      }
    }
    
    // 15. WebSearch section (complete nested object)
    if (yamlData.webSearch) {
      const supportedWebSearchKeys = new Set([
        'searchProvider', 'scraperType', 'rerankerType', 'serperApiKey', 'searxngInstanceUrl',
        'searxngApiKey', 'braveApiKey', 'tavilyApiKey', 'perplexityApiKey', 'googleSearchApiKey',
        'googleCSEId', 'bingSearchApiKey', 'firecrawlApiKey', 'firecrawlApiUrl', 'firecrawlOptions',
        'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'scraperTimeout', 'safeSearch'
      ]);
      for (const key of Object.keys(yamlData.webSearch)) {
        if (!supportedWebSearchKeys.has(key)) {
          unmappedFields.push(`webSearch.${key}`);
        }
      }
    }
    
    // 7. Memory section
    if (yamlData.memory) {
      const supportedMemoryKeys = new Set([
        'enabled', 'disabled', // disabled is alias for !enabled
        'personalization', 'personalize', // personalize is alias for personalization
        'windowSize', 'messageWindowSize', // messageWindowSize is alias for windowSize
        'tokenLimit', 'validKeys', 'agent'
      ]);
      for (const key of Object.keys(yamlData.memory)) {
        if (!supportedMemoryKeys.has(key)) {
          unmappedFields.push(`memory.${key}`);
        }
      }
      // Memory.agent nested object (NOT validated deeply - accepted as-is per mapYamlToConfiguration)
      // Line 508: if (yamlData.memory.agent) config.memory.agent = yamlData.memory.agent;
    }
    
    // 8. OCR section
    if (yamlData.ocr) {
      const supportedOCRKeys = new Set(['provider', 'model', 'baseURL', 'apiKey', 'apiBase']);
      for (const key of Object.keys(yamlData.ocr)) {
        if (!supportedOCRKeys.has(key)) {
          unmappedFields.push(`ocr.${key}`);
        }
      }
    }
    
    // 9. STT section
    if (yamlData.stt) {
      const supportedSTTKeys = new Set(['provider', 'model', 'baseURL', 'apiKey', 'language']);
      for (const key of Object.keys(yamlData.stt)) {
        if (!supportedSTTKeys.has(key)) {
          unmappedFields.push(`stt.${key}`);
        }
      }
    }
    
    // 10. TTS section
    if (yamlData.tts) {
      const supportedTTSKeys = new Set(['provider', 'model', 'baseURL', 'apiKey', 'voice', 'speed', 'quality', 'streaming']);
      for (const key of Object.keys(yamlData.tts)) {
        if (!supportedTTSKeys.has(key)) {
          unmappedFields.push(`tts.${key}`);
        }
      }
    }
    
    // 11. Speech section
    if (yamlData.speech) {
      const supportedSpeechKeys = new Set(['speechTab', 'stt', 'tts']); // stt and tts can be under speech
      for (const key of Object.keys(yamlData.speech)) {
        if (!supportedSpeechKeys.has(key)) {
          unmappedFields.push(`speech.${key}`);
        }
      }
      // Speech.speechTab nested object
      if (yamlData.speech.speechTab) {
        const supportedSpeechTabKeys = new Set(['conversationMode', 'advancedMode', 'speechToText', 'textToSpeech']);
        for (const key of Object.keys(yamlData.speech.speechTab)) {
          if (!supportedSpeechTabKeys.has(key)) {
            unmappedFields.push(`speech.speechTab.${key}`);
          }
        }
        // speechToText and textToSpeech are complex nested objects - accepted as-is per mapYamlToConfiguration
        // Lines 551-556: Direct assignment without deep validation
      }
      // speech.stt and speech.tts are validated same as top-level stt/tts but won't validate deeply here
      // They're accepted as-is if present
    }
    
    // 12. Actions section
    if (yamlData.actions) {
      const supportedActionsKeys = new Set(['allowedDomains']);
      for (const key of Object.keys(yamlData.actions)) {
        if (!supportedActionsKeys.has(key)) {
          unmappedFields.push(`actions.${key}`);
        }
      }
    }
    
    // 13. TemporaryChats section
    if (yamlData.temporaryChats) {
      const supportedTempChatsKeys = new Set(['retentionHours']);
      for (const key of Object.keys(yamlData.temporaryChats)) {
        if (!supportedTempChatsKeys.has(key)) {
          unmappedFields.push(`temporaryChats.${key}`);
        }
      }
    }
    
    // 16. ModelSpecs section
    if (yamlData.modelSpecs) {
      const supportedModelSpecsKeys = new Set(['enforce', 'prioritize', 'list']);
      for (const key of Object.keys(yamlData.modelSpecs)) {
        if (!supportedModelSpecsKeys.has(key)) {
          unmappedFields.push(`modelSpecs.${key}`);
        }
      }
      // modelSpecs.list is an array of complex objects - accepted as-is
      // mapYamlToConfiguration reads list[0].addedEndpoints but doesn't validate list structure
    }
    
    // 17. FilteredTools and IncludedTools (arrays accepted as-is)
    // These are validated at top level - no nested validation needed
    
    // 18. Endpoints section
    if (yamlData.endpoints) {
      // Support agents, openAI, and custom endpoints
      const supportedEndpoints = new Set(['agents', 'openAI', 'custom']);
      for (const key of Object.keys(yamlData.endpoints)) {
        if (!supportedEndpoints.has(key)) {
          unmappedFields.push(`endpoints.${key}`);
        }
      }
      
      // Validate agents endpoint configuration
      if (yamlData.endpoints.agents) {
        const supportedAgentsKeys = new Set([
          'disableBuilder', 'recursionLimit', 'maxRecursionLimit', 'capabilities',
          // Citation settings
          'maxCitations', 'maxCitationsPerFile', 'minRelevanceScore'
        ]);
        for (const key of Object.keys(yamlData.endpoints.agents)) {
          if (!supportedAgentsKeys.has(key)) {
            unmappedFields.push(`endpoints.agents.${key}`);
          }
        }
        // Agents capabilities - can be object OR array
        if (yamlData.endpoints.agents.capabilities) {
          if (Array.isArray(yamlData.endpoints.agents.capabilities)) {
            // Array format: capabilities as array of strings - accepted as-is
            // No deep validation for array elements
          } else if (typeof yamlData.endpoints.agents.capabilities === 'object') {
            // Object format: capabilities as key-value pairs
            const supportedCapKeys = new Set(['codeInterpreter', 'actions', 'fileSearch', 'uploadAsText']);
            for (const key of Object.keys(yamlData.endpoints.agents.capabilities)) {
              if (!supportedCapKeys.has(key)) {
                unmappedFields.push(`endpoints.agents.capabilities.${key}`);
              }
            }
          }
        }
      }
      
      // Validate openAI endpoint configuration
      if (yamlData.endpoints.openAI) {
        const supportedOpenAIKeys = new Set([
          'titleConvo', 'titleModel', 'models',
          // Additional LibreChat RC4 fields
          'title', 'apiKey', 'baseURL', 'dropParams', 'summaryModel'
        ]);
        for (const key of Object.keys(yamlData.endpoints.openAI)) {
          if (!supportedOpenAIKeys.has(key)) {
            unmappedFields.push(`endpoints.openAI.${key}`);
          }
        }
        // Validate models nested structure
        if (yamlData.endpoints.openAI.models) {
          const supportedModelsKeys = new Set(['default', 'fetch', 'userIdQuery']);
          for (const key of Object.keys(yamlData.endpoints.openAI.models)) {
            if (!supportedModelsKeys.has(key)) {
              unmappedFields.push(`endpoints.openAI.models.${key}`);
            }
          }
        }
      }
      
      // custom endpoints are arrays - accepted as-is without deep validation
    }
    
    return {
      valid: unmappedFields.length === 0,
      unmappedFields
    };
  };

  const handleImportYaml = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".yaml,.yml";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("📥 [YAML IMPORT] Parsing YAML file:", file.name);
            const yamlContent = event.target?.result as string;
            const yamlData = yaml.load(yamlContent) as any;
            
            console.log("   - Parsed YAML data:", yamlData);
            
            // VALIDATION: Check for unmapped fields BEFORE importing
            const validation = validateYamlFields(yamlData);
            if (!validation.valid) {
              console.error("❌ [YAML IMPORT] Unmapped fields detected:", validation.unmappedFields);
              
              // Show detailed list in console
              console.log("\n🚫 IMPORT REJECTED - Unsupported YAML Fields:");
              console.log("================================================");
              validation.unmappedFields.forEach((field, index) => {
                console.log(`${index + 1}. ${field}`);
              });
              console.log("\n💡 Next Steps:");
              console.log("   1. Report these fields so they can be added to the tool");
              console.log("   2. OR remove unsupported fields from your YAML file");
              console.log("   3. Then retry the import\n");
              
              // Show permanent dialog with unsupported fields
              setUnsupportedFieldsData({
                type: 'yaml',
                fields: validation.unmappedFields
              });
              setShowUnsupportedFieldsDialog(true);
              
              return; // BLOCK IMPORT
            }
            
            const configUpdates = mapYamlToConfiguration(yamlData);
            console.log("   - Mapped configuration:", configUpdates);
            console.log("   - MCP servers found:", configUpdates.mcpServers?.length || 0);
            
            // Analyze what changed
            const analysis = analyzeConfigurationChanges(configuration, configUpdates);
            
            // Update configuration with parsed data
            updateConfiguration(configUpdates);
            
            // Show detailed import summary
            setImportSummaryData({
              type: 'yaml',
              fileName: file.name,
              ...analysis
            });
            setShowImportSummary(true);
          } catch (error) {
            console.error("YAML import error:", error);
            toast({
              title: "Import Failed",
              description: "Failed to parse YAML file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Validation function to detect unmapped environment variables
  const validateEnvVars = (envVars: Record<string, string>): { valid: boolean; unmappedVars: string[] } => {
    const unmappedVars: string[] = [];
    
    // Define all supported environment variable names (matching mapEnvToConfiguration)
    const supportedEnvVars = new Set([
      // App Configuration
      'APP_TITLE', 'CUSTOM_WELCOME', 'CUSTOM_FOOTER', 'HELP_AND_FAQ_URL',
      // Server Configuration
      'HOST', 'PORT', 'ENDPOINTS', 'NODE_ENV', 'DOMAIN_CLIENT', 'DOMAIN_SERVER', 'NO_INDEX',
      // Security Configuration
      'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CREDS_KEY', 'CREDS_IV', 'MIN_PASSWORD_LENGTH',
      'EMAIL_VERIFICATION_REQUIRED', 'ALLOW_UNVERIFIED_EMAIL_LOGIN', 'SESSION_EXPIRY', 'REFRESH_TOKEN_EXPIRY',
      // Database Configuration
      'MONGO_URI', 'MONGO_ROOT_USERNAME', 'MONGO_ROOT_PASSWORD', 'MONGO_DB_NAME',
      'REDIS_URI', 'REDIS_USERNAME', 'REDIS_PASSWORD', 'REDIS_KEY_PREFIX', 'REDIS_KEY_PREFIX_VAR',
      'REDIS_MAX_LISTENERS', 'REDIS_PING_INTERVAL', 'REDIS_USE_ALTERNATIVE_DNS_LOOKUP',
      // Authentication Configuration
      'ALLOW_REGISTRATION', 'ALLOW_EMAIL_LOGIN', 'ALLOW_SOCIAL_LOGIN', 'ALLOW_SOCIAL_REGISTRATION', 'ALLOW_PASSWORD_RESET',
      // Email Configuration
      'EMAIL_SERVICE', 'EMAIL_USERNAME', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_FROM_NAME',
      'MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'MAILGUN_HOST',
      // OAuth Providers
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL',
      'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL',
      'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_CALLBACK_URL',
      'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_CALLBACK_URL',
      'APPLE_CLIENT_ID', 'APPLE_PRIVATE_KEY', 'APPLE_KEY_ID', 'APPLE_TEAM_ID', 'APPLE_CALLBACK_URL',
      'OPENID_URL', 'OPENID_CLIENT_ID', 'OPENID_CLIENT_SECRET', 'OPENID_CALLBACK_URL',
      'OPENID_SCOPE', 'OPENID_SESSION_SECRET', 'OPENID_ISSUER', 'OPENID_BUTTON_LABEL', 'OPENID_IMAGE_URL',
      // Core AI API Keys
      'OPENAI_API_KEY', 'OPENAI_API_BASE', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'MISTRAL_API_KEY',
      // Extended AI API Keys
      'DEEPSEEK_API_KEY', 'PERPLEXITY_API_KEY', 'FIREWORKS_API_KEY', 'TOGETHERAI_API_KEY', 'HUGGINGFACE_TOKEN',
      'XAI_API_KEY', 'NVIDIA_API_KEY', 'SAMBANOVA_API_KEY', 'HYPERBOLIC_API_KEY', 'KLUSTER_API_KEY',
      'NANOGPT_API_KEY', 'GLHF_API_KEY', 'APIPIE_API_KEY', 'UNIFY_API_KEY', 'OPENROUTER_KEY',
      // Azure OpenAI
      'AZURE_API_KEY', 'AZURE_OPENAI_API_INSTANCE_NAME', 'AZURE_OPENAI_API_DEPLOYMENT_NAME',
      'AZURE_OPENAI_API_VERSION', 'AZURE_OPENAI_MODELS',
      // AWS Bedrock
      'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BEDROCK_REGION', 'AWS_ENDPOINT_URL', 'AWS_BUCKET_NAME',
      // File Storage
      'FILE_UPLOAD_PATH', 'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET', 'FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_APP_ID',
      'AZURE_STORAGE_CONNECTION_STRING', 'AZURE_STORAGE_PUBLIC_ACCESS', 'AZURE_CONTAINER_NAME',
      // Search & External APIs
      'GOOGLE_SEARCH_API_KEY', 'GOOGLE_CSE_ID', 'BING_SEARCH_API_KEY', 'OPENWEATHER_API_KEY',
      // Web Search (LibreChat webSearch section)
      'SERPER_API_KEY', 'SEARXNG_INSTANCE_URL', 'SEARXNG_API_KEY',
      'FIRECRAWL_API_KEY', 'FIRECRAWL_API_URL', 'JINA_API_KEY', 'JINA_API_URL', 'COHERE_API_KEY',
      // DALL-E Image Generation
      'DALLE_API_KEY', 'DALLE3_API_KEY', 'DALLE2_API_KEY', 'DALLE_REVERSE_PROXY',
      'DALLE3_BASEURL', 'DALLE2_BASEURL', 'DALLE3_SYSTEM_PROMPT', 'DALLE2_SYSTEM_PROMPT',
      // RAG API
      'RAG_API_URL', 'RAG_OPENAI_API_KEY', 'RAG_PORT', 'RAG_HOST', 'COLLECTION_NAME',
      'CHUNK_SIZE', 'CHUNK_OVERLAP', 'EMBEDDINGS_PROVIDER',
      // MeiliSearch
      'MEILISEARCH_URL', 'MEILISEARCH_MASTER_KEY', 'MEILI_NO_ANALYTICS',
      // Rate Limiting & Security
      'LIMIT_CONCURRENT_MESSAGES', 'CONCURRENT_MESSAGE_MAX', 'BAN_VIOLATIONS', 'BAN_DURATION', 'BAN_INTERVAL',
      'LOGIN_VIOLATION_SCORE', 'REGISTRATION_VIOLATION_SCORE', 'CONCURRENT_VIOLATION_SCORE',
      'MESSAGE_VIOLATION_SCORE', 'NON_BROWSER_VIOLATION_SCORE', 'LOGIN_MAX', 'LOGIN_WINDOW',
      // LDAP
      'LDAP_URL', 'LDAP_BIND_DN', 'LDAP_BIND_CREDENTIALS', 'LDAP_SEARCH_BASE', 'LDAP_SEARCH_FILTER',
      // Turnstile
      'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY',
      // Features
      'ALLOW_SHARED_LINKS', 'ALLOW_SHARED_LINKS_PUBLIC', 'TITLE_CONVO', 'SUMMARY_CONVO',
      // Caching
      'STATIC_CACHE_MAX_AGE', 'STATIC_CACHE_S_MAX_AGE', 'INDEX_CACHE_CONTROL', 'INDEX_PRAGMA', 'INDEX_EXPIRES',
      // MCP OAuth
      'MCP_OAUTH_ON_AUTH_ERROR', 'MCP_OAUTH_DETECTION_TIMEOUT',
      // Code Execution
      'LIBRECHAT_CODE_API_KEY', 'LIBRECHAT_CODE_BASEURL', 'E2B_API_KEY', 'E2B_PROXY_ENABLED',
      'E2B_PROXY_PORT', 'E2B_PUBLIC_BASE_URL', 'E2B_FILE_TTL_DAYS', 'E2B_MAX_FILE_SIZE', 'E2B_PER_USER_SANDBOX',
      // Artifacts
      'SANDPACK_BUNDLER_URL',
      // User Management
      'UID', 'GID',
      // Debug
      'DEBUG_LOGGING', 'DEBUG_CONSOLE', 'CONSOLE_JSON',
      // Miscellaneous
      'CDN_PROVIDER', 'OCR_API_KEY', 'OCR_BASEURL', 'STT_API_KEY', 'TTS_API_KEY',
      // Subdirectory Hosting
      'BASE_PATH', 'APP_URL', 'PUBLIC_SUB_PATH'
    ]);
    
    // Check each env var
    for (const varName of Object.keys(envVars)) {
      // Skip empty lines and comments
      if (!varName || varName.startsWith('#')) continue;
      
      if (!supportedEnvVars.has(varName)) {
        unmappedVars.push(varName);
      }
    }
    
    return {
      valid: unmappedVars.length === 0,
      unmappedVars
    };
  };

  const handleImportEnv = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".env";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("📥 [ENV IMPORT] Parsing ENV file:", file.name);
            const envContent = event.target?.result as string;
            const envVars = parseEnvFile(envContent);
            
            console.log("   - Parsed ENV vars:", Object.keys(envVars));
            
            // VALIDATION: Check for unmapped environment variables BEFORE importing
            const validation = validateEnvVars(envVars);
            if (!validation.valid) {
              console.error("❌ [ENV IMPORT] Unmapped environment variables detected:", validation.unmappedVars);
              
              // Show detailed list in console
              console.log("\n🚫 IMPORT REJECTED - Unsupported Environment Variables:");
              console.log("=========================================================");
              validation.unmappedVars.forEach((varName, index) => {
                console.log(`${index + 1}. ${varName}`);
              });
              console.log("\n💡 Next Steps:");
              console.log("   1. Report these variables so they can be added to the tool");
              console.log("   2. OR remove unsupported variables from your .env file");
              console.log("   3. Then retry the import\n");
              
              // Show permanent dialog with unsupported fields
              setUnsupportedFieldsData({
                type: 'env',
                fields: validation.unmappedVars
              });
              setShowUnsupportedFieldsDialog(true);
              
              return; // BLOCK IMPORT
            }
            
            const configUpdates = mapEnvToConfiguration(envVars);
            console.log("   - Mapped configuration:", configUpdates);
            
            // Analyze what changed
            const analysis = analyzeConfigurationChanges(configuration, configUpdates);
            
            // Update configuration with parsed data
            updateConfiguration(configUpdates);
            
            // Show detailed import summary
            setImportSummaryData({
              type: 'env',
              fileName: file.name,
              ...analysis
            });
            setShowImportSummary(true);
          } catch (error) {
            console.error("ENV import error:", error);
            toast({
              title: "Import Failed",
              description: "Failed to parse environment file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetToDefaults = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetToDefaults = () => {
    // Create reset configuration that preserves user secrets but resets settings to LibreChat defaults
    const resetConfig = createResetConfiguration(configuration);
    
    // Update configuration with LibreChat defaults
    updateConfiguration(resetConfig);
    
    toast({
      title: "Reset Complete", 
      description: "Configuration reset to LibreChat RC4 defaults while preserving your API keys and secrets.",
    });
    
    setShowResetConfirmation(false);
  };

  const handleLoadDemoConfiguration = () => {
    const demoConfig = loadDemoConfiguration();
    const verification = verifyConfiguration(demoConfig);
    
    toast({
      title: "Demo Configuration Loaded",
      description: `Loaded ${verification.current.populatedFields}/${verification.current.totalFields} fields (${verification.current.completionPercentage}% complete) with ALL toggles enabled for comprehensive testing.`,
    });
  };

  const handleRunSelfTest = () => {
    setShowSelfTestConfirmation(true);
  };

  const confirmRunSelfTest = async () => {
    setShowSelfTestConfirmation(false);
    try {
      // Verify current configuration first
      const verification = verifyConfiguration();
      console.log("🔍 [SELF-TEST] Configuration verification:", verification);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      let testsPassed = 0;
      let totalTests = 0;
      
      // Test 1: JSON Export Validation
      totalTests++;
      try {
        const profileData = {
          name: "SELF_TEST_PROFILE",
          configuration: configuration,
          version: "0.8.0-rc4",
          createdAt: new Date().toISOString()
        };
        const jsonString = JSON.stringify(profileData, null, 2);
        const parsedProfile = JSON.parse(jsonString);
        
        // Deep equality check between original and parsed configuration
        const configKeys = Object.keys(configuration);
        const parsedKeys = Object.keys(parsedProfile.configuration);
        
        if (configKeys.length !== parsedKeys.length) {
          errors.push(`JSON Export: Field count mismatch (${configKeys.length} vs ${parsedKeys.length})`);
        } else {
          let fieldMismatches = 0;
          for (const key of configKeys) {
            const original = configuration[key as keyof typeof configuration];
            const parsed = parsedProfile.configuration[key];
            if (JSON.stringify(original) !== JSON.stringify(parsed)) {
              fieldMismatches++;
              if (fieldMismatches <= 3) { // Log first 3 mismatches
                errors.push(`JSON Export: Field ${key} mismatch: ${JSON.stringify(original)} !== ${JSON.stringify(parsed)}`);
              }
            }
          }
          if (fieldMismatches === 0) {
            testsPassed++;
            console.log("✅ [SELF-TEST] JSON export validation passed");
          } else if (fieldMismatches > 3) {
            errors.push(`JSON Export: ${fieldMismatches - 3} additional field mismatches...`);
          }
        }
      } catch (error) {
        errors.push(`JSON Export: Parse error - ${error}`);
      }
      
      // Test 2: Package Generation and ENV File Validation
      totalTests++;
      try {
        const packageResult = await generatePackage({
          packageName: "SELF_TEST_PACKAGE",
          includeFiles: ["env", "yaml", "docker-compose", "install-script", "mongo-backup", "readme"]
        });
        
        const envContent = packageResult.files[".env"];
        if (!envContent) {
          errors.push("ENV Export: .env file not generated");
        } else {
          // Parse .env file back to object
          const envVars: Record<string, string> = {};
          const envLines = envContent.split('\n').filter((line: string) => 
            line.trim() && !line.trim().startsWith('#') && line.includes('=')
          );
          
          for (const line of envLines) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').trim();
            }
          }
          
          // Validate critical fields that should be present
          const criticalFields = [
            { configKey: 'appTitle', envKey: 'APP_TITLE' },
            { configKey: 'host', envKey: 'HOST' },
            { configKey: 'port', envKey: 'PORT' },
            { configKey: 'openaiApiKey', envKey: 'OPENAI_API_KEY' },
            { configKey: 'anthropicApiKey', envKey: 'ANTHROPIC_API_KEY' }
          ];
          
          let envMismatches = 0;
          for (const { configKey, envKey } of criticalFields) {
            const configValue = configuration[configKey as keyof typeof configuration];
            const envValue = envVars[envKey];
            
            if (configValue && !envValue) {
              envMismatches++;
              errors.push(`ENV Export: Missing ${envKey} for configured ${configKey}`);
            } else if (configValue && envValue && String(configValue) !== envValue) {
              envMismatches++;
              warnings.push(`ENV Export: Value mismatch for ${envKey}: config="${configValue}" env="${envValue}"`);
            }
          }
          
          if (envMismatches === 0) {
            testsPassed++;
            console.log("✅ [SELF-TEST] ENV export validation passed");
          }
          
          console.log(`📝 [SELF-TEST] ENV file: ${envLines.length} variables, ${envContent.length} chars`);
        }
      } catch (error) {
        errors.push(`ENV Export: Generation error - ${error}`);
      }
      
      // Test 3: YAML Export Validation  
      totalTests++;
      try {
        const packageResult = await generatePackage({
          packageName: "SELF_TEST_PACKAGE_YAML",
          includeFiles: ["yaml"]
        });
        
        const yamlContent = packageResult.files["librechat.yaml"];
        if (!yamlContent) {
          errors.push("YAML Export: librechat.yaml file not generated");
        } else {
          // Try to parse YAML content
          try {
            const parsedYaml = yaml.load(yamlContent) as any;
            if (parsedYaml && typeof parsedYaml === 'object') {
              testsPassed++;
              console.log("✅ [SELF-TEST] YAML export validation passed");
              console.log(`📄 [SELF-TEST] YAML file: ${yamlContent.split('\n').length} lines, ${yamlContent.length} chars`);
            } else {
              errors.push("YAML Export: Parsed YAML is not an object");
            }
          } catch (yamlError) {
            errors.push(`YAML Export: Parse error - ${yamlError}`);
          }
        }
      } catch (error) {
        errors.push(`YAML Export: Generation error - ${error}`);
      }
      
      // Compile results
      const selfTestResults = {
        summary: {
          testsPassed,
          totalTests,
          successRate: Math.round((testsPassed / totalTests) * 100),
          configurationFields: verification.current.populatedFields,
          totalFields: verification.current.totalFields,
          completionPercentage: verification.current.completionPercentage
        },
        errors,
        warnings,
        singleSourceOfTruth: testsPassed === totalTests,
        details: {
          configurationSize: JSON.stringify(configuration).length,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log("🎯 [COMPREHENSIVE SELF-TEST RESULTS]", selfTestResults);
      
      if (errors.length === 0) {
        toast({
          title: "✅ Export Functions Verified",
          description: `File generation working correctly! Current config: ${verification.current.populatedFields}/${verification.current.totalFields} fields (${verification.current.completionPercentage}%). All export formats (JSON, ENV, YAML) validated successfully.`,
        });
      } else {
        toast({
          title: `❌ Self-Test Failed (${testsPassed}/${totalTests})`,
          description: `${errors.length} errors, ${warnings.length} warnings. Check console for details. Single source of truth validation failed.`,
          variant: "destructive",
        });
      }
      
      return selfTestResults;
    } catch (error) {
      console.error("❌ [SELF-TEST] Critical failure:", error);
      toast({
        title: "Self-Test Critical Failure",
        description: "Test execution failed completely. Check console for detailed error information.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePackage = async () => {
    try {
      // Generate package name from configuration name (without .zip extension)
      const packageName = configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-').replace(/\s+/g, '-');
      
      const result = await generatePackage({
        includeFiles: ["env", "yaml", "docker-compose", "install-script", "mongo-backup", "readme"],
        packageName: packageName,
      });
      
      
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add each file to the ZIP (dynamically include all files from backend)
      Object.entries(result.files).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      
      // Generate ZIP file and download with Save As dialog
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const { downloadZIP } = await import("@/lib/download-utils");
      const filename = `${configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}.zip`;
      const success = await downloadZIP(zipBlob, filename);

      if (success) {
        toast({
          title: "Package Generated",
          description: "LibreChat installation package downloaded as ZIP file.",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate installation package.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cog text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    LibreChat Configuration Tool 
                    <span className="text-sm font-normal text-muted-foreground ml-2">v{getToolVersion()}</span>
                    <span className="text-sm font-normal text-muted-foreground mx-2">•</span>
                    <button 
                      onClick={() => setShowAboutDialog(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-about"
                    >
                      About
                    </button>
                    <span className="text-sm font-normal text-muted-foreground mx-2">•</span>
                    <a 
                      href="https://youtu.be/7NOCdZaukuM?si=lRFjX0mcHJpOT5Ey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-video-demo"
                    >
                      Video Demo
                    </a>
                  </h1>
                  <p className="text-sm text-muted-foreground">Currently supporting: LibreChat v{getVersionInfo().librechatTarget}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Configuration Name Input */}
              <div className="flex items-center space-x-3">
                <Label htmlFor="profile-name" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Configuration name:
                </Label>
                <Input
                  id="profile-name"
                  value={configuration.configurationName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateConfiguration({ configurationName: newName });
                  }}
                  className="text-lg font-medium w-72 border-border"
                  placeholder="Enter configuration name..."
                  data-testid="input-config-name"
                />
              </div>
              
              {/* Configuration Management Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" data-testid="button-profile-menu">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Configuration
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={handleSaveProfile} data-testid="menu-save">
                    <Save className="h-4 w-4 mr-2" />
                    Export LibreChat Configuration Settings (json)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleResetToDefaults} data-testid="menu-reset">
                    <Settings className="h-4 w-4 mr-2" />
                    Reset to LibreChat Defaults
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLoadDemoConfiguration} data-testid="menu-load-demo">
                    <Zap className="h-4 w-4 mr-2" />
                    Load Demo Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRunSelfTest} data-testid="menu-self-test">
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Comprehensive Self-Test
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleImportProfile} data-testid="menu-import-profile">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Full JSON (Replace All)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportMerge} data-testid="menu-import-merge">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Merge JSON (Preserve Existing)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportYaml} data-testid="menu-import-yaml">
                    <FileText className="h-4 w-4 mr-2" />
                    Import librechat.yaml
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportEnv} data-testid="menu-import-env">
                    <Settings className="h-4 w-4 mr-2" />
                    Import Environment File (.env)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="h-6 border-l border-border mx-2"></div>
              
              {/* Configuration History */}
              <ConfigurationHistory onConfigurationLoad={(loadedData) => {
                // Full replacement of configuration and name
                const configToLoad = loadedData.configuration || loadedData;
                if (loadedData.packageName) {
                  updateConfiguration({ ...configToLoad, configurationName: loadedData.packageName }, true);
                } else {
                  updateConfiguration(configToLoad, true);
                }
              }} />
              
              {/* Package Generation Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" data-testid="button-package-menu">
                    <Rocket className="h-4 w-4 mr-2" />
                    Package
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {isDemo && (
                    <>
                      <div className="px-3 py-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-l-4 border-amber-400 mx-2 my-2 rounded-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Online Hosted Demo</span>
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                          Go to GitHub to self-host securely for full functionality:
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" />
                          <a 
                            href="https://github.com/Fritsl/LibreChatConfigurator" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            github.com/Fritsl/LibreChatConfigurator
                          </a>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowPreview(true)} data-testid="menu-preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Individual files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGeneratePackage} data-testid="menu-generate">
                    <Download className="h-4 w-4 mr-2" />
                    Generate & Download ZIP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-full mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200">
                This is in Demo mode, running without backend, go to{" "}
                <a 
                  href="https://github.com/Fritsl/LibreChatConfigurator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-700 dark:text-red-300 underline hover:text-red-900 dark:hover:text-red-100 font-medium"
                  data-testid="link-demo-banner-github"
                >
                  github repository
                </a>
                {" "}to be able to create full one-click LibreChat installations
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1">
          <ConfigurationTabs 
            configuration={configuration}
            onConfigurationChange={updateConfiguration}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </main>
      </div>


      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          configuration={configuration}
          onClose={() => setShowPreview(false)}
          onGenerate={handleGeneratePackage}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <AlertDialogContent data-testid="dialog-reset-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to LibreChat Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset your configuration to LibreChat RC4 defaults?
              <br /><br />
              <strong>This will:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Reset all settings to official LibreChat defaults</li>
                <li>• <span className="text-green-600 font-medium">Preserve your API keys and secrets</span></li>
                <li>• Clear custom configurations, integrations, and preferences</li>
              </ul>
              <br />
              This action cannot be undone without re-importing your configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetToDefaults}
              data-testid="button-confirm-reset"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reset Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Self-Test Confirmation Dialog */}
      <AlertDialog open={showSelfTestConfirmation} onOpenChange={setShowSelfTestConfirmation}>
        <AlertDialogContent data-testid="dialog-selftest-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Run Comprehensive Self-Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to run the comprehensive self-test?
              <br /><br />
              <strong>This will:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <span className="text-red-600 font-medium">Overwrite all current content and configuration</span></li>
                <li>• Test JSON export validation with test data</li>
                <li>• Generate and validate ENV and YAML files</li>
                <li>• Run extensive package generation tests</li>
                <li>• <span className="text-amber-600 font-medium">Potentially generate large test files</span></li>
              </ul>
              <br />
              <strong className="text-red-600">WARNING:</strong> Your current configuration will be replaced with test data. Save your configuration first if you want to keep your current settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-selftest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRunSelfTest}
              data-testid="button-confirm-selftest"
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Yes, Run Self-Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-about">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About LibreChat Configuration Tool
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Purpose */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Purpose</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This tool simplifies LibreChat setup by providing an intuitive interface for configuring all LibreChat settings. 
                  Instead of manually editing complex configuration files, you can configure everything through a user-friendly interface 
                  and generate complete installation packages with one click.
                </p>
                <p>
                  The <strong>Package</strong> dropdown allows you to generate ready-to-deploy installation packages containing 
                  all necessary configuration files, Docker setup, and installation scripts - making LibreChat deployment as simple as 
                  downloading and running.
                </p>
              </div>
            </div>

            {/* Author Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Created by</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Frits Lyneborg</strong>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://fritslyneborg.dk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    data-testid="link-author-website"
                  >
                    fritslyneborg.dk
                  </a>
                </div>
              </div>
            </div>

            {/* Repository Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Official Repository</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://github.com/Fritsl/LibreChatConfigurator" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    data-testid="link-github-repository"
                  >
                    github.com/Fritsl/LibreChatConfigurator
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://github.com/Fritsl/LibreChatConfigurator/blob/main/README.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    data-testid="link-github-readme"
                  >
                    View detailed documentation (README.md)
                  </a>
                </div>
              </div>
            </div>

            {/* Usage Guidance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Recommended Usage</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Security Notice
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        To avoid exposing API keys and sensitive configuration data, it's strongly recommended to build and run this tool locally rather than using the hosted version.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p><strong>Recommended:</strong> Local deployment</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Full functionality including ZIP package generation</li>
                    <li>Secure handling of API keys and credentials</li>
                    <li>No data sent to external servers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p><strong>Alternative:</strong> Hosted version (Netlify)</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Great for testing and exploring features</li>
                    <li>Limited functionality (no ZIP package generation)</li>
                    <li>Should not be used with real API keys</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Getting Started
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        For local setup instructions, please see the Quick Start guide in the README file of the GitHub repository.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Configuration Tool v{getToolVersion()}</span>
                <span>Supporting LibreChat v{getVersionInfo().librechatTarget}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Results Dialog */}
      <Dialog open={showMergeResults} onOpenChange={setShowMergeResults}>
        <DialogContent className="max-w-2xl" data-testid="dialog-merge-results">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Configuration Merged Successfully
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-testid="merge-success-message">
              <p className="text-sm text-green-800 dark:text-green-200" data-testid="text-merge-source">
                Settings from <span className="font-semibold">{mergeDetails?.name}</span> have been merged into your configuration.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2" data-testid="text-merge-preserved">
                All other existing settings have been preserved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2" data-testid="text-imported-fields-count">Imported Fields ({mergeDetails?.fields.length || 0}):</h3>
              <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="list-imported-fields">
                <ul className="space-y-1">
                  {mergeDetails?.fields.map((field) => (
                    <li key={field} className="text-sm font-mono text-muted-foreground flex items-center gap-2" data-testid={`field-${field}`}>
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowMergeResults(false)} data-testid="button-close-merge-results">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsupported Fields Dialog */}
      <Dialog open={showUnsupportedFieldsDialog} onOpenChange={setShowUnsupportedFieldsDialog}>
        <DialogContent className="max-w-3xl" data-testid="dialog-unsupported-fields">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Import Blocked: Unsupported Fields Detected
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4" data-testid="unsupported-fields-warning">
              <p className="text-sm text-destructive" data-testid="text-unsupported-count">
                Your {unsupportedFieldsData?.type === 'yaml' ? 'YAML' : '.env'} file contains <span className="font-semibold">{unsupportedFieldsData?.fields.length || 0}</span> field{(unsupportedFieldsData?.fields.length || 0) > 1 ? 's' : ''} not yet supported by this tool.
              </p>
              <p className="text-sm text-destructive/80 mt-2">
                The import has been rejected to prevent data loss. These fields need to be added to the tool before your file can be imported.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm" data-testid="text-unsupported-fields-title">
                  Unsupported {unsupportedFieldsData?.type === 'yaml' ? 'YAML Fields' : 'Environment Variables'} ({unsupportedFieldsData?.fields.length || 0}):
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fieldsList = unsupportedFieldsData?.fields.join('\n') || '';
                    navigator.clipboard.writeText(fieldsList);
                    toast({
                      title: "Copied to Clipboard",
                      description: `${unsupportedFieldsData?.fields.length} field names copied.`,
                    });
                  }}
                  data-testid="button-copy-unsupported-fields"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copy List
                </Button>
              </div>
              
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto" data-testid="list-unsupported-fields">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap select-all">
                  {unsupportedFieldsData?.fields.map((field, index) => `${index + 1}. ${field}`).join('\n')}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Next Steps
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 ml-2">
                    <li>Click "Copy List" to copy all unsupported field names</li>
                    <li>Report these fields so they can be added to the tool</li>
                    <li className="text-xs mt-1 ml-6 text-blue-600 dark:text-blue-400">
                      Alternatively, remove these fields from your {unsupportedFieldsData?.type === 'yaml' ? 'YAML' : '.env'} file and retry the import
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUnsupportedFieldsDialog(false)}
                data-testid="button-close-unsupported-dialog"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Summary Dialog */}
      <Dialog open={showImportSummary} onOpenChange={setShowImportSummary}>
        <DialogContent className="max-w-2xl" data-testid="dialog-import-summary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Successful
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary Header */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-testid="import-summary-header">
              <p className="text-sm text-green-800 dark:text-green-200">
                Successfully imported <span className="font-semibold">{importSummaryData?.fileName}</span>
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {importSummaryData?.type === 'yaml' ? 'LibreChat YAML Configuration' : 'Environment Variables'} • {importSummaryData?.totalFields} fields processed
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3" data-testid="card-new-fields">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importSummaryData?.newFields || 0}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  New Fields
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3" data-testid="card-updated-fields">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {importSummaryData?.updatedFields || 0}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Updated Fields
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-3" data-testid="card-unchanged-fields">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {importSummaryData?.unchangedFields || 0}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Unchanged
                </div>
              </div>
            </div>

            {/* Field Details */}
            {(importSummaryData?.newFields || 0) > 0 || (importSummaryData?.updatedFields || 0) > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm" data-testid="text-changes-title">
                  Changes Made:
                </h3>
                
                <div className="bg-muted rounded-lg p-4 max-h-80 overflow-y-auto" data-testid="list-field-changes">
                  <div className="space-y-1">
                    {importSummaryData?.fieldDetails
                      .filter(field => field.status !== 'unchanged')
                      .map((field, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 text-xs font-mono py-1"
                          data-testid={`field-change-${index}`}
                        >
                          {field.status === 'new' ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">NEW</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">UPD</span>
                          )}
                          <span className="text-muted-foreground">{field.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-center" data-testid="no-changes-message">
                <p className="text-sm text-muted-foreground">
                  All {importSummaryData?.totalFields} fields match your current configuration.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowImportSummary(false)}
                data-testid="button-close-import-summary"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
