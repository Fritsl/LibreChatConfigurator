import { type Configuration } from "@shared/schema";

export const defaultConfiguration: Configuration = {
  // LibreChat RC4 Core Settings
  version: "0.8.0-rc4",
  cache: true,
  fileStrategy: "local",
  secureImageLinks: false,
  imageOutputType: "png",
  filteredTools: [],
  includedTools: [],
  temporaryChatRetention: 720,
  
  // Required RC4 Fields
  titleConvo: true,
  redisPingInterval: 30000,
  minPasswordLength: 8,
  emailVerificationRequired: false,
  allowUnverifiedEmailLogin: true,
  allowRegistration: true,
  allowEmailLogin: true,
  allowSocialLogin: false,
  allowSocialRegistration: false,
  allowPasswordReset: true,
  
  // Basic Server Configuration
  host: "0.0.0.0",
  port: 3080,
  domainClient: "",
  domainServer: "",
  enabledEndpoints: ["openAI", "anthropic", "google", "azureOpenAI", "agents"],
  debugLogging: false,
  
  // Subdirectory hosting
  basePath: "",
  appUrl: "",
  publicSubPath: "",
  
  // Configuration Metadata
  configurationName: "My LibreChat Configuration",
  
  // Security (empty for security)
  jwtSecret: "",
  jwtRefreshSecret: "",
  credsKey: "",
  credsIV: "",
  sessionExpiry: 900000,
  refreshTokenExpiry: 604800000,
  
  // Database (empty for security)
  mongoUri: "",
  mongoDbName: "LibreChat",
  mongoRootUsername: "",
  mongoRootPassword: "",
  redisUri: "",
  redisUsername: "",
  redisPassword: "",
  redisKeyPrefix: "",
  redisKeyPrefixVar: "",
  redisMaxListeners: 10,
  
  // Email Configuration
  emailService: "",
  emailUsername: "",
  emailPassword: "",
  emailFrom: "",
  emailFromName: "",
  mailgunApiKey: "",
  mailgunDomain: "",
  mailgunHost: "",
  
  // OAuth - Google
  googleClientId: "",
  googleClientSecret: "",
  googleCallbackURL: "",
  
  // OAuth - GitHub
  githubClientId: "",
  githubClientSecret: "",
  githubCallbackURL: "",
  
  // OAuth - Discord
  discordClientId: "",
  discordClientSecret: "",
  discordCallbackURL: "",
  
  // OAuth - Facebook
  facebookClientId: "",
  facebookClientSecret: "",
  facebookCallbackURL: "",
  
  // OAuth - Apple
  appleClientId: "",
  applePrivateKey: "",
  appleKeyId: "",
  appleTeamId: "",
  appleCallbackURL: "",
  
  // OAuth - OpenID Connect
  openidURL: "",
  openidClientId: "",
  openidClientSecret: "",
  openidCallbackURL: "",
  openidScope: "",
  openidSessionSecret: "",
  openidIssuer: "",
  openidButtonLabel: "",
  openidImageURL: "",
  
  // API Keys - Core Providers (empty for security) 
  openaiApiKey: "",
  anthropicApiKey: "",
  googleApiKey: "",
  groqApiKey: "",
  mistralApiKey: "",
  
  // API Keys - Additional Providers
  deepseekApiKey: "",
  perplexityApiKey: "",
  fireworksApiKey: "",
  togetheraiApiKey: "",
  huggingfaceToken: "",
  xaiApiKey: "",
  nvidiaApiKey: "",
  sambaNovaApiKey: "",
  hyperbolicApiKey: "",
  klusterApiKey: "",
  nanogptApiKey: "",
  glhfApiKey: "",
  apipieApiKey: "",
  unifyApiKey: "",
  openrouterKey: "",
  
  // Cloud Provider Keys
  azureApiKey: "",
  azureOpenaiApiInstanceName: "",
  azureOpenaiApiDeploymentName: "",
  azureOpenaiApiVersion: "",
  azureOpenaiModels: "",
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "",
  awsBedrockRegion: "",
  awsEndpointURL: "",
  awsBucketName: "",
  firebaseApiKey: "",
  firebaseAuthDomain: "",
  firebaseProjectId: "",
  firebaseStorageBucket: "",
  firebaseMessagingSenderId: "",
  firebaseAppId: "",
  azureStorageConnectionString: "",
  azureContainerName: "",
  fileUploadPath: "",
  
  // UI Customization
  appTitle: "",
  customWelcome: "",
  customFooter: "",
  helpAndFAQURL: "",
  
  // Additional Required RC4 Fields
  azureStoragePublicAccess: false,
  redisUseAlternativeDNSLookup: false,
  search: false,
  meilisearchURL: "",
  meilisearchMasterKey: "",
  meiliNoAnalytics: true,
  limitConcurrentMessages: false,
  concurrentMessageMax: 3,
  banViolations: false,
  banDuration: 7200000,
  banInterval: 20,
  loginViolationScore: 1,
  registrationViolationScore: 1,
  concurrentViolationScore: 1,
  messageViolationScore: 1,
  nonBrowserViolationScore: 20,
  loginMax: 7,
  loginWindow: 5,
  ldapURL: "",
  ldapBindDN: "",
  ldapBindCredentials: "",
  ldapSearchBase: "",
  ldapSearchFilter: "",
  turnstileSiteKey: "",
  turnstileSecretKey: "",
  allowSharedLinks: false,
  allowSharedLinksPublic: false,
  summaryConvo: false,
  indexCacheControl: "no-cache",
  indexPragma: "no-cache",
  indexExpires: "0",
  mcpOauthOnAuthError: "redirect",
  mcpOauthDetectionTimeout: 30000,
  uid: 1000,
  gid: 1000,
  cdnProvider: "",
  
  // Missing Server Fields
  nodeEnv: "production" as const,
  noIndex: true,
  
  // Missing Debug Fields  
  debugConsole: false,
  consoleJSON: false,
  
  // Code Execution Fields
  librechatCodeEnabled: false,
  librechatCodeApiKey: "",
  e2bApiKey: "",
  e2bProxyEnabled: false,
  e2bProxyPort: 3001,
  e2bFileTTLDays: 30,
  e2bMaxFileSize: 50,
  e2bPerUserSandbox: false,
  
  // External Services
  googleSearchApiKey: "",
  googleCSEId: "",
  bingSearchApiKey: "",
  openweatherApiKey: "",
  
  // RAG API Configuration
  ragApiURL: "",
  ragOpenaiApiKey: "",
  ragPort: 8080,
  ragHost: "",
  collectionName: "",
  chunkSize: 1000,
  chunkOverlap: 200,
  embeddingsProvider: "",
  
  // Image Generation (DALL-E)
  dalleApiKey: "",
  dalle3ApiKey: "",
  dalle2ApiKey: "",
  dalleReverseProxy: "",
  dalle3BaseUrl: "",
  dalle2BaseUrl: "",
  dalle3SystemPrompt: "",
  dalle2SystemPrompt: "",
  
  // LibreChat Code & Artifacts URLs
  librechatCodeBaseUrl: "",
  sandpackBundlerUrl: "",
  
  // E2B Code Interpreter URLs
  e2bPublicBaseUrl: "",
  
  // Optional nested objects with schema-compliant defaults
  actions: {
    allowedDomains: []
  },
  memory: {
    disabled: true,
    validKeys: [],
    tokenLimit: 1000,
    personalize: false,
    messageWindowSize: 5,
    agent: {
      id: "",
      provider: "",
      model: "",
      instructions: "",
      model_parameters: {
        temperature: 1.0,
        max_tokens: 1000,
        top_p: 1.0,
        frequency_penalty: 0
      }
    }
  },
  ocr: {
    apiKey: "",
    baseURL: "",
    strategy: "mistral_ocr" as const,
    mistralModel: "pixtral-12b-2409"
  },
  stt: {
    provider: "openai" as const,
    model: "whisper-1",
    apiKey: "",
    baseURL: "",
    language: "",
    streaming: false,
    punctuation: true,
    profanityFilter: false
  },
  tts: {
    provider: "openai" as const,
    model: "tts-1",
    voice: "alloy",
    apiKey: "",
    baseURL: "",
    speed: 1.0,
    quality: "standard" as const,
    streaming: false
  },
  speech: {
    preset: {
      selected: "none" as const,
      customLanguage: "",
      customVoice: ""
    },
    speechTab: {
      conversationMode: false,
      advancedMode: false,
      speechToText: {
        engineSTT: "browser",
        languageSTT: "en-US",
        autoTranscribeAudio: false,
        decibelValue: -45,
        autoSendText: 0
      },
      textToSpeech: {
        engineTTS: "browser",
        voice: "alloy",
        languageTTS: "en",
        automaticPlayback: false,
        playbackRate: 1.0,
        cacheTTS: false
      }
    }
  },
  mcpServers: {},
  endpoints: {},
  
  // Proper nested objects for LibreChat compatibility
  registration: {
    socialLogins: [],
    allowedDomains: []
  },
  
  fileConfig: {
    endpoints: {
      openAI: {
        fileLimit: 5,
        fileSizeLimit: 10,
        totalSizeLimit: 50,
        supportedMimeTypes: ["text/plain", "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]
      },
      agents: {
        fileLimit: 5,
        fileSizeLimit: 10,
        totalSizeLimit: 50,
        supportedMimeTypes: ["text/plain", "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/csv", "text/markdown", "application/json", "text/html", "text/xml", "application/zip"]
      }
    },
    serverFileSizeLimit: 20,
    avatarSizeLimit: 5,
    clientImageResize: {
      enabled: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      compressFormat: "jpeg"
    }
  },
  
  webSearch: {
    serperApiKey: "",
    searxngInstanceUrl: "",
    searxngApiKey: "",
    firecrawlApiKey: "",
    firecrawlApiUrl: "",
    jinaApiKey: "",
    jinaApiUrl: "",
    cohereApiKey: "",
    searchProvider: "none",
    scraperType: "none", 
    rerankerType: "none",
    scraperTimeout: 20000,
    safeSearch: true,
    firecrawlOptions: {
      formats: ["markdown", "links"],
      onlyMainContent: true,
      timeout: 20000,
      waitFor: 1000,
      blockAds: true,
      removeBase64Images: true,
      mobile: true,
      maxAge: 0,
      proxy: "auto"
    }
  },
  
  rateLimits: {
    fileUploads: {
      ipMax: 100,
      ipWindowInMinutes: 60,
      userMax: 50,
      userWindowInMinutes: 60
    },
    conversationsImport: {
      ipMax: 100,
      ipWindowInMinutes: 60,
      userMax: 50,
      userWindowInMinutes: 60
    },
    stt: {
      ipMax: 100,
      ipWindowInMinutes: 1,
      userMax: 50,
      userWindowInMinutes: 1
    },
    tts: {
      ipMax: 100,
      ipWindowInMinutes: 1,
      userMax: 50,
      userWindowInMinutes: 1
    }
  },
  
  interface: {
    mcpServers: {
      placeholder: "MCP Servers"
    },
    customWelcome: "",
    customFooter: "",
    defaultPreset: "",
    fileSearch: true,
    uploadAsText: false,
    privacyPolicy: {
      externalUrl: "",
      openNewTab: true
    },
    termsOfService: {
      externalUrl: "",
      openNewTab: true,
      modalAcceptance: false,
      modalTitle: "",
      modalContent: ""
    },
    modelSelect: true,
    parameters: true,
    sidePanel: true,
    presets: true,
    prompts: true,
    bookmarks: true,
    multiConvo: false,
    agents: true,
    webSearch: true,
    runCode: false,
    fileCitations: true,
    artifacts: true,
    peoplePicker: {
      users: true,
      groups: true,
      roles: true
    },
    marketplace: {
      use: false
    },
    temporaryChatRetention: 720
  },
  
  // modelSpecs: Intentionally left empty due to LibreChat RC4 bug
  // When enabled, it causes interface.presets and other visibility settings to malfunction
  // Users should leave this field empty unless they fully understand the risks
  modelSpecs: {
    addedEndpoints: [],
    enforce: false,
    prioritize: false,
    list: []
  },
};
