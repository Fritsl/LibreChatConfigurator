import { type Configuration } from "@shared/schema";

export const defaultConfiguration: Configuration = {
  // LibreChat RC4 Core Settings
  version: "0.8.0-rc4",
  projectName: "librechat",
  cache: true,
  fileStrategy: "local",
  secureImageLinks: false,
  imageOutputType: "png",
  temporaryChatRetention: 720,
  
  // Required RC4 Fields
  titleConvo: true,
  redisPingInterval: 30000,
  minPasswordLength: 8,
  allowRegistration: true,
  allowEmailLogin: true,
  allowSocialLogin: false,
  allowSocialRegistration: false,
  allowPasswordReset: true,
  
  // Basic Server Configuration
  host: "0.0.0.0",
  port: 3080,
  debugLogging: false,
  
  // Security (empty for security)
  jwtSecret: "",
  jwtRefreshSecret: "",
  credsKey: "",
  credsIV: "",
  sessionExpiry: 900000,
  refreshTokenExpiry: 604800000,
  
  // Database (empty for security)
  mongoUri: "",
  redisUri: "",
  mongoDbName: "LibreChat",
  
  // API Keys (empty for security) 
  openaiApiKey: "",
  
  // UI Customization
  appTitle: "",
  customFooter: "",
  customWelcome: "",
  
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
  e2bProxyEnabled: false,
  
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
    endpointsMenu: true,
    modelSelect: true,
    parameters: true,
    sidePanel: true,
    presets: true,
    prompts: true,
    bookmarks: true,
    multiConvo: false,
    agents: true,
    peoplePicker: {
      users: true,
      groups: true,
      roles: true
    },
    marketplace: {
      use: false
    },
    fileCitations: true,
    runCode: false,
    artifacts: true
  },
};
