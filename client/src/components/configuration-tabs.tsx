import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SettingInput } from "./setting-input";
import { StatusIndicator } from "./status-indicator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
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
  Terminal,
  Copy,
  Sparkles,
  Info
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
  const [activeTab, setActiveTab] = useState("ui-visibility");
  const { toast } = useToast();

  const copyToClipboard = async (content: string, name: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to Clipboard",
        description: `${name} has been copied to your clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateE2BOpenAPISchema = (port: number = 3001): string => {
    const proxyUrl = `http://e2b-proxy:${port}`;
    
    return `openapi: 3.0.0
info:
  title: E2B Code Execution
  description: Execute Python/JavaScript code in isolated sandboxes. Generated files are saved and accessible via HTTP URLs.
  version: 1.0.0
servers:
  - url: ${proxyUrl}
    description: E2B Proxy Service
paths:
  /execute:
    post:
      operationId: e2b_execute_code
      summary: Execute Python or JavaScript code
      description: |
        Executes code in an isolated E2B sandbox and returns text output with URLs to any generated files.
        Files saved to /outputs directory in the sandbox are automatically stored and made accessible via HTTP.
        
        IMPORTANT: To generate images/files, save them to /outputs directory:
        - Python: plt.savefig('/outputs/chart.png')
        - JavaScript: fs.writeFileSync('/outputs/data.json', content)
        
        The response will include HTTP URLs to access the generated files.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - code
                - userId
              properties:
                code:
                  type: string
                  description: Python or JavaScript code to execute. Save files to /outputs to include them in the response.
                  example: |
                    import matplotlib.pyplot as plt
                    import numpy as np
                    
                    x = np.linspace(0, 10, 100)
                    y = np.sin(x)
                    
                    plt.figure(figsize=(10, 6))
                    plt.plot(x, y)
                    plt.title('Sine Wave')
                    plt.xlabel('X')
                    plt.ylabel('sin(X)')
                    plt.grid(True)
                    plt.savefig('/outputs/sine_wave.png')
                language:
                  type: string
                  enum: [python, javascript]
                  default: python
                  description: Programming language
                userId:
                  type: string
                  description: User ID for sandbox isolation and file access control
      responses:
        '200':
          description: Code executed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    description: Whether execution succeeded
                  output:
                    type: string
                    description: Text output including stdout, logs, and markdown-formatted image links
                    example: |
                      Chart created successfully!
                      
                      ![sine_wave.png](http://e2b-proxy:3001/files/abc123?userId=user-id)
                  error:
                    type: string
                    description: Error message if execution failed
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
        '500':
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string`;
  };

  // Define tab groups with logical organization
  const tabGroups = [
    {
      label: "CORE CONFIGURATION",
      tabs: [
        {
          id: "ui-visibility",
          label: "UI/Visibility",
          icon: Eye,
          description: "App Title, Welcome, Interface & Features",
          color: "from-purple-500 to-purple-600",
          settings: ["appTitle", "interface.customWelcome", "interface.customFooter", "helpAndFAQURL", "allowSharedLinks", "allowSharedLinksPublic", "titleConvo", "summaryConvo", "interface.fileSearch", "interface.uploadAsText", "interface.privacyPolicy.externalUrl", "interface.privacyPolicy.openNewTab", "interface.termsOfService.externalUrl", "interface.termsOfService.openNewTab", "interface.termsOfService.modalAcceptance", "interface.termsOfService.modalTitle", "interface.termsOfService.modalContent", "interface.endpointsMenu", "interface.modelSelect", "modelSpecs.addedEndpoints", "interface.parameters", "interface.sidePanel", "interface.presets", "interface.prompts", "interface.bookmarks", "interface.multiConvo", "interface.agents", "interface.peoplePicker.users", "interface.peoplePicker.groups", "interface.peoplePicker.roles", "interface.marketplace.use", "interface.fileCitations", "interface.runCode", "interface.artifacts"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface",
        },
        {
          id: "server",
          label: "Server",
          icon: Server,
          description: "Host, Port, Environment",
          color: "from-green-500 to-green-600",
          settings: ["host", "port", "enabledEndpoints", "nodeEnv", "domainClient", "domainServer", "noIndex"],
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
          settings: ["fileStorage", "fileConfig.endpoints", "fileConfig.serverFileSizeLimit", "fileConfig.avatarSizeLimit", "fileConfig.clientImageResize.enabled", "fileConfig.clientImageResize.maxWidth", "fileConfig.clientImageResize.maxHeight", "fileConfig.clientImageResize.quality", "fileConfig.clientImageResize.compressFormat"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        },
        {
          id: "search",
          label: "Search & APIs",
          icon: Search,
          description: "Web Search & External APIs",
          color: "from-violet-500 to-violet-600",
          settings: ["webSearch", "openweatherApiKey"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        },
        {
          id: "image-gen",
          label: "Image Generation",
          icon: Camera,
          description: "DALL-E Configuration",
          color: "from-pink-500 to-pink-600",
          settings: ["dalleApiKey", "dalle3ApiKey", "dalle2ApiKey", "dalleReverseProxy", "dalle3BaseUrl", "dalle2BaseUrl", "dalle3SystemPrompt", "dalle2SystemPrompt"],
          docUrl: "https://www.librechat.ai/docs/features/image_gen",
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
          description: "E2B (Self-Hosted) & LibreChat Code Interpreter (Paid API)",
          color: "from-cyan-500 to-cyan-600",
          settings: [
            "librechatCodeEnabled", "librechatCodeApiKey", "librechatCodeBaseUrl",
            "e2bApiKey", "e2bProxyEnabled", "e2bProxyPort", "e2bPublicBaseUrl", "e2bFileTTLDays", "e2bMaxFileSize", "e2bPerUserSandbox"
          ],
          docUrl: "https://www.librechat.ai/docs/features/code_interpreter",
        },
        {
          id: "artifacts",
          label: "Artifacts",
          icon: Sparkles,
          description: "Generative UI - React/HTML/Mermaid Components",
          color: "from-purple-500 to-pink-500",
          settings: [
            "sandpackBundlerUrl", "endpoints.agents.capabilities"
          ],
          docUrl: "https://www.librechat.ai/docs/features/artifacts",
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
      type: "text" | "number" | "password" | "boolean" | "select" | "textarea" | "array" | "object" | "mcp-servers" | "custom-endpoints" | "web-search" | "oauth-providers" | "meilisearch-integration" | "caching-integration" | "file-storage" | "email-composite" | "endpoint-file-limits"; 
      description: string; 
      label: string;
      docUrl?: string;
      docSection?: string;
      placeholder?: string;
      options?: Array<{ value: string; label: string }> | string[];
      min?: number;
      max?: number;
      step?: number;
      technical?: {
        envVar?: string;
        yamlPath?: string;
        configFile: ".env" | "librechat.yaml" | ".env & librechat.yaml";
      };
    }> = {
      // App Settings
      appTitle: { 
        type: "text", 
        description: "Sets the custom application title displayed in the browser tab and header. This overrides the default 'LibreChat' branding with your preferred name.", 
        label: "App Title",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "App Settings",
        technical: {
          envVar: "APP_TITLE",
          configFile: ".env"
        }
      },
      helpAndFAQURL: { 
        type: "text", 
        description: "URL to your help documentation or FAQ page. This creates a help link in the interface for user support.", 
        label: "Help & FAQ URL",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        docSection: "Interface Config",
        technical: {
          envVar: "HELP_AND_FAQ_URL",
          configFile: ".env"
        }
      },
      
      // Server
      host: { 
        type: "text", 
        description: "The address where LibreChat server listens for connections. Use 0.0.0.0 to accept connections from any IP address, or localhost for local-only access. Critical for Docker deployments.", 
        label: "Host",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#server-configuration",
        docSection: "Server Config",
        technical: { envVar: "HOST", configFile: ".env" }
      },
      port: { 
        type: "number", 
        description: "Port number where LibreChat runs. Default is 3080. Ensure this port is available and matches your Docker compose or proxy configuration.", 
        label: "Port",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#port",
        docSection: "Server Config",
        technical: { envVar: "PORT", configFile: ".env" }
      },
      enabledEndpoints: {
        type: "array",
        description: "Select which AI endpoints/providers to enable in LibreChat. Note: gptPlugins is deprecated - use 'agents' instead. Excluding gptPlugins hides the deprecated 'Plugins' menu.",
        label: "Enabled Endpoints",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#endpoints",
        docSection: "Server Config",
        technical: { envVar: "ENDPOINTS", configFile: ".env" }
      },
      nodeEnv: { 
        type: "select", 
        description: "Node.js environment mode. 'production' enables optimizations and security features. 'development' provides detailed error messages for debugging.", 
        label: "Environment",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#server-configuration",
        docSection: "Server Config",
        technical: { envVar: "NODE_ENV", configFile: ".env" }
      },
      domainClient: { 
        type: "text", 
        description: "Full URL where users access LibreChat (e.g., https://chat.yourcompany.com). Required for proper CORS, OAuth callbacks, and link generation.", 
        label: "Client Domain",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "Server Config",
        technical: { envVar: "DOMAIN_CLIENT", configFile: ".env" }
      },
      domainServer: { 
        type: "text", 
        description: "Internal server URL for API calls. Usually same as client domain unless using separate API server. Critical for proper routing and authentication.", 
        label: "Server Domain",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "Server Config",
        technical: { envVar: "DOMAIN_SERVER", configFile: ".env" }
      },
      noIndex: { 
        type: "boolean", 
        description: "When enabled, adds meta tags to prevent search engines (Google, Bing) from indexing your LibreChat instance. Recommended for internal/private deployments.", 
        label: "No Index",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#prevent-public-search-engines-indexing",
        docSection: "Server Config",
        technical: { envVar: "NO_INDEX", configFile: ".env" }
      },
      
      // Security
      jwtSecret: { 
        type: "password", 
        description: "Secret key for signing JWT authentication tokens. Must be at least 32 characters long. Keep this secure and unique - changing it will log out all users. CRITICAL for security!", 
        label: "JWT Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "JWT_SECRET", configFile: ".env" }
      },
      jwtRefreshSecret: { 
        type: "password", 
        description: "Separate secret for JWT refresh tokens. Should be different from JWT secret. Used for token rotation and extended authentication sessions.", 
        label: "JWT Refresh Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "JWT_REFRESH_SECRET", configFile: ".env" }
      },
      credsKey: { 
        type: "password", 
        description: "32-byte encryption key (64 hex chars) for securely storing API credentials in database. Required for app startup. Generate with provided key generator tool.", 
        label: "Credentials Key",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "CREDS_KEY", configFile: ".env" }
      },
      credsIV: { 
        type: "password", 
        description: "16-byte initialization vector (32 hex chars) for credential encryption. Must pair with credentials key. Required for secure API key storage.", 
        label: "Credentials IV",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "CREDS_IV", configFile: ".env" }
      },
      minPasswordLength: { 
        type: "number", 
        description: "Minimum character length required for user passwords. Recommended: 8-12 characters. Higher values increase security but may impact user experience.", 
        label: "Min Password Length",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "MIN_PASSWORD_LENGTH", configFile: ".env" }
      },
      sessionExpiry: { 
        type: "number", 
        description: "How long user sessions last in milliseconds. Default 15 minutes (900000ms). Shorter values increase security, longer values improve user experience.", 
        label: "Session Expiry",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "SESSION_EXPIRY", configFile: ".env" }
      },
      refreshTokenExpiry: { 
        type: "number", 
        description: "Refresh token lifetime in milliseconds. Default 7 days (604800000ms). Allows users to stay logged in without re-entering credentials.", 
        label: "Refresh Token Expiry",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#credentials-configuration",
        docSection: "Security",
        technical: { envVar: "REFRESH_TOKEN_EXPIRY", configFile: ".env" }
      },
      
      // Database
      mongoUri: { 
        type: "text", 
        description: "MongoDB connection string. Use mongodb://localhost:27017/LibreChat for local setup or mongodb+srv:// format for cloud databases like MongoDB Atlas. Include database name in URI.", 
        label: "MongoDB URI",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "MONGO_URI", configFile: ".env" }
      },
      mongoRootUsername: { 
        type: "text", 
        description: "MongoDB administrator username. Only required if MongoDB authentication is enabled. Leave empty for Docker setups without authentication.", 
        label: "MongoDB Username",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb/mongodb_auth",
        docSection: "Database",
        technical: { envVar: "MONGO_ROOT_USERNAME", configFile: ".env" }
      },
      mongoRootPassword: { 
        type: "password", 
        description: "MongoDB administrator password. Must match the username credentials. Keep secure and use strong passwords for production databases.", 
        label: "MongoDB Password",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb/mongodb_auth",
        docSection: "Database",
        technical: { envVar: "MONGO_ROOT_PASSWORD", configFile: ".env" }
      },
      mongoDbName: { 
        type: "text", 
        description: "Name of the MongoDB database to store LibreChat data. Usually 'LibreChat'. This database will be created automatically if it doesn't exist.", 
        label: "Database Name",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "MONGO_DB_NAME", configFile: ".env" }
      },
      redisUri: { 
        type: "text", 
        description: "Redis connection string for caching and session storage. Use redis://localhost:6379/0 for local or cloud Redis URLs. Improves performance significantly.", 
        label: "Redis URI",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_URI", configFile: ".env" }
      },
      redisUsername: { 
        type: "text", 
        description: "Redis username if authentication is required. Many Redis setups don't require auth, so this may be optional depending on your configuration.", 
        label: "Redis Username",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_USERNAME", configFile: ".env" }
      },
      redisPassword: { 
        type: "password", 
        description: "Redis password for authenticated connections. Required for production Redis instances with AUTH enabled. Keep secure.", 
        label: "Redis Password",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_PASSWORD", configFile: ".env" }
      },
      redisKeyPrefix: { 
        type: "text", 
        description: "Prefix added to all Redis keys to avoid conflicts when sharing Redis with other applications. Example: 'librechat:' creates keys like 'librechat:session:abc123'.", 
        label: "Redis Key Prefix",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_KEY_PREFIX", configFile: ".env" }
      },
      redisKeyPrefixVar: { 
        type: "text", 
        description: "Environment variable name that contains the Redis key prefix. Alternative to hardcoding the prefix directly. Allows dynamic configuration per environment.", 
        label: "Redis Key Prefix Var",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_KEY_PREFIX_VAR", configFile: ".env" }
      },
      redisMaxListeners: { 
        type: "number", 
        description: "Maximum number of event listeners Redis client can have. Default is 10. Increase if you get 'MaxListenersExceededWarning' in logs with high traffic.", 
        label: "Redis Max Listeners",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_MAX_LISTENERS", configFile: ".env" }
      },
      redisPingInterval: { 
        type: "number", 
        description: "Interval in milliseconds for Redis connection health checks. Default 30000 (30s). Lower values detect failures faster but increase network traffic.", 
        label: "Redis Ping Interval",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_PING_INTERVAL", configFile: ".env" }
      },
      redisUseAlternativeDNSLookup: { 
        type: "boolean", 
        description: "Use alternative DNS resolution for Redis connections. Enable if experiencing DNS issues in containerized environments or with certain cloud providers.", 
        label: "Alternative DNS Lookup",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#mongodb-database",
        docSection: "Database",
        technical: { envVar: "REDIS_USE_ALTERNATIVE_DNS_LOOKUP", configFile: ".env" }
      },
      
      // Authentication
      allowRegistration: { 
        type: "boolean", 
        description: "When enabled, allows new users to create accounts. Disable for invite-only or enterprise deployments where accounts are managed externally.", 
        label: "Allow Registration",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "ALLOW_REGISTRATION", configFile: ".env" }
      },
      allowEmailLogin: { 
        type: "boolean", 
        description: "Enables login with email and password. Core authentication method. Disable only if using social login exclusively.", 
        label: "Allow Email Login",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "ALLOW_EMAIL_LOGIN", configFile: ".env" }
      },
      allowSocialLogin: { 
        type: "boolean", 
        description: "Enables OAuth login with configured providers (Google, GitHub, Discord, etc.). Requires setting up OAuth credentials for each provider.", 
        label: "Allow Social Login",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "ALLOW_SOCIAL_LOGIN", configFile: ".env" }
      },
      allowSocialRegistration: { 
        type: "boolean", 
        description: "Allows new account creation via social OAuth providers. Users can sign up using Google, GitHub, etc. without email verification.", 
        label: "Allow Social Registration",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "ALLOW_SOCIAL_REGISTRATION", configFile: ".env" }
      },
      allowPasswordReset: { 
        type: "boolean", 
        description: "Enables password reset functionality via email. Requires email service configuration (SMTP or Mailgun) to send reset links to users.", 
        label: "Allow Password Reset",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "ALLOW_PASSWORD_RESET", configFile: ".env" }
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
      openaiApiKey: { type: "password", description: "OpenAI API key", label: "OpenAI API Key", technical: { envVar: "OPENAI_API_KEY", configFile: ".env" } },
      anthropicApiKey: { type: "password", description: "Anthropic API key", label: "Anthropic API Key", technical: { envVar: "ANTHROPIC_API_KEY", configFile: ".env" } },
      googleApiKey: { type: "password", description: "Google AI API key", label: "Google AI API Key", technical: { envVar: "GOOGLE_API_KEY", configFile: ".env" } },
      groqApiKey: { type: "password", description: "Groq API key", label: "Groq API Key", technical: { envVar: "GROQ_API_KEY", configFile: ".env" } },
      mistralApiKey: { type: "password", description: "Mistral AI API key", label: "Mistral API Key", technical: { envVar: "MISTRAL_API_KEY", configFile: ".env" } },
      
      // Extended AI APIs
      deepseekApiKey: { type: "password", description: "DeepSeek API key", label: "DeepSeek API Key", technical: { envVar: "DEEPSEEK_API_KEY", configFile: ".env" } },
      perplexityApiKey: { type: "password", description: "Perplexity API key", label: "Perplexity API Key", technical: { envVar: "PERPLEXITY_API_KEY", configFile: ".env" } },
      fireworksApiKey: { type: "password", description: "Fireworks API key", label: "Fireworks API Key", technical: { envVar: "FIREWORKS_API_KEY", configFile: ".env" } },
      togetheraiApiKey: { type: "password", description: "Together AI API key", label: "Together AI API Key", technical: { envVar: "TOGETHERAI_API_KEY", configFile: ".env" } },
      huggingfaceToken: { type: "password", description: "HuggingFace token", label: "HuggingFace Token", technical: { envVar: "HUGGINGFACE_TOKEN", configFile: ".env" } },
      xaiApiKey: { type: "password", description: "xAI (Grok) API key", label: "xAI API Key", technical: { envVar: "XAI_API_KEY", configFile: ".env" } },
      nvidiaApiKey: { type: "password", description: "NVIDIA API key", label: "NVIDIA API Key", technical: { envVar: "NVIDIA_API_KEY", configFile: ".env" } },
      sambaNovaApiKey: { type: "password", description: "SambaNova API key", label: "SambaNova API Key", technical: { envVar: "SAMBANOVA_API_KEY", configFile: ".env" } },
      hyperbolicApiKey: { type: "password", description: "Hyperbolic API key", label: "Hyperbolic API Key", technical: { envVar: "HYPERBOLIC_API_KEY", configFile: ".env" } },
      klusterApiKey: { type: "password", description: "Kluster API key", label: "Kluster API Key", technical: { envVar: "KLUSTER_API_KEY", configFile: ".env" } },
      nanogptApiKey: { type: "password", description: "NanoGPT API key", label: "NanoGPT API Key", technical: { envVar: "NANOGPT_API_KEY", configFile: ".env" } },
      glhfApiKey: { type: "password", description: "GLHF API key", label: "GLHF API Key", technical: { envVar: "GLHF_API_KEY", configFile: ".env" } },
      apipieApiKey: { type: "password", description: "APIpie API key", label: "APIpie API Key", technical: { envVar: "APIPIE_API_KEY", configFile: ".env" } },
      unifyApiKey: { type: "password", description: "Unify API key", label: "Unify API Key", technical: { envVar: "UNIFY_API_KEY", configFile: ".env" } },
      openrouterKey: { type: "password", description: "OpenRouter API key", label: "OpenRouter API Key", technical: { envVar: "OPENROUTER_KEY", configFile: ".env" } },
      
      // Azure OpenAI
      azureApiKey: { type: "password", description: "Azure OpenAI API key", label: "Azure API Key", technical: { envVar: "AZURE_API_KEY", configFile: ".env" } },
      azureOpenaiApiInstanceName: { type: "text", description: "Azure OpenAI instance name", label: "Azure Instance Name", technical: { envVar: "AZURE_OPENAI_API_INSTANCE_NAME", configFile: ".env" } },
      azureOpenaiApiDeploymentName: { type: "text", description: "Azure OpenAI deployment name", label: "Azure Deployment Name", technical: { envVar: "AZURE_OPENAI_API_DEPLOYMENT_NAME", configFile: ".env" } },
      azureOpenaiApiVersion: { type: "text", description: "Azure OpenAI API version", label: "Azure API Version", technical: { envVar: "AZURE_OPENAI_API_VERSION", configFile: ".env" } },
      azureOpenaiModels: { type: "text", description: "Azure OpenAI models", label: "Azure OpenAI Models", technical: { envVar: "AZURE_OPENAI_MODELS", configFile: ".env" } },
      
      // AWS Bedrock
      awsAccessKeyId: { type: "password", description: "AWS access key ID", label: "AWS Access Key ID", technical: { envVar: "AWS_ACCESS_KEY_ID", configFile: ".env" } },
      awsSecretAccessKey: { type: "password", description: "AWS secret access key", label: "AWS Secret Access Key", technical: { envVar: "AWS_SECRET_ACCESS_KEY", configFile: ".env" } },
      awsRegion: { type: "text", description: "AWS region", label: "AWS Region", technical: { envVar: "AWS_REGION", configFile: ".env" } },
      awsBedrockRegion: { type: "text", description: "AWS Bedrock region", label: "AWS Bedrock Region", technical: { envVar: "AWS_BEDROCK_REGION", configFile: ".env" } },
      awsEndpointURL: { type: "text", description: "AWS endpoint URL", label: "AWS Endpoint URL", technical: { envVar: "AWS_ENDPOINT_URL", configFile: ".env" } },
      awsBucketName: { type: "text", description: "AWS S3 bucket name", label: "AWS Bucket Name", technical: { envVar: "AWS_BUCKET_NAME", configFile: ".env" } },
      
      // File Storage
      fileUploadPath: { type: "text", description: "Local file upload path", label: "File Upload Path", technical: { envVar: "FILE_UPLOAD_PATH", configFile: ".env" } },
      firebaseApiKey: { type: "password", description: "Firebase API key", label: "Firebase API Key", technical: { envVar: "FIREBASE_API_KEY", configFile: ".env" } },
      firebaseAuthDomain: { type: "text", description: "Firebase auth domain", label: "Firebase Auth Domain", technical: { envVar: "FIREBASE_AUTH_DOMAIN", configFile: ".env" } },
      firebaseProjectId: { type: "text", description: "Firebase project ID", label: "Firebase Project ID", technical: { envVar: "FIREBASE_PROJECT_ID", configFile: ".env" } },
      firebaseStorageBucket: { type: "text", description: "Firebase storage bucket", label: "Firebase Storage Bucket", technical: { envVar: "FIREBASE_STORAGE_BUCKET", configFile: ".env" } },
      firebaseMessagingSenderId: { type: "text", description: "Firebase messaging sender ID", label: "Firebase Messaging Sender ID", technical: { envVar: "FIREBASE_MESSAGING_SENDER_ID", configFile: ".env" } },
      firebaseAppId: { type: "text", description: "Firebase app ID", label: "Firebase App ID", technical: { envVar: "FIREBASE_APP_ID", configFile: ".env" } },
      azureStorageConnectionString: { type: "password", description: "Azure storage connection string", label: "Azure Storage Connection String", technical: { envVar: "AZURE_STORAGE_CONNECTION_STRING", configFile: ".env" } },
      azureStoragePublicAccess: { type: "boolean", description: "Azure storage public access", label: "Azure Storage Public Access", technical: { envVar: "AZURE_STORAGE_PUBLIC_ACCESS", configFile: ".env" } },
      azureContainerName: { type: "text", description: "Azure container name", label: "Azure Container Name", technical: { envVar: "AZURE_CONTAINER_NAME", configFile: ".env" } },
      
      // Image Generation (DALL-E)
      dalleApiKey: { 
        type: "password", 
        description: "API key for DALL-E image generation. Required to enable AI image generation via Agents. Can use your OpenAI API key or a dedicated DALL-E key.", 
        label: "DALL-E API Key",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE_API_KEY", configFile: ".env" } 
      },
      dalle3ApiKey: { 
        type: "password", 
        description: "Dedicated API key for DALL-E 3 (optional). If not set, uses DALLE_API_KEY.", 
        label: "DALL-E 3 API Key",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE3_API_KEY", configFile: ".env" } 
      },
      dalle2ApiKey: { 
        type: "password", 
        description: "Dedicated API key for DALL-E 2 (optional). If not set, uses DALLE_API_KEY.", 
        label: "DALL-E 2 API Key",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE2_API_KEY", configFile: ".env" } 
      },
      dalleReverseProxy: { 
        type: "text", 
        description: "Custom reverse proxy URL for DALL-E requests (optional).", 
        label: "DALL-E Reverse Proxy",
        placeholder: "https://your-proxy-url",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE_REVERSE_PROXY", configFile: ".env" } 
      },
      dalle3BaseUrl: { 
        type: "text", 
        description: "Custom base URL for DALL-E 3 API (optional). Default: https://api.openai.com/v1", 
        label: "DALL-E 3 Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE3_BASEURL", configFile: ".env" } 
      },
      dalle2BaseUrl: { 
        type: "text", 
        description: "Custom base URL for DALL-E 2 API (optional). Default: https://api.openai.com/v1", 
        label: "DALL-E 2 Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE2_BASEURL", configFile: ".env" } 
      },
      dalle3SystemPrompt: { 
        type: "textarea", 
        description: "Custom system prompt for DALL-E 3 image generation (optional).", 
        label: "DALL-E 3 System Prompt",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE3_SYSTEM_PROMPT", configFile: ".env" } 
      },
      dalle2SystemPrompt: { 
        type: "textarea", 
        description: "Custom system prompt for DALL-E 2 image generation (optional).", 
        label: "DALL-E 2 System Prompt",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "Image Generation",
        technical: { envVar: "DALLE2_SYSTEM_PROMPT", configFile: ".env" } 
      },
      
      // External APIs
      openweatherApiKey: { type: "password", description: "OpenWeather API key for weather information", label: "OpenWeather API Key", technical: { envVar: "OPENWEATHER_API_KEY", configFile: ".env" } },
      
      // RAG API
      ragApiURL: { type: "text", description: "RAG API URL", label: "RAG API URL", technical: { envVar: "RAG_API_URL", configFile: ".env" } },
      ragOpenaiApiKey: { type: "password", description: "RAG OpenAI API key", label: "RAG OpenAI API Key", technical: { envVar: "RAG_OPENAI_API_KEY", configFile: ".env" } },
      ragPort: { type: "number", description: "RAG API port", label: "RAG Port", technical: { envVar: "RAG_PORT", configFile: ".env" } },
      ragHost: { type: "text", description: "RAG API host", label: "RAG Host", technical: { envVar: "RAG_HOST", configFile: ".env" } },
      collectionName: { type: "text", description: "Collection name", label: "Collection Name", technical: { envVar: "COLLECTION_NAME", configFile: ".env" } },
      chunkSize: { type: "number", description: "Chunk size", label: "Chunk Size", technical: { envVar: "CHUNK_SIZE", configFile: ".env" } },
      chunkOverlap: { type: "number", description: "Chunk overlap", label: "Chunk Overlap", technical: { envVar: "CHUNK_OVERLAP", configFile: ".env" } },
      embeddingsProvider: { type: "text", description: "Embeddings provider", label: "Embeddings Provider", technical: { envVar: "EMBEDDINGS_PROVIDER", configFile: ".env" } },
      
      // MeiliSearch - 1-Click Integration with Docker Support
      meilisearchIntegration: { 
        type: "meilisearch-integration", 
        description: "1-click MeiliSearch integration with automatic Docker setup, secure key generation, and conversation search capabilities. Improves LibreChat with powerful search functionality.", 
        label: "MeiliSearch Integration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/search",
        docSection: "Search Configuration"
      },
      
      // Rate & Security
      limitConcurrentMessages: { type: "boolean", description: "Limit concurrent messages", label: "Limit Concurrent Messages", technical: { envVar: "LIMIT_CONCURRENT_MESSAGES", configFile: ".env" } },
      concurrentMessageMax: { type: "number", description: "Max concurrent messages", label: "Concurrent Message Max", technical: { envVar: "CONCURRENT_MESSAGE_MAX", configFile: ".env" } },
      banViolations: { type: "boolean", description: "Ban violations", label: "Ban Violations", technical: { envVar: "BAN_VIOLATIONS", configFile: ".env" } },
      banDuration: { type: "number", description: "Ban duration", label: "Ban Duration", technical: { envVar: "BAN_DURATION", configFile: ".env" } },
      banInterval: { type: "number", description: "Ban interval", label: "Ban Interval", technical: { envVar: "BAN_INTERVAL", configFile: ".env" } },
      loginViolationScore: { type: "number", description: "Login violation score", label: "Login Violation Score", technical: { envVar: "LOGIN_VIOLATION_SCORE", configFile: ".env" } },
      registrationViolationScore: { type: "number", description: "Registration violation score", label: "Registration Violation Score", technical: { envVar: "REGISTRATION_VIOLATION_SCORE", configFile: ".env" } },
      concurrentViolationScore: { type: "number", description: "Concurrent violation score", label: "Concurrent Violation Score", technical: { envVar: "CONCURRENT_VIOLATION_SCORE", configFile: ".env" } },
      messageViolationScore: { type: "number", description: "Message violation score", label: "Message Violation Score", technical: { envVar: "MESSAGE_VIOLATION_SCORE", configFile: ".env" } },
      nonBrowserViolationScore: { type: "number", description: "Non-browser violation score", label: "Non-Browser Violation Score", technical: { envVar: "NON_BROWSER_VIOLATION_SCORE", configFile: ".env" } },
      loginMax: { type: "number", description: "Login max attempts", label: "Login Max", technical: { envVar: "LOGIN_MAX", configFile: ".env" } },
      loginWindow: { type: "number", description: "Login window", label: "Login Window", technical: { envVar: "LOGIN_WINDOW", configFile: ".env" } },
      
      // LDAP
      ldapURL: { type: "text", description: "LDAP server URL", label: "LDAP URL", technical: { envVar: "LDAP_URL", configFile: ".env" } },
      ldapBindDN: { type: "text", description: "LDAP bind DN", label: "LDAP Bind DN", technical: { envVar: "LDAP_BIND_DN", configFile: ".env" } },
      ldapBindCredentials: { type: "password", description: "LDAP bind credentials", label: "LDAP Bind Credentials", technical: { envVar: "LDAP_BIND_CREDENTIALS", configFile: ".env" } },
      ldapSearchBase: { type: "text", description: "LDAP search base", label: "LDAP Search Base", technical: { envVar: "LDAP_SEARCH_BASE", configFile: ".env" } },
      ldapSearchFilter: { type: "text", description: "LDAP search filter", label: "LDAP Search Filter", technical: { envVar: "LDAP_SEARCH_FILTER", configFile: ".env" } },
      
      // Turnstile
      turnstileSiteKey: { type: "text", description: "Turnstile site key", label: "Turnstile Site Key", technical: { envVar: "TURNSTILE_SITE_KEY", configFile: ".env" } },
      turnstileSecretKey: { type: "password", description: "Turnstile secret key", label: "Turnstile Secret Key", technical: { envVar: "TURNSTILE_SECRET_KEY", configFile: ".env" } },
      
      // Features
      allowSharedLinks: { type: "boolean", description: "Allow shared links", label: "Allow Shared Links", technical: { envVar: "ALLOW_SHARED_LINKS", configFile: ".env" } },
      allowSharedLinksPublic: { type: "boolean", description: "Allow public shared links", label: "Allow Public Shared Links", technical: { envVar: "ALLOW_SHARED_LINKS_PUBLIC", configFile: ".env" } },
      titleConvo: { type: "boolean", description: "Generate conversation titles", label: "Title Conversations", technical: { envVar: "TITLE_CONVO", configFile: ".env" } },
      summaryConvo: { type: "boolean", description: "Generate conversation summaries", label: "Summary Conversations", technical: { envVar: "SUMMARY_CONVO", configFile: ".env" } },
      
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
      mcpOauthOnAuthError: { type: "text", description: "MCP OAuth on auth error", label: "MCP OAuth On Auth Error", technical: { envVar: "MCP_OAUTH_ON_AUTH_ERROR", configFile: ".env" } },
      mcpOauthDetectionTimeout: { type: "number", description: "MCP OAuth detection timeout", label: "MCP OAuth Detection Timeout", technical: { envVar: "MCP_OAUTH_DETECTION_TIMEOUT", configFile: ".env" } },
      
      // Users - System-Level Deployment Configuration
      uid: { 
        type: "number", 
        description: "System User ID for LibreChat processes. IMPORTANT: This controls what system user LibreChat runs as, NOT application users. Set this for Docker deployments (e.g., 1000 to match your host user), security hardening (avoid root/0), and file permission management. Essential for production deployments to prevent permission issues and follow security best practices.", 
        label: "UID (System User ID)",
        placeholder: "1000",
        docUrl: "https://www.librechat.ai/docs/deployment/docker",
        docSection: "Docker Security",
        technical: { envVar: "UID", configFile: ".env" }
      },
      gid: { 
        type: "number", 
        description: "System Group ID for LibreChat processes. Companion to UID for complete user/group context. Set to match your deployment environment (e.g., 1000 for typical non-root user). Ensures LibreChat files and directories have correct ownership for security isolation and preventing privilege escalation. Critical for multi-tenant servers and enterprise compliance.", 
        label: "GID (System Group ID)",
        placeholder: "1000",
        docUrl: "https://www.librechat.ai/docs/deployment/docker",
        docSection: "Docker Security",
        technical: { envVar: "GID", configFile: ".env" }
      },
      
      // Debug
      debugLogging: { type: "boolean", description: "Enable debug logging", label: "Debug Logging", technical: { envVar: "DEBUG_LOGGING", configFile: ".env" } },
      debugConsole: { type: "boolean", description: "Enable debug console", label: "Debug Console", technical: { envVar: "DEBUG_CONSOLE", configFile: ".env" } },
      consoleJSON: { type: "boolean", description: "Console JSON format", label: "Console JSON", technical: { envVar: "CONSOLE_JSON", configFile: ".env" } },
      
      // Miscellaneous - CDN & Static Asset Configuration
      cdnProvider: { 
        type: "select", 
        description: "CDN Provider for static asset delivery. In LibreChat, this refers to the service used to host and deliver static assets (images, CSS, JavaScript files) via a Content Delivery Network rather than directly from your application server. DEFAULT: LibreChat uses a public CDN (hosted by CodeSandbox) for static assets, but you can override this with your own CDN provider. Choose based on your infrastructure, performance needs, and cost requirements.", 
        label: "CDN Provider Strategy",
        docUrl: "https://www.librechat.ai/docs/deployment/file-handling",
        docSection: "CDN Configuration",
        technical: { envVar: "CDN_PROVIDER", configFile: ".env" }
      },
      
      // MCP Servers
      mcpServers: { 
        type: "mcp-servers", 
        description: "MCP servers configuration. Each server supports: type (stdio/websocket/sse/streamable-http), command, args, url, timeout, headers, serverInstructions, iconPath, chatMenu, customUserVars.", 
        label: "MCP Servers",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/mcp",
        docSection: "MCP Configuration",
        technical: { yamlPath: "mcpServers", configFile: "librechat.yaml" }
      },

      // Custom Endpoints
      "endpoints.custom": {
        type: "custom-endpoints",
        description: "Create multiple OpenAI-compatible endpoints with individual API keys and friendly names (e.g., 'OpenAI - Work', 'OpenAI - Personal'). Perfect for organizing API usage by project, team, or billing account. Each endpoint can be assigned to specific agents for isolated usage tracking.",
        label: "Custom Endpoints",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/custom_endpoint",
        docSection: "Custom Endpoints Configuration",
        technical: { yamlPath: "endpoints.custom", configFile: "librechat.yaml" }
      },

      // OCR Configuration
      "ocr.apiKey": { 
        type: "password", 
        description: "API key for OCR service", 
        label: "OCR API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration",
        technical: { yamlPath: "ocr.apiKey", configFile: "librechat.yaml" }
      },
      "ocr.baseURL": { 
        type: "text", 
        description: "Base URL for OCR service API", 
        label: "OCR Base URL",
        placeholder: "https://api.ocr-service.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration",
        technical: { yamlPath: "ocr.baseURL", configFile: "librechat.yaml" }
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
        docSection: "OCR Configuration",
        technical: { yamlPath: "ocr.strategy", configFile: "librechat.yaml" }
      },
      "ocr.mistralModel": { 
        type: "text", 
        description: "Mistral model to use for OCR processing", 
        label: "OCR Mistral Model",
        placeholder: "mistral-7b-instruct-v0.1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration",
        technical: { yamlPath: "ocr.mistralModel", configFile: "librechat.yaml" }
      },
      
      // Core Settings
      version: { type: "text", description: "LibreChat version", label: "Version", technical: { yamlPath: "version", configFile: "librechat.yaml" } },
      cache: { type: "boolean", description: "Enable caching", label: "Cache", technical: { yamlPath: "cache", configFile: "librechat.yaml" } },
      fileStrategy: { type: "object", description: "File storage strategy. Can be 'local', 's3', 'firebase', 'azure_blob' as string, or object with per-type strategies: {avatar: 'local', image: 's3', document: 'local'}", label: "File Strategy", technical: { yamlPath: "fileStrategy", configFile: "librechat.yaml" } },
      secureImageLinks: { type: "boolean", description: "Use secure image links", label: "Secure Image Links", technical: { yamlPath: "secureImageLinks", configFile: "librechat.yaml" } },
      imageOutputType: { type: "select", description: "Format for generated images. Choose quality vs compatibility vs size.", label: "Image Output Type", technical: { yamlPath: "imageOutputType", configFile: "librechat.yaml" } },
      filteredTools: { type: "array", description: "Filtered tools list", label: "Filtered Tools", technical: { yamlPath: "filteredTools", configFile: "librechat.yaml" } },
      includedTools: { type: "array", description: "Included tools list", label: "Included Tools", technical: { yamlPath: "includedTools", configFile: "librechat.yaml" } },
      temporaryChatRetention: { type: "number", description: "Temporary chat retention hours", label: "Chat Retention Hours", technical: { yamlPath: "temporaryChatRetention", configFile: "librechat.yaml" } },
      
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
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.provider", configFile: "librechat.yaml" }
      },
      "stt.model": { 
        type: "text", 
        description: "STT model name to use with the selected provider", 
        label: "STT Model",
        placeholder: "whisper-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.model", configFile: "librechat.yaml" }
      },
      "stt.apiKey": { 
        type: "password", 
        description: "API key for STT service", 
        label: "STT API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.apiKey", configFile: "librechat.yaml" }
      },
      "stt.baseURL": { 
        type: "text", 
        description: "Base URL for STT service API", 
        label: "STT Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.baseURL", configFile: "librechat.yaml" }
      },
      "stt.language": { 
        type: "text", 
        description: "Language for STT processing (e.g., en, es, fr, de)", 
        label: "STT Language",
        placeholder: "en",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.language", configFile: "librechat.yaml" }
      },
      "stt.streaming": { 
        type: "boolean", 
        description: "Enable real-time STT streaming processing", 
        label: "STT Streaming",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.streaming", configFile: "librechat.yaml" }
      },
      "stt.punctuation": { 
        type: "boolean", 
        description: "Enable automatic punctuation in STT output", 
        label: "STT Punctuation",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.punctuation", configFile: "librechat.yaml" }
      },
      "stt.profanityFilter": { 
        type: "boolean", 
        description: "Enable profanity filtering in STT output", 
        label: "STT Profanity Filter",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/stt",
        docSection: "STT Configuration",
        technical: { yamlPath: "stt.profanityFilter", configFile: "librechat.yaml" }
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
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.provider", configFile: "librechat.yaml" }
      },
      "tts.model": { 
        type: "text", 
        description: "TTS model name to use with the selected provider", 
        label: "TTS Model",
        placeholder: "tts-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.model", configFile: "librechat.yaml" }
      },
      "tts.voice": { 
        type: "text", 
        description: "Voice to use for TTS synthesis (e.g., alloy, echo, fable, onyx, nova, shimmer)", 
        label: "TTS Voice",
        placeholder: "alloy",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.voice", configFile: "librechat.yaml" }
      },
      "tts.apiKey": { 
        type: "password", 
        description: "API key for TTS service", 
        label: "TTS API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.apiKey", configFile: "librechat.yaml" }
      },
      "tts.baseURL": { 
        type: "text", 
        description: "Base URL for TTS service API", 
        label: "TTS Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.baseURL", configFile: "librechat.yaml" }
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
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.speed", configFile: "librechat.yaml" }
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
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.quality", configFile: "librechat.yaml" }
      },
      "tts.streaming": { 
        type: "boolean", 
        description: "Enable real-time TTS streaming for faster response", 
        label: "TTS Streaming",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/tts",
        docSection: "TTS Configuration",
        technical: { yamlPath: "tts.streaming", configFile: "librechat.yaml" }
      },
      
      // Assistants Configuration
      "endpoints.assistants.disableBuilder": { 
        type: "boolean", 
        description: "Disable the built-in assistant builder interface", 
        label: "Disable Assistant Builder",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.disableBuilder", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.pollIntervalMs": { 
        type: "number", 
        description: "Polling interval for assistant status checks in milliseconds (500-10000)", 
        label: "Poll Interval (ms)",
        placeholder: "3000",
        min: 500,
        max: 10000,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.pollIntervalMs", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.timeoutMs": { 
        type: "number", 
        description: "Timeout for assistant requests in milliseconds (30000-600000)", 
        label: "Timeout (ms)",
        placeholder: "180000",
        min: 30000,
        max: 600000,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.timeoutMs", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.supportedIds": { 
        type: "array", 
        description: "Array of supported assistant IDs - only these assistants will be available", 
        label: "Supported Assistant IDs",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.supportedIds", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.excludedIds": { 
        type: "array", 
        description: "Array of assistant IDs to exclude from availability", 
        label: "Excluded Assistant IDs",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.excludedIds", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.privateAssistants": { 
        type: "boolean", 
        description: "Enable private assistants that are only visible to their creators", 
        label: "Private Assistants",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.privateAssistants", configFile: "librechat.yaml" }
      },
      "endpoints.assistants.retrievalModels": { 
        type: "array", 
        description: "Array of models available for retrieval operations", 
        label: "Retrieval Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.retrievalModels", configFile: "librechat.yaml" }
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
        docSection: "Assistants Configuration",
        technical: { yamlPath: "endpoints.assistants.capabilities", configFile: "librechat.yaml" }
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
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.recursionLimit", configFile: "librechat.yaml" }
      },
      "endpoints.agents.maxRecursionLimit": { 
        type: "number", 
        description: "Maximum allowed recursion limit that can be set (1-200)", 
        label: "Max Recursion Limit",
        placeholder: "25",
        min: 1,
        max: 200,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.maxRecursionLimit", configFile: "librechat.yaml" }
      },
      "endpoints.agents.disableBuilder": { 
        type: "boolean", 
        description: "Disable the built-in agent builder interface", 
        label: "Disable Agent Builder",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.disableBuilder", configFile: "librechat.yaml" }
      },
      "endpoints.agents.maxCitations": { 
        type: "number", 
        description: "Maximum number of citations per agent response (1-100)", 
        label: "Max Citations",
        placeholder: "30",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.maxCitations", configFile: "librechat.yaml" }
      },
      "endpoints.agents.maxCitationsPerFile": { 
        type: "number", 
        description: "Maximum citations allowed from a single file (1-20)", 
        label: "Max Citations Per File",
        placeholder: "7",
        min: 1,
        max: 20,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.maxCitationsPerFile", configFile: "librechat.yaml" }
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
        docSection: "Agents Configuration",
        technical: { yamlPath: "endpoints.agents.minRelevanceScore", configFile: "librechat.yaml" }
      },
      "endpoints.agents.capabilities": { 
        type: "array", 
        description: "Agent capabilities determine what features are available to AI agents. Select capabilities to enable: artifacts (generative UI), context (upload as text), ocr (optical character recognition), chain (agent chaining), execute_code, file_search, actions, tools, web_search. Each capability adds specific functionality to your agents.", 
        label: "Agent Capabilities",
        options: [
          { value: "execute_code", label: "Execute Code" },
          { value: "file_search", label: "File Search" },
          { value: "actions", label: "Actions" },
          { value: "tools", label: "Tools" },
          { value: "artifacts", label: "Artifacts (Generative UI)" },
          { value: "context", label: "Context (Upload as Text)" },
          { value: "ocr", label: "OCR (Optical Character Recognition)" },
          { value: "chain", label: "Chain (Agent Chaining)" },
          { value: "web_search", label: "Web Search" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/agents",
        docSection: "Artifacts",
        technical: { yamlPath: "endpoints.agents.capabilities", configFile: "librechat.yaml" }
      },
      
      // Actions Configuration
      "actions.allowedDomains": { 
        type: "array", 
        description: "Array of allowed domains for action execution - domains not on this list will be blocked for security", 
        label: "Allowed Domains",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/actions",
        docSection: "Actions Configuration",
        technical: { yamlPath: "actions.allowedDomains", configFile: "librechat.yaml" }
      },
      
      // Registration Nested Object Fields (path-based)
      "registration.socialLogins": { type: "array", description: "Enabled social login providers", label: "Social Login Providers", technical: { yamlPath: "registration.socialLogins", configFile: "librechat.yaml" } },
      "registration.allowedDomains": { type: "array", description: "Allowed domains for registration", label: "Allowed Domains", technical: { yamlPath: "registration.allowedDomains", configFile: "librechat.yaml" } },
      
      // File Config Nested Object Fields (path-based)
      "fileConfig.endpoints": { 
        type: "endpoint-file-limits", 
        description: "Configure file upload limits and supported MIME types for each AI endpoint. These settings allow you to restrict file types and sizes on a per-provider basis (OpenAI, Anthropic, Google, etc.)", 
        label: "Per-Endpoint File Upload Limits",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Configuration",
        technical: { yamlPath: "fileConfig.endpoints", configFile: "librechat.yaml" }
      },
      "fileConfig.serverFileSizeLimit": { type: "number", description: "Server file size limit in MB", label: "Server File Size Limit (MB)", technical: { yamlPath: "fileConfig.serverFileSizeLimit", configFile: "librechat.yaml" } },
      "fileConfig.avatarSizeLimit": { type: "number", description: "Avatar size limit in MB", label: "Avatar Size Limit (MB)", technical: { yamlPath: "fileConfig.avatarSizeLimit", configFile: "librechat.yaml" } },
      "fileConfig.clientImageResize.enabled": { type: "boolean", description: "Enable client-side image resize", label: "Client Image Resize", technical: { yamlPath: "fileConfig.clientImageResize.enabled", configFile: "librechat.yaml" } },
      "fileConfig.clientImageResize.maxWidth": { type: "number", description: "Max width for image resize", label: "Max Resize Width", technical: { yamlPath: "fileConfig.clientImageResize.maxWidth", configFile: "librechat.yaml" } },
      "fileConfig.clientImageResize.maxHeight": { type: "number", description: "Max height for image resize", label: "Max Resize Height", technical: { yamlPath: "fileConfig.clientImageResize.maxHeight", configFile: "librechat.yaml" } },
      "fileConfig.clientImageResize.quality": { type: "number", description: "Image resize quality (0.1-1.0)", label: "Resize Quality", technical: { yamlPath: "fileConfig.clientImageResize.quality", configFile: "librechat.yaml" } },
      "fileConfig.clientImageResize.compressFormat": { type: "select", description: "Image compression format", label: "Compress Format", technical: { yamlPath: "fileConfig.clientImageResize.compressFormat", configFile: "librechat.yaml" } },
      
      // Web Search Configuration - Progressive Disclosure Interface
      webSearch: { 
        type: "web-search", 
        description: "Web search configuration with smart progressive disclosure - choose providers and only see relevant API key fields", 
        label: "Web Search Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/websearch",
        docSection: "Web Search Configuration",
        technical: { yamlPath: "webSearch", configFile: ".env & librechat.yaml" }
      },
      
      // Rate Limits Nested Object Fields
      rateLimitsFileUploadsIpMax: { type: "number", description: "Max file uploads per IP", label: "File Uploads IP Max", technical: { yamlPath: "rateLimits.fileUploads.ipMax", configFile: "librechat.yaml" } },
      rateLimitsFileUploadsIpWindowInMinutes: { type: "number", description: "File uploads IP window (minutes)", label: "File Uploads IP Window", technical: { yamlPath: "rateLimits.fileUploads.ipWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsFileUploadsUserMax: { type: "number", description: "Max file uploads per user", label: "File Uploads User Max", technical: { yamlPath: "rateLimits.fileUploads.userMax", configFile: "librechat.yaml" } },
      rateLimitsFileUploadsUserWindowInMinutes: { type: "number", description: "File uploads user window (minutes)", label: "File Uploads User Window", technical: { yamlPath: "rateLimits.fileUploads.userWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsConversationsImportIpMax: { type: "number", description: "Max conversation imports per IP", label: "Conv Import IP Max", technical: { yamlPath: "rateLimits.conversationsImport.ipMax", configFile: "librechat.yaml" } },
      rateLimitsConversationsImportIpWindowInMinutes: { type: "number", description: "Conversation import IP window (minutes)", label: "Conv Import IP Window", technical: { yamlPath: "rateLimits.conversationsImport.ipWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsConversationsImportUserMax: { type: "number", description: "Max conversation imports per user", label: "Conv Import User Max", technical: { yamlPath: "rateLimits.conversationsImport.userMax", configFile: "librechat.yaml" } },
      rateLimitsConversationsImportUserWindowInMinutes: { type: "number", description: "Conversation import user window (minutes)", label: "Conv Import User Window", technical: { yamlPath: "rateLimits.conversationsImport.userWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsSttIpMax: { type: "number", description: "Max STT requests per IP", label: "STT IP Max", technical: { yamlPath: "rateLimits.stt.ipMax", configFile: "librechat.yaml" } },
      rateLimitsSttIpWindowInMinutes: { type: "number", description: "STT IP window (minutes)", label: "STT IP Window", technical: { yamlPath: "rateLimits.stt.ipWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsSttUserMax: { type: "number", description: "Max STT requests per user", label: "STT User Max", technical: { yamlPath: "rateLimits.stt.userMax", configFile: "librechat.yaml" } },
      rateLimitsSttUserWindowInMinutes: { type: "number", description: "STT user window (minutes)", label: "STT User Window", technical: { yamlPath: "rateLimits.stt.userWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsTtsIpMax: { type: "number", description: "Max TTS requests per IP", label: "TTS IP Max", technical: { yamlPath: "rateLimits.tts.ipMax", configFile: "librechat.yaml" } },
      rateLimitsTtsIpWindowInMinutes: { type: "number", description: "TTS IP window (minutes)", label: "TTS IP Window", technical: { yamlPath: "rateLimits.tts.ipWindowInMinutes", configFile: "librechat.yaml" } },
      rateLimitsTtsUserMax: { type: "number", description: "Max TTS requests per user", label: "TTS User Max", technical: { yamlPath: "rateLimits.tts.userMax", configFile: "librechat.yaml" } },
      rateLimitsTtsUserWindowInMinutes: { type: "number", description: "TTS user window (minutes)", label: "TTS User Window", technical: { yamlPath: "rateLimits.tts.userWindowInMinutes", configFile: "librechat.yaml" } },
      
      // Interface Nested Object Fields (path-based)
      "interface.customWelcome": { 
        type: "textarea", 
        description: "Custom welcome message shown to users when they first access LibreChat. Supports markdown formatting and {{user.name}} variable for personalization.", 
        label: "Welcome Message",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface#customwelcome",
        docSection: "Interface Config",
        technical: { yamlPath: "interface.customWelcome", configFile: "librechat.yaml" }
      },
      "interface.customFooter": { 
        type: "textarea", 
        description: "Custom footer text displayed at the bottom of the interface. Use this for copyright, contact information, or additional links.", 
        label: "Footer Text",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface",
        docSection: "Interface Config",
        technical: { yamlPath: "interface.customFooter", configFile: "librechat.yaml" }
      },
      "interface.fileSearch": { type: "boolean", description: "Enable file search in interface", label: "File Search", technical: { yamlPath: "interface.fileSearch", configFile: "librechat.yaml" } },
      "interface.uploadAsText": { type: "boolean", description: "Enable upload as text feature", label: "Upload as Text", technical: { yamlPath: "interface.uploadAsText", configFile: "librechat.yaml" } },
      "interface.privacyPolicy.externalUrl": { type: "text", description: "External privacy policy URL", label: "Privacy Policy URL", technical: { yamlPath: "interface.privacyPolicy.externalUrl", configFile: "librechat.yaml" } },
      "interface.privacyPolicy.openNewTab": { type: "boolean", description: "Open privacy policy in new tab", label: "Privacy Policy New Tab", technical: { yamlPath: "interface.privacyPolicy.openNewTab", configFile: "librechat.yaml" } },
      "interface.termsOfService.externalUrl": { type: "text", description: "External terms of service URL", label: "Terms of Service URL", technical: { yamlPath: "interface.termsOfService.externalUrl", configFile: "librechat.yaml" } },
      "interface.termsOfService.openNewTab": { type: "boolean", description: "Open terms in new tab", label: "Terms New Tab", technical: { yamlPath: "interface.termsOfService.openNewTab", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalAcceptance": { type: "boolean", description: "Require modal acceptance of terms", label: "Terms Modal Acceptance", technical: { yamlPath: "interface.termsOfService.modalAcceptance", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalTitle": { type: "text", description: "Terms modal title", label: "Terms Modal Title", technical: { yamlPath: "interface.termsOfService.modalTitle", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalContent": { type: "textarea", description: "Terms modal content", label: "Terms Modal Content", technical: { yamlPath: "interface.termsOfService.modalContent", configFile: "librechat.yaml" } },
      "interface.endpointsMenu": { type: "boolean", description: "Show endpoints menu", label: "Endpoints Menu", technical: { yamlPath: "interface.endpointsMenu", configFile: "librechat.yaml" } },
      "interface.modelSelect": { 
        type: "boolean", 
        description: "Enable the model selection dropdown in the UI. This allows users to choose between different AI models and providers.", 
        label: "Enable Model Select Interface", 
        technical: { yamlPath: "interface.modelSelect", configFile: "librechat.yaml" } 
      },
      "modelSpecs.addedEndpoints": { 
        type: "array", 
        description: "⚠️ KNOWN BUG: This setting causes interface visibility settings to break (e.g., Presets shows even when you disable it). Keep this field EMPTY unless you fully understand the risks. Designed for custom model specs, but has unintended side effects in LibreChat RC4.", 
        label: "🔴 Visible Endpoints (UI) - KEEP EMPTY", 
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/model_specs",
        docSection: "Model Specs",
        technical: { yamlPath: "modelSpecs.addedEndpoints", configFile: "librechat.yaml" }
      },
      "interface.parameters": { type: "boolean", description: "Show parameters panel", label: "Parameters Panel", technical: { yamlPath: "interface.parameters", configFile: "librechat.yaml" } },
      "interface.sidePanel": { type: "boolean", description: "Show side panel", label: "Side Panel", technical: { yamlPath: "interface.sidePanel", configFile: "librechat.yaml" } },
      "interface.presets": { type: "boolean", description: "Show presets", label: "Presets", technical: { yamlPath: "interface.presets", configFile: "librechat.yaml" } },
      "interface.prompts": { type: "boolean", description: "Show prompts", label: "Prompts", technical: { yamlPath: "interface.prompts", configFile: "librechat.yaml" } },
      "interface.bookmarks": { type: "boolean", description: "Show bookmarks", label: "Bookmarks", technical: { yamlPath: "interface.bookmarks", configFile: "librechat.yaml" } },
      "interface.multiConvo": { type: "boolean", description: "Enable multiple conversations", label: "Multi Conversation", technical: { yamlPath: "interface.multiConvo", configFile: "librechat.yaml" } },
      "interface.agents": { type: "boolean", description: "Show agents", label: "Agents", technical: { yamlPath: "interface.agents", configFile: "librechat.yaml" } },
      "interface.peoplePicker.users": { type: "boolean", description: "Show users in people picker", label: "People Picker Users", technical: { yamlPath: "interface.peoplePicker.users", configFile: "librechat.yaml" } },
      "interface.peoplePicker.groups": { type: "boolean", description: "Show groups in people picker", label: "People Picker Groups", technical: { yamlPath: "interface.peoplePicker.groups", configFile: "librechat.yaml" } },
      "interface.peoplePicker.roles": { type: "boolean", description: "Show roles in people picker", label: "People Picker Roles", technical: { yamlPath: "interface.peoplePicker.roles", configFile: "librechat.yaml" } },
      "interface.marketplace.use": { type: "boolean", description: "Enable marketplace usage", label: "Marketplace", technical: { yamlPath: "interface.marketplace.use", configFile: "librechat.yaml" } },
      "interface.fileCitations": { type: "boolean", description: "Show file citations", label: "File Citations", technical: { yamlPath: "interface.fileCitations", configFile: "librechat.yaml" } },
      
      // LibreChat Code Interpreter Configuration (Paid API Service)
      librechatCodeEnabled: {
        type: "boolean",
        description: "Enable LibreChat's native Code Interpreter API service. This is a paid service hosted at code.librechat.ai that provides code execution capabilities without self-hosting.",
        label: "LibreChat Code Interpreter Enabled",
        docUrl: "https://www.librechat.ai/docs/features/code_interpreter",
        docSection: "Code Execution",
        technical: { yamlPath: "endpoints.codeInterpreter.enabled", configFile: "librechat.yaml" }
      },
      librechatCodeApiKey: {
        type: "password",
        description: "API key for LibreChat Code Interpreter service. Get your key from https://code.librechat.ai",
        label: "LibreChat Code API Key",
        placeholder: "lcc_...",
        docUrl: "https://www.librechat.ai/docs/features/code_interpreter",
        docSection: "Code Execution",
        technical: { envVar: "LIBRECHAT_CODE_API_KEY", configFile: ".env" }
      },
      librechatCodeBaseUrl: {
        type: "text",
        description: "Custom base URL for LibreChat Code Interpreter (for enterprise self-hosted deployments). Note: Enterprise plans are not currently offered, but this will likely change in the future. This field is available for when enterprise self-hosted Code Interpreter access becomes available. Leave empty to use the default cloud service.",
        label: "LibreChat Code Base URL",
        placeholder: "https://code.yourdomain.com",
        docUrl: "https://www.librechat.ai/docs/features/code_interpreter",
        docSection: "Code Execution",
        technical: { envVar: "LIBRECHAT_CODE_BASEURL", configFile: ".env" }
      },
      "interface.runCode": {
        type: "boolean",
        description: "Show 'Run Code' button in the LibreChat interface. Enables users to trigger code execution manually. Requires either E2B or LibreChat Code Interpreter to be enabled.",
        label: "Show Run Code Button",
        docUrl: "https://www.librechat.ai/docs/features/code_interpreter",
        docSection: "Code Execution",
        technical: { yamlPath: "interface.runCode", configFile: "librechat.yaml" }
      },
      
      // Artifacts Configuration (Generative UI)
      "interface.artifacts": {
        type: "boolean",
        description: "Enable artifacts UI in LibreChat interface. Artifacts allow AI to generate interactive React components, HTML/CSS/JS applications, and Mermaid diagrams that render in a side panel. When enabled, users can create, preview, and iterate on generative UI components.",
        label: "Show Artifacts UI",
        docUrl: "https://www.librechat.ai/docs/features/artifacts",
        docSection: "Artifacts",
        technical: { yamlPath: "interface.artifacts", configFile: "librechat.yaml" }
      },
      sandpackBundlerUrl: {
        type: "text",
        description: "Optional self-hosted Sandpack bundler URL for privacy/compliance. By default, artifacts use CodeSandbox's public bundler (https://*.codesandbox.io). Self-hosting ensures code stays within your infrastructure. Leave empty to use public bundler. Requires setting up the LibreChat CodeSandbox fork.",
        label: "Self-Hosted Bundler URL",
        placeholder: "http://your-bundler-url",
        docUrl: "https://www.librechat.ai/docs/features/artifacts",
        docSection: "Artifacts",
        technical: { envVar: "SANDPACK_BUNDLER_URL", configFile: ".env" }
      },
      
      // E2B Code Execution Configuration (Self-Hosted)
      e2bApiKey: { 
        type: "password", 
        description: "Your E2B API key from https://e2b.dev - required for code execution sandbox access. Enables Python/JavaScript execution with file/image rendering.", 
        label: "E2B API Key",
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_API_KEY", configFile: ".env" }
      },
      e2bProxyEnabled: { 
        type: "boolean", 
        description: "Enable E2B proxy integration (custom feature of this tool). Creates a Docker container with HTTP proxy connecting to E2B's third-party service. Provides: Python/JS execution, file/image rendering, and OpenAPI schema (e2b-code-execution-openapi.yaml) to configure in your agent's schema. Setup: Get API key from e2b.dev → Toggle ON → Download package → Run docker-compose up. Note: WIP integration, good starting point but not turn-key like LibreChat's native interpreter.", 
        label: "E2B Proxy Enabled",
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_PROXY_ENABLED", configFile: ".env" }
      },
      e2bProxyPort: { 
        type: "number", 
        description: "Port number where the E2B proxy service listens. Default is 3001. Must be available and not conflict with other services.", 
        label: "E2B Proxy Port",
        placeholder: "3001",
        min: 1024,
        max: 65535,
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_PROXY_PORT", configFile: ".env" }
      },
      e2bPublicBaseUrl: {
        type: "text",
        description: "Public base URL for accessing generated files from the browser. Use http://localhost:3001 for local deployments, or your server's public domain (e.g., https://e2b.yourdomain.com). This must be accessible from users' browsers.",
        label: "Public Base URL",
        placeholder: "http://localhost:3001",
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_PUBLIC_BASE_URL", configFile: ".env" }
      },
      e2bFileTTLDays: { 
        type: "number", 
        description: "How many days to keep generated files (images, charts, CSV) before automatic cleanup. Default 30 days. Higher values use more storage.", 
        label: "File TTL (days)",
        placeholder: "30",
        min: 1,
        max: 365,
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_FILE_TTL_DAYS", configFile: ".env" }
      },
      e2bMaxFileSize: { 
        type: "number", 
        description: "Maximum file size in MB for generated files. Default 50MB. Prevents excessive storage use from large data outputs.", 
        label: "Max File Size (MB)",
        placeholder: "50",
        min: 1,
        max: 500,
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_MAX_FILE_SIZE", configFile: ".env" }
      },
      e2bPerUserSandbox: { 
        type: "boolean", 
        description: "Use persistent per-user sandboxes instead of per-request sandboxes. Preserves session state between executions but uses more resources.", 
        label: "Per-User Sandboxes",
        docUrl: "https://e2b.dev/docs",
        docSection: "Code Execution",
        technical: { envVar: "E2B_PER_USER_SANDBOX", configFile: ".env" }
      },
      
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
              className="w-full pl-10 pr-10"
              data-testid="search-settings"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="clear-search"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                    {tab.id === "ui-visibility" && (
                      <Alert variant="warning" className="lg:col-span-2 mb-4" data-testid="alert-hide-plugins-info">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>⚠️ LibreChat RC4 Bug Warning:</strong> The "Visible Endpoints (UI)" setting below has a known bug that causes interface settings to malfunction (e.g., Presets showing when disabled). <strong>Keep it empty/OFF</strong> to avoid issues. The deprecated "Plugins" menu cannot be hidden in RC4 - just ignore it and use Agents instead.
                        </AlertDescription>
                      </Alert>
                    )}
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
                            technical={fieldInfo.technical}
                            onChange={(emailData) => {
                              // Spread composite object back into individual flat fields
                              // Explicitly clear inactive provider fields based on serviceType from emailData
                              const clearedConfig = { ...configuration };
                              
                              if (emailData.serviceType === "smtp") {
                                // Clear Mailgun fields, keep SMTP fields
                                clearedConfig.emailService = emailData.emailService ?? undefined;
                                clearedConfig.emailUsername = emailData.emailUsername ?? undefined;
                                clearedConfig.emailPassword = emailData.emailPassword ?? undefined;
                                clearedConfig.emailFrom = emailData.emailFrom ?? undefined;
                                clearedConfig.emailFromName = emailData.emailFromName ?? undefined;
                                clearedConfig.mailgunApiKey = undefined;
                                clearedConfig.mailgunDomain = undefined;
                                clearedConfig.mailgunHost = undefined;
                              } else if (emailData.serviceType === "mailgun") {
                                // Clear SMTP fields, keep Mailgun fields
                                clearedConfig.emailService = undefined;
                                clearedConfig.emailUsername = undefined;
                                clearedConfig.emailPassword = undefined;
                                clearedConfig.emailFrom = undefined;
                                clearedConfig.emailFromName = undefined;
                                clearedConfig.mailgunApiKey = emailData.mailgunApiKey ?? undefined;
                                clearedConfig.mailgunDomain = emailData.mailgunDomain ?? undefined;
                                clearedConfig.mailgunHost = emailData.mailgunHost ?? undefined;
                              } else {
                                // Clear all fields when no provider selected
                                clearedConfig.emailService = undefined;
                                clearedConfig.emailUsername = undefined;
                                clearedConfig.emailPassword = undefined;
                                clearedConfig.emailFrom = undefined;
                                clearedConfig.emailFromName = undefined;
                                clearedConfig.mailgunApiKey = undefined;
                                clearedConfig.mailgunDomain = undefined;
                                clearedConfig.mailgunHost = undefined;
                              }
                              
                              onConfigurationChange(clearedConfig);
                            }}
                            options={fieldInfo.type === 'select' ? getSelectOptions(setting) : undefined}
                            data-testid={`input-${setting}`}
                          />
                        );
                      }
                      
                      // Add section headers for Code Execution tab to separate interpreters
                      if (tab.id === "code-execution" && setting === "librechatCodeEnabled") {
                        return (
                          <div key={`${setting}-section`} className="col-span-full">
                            <div className="col-span-full mt-6 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                                <h3 className="text-sm font-semibold text-foreground px-3">LibreChat Code Interpreter (Paid API Service)</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent"></div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 text-center">Hosted at code.librechat.ai - No self-hosting required</p>
                            </div>
                            <SettingInput
                              label={fieldInfo.label}
                              description={fieldInfo.description}
                              docUrl={fieldInfo.docUrl}
                              docSection={fieldInfo.docSection}
                              type={fieldInfo.type}
                              value={getNestedValue(configuration, setting) || false}
                              onChange={(value) => onConfigurationChange(setNestedValue(configuration, setting, value))}
                              options={fieldInfo.type === 'select' ? getSelectOptions(setting) : undefined}
                              data-testid={`input-${setting}`}
                              technical={fieldInfo.technical}
                            />
                          </div>
                        );
                      }
                      
                      if (tab.id === "code-execution" && setting === "e2bApiKey") {
                        return (
                          <div key={`${setting}-section`} className="col-span-full">
                            <div className="col-span-full mt-8 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                                <h3 className="text-sm font-semibold text-foreground px-3">E2B Code Interpreter (Self-Hosted)</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent"></div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 text-center">Custom proxy integration for E2B third-party service - Creates Docker container with OpenAPI schema for agents (WIP, not turn-key)</p>
                            </div>
                            <SettingInput
                              label={fieldInfo.label}
                              description={fieldInfo.description}
                              docUrl={fieldInfo.docUrl}
                              docSection={fieldInfo.docSection}
                              type={fieldInfo.type}
                              value={getNestedValue(configuration, setting) || ""}
                              onChange={(value) => onConfigurationChange(setNestedValue(configuration, setting, value))}
                              options={fieldInfo.type === 'select' ? getSelectOptions(setting) : undefined}
                              data-testid={`input-${setting}`}
                              technical={fieldInfo.technical}
                            />
                          </div>
                        );
                      }
                      
                      // Special handling for e2bProxyEnabled - auto-fill defaults when enabled
                      if (setting === "e2bProxyEnabled") {
                        return (
                          <SettingInput
                            key={setting}
                            label={fieldInfo.label}
                            description={fieldInfo.description}
                            docUrl={fieldInfo.docUrl}
                            docSection={fieldInfo.docSection}
                            type={fieldInfo.type}
                            value={getNestedValue(configuration, setting) || false}
                            technical={fieldInfo.technical}
                            onChange={(value) => {
                              const updates: any = { e2bProxyEnabled: value };
                              
                              // When enabling E2B, auto-fill defaults if fields are empty
                              if (value === true) {
                                if (!configuration.e2bProxyPort) {
                                  updates.e2bProxyPort = 3001;
                                }
                                if (!configuration.e2bFileTTLDays) {
                                  updates.e2bFileTTLDays = 30;
                                }
                                if (!configuration.e2bMaxFileSize) {
                                  updates.e2bMaxFileSize = 50;
                                }
                                if (configuration.e2bPerUserSandbox === undefined || configuration.e2bPerUserSandbox === null) {
                                  updates.e2bPerUserSandbox = false;
                                }
                              }
                              
                              onConfigurationChange({ ...configuration, ...updates });
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
                          options={fieldInfo.type === 'select' ? getSelectOptions(setting) : fieldInfo.options}
                          data-testid={`input-${setting}`}
                          technical={fieldInfo.technical}
                        />
                      );
                    })}
                    
                    {/* OpenAPI Schema Display for Code Execution Tab */}
                    {tab.id === "code-execution" && configuration.e2bProxyEnabled && (
                      <div className="col-span-full mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>OpenAPI Schema</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(
                                  generateE2BOpenAPISchema(configuration.e2bProxyPort || 3001),
                                  "OpenAPI Schema"
                                )}
                                data-testid="button-copy-openapi-schema"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Schema
                              </Button>
                            </CardTitle>
                            <CardDescription>
                              This OpenAPI schema can be used to configure AI agents and assistants to execute code through the E2B proxy service.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-96 rounded-md border" data-testid="openapi-schema-container">
                              <pre className="p-4 text-sm font-mono whitespace-pre-wrap" data-testid="openapi-schema-content">
                                {generateE2BOpenAPISchema(configuration.e2bProxyPort || 3001)}
                              </pre>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
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