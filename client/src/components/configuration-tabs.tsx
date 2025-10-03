import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SettingInput } from "./setting-input";
import { StatusIndicator } from "./status-indicator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Configuration } from "@shared/schema";
import { 
  Server, 
  Shield, 
  Database, 
  Eye, 
  Brain, 
  Plug, 
  Bot, 
  FileText, 
  Gauge, 
  Key, 
  MemoryStick, 
  Search, 
  Network, 
  Camera, 
  Wrench, 
  Clock, 
  Plus,
  Trash2,
  X,
  Settings,
  Mic,
  Volume2,
  Users,
  Zap,
  HardDrive,
  Terminal
} from "lucide-react";

interface ConfigurationTabsProps {
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function ConfigurationTabs({ 
  configuration, 
  onConfigurationChange, 
  searchQuery,
  onSearchQueryChange
}: ConfigurationTabsProps) {
  const [activeTab, setActiveTab] = useState("server");

  // Define tab groups with logical organization
  const tabGroups = [
    {
      label: "CORE CONFIGURATION",
      tabs: [
        {
          id: "app",
          label: "App Settings",
          icon: Settings,
          description: "Title, Welcome, Footer",
          color: "from-blue-500 to-blue-600",
          settings: ["appTitle", "customWelcome", "customFooter", "helpAndFAQURL"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
        {
          id: "server",
          label: "Server",
          icon: Server,
          description: "Host, Port, Environment",
          color: "from-green-500 to-green-600",
          settings: ["host", "port", "nodeEnv", "domainClient", "domainServer", "noIndex"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
        {
          id: "security",
          label: "Security",
          icon: Shield,
          description: "JWT, Encryption, Passwords",
          color: "from-red-500 to-red-600",
          settings: ["jwtSecret", "jwtRefreshSecret", "credsKey", "credsIV", "minPasswordLength", "sessionExpiry", "refreshTokenExpiry"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
      ]
    },
    {
      label: "DATA & STORAGE",
      tabs: [
        {
          id: "database",
          label: "Database",
          icon: Database,
          description: "MongoDB, Redis",
          color: "from-purple-500 to-purple-600",
          settings: ["mongoUri", "mongoRootUsername", "mongoRootPassword", "mongoDbName", "redisUri", "redisUsername", "redisPassword", "redisKeyPrefix", "redisKeyPrefixVar", "redisMaxListeners", "redisPingInterval", "redisUseAlternativeDNSLookup"],
          docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        },
      ]
    },
    {
      label: "AI PROVIDERS",
      tabs: [
        {
          id: "ai-core",
          label: "Core AI APIs",
          icon: Brain,
          description: "Primary AI Providers",
          color: "from-indigo-500 to-indigo-600",
          settings: ["openaiApiKey", "anthropicApiKey", "googleApiKey", "groqApiKey", "mistralApiKey"],
          docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        },
        {
          id: "ai-extended",
          label: "Extended AI APIs",
          icon: Key,
          description: "Additional AI Providers",
          color: "from-emerald-500 to-emerald-600",
          settings: [
            "deepseekApiKey", "perplexityApiKey", "fireworksApiKey", "togetheraiApiKey", 
            "huggingfaceToken", "xaiApiKey", "nvidiaApiKey", "sambaNovaApiKey", 
            "hyperbolicApiKey", "klusterApiKey", "nanogptApiKey", "glhfApiKey", 
            "apipieApiKey", "unifyApiKey", "openrouterKey"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        },
        {
          id: "azure",
          label: "Azure OpenAI",
          icon: Plug,
          description: "Azure Configuration",
          color: "from-cyan-500 to-cyan-600",
          settings: ["azureApiKey", "azureOpenaiApiInstanceName", "azureOpenaiApiDeploymentName", "azureOpenaiApiVersion", "azureOpenaiModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/azure",
        },
        {
          id: "aws",
          label: "AWS Bedrock",
          icon: Database,
          description: "AWS Configuration",
          color: "from-orange-500 to-orange-600",
          settings: ["awsAccessKeyId", "awsSecretAccessKey", "awsRegion", "awsBedrockRegion", "awsEndpointURL", "awsBucketName"],
          docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai/bedrock",
        },
        {
          id: "custom-endpoints",
          label: "Custom Endpoints",
          icon: Network,
          description: "Custom OpenAI-compatible endpoints",
          color: "from-pink-500 to-pink-600",
          settings: ["endpoints.custom"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/custom_endpoint",
        },
      ]
    },
    {
      label: "INTEGRATIONS & SERVICES",
      tabs: [
        {
          id: "auth",
          label: "Authentication",
          icon: Shield,
          description: "Login & Registration",
          color: "from-yellow-500 to-yellow-600",
          settings: ["allowRegistration", "allowEmailLogin", "allowSocialLogin", "allowSocialRegistration", "allowPasswordReset", "registration.socialLogins", "registration.allowedDomains"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication",
        },
        {
          id: "oauth",
          label: "OAuth Providers",
          icon: Key,
          description: "Social Login Configuration",
          color: "from-purple-500 to-purple-600",
          settings: ["oauthProviders"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        },
        {
          id: "email",
          label: "Email",
          icon: FileText,
          description: "Email Configuration",
          color: "from-blue-400 to-blue-500",
          settings: ["emailComposite"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        },
        {
          id: "file-storage",
          label: "File Storage",
          icon: FileText,
          description: "File Upload & Storage",
          color: "from-teal-500 to-teal-600",
          settings: ["fileStorage"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        },
        {
          id: "search",
          label: "Search & APIs",
          icon: Search,
          description: "Web Search & External APIs",
          color: "from-violet-500 to-violet-600",
          settings: ["webSearch", "openweatherApiKey", "librechatCodeApiKey"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        },
        {
          id: "meili",
          label: "MeiliSearch",
          icon: Search,
          description: "Search Engine Configuration",
          color: "from-gray-500 to-gray-600",
          settings: ["meilisearchIntegration"],
          docUrl: "https://www.librechat.ai/docs/configuration/meilisearch",
        },
        {
          id: "rag",
          label: "RAG API",
          icon: Database,
          description: "Retrieval Augmented Generation",
          color: "from-pink-500 to-pink-600",
          settings: ["ragApiURL", "ragOpenaiApiKey", "ragPort", "ragHost", "collectionName", "chunkSize", "chunkOverlap", "embeddingsProvider"],
          docUrl: "https://www.librechat.ai/docs/configuration/rag_api",
        },
        {
          id: "caching",
          label: "Caching",
          icon: HardDrive,
          description: "Performance caching configuration with 1-click presets",
          color: "from-slate-500 to-slate-600",
          settings: ["cachingIntegration"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
      ]
    },
    {
      label: "FEATURES & INTERFACE",
      tabs: [
        {
          id: "features",
          label: "Features",
          icon: Eye,
          description: "Feature Toggles",
          color: "from-purple-500 to-purple-600",
          settings: ["allowSharedLinks", "allowSharedLinksPublic", "titleConvo", "summaryConvo", "interface.fileSearch", "interface.uploadAsText", "interface.privacyPolicy.externalUrl", "interface.privacyPolicy.openNewTab", "interface.termsOfService.externalUrl", "interface.termsOfService.openNewTab", "interface.termsOfService.modalAcceptance", "interface.termsOfService.modalTitle", "interface.termsOfService.modalContent", "interface.endpointsMenu", "interface.modelSelect", "interface.parameters", "interface.sidePanel", "interface.presets", "interface.prompts", "interface.bookmarks", "interface.multiConvo", "interface.agents", "interface.peoplePicker.users", "interface.peoplePicker.groups", "interface.peoplePicker.roles", "interface.marketplace.use", "interface.fileCitations"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface",
        },
      ]
    },
    {
      label: "SECURITY & LIMITS",
      tabs: [
        {
          id: "rate-security",
          label: "Rate & Security",
          icon: Gauge,
          description: "Rate Limiting & Security",
          color: "from-red-400 to-red-500",
          settings: [
            "limitConcurrentMessages", "concurrentMessageMax", "banViolations", "banDuration", "banInterval",
            "loginViolationScore", "registrationViolationScore", "concurrentViolationScore", "messageViolationScore", 
            "nonBrowserViolationScore", "loginMax", "loginWindow",
            "rateLimits.fileUploads.ipMax", "rateLimits.fileUploads.ipWindowInMinutes", "rateLimits.fileUploads.userMax", "rateLimits.fileUploads.userWindowInMinutes",
            "rateLimits.conversationsImport.ipMax", "rateLimits.conversationsImport.ipWindowInMinutes", "rateLimits.conversationsImport.userMax", "rateLimits.conversationsImport.userWindowInMinutes",
            "rateLimits.stt.ipMax", "rateLimits.stt.ipWindowInMinutes", "rateLimits.stt.userMax", "rateLimits.stt.userWindowInMinutes",
            "rateLimits.tts.ipMax", "rateLimits.tts.ipWindowInMinutes", "rateLimits.tts.userMax", "rateLimits.tts.userWindowInMinutes"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        },
        {
          id: "ldap",
          label: "LDAP",
          icon: Shield,
          description: "LDAP Configuration",
          color: "from-yellow-600 to-yellow-700",
          settings: ["ldapURL", "ldapBindDN", "ldapBindCredentials", "ldapSearchBase", "ldapSearchFilter"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/ldap",
        },
        {
          id: "turnstile",
          label: "Turnstile",
          icon: Shield,
          description: "Cloudflare Turnstile",
          color: "from-orange-400 to-orange-500",
          settings: ["turnstileSiteKey", "turnstileSecretKey"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/captcha",
        },
      ]
    },
    {
      label: "ADVANCED & SYSTEM",
      tabs: [
        {
          id: "mcp",
          label: "MCP",
          icon: Network,
          description: "Model Context Protocol",
          color: "from-rose-500 to-rose-600",
          settings: ["mcpServers", "mcpOauthOnAuthError", "mcpOauthDetectionTimeout"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers",
        },
        {
          id: "code-execution",
          label: "Code Execution",
          icon: Terminal,
          description: "E2B Proxy for Python/JavaScript with File/Image Rendering",
          color: "from-cyan-500 to-cyan-600",
          settings: ["e2bApiKey", "e2bProxyEnabled", "e2bProxyPort", "e2bFileTTLDays", "e2bMaxFileSize", "e2bPerUserSandbox"],
          docUrl: "https://e2b.dev/docs",
        },
        {
          id: "users",
          label: "Users",
          icon: FileText,
          description: "System User/Group IDs for Deployment Security",
          color: "from-green-400 to-green-500",
          settings: ["uid", "gid"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
        {
          id: "debug",
          label: "Debug",
          icon: Wrench,
          description: "Logging & Debug",
          color: "from-amber-500 to-amber-600",
          settings: ["debugLogging", "debugConsole", "consoleJSON"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
        {
          id: "misc",
          label: "Miscellaneous",
          icon: Server,
          description: "CDN & Additional Configuration",
          color: "from-gray-400 to-gray-500",
          settings: ["cdnProvider"],
          docUrl: "https://www.librechat.ai/docs/configuration/cdn",
        },
      ]
    }
  ];

  // Flatten tabs from groups for compatibility with existing code
  const tabs = tabGroups.flatMap(group => group.tabs);

  // Add new comprehensive tabs for missing functionality
  const newTabs = [
    {
      id: "core-settings",
      label: "Core Settings",
      icon: Settings,
      description: "Version, Cache, File Strategy",
      color: "from-indigo-400 to-indigo-500",
      settings: ["version", "cache", "fileStrategy", "secureImageLinks", "imageOutputType", "filteredTools", "includedTools", "temporaryChatRetention"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
    },
    {
      id: "ocr",
      label: "OCR",
      icon: Camera,
      description: "Optical Character Recognition",
      color: "from-purple-400 to-purple-500",
      settings: ["ocr.apiKey", "ocr.baseURL", "ocr.strategy", "ocr.mistralModel"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
    },
    {
      id: "stt",
      label: "Speech-to-Text",
      icon: Mic,
      description: "Speech Recognition",
      color: "from-green-400 to-green-500",
      settings: ["stt.provider", "stt.model", "stt.apiKey", "stt.baseURL", "stt.language", "stt.streaming", "stt.punctuation", "stt.profanityFilter"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech_to_text",
    },
    {
      id: "tts",
      label: "Text-to-Speech",
      icon: Volume2,
      description: "Voice Synthesis",
      color: "from-blue-400 to-blue-500",
      settings: ["tts.provider", "tts.model", "tts.voice", "tts.apiKey", "tts.baseURL", "tts.speed", "tts.quality", "tts.streaming"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/text_to_speech",
    },
    {
      id: "assistants",
      label: "Assistants",
      icon: Users,
      description: "AI Assistants Configuration",
      color: "from-cyan-400 to-cyan-500",
      settings: ["endpoints.assistants.disableBuilder", "endpoints.assistants.pollIntervalMs", "endpoints.assistants.timeoutMs", "endpoints.assistants.supportedIds", "endpoints.assistants.excludedIds", "endpoints.assistants.privateAssistants", "endpoints.assistants.retrievalModels", "endpoints.assistants.capabilities"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
    },
    {
      id: "agents",
      label: "Agents",
      icon: Bot,
      description: "AI Agents Configuration",
      color: "from-emerald-400 to-emerald-500",
      settings: ["endpoints.agents.recursionLimit", "endpoints.agents.maxRecursionLimit", "endpoints.agents.disableBuilder", "endpoints.agents.maxCitations", "endpoints.agents.maxCitationsPerFile", "endpoints.agents.minRelevanceScore", "endpoints.agents.capabilities"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
    },
    {
      id: "actions",
      label: "Actions",
      icon: Zap,
      description: "Actions Configuration",
      color: "from-yellow-400 to-yellow-500",
      settings: ["actions.allowedDomains"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
    },
  ];

  // Combine original tabs with new tabs
  const allTabs = [...tabs, ...newTabs];

  // Helper function to get nested value using dotted path
  const getNestedValue = (obj: any, path: string): any => {
    if (!path.includes('.')) {
      return obj[path as keyof Configuration];
    }
    return path.split('.').reduce((current, key) => {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      return current[key];
    }, obj);
  };

  // Helper function to set nested value using dotted path
  const setNestedValue = (obj: any, path: string, value: any): any => {
    if (!path.includes('.')) {
      return { ...obj, [path]: value };
    }
    
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;
    
    // Navigate to the parent object, creating nested objects as needed
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      } else {
        current[key] = { ...current[key] };
      }
      current = current[key];
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value;
    return result;
  };

  const getTabProgress = (tabSettings: string[]) => {
    if (tabSettings.length === 0) return 100;
    const validSettings = tabSettings.filter(setting => {
      const value = getNestedValue(configuration, setting);
      return value !== undefined && value !== null && value !== "";
    });
    return Math.round((validSettings.length / tabSettings.length) * 100);
  };

  const filteredTabs = allTabs.filter(tab => 
    searchQuery === "" || 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get field type and description
  const getFieldInfo = (fieldName: string) => {
    const fieldMap: Record<string, { 
      type: "text" | "number" | "password" | "boolean" | "select" | "textarea" | "array" | "object" | "mcp-servers" | "custom-endpoints" | "web-search" | "oauth-providers" | "meilisearch-integration" | "caching-integration" | "file-storage" | "email-composite"; 
      description: string; 
      label: string;
      docUrl?: string;
      docSection?: string;
      placeholder?: string;
      options?: Array<{ value: string; label: string }> | string[];
      min?: number;
      max?: number;
      step?: number;
    }> = {
      // App Settings
      appTitle: { 
        type: "text", 
        description: "Sets the custom application title displayed in the browser tab and header. This overrides the default 'LibreChat' branding with your preferred name.", 
        label: "App Title",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "App Settings"
      },
      customWelcome: { 
        type: "textarea", 
        description: "Custom welcome message shown to users when they first access LibreChat. Supports markdown formatting for rich text.", 
        label: "Welcome Message",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        docSection: "Interface Config"
      },
      customFooter: { 
        type: "textarea", 
        description: "Custom footer text displayed at the bottom of the interface. Use this for copyright, contact information, or additional links.", 
        label: "Footer Text",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        docSection: "Interface Config"
      },
      helpAndFAQURL: { 
        type: "text", 
        description: "URL to your help documentation or FAQ page. This creates a help link in the interface for user support.", 
        label: "Help & FAQ URL",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        docSection: "Interface Config"
      },
      
      // Server
      host: { 
        type: "text", 
        description: "The address where LibreChat server listens for connections. Use 0.0.0.0 to accept connections from any IP address, or localhost for local-only access. Critical for Docker deployments.", 
        label: "Host",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#server-configuration",
        docSection: "Server Config"
      },
      port: { 
        type: "number", 
        description: "Port number where LibreChat runs. Default is 3080. Ensure this port is available and matches your Docker compose or proxy configuration.", 
        label: "Port",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#port",
        docSection: "Server Config"
      },
      nodeEnv: { 
        type: "select", 
        description: "Node.js environment mode. 'production' enables optimizations and security features. 'development' provides detailed error messages for debugging.", 
        label: "Environment",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#server-configuration",
        docSection: "Server Config"
      },
      domainClient: { 
        type: "text", 
        description: "Full URL where users access LibreChat (e.g., https://chat.yourcompany.com). Required for proper CORS, OAuth callbacks, and link generation.", 
        label: "Client Domain",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "Server Config"
      },
      domainServer: { 
        type: "text", 
        description: "Internal server URL for API calls. Usually same as client domain unless using separate API server. Critical for proper routing and authentication.", 
        label: "Server Domain",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "Server Config"
      },
      noIndex: { 
        type: "boolean", 
        description: "When enabled, adds meta tags to prevent search engines (Google, Bing) from indexing your LibreChat instance. Recommended for internal/private deployments.", 
        label: "No Index",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#prevent-public-search-engines-indexing",
        docSection: "Server Config"
      },
      
      // Security
      jwtSecret: { 
        type: "password", 
        description: "Secret key for signing JWT authentication tokens. Must be at least 32 characters long. Keep this secure and unique - changing it will log out all users. CRITICAL for security!", 
        label: "JWT Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      jwtRefreshSecret: { 
        type: "password", 
        description: "Separate secret for JWT refresh tokens. Should be different from JWT secret. Used for token rotation and extended authentication sessions.", 
        label: "JWT Refresh Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      credsKey: { 
        type: "password", 
        description: "32-byte encryption key (64 hex chars) for securely storing API credentials in database. Required for app startup. Generate with provided key generator tool.", 
        label: "Credentials Key",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      credsIV: { 
        type: "password", 
        description: "16-byte initialization vector (32 hex chars) for credential encryption. Must pair with credentials key. Required for secure API key storage.", 
        label: "Credentials IV",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      minPasswordLength: { 
        type: "number", 
        description: "Minimum character length required for user passwords. Recommended: 8-12 characters. Higher values increase security but may impact user experience.", 
        label: "Min Password Length",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      sessionExpiry: { 
        type: "number", 
        description: "How long user sessions last in milliseconds. Default 15 minutes (900000ms). Shorter values increase security, longer values improve user experience.", 
        label: "Session Expiry",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      refreshTokenExpiry: { 
        type: "number", 
        description: "Refresh token lifetime in milliseconds. Default 7 days (604800000ms). Allows users to stay logged in without re-entering credentials.", 
        label: "Refresh Token Expiry",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security"
      },
      
      // Database
      mongoUri: { 
        type: "text", 
        description: "MongoDB connection string. Use mongodb://localhost:27017/LibreChat for local setup or mongodb+srv:// format for cloud databases like MongoDB Atlas. Include database name in URI.", 
        label: "MongoDB URI",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      mongoRootUsername: { 
        type: "text", 
        description: "MongoDB administrator username. Only required if MongoDB authentication is enabled. Leave empty for Docker setups without authentication.", 
        label: "MongoDB Username",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb/mongodb_auth",
        docSection: "Database"
      },
      mongoRootPassword: { 
        type: "password", 
        description: "MongoDB administrator password. Must match the username credentials. Keep secure and use strong passwords for production databases.", 
        label: "MongoDB Password",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb/mongodb_auth",
        docSection: "Database"
      },
      mongoDbName: { 
        type: "text", 
        description: "Name of the MongoDB database to store LibreChat data. Usually 'LibreChat'. This database will be created automatically if it doesn't exist.", 
        label: "Database Name",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisUri: { 
        type: "text", 
        description: "Redis connection string for caching and session storage. Use redis://localhost:6379/0 for local or cloud Redis URLs. Improves performance significantly.", 
        label: "Redis URI",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisUsername: { 
        type: "text", 
        description: "Redis username if authentication is required. Many Redis setups don't require auth, so this may be optional depending on your configuration.", 
        label: "Redis Username",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisPassword: { 
        type: "password", 
        description: "Redis password for authenticated connections. Required for production Redis instances with AUTH enabled. Keep secure.", 
        label: "Redis Password",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisKeyPrefix: { 
        type: "text", 
        description: "Prefix added to all Redis keys to avoid conflicts when sharing Redis with other applications. Example: 'librechat:' creates keys like 'librechat:session:abc123'.", 
        label: "Redis Key Prefix",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisKeyPrefixVar: { 
        type: "text", 
        description: "Environment variable name that contains the Redis key prefix. Alternative to hardcoding the prefix directly. Allows dynamic configuration per environment.", 
        label: "Redis Key Prefix Var",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisMaxListeners: { 
        type: "number", 
        description: "Maximum number of event listeners Redis client can have. Default is 10. Increase if you get 'MaxListenersExceededWarning' in logs with high traffic.", 
        label: "Redis Max Listeners",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisPingInterval: { 
        type: "number", 
        description: "Interval in milliseconds for Redis connection health checks. Default 30000 (30s). Lower values detect failures faster but increase network traffic.", 
        label: "Redis Ping Interval",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      redisUseAlternativeDNSLookup: { 
        type: "boolean", 
        description: "Use alternative DNS resolution for Redis connections. Enable if experiencing DNS issues in containerized environments or with certain cloud providers.", 
        label: "Alternative DNS Lookup",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database"
      },
      
      // Authentication
      allowRegistration: { 
        type: "boolean", 
        description: "When enabled, allows new users to create accounts. Disable for invite-only or enterprise deployments where accounts are managed externally.", 
        label: "Allow Registration",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication"
      },
      allowEmailLogin: { 
        type: "boolean", 
        description: "Enables login with email and password. Core authentication method. Disable only if using social login exclusively.", 
        label: "Allow Email Login",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication"
      },
      allowSocialLogin: { 
        type: "boolean", 
        description: "Enables OAuth login with configured providers (Google, GitHub, Discord, etc.). Requires setting up OAuth credentials for each provider.", 
        label: "Allow Social Login",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication"
      },
      allowSocialRegistration: { 
        type: "boolean", 
        description: "Allows new account creation via social OAuth providers. Users can sign up using Google, GitHub, etc. without email verification.", 
        label: "Allow Social Registration",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication"
      },
      allowPasswordReset: { 
        type: "boolean", 
        description: "Enables password reset functionality via email. Requires email service configuration (SMTP or Mailgun) to send reset links to users.", 
        label: "Allow Password Reset",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication"
      },
      
      // Email - Composite Progressive Disclosure
      emailComposite: { 
        type: "email-composite", 
        description: "Email service configuration with progressive disclosure. Choose your email provider (SMTP or Mailgun) and configure only the relevant settings. Maintains backward compatibility with existing configurations.", 
        label: "Email Service",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#email-configuration",
        docSection: "Email Configuration"
      },
      
      // OAuth Providers - Progressive Disclosure Interface
      oauthProviders: { 
        type: "oauth-providers", 
        description: "OAuth social login providers with smart progressive disclosure. Enable only the providers you need and configure them individually. No more seeing irrelevant configuration fields!", 
        label: "OAuth Providers",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#oauth",
        docSection: "OAuth Configuration"
      },
      
      // Core AI APIs
      openaiApiKey: { type: "password", description: "OpenAI API key", label: "OpenAI API Key" },
      anthropicApiKey: { type: "password", description: "Anthropic API key", label: "Anthropic API Key" },
      googleApiKey: { type: "password", description: "Google AI API key", label: "Google AI API Key" },
      groqApiKey: { type: "password", description: "Groq API key", label: "Groq API Key" },
      mistralApiKey: { type: "password", description: "Mistral AI API key", label: "Mistral API Key" },
      
      // Extended AI APIs
      deepseekApiKey: { type: "password", description: "DeepSeek API key", label: "DeepSeek API Key" },
      perplexityApiKey: { type: "password", description: "Perplexity API key", label: "Perplexity API Key" },
      fireworksApiKey: { type: "password", description: "Fireworks API key", label: "Fireworks API Key" },
      togetheraiApiKey: { type: "password", description: "Together AI API key", label: "Together AI API Key" },
      huggingfaceToken: { type: "password", description: "HuggingFace token", label: "HuggingFace Token" },
      xaiApiKey: { type: "password", description: "xAI (Grok) API key", label: "xAI API Key" },
      nvidiaApiKey: { type: "password", description: "NVIDIA API key", label: "NVIDIA API Key" },
      sambaNovaApiKey: { type: "password", description: "SambaNova API key", label: "SambaNova API Key" },
      hyperbolicApiKey: { type: "password", description: "Hyperbolic API key", label: "Hyperbolic API Key" },
      klusterApiKey: { type: "password", description: "Kluster API key", label: "Kluster API Key" },
      nanogptApiKey: { type: "password", description: "NanoGPT API key", label: "NanoGPT API Key" },
      glhfApiKey: { type: "password", description: "GLHF API key", label: "GLHF API Key" },
      apipieApiKey: { type: "password", description: "APIpie API key", label: "APIpie API Key" },
      unifyApiKey: { type: "password", description: "Unify API key", label: "Unify API Key" },
      openrouterKey: { type: "password", description: "OpenRouter API key", label: "OpenRouter API Key" },
      
      // Azure OpenAI
      azureApiKey: { type: "password", description: "Azure OpenAI API key", label: "Azure API Key" },
      azureOpenaiApiInstanceName: { type: "text", description: "Azure OpenAI instance name", label: "Azure Instance Name" },
      azureOpenaiApiDeploymentName: { type: "text", description: "Azure OpenAI deployment name", label: "Azure Deployment Name" },
      azureOpenaiApiVersion: { type: "text", description: "Azure OpenAI API version", label: "Azure API Version" },
      azureOpenaiModels: { type: "text", description: "Azure OpenAI models", label: "Azure OpenAI Models" },
      
      // AWS Bedrock
      awsAccessKeyId: { type: "password", description: "AWS access key ID", label: "AWS Access Key ID" },
      awsSecretAccessKey: { type: "password", description: "AWS secret access key", label: "AWS Secret Access Key" },
      awsRegion: { type: "text", description: "AWS region", label: "AWS Region" },
      awsBedrockRegion: { type: "text", description: "AWS Bedrock region", label: "AWS Bedrock Region" },
      awsEndpointURL: { type: "text", description: "AWS endpoint URL", label: "AWS Endpoint URL" },
      awsBucketName: { type: "text", description: "AWS S3 bucket name", label: "AWS Bucket Name" },
      
      // File Storage
      fileUploadPath: { type: "text", description: "Local file upload path", label: "File Upload Path" },
      firebaseApiKey: { type: "password", description: "Firebase API key", label: "Firebase API Key" },
      firebaseAuthDomain: { type: "text", description: "Firebase auth domain", label: "Firebase Auth Domain" },
      firebaseProjectId: { type: "text", description: "Firebase project ID", label: "Firebase Project ID" },
      firebaseStorageBucket: { type: "text", description: "Firebase storage bucket", label: "Firebase Storage Bucket" },
      firebaseMessagingSenderId: { type: "text", description: "Firebase messaging sender ID", label: "Firebase Messaging Sender ID" },
      firebaseAppId: { type: "text", description: "Firebase app ID", label: "Firebase App ID" },
      azureStorageConnectionString: { type: "password", description: "Azure storage connection string", label: "Azure Storage Connection String" },
      azureStoragePublicAccess: { type: "boolean", description: "Azure storage public access", label: "Azure Storage Public Access" },
      azureContainerName: { type: "text", description: "Azure container name", label: "Azure Container Name" },
      
      // External APIs
      openweatherApiKey: { type: "password", description: "OpenWeather API key for weather information", label: "OpenWeather API Key" },
      librechatCodeApiKey: { type: "password", description: "LibreChat Code API key for code execution", label: "LibreChat Code API Key" },
      
      // RAG API
      ragApiURL: { type: "text", description: "RAG API URL", label: "RAG API URL" },
      ragOpenaiApiKey: { type: "password", description: "RAG OpenAI API key", label: "RAG OpenAI API Key" },
      ragPort: { type: "number", description: "RAG API port", label: "RAG Port" },
      ragHost: { type: "text", description: "RAG API host", label: "RAG Host" },
      collectionName: { type: "text", description: "Collection name", label: "Collection Name" },
      chunkSize: { type: "number", description: "Chunk size", label: "Chunk Size" },
      chunkOverlap: { type: "number", description: "Chunk overlap", label: "Chunk Overlap" },
      embeddingsProvider: { type: "text", description: "Embeddings provider", label: "Embeddings Provider" },
      
      // MeiliSearch - 1-Click Integration with Docker Support
      meilisearchIntegration: { 
        type: "meilisearch-integration", 
        description: "1-click MeiliSearch integration with automatic Docker setup, secure key generation, and conversation search capabilities. Improves LibreChat with powerful search functionality.", 
        label: "MeiliSearch Integration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/search",
        docSection: "Search Configuration"
      },
      
      // Rate & Security
      limitConcurrentMessages: { type: "boolean", description: "Limit concurrent messages", label: "Limit Concurrent Messages" },
      concurrentMessageMax: { type: "number", description: "Max concurrent messages", label: "Concurrent Message Max" },
      banViolations: { type: "boolean", description: "Ban violations", label: "Ban Violations" },
      banDuration: { type: "number", description: "Ban duration", label: "Ban Duration" },
      banInterval: { type: "number", description: "Ban interval", label: "Ban Interval" },
      loginViolationScore: { type: "number", description: "Login violation score", label: "Login Violation Score" },
      registrationViolationScore: { type: "number", description: "Registration violation score", label: "Registration Violation Score" },
      concurrentViolationScore: { type: "number", description: "Concurrent violation score", label: "Concurrent Violation Score" },
      messageViolationScore: { type: "number", description: "Message violation score", label: "Message Violation Score" },
      nonBrowserViolationScore: { type: "number", description: "Non-browser violation score", label: "Non-Browser Violation Score" },
      loginMax: { type: "number", description: "Login max attempts", label: "Login Max" },
      loginWindow: { type: "number", description: "Login window", label: "Login Window" },
      
      // LDAP
      ldapURL: { type: "text", description: "LDAP server URL", label: "LDAP URL" },
      ldapBindDN: { type: "text", description: "LDAP bind DN", label: "LDAP Bind DN" },
      ldapBindCredentials: { type: "password", description: "LDAP bind credentials", label: "LDAP Bind Credentials" },
      ldapSearchBase: { type: "text", description: "LDAP search base", label: "LDAP Search Base" },
      ldapSearchFilter: { type: "text", description: "LDAP search filter", label: "LDAP Search Filter" },
      
      // Turnstile
      turnstileSiteKey: { type: "text", description: "Turnstile site key", label: "Turnstile Site Key" },
      turnstileSecretKey: { type: "password", description: "Turnstile secret key", label: "Turnstile Secret Key" },
      
      // Features
      allowSharedLinks: { type: "boolean", description: "Allow shared links", label: "Allow Shared Links" },
      allowSharedLinksPublic: { type: "boolean", description: "Allow public shared links", label: "Allow Public Shared Links" },
      titleConvo: { type: "boolean", description: "Generate conversation titles", label: "Title Conversations" },
      summaryConvo: { type: "boolean", description: "Generate conversation summaries", label: "Summary Conversations" },
      
      // Caching - 1-Click Performance Presets
      cachingIntegration: { 
        type: "caching-integration", 
        description: "1-click caching presets for optimal performance. Choose from Performance Optimized, Balanced, Development, or No Caching configurations based on your deployment needs.", 
        label: "Caching Strategy",
        docUrl: "https://www.librechat.ai/docs/deployment/caching",
        docSection: "Caching Configuration"
      },
      
      // File Storage - Progressive Disclosure for Storage Strategy
      fileStorage: { 
        type: "file-storage", 
        description: "File storage configuration with smart progressive disclosure. Choose your storage strategy first (Local, Firebase, Azure Blob, or S3), then configure only the relevant settings for your chosen provider.", 
        label: "File Storage Configuration",
        docUrl: "https://www.librechat.ai/docs/deployment/file-handling",
        docSection: "File Storage Configuration"
      },
      
      // MCP
      mcpOauthOnAuthError: { type: "text", description: "MCP OAuth on auth error", label: "MCP OAuth On Auth Error" },
      mcpOauthDetectionTimeout: { type: "number", description: "MCP OAuth detection timeout", label: "MCP OAuth Detection Timeout" },
      
      // Users - System-Level Deployment Configuration
      uid: { 
        type: "number", 
        description: "System User ID for LibreChat processes. IMPORTANT: This controls what system user LibreChat runs as, NOT application users. Set this for Docker deployments (e.g., 1000 to match your host user), security hardening (avoid root/0), and file permission management. Essential for production deployments to prevent permission issues and follow security best practices.", 
        label: "UID (System User ID)",
        placeholder: "1000",
        docUrl: "https://www.librechat.ai/docs/deployment/docker",
        docSection: "Docker Security" 
      },
      gid: { 
        type: "number", 
        description: "System Group ID for LibreChat processes. Companion to UID for complete user/group context. Set to match your deployment environment (e.g., 1000 for typical non-root user). Ensures LibreChat files and directories have correct ownership for security isolation and preventing privilege escalation. Critical for multi-tenant servers and enterprise compliance.", 
        label: "GID (System Group ID)",
        placeholder: "1000",
        docUrl: "https://www.librechat.ai/docs/deployment/docker",
        docSection: "Docker Security" 
      },
      
      // Debug
      debugLogging: { type: "boolean", description: "Enable debug logging", label: "Debug Logging" },
      debugConsole: { type: "boolean", description: "Enable debug console", label: "Debug Console" },
      consoleJSON: { type: "boolean", description: "Console JSON format", label: "Console JSON" },
      
      // Miscellaneous - CDN & Static Asset Configuration
      cdnProvider: { 
        type: "select", 
        description: "CDN Provider for static asset delivery. In LibreChat, this refers to the service used to host and deliver static assets (images, CSS, JavaScript files) via a Content Delivery Network rather than directly from your application server. DEFAULT: LibreChat uses a public CDN (hosted by CodeSandbox) for static assets, but you can override this with your own CDN provider. Choose based on your infrastructure, performance needs, and cost requirements.", 
        label: "CDN Provider Strategy",
        docUrl: "https://www.librechat.ai/docs/deployment/file-handling",
        docSection: "CDN Configuration"
      },
      
      // MCP Servers
      mcpServers: { 
        type: "mcp-servers", 
        description: "MCP servers configuration. Each server supports: type (stdio/websocket/sse/streamable-http), command, args, url, timeout, headers, serverInstructions, iconPath, chatMenu, customUserVars.", 
        label: "MCP Servers",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/mcp",
        docSection: "MCP Configuration"
      },

      // Custom Endpoints
      "endpoints.custom": {
        type: "custom-endpoints",
        description: "Create multiple OpenAI-compatible endpoints with individual API keys and friendly names (e.g., 'OpenAI - Work', 'OpenAI - Personal'). Perfect for organizing API usage by project, team, or billing account. Each endpoint can be assigned to specific agents for isolated usage tracking.",
        label: "Custom Endpoints",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/custom_endpoint",
        docSection: "Custom Endpoints Configuration"
      },

      // OCR Configuration
      "ocr.apiKey": { 
        type: "password", 
        description: "API key for OCR service", 
        label: "OCR API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration" 
      },
      "ocr.baseURL": { 
        type: "text", 
        description: "Base URL for OCR service API", 
        label: "OCR Base URL",
        placeholder: "https://api.ocr-service.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration" 
      },
      "ocr.strategy": { 
        type: "select", 
        description: "OCR processing strategy - Mistral OCR or custom OCR service", 
        label: "OCR Strategy",
        options: [
          { value: "mistral_ocr", label: "Mistral OCR" },
          { value: "custom_ocr", label: "Custom OCR" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration" 
      },
      "ocr.mistralModel": { 
        type: "text", 
        description: "Mistral model to use for OCR processing", 
        label: "OCR Mistral Model",
        placeholder: "mistral-7b-instruct-v0.1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration" 
      },
      
      // Core Settings
      version: { type: "text", description: "LibreChat version", label: "Version" },
      cache: { type: "boolean", description: "Enable caching", label: "Cache" },
      fileStrategy: { type: "object", description: "File storage strategy. Can be 'local', 's3', 'firebase', 'azure_blob' as string, or object with per-type strategies: {avatar: 'local', image: 's3', document: 'local'}", label: "File Strategy" },
      secureImageLinks: { type: "boolean", description: "Use secure image links", label: "Secure Image Links" },
      imageOutputType: { type: "select", description: "Format for generated images. Choose quality vs compatibility vs size.", label: "Image Output Type" },
      filteredTools: { type: "array", description: "Filtered tools list", label: "Filtered Tools" },
      includedTools: { type: "array", description: "Included tools list", label: "Included Tools" },
      temporaryChatRetention: { type: "number", description: "Temporary chat retention hours", label: "Chat Retention Hours" },
      
      // Speech-to-Text Configuration  
      "stt.provider": { 
        type: "select", 
        description: "STT service provider - OpenAI, Azure, Google, Deepgram, AssemblyAI, or Local", 
        label: "STT Provider",
        options: [
          { value: "openai", label: "OpenAI" },
          { value: "azure", label: "Azure" },
          { value: "google", label: "Google" },
          { value: "deepgram", label: "Deepgram" },
          { value: "assemblyai", label: "AssemblyAI" },
          { value: "local", label: "Local" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.model": { 
        type: "text", 
        description: "STT model name to use with the selected provider", 
        label: "STT Model",
        placeholder: "whisper-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.apiKey": { 
        type: "password", 
        description: "API key for STT service", 
        label: "STT API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.baseURL": { 
        type: "text", 
        description: "Base URL for STT service API", 
        label: "STT Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.language": { 
        type: "text", 
        description: "Language for STT processing (e.g., en, es, fr, de)", 
        label: "STT Language",
        placeholder: "en",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.streaming": { 
        type: "boolean", 
        description: "Enable real-time STT streaming processing", 
        label: "STT Streaming",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.punctuation": { 
        type: "boolean", 
        description: "Enable automatic punctuation in STT output", 
        label: "STT Punctuation",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      "stt.profanityFilter": { 
        type: "boolean", 
        description: "Enable profanity filtering in STT output", 
        label: "STT Profanity Filter",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration"
      },
      
      // Text-to-Speech Configuration
      "tts.provider": { 
        type: "select", 
        description: "TTS service provider - OpenAI, Azure, Google, ElevenLabs, AWS, or Local", 
        label: "TTS Provider",
        options: [
          { value: "openai", label: "OpenAI" },
          { value: "azure", label: "Azure" },
          { value: "google", label: "Google" },
          { value: "elevenlabs", label: "ElevenLabs" },
          { value: "aws", label: "AWS" },
          { value: "local", label: "Local" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.model": { 
        type: "text", 
        description: "TTS model name to use with the selected provider", 
        label: "TTS Model",
        placeholder: "tts-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.voice": { 
        type: "text", 
        description: "Voice to use for TTS synthesis (e.g., alloy, echo, fable, onyx, nova, shimmer)", 
        label: "TTS Voice",
        placeholder: "alloy",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.apiKey": { 
        type: "password", 
        description: "API key for TTS service", 
        label: "TTS API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.baseURL": { 
        type: "text", 
        description: "Base URL for TTS service API", 
        label: "TTS Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.speed": { 
        type: "number", 
        description: "Speech speed for TTS synthesis (0.25 to 4.0)", 
        label: "TTS Speed",
        placeholder: "1.0",
        min: 0.25,
        max: 4.0,
        step: 0.25,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.quality": { 
        type: "select", 
        description: "Audio quality for TTS output - Standard or HD", 
        label: "TTS Quality",
        options: [
          { value: "standard", label: "Standard" },
          { value: "hd", label: "HD" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      "tts.streaming": { 
        type: "boolean", 
        description: "Enable real-time TTS streaming for faster response", 
        label: "TTS Streaming",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration"
      },
      
      // Assistants Configuration
      "endpoints.assistants.disableBuilder": { 
        type: "boolean", 
        description: "Disable the built-in assistant builder interface", 
        label: "Disable Assistant Builder",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.pollIntervalMs": { 
        type: "number", 
        description: "Polling interval for assistant status checks in milliseconds (500-10000)", 
        label: "Poll Interval (ms)",
        placeholder: "3000",
        min: 500,
        max: 10000,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.timeoutMs": { 
        type: "number", 
        description: "Timeout for assistant requests in milliseconds (30000-600000)", 
        label: "Timeout (ms)",
        placeholder: "180000",
        min: 30000,
        max: 600000,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.supportedIds": { 
        type: "array", 
        description: "Array of supported assistant IDs - only these assistants will be available", 
        label: "Supported Assistant IDs",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.excludedIds": { 
        type: "array", 
        description: "Array of assistant IDs to exclude from availability", 
        label: "Excluded Assistant IDs",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.privateAssistants": { 
        type: "boolean", 
        description: "Enable private assistants that are only visible to their creators", 
        label: "Private Assistants",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.retrievalModels": { 
        type: "array", 
        description: "Array of models available for retrieval operations", 
        label: "Retrieval Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      "endpoints.assistants.capabilities": { 
        type: "array", 
        description: "Array of capabilities available to assistants", 
        label: "Assistant Capabilities",
        options: [
          { value: "code_interpreter", label: "Code Interpreter" },
          { value: "retrieval", label: "Retrieval" },
          { value: "actions", label: "Actions" },
          { value: "tools", label: "Tools" },
          { value: "image_vision", label: "Image Vision" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration"
      },
      
      // Agents Configuration
      "endpoints.agents.recursionLimit": { 
        type: "number", 
        description: "Maximum depth of recursive reasoning for agent chains (1-100)", 
        label: "Recursion Limit",
        placeholder: "25",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.maxRecursionLimit": { 
        type: "number", 
        description: "Maximum allowed recursion limit that can be set (1-200)", 
        label: "Max Recursion Limit",
        placeholder: "25",
        min: 1,
        max: 200,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.disableBuilder": { 
        type: "boolean", 
        description: "Disable the built-in agent builder interface", 
        label: "Disable Agent Builder",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.maxCitations": { 
        type: "number", 
        description: "Maximum number of citations per agent response (1-100)", 
        label: "Max Citations",
        placeholder: "30",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.maxCitationsPerFile": { 
        type: "number", 
        description: "Maximum citations allowed from a single file (1-20)", 
        label: "Max Citations Per File",
        placeholder: "7",
        min: 1,
        max: 20,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.minRelevanceScore": { 
        type: "number", 
        description: "Minimum relevance score for including search results (0.0-1.0)", 
        label: "Min Relevance Score",
        placeholder: "0.45",
        min: 0,
        max: 1,
        step: 0.01,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      "endpoints.agents.capabilities": { 
        type: "array", 
        description: "Array of capabilities available to agents", 
        label: "Agent Capabilities",
        options: [
          { value: "execute_code", label: "Execute Code" },
          { value: "file_search", label: "File Search" },
          { value: "actions", label: "Actions" },
          { value: "tools", label: "Tools" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration"
      },
      
      // Actions Configuration
      "actions.allowedDomains": { 
        type: "array", 
        description: "Array of allowed domains for action execution - domains not on this list will be blocked for security", 
        label: "Allowed Domains",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/actions",
        docSection: "Actions Configuration"
      },
      
      // Registration Nested Object Fields (path-based)
      "registration.socialLogins": { type: "array", description: "Enabled social login providers", label: "Social Login Providers" },
      "registration.allowedDomains": { type: "array", description: "Allowed domains for registration", label: "Allowed Domains" },
      
      // File Config Nested Object Fields (path-based)
      "fileConfig.serverFileSizeLimit": { type: "number", description: "Server file size limit in MB", label: "Server File Size Limit (MB)" },
      "fileConfig.avatarSizeLimit": { type: "number", description: "Avatar size limit in MB", label: "Avatar Size Limit (MB)" },
      "fileConfig.clientImageResize.enabled": { type: "boolean", description: "Enable client-side image resize", label: "Client Image Resize" },
      "fileConfig.clientImageResize.maxWidth": { type: "number", description: "Max width for image resize", label: "Max Resize Width" },
      "fileConfig.clientImageResize.maxHeight": { type: "number", description: "Max height for image resize", label: "Max Resize Height" },
      "fileConfig.clientImageResize.quality": { type: "number", description: "Image resize quality (0.1-1.0)", label: "Resize Quality" },
      "fileConfig.clientImageResize.compressFormat": { type: "select", description: "Image compression format", label: "Compress Format" },
      
      // Web Search Configuration - Progressive Disclosure Interface
      webSearch: { 
        type: "web-search", 
        description: "Web search configuration with smart progressive disclosure - choose providers and only see relevant API key fields", 
        label: "Web Search Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/websearch",
        docSection: "Web Search Configuration"
      },
      
      // Rate Limits Nested Object Fields
      rateLimitsFileUploadsIpMax: { type: "number", description: "Max file uploads per IP", label: "File Uploads IP Max" },
      rateLimitsFileUploadsIpWindowInMinutes: { type: "number", description: "File uploads IP window (minutes)", label: "File Uploads IP Window" },
      rateLimitsFileUploadsUserMax: { type: "number", description: "Max file uploads per user", label: "File Uploads User Max" },
      rateLimitsFileUploadsUserWindowInMinutes: { type: "number", description: "File uploads user window (minutes)", label: "File Uploads User Window" },
      rateLimitsConversationsImportIpMax: { type: "number", description: "Max conversation imports per IP", label: "Conv Import IP Max" },
      rateLimitsConversationsImportIpWindowInMinutes: { type: "number", description: "Conversation import IP window (minutes)", label: "Conv Import IP Window" },
      rateLimitsConversationsImportUserMax: { type: "number", description: "Max conversation imports per user", label: "Conv Import User Max" },
      rateLimitsConversationsImportUserWindowInMinutes: { type: "number", description: "Conversation import user window (minutes)", label: "Conv Import User Window" },
      rateLimitsSttIpMax: { type: "number", description: "Max STT requests per IP", label: "STT IP Max" },
      rateLimitsSttIpWindowInMinutes: { type: "number", description: "STT IP window (minutes)", label: "STT IP Window" },
      rateLimitsSttUserMax: { type: "number", description: "Max STT requests per user", label: "STT User Max" },
      rateLimitsSttUserWindowInMinutes: { type: "number", description: "STT user window (minutes)", label: "STT User Window" },
      rateLimitsTtsIpMax: { type: "number", description: "Max TTS requests per IP", label: "TTS IP Max" },
      rateLimitsTtsIpWindowInMinutes: { type: "number", description: "TTS IP window (minutes)", label: "TTS IP Window" },
      rateLimitsTtsUserMax: { type: "number", description: "Max TTS requests per user", label: "TTS User Max" },
      rateLimitsTtsUserWindowInMinutes: { type: "number", description: "TTS user window (minutes)", label: "TTS User Window" },
      
      // Interface Nested Object Fields (path-based)
      "interface.fileSearch": { type: "boolean", description: "Enable file search in interface", label: "File Search" },
      "interface.uploadAsText": { type: "boolean", description: "Enable upload as text feature", label: "Upload as Text" },
      "interface.privacyPolicy.externalUrl": { type: "text", description: "External privacy policy URL", label: "Privacy Policy URL" },
      "interface.privacyPolicy.openNewTab": { type: "boolean", description: "Open privacy policy in new tab", label: "Privacy Policy New Tab" },
      "interface.termsOfService.externalUrl": { type: "text", description: "External terms of service URL", label: "Terms of Service URL" },
      "interface.termsOfService.openNewTab": { type: "boolean", description: "Open terms in new tab", label: "Terms New Tab" },
      "interface.termsOfService.modalAcceptance": { type: "boolean", description: "Require modal acceptance of terms", label: "Terms Modal Acceptance" },
      "interface.termsOfService.modalTitle": { type: "text", description: "Terms modal title", label: "Terms Modal Title" },
      "interface.termsOfService.modalContent": { type: "textarea", description: "Terms modal content", label: "Terms Modal Content" },
      "interface.endpointsMenu": { type: "boolean", description: "Show endpoints menu", label: "Endpoints Menu" },
      "interface.modelSelect": { type: "boolean", description: "Show model selection", label: "Model Select" },
      "interface.parameters": { type: "boolean", description: "Show parameters panel", label: "Parameters Panel" },
      "interface.sidePanel": { type: "boolean", description: "Show side panel", label: "Side Panel" },
      "interface.presets": { type: "boolean", description: "Show presets", label: "Presets" },
      "interface.prompts": { type: "boolean", description: "Show prompts", label: "Prompts" },
      "interface.bookmarks": { type: "boolean", description: "Show bookmarks", label: "Bookmarks" },
      "interface.multiConvo": { type: "boolean", description: "Enable multiple conversations", label: "Multi Conversation" },
      "interface.agents": { type: "boolean", description: "Show agents", label: "Agents" },
      "interface.peoplePicker.users": { type: "boolean", description: "Show users in people picker", label: "People Picker Users" },
      "interface.peoplePicker.groups": { type: "boolean", description: "Show groups in people picker", label: "People Picker Groups" },
      "interface.peoplePicker.roles": { type: "boolean", description: "Show roles in people picker", label: "People Picker Roles" },
      "interface.marketplace.use": { type: "boolean", description: "Enable marketplace usage", label: "Marketplace" },
      "interface.fileCitations": { type: "boolean", description: "Show file citations", label: "File Citations" },
      
      // MCP Servers - now handled by specialized editor, so no individual nested fields needed
    };
    
    return fieldMap[fieldName] || { type: "text", description: `Configuration for ${fieldName}`, label: fieldName };
  };

  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white shadow-lg border-r border-border h-screen sticky top-16 overflow-y-auto">
        <div className="p-6">
          {/* Search functionality */}
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10"
              data-testid="search-settings"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <nav className="space-y-1">
            {/* Render grouped tabs with headers */}
            {tabGroups.map((group, groupIndex) => {
              const groupTabs = group.tabs.filter(tab => 
                searchQuery === "" || 
                tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tab.settings.some(setting => 
                  setting.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
              
              if (groupTabs.length === 0) return null;
              
              return (
                <div key={group.label}>
                  {/* Group Header */}
                  <div className="px-2 py-2 mt-4 first:mt-0">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.label}
                    </h3>
                  </div>
                  
                  {/* Group Tabs */}
                  <div className="space-y-1">
                    {groupTabs.map((tab) => {
                      const Icon = tab.icon;
                      const progress = getTabProgress(tab.settings);
                      const isActive = activeTab === tab.id;
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          data-testid={`tab-${tab.id}`}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg shadow-sm transition-all ${
                            isActive 
                              ? `bg-gradient-to-r ${tab.color} text-white` 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="text-left flex-1">
                            <div className="font-medium">{tab.label}</div>
                            <div className="text-xs opacity-90">{tab.description}</div>
                          </div>
                          <StatusIndicator 
                            status={progress === 100 ? "valid" : progress > 50 ? "pending" : "invalid"}
                            count={`${Math.floor((progress / 100) * tab.settings.length)}/${tab.settings.length}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* Render remaining ungrouped tabs if any */}
            {filteredTabs.filter(tab => 
              !tabGroups.some(group => group.tabs.some(groupTab => groupTab.id === tab.id))
            ).map((tab) => {
              const Icon = tab.icon;
              const progress = getTabProgress(tab.settings);
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg shadow-sm transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${tab.color} text-white` 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-90">{tab.description}</div>
                  </div>
                  <StatusIndicator 
                    status={progress === 100 ? "valid" : progress > 50 ? "pending" : "invalid"}
                    count={`${Math.floor((progress / 100) * tab.settings.length)}/${tab.settings.length}`}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Dynamic Tab Content Generation */}
          {allTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="space-y-8">
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${tab.color.replace('from-', 'from-').replace('to-', 'to-').replace('-500', '-100').replace('-600', '-200')} rounded-lg flex items-center justify-center`}>
                          <tab.icon className={`h-5 w-5 ${tab.color.replace('from-', 'text-').replace('to-', '').replace('-500', '-600').replace('-600', '-700').split(' ')[0]}`} />
                        </div>
                        <div>
                          <CardTitle>{tab.label} Configuration</CardTitle>
                          <CardDescription>{tab.description}</CardDescription>
                        </div>
                      </div>
                      <StatusIndicator 
                        status={getTabProgress(tab.settings) === 100 ? "valid" : getTabProgress(tab.settings) > 50 ? "pending" : "invalid"}
                        count={`${Math.floor((getTabProgress(tab.settings) / 100) * tab.settings.length)}/${tab.settings.length}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tab.settings.map((setting) => {
                      const fieldInfo = getFieldInfo(setting);
                      
                      // Get options for select fields
                      const getSelectOptions = (fieldName: string): string[] => {
                        switch (fieldName) {
                          case 'imageOutputType':
                            return ['png', 'webp', 'jpeg', 'url'];
                          case 'nodeEnv':
                            return ['development', 'production'];
                          case 'ocrStrategy':
                            return ['mistral_ocr', 'custom_ocr'];
                          case 'stt.provider':
                            return ['openai', 'azure', 'google', 'deepgram', 'assemblyai', 'local'];
                          case 'tts.provider':
                            return ['openai', 'azure', 'google', 'elevenlabs', 'aws', 'local'];
                          case 'tts.quality':
                            return ['standard', 'hd'];
                          // webSearch provider options now handled by specialized editor
                          // mcpServersType is now handled by specialized MCP editor
                          case 'fileConfig.clientImageResize.compressFormat':
                            return ['jpeg', 'webp'];
                          case 'cdnProvider':
                            return ['default', 'local', 's3', 'azure_blob', 'firebase'];
                          default:
                            return [];
                        }
                      };
                      
                      // Special handling for emailComposite field
                      if (setting === "emailComposite") {
                        // Build composite value from individual email fields
                        const emailCompositeValue = {
                          serviceType: configuration.mailgunApiKey || configuration.mailgunDomain ? "mailgun" : 
                                     configuration.emailService || configuration.emailUsername ? "smtp" : "",
                          emailService: configuration.emailService,
                          emailUsername: configuration.emailUsername,
                          emailPassword: configuration.emailPassword,
                          emailFrom: configuration.emailFrom,
                          emailFromName: configuration.emailFromName,
                          mailgunApiKey: configuration.mailgunApiKey,
                          mailgunDomain: configuration.mailgunDomain,
                          mailgunHost: configuration.mailgunHost,
                        };
                        
                        return (
                          <SettingInput
                            key={setting}
                            label={fieldInfo.label}
                            description={fieldInfo.description}
                            docUrl={fieldInfo.docUrl}
                            docSection={fieldInfo.docSection}
                            type={fieldInfo.type}
                            value={emailCompositeValue}
                            onChange={(emailData) => {
                              // Spread composite object back into individual flat fields
                              // Explicitly clear inactive provider fields based on serviceType from emailData
                              const clearedConfig = { ...configuration };
                              
                              if (emailData.serviceType === "smtp") {
                                // Clear Mailgun fields, keep SMTP fields
                                clearedConfig.emailService = emailData.emailService ?? null;
                                clearedConfig.emailUsername = emailData.emailUsername ?? null;
                                clearedConfig.emailPassword = emailData.emailPassword ?? null;
                                clearedConfig.emailFrom = emailData.emailFrom ?? null;
                                clearedConfig.emailFromName = emailData.emailFromName ?? null;
                                clearedConfig.mailgunApiKey = null;
                                clearedConfig.mailgunDomain = null;
                                clearedConfig.mailgunHost = null;
                              } else if (emailData.serviceType === "mailgun") {
                                // Clear SMTP fields, keep Mailgun fields
                                clearedConfig.emailService = null;
                                clearedConfig.emailUsername = null;
                                clearedConfig.emailPassword = null;
                                clearedConfig.emailFrom = null;
                                clearedConfig.emailFromName = null;
                                clearedConfig.mailgunApiKey = emailData.mailgunApiKey ?? null;
                                clearedConfig.mailgunDomain = emailData.mailgunDomain ?? null;
                                clearedConfig.mailgunHost = emailData.mailgunHost ?? null;
                              } else {
                                // Clear all fields when no provider selected
                                clearedConfig.emailService = null;
                                clearedConfig.emailUsername = null;
                                clearedConfig.emailPassword = null;
                                clearedConfig.emailFrom = null;
                                clearedConfig.emailFromName = null;
                                clearedConfig.mailgunApiKey = null;
                                clearedConfig.mailgunDomain = null;
                                clearedConfig.mailgunHost = null;
                              }
                              
                              onConfigurationChange(clearedConfig);
                            }}
                            options={fieldInfo.type === 'select' ? getSelectOptions(setting) : undefined}
                            data-testid={`input-${setting}`}
                          />
                        );
                      }
                      
                      return (
                        <SettingInput
                          key={setting}
                          label={fieldInfo.label}
                          description={fieldInfo.description}
                          docUrl={fieldInfo.docUrl}
                          docSection={fieldInfo.docSection}
                          type={fieldInfo.type}
                          value={getNestedValue(configuration, setting) || ""}
                          onChange={(value) => onConfigurationChange(setNestedValue(configuration, setting, value))}
                          options={fieldInfo.type === 'select' ? getSelectOptions(setting) : undefined}
                          data-testid={`input-${setting}`}
                        />
                      );
                    })}
                    {tab.settings.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <tab.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>This section will contain configuration options for {tab.label.toLowerCase()}.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}