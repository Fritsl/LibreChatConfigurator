import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { getVersionInfo } from "./version";

// ⚠️ REMINDER: When adding new configuration fields or changing schema structure,
// update version number in shared/version.ts!

// LibreChat Configuration Tool Version (from central version file)
export const CONFIG_VERSION = getVersionInfo().librechatTarget;

// LibreChat v0.8.0-RC4 Configuration Schema
// Pure RC4 implementation - no backwards compatibility

// Client Image Resize Configuration
const clientImageResizeSchema = z.object({
  enabled: z.boolean().default(true),
  maxWidth: z.number().min(100).max(4096).default(1920),
  maxHeight: z.number().min(100).max(4096).default(1080),
  quality: z.number().min(0.1).max(1.0).default(0.8),
  compressFormat: z.enum(["jpeg", "webp"]).default("jpeg"),
}).optional();

// File Configuration
const fileConfigSchema = z.object({
  endpoints: z.record(z.object({
    fileLimit: z.number().min(1).max(100).default(5),
    fileSizeLimit: z.number().min(1).max(1000).default(10), // MB
    totalSizeLimit: z.number().min(1).max(10000).default(50), // MB
    supportedMimeTypes: z.array(z.string()).optional(),
  })).optional(),
  serverFileSizeLimit: z.number().min(1).max(1000).default(20), // MB
  avatarSizeLimit: z.number().min(1).max(100).default(5), // MB
  clientImageResize: clientImageResizeSchema,
}).optional();

// Rate Limits Configuration
const rateLimitsSchema = z.object({
  fileUploads: z.object({
    ipMax: z.number().min(1).max(10000).default(100),
    ipWindowInMinutes: z.number().min(1).max(1440).default(60),
    userMax: z.number().min(1).max(10000).default(50),
    userWindowInMinutes: z.number().min(1).max(1440).default(60),
  }).optional(),
  conversationsImport: z.object({
    ipMax: z.number().min(1).max(10000).default(100),
    ipWindowInMinutes: z.number().min(1).max(1440).default(60),
    userMax: z.number().min(1).max(10000).default(50),
    userWindowInMinutes: z.number().min(1).max(1440).default(60),
  }).optional(),
  stt: z.object({
    ipMax: z.number().min(1).max(10000).default(100),
    ipWindowInMinutes: z.number().min(1).max(1440).default(1),
    userMax: z.number().min(1).max(10000).default(50),
    userWindowInMinutes: z.number().min(1).max(1440).default(1),
  }).optional(),
  tts: z.object({
    ipMax: z.number().min(1).max(10000).default(100),
    ipWindowInMinutes: z.number().min(1).max(1440).default(1),
    userMax: z.number().min(1).max(10000).default(50),
    userWindowInMinutes: z.number().min(1).max(1440).default(1),
  }).optional(),
}).optional();

// Interface Configuration
// NOTE: customWelcome, customFooter, and temporaryChatRetention were removed from here
// because they exist at top-level in configurationSchema (dual-placement bug fix)
// See lines 474, 517-518 for their top-level definitions
const interfaceSchema = z.object({
  mcpServers: z.object({
    placeholder: z.string().optional(),
  }).optional(),
  defaultPreset: z.string().optional(), // RC4: Name of preset to use as default
  fileSearch: z.boolean().default(true),
  uploadAsText: z.boolean().default(false), // RC4 "Upload as Text" feature
  privacyPolicy: z.object({
    externalUrl: z.string().url().optional(),
    openNewTab: z.boolean().default(true),
  }).optional(),
  termsOfService: z.object({
    externalUrl: z.string().url().optional(),
    openNewTab: z.boolean().default(true),
    modalAcceptance: z.boolean().default(false),
    modalTitle: z.string().optional(),
    modalContent: z.string().optional(),
  }).optional(),
  modelSelect: z.boolean().default(true), // RC4: Show model selector dropdown (replaces deprecated interface.endpointsMenu from v1.2.3)
  parameters: z.boolean().default(true),
  sidePanel: z.boolean().default(true),
  presets: z.boolean().default(true),
  prompts: z.boolean().default(true),
  bookmarks: z.boolean().default(true),
  multiConvo: z.boolean().default(false),
  agents: z.boolean().default(true),
  webSearch: z.boolean().default(true), // RC4: Show web search UI
  runCode: z.boolean().default(false), // Show "Run Code" button for code interpreter
  fileCitations: z.boolean().default(true),
  artifacts: z.boolean().default(true), // Show artifacts UI for generative React/HTML/Mermaid components
  peoplePicker: z.object({
    users: z.boolean().default(true),
    groups: z.boolean().default(true),
    roles: z.boolean().default(true),
  }).optional(),
  marketplace: z.object({
    use: z.boolean().default(false),
  }).optional(),
}).optional();

// Model Specs Configuration - Controls which endpoints are visible in UI
const modelSpecsSchema = z.object({
  addedEndpoints: z.array(z.enum([
    "openAI", "anthropic", "google", "azureOpenAI", "assistants", "agents",
    "groq", "openRouter", "mistral", "xAI", "perplexity", "deepseek",
    "bedrock", "cohere", "ollama", "localAI", "gptPlugins"
  ])).default(["openAI", "anthropic", "google", "azureOpenAI", "assistants", "agents"]),
  enforce: z.boolean().default(false).optional(), // RC4: Force users to select from modelSpecs list
  prioritize: z.boolean().default(false).optional(), // RC4: Make modelSpecs primary UI element
  list: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(), // RC4: Agent/model description
    default: z.boolean().optional(), // RC4: Auto-select this spec for new chats
    preset: z.object({
      endpoint: z.enum([
        "openAI", "anthropic", "google", "azureOpenAI", "assistants", "agents",
        "groq", "openRouter", "mistral", "xAI", "perplexity", "deepseek",
        "bedrock", "cohere", "ollama", "localAI", "gptPlugins"
      ]),
      model: z.string().optional(), // RC4: Specific model to enforce (e.g., "gpt-4o", "claude-3-5-sonnet")
      agent_id: z.string().optional(),
    }),
  })).optional(),
}).optional();

// Registration Configuration
const registrationSchema = z.object({
  socialLogins: z.array(z.enum([
    "github", "google", "discord", "openid", 
    "facebook", "apple", "saml"
  ])).default([]),
  allowedDomains: z.array(z.string()).optional(),
}).optional();

// Actions Configuration
const actionsSchema = z.object({
  allowedDomains: z.array(z.string()).default([]),
}).optional();

// Web Search Configuration - Officially Supported Providers Only
const webSearchSchema = z.object({
  // API Keys (only officially supported providers)
  serperApiKey: z.string().optional(),
  searxngInstanceUrl: z.string().optional(),
  searxngApiKey: z.string().optional(),
  firecrawlApiKey: z.string().optional(),
  firecrawlApiUrl: z.string().optional(),
  jinaApiKey: z.string().optional(),
  jinaApiUrl: z.string().optional(),
  cohereApiKey: z.string().optional(),
  
  // Provider Configuration (official LibreChat documentation only)
  searchProvider: z.enum(["none", "serper", "searxng"]).default("none"),
  scraperType: z.enum(["none", "firecrawl", "serper"]).default("none"),
  rerankerType: z.enum(["none", "jina", "cohere"]).default("none"),
  scraperTimeout: z.number().min(1000).max(60000).default(20000),
  safeSearch: z.number().min(0).max(2).default(1), // 0=OFF, 1=MODERATE, 2=STRICT
  
  // Firecrawl Advanced Options
  firecrawlOptions: z.object({
    formats: z.array(z.enum(["markdown", "html", "links", "screenshot"])).default(["markdown", "links"]),
    includeTags: z.array(z.string()).optional(),
    excludeTags: z.array(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    onlyMainContent: z.boolean().default(true),
    timeout: z.number().min(1000).max(120000).default(20000),
    waitFor: z.number().min(0).max(30000).default(1000),
    blockAds: z.boolean().default(true),
    removeBase64Images: z.boolean().default(true),
    parsePDF: z.boolean().default(true),
    mobile: z.boolean().default(true),
    maxAge: z.number().min(0).max(86400000).default(0), // max 24 hours in ms
    proxy: z.string().default("auto"),
    skipTlsVerification: z.boolean().default(false),
    storeInCache: z.boolean().default(true),
    zeroDataRetention: z.boolean().default(false),
    location: z.object({
      country: z.string().optional(),
      languages: z.array(z.string()).optional(),
    }).optional(),
    changeTrackingOptions: z.object({
      enabled: z.boolean().optional(),
      threshold: z.number().optional(),
    }).optional(),
  }).optional(),
}).optional();

// Memory Configuration
const memoryAgentSchema = z.object({
  id: z.string().optional(), // Reference to existing agent by ID
  provider: z.string().optional(), // e.g., "openAI", "anthropic"
  model: z.string().optional(), // e.g., "gpt-4"
  instructions: z.string().optional(), // Custom memory handling instructions
  model_parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).optional(),
    top_p: z.number().min(0).max(1).optional(),
    frequency_penalty: z.number().min(-2).max(2).optional(),
  }).optional(),
}).optional();

const memorySchema = z.object({
  disabled: z.boolean().default(true), // Default: memory DISABLED
  validKeys: z.array(z.string()).optional(),
  tokenLimit: z.number().min(1).optional(),
  personalize: z.boolean().default(false), // Default: personalization OFF
  messageWindowSize: z.number().min(1).max(100).default(5),
  agent: memoryAgentSchema,
}).optional();

// OCR Configuration
const ocrSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  strategy: z.enum(["mistral_ocr", "custom_ocr"]).default("mistral_ocr"),
  mistralModel: z.string().default("pixtral-12b-2409"),
}).optional();

// Speech-to-Text (STT) Configuration
const sttSchema = z.object({
  provider: z.enum(["openai", "azure", "google", "deepgram", "assemblyai", "local"]).default("openai"),
  model: z.string().default("whisper-1"),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  language: z.string().optional(),
  streaming: z.boolean().default(false),
  punctuation: z.boolean().default(true),
  profanityFilter: z.boolean().default(false),
}).optional();

// Text-to-Speech (TTS) Configuration
const ttsSchema = z.object({
  provider: z.enum(["openai", "azure", "google", "elevenlabs", "aws", "local"]).default("openai"),
  model: z.string().default("tts-1"),
  voice: z.string().default("alloy"),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  quality: z.enum(["standard", "hd"]).default("standard"),
  streaming: z.boolean().default(false),
}).optional();

// UI-Level Speech Configuration (for speech/voice experience in LibreChat UI)
const speechSchema = z.object({
  preset: z.object({
    selected: z.enum(["none", "chatgpt-feel", "private-cheap"]).default("none"),
    customLanguage: z.string().optional(),
    customVoice: z.string().optional(),
  }).optional(),
  speechTab: z.object({
    conversationMode: z.boolean().default(false),
    advancedMode: z.boolean().default(false),
    speechToText: z.object({
      engineSTT: z.string().default("browser"),
      languageSTT: z.string().default("en-US"),
      autoTranscribeAudio: z.boolean().default(false),
      decibelValue: z.number().min(-100).max(0).default(-45),
      autoSendText: z.number().min(0).max(10000).default(0),
    }).optional(),
    textToSpeech: z.object({
      engineTTS: z.string().default("browser"),
      voice: z.string().default("alloy"),
      languageTTS: z.string().default("en"),
      automaticPlayback: z.boolean().default(false),
      playbackRate: z.number().min(0.25).max(4.0).default(1.0),
      cacheTTS: z.boolean().default(false),
    }).optional(),
  }).optional(),
}).optional();

// MCP Servers Configuration
const mcpServerSchema = z.object({
  type: z.enum(["stdio", "websocket", "sse", "streamable-http"]).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  timeout: z.number().min(1000).max(600000).default(30000),
  initTimeout: z.number().min(1000).max(600000).default(10000),
  headers: z.record(z.string()).optional(),
  serverInstructions: z.union([z.boolean(), z.string()]).optional(),
  iconPath: z.string().optional(),
  chatMenu: z.boolean().optional(),
  customUserVars: z.record(z.object({
    title: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
    type: z.enum(["text", "password", "number"]).default("text"),
  })).optional(),
});

const mcpServersSchema = z.union([
  z.record(mcpServerSchema),
  z.array(mcpServerSchema.extend({
    name: z.string()
  }))
]).optional();

// Base Provider Configuration Schema for RC4 Unified Endpoints
const baseProviderSchema = z.object({
  disabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  models: z.object({
    default: z.array(z.string()).default([]),
    fetch: z.boolean().default(false),
    userIdQuery: z.boolean().default(false),
  }).optional(),
  titleConvo: z.boolean().default(true),
  titleModel: z.string().optional(),
  titleMethod: z.enum(["completion", "functions"]).default("completion"),
  summarize: z.boolean().default(false),
  summaryModel: z.string().optional(),
  forcePrompt: z.boolean().default(false),
  modelDisplayLabel: z.string().optional(),
  addParams: z.record(z.any()).default({}),
  dropParams: z.array(z.string()).default([]),
  headers: z.record(z.string()).default({}),
  iconURL: z.string().optional(),
  order: z.number().optional(),
});

// OpenAI Provider Configuration
const openAISchema = baseProviderSchema.extend({
  endpoints: z.object({
    completions: z.string().default("/v1/chat/completions"),
    models: z.string().default("/v1/models"),
  }).optional(),
  maxOutputTokens: z.number().min(1).max(100000).optional(),
  addModelMapping: z.record(z.string()).optional(),
});

// Azure OpenAI Provider Configuration
const azureSchema = baseProviderSchema.extend({
  deploymentName: z.string().optional(),
  apiVersion: z.string().default("2023-12-01-preview"),
  instanceName: z.string().optional(),
  addModelMapping: z.record(z.string()).optional(),
  additionalOptions: z.record(z.any()).optional(),
});

// Google Provider Configuration
const googleSchema = baseProviderSchema.extend({
  serviceKey: z.string().optional(),
  location: z.string().default("us-central1"),
  projectId: z.string().optional(),
  additionalOptions: z.record(z.any()).optional(),
});

// Anthropic Provider Configuration
const anthropicSchema = baseProviderSchema.extend({
  maxOutputTokens: z.number().min(1).max(8192).optional(),
  addModelMapping: z.record(z.string()).optional(),
});

// AWS Bedrock Provider Configuration
const bedrockSchema = baseProviderSchema.extend({
  region: z.string().default("us-east-1"),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  sessionToken: z.string().optional(),
  profile: z.string().optional(),
  addModelMapping: z.record(z.string()).optional(),
});

// Generic Provider Schema for other providers
const genericProviderSchema = baseProviderSchema.extend({
  name: z.string().optional(),
  additionalOptions: z.record(z.any()).optional(),
});

// Custom Endpoint Configuration
const customEndpointSchema = z.object({
  name: z.string(),
  apiKey: z.string().optional(),
  baseURL: z.string().url(),
  models: z.object({
    default: z.array(z.string()),
    fetch: z.boolean().default(false),
  }),
  titleConvo: z.boolean().default(true),
  titleModel: z.string().optional(),
  titleMethod: z.enum(["completion", "functions"]).default("completion"),
  summarize: z.boolean().default(false),
  summaryModel: z.string().optional(),
  forcePrompt: z.boolean().default(false),
  modelDisplayLabel: z.string().optional(),
  addParams: z.record(z.any()).optional(),
  dropParams: z.array(z.string()).optional(),
  headers: z.record(z.string()).optional(),
});

// Assistants Configuration
const assistantsSchema = z.object({
  disableBuilder: z.boolean().default(false),
  pollIntervalMs: z.number().min(500).max(10000).default(3000),
  timeoutMs: z.number().min(30000).max(600000).default(180000),
  supportedIds: z.array(z.string()).optional(),
  excludedIds: z.array(z.string()).optional(),
  privateAssistants: z.boolean().default(false),
  retrievalModels: z.array(z.string()).optional(),
  capabilities: z.array(z.enum([
    "code_interpreter", "retrieval", "actions", "tools", "image_vision"
  ])).default(["code_interpreter", "retrieval", "actions", "tools", "image_vision"]),
}).optional();

// Agents Configuration
const agentsSchema = z.object({
  recursionLimit: z.number().min(1).max(100).default(25),
  maxRecursionLimit: z.number().min(1).max(200).default(25),
  disableBuilder: z.boolean().default(false),
  maxCitations: z.number().min(1).max(100).default(30),
  maxCitationsPerFile: z.number().min(1).max(20).default(7),
  minRelevanceScore: z.number().min(0).max(1).default(0.45),
  capabilities: z.array(z.enum([
    "execute_code", "file_search", "actions", "tools", "artifacts", "context", "ocr", "chain", "web_search"
  ])).default(["execute_code", "file_search", "actions", "tools", "artifacts", "context", "ocr", "chain", "web_search"]),
}).optional();

// Unified Endpoints Configuration for RC4
const endpointsSchema = z.object({
  // Standard AI Providers (RC4 Unified Endpoints Framework)
  openAI: openAISchema.optional(),
  azureOpenAI: azureSchema.optional(),
  anthropic: anthropicSchema.optional(),
  google: googleSchema.optional(),
  groq: genericProviderSchema.optional(),
  openRouter: genericProviderSchema.optional(),
  mistral: genericProviderSchema.optional(),
  xAI: genericProviderSchema.optional(),
  perplexity: genericProviderSchema.optional(),
  deepseek: genericProviderSchema.optional(),
  bedrock: bedrockSchema.optional(),
  cohere: genericProviderSchema.optional(),
  ollama: genericProviderSchema.optional(),
  localAI: genericProviderSchema.optional(),
  
  // Special Endpoints
  assistants: assistantsSchema,
  agents: agentsSchema,
  
  // Custom endpoints array
  custom: z.array(customEndpointSchema).optional(),
}).optional();

// Main Configuration Schema for LibreChat RC4
export const configurationSchema = z.object({
  // LibreChat RC4 version identifier
  version: z.string().default("0.8.0-rc4"),
  
  // Core settings
  cache: z.boolean().default(true),
  fileStrategy: z.union([
    z.string(),
    z.object({
      avatar: z.enum(["local", "s3", "firebase", "azure_blob"]).optional(),
      image: z.enum(["local", "s3", "firebase", "azure_blob"]).optional(),
      document: z.enum(["local", "s3", "firebase", "azure_blob"]).optional(),
    })
  ]).default("local"),
  secureImageLinks: z.boolean().default(false),
  imageOutputType: z.enum(["png", "webp", "jpeg", "url"]).default("png"),
  filteredTools: z.array(z.string()).optional(),
  includedTools: z.array(z.string()).optional(),
  
  // Temporary chat retention (in hours)
  temporaryChatRetention: z.number().min(1).max(8760).default(720),
  
  // Configuration objects
  interface: interfaceSchema,
  modelSpecs: modelSpecsSchema,
  fileConfig: fileConfigSchema,
  rateLimits: rateLimitsSchema,
  registration: registrationSchema,
  actions: actionsSchema,
  webSearch: webSearchSchema,
  memory: memorySchema,
  ocr: ocrSchema,
  stt: sttSchema,
  tts: ttsSchema,
  speech: speechSchema,
  mcpServers: mcpServersSchema,
  endpoints: endpointsSchema,
  
  // Subdirectory hosting support (RC4 feature)
  basePath: z.string().optional(),
  appUrl: z.string().optional(),
  publicSubPath: z.string().optional(),
  
  // Environment Variables (for .env generation)
  // Security
  jwtSecret: z.string().min(32).optional(),
  jwtRefreshSecret: z.string().min(32).optional(),
  credsKey: z.string().length(64).optional(), // 32 bytes as hex = 64 characters
  credsIV: z.string().length(32).optional(), // 16 bytes as hex = 32 characters
  
  // Redis Configuration
  redisPingInterval: z.number().min(1000).max(300000).default(30000),
  
  // Minimum Password Length
  minPasswordLength: z.number().min(6).max(128).default(8),
  
  // Email Verification
  emailVerificationRequired: z.boolean().default(false), // EMAIL_VERIFICATION_REQUIRED
  allowUnverifiedEmailLogin: z.boolean().default(true), // ALLOW_UNVERIFIED_EMAIL_LOGIN
  
  // Core Application Settings
  appTitle: z.string().optional(), // APP_TITLE
  showBirthdayIcon: z.boolean().default(true), // SHOW_BIRTHDAY_ICON - Display birthday hat on Feb 11th
  customWelcome: z.string().optional(), // CUSTOM_WELCOME  
  customFooter: z.string().optional(), // CUSTOM_FOOTER
  helpAndFAQURL: z.string().url().optional(), // HELP_AND_FAQ_URL
  
  // Registration & Authentication
  allowRegistration: z.boolean().default(true), // ALLOW_REGISTRATION
  allowEmailLogin: z.boolean().default(true), // ALLOW_EMAIL_LOGIN
  allowSocialLogin: z.boolean().default(false), // ALLOW_SOCIAL_LOGIN
  allowSocialRegistration: z.boolean().default(false), // ALLOW_SOCIAL_REGISTRATION
  allowPasswordReset: z.boolean().default(true), // ALLOW_PASSWORD_RESET
  
  // Email Configuration
  emailService: z.string().optional(), // EMAIL_SERVICE
  emailUsername: z.string().optional(), // EMAIL_USERNAME
  emailPassword: z.string().optional(), // EMAIL_PASSWORD
  emailFrom: z.string().email().optional(), // EMAIL_FROM
  emailFromName: z.string().optional(), // EMAIL_FROM_NAME
  
  // Mailgun Configuration
  mailgunApiKey: z.string().optional(), // MAILGUN_API_KEY
  mailgunDomain: z.string().optional(), // MAILGUN_DOMAIN
  mailgunHost: z.string().optional(), // MAILGUN_HOST
  
  // OAuth Providers Configuration
  googleClientId: z.string().optional(), // GOOGLE_CLIENT_ID
  googleClientSecret: z.string().optional(), // GOOGLE_CLIENT_SECRET
  googleCallbackURL: z.string().optional(), // GOOGLE_CALLBACK_URL
  
  githubClientId: z.string().optional(), // GITHUB_CLIENT_ID
  githubClientSecret: z.string().optional(), // GITHUB_CLIENT_SECRET
  githubCallbackURL: z.string().optional(), // GITHUB_CALLBACK_URL
  
  discordClientId: z.string().optional(), // DISCORD_CLIENT_ID
  discordClientSecret: z.string().optional(), // DISCORD_CLIENT_SECRET
  discordCallbackURL: z.string().optional(), // DISCORD_CALLBACK_URL
  
  facebookClientId: z.string().optional(), // FACEBOOK_CLIENT_ID
  facebookClientSecret: z.string().optional(), // FACEBOOK_CLIENT_SECRET
  facebookCallbackURL: z.string().optional(), // FACEBOOK_CALLBACK_URL
  
  appleClientId: z.string().optional(), // APPLE_CLIENT_ID
  applePrivateKey: z.string().optional(), // APPLE_PRIVATE_KEY
  appleKeyId: z.string().optional(), // APPLE_KEY_ID
  appleTeamId: z.string().optional(), // APPLE_TEAM_ID
  appleCallbackURL: z.string().optional(), // APPLE_CALLBACK_URL
  
  // OpenID Connect
  openidURL: z.string().optional(), // OPENID_URL
  openidClientId: z.string().optional(), // OPENID_CLIENT_ID
  openidClientSecret: z.string().optional(), // OPENID_CLIENT_SECRET
  openidCallbackURL: z.string().optional(), // OPENID_CALLBACK_URL
  openidScope: z.string().optional(), // OPENID_SCOPE
  openidSessionSecret: z.string().optional(), // OPENID_SESSION_SECRET
  openidIssuer: z.string().optional(), // OPENID_ISSUER
  openidButtonLabel: z.string().optional(), // OPENID_BUTTON_LABEL
  openidImageURL: z.string().optional(), // OPENID_IMAGE_URL
  
  // API Keys - Core Providers
  openaiApiKey: z.string().optional(), // OPENAI_API_KEY
  openaiApiBase: z.string().optional(), // OPENAI_API_BASE
  openaiReverseProxy: z.string().optional(), // OPENAI_REVERSE_PROXY (deprecated, use custom endpoints in YAML)
  openaiModerationReverseProxy: z.string().optional(), // OPENAI_MODERATION_REVERSE_PROXY
  anthropicApiKey: z.string().optional(), // ANTHROPIC_API_KEY
  googleApiKey: z.string().optional(), // GOOGLE_KEY
  groqApiKey: z.string().optional(), // GROQ_API_KEY
  mistralApiKey: z.string().optional(), // MISTRAL_API_KEY
  
  // API Keys - Additional Providers
  deepseekApiKey: z.string().optional(), // DEEPSEEK_API_KEY
  perplexityApiKey: z.string().optional(), // PERPLEXITY_API_KEY
  fireworksApiKey: z.string().optional(), // FIREWORKS_API_KEY
  togetheraiApiKey: z.string().optional(), // TOGETHERAI_API_KEY
  huggingfaceToken: z.string().optional(), // HUGGINGFACE_TOKEN
  xaiApiKey: z.string().optional(), // XAI_API_KEY
  nvidiaApiKey: z.string().optional(), // NVIDIA_API_KEY
  sambaNovaApiKey: z.string().optional(), // SAMBANOVA_API_KEY
  hyperbolicApiKey: z.string().optional(), // HYPERBOLIC_API_KEY
  klusterApiKey: z.string().optional(), // KLUSTER_API_KEY
  nanogptApiKey: z.string().optional(), // NANOGPT_API_KEY
  glhfApiKey: z.string().optional(), // GLHF_API_KEY
  apipieApiKey: z.string().optional(), // APIPIE_API_KEY
  unifyApiKey: z.string().optional(), // UNIFY_API_KEY
  openrouterKey: z.string().optional(), // OPENROUTER_KEY
  
  // Azure OpenAI Configuration
  azureApiKey: z.string().optional(), // AZURE_API_KEY
  azureOpenaiApiInstanceName: z.string().optional(), // AZURE_OPENAI_API_INSTANCE_NAME
  azureOpenaiApiDeploymentName: z.string().optional(), // AZURE_OPENAI_API_DEPLOYMENT_NAME
  azureOpenaiApiVersion: z.string().optional(), // AZURE_OPENAI_API_VERSION
  azureOpenaiModels: z.string().optional(), // AZURE_OPENAI_MODELS
  
  // AWS Bedrock Configuration
  awsAccessKeyId: z.string().optional(), // AWS_ACCESS_KEY_ID
  awsSecretAccessKey: z.string().optional(), // AWS_SECRET_ACCESS_KEY
  awsRegion: z.string().optional(), // AWS_REGION
  awsBedrockRegion: z.string().optional(), // AWS_BEDROCK_REGION
  awsEndpointURL: z.string().optional(), // AWS_ENDPOINT_URL
  awsBucketName: z.string().optional(), // AWS_BUCKET_NAME
  
  // File Storage - Firebase
  firebaseApiKey: z.string().optional(), // FIREBASE_API_KEY
  firebaseAuthDomain: z.string().optional(), // FIREBASE_AUTH_DOMAIN
  firebaseProjectId: z.string().optional(), // FIREBASE_PROJECT_ID
  firebaseStorageBucket: z.string().optional(), // FIREBASE_STORAGE_BUCKET
  firebaseMessagingSenderId: z.string().optional(), // FIREBASE_MESSAGING_SENDER_ID
  firebaseAppId: z.string().optional(), // FIREBASE_APP_ID
  
  // File Storage - Azure Blob
  azureStorageConnectionString: z.string().optional(), // AZURE_STORAGE_CONNECTION_STRING
  azureStoragePublicAccess: z.boolean().default(false), // AZURE_STORAGE_PUBLIC_ACCESS
  azureContainerName: z.string().optional(), // AZURE_CONTAINER_NAME
  
  // File Storage - Local
  fileUploadPath: z.string().optional(), // FILE_UPLOAD_PATH
  
  // Search Configuration
  googleSearchApiKey: z.string().optional(), // GOOGLE_SEARCH_API_KEY
  googleCSEId: z.string().optional(), // GOOGLE_CSE_ID
  bingSearchApiKey: z.string().optional(), // BING_SEARCH_API_KEY
  
  // Weather & External APIs
  openweatherApiKey: z.string().optional(), // OPENWEATHER_API_KEY
  
  // Image Generation (DALL-E)
  dalleApiKey: z.string().optional(), // DALLE_API_KEY
  dalle3ApiKey: z.string().optional(), // DALLE3_API_KEY
  dalle2ApiKey: z.string().optional(), // DALLE2_API_KEY
  dalleReverseProxy: z.string().optional(), // DALLE_REVERSE_PROXY
  dalle3BaseUrl: z.string().optional(), // DALLE3_BASEURL
  dalle2BaseUrl: z.string().optional(), // DALLE2_BASEURL
  dalle3SystemPrompt: z.string().optional(), // DALLE3_SYSTEM_PROMPT
  dalle2SystemPrompt: z.string().optional(), // DALLE2_SYSTEM_PROMPT
  
  // LibreChat Code Interpreter (Paid API Service at code.librechat.ai)
  librechatCodeEnabled: z.boolean().default(false), // Enable LibreChat Code Interpreter (default: OFF)
  librechatCodeApiKey: z.string().optional(), // LIBRECHAT_CODE_API_KEY
  librechatCodeBaseUrl: z.string().optional(), // LIBRECHAT_CODE_BASEURL (optional for enterprise)
  
  // Artifacts Configuration (Generative UI with React/HTML/Mermaid)
  sandpackBundlerUrl: z.string().optional(), // SANDPACK_BUNDLER_URL (optional self-hosted bundler for privacy/compliance)
  
  // E2B Code Interpreter (Self-Hosted HTTP Proxy for file/image rendering)
  e2bApiKey: z.string().optional(), // E2B_API_KEY
  e2bProxyEnabled: z.boolean().default(false), // Enable E2B proxy service (default: OFF)
  e2bProxyPort: z.number().optional(), // E2B proxy port (default: 3001)
  e2bPublicBaseUrl: z.string().optional(), // Public base URL for file access (e.g., http://localhost:3001 or https://e2b.yourdomain.com)
  e2bFileTTLDays: z.number().optional(), // File TTL in days (default: 30)
  e2bMaxFileSize: z.number().optional(), // Max file size in MB (default: 50)
  e2bPerUserSandbox: z.boolean().optional(), // Per-user persistent sandboxes (default: false)
  
  // RAG API Configuration
  ragApiURL: z.string().optional(), // RAG_API_URL
  ragOpenaiApiKey: z.string().optional(), // RAG_OPENAI_API_KEY
  ragPort: z.number().optional(), // RAG_PORT
  ragHost: z.string().optional(), // RAG_HOST
  collectionName: z.string().optional(), // COLLECTION_NAME
  chunkSize: z.number().optional(), // CHUNK_SIZE
  chunkOverlap: z.number().optional(), // CHUNK_OVERLAP
  embeddingsProvider: z.string().optional(), // EMBEDDINGS_PROVIDER
  
  // Redis Configuration (Extended)
  redisUsername: z.string().optional(), // REDIS_USERNAME
  redisPassword: z.string().optional(), // REDIS_PASSWORD
  redisKeyPrefix: z.string().optional(), // REDIS_KEY_PREFIX
  redisKeyPrefixVar: z.string().optional(), // REDIS_KEY_PREFIX_VAR
  redisMaxListeners: z.number().optional(), // REDIS_MAX_LISTENERS
  redisUseAlternativeDNSLookup: z.boolean().default(false), // REDIS_USE_ALTERNATIVE_DNS_LOOKUP
  
  // Search Configuration (MeiliSearch)
  search: z.boolean().default(false), // SEARCH
  meilisearchURL: z.string().optional(), // MEILISEARCH_URL
  meilisearchMasterKey: z.string().optional(), // MEILISEARCH_MASTER_KEY
  meiliNoAnalytics: z.boolean().default(true), // MEILI_NO_ANALYTICS
  
  // Security & Rate Limiting
  limitConcurrentMessages: z.boolean().default(false), // LIMIT_CONCURRENT_MESSAGES
  concurrentMessageMax: z.number().optional(), // CONCURRENT_MESSAGE_MAX
  banViolations: z.boolean().default(false), // BAN_VIOLATIONS
  banDuration: z.number().optional(), // BAN_DURATION
  banInterval: z.number().optional(), // BAN_INTERVAL
  loginViolationScore: z.number().optional(), // LOGIN_VIOLATION_SCORE
  registrationViolationScore: z.number().optional(), // REGISTRATION_VIOLATION_SCORE
  concurrentViolationScore: z.number().optional(), // CONCURRENT_VIOLATION_SCORE
  messageViolationScore: z.number().optional(), // MESSAGE_VIOLATION_SCORE
  nonBrowserViolationScore: z.number().optional(), // NON_BROWSER_VIOLATION_SCORE
  loginMax: z.number().optional(), // LOGIN_MAX
  loginWindow: z.number().optional(), // LOGIN_WINDOW
  
  // LDAP Configuration
  ldapURL: z.string().optional(), // LDAP_URL
  ldapBindDN: z.string().optional(), // LDAP_BIND_DN
  ldapBindCredentials: z.string().optional(), // LDAP_BIND_CREDENTIALS
  ldapSearchBase: z.string().optional(), // LDAP_SEARCH_BASE
  ldapSearchFilter: z.string().optional(), // LDAP_SEARCH_FILTER
  
  // Turnstile (Cloudflare)
  turnstileSiteKey: z.string().optional(), // TURNSTILE_SITE_KEY
  turnstileSecretKey: z.string().optional(), // TURNSTILE_SECRET_KEY
  
  // Shared Links
  allowSharedLinks: z.boolean().default(false), // ALLOW_SHARED_LINKS
  allowSharedLinksPublic: z.boolean().default(false), // ALLOW_SHARED_LINKS_PUBLIC
  
  // Conversation Settings
  titleConvo: z.boolean().default(true), // TITLE_CONVO
  summaryConvo: z.boolean().default(false), // SUMMARY_CONVO
  
  // Static File Caching
  staticCacheMaxAge: z.number().optional(), // STATIC_CACHE_MAX_AGE
  staticCacheSMaxAge: z.number().optional(), // STATIC_CACHE_S_MAX_AGE
  indexCacheControl: z.string().optional(), // INDEX_CACHE_CONTROL
  indexPragma: z.string().optional(), // INDEX_PRAGMA
  indexExpires: z.string().optional(), // INDEX_EXPIRES
  
  // MCP Configuration
  mcpOauthOnAuthError: z.string().optional(), // MCP_OAUTH_ON_AUTH_ERROR
  mcpOauthDetectionTimeout: z.number().optional(), // MCP_OAUTH_DETECTION_TIMEOUT
  
  // Environment
  nodeEnv: z.enum(["development", "production", "test"]).default("production"), // NODE_ENV
  domainClient: z.string().optional(), // DOMAIN_CLIENT
  domainServer: z.string().optional(), // DOMAIN_SERVER
  noIndex: z.boolean().default(true), // NO_INDEX
  
  // Session Configuration (Extended)
  sessionExpiry: z.number().optional(), // SESSION_EXPIRY
  refreshTokenExpiry: z.number().optional(), // REFRESH_TOKEN_EXPIRY
  
  // User Management
  uid: z.number().optional(), // UID
  gid: z.number().optional(), // GID
  
  // Debug & Logging (Extended)
  debugConsole: z.boolean().default(false), // DEBUG_CONSOLE
  consoleJSON: z.boolean().default(false), // CONSOLE_JSON
  
  // CDN Configuration
  cdnProvider: z.string().optional(), // CDN_PROVIDER
  
  // Database Configuration
  mongoUri: z.string().optional(), // MONGO_URI
  redisUri: z.string().optional(), // REDIS_URI
  mongoRootUsername: z.string().optional(), // MONGO_ROOT_USERNAME
  mongoRootPassword: z.string().optional(), // MONGO_ROOT_PASSWORD
  mongoDbName: z.string().optional(), // MONGO_DB_NAME
  
  // Server Configuration
  host: z.string().default("0.0.0.0"),
  port: z.number().min(1).max(65535).default(3080),
  debugLogging: z.boolean().default(false),
  enabledEndpoints: z.array(z.enum([
    "openAI", "anthropic", "google", "azureOpenAI", "agents", 
    "azureAssistants", "bedrock", "cohere", "assistants", "gptPlugins"
  ])).default(["openAI", "anthropic", "google", "azureOpenAI", "agents"]), // ENDPOINTS - gptPlugins excluded by default (deprecated)
  
  // Field Overrides - tracks which fields should use LibreChat defaults vs be explicitly set
  // true = use LibreChat default (export commented), false = use our value (export uncommented)
  fieldOverrides: z.record(z.string(), z.boolean()).optional().default({}),
  
  // Configuration Metadata
  configurationName: z.string().default("My LibreChat Configuration"),
});

export type Configuration = z.infer<typeof configurationSchema>;

// Profile configuration schema (relaxed validation for sensitive fields)
export const profileConfigurationSchema = configurationSchema.omit({
  jwtSecret: true,
  jwtRefreshSecret: true,
  credsKey: true,
  credsIV: true,
}).extend({
  // Make these fields optional for profile storage since they're environment variables
  jwtSecret: z.string().optional(),
  jwtRefreshSecret: z.string().optional(),
  credsKey: z.string().optional(),
  credsIV: z.string().optional(),
});

export const configurationProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  configuration: profileConfigurationSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ConfigurationProfile = z.infer<typeof configurationProfileSchema>;

export const insertConfigurationProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  configuration: profileConfigurationSchema,
});

export type InsertConfigurationProfile = z.infer<typeof insertConfigurationProfileSchema>;

// Validation status for each category
export const validationStatusSchema = z.object({
  category: z.string(),
  status: z.enum(["valid", "invalid", "pending"]),
  settingsValid: z.number(),
  settingsTotal: z.number(),
  errors: z.array(z.string()).default([]),
});

export type ValidationStatus = z.infer<typeof validationStatusSchema>;

// Package generation configuration schema (relaxed validation for sensitive fields)
export const packageConfigurationSchema = configurationSchema.omit({
  jwtSecret: true,
  jwtRefreshSecret: true,
  credsKey: true,
  credsIV: true,
}).extend({
  // Make these fields optional for package generation since they're environment variables
  jwtSecret: z.string().optional(),
  jwtRefreshSecret: z.string().optional(),
  credsKey: z.string().optional(),
  credsIV: z.string().optional(),
});

// Package generation request
export const packageGenerationSchema = z.object({
  configuration: packageConfigurationSchema,
  includeFiles: z.array(z.enum([
    "env",
    "yaml", 
    "docker-compose",
    "install-script",
    "mongo-backup",
    "readme"
  ])).default(["env", "yaml", "docker-compose", "install-script", "mongo-backup", "readme"]),
  packageName: z.string().optional(),
});

export type PackageGenerationRequest = z.infer<typeof packageGenerationSchema>;

// Deployment schemas
export const deploymentStatusSchema = z.enum([
  "pending",     // Deployment initiated but not started
  "building",    // Building Docker image and preparing deployment
  "deploying",   // Actively deploying to cloud platform
  "running",     // Successfully deployed and running
  "failed",      // Deployment failed
  "stopped",     // Manually stopped or crashed
  "updating"     // Updating existing deployment
]);

export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

export const deploymentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Configuration and profile references
  configurationProfileId: z.string(),
  configuration: packageConfigurationSchema,
  
  // Deployment details
  status: deploymentStatusSchema,
  platform: z.enum(["railway", "vercel", "digitalocean"]).default("railway"),
  
  // Cloud platform specific IDs
  platformProjectId: z.string().optional(),
  platformServiceId: z.string().optional(),
  platformDeploymentId: z.string().optional(),
  
  // URLs and access
  publicUrl: z.string().optional(),
  adminUrl: z.string().optional(),
  
  // Deployment metadata
  region: z.string().default("us-west-1"),
  resourcePlan: z.enum(["starter", "developer", "pro"]).default("starter"),
  
  // Status tracking
  deploymentLogs: z.array(z.string()).default([]),
  lastHealthCheck: z.date().optional(),
  uptime: z.number().default(0), // in seconds
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  deployedAt: z.date().optional(),
});

export type Deployment = z.infer<typeof deploymentSchema>;

export const insertDeploymentSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  configurationProfileId: z.string(),
  configuration: packageConfigurationSchema,
  platform: z.enum(["railway", "vercel", "digitalocean"]).default("railway"),
  region: z.string().default("us-west-1"),
  resourcePlan: z.enum(["starter", "developer", "pro"]).default("starter"),
});

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;

export const updateDeploymentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  status: deploymentStatusSchema.optional(),
  platformProjectId: z.string().optional(),
  platformServiceId: z.string().optional(),
  platformDeploymentId: z.string().optional(),
  publicUrl: z.string().optional(),
  adminUrl: z.string().optional(),
  deploymentLogs: z.array(z.string()).optional(),
  lastHealthCheck: z.date().optional(),
  uptime: z.number().optional(),
  deployedAt: z.date().optional(),
});

export type UpdateDeployment = z.infer<typeof updateDeploymentSchema>;

// Deployment request for creating new deployments
export const deploymentRequestSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  configurationProfileId: z.string(),
  platform: z.enum(["railway", "vercel", "digitalocean"]).default("railway"),
  region: z.string().default("us-west-1"),
  resourcePlan: z.enum(["starter", "developer", "pro"]).default("starter"),
  
  // Environment overrides (optional)
  environmentOverrides: z.record(z.string()).optional(),
});

export type DeploymentRequest = z.infer<typeof deploymentRequestSchema>;
