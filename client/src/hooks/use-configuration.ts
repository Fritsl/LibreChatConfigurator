import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Configuration, type InsertConfigurationProfile, type PackageGenerationRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { defaultConfiguration as fallbackConfiguration } from "@/lib/configuration-defaults";
import { deepMerge } from "@/lib/merge-utils";

// This configuration hook provides demo/placeholder values for LibreChat settings.
// Real API keys should be stored in local files (data/secrets/) and never committed to git.
// Users can replace demo values with real keys as needed for their deployments.
export function useConfiguration() {
  const queryClient = useQueryClient();
  
  // Demo configuration with ALL 75+ fields populated for comprehensive testing
  const createDemoConfiguration = (): Configuration => ({
    // REQUIRED RC4 CORE FIELDS
    version: "1.2.8", // RC4 configuration version
    cache: true, // Enable caching
    fileStrategy: {
      avatar: "local",
      image: "s3", 
      document: "local"
    },
    secureImageLinks: true, // RC4 security feature
    imageOutputType: "webp", // Modern image format
    temporaryChatRetention: 720, // 30 days in hours
    filteredTools: ["dall-e"],
    includedTools: ["calculator", "web-search", "stable-diffusion"],
    
    // App Settings
    appTitle: "LibreChat Demo Instance", 
    helpAndFAQURL: "https://demo.librechat.ai/help",
    
    // Server
    host: "0.0.0.0",
    port: 3080,
    nodeEnv: "production",
    domainClient: "https://demo.librechat.ai",
    domainServer: "https://api.demo.librechat.ai",
    noIndex: true,
    
    // Configuration Metadata
    configurationName: "Demo LibreChat Configuration",
    
    // Security
    jwtSecret: "demo_jwt_secret_32_characters_long_abc123",
    jwtRefreshSecret: "demo_refresh_secret_32_chars_long_xyz789",
    credsKey: "demo_credentials_key_32_chars_ab",
    credsIV: "demo_creds_iv16_",
    minPasswordLength: 12,
    sessionExpiry: 900000,
    refreshTokenExpiry: 604800000,
    
    // Database
    mongoUri: "mongodb://demo:password@demo-mongo:27017/librechat_demo",
    mongoRootUsername: "demo_admin",
    mongoRootPassword: "demo_secure_password_123",
    mongoDbName: "librechat_demo",
    redisUri: "redis://demo-redis:6379/0",
    redisUsername: "demo_redis_user",
    redisPassword: "demo_redis_pass_123",
    redisKeyPrefix: "librechat_demo:",
    redisKeyPrefixVar: "LIBRECHAT_DEMO_PREFIX",
    redisMaxListeners: 15,
    redisPingInterval: 30000,
    redisUseAlternativeDNSLookup: true,
    
    // Authentication
    allowRegistration: true,
    allowEmailLogin: true,
    allowSocialLogin: true,
    allowSocialRegistration: true,
    allowPasswordReset: true,
    
    // Email
    emailService: "mailgun",
    emailUsername: "demo@librechat.ai",
    emailPassword: "demo_email_password_123",
    emailFrom: "noreply@demo.librechat.ai",
    emailFromName: "LibreChat Demo",
    mailgunApiKey: "demo_mailgun_key_123456789abcdef",
    mailgunDomain: "demo.librechat.ai",
    mailgunHost: "https://api.mailgun.net",
    
    // OAuth Providers
    googleClientId: "demo_google_client_id_123456789",
    googleClientSecret: "demo_google_client_secret_abcdef123456",
    googleCallbackURL: "https://demo.librechat.ai/oauth/google/callback",
    githubClientId: "demo_github_client_id_123456",
    githubClientSecret: "demo_github_client_secret_abcdef789",
    githubCallbackURL: "https://demo.librechat.ai/oauth/github/callback",
    discordClientId: "demo_discord_client_id_123456789",
    discordClientSecret: "demo_discord_client_secret_abcdef123",
    discordCallbackURL: "https://demo.librechat.ai/oauth/discord/callback",
    facebookClientId: "demo_facebook_client_id_123456789",
    facebookClientSecret: "demo_facebook_client_secret_abcdef",
    facebookCallbackURL: "https://demo.librechat.ai/oauth/facebook/callback",
    appleClientId: "demo.librechat.ai",
    applePrivateKey: "-----BEGIN PRIVATE KEY-----\nDEMO_APPLE_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----",
    appleKeyId: "DEMO123456",
    appleTeamId: "DEMOTEAM123",
    appleCallbackURL: "https://demo.librechat.ai/oauth/apple/callback",
    openidURL: "https://demo-oidc.librechat.ai",
    openidClientId: "demo_openid_client_123",
    openidClientSecret: "demo_openid_secret_abcdef123456",
    openidCallbackURL: "https://demo.librechat.ai/oauth/openid/callback",
    openidScope: "openid profile email",
    openidSessionSecret: "demo_openid_session_secret_123456789",
    openidIssuer: "https://demo-oidc.librechat.ai",
    openidButtonLabel: "Demo OIDC Login",
    openidImageURL: "https://demo.librechat.ai/oidc-logo.png",
    
    // Core AI APIs
    openaiApiKey: "demo-openai-key-123456789abcdef123456789abcdef123456789abcdef",
    anthropicApiKey: "demo-anthropic-key-123456789abcdef123456789abcdef123456789",
    googleApiKey: "demo-google-key-123456789abcdef123456789abcdef123456",
    groqApiKey: "demo-groq-key-123456789abcdef123456789abcdef123456789abc",
    mistralApiKey: "demo-mistral-key-123456789abcdef123456789abcdef",
    
    // Extended AI APIs
    deepseekApiKey: "demo-deepseek-key-123456789abcdef123456789abcdef",
    perplexityApiKey: "demo-perplexity-key-123456789abcdef123456789abcdef123456789",
    fireworksApiKey: "demo-fireworks-key-123456789abcdef123456789abcdef123456789ab",
    togetheraiApiKey: "demo-togetherai-key-123456789abcdef123456789abcdef123",
    huggingfaceToken: "demo-huggingface-token-123456789abcdef123456789abcdef123456789",
    xaiApiKey: "demo-xai-key-123456789abcdef123456789abcdef123456789",
    nvidiaApiKey: "demo-nvidia-key-123456789abcdef123456789abcdef123456",
    sambaNovaApiKey: "demo-samba-key-123456789abcdef123456789abcdef1234",
    hyperbolicApiKey: "demo-hyperbolic-key-123456789abcdef123456789abc",
    klusterApiKey: "demo-kluster-key-123456789abcdef123456789abcdef12",
    nanogptApiKey: "demo-nanogpt-key-123456789abcdef123456789abcdef1",
    glhfApiKey: "demo-glhf-key-123456789abcdef123456789abcdef12345",
    apipieApiKey: "demo-apipie-key-123456789abcdef123456789abcdef123",
    unifyApiKey: "demo-unify-key-123456789abcdef123456789abcdef1234",
    openrouterKey: "demo-openrouter-key-123456789abcdef123456789abcdef123456",
    
    // Azure OpenAI
    azureApiKey: "demo_azure_key_123456789abcdef123456789abcdef12",
    azureOpenaiApiInstanceName: "demo-openai-instance",
    azureOpenaiApiDeploymentName: "demo-gpt-4-deployment",
    azureOpenaiApiVersion: "2023-12-01-preview",
    azureOpenaiModels: "gpt-4,gpt-4-turbo,gpt-35-turbo",
    
    // AWS Bedrock
    awsAccessKeyId: "AKIADEMO123456789ABCDEF",
    awsSecretAccessKey: "demo+aws+secret+key+123456789abcdefghijklmnop",
    awsRegion: "us-east-1",
    awsBedrockRegion: "us-west-2",
    awsEndpointURL: "https://bedrock-runtime.us-west-2.amazonaws.com",
    awsBucketName: "demo-librechat-storage",
    
    // File Storage
    fileUploadPath: "/app/uploads",
    firebaseApiKey: "demo-firebase-key-123456789abcdef123456",
    firebaseAuthDomain: "demo-librechat.firebaseapp.com",
    firebaseProjectId: "demo-librechat",
    firebaseStorageBucket: "demo-librechat.appspot.com",
    firebaseMessagingSenderId: "123456789012",
    firebaseAppId: "1:123456789012:web:demo123456789abcdef",
    azureStorageConnectionString: "DefaultEndpointsProtocol=https;AccountName=demolibrechat;AccountKey=demo+key+123==;EndpointSuffix=core.windows.net",
    azureStoragePublicAccess: false,
    azureContainerName: "demo-librechat-files",
    
    // Search & APIs  
    googleSearchApiKey: "demo-google-search-key-123456789abcdef123456789",
    googleCSEId: "demo123456789abcdef:demo123456789",
    bingSearchApiKey: "demo_bing_search_key_123456789abcdef123456789",
    openweatherApiKey: "demo_weather_key_123456789abcdef123456789abc",
    librechatCodeApiKey: "demo_code_api_key_123456789abcdef123456789",
    librechatCodeEnabled: true,
    
    // E2B Code Execution Proxy
    e2bApiKey: "demo_e2b_api_key_123456789abcdef123456789",
    e2bProxyEnabled: true,
    e2bProxyPort: 3001,
    e2bFileTTLDays: 30,
    e2bMaxFileSize: 50,
    e2bPerUserSandbox: false,
    
    // RAG API
    ragApiURL: "https://demo-rag.librechat.ai/api",
    ragOpenaiApiKey: "sk-demo_rag_openai_123456789abcdef123456789abc",
    ragPort: 8080,
    ragHost: "demo-rag.librechat.ai",
    collectionName: "demo_documents",
    chunkSize: 1000,
    chunkOverlap: 200,
    embeddingsProvider: "openai",
    
    // MeiliSearch
    search: true,
    meilisearchURL: "https://demo-search.librechat.ai",
    meilisearchMasterKey: "demo_meili_master_key_123456789abcdef123456",
    meiliNoAnalytics: true,
    
    // Rate & Security
    limitConcurrentMessages: true,
    concurrentMessageMax: 3,
    banViolations: true,
    banDuration: 7200000,
    banInterval: 20,
    loginViolationScore: 1,
    registrationViolationScore: 1,
    concurrentViolationScore: 1,
    messageViolationScore: 1,
    nonBrowserViolationScore: 20,
    loginMax: 7,
    loginWindow: 5,
    
    // LDAP
    ldapURL: "ldaps://demo-ldap.librechat.ai:636",
    ldapBindDN: "cn=admin,dc=demo,dc=librechat,dc=ai",
    ldapBindCredentials: "demo_ldap_password_123456789",
    ldapSearchBase: "ou=users,dc=demo,dc=librechat,dc=ai",
    ldapSearchFilter: "(uid={{username}})",
    
    // Turnstile
    turnstileSiteKey: "0x4AAAAAAADemo123456789abcdef",
    turnstileSecretKey: "0x4AAAAAAADemo_Secret_123456789abcdef123456",
    
    // Features
    allowSharedLinks: true,
    allowSharedLinksPublic: true,
    titleConvo: true,
    summaryConvo: true,
    
    // Caching
    staticCacheMaxAge: 31536000,
    staticCacheSMaxAge: 31536000,
    indexCacheControl: "no-cache",
    indexPragma: "no-cache",
    indexExpires: "0",
    
    // MCP
    mcpOauthOnAuthError: "redirect",
    mcpOauthDetectionTimeout: 30000,
    
    // Users
    uid: 1000,
    gid: 1000,
    
    // Debug
    debugLogging: true,
    debugConsole: true,
    consoleJSON: true,
    
    // Miscellaneous
    cdnProvider: "cloudflare",
    
    // RC4 INTERFACE CONFIGURATION 
    interface: {
      customWelcome: "Welcome to our comprehensive LibreChat demo installation! This instance showcases all possible configuration options.",
      customFooter: "Demo Footer - LibreChat RC4 Configuration Manager - All Settings Enabled for Testing",
      fileSearch: true, // RC4 file search capability
      uploadAsText: true, // RC4 "Upload as Text" feature
      privacyPolicy: {
        externalUrl: "https://demo.librechat.ai/privacy",
        openNewTab: true,
      },
      termsOfService: {
        externalUrl: "https://demo.librechat.ai/terms",
        openNewTab: true,
        modalAcceptance: true,
        modalTitle: "Terms of Service",
        modalContent: "Please accept our terms to continue using LibreChat Demo."
      },
      endpointsMenu: true,
      modelSelect: true,
      parameters: true,
      sidePanel: true,
      presets: true,
      prompts: true,
      bookmarks: true,
      multiConvo: true, // RC4 multi-conversation feature
      agents: true,
      peoplePicker: {
        users: true,
        groups: true,
        roles: true,
      },
      marketplace: {
        use: true, // RC4 marketplace integration
      },
      fileCitations: true,
      runCode: true, // RC4 code interpreter UI
      artifacts: true, // RC4 artifacts/generative UI
    },
    
    // RC4 RATE LIMITS CONFIGURATION
    rateLimits: {
      fileUploads: {
        ipMax: 100,
        ipWindowInMinutes: 60,
        userMax: 50,
        userWindowInMinutes: 60,
      },
      conversationsImport: {
        ipMax: 100,
        ipWindowInMinutes: 60,
        userMax: 50,
        userWindowInMinutes: 60,
      },
      stt: {
        ipMax: 100,
        ipWindowInMinutes: 1,
        userMax: 50,
        userWindowInMinutes: 1,
      },
      tts: {
        ipMax: 100,
        ipWindowInMinutes: 1,
        userMax: 50,
        userWindowInMinutes: 1,
      },
    },
    
    // RC4 FILE CONFIGURATION
    fileConfig: {
      endpoints: {
        "openAI": {
          fileLimit: 10,
          fileSizeLimit: 20,
          totalSizeLimit: 100,
          supportedMimeTypes: [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf", "text/plain", "text/markdown"
          ],
        },
        "anthropic": {
          fileLimit: 5,
          fileSizeLimit: 10,
          totalSizeLimit: 50,
          supportedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        },
      },
      serverFileSizeLimit: 25,
      avatarSizeLimit: 5,
      clientImageResize: {
        enabled: true,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        compressFormat: "webp",
      },
    },
  });
  
  const LOCAL_STORAGE_KEY = "librechat_configurator_config";

  // Track whether localStorage had data at initialization (using ref to avoid hook order issues)
  const hasCheckedInitialStorage = useRef(!!localStorage.getItem(LOCAL_STORAGE_KEY));

  // Initialize configuration from localStorage or fallback (MUST be before other hooks)
  const [configuration, setConfiguration] = useState<Configuration>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved data with fallback to populate any NEW fields added in updates
        // This ensures backward compatibility when new config options are added
        const merged = deepMerge(fallbackConfiguration, parsed) as Configuration;
        
        // MIGRATION: Move legacy root-level customWelcome/customFooter to interface object
        // This preserves data from old configurations (pre-v1.18) that had these at root level
        if (merged.interface) {
          if (parsed.customWelcome && (!merged.interface.customWelcome || merged.interface.customWelcome === "")) {
            merged.interface.customWelcome = parsed.customWelcome;
          }
          if (parsed.customFooter && (!merged.interface.customFooter || merged.interface.customFooter === "")) {
            merged.interface.customFooter = parsed.customFooter;
          }
        }
        
        return merged;
      }
      return fallbackConfiguration;
    } catch {
      return fallbackConfiguration;
    }
  });

  // Get default configuration
  const { data: defaultConfiguration, isLoading } = useQuery({
    queryKey: ["/api/configuration/default"],
  });

  // Apply backend defaults for first-time users BEFORE auto-save
  useEffect(() => {
    if (defaultConfiguration && !hasCheckedInitialStorage.current) {
      // First-time user: apply backend defaults (overwrite fallback)
      setConfiguration(defaultConfiguration as Configuration);
      // Mark as initialized so this only runs once
      hasCheckedInitialStorage.current = true;
    }
  }, [defaultConfiguration]);

  // Auto-save configuration to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configuration));
    } catch {
      // Fail silently on localStorage errors
    }
  }, [configuration]);

  // Save configuration profile
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: InsertConfigurationProfile) => {
      const response = await apiRequest("POST", "/api/profiles", profile);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });

  // Generate package
  const generatePackageMutation = useMutation({
    mutationFn: async (request: PackageGenerationRequest) => {
      const response = await apiRequest("POST", "/api/package/generate", request);
      return response.json();
    },
  });

  // Validate configuration
  const validateMutation = useMutation({
    mutationFn: async (config: Configuration) => {
      const response = await apiRequest("POST", "/api/configuration/validate", config);
      return response.json();
    },
  });

  const updateConfiguration = (updates: Partial<Configuration>, replace: boolean = false) => {
    if (replace) {
      // Full replacement - use updates as the complete configuration
      setConfiguration(updates as Configuration);
    } else {
      // Merge mode - update only specified fields
      setConfiguration(prev => ({ ...prev, ...updates }));
    }
  };

  const saveProfile = async (profileData: Omit<InsertConfigurationProfile, "configuration">) => {
    return saveProfileMutation.mutateAsync({
      ...profileData,
      configuration,
    });
  };

  const generatePackage = async (request: Omit<PackageGenerationRequest, "configuration">) => {
    return generatePackageMutation.mutateAsync({
      ...request,
      configuration,
    });
  };

  const validateConfiguration = async () => {
    return validateMutation.mutateAsync(configuration);
  };

  const loadDemoConfiguration = () => {
    const demoConfig = createDemoConfiguration();
    
    // Validate demo configuration against schema before loading
    try {
      // Import configurationSchema at runtime to avoid circular dependencies
      import("@shared/schema").then(({ configurationSchema }) => {
        const result = configurationSchema.safeParse(demoConfig);
        if (!result.success) {
          console.warn("⚠️ [DEMO CONFIG] Schema validation failed:", result.error);
        } else {
          console.log("✅ [DEMO CONFIG] Schema validation passed");
        }
      });
    } catch (error) {
      console.warn("⚠️ [DEMO CONFIG] Could not validate schema:", error);
    }
    
    console.log("🎯 [DEMO CONFIG] Loading demo configuration with", Object.keys(demoConfig).length, "top-level fields");
    setConfiguration(demoConfig);
    return demoConfig;
  };

  // Enhanced field verification system with schema-based deep validation
  const verifyConfiguration = (config: Configuration = configuration) => {
    const demoConfig = createDemoConfiguration();
    
    // Deep traverse function to count all fields including nested objects and arrays
    const deepFieldCount = (obj: any, path = ""): { total: number; populated: number; missing: string[] } => {
      let total = 0;
      let populated = 0;
      const missing: string[] = [];
      
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          total++;
          
          if (value !== undefined && value !== null && value !== "") {
            populated++;
          } else {
            missing.push(currentPath);
          }
          
          // Recursively count nested objects
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nested = deepFieldCount(value, currentPath);
            total += nested.total;
            populated += nested.populated;
            missing.push(...nested.missing);
          }
        }
      }
      
      return { total, populated, missing };
    };
    
    const schemaFields = deepFieldCount(demoConfig);
    const configFields = deepFieldCount(config);
    
    const verification = {
      schema: {
        totalFields: schemaFields.total,
        populatedInDemo: schemaFields.populated
      },
      current: {
        totalFields: configFields.total,
        populatedFields: configFields.populated,
        completionPercentage: configFields.total > 0 ? Math.round((configFields.populated / configFields.total) * 100) : 0,
        missingFields: configFields.missing
      },
      schemaCoverage: {
        percentage: schemaFields.total > 0 ? Math.round((configFields.total / schemaFields.total) * 100) : 0,
        missingFromSchema: schemaFields.total - configFields.total
      },
      configurationSize: JSON.stringify(config).length
    };
    
    console.log("🔍 [ENHANCED VERIFICATION]", verification);
    return verification;
  };

  return {
    configuration,
    updateConfiguration,
    saveProfile,
    generatePackage,
    validateConfiguration,
    loadDemoConfiguration,
    verifyConfiguration,
    createDemoConfiguration,
    isLoading,
    isSaving: saveProfileMutation.isPending,
    isGenerating: generatePackageMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
