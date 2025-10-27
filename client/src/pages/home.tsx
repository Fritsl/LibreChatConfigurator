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

const CONFIG_NAME_STORAGE_KEY = "librechat_configurator_name";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [configurationName, setConfigurationName] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_NAME_STORAGE_KEY);
      return saved || "My LibreChat Configuration";
    } catch {
      return "My LibreChat Configuration";
    }
  });
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSelfTestConfirmation, setShowSelfTestConfirmation] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showMergeResults, setShowMergeResults] = useState(false);
  const [mergeDetails, setMergeDetails] = useState<{ name: string; fields: string[] } | null>(null);
  const { configuration, updateConfiguration, saveProfile, generatePackage, loadDemoConfiguration, verifyConfiguration } = useConfiguration();
  const { isBackendAvailable, isDemo } = useBackendAvailability();
  const { toast } = useToast();

  // Sync configuration name from configuration object to state (one-way: config → state)
  useEffect(() => {
    if (configuration.configurationName && configuration.configurationName !== configurationName) {
      setConfigurationName(configuration.configurationName);
    }
  }, [configuration.configurationName, configurationName]);
  
  // Auto-save configuration name to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_NAME_STORAGE_KEY, configurationName);
    } catch {
      // Fail silently on localStorage errors
    }
  }, [configurationName]);

  const handleSaveProfile = async () => {
    try {
      // ⚠️ REMINDER: Always update version in shared/version.ts when making changes!
      
      // Create a complete configuration with ALL fields for 1:1 backup
      // Use createResetConfiguration which ensures all fields are present
      const completeDefaults = createResetConfiguration();
      const completeConfiguration = deepMerge(completeDefaults, configuration);
      
      // Create versioned export metadata
      const { createExportMetadata } = await import("@shared/version");
      const metadata = createExportMetadata(configurationName);
      
      // Create profile data with configuration and versioned metadata
      const versionInfo = getVersionInfo();
      const profileData = {
        name: configurationName,
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
      const filename = `${configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}-LibreChatConfigSettings.json`;
      const success = await downloadJSON(profileData, filename);

      if (success) {
        toast({
          title: "Configuration Saved",
          description: `Configuration "${configurationName}" downloaded successfully.`,
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
      if (yamlData.rateLimits.uploads) config.rateLimitsUploads = yamlData.rateLimits.uploads;
      if (yamlData.rateLimits.imports) config.rateLimitsImports = yamlData.rateLimits.imports;
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
      config.webSearch = {};
      if (yamlData.webSearch.searchProvider) config.webSearch.searchProvider = yamlData.webSearch.searchProvider;
      if (yamlData.webSearch.scraperType) config.webSearch.scraperType = yamlData.webSearch.scraperType;
      if (yamlData.webSearch.rerankerType) config.webSearch.rerankerType = yamlData.webSearch.rerankerType;
      if (yamlData.webSearch.serperApiKey) config.webSearch.serperApiKey = yamlData.webSearch.serperApiKey;
      if (yamlData.webSearch.searxngInstanceUrl) config.webSearch.searxngInstanceUrl = yamlData.webSearch.searxngInstanceUrl;
      if (yamlData.webSearch.searxngApiKey) config.webSearch.searxngApiKey = yamlData.webSearch.searxngApiKey;
      if (yamlData.webSearch.braveApiKey) config.webSearch.braveApiKey = yamlData.webSearch.braveApiKey;
      if (yamlData.webSearch.tavilyApiKey) config.webSearch.tavilyApiKey = yamlData.webSearch.tavilyApiKey;
      if (yamlData.webSearch.perplexityApiKey) config.webSearch.perplexityApiKey = yamlData.webSearch.perplexityApiKey;
      if (yamlData.webSearch.googleSearchApiKey) config.webSearch.googleSearchApiKey = yamlData.webSearch.googleSearchApiKey;
      if (yamlData.webSearch.googleCSEId) config.webSearch.googleCSEId = yamlData.webSearch.googleCSEId;
      if (yamlData.webSearch.bingSearchApiKey) config.webSearch.bingSearchApiKey = yamlData.webSearch.bingSearchApiKey;
      if (yamlData.webSearch.firecrawlApiKey) config.webSearch.firecrawlApiKey = yamlData.webSearch.firecrawlApiKey;
      if (yamlData.webSearch.firecrawlApiUrl) config.webSearch.firecrawlApiUrl = yamlData.webSearch.firecrawlApiUrl;
      if (yamlData.webSearch.jinaApiKey) config.webSearch.jinaApiKey = yamlData.webSearch.jinaApiKey;
      if (yamlData.webSearch.jinaApiUrl) config.webSearch.jinaApiUrl = yamlData.webSearch.jinaApiUrl;
      if (yamlData.webSearch.cohereApiKey) config.webSearch.cohereApiKey = yamlData.webSearch.cohereApiKey;
      if (yamlData.webSearch.scraperTimeout) config.webSearch.scraperTimeout = yamlData.webSearch.scraperTimeout;
      if (yamlData.webSearch.safeSearch !== undefined) config.webSearch.safeSearch = yamlData.webSearch.safeSearch;
    }
    
    // Memory Configuration
    if (yamlData.memory) {
      config.memory = {};
      if (yamlData.memory.enabled !== undefined) config.memory.enabled = yamlData.memory.enabled;
      if (yamlData.memory.personalization !== undefined) config.memory.personalization = yamlData.memory.personalization;
      if (yamlData.memory.windowSize) config.memory.windowSize = yamlData.memory.windowSize;
      if (yamlData.memory.tokenLimit) config.memory.tokenLimit = yamlData.memory.tokenLimit;
      if (yamlData.memory.validKeys) config.memory.validKeys = yamlData.memory.validKeys;
      if (yamlData.memory.agent) config.memory.agent = yamlData.memory.agent;
    }
    
    // OCR Configuration
    if (yamlData.ocr) {
      config.ocr = {};
      if (yamlData.ocr.provider) config.ocr.provider = yamlData.ocr.provider;
      if (yamlData.ocr.model) config.ocr.model = yamlData.ocr.model;
      if (yamlData.ocr.baseURL) config.ocr.baseURL = yamlData.ocr.baseURL;
      if (yamlData.ocr.apiKey) config.ocr.apiKey = yamlData.ocr.apiKey;
      // Legacy fields
      if (yamlData.ocr.apiBase) config.ocrApiBase = yamlData.ocr.apiBase;
    }
    
    // STT Configuration
    if (yamlData.stt) {
      config.stt = {};
      if (yamlData.stt.provider) config.stt.provider = yamlData.stt.provider;
      if (yamlData.stt.model) config.stt.model = yamlData.stt.model;
      if (yamlData.stt.baseURL) config.stt.baseURL = yamlData.stt.baseURL;
      if (yamlData.stt.apiKey) config.stt.apiKey = yamlData.stt.apiKey;
      if (yamlData.stt.language) config.stt.language = yamlData.stt.language;
    }
    
    // TTS Configuration
    if (yamlData.tts) {
      config.tts = {};
      if (yamlData.tts.provider) config.tts.provider = yamlData.tts.provider;
      if (yamlData.tts.model) config.tts.model = yamlData.tts.model;
      if (yamlData.tts.baseURL) config.tts.baseURL = yamlData.tts.baseURL;
      if (yamlData.tts.apiKey) config.tts.apiKey = yamlData.tts.apiKey;
      if (yamlData.tts.voice) config.tts.voice = yamlData.tts.voice;
      if (yamlData.tts.speed) config.tts.speed = yamlData.tts.speed;
      if (yamlData.tts.quality) config.tts.quality = yamlData.tts.quality;
      if (yamlData.tts.streaming !== undefined) config.tts.streaming = yamlData.tts.streaming;
    }
    
    // Speech (UI-level) Configuration
    if (yamlData.speech?.speechTab) {
      config.speech = { speechTab: {} };
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
    }
    
    // Model Specs Configuration
    if (yamlData.modelSpecs) {
      config.modelSpecs = {};
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
        if (agents.capabilities) {
          if (agents.capabilities.codeInterpreter !== undefined) config.codeInterpreterEnabled = agents.capabilities.codeInterpreter;
          if (agents.capabilities.actions !== undefined) config.actionsEnabled = agents.capabilities.actions;
          if (agents.capabilities.fileSearch !== undefined) config.fileSearchEnabled = agents.capabilities.fileSearch;
          if (agents.capabilities.uploadAsText !== undefined) config.uploadAsTextAgent = agents.capabilities.uploadAsText;
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
            updateConfiguration(profileData.configuration);
            // Always try to restore the configuration name, with fallback
            const importedName = profileData.name || `Imported ${new Date().toLocaleDateString()}`;
            setConfigurationName(importedName);
            
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
            // Update configuration name from imported file
            if (profileData.name) {
              setConfigurationName(profileData.name);
            }
            
            // Apply the incoming configuration as complete replacement
            updateConfiguration(profileData.configuration, true);
            
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
  const validateYamlFields = (yamlData: any): { valid: boolean; unmappedFields: string[] } => {
    const unmappedFields: string[] = [];
    
    // Define all supported top-level YAML keys
    const supportedKeys = new Set([
      'version', 'cache', 'mcpServers', 'ui', 'agents', 'rateLimits', 'fileConfig',
      'search', 'webSearch', 'memory', 'ocr', 'stt', 'tts', 'speech', 'actions',
      'temporaryChats', 'interface', 'modelSpecs', 'filteredTools', 'includedTools', 'endpoints'
    ]);
    
    // Check top-level keys
    for (const key of Object.keys(yamlData)) {
      if (!supportedKeys.has(key)) {
        unmappedFields.push(key);
      }
    }
    
    // Check nested keys in specific sections
    if (yamlData.ui) {
      const supportedUIKeys = new Set(['modelSelect', 'parameters', 'sidePanel', 'presets', 'prompts', 'bookmarks', 'multiConvo', 'agents', 'webSearch', 'fileSearch', 'fileCitations', 'runCode']);
      for (const key of Object.keys(yamlData.ui)) {
        if (!supportedUIKeys.has(key)) {
          unmappedFields.push(`ui.${key}`);
        }
      }
    }
    
    if (yamlData.interface) {
      const supportedInterfaceKeys = new Set(['customWelcome', 'customFooter', 'defaultPreset', 'uploadAsText', 'temporaryChatRetention', 'mcpServers', 'privacyPolicy', 'termsOfService']);
      for (const key of Object.keys(yamlData.interface)) {
        if (!supportedInterfaceKeys.has(key)) {
          unmappedFields.push(`interface.${key}`);
        }
      }
    }
    
    if (yamlData.endpoints) {
      const supportedEndpoints = new Set(['agents', 'openAI', 'anthropic', 'google', 'azureOpenAI']);
      for (const key of Object.keys(yamlData.endpoints)) {
        if (!supportedEndpoints.has(key)) {
          unmappedFields.push(`endpoints.${key}`);
        }
      }
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
              toast({
                title: "❌ Import Blocked: Unsupported Fields Detected",
                description: `Your YAML file contains ${validation.unmappedFields.length} field(s) not yet supported by this tool. Import has been rejected to prevent data loss.`,
                variant: "destructive",
              });
              
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
              
              return; // BLOCK IMPORT
            }
            
            const configUpdates = mapYamlToConfiguration(yamlData);
            console.log("   - Mapped configuration:", configUpdates);
            console.log("   - MCP servers found:", configUpdates.mcpServers?.length || 0);
            
            // Update configuration with parsed data
            updateConfiguration(configUpdates);
            
            toast({
              title: "✅ YAML Imported Successfully",
              description: `LibreChat configuration from "${file.name}" imported with all fields preserved.`,
            });
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
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'MISTRAL_API_KEY',
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
              toast({
                title: "❌ Import Blocked: Unsupported Variables Detected",
                description: `Your .env file contains ${validation.unmappedVars.length} environment variable(s) not yet supported by this tool. Import has been rejected to prevent data loss.`,
                variant: "destructive",
              });
              
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
              
              return; // BLOCK IMPORT
            }
            
            const configUpdates = mapEnvToConfiguration(envVars);
            console.log("   - Mapped configuration:", configUpdates);
            
            // Update configuration with parsed data
            updateConfiguration(configUpdates);
            
            toast({
              title: "✅ Environment File Imported Successfully",
              description: `All settings from "${file.name}" imported with complete data preservation.`,
            });
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
      const packageName = configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-').replace(/\s+/g, '-');
      
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
      const filename = `${configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}.zip`;
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
                  value={configurationName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setConfigurationName(newName);
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
                  setConfigurationName(loadedData.packageName);
                  // Also update the configurationName field in the configuration object
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
      
    </div>
  );
}
