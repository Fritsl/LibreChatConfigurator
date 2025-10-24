import { type Configuration } from "@shared/schema";

export const defaultConfiguration: Configuration = {
  // LibreChat RC4 Core Settings
  version: "0.8.0-rc4",
  cache: true,
  fileStrategy: "local",
  secureImageLinks: false,
  imageOutputType: "png",
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
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "",
  firebaseApiKey: "",
  firebaseAuthDomain: "",
  firebaseProjectId: "",
  firebaseStorageBucket: "",
  firebaseMessagingSenderId: "",
  firebaseAppId: "",
  
  // UI Customization
  appTitle: "",
  customWelcome: "",
  customFooter: "",
  helpAndFAQURL: "",
  
  // Additional Required RC4 Fields
  azureStoragePublicAccess: false,
  redisUseAlternativeDNSLookup: false,
  search: false,
  meiliNoAnalytics: true,
  limitConcurrentMessages: false,
  banViolations: false,
  allowSharedLinks: false,
  allowSharedLinksPublic: false,
  summaryConvo: false,
  
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
  
  // External Services
  googleSearchApiKey: "",
  googleCSEId: "",
  bingSearchApiKey: "",
  openweatherApiKey: "",
  ragOpenaiApiKey: "",
  
  // Optional nested objects with schema-compliant defaults
  actions: {
    allowedDomains: []
  },
  memory: {
    disabled: true,
    personalize: false,
    messageWindowSize: 5
  },
  ocr: {
    strategy: "mistral_ocr" as const,
    mistralModel: "pixtral-12b-2409"
  },
  stt: {
    provider: "openai" as const,
    model: "whisper-1",
    streaming: false,
    punctuation: true,
    profanityFilter: false
  },
  tts: {
    provider: "openai" as const,
    model: "tts-1",
    voice: "alloy",
    speed: 1.0,
    quality: "standard" as const,
    streaming: false
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
        supportedMimeTypes: ["text/plain", "application/pdf"]
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
    cohereApiKey: "",
    searchProvider: "serper",
    scraperType: "serper", 
    rerankerType: "jina",
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
    addedEndpoints: []
  },
};
