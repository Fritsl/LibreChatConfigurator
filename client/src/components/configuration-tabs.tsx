import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SettingInput } from "./setting-input";
import { StatusIndicator } from "./status-indicator";
import { SpeechPresetSelector } from "./speech-preset-selector";
import { ModelSpecsPresetManager } from "./model-specs-preset-manager";
import { UserExperiencePresets } from "./user-experience-presets";
import { AgentCapabilitiesManager } from "./agent-capabilities-manager";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { type Configuration } from "@shared/schema";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
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
  Headphones,
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
  
  // Auto-scroll to first highlighted setting when search changes or tab changes
  useEffect(() => {
    if (searchQuery) {
      setTimeout(() => {
        const firstHighlighted = document.querySelector('[data-highlighted="true"]');
        if (firstHighlighted) {
          firstHighlighted.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 150);
    }
  }, [searchQuery, activeTab]);

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
          settings: ["enabledEndpoints", "appTitle", "interface.customWelcome", "interface.customFooter", "helpAndFAQURL", "allowSharedLinks", "allowSharedLinksPublic", "titleConvo", "summaryConvo", "interface.mcpServers.placeholder", "interface.fileSearch", "interface.uploadAsText", "interface.privacyPolicy.externalUrl", "interface.privacyPolicy.openNewTab", "interface.termsOfService.externalUrl", "interface.termsOfService.openNewTab", "interface.termsOfService.modalAcceptance", "interface.termsOfService.modalTitle", "interface.termsOfService.modalContent", "interface.modelSelect", "modelSpecs.addedEndpoints", "modelSpecs.enforce", "modelSpecs.prioritize", "interface.parameters", "interface.sidePanel", "interface.presets", "interface.prompts", "interface.bookmarks", "interface.multiConvo", "interface.agents", "interface.webSearch", "interface.endpointsMenu", "interface.defaultPreset", "interface.runCode", "interface.fileCitations", "interface.artifacts", "interface.peoplePicker.users", "interface.peoplePicker.groups", "interface.peoplePicker.roles", "interface.marketplace.use", "interface.temporaryChatRetention"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface",
        },
        {
          id: "server",
          label: "Server",
          icon: Server,
          description: "Host, Port, Environment",
          color: "from-green-500 to-green-600",
          settings: ["host", "port", "nodeEnv", "domainClient", "domainServer", "noIndex", "basePath", "appUrl", "publicSubPath"],
          docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        },
        {
          id: "security",
          label: "Security",
          icon: Shield,
          description: "JWT, Encryption, Passwords",
          color: "from-red-500 to-red-600",
          settings: ["jwtSecret", "jwtRefreshSecret", "credsKey", "credsIV", "emailVerificationRequired", "allowUnverifiedEmailLogin", "minPasswordLength", "sessionExpiry", "refreshTokenExpiry"],
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
          settings: [
            "mongoUri", "mongoRootUsername", "mongoRootPassword", "mongoDbName", 
            "mongoConnectTimeoutMS", "mongoSocketTimeoutMS", "mongoMaxPoolSize", "mongoMinPoolSize", 
            "mongoMaxIdleTimeMS", "mongoWaitQueueTimeoutMS", "mongoServerSelectionTimeoutMS", "mongoHeartbeatFrequencyMS",
            "redisUri", "redisUsername", "redisPassword", "redisKeyPrefix", "redisKeyPrefixVar", "redisMaxListeners", "redisPingInterval", "redisUseAlternativeDNSLookup"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        },
        {
          id: "azure-ai-search",
          label: "Azure AI Search",
          icon: Search,
          description: "Azure Cognitive Search Configuration",
          color: "from-cyan-500 to-cyan-600",
          settings: [
            "azureAiSearchApiKey", "azureAiSearchServiceEndpoint", "azureAiSearchIndexName", 
            "azureAiSearchEmbeddingDeploymentName", "azureAiSearchSemanticConfiguration", "azureAiSearchQueryType",
            "azureAiSearchVectorFieldName", "azureAiSearchContentFieldName", "azureAiSearchTitleFieldName", "azureAiSearchUrlFieldName"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/azure",
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
          settings: ["openaiApiKey", "assistantsApiKey", "openaiApiBase", "openaiReverseProxy", "openaiModeration", "openaiModerationApiKey", "openaiModerationReverseProxy", "anthropicApiKey", "googleApiKey", "groqApiKey", "mistralApiKey"],
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
          settings: ["awsAccessKeyId", "awsSecretAccessKey", "awsRegion", "awsBedrockRegion", "bedrockAccessKeyId", "bedrockSecretAccessKey", "bedrockRegion", "awsEndpointURL", "awsBucketName"],
          docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai/bedrock",
        },
        {
          id: "endpoints-agents",
          label: "Agents Endpoint",
          icon: Bot,
          description: "Agents endpoint-specific configuration",
          color: "from-emerald-500 to-emerald-600",
          settings: ["endpointsAgentsDisableBuilder", "endpointsAgentsRecursionLimit", "endpointsAgentsMaxRecursionLimit", "endpointsAgentsCapabilities", "endpointsAgentsMaxCitations", "endpointsAgentsMaxCitationsPerFile", "endpointsAgentsMinRelevanceScore"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "endpoints-openai",
          label: "OpenAI Endpoint",
          icon: Brain,
          description: "OpenAI endpoint configuration",
          color: "from-green-500 to-green-600",
          settings: ["endpointsOpenAITitle", "endpointsOpenAITitleConvo", "endpointsOpenAITitleModel", "endpointsOpenAIApiKey", "endpointsOpenAIBaseURL", "endpointsOpenAIModels", "endpointsOpenAIModelsFetch", "endpointsOpenAIModelsDefault", "endpointsOpenAIDropParams"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "endpoints-anthropic",
          label: "Anthropic Endpoint",
          icon: Brain,
          description: "Anthropic endpoint configuration",
          color: "from-orange-500 to-orange-600",
          settings: ["endpointsAnthropicTitle", "endpointsAnthropicApiKey", "endpointsAnthropicModelsFetch", "endpointsAnthropicModelsDefault", "endpointsAnthropicTitleConvo", "endpointsAnthropicBaseURL", "endpointsAnthropicModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "endpoints-google",
          label: "Google Endpoint",
          icon: Brain,
          description: "Google AI endpoint configuration",
          color: "from-blue-500 to-blue-600",
          settings: ["endpointsGoogleTitle", "endpointsGoogleApiKey", "endpointsGoogleModelsFetch", "endpointsGoogleModelsDefault", "endpointsGoogleBaseURL", "endpointsGoogleModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "endpoints-mistral",
          label: "Mistral Endpoint",
          icon: Brain,
          description: "Mistral AI endpoint configuration",
          color: "from-purple-500 to-purple-600",
          settings: ["endpointsMistralTitle", "endpointsMistralApiKey", "endpointsMistralBaseURL", "endpointsMistralModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "endpoints-azure-openai",
          label: "Azure OpenAI Endpoint",
          icon: Plug,
          description: "Azure OpenAI endpoint configuration",
          color: "from-cyan-500 to-cyan-600",
          settings: ["endpointsAzureOpenAITitle", "endpointsAzureOpenAIApiKey", "endpointsAzureOpenAIInstanceName", "endpointsAzureOpenAIVersion", "endpointsAzureOpenAIBaseURL", "endpointsAzureOpenAIModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/azure",
        },
        {
          id: "endpoints-gpt-plugins",
          label: "GPT Plugins Endpoint",
          icon: Plug,
          description: "GPT Plugins endpoint (deprecated)",
          color: "from-gray-400 to-gray-500",
          settings: ["endpointsGptPluginsTitle", "endpointsGptPluginsModels"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        },
        {
          id: "custom-endpoints",
          label: "Custom Endpoints",
          icon: Network,
          description: "Custom OpenAI-compatible endpoints",
          color: "from-pink-500 to-pink-600",
          settings: ["customEndpoints"],
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
          settings: ["allowRegistration", "registrationEnabled", "allowEmailLogin", "allowSocialLogin", "allowSocialRegistration", "allowPasswordReset", "registration.socialLogins", "registration.allowedDomains"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication",
        },
        {
          id: "oauth",
          label: "OAuth Providers",
          icon: Key,
          description: "Social Login Configuration",
          color: "from-purple-500 to-purple-600",
          settings: [
            "oauthProviders",
            "googleClientId", "googleClientSecret", "googleCallbackUrl",
            "githubClientId", "githubClientSecret", "githubCallbackUrl",
            "discordClientId", "discordClientSecret", "discordCallbackUrl",
            "facebookClientId", "facebookClientSecret", "facebookCallbackUrl"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        },
        {
          id: "saml",
          label: "SAML SSO",
          icon: Shield,
          description: "SAML Single Sign-On Configuration",
          color: "from-indigo-500 to-indigo-600",
          settings: [
            "samlIssuer", "samlEntryPoint", "samlCallbackUrl", "samlCert", 
            "samlDecryptionPvk", "samlSignatureAlgorithm", "samlIdentifierFormat", "samlAcceptedClockSkewMs", 
            "samlAttributeMapping", "samlRoleMapping", "samlGroupMapping", "samlSloUrl", "samlAllowCreate",
            "samlButtonLabel", "samlEmailClaim", "samlFamilyNameClaim", "samlGivenNameClaim", 
            "samlImageUrl", "samlNameClaim", "samlPictureClaim", "samlSessionSecret", "samlUsernameClaim"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        },
        {
          id: "openid",
          label: "OpenID Connect",
          icon: Key,
          description: "OpenID Connect Authentication",
          color: "from-blue-500 to-blue-600",
          settings: [
            "openidIssuer", "openidClientId", "openidClientSecret", "openidCallbackUrl", "openidScope", 
            "openidAuthorizationURL", "openidTokenURL", "openidUserInfoURL", "openidButtonLabel", "openidImageUrl", 
            "openidAccessType", "openidHd", "openidPrompt", "openidGrantType", "openidProviderType", 
            "openidRedirectProxyUrl", "openidConfigPath",
            "openidUrl", "openidSessionSecret",
            "openidAudience", "openidAutoRedirect", "openidGraphScopes", 
            "openidJwksUrlCacheEnabled", "openidJwksUrlCacheTime", "openidNameClaim", 
            "openidOnBehalfFlowForUserinfoRequired", "openidOnBehalfFlowUserinfoScope", 
            "openidRequiredRole", "openidRequiredRoleParameterPath", "openidRequiredRoleTokenKind", 
            "openidReuseTokens", "openidUsernameClaim", "openidUseEndSessionEndpoint", "openidUsePkce"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        },
        {
          id: "apple",
          label: "Apple Sign-In",
          icon: Key,
          description: "Apple OAuth Configuration",
          color: "from-gray-700 to-gray-800",
          settings: ["appleClientId", "appleTeamId", "appleKeyId", "applePrivateKey", "appleCallbackUrl", "appleScope"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        },
        {
          id: "advanced-auth",
          label: "Advanced Auth",
          icon: Shield,
          description: "Identity Provider & Advanced Settings",
          color: "from-violet-500 to-violet-600",
          settings: ["loginRedirectUrl", "identityProviderEnabled", "identityProviderName", "identityProviderLoginUrl", "identityProviderRegistrationUrl", "emailConfigEmail", "emailConfigName", "emailConfigEnabled", "emailConfigType", "emailConfigFromAddress", "emailConfigHost", "emailConfigPort", "emailConfigSecure", "emailConfigUsername", "emailConfigPassword"],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication",
        },
        {
          id: "email",
          label: "Email",
          icon: FileText,
          description: "Email Configuration",
          color: "from-blue-400 to-blue-500",
          settings: [
            "emailComposite",
            "emailService", "emailUsername", "emailPassword", 
            "emailFrom", "emailFromName", "emailHost", "emailPort",
            "emailAllowSelfsigned", "emailEncryption", "emailEncryptionHostname",
            "mailgunApiKey", "mailgunDomain", "mailgunHost", "mailgunWebhookSigningKey", 
            "emailReplyToAddress"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        },
        {
          id: "file-storage",
          label: "File Storage",
          icon: FileText,
          description: "File Upload & Storage",
          color: "from-teal-500 to-teal-600",
          settings: [
            "fileStorage", "fileConfig.endpoints", 
            "fileConfig.serverFileSizeLimit", "fileConfig.avatarSizeLimit", 
            "fileConfig.clientImageResize.enabled", "fileConfig.clientImageResize.maxWidth", "fileConfig.clientImageResize.maxHeight", 
            "fileConfig.clientImageResize.quality", "fileConfig.clientImageResize.compressFormat",
            "fileConfigEndpointsOpenAIFileLimit", "fileConfigEndpointsOpenAIFileSizeLimit", 
            "fileConfigEndpointsOpenAITotalSizeLimit", "fileConfigEndpointsOpenAISupportedMimeTypes",
            "awsAccessKeyIdFileStorage", "awsSecretAccessKeyFileStorage", "awsRegionFileStorage", 
            "azureStorageConnectionString", "firebaseServiceAccountKey"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        },
        {
          id: "search",
          label: "Search & APIs",
          icon: Search,
          description: "Web Search & External APIs",
          color: "from-violet-500 to-violet-600",
          settings: [
            "webSearch", "openweatherApiKey", 
            "fluxApiKey", "tavilyApiKey", "wolframAppId", "youtubeApiKey", "zapierNlaApiKey", 
            "sdWebuiUrl", "sdWebuiImageGenUrl", "sdWebuiImageEditUrl", 
            "travelApiKey", "pollinations", "traversaalApiKey"
          ],
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
          settings: ["meilisearchIntegration", "meilisearchURL", "meilisearchMasterKey", "meiliNoAnalytics"],
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
            "fileUploadViolationScore", "forkViolationScore", "importViolationScore", 
            "sttViolationScore", "ttsViolationScore",
            "messageIpMax", "messageIpWindow", "messageUserMax", "messageUserWindow",
            "registerMax", "registerWindow",
            "rateLimits.fileUploads.ipMax", "rateLimits.fileUploads.ipWindowInMinutes", "rateLimits.fileUploads.userMax", "rateLimits.fileUploads.userWindowInMinutes",
            "rateLimits.conversationsImport.ipMax", "rateLimits.conversationsImport.ipWindowInMinutes", "rateLimits.conversationsImport.userMax", "rateLimits.conversationsImport.userWindowInMinutes",
            "rateLimits.stt.ipMax", "rateLimits.stt.ipWindowInMinutes", "rateLimits.stt.userMax", "rateLimits.stt.userWindowInMinutes",
            "rateLimits.tts.ipMax", "rateLimits.tts.ipWindowInMinutes", "rateLimits.tts.userMax", "rateLimits.tts.userWindowInMinutes",
            "checkBalanceEnabled", "checkBalanceFrequency", "rateLimitsWarmup", "rateLimitsWarmupLimit", "rateLimitsWarmupPeriod", "rateLimitsWarmupSkipFirstPeriod"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
        },
        {
          id: "ldap",
          label: "LDAP",
          icon: Shield,
          description: "LDAP Configuration",
          color: "from-yellow-600 to-yellow-700",
          settings: ["ldapURL", "ldapBindDN", "ldapBindCredentials", "ldapSearchBase", "ldapSearchFilter", "ldapUsernameField"],
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
      label: "SPEECH & VOICE",
      tabs: [
        {
          id: "speech-default",
          label: "Speech Default",
          icon: Zap,
          description: "Quick Preset Configuration",
          color: "from-yellow-400 to-orange-500",
          settings: ["speech.preset.selected", "speech.preset.customLanguage", "speech.preset.customVoice"],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        },
        {
          id: "speech",
          label: "Speech Experience",
          icon: Headphones,
          description: "UI Speech/Voice Settings",
          color: "from-indigo-400 to-indigo-500",
          settings: [
            "speech.speechTab.conversationMode",
            "speech.speechTab.advancedMode",
            "speech.speechTab.speechToText.engineSTT",
            "speech.speechTab.speechToText.languageSTT",
            "speech.speechTab.speechToText.autoTranscribeAudio",
            "speech.speechTab.speechToText.decibelValue",
            "speech.speechTab.speechToText.autoSendText",
            "speech.speechTab.textToSpeech.engineTTS",
            "speech.speechTab.textToSpeech.voice",
            "speech.speechTab.textToSpeech.languageTTS",
            "speech.speechTab.textToSpeech.automaticPlayback",
            "speech.speechTab.textToSpeech.playbackRate",
            "speech.speechTab.textToSpeech.cacheTTS"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
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
          id: "memory",
          label: "Memory",
          icon: Brain,
          description: "Conversation Memory & Personalization",
          color: "from-indigo-500 to-purple-600",
          settings: [
            "memory.disabled", "memory.personalize", "memory.validKeys", "memory.tokenLimit", "memory.messageWindowSize",
            "memory.agent.id", "memory.agent.provider", "memory.agent.model", "memory.agent.instructions",
            "memory.agent.model_parameters.temperature", "memory.agent.model_parameters.max_tokens",
            "memory.agent.model_parameters.top_p", "memory.agent.model_parameters.frequency_penalty"
          ],
          docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
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
          settings: ["debugLogging", "debugConsole", "consoleJSON", "debugOpenai", "debugPlugins"],
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
      settings: ["ocr.apiKey", "ocr.baseURL", "ocr.strategy", "ocr.mistralModel", "ocrApiKey", "ocrApiBase"],
      docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/config",
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
        description: "Select which AI providers appear in the dropdown menu users see in LibreChat. Check the boxes below for the providers you want to enable. This sets the ENDPOINTS variable in .env (not YAML). Important: Only enable endpoints that you've actually configured with API keys and settings, or users will see errors. You can intentionally hide configured endpoints - for example, check only 'Agents' for an agents-only experience.",
        label: "Enabled Endpoints (Dropdown Visibility)",
        options: [
          { value: "openAI", label: "OpenAI (value: openAI)" },
          { value: "anthropic", label: "Anthropic / Claude (value: anthropic)" },
          { value: "google", label: "Google / Gemini (value: google)" },
          { value: "azureOpenAI", label: "Azure OpenAI (value: azureOpenAI)" },
          { value: "agents", label: "Agents (value: agents)" },
          { value: "azureAssistants", label: "Azure Assistants (value: azureAssistants)" },
          { value: "bedrock", label: "AWS Bedrock (value: bedrock)" },
          { value: "cohere", label: "Cohere (value: cohere)" },
          { value: "assistants", label: "OpenAI Assistants (value: assistants)" },
          { value: "gptPlugins", label: "GPT Plugins - Deprecated (value: gptPlugins)" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#endpoints",
        docSection: "UI Visibility",
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
      
      // Subdirectory Hosting Configuration
      basePath: { 
        type: "text", 
        description: "Base path for subdirectory hosting (e.g., '/chat' if hosting at example.com/chat). Allows LibreChat to run in a subdirectory instead of root. Leave empty for root path hosting.", 
        label: "Base Path",
        placeholder: "/chat",
        docUrl: "https://www.librechat.ai/docs/deployment/subdirectory",
        docSection: "Subdirectory Hosting",
        technical: { envVar: "BASE_PATH", configFile: ".env" }
      },
      appUrl: { 
        type: "text", 
        description: "Full application URL including subdirectory (e.g., https://example.com/chat). Used for generating links and redirects in subdirectory deployments. Must match your actual deployment URL.", 
        label: "Application URL",
        placeholder: "https://example.com/chat",
        docUrl: "https://www.librechat.ai/docs/deployment/subdirectory",
        docSection: "Subdirectory Hosting",
        technical: { envVar: "APP_URL", configFile: ".env" }
      },
      publicSubPath: { 
        type: "text", 
        description: "Public-facing subdirectory path for static assets when using a reverse proxy. Typically matches BASE_PATH. Required for correct asset URLs in subdirectory hosting.", 
        label: "Public Subdirectory Path",
        placeholder: "/chat",
        docUrl: "https://www.librechat.ai/docs/deployment/subdirectory",
        docSection: "Subdirectory Hosting",
        technical: { envVar: "PUBLIC_SUB_PATH", configFile: ".env" }
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
      emailVerificationRequired: { 
        type: "boolean", 
        description: "Require users to verify their email address before they can access LibreChat. When enabled, new users must click the verification link sent to their email before logging in. Requires email service to be configured.", 
        label: "Require Email Verification",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Security",
        technical: { envVar: "EMAIL_VERIFICATION_REQUIRED", configFile: ".env" }
      },
      allowUnverifiedEmailLogin: { 
        type: "boolean", 
        description: "Allow users to log in before verifying their email address. When enabled, users can access LibreChat immediately after registration without clicking the verification link. Useful for development, private instances, or when email service is not configured. Set to false for stricter security in production.", 
        label: "Allow Unverified Email Login",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Security",
        technical: { envVar: "ALLOW_UNVERIFIED_EMAIL_LOGIN", configFile: ".env" }
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
      registrationEnabled: { 
        type: "boolean", 
        description: "Alternative field for enabling/disabling user registration. Mirrors ALLOW_REGISTRATION functionality. When false, prevents new user account creation (invite-only mode).", 
        label: "Registration Enabled",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#authentication",
        docSection: "Authentication",
        technical: { envVar: "REGISTRATION_ENABLED", configFile: ".env" }
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
      assistantsApiKey: { 
        type: "password", 
        description: "Dedicated API key for OpenAI Assistants API. If not set, falls back to OPENAI_API_KEY. Use separate key for billing/usage isolation between chat and assistants features.", 
        label: "Assistants API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#assistants-api",
        docSection: "AI APIs",
        technical: { envVar: "ASSISTANTS_API_KEY", configFile: ".env" }
      },
      openaiApiBase: { type: "text", description: "Custom OpenAI API base URL (optional, for OpenAI-compatible endpoints)", label: "OpenAI API Base URL", technical: { envVar: "OPENAI_API_BASE", configFile: ".env" } },
      openaiReverseProxy: { type: "text", description: "OpenAI reverse proxy URL (deprecated - use custom endpoints in librechat.yaml instead). Full URL with /v1 path.", label: "OpenAI Reverse Proxy (Deprecated)", technical: { envVar: "OPENAI_REVERSE_PROXY", configFile: ".env" } },
      openaiModerationReverseProxy: { type: "text", description: "OpenAI moderation reverse proxy URL (limited compatibility with some proxies)", label: "OpenAI Moderation Reverse Proxy", technical: { envVar: "OPENAI_MODERATION_REVERSE_PROXY", configFile: ".env" } },
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
      bedrockAccessKeyId: { 
        type: "password", 
        description: "AWS Bedrock-specific access key ID. Alternative to AWS_ACCESS_KEY_ID for isolated Bedrock credentials. Use when you want separate keys for Bedrock vs other AWS services.", 
        label: "Bedrock Access Key ID",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints/bedrock",
        docSection: "AWS Bedrock",
        technical: { envVar: "BEDROCK_ACCESS_KEY_ID", configFile: ".env" }
      },
      bedrockSecretAccessKey: { 
        type: "password", 
        description: "AWS Bedrock-specific secret access key. Pairs with BEDROCK_ACCESS_KEY_ID for dedicated Bedrock authentication. Recommended for security isolation between AWS services.", 
        label: "Bedrock Secret Access Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints/bedrock",
        docSection: "AWS Bedrock",
        technical: { envVar: "BEDROCK_SECRET_ACCESS_KEY", configFile: ".env" }
      },
      bedrockRegion: { 
        type: "text", 
        description: "AWS region for Bedrock service (e.g., us-east-1, us-west-2). Overrides AWS_REGION specifically for Bedrock requests. Ensure the region supports your desired Bedrock models.", 
        label: "Bedrock Region",
        placeholder: "us-east-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints/bedrock",
        docSection: "AWS Bedrock",
        technical: { envVar: "BEDROCK_REGION", configFile: ".env" }
      },
      
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
      meilisearchURL: { 
        type: "text", 
        description: "MeiliSearch server URL. Required for conversation search functionality. Example: http://localhost:7700 for local or https://your-meilisearch-instance.com for hosted.", 
        label: "MeiliSearch URL",
        placeholder: "http://localhost:7700",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/search",
        docSection: "Search Configuration",
        technical: { envVar: "MEILISEARCH_URL", configFile: ".env" }
      },
      meilisearchMasterKey: { 
        type: "password", 
        description: "MeiliSearch master key for authentication. This is the administrative API key for full access to your MeiliSearch instance. Keep this secure!", 
        label: "MeiliSearch Master Key",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/search",
        docSection: "Search Configuration",
        technical: { envVar: "MEILISEARCH_MASTER_KEY", configFile: ".env" }
      },
      meiliNoAnalytics: { 
        type: "boolean", 
        description: "Disable MeiliSearch analytics and telemetry. When enabled, prevents MeiliSearch from sending anonymous usage data. Recommended for privacy-focused deployments.", 
        label: "Disable MeiliSearch Analytics",
        docUrl: "https://www.librechat.ai/docs/configuration/meilisearch",
        docSection: "Search Configuration",
        technical: { envVar: "MEILI_NO_ANALYTICS", configFile: ".env" }
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
      ldapUsernameField: { type: "text", description: "LDAP username field attribute", label: "LDAP Username Field", technical: { envVar: "LDAP_USERNAME_FIELD", configFile: ".env" } },
      
      // SAML SSO
      samlIssuer: { type: "text", description: "SAML service provider entity ID", label: "SAML Issuer", technical: { envVar: "SAML_ISSUER", configFile: ".env" } },
      samlEntryPoint: { type: "text", description: "SAML identity provider entry point URL", label: "SAML Entry Point", technical: { envVar: "SAML_ENTRY_POINT", configFile: ".env" } },
      samlCallbackUrl: { type: "text", description: "SAML callback URL for authentication", label: "SAML Callback URL", technical: { envVar: "SAML_CALLBACK_URL", configFile: ".env" } },
      samlCert: { type: "textarea", description: "SAML signing certificate (PEM format or file path)", label: "SAML Certificate", technical: { envVar: "SAML_CERT", configFile: ".env" } },
      samlDecryptionPvk: { type: "password", description: "SAML decryption private key", label: "SAML Decryption Private Key", technical: { envVar: "SAML_DECRYPTION_PVK", configFile: ".env" } },
      samlSignatureAlgorithm: { type: "text", description: "SAML signature algorithm (e.g., sha256, sha512)", label: "SAML Signature Algorithm", technical: { envVar: "SAML_SIGNATURE_ALGORITHM", configFile: ".env" } },
      samlIdentifierFormat: { type: "text", description: "SAML identifier format", label: "SAML Identifier Format", technical: { envVar: "SAML_IDENTIFIER_FORMAT", configFile: ".env" } },
      samlAcceptedClockSkewMs: { type: "number", description: "SAML accepted clock skew in milliseconds", label: "SAML Clock Skew (ms)", technical: { envVar: "SAML_ACCEPTED_CLOCK_SKEW_MS", configFile: ".env" } },
      samlAttributeMapping: { type: "textarea", description: "SAML attribute mapping (JSON format)", label: "SAML Attribute Mapping", technical: { envVar: "SAML_ATTRIBUTE_MAPPING", configFile: ".env" } },
      samlRoleMapping: { type: "textarea", description: "SAML role mapping (JSON format)", label: "SAML Role Mapping", technical: { envVar: "SAML_ROLE_MAPPING", configFile: ".env" } },
      samlGroupMapping: { type: "textarea", description: "SAML group mapping (JSON format)", label: "SAML Group Mapping", technical: { envVar: "SAML_GROUP_MAPPING", configFile: ".env" } },
      samlSloUrl: { type: "text", description: "SAML single logout URL", label: "SAML SLO URL", technical: { envVar: "SAML_SLO_URL", configFile: ".env" } },
      samlAllowCreate: { type: "boolean", description: "Allow SAML to create new users", label: "SAML Allow Create", technical: { envVar: "SAML_ALLOW_CREATE", configFile: ".env" } },
      
      // OpenID Connect
      openidIssuer: { type: "text", description: "OpenID Connect issuer URL", label: "OpenID Issuer", technical: { envVar: "OPENID_ISSUER", configFile: ".env" } },
      openidClientId: { type: "text", description: "OpenID Connect client ID", label: "OpenID Client ID", technical: { envVar: "OPENID_CLIENT_ID", configFile: ".env" } },
      openidClientSecret: { type: "password", description: "OpenID Connect client secret", label: "OpenID Client Secret", technical: { envVar: "OPENID_CLIENT_SECRET", configFile: ".env" } },
      openidCallbackUrl: { type: "text", description: "OpenID Connect callback URL", label: "OpenID Callback URL", technical: { envVar: "OPENID_CALLBACK_URL", configFile: ".env" } },
      openidScope: { type: "text", description: "OpenID Connect scope (space-separated)", label: "OpenID Scope", technical: { envVar: "OPENID_SCOPE", configFile: ".env" } },
      openidAuthorizationURL: { type: "text", description: "OpenID Connect authorization URL", label: "OpenID Authorization URL", technical: { envVar: "OPENID_AUTHORIZATION_URL", configFile: ".env" } },
      openidTokenURL: { type: "text", description: "OpenID Connect token URL", label: "OpenID Token URL", technical: { envVar: "OPENID_TOKEN_URL", configFile: ".env" } },
      openidUserInfoURL: { type: "text", description: "OpenID Connect user info URL", label: "OpenID UserInfo URL", technical: { envVar: "OPENID_USERINFO_URL", configFile: ".env" } },
      openidButtonLabel: { type: "text", description: "OpenID Connect login button label", label: "OpenID Button Label", technical: { envVar: "OPENID_BUTTON_LABEL", configFile: ".env" } },
      openidImageUrl: { type: "text", description: "OpenID Connect button image URL", label: "OpenID Image URL", technical: { envVar: "OPENID_IMAGE_URL", configFile: ".env" } },
      openidAccessType: { type: "text", description: "OpenID Connect access type (offline, online)", label: "OpenID Access Type", technical: { envVar: "OPENID_ACCESS_TYPE", configFile: ".env" } },
      openidHd: { type: "text", description: "OpenID Connect hosted domain (for Google Workspace)", label: "OpenID Hosted Domain", technical: { envVar: "OPENID_HD", configFile: ".env" } },
      openidPrompt: { type: "text", description: "OpenID Connect prompt parameter", label: "OpenID Prompt", technical: { envVar: "OPENID_PROMPT", configFile: ".env" } },
      openidGrantType: { type: "text", description: "OpenID Connect grant type", label: "OpenID Grant Type", technical: { envVar: "OPENID_GRANT_TYPE", configFile: ".env" } },
      openidProviderType: { type: "text", description: "OpenID Connect provider type", label: "OpenID Provider Type", technical: { envVar: "OPENID_PROVIDER_TYPE", configFile: ".env" } },
      openidRedirectProxyUrl: { type: "text", description: "OpenID Connect redirect proxy URL", label: "OpenID Redirect Proxy URL", technical: { envVar: "OPENID_REDIRECT_PROXY_URL", configFile: ".env" } },
      openidConfigPath: { type: "text", description: "OpenID Connect configuration path", label: "OpenID Config Path", technical: { envVar: "OPENID_CONFIG_PATH", configFile: ".env" } },
      
      // Apple Sign-In
      appleClientId: { type: "text", description: "Apple OAuth client ID (service ID)", label: "Apple Client ID", technical: { envVar: "APPLE_CLIENT_ID", configFile: ".env" } },
      appleTeamId: { type: "text", description: "Apple team ID", label: "Apple Team ID", technical: { envVar: "APPLE_TEAM_ID", configFile: ".env" } },
      appleKeyId: { type: "text", description: "Apple key ID", label: "Apple Key ID", technical: { envVar: "APPLE_KEY_ID", configFile: ".env" } },
      applePrivateKey: { type: "textarea", description: "Apple private key (PEM format)", label: "Apple Private Key", technical: { envVar: "APPLE_PRIVATE_KEY", configFile: ".env" } },
      appleCallbackUrl: { type: "text", description: "Apple OAuth callback URL", label: "Apple Callback URL", technical: { envVar: "APPLE_CALLBACK_URL", configFile: ".env" } },
      appleScope: { type: "text", description: "Apple OAuth scope (space-separated)", label: "Apple Scope", technical: { envVar: "APPLE_SCOPE", configFile: ".env" } },
      
      // Advanced Auth
      loginRedirectUrl: { type: "text", description: "URL to redirect after login", label: "Login Redirect URL", technical: { envVar: "LOGIN_REDIRECT_URL", configFile: ".env" } },
      identityProviderEnabled: { type: "boolean", description: "Enable identity provider integration", label: "Identity Provider Enabled", technical: { envVar: "IDENTITY_PROVIDER_ENABLED", configFile: ".env" } },
      identityProviderName: { type: "text", description: "Identity provider name", label: "Identity Provider Name", technical: { envVar: "IDENTITY_PROVIDER_NAME", configFile: ".env" } },
      identityProviderLoginUrl: { type: "text", description: "Identity provider login URL", label: "Identity Provider Login URL", technical: { envVar: "IDENTITY_PROVIDER_LOGIN_URL", configFile: ".env" } },
      identityProviderRegistrationUrl: { type: "text", description: "Identity provider registration URL", label: "Identity Provider Registration URL", technical: { envVar: "IDENTITY_PROVIDER_REGISTRATION_URL", configFile: ".env" } },
      emailConfigEmail: { type: "text", description: "Email service sender email address", label: "Email Config Email", technical: { envVar: "EMAIL_CONFIG_EMAIL", configFile: ".env" } },
      emailConfigName: { type: "text", description: "Email service sender name", label: "Email Config Name", technical: { envVar: "EMAIL_CONFIG_NAME", configFile: ".env" } },
      emailConfigEnabled: { type: "boolean", description: "Enable email configuration", label: "Email Config Enabled", technical: { envVar: "EMAIL_CONFIG_ENABLED", configFile: ".env" } },
      emailConfigType: { type: "text", description: "Email service type (SMTP, Mailgun)", label: "Email Config Type", technical: { envVar: "EMAIL_CONFIG_TYPE", configFile: ".env" } },
      emailConfigFromAddress: { type: "text", description: "Email from address", label: "Email From Address", technical: { envVar: "EMAIL_CONFIG_FROM_ADDRESS", configFile: ".env" } },
      emailConfigHost: { type: "text", description: "Email SMTP host", label: "Email Config Host", technical: { envVar: "EMAIL_CONFIG_HOST", configFile: ".env" } },
      emailConfigPort: { type: "number", description: "Email SMTP port", label: "Email Config Port", technical: { envVar: "EMAIL_CONFIG_PORT", configFile: ".env" } },
      emailConfigSecure: { type: "boolean", description: "Email SMTP secure connection (TLS)", label: "Email Config Secure", technical: { envVar: "EMAIL_CONFIG_SECURE", configFile: ".env" } },
      emailConfigUsername: { type: "text", description: "Email SMTP username", label: "Email Config Username", technical: { envVar: "EMAIL_CONFIG_USERNAME", configFile: ".env" } },
      emailConfigPassword: { type: "password", description: "Email SMTP password", label: "Email Config Password", technical: { envVar: "EMAIL_CONFIG_PASSWORD", configFile: ".env" } },
      
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
        description: "API key for OCR service. Required for Mistral OCR (uses your Mistral API key) or custom OCR providers. No automatic fallback to other keys.", 
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
      ocrApiKey: { 
        type: "password", 
        description: "OCR API key (.env flat version). Alternative to ocr.apiKey for environment variable configuration. Use this when configuring OCR through .env instead of librechat.yaml.", 
        label: "OCR API Key (.env)",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration",
        technical: { envVar: "OCR_API_KEY", configFile: ".env" }
      },
      ocrApiBase: { 
        type: "text", 
        description: "OCR API base URL (.env flat version). Alternative to ocr.baseURL for environment variable configuration. Use for custom OCR service endpoints.", 
        label: "OCR API Base (.env)",
        placeholder: "https://api.ocr-service.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/ocr",
        docSection: "OCR Configuration",
        technical: { envVar: "OCR_API_BASE", configFile: ".env" }
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
        description: "API key for STT service. When using OpenAI provider, leave blank to use the general OPENAI_API_KEY. Required for other providers (Azure, Google, Deepgram, AssemblyAI).", 
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
        type: "select", 
        description: "Language for STT processing using ISO 639-1 codes (OpenAI Whisper supports 50+ languages)", 
        label: "STT Language",
        options: [
          { value: "af", label: "Afrikaans (af)" },
          { value: "ar", label: "Arabic (ar)" },
          { value: "hy", label: "Armenian (hy)" },
          { value: "az", label: "Azerbaijani (az)" },
          { value: "be", label: "Belarusian (be)" },
          { value: "bs", label: "Bosnian (bs)" },
          { value: "bg", label: "Bulgarian (bg)" },
          { value: "ca", label: "Catalan (ca)" },
          { value: "zh", label: "Chinese (zh)" },
          { value: "hr", label: "Croatian (hr)" },
          { value: "cs", label: "Czech (cs)" },
          { value: "da", label: "Danish (da)" },
          { value: "nl", label: "Dutch (nl)" },
          { value: "en", label: "English (en)" },
          { value: "et", label: "Estonian (et)" },
          { value: "fi", label: "Finnish (fi)" },
          { value: "fr", label: "French (fr)" },
          { value: "gl", label: "Galician (gl)" },
          { value: "de", label: "German (de)" },
          { value: "el", label: "Greek (el)" },
          { value: "he", label: "Hebrew (he)" },
          { value: "hi", label: "Hindi (hi)" },
          { value: "hu", label: "Hungarian (hu)" },
          { value: "is", label: "Icelandic (is)" },
          { value: "id", label: "Indonesian (id)" },
          { value: "it", label: "Italian (it)" },
          { value: "ja", label: "Japanese (ja)" },
          { value: "ko", label: "Korean (ko)" },
          { value: "lv", label: "Latvian (lv)" },
          { value: "lt", label: "Lithuanian (lt)" },
          { value: "mk", label: "Macedonian (mk)" },
          { value: "ms", label: "Malay (ms)" },
          { value: "mr", label: "Marathi (mr)" },
          { value: "mi", label: "Maori (mi)" },
          { value: "ne", label: "Nepali (ne)" },
          { value: "no", label: "Norwegian (no)" },
          { value: "fa", label: "Persian (fa)" },
          { value: "pl", label: "Polish (pl)" },
          { value: "pt", label: "Portuguese (pt)" },
          { value: "ro", label: "Romanian (ro)" },
          { value: "ru", label: "Russian (ru)" },
          { value: "sr", label: "Serbian (sr)" },
          { value: "sk", label: "Slovak (sk)" },
          { value: "sl", label: "Slovenian (sl)" },
          { value: "es", label: "Spanish (es)" },
          { value: "sw", label: "Swahili (sw)" },
          { value: "sv", label: "Swedish (sv)" },
          { value: "tl", label: "Tagalog (tl)" },
          { value: "ta", label: "Tamil (ta)" },
          { value: "th", label: "Thai (th)" },
          { value: "tr", label: "Turkish (tr)" },
          { value: "uk", label: "Ukrainian (uk)" },
          { value: "ur", label: "Urdu (ur)" },
          { value: "vi", label: "Vietnamese (vi)" },
          { value: "cy", label: "Welsh (cy)" }
        ],
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
        description: "API key for TTS service. When using OpenAI provider, leave blank to use the general OPENAI_API_KEY. Required for other providers (Azure, Google, ElevenLabs, AWS).", 
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
      
      // Speech Experience Configuration (UI-Level Settings)
      "speech.speechTab.conversationMode": {
        type: "boolean",
        description: "Enable conversation mode for continuous voice interaction",
        label: "Conversation Mode",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.conversationMode", configFile: "librechat.yaml" }
      },
      "speech.speechTab.advancedMode": {
        type: "boolean",
        description: "Show advanced speech settings in the UI",
        label: "Advanced Mode",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.advancedMode", configFile: "librechat.yaml" }
      },
      "speech.speechTab.speechToText.engineSTT": {
        type: "select",
        description: "STT engine to use in UI (browser uses Web Speech API, external uses configured STT service)",
        label: "UI STT Engine",
        options: [
          { value: "browser", label: "Browser" },
          { value: "external", label: "External" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.speechToText.engineSTT", configFile: "librechat.yaml" }
      },
      "speech.speechTab.speechToText.languageSTT": {
        type: "select",
        description: "Language for STT in UI using BCP-47 codes with regional variants (browser STT uses Web Speech API language codes)",
        label: "UI STT Language",
        options: [
          { value: "en-US", label: "English (United States)" },
          { value: "en-GB", label: "English (United Kingdom)" },
          { value: "en-AU", label: "English (Australia)" },
          { value: "en-CA", label: "English (Canada)" },
          { value: "es-ES", label: "Spanish (Spain)" },
          { value: "es-MX", label: "Spanish (Mexico)" },
          { value: "es-AR", label: "Spanish (Argentina)" },
          { value: "fr-FR", label: "French (France)" },
          { value: "fr-CA", label: "French (Canada)" },
          { value: "de-DE", label: "German (Germany)" },
          { value: "it-IT", label: "Italian (Italy)" },
          { value: "pt-PT", label: "Portuguese (Portugal)" },
          { value: "pt-BR", label: "Portuguese (Brazil)" },
          { value: "ru-RU", label: "Russian (Russia)" },
          { value: "zh-CN", label: "Chinese (Simplified)" },
          { value: "zh-TW", label: "Chinese (Traditional)" },
          { value: "ja-JP", label: "Japanese (Japan)" },
          { value: "ko-KR", label: "Korean (Korea)" },
          { value: "ar-SA", label: "Arabic (Saudi Arabia)" },
          { value: "hi-IN", label: "Hindi (India)" },
          { value: "nl-NL", label: "Dutch (Netherlands)" },
          { value: "pl-PL", label: "Polish (Poland)" },
          { value: "tr-TR", label: "Turkish (Turkey)" },
          { value: "sv-SE", label: "Swedish (Sweden)" },
          { value: "da-DK", label: "Danish (Denmark)" },
          { value: "fi-FI", label: "Finnish (Finland)" },
          { value: "no-NO", label: "Norwegian (Norway)" },
          { value: "cs-CZ", label: "Czech (Czech Republic)" },
          { value: "hu-HU", label: "Hungarian (Hungary)" },
          { value: "ro-RO", label: "Romanian (Romania)" },
          { value: "el-GR", label: "Greek (Greece)" },
          { value: "he-IL", label: "Hebrew (Israel)" },
          { value: "th-TH", label: "Thai (Thailand)" },
          { value: "vi-VN", label: "Vietnamese (Vietnam)" },
          { value: "id-ID", label: "Indonesian (Indonesia)" },
          { value: "uk-UA", label: "Ukrainian (Ukraine)" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.speechToText.languageSTT", configFile: "librechat.yaml" }
      },
      "speech.speechTab.speechToText.autoTranscribeAudio": {
        type: "boolean",
        description: "Automatically transcribe audio input when detected",
        label: "Auto Transcribe",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.speechToText.autoTranscribeAudio", configFile: "librechat.yaml" }
      },
      "speech.speechTab.speechToText.decibelValue": {
        type: "number",
        description: "Decibel threshold for speech detection (-100 to 0)",
        label: "Decibel Threshold",
        placeholder: "-45",
        min: -100,
        max: 0,
        step: 1,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.speechToText.decibelValue", configFile: "librechat.yaml" }
      },
      "speech.speechTab.speechToText.autoSendText": {
        type: "number",
        description: "Auto-send delay in ms after transcription (0 = disabled)",
        label: "Auto Send Delay (ms)",
        placeholder: "0",
        min: 0,
        max: 10000,
        step: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.speechToText.autoSendText", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.engineTTS": {
        type: "select",
        description: "TTS engine to use in UI (browser uses Web Speech API, external uses configured TTS service)",
        label: "UI TTS Engine",
        options: [
          { value: "browser", label: "Browser" },
          { value: "external", label: "External" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.engineTTS", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.voice": {
        type: "text",
        description: "Voice to use in UI TTS - depends on provider (OpenAI: alloy/echo/fable/onyx/nova/shimmer, ElevenLabs: custom voices, etc.)",
        label: "UI TTS Voice",
        placeholder: "alloy",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.voice", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.languageTTS": {
        type: "text",
        description: "Language for TTS in UI - 2-letter ISO code (en, es, fr, de, it, pt, zh, ja, ko, etc.)",
        label: "UI TTS Language",
        placeholder: "en",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.languageTTS", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.automaticPlayback": {
        type: "boolean",
        description: "Automatically play TTS responses in the UI",
        label: "Auto Playback",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.automaticPlayback", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.playbackRate": {
        type: "number",
        description: "TTS playback speed in UI (0.25 to 4.0)",
        label: "Playback Speed",
        placeholder: "1.0",
        min: 0.25,
        max: 4.0,
        step: 0.25,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.playbackRate", configFile: "librechat.yaml" }
      },
      "speech.speechTab.textToSpeech.cacheTTS": {
        type: "boolean",
        description: "Cache TTS output in UI to avoid re-synthesis",
        label: "Cache TTS",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/speech",
        docSection: "Speech Configuration",
        technical: { yamlPath: "speech.speechTab.textToSpeech.cacheTTS", configFile: "librechat.yaml" }
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
        description: "Default number of steps an agent can take in a single run. Users can adjust this in the UI up to the Max Recursion Limit. Higher values allow more complex multi-step reasoning but increase costs and latency. Range: 1-100, LibreChat default when unset: 25", 
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
        description: "Absolute maximum number of steps users can configure for agent runs. This sets the ceiling for the 'Max Agent Steps' slider in Advanced Settings. Use this to prevent users from setting excessively high step counts. Range: 1-200, LibreChat default: inherits Recursion Limit value (or 25 if both unset)", 
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
        description: "Maximum total citations an agent can use across all sources. Controls how many search results are included. Range: 1-100, Default: 30", 
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
        description: "Maximum citations from any single source/file to prevent over-reliance on one result. Range: 1-20, Default: 7", 
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
        description: "Minimum relevance threshold for including search results - higher values mean stricter filtering. Range: 0.0-1.0, Default: 0.45", 
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
        description: "⚠️ Controls what features agents can USE. Note: 'Context (Upload as Text)' has a SEPARATE UI visibility setting in UI/Visibility tab - you need to configure BOTH to fully control the feature. Select capabilities to enable: artifacts (generative UI), context (upload as text - agent processing), ocr (optical character recognition), chain (agent chaining), execute_code, file_search, actions, tools, web_search.", 
        label: "Agent Capabilities (Functionality)",
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
      
      // Additional Web Search Fields (camelCase for field-registry compatibility)
      searxngInstanceUrl: { type: "text", description: "SearXNG instance URL for web search", label: "SearXNG Instance URL", technical: { envVar: "SEARXNG_INSTANCE_URL", yamlPath: "webSearch.searxngInstanceUrl", configFile: ".env & librechat.yaml" } },
      searxngApiKey: { type: "password", description: "SearXNG API key for authenticated requests", label: "SearXNG API Key", technical: { envVar: "SEARXNG_API_KEY", yamlPath: "webSearch.searxngApiKey", configFile: ".env & librechat.yaml" } },
      firecrawlApiKey: { type: "password", description: "Firecrawl API key for advanced web scraping", label: "Firecrawl API Key", technical: { envVar: "FIRECRAWL_API_KEY", yamlPath: "webSearch.firecrawlApiKey", configFile: ".env & librechat.yaml" } },
      firecrawlApiUrl: { type: "text", description: "Firecrawl API URL (custom or self-hosted instance)", label: "Firecrawl API URL", technical: { envVar: "FIRECRAWL_API_URL", yamlPath: "webSearch.firecrawlApiUrl", configFile: ".env & librechat.yaml" } },
      webSearchFirecrawlOptionsFormats: { type: "array", description: "Firecrawl output formats (e.g., markdown, html, links)", label: "Firecrawl Formats", technical: { yamlPath: "webSearch.firecrawlOptions.formats", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsOnlyMainContent: { type: "boolean", description: "Extract only main content, excluding navigation and ads", label: "Only Main Content", technical: { yamlPath: "webSearch.firecrawlOptions.onlyMainContent", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsTimeout: { type: "number", description: "Firecrawl request timeout in milliseconds. Default: 30000", label: "Firecrawl Timeout (ms)", technical: { yamlPath: "webSearch.firecrawlOptions.timeout", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsWaitFor: { type: "number", description: "Wait time in milliseconds before scraping. Default: 0", label: "Wait For (ms)", technical: { yamlPath: "webSearch.firecrawlOptions.waitFor", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsBlockAds: { type: "boolean", description: "Block ads during scraping for cleaner content", label: "Block Ads", technical: { yamlPath: "webSearch.firecrawlOptions.blockAds", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsRemoveBase64Images: { type: "boolean", description: "Remove base64-encoded images to reduce response size", label: "Remove Base64 Images", technical: { yamlPath: "webSearch.firecrawlOptions.removeBase64Images", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsMobile: { type: "boolean", description: "Use mobile user agent for scraping", label: "Mobile Mode", technical: { yamlPath: "webSearch.firecrawlOptions.mobile", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsMaxAge: { type: "number", description: "Maximum cache age in seconds. Default: 0 (no cache)", label: "Max Cache Age (s)", technical: { yamlPath: "webSearch.firecrawlOptions.maxAge", configFile: "librechat.yaml" } },
      webSearchFirecrawlOptionsProxy: { type: "text", description: "Proxy URL for Firecrawl requests", label: "Proxy URL", technical: { yamlPath: "webSearch.firecrawlOptions.proxy", configFile: "librechat.yaml" } },
      jinaApiKey: { type: "password", description: "Jina AI API key for web scraping and reranking", label: "Jina API Key", technical: { envVar: "JINA_API_KEY", yamlPath: "webSearch.jinaApiKey", configFile: ".env & librechat.yaml" } },
      jinaApiUrl: { type: "text", description: "Jina API URL (custom or self-hosted instance)", label: "Jina API URL", technical: { envVar: "JINA_API_URL", yamlPath: "webSearch.jinaApiUrl", configFile: ".env & librechat.yaml" } },
      cohereApiKey: { type: "password", description: "Cohere API key for search result reranking", label: "Cohere API Key", technical: { envVar: "COHERE_API_KEY", yamlPath: "webSearch.cohereApiKey", configFile: ".env & librechat.yaml" } },
      webSearchProvider: { type: "select", description: "Web search provider to use. Options: serper, searxng", label: "Search Provider", options: ["serper", "searxng"], technical: { yamlPath: "webSearch.searchProvider", configFile: "librechat.yaml" } },
      webSearchScraperType: { type: "select", description: "Web scraper type. Options: firecrawl, jina", label: "Scraper Type", options: ["firecrawl", "jina"], technical: { yamlPath: "webSearch.scraperType", configFile: "librechat.yaml" } },
      webSearchRerankerType: { type: "select", description: "Result reranker type. Options: jina, cohere", label: "Reranker Type", options: ["jina", "cohere"], technical: { yamlPath: "webSearch.rerankerType", configFile: "librechat.yaml" } },
      webSearchScraperTimeout: { type: "number", description: "Web scraper timeout in milliseconds. Default: 30000", label: "Scraper Timeout (ms)", min: 1000, max: 120000, technical: { yamlPath: "webSearch.scraperTimeout", configFile: "librechat.yaml" } },
      webSearchMaxLinks: { type: "number", description: "Maximum number of links to scrape from search results", label: "Max Links", min: 1, max: 20, technical: { yamlPath: "webSearch.maxLinks", configFile: "librechat.yaml" } },
      
      // Additional Rate Limiting Fields (camelCase for field-registry compatibility)
      checkBalanceEnabled: { type: "boolean", description: "Enable balance checking for API usage monitoring", label: "Check Balance Enabled", technical: { yamlPath: "checkBalance.enabled", configFile: "librechat.yaml" } },
      checkBalanceFrequency: { type: "number", description: "How often to check balance in hours. Default: 24", label: "Check Balance Frequency (hours)", min: 1, max: 168, technical: { yamlPath: "checkBalance.frequency", configFile: "librechat.yaml" } },
      rateLimitsWarmup: { type: "boolean", description: "Enable warmup period for rate limiting (gradual increase)", label: "Rate Limit Warmup", technical: { yamlPath: "rateLimits.warmup", configFile: "librechat.yaml" } },
      rateLimitsWarmupLimit: { type: "number", description: "Starting rate limit during warmup period", label: "Warmup Limit", technical: { yamlPath: "rateLimits.warmupLimit", configFile: "librechat.yaml" } },
      rateLimitsWarmupPeriod: { type: "number", description: "Duration of warmup period in minutes", label: "Warmup Period (minutes)", technical: { yamlPath: "rateLimits.warmupPeriod", configFile: "librechat.yaml" } },
      rateLimitsWarmupSkipFirstPeriod: { type: "boolean", description: "Skip rate limiting for the first warmup period", label: "Skip First Period", technical: { yamlPath: "rateLimits.warmupSkipFirstPeriod", configFile: "librechat.yaml" } },
      
      // Additional Interface Fields (camelCase for field-registry compatibility)
      interfaceAgents: { type: "boolean", description: "Show agents in the interface", label: "Show Agents", technical: { yamlPath: "interface.agents", configFile: "librechat.yaml" } },
      interfaceParameters: { type: "boolean", description: "Show parameters panel in the interface", label: "Show Parameters", technical: { yamlPath: "interface.parameters", configFile: "librechat.yaml" } },
      interfaceEndpointsMenu: { type: "boolean", description: "Show endpoints menu in the interface", label: "Show Endpoints Menu", technical: { yamlPath: "interface.endpointsMenu", configFile: "librechat.yaml" } },
      interfaceWebSearch: { type: "boolean", description: "Show web search button in the interface", label: "Show Web Search", technical: { yamlPath: "interface.webSearch", configFile: "librechat.yaml" } },
      interfaceFileSearch: { type: "boolean", description: "Show file search in the interface", label: "Show File Search", technical: { yamlPath: "interface.fileSearch", configFile: "librechat.yaml" } },
      interfaceFileCitations: { type: "boolean", description: "Show file citations in the interface", label: "Show File Citations", technical: { yamlPath: "interface.fileCitations", configFile: "librechat.yaml" } },
      interfaceRunCode: { type: "boolean", description: "Show run code button in the interface", label: "Show Run Code", technical: { yamlPath: "interface.runCode", configFile: "librechat.yaml" } },
      interfaceArtifacts: { type: "boolean", description: "Show artifacts UI in the interface", label: "Show Artifacts", technical: { yamlPath: "interface.artifacts", configFile: "librechat.yaml" } },
      interfaceDefaultPreset: { type: "text", description: "Default preset ID to load on startup", label: "Default Preset ID", technical: { yamlPath: "interface.defaultPreset", configFile: "librechat.yaml" } },
      interfaceUploadAsText: { type: "boolean", description: "Show upload as text button in the interface", label: "Show Upload as Text", technical: { yamlPath: "interface.uploadAsText", configFile: "librechat.yaml" } },
      interfaceTemporaryChatRetention: { type: "number", description: "Temporary chat retention time in minutes", label: "Chat Retention (minutes)", min: 1, max: 43200, technical: { yamlPath: "interface.temporaryChatRetention", configFile: "librechat.yaml" } },
      interfaceMarketplaceUse: { type: "boolean", description: "Enable marketplace usage", label: "Enable Marketplace", technical: { yamlPath: "interface.marketplace.use", configFile: "librechat.yaml" } },
      interfaceMcpServersPlaceholder: { type: "text", description: "Placeholder text for MCP servers dropdown", label: "MCP Servers Placeholder", technical: { yamlPath: "interface.mcpServers.placeholder", configFile: "librechat.yaml" } },
      interfacePrivacyPolicyExternalUrl: { type: "text", description: "External privacy policy URL", label: "Privacy Policy URL", technical: { yamlPath: "interface.privacyPolicy.externalUrl", configFile: "librechat.yaml" } },
      interfacePrivacyPolicyOpenNewTab: { type: "boolean", description: "Open privacy policy in new tab", label: "Privacy Policy New Tab", technical: { yamlPath: "interface.privacyPolicy.openNewTab", configFile: "librechat.yaml" } },
      interfaceTermsOfServiceExternalUrl: { type: "text", description: "External terms of service URL", label: "Terms of Service URL", technical: { yamlPath: "interface.termsOfService.externalUrl", configFile: "librechat.yaml" } },
      interfaceTermsOfServiceOpenNewTab: { type: "boolean", description: "Open terms of service in new tab", label: "Terms New Tab", technical: { yamlPath: "interface.termsOfService.openNewTab", configFile: "librechat.yaml" } },
      interfaceTermsOfServiceModalAcceptance: { type: "boolean", description: "Require modal acceptance of terms", label: "Terms Modal Acceptance", technical: { yamlPath: "interface.termsOfService.modalAcceptance", configFile: "librechat.yaml" } },
      interfaceTermsOfServiceModalTitle: { type: "text", description: "Terms modal title text", label: "Terms Modal Title", technical: { yamlPath: "interface.termsOfService.modalTitle", configFile: "librechat.yaml" } },
      interfaceTermsOfServiceModalContent: { type: "textarea", description: "Terms modal content text", label: "Terms Modal Content", technical: { yamlPath: "interface.termsOfService.modalContent", configFile: "librechat.yaml" } },
      interfacePeoplePickerUsers: { type: "boolean", description: "Show users in people picker", label: "People Picker Users", technical: { yamlPath: "interface.peoplePicker.users", configFile: "librechat.yaml" } },
      interfacePeoplePickerGroups: { type: "boolean", description: "Show groups in people picker", label: "People Picker Groups", technical: { yamlPath: "interface.peoplePicker.groups", configFile: "librechat.yaml" } },
      interfacePeoplePickerRoles: { type: "boolean", description: "Show roles in people picker", label: "People Picker Roles", technical: { yamlPath: "interface.peoplePicker.roles", configFile: "librechat.yaml" } },
      
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
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv#application-domains",
        docSection: "App Settings",
        technical: { envVar: "CUSTOM_FOOTER", configFile: ".env" }
      },
      "interface.fileSearch": { type: "boolean", description: "Enable file search in interface", label: "File Search", technical: { yamlPath: "interface.fileSearch", configFile: "librechat.yaml" } },
      "interface.uploadAsText": { 
        type: "boolean", 
        description: "⚠️ UI VISIBILITY ONLY: Controls whether the 'Upload as Text' button appears in the interface. To fully disable Upload as Text, you MUST ALSO disable it in the Agents tab → Agent Capabilities → uncheck 'Context (Upload as Text)'. These are TWO SEPARATE settings that work together: this one hides the UI button, the other prevents agents from processing text uploads.", 
        label: "Upload as Text (UI Button)", 
        technical: { yamlPath: "interface.uploadAsText", configFile: "librechat.yaml" } 
      },
      "interface.privacyPolicy.externalUrl": { type: "text", description: "External privacy policy URL", label: "Privacy Policy URL", technical: { yamlPath: "interface.privacyPolicy.externalUrl", configFile: "librechat.yaml" } },
      "interface.privacyPolicy.openNewTab": { type: "boolean", description: "Open privacy policy in new tab", label: "Privacy Policy New Tab", technical: { yamlPath: "interface.privacyPolicy.openNewTab", configFile: "librechat.yaml" } },
      "interface.termsOfService.externalUrl": { type: "text", description: "External terms of service URL", label: "Terms of Service URL", technical: { yamlPath: "interface.termsOfService.externalUrl", configFile: "librechat.yaml" } },
      "interface.termsOfService.openNewTab": { type: "boolean", description: "Open terms in new tab", label: "Terms New Tab", technical: { yamlPath: "interface.termsOfService.openNewTab", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalAcceptance": { type: "boolean", description: "Require modal acceptance of terms", label: "Terms Modal Acceptance", technical: { yamlPath: "interface.termsOfService.modalAcceptance", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalTitle": { type: "text", description: "Terms modal title", label: "Terms Modal Title", technical: { yamlPath: "interface.termsOfService.modalTitle", configFile: "librechat.yaml" } },
      "interface.termsOfService.modalContent": { type: "textarea", description: "Terms modal content", label: "Terms Modal Content", technical: { yamlPath: "interface.termsOfService.modalContent", configFile: "librechat.yaml" } },
      "interface.mcpServers.placeholder": { 
        type: "text", 
        description: "Placeholder text displayed in the MCP (Model Context Protocol) server selection dropdown when no server is selected.", 
        label: "MCP Servers Placeholder", 
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface#mcpservers",
        docSection: "Interface Config",
        technical: { yamlPath: "interface.mcpServers.placeholder", configFile: "librechat.yaml" } 
      },
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
      "modelSpecs.enforce": {
        type: "boolean",
        description: "Force users to select from model specs list. When enabled, users MUST choose one of your configured presets - prevents them from seeing other endpoints. Critical for agent defaults: without this, LibreChat ignores your default agent and shows the last-used agent instead.",
        label: "Enforce Model Specs Selection",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/model_specs",
        docSection: "Model Specs",
        technical: { yamlPath: "modelSpecs.enforce", configFile: "librechat.yaml" }
      },
      "modelSpecs.prioritize": {
        type: "boolean",
        description: "Make model specs the primary UI element and auto-select your default on load. Required for agent defaults: without this, the UI drifts to recently used agents. Combine with 'enforce' to ensure your default agent is always selected for new users/sessions.",
        label: "Prioritize Model Specs in UI",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/model_specs",
        docSection: "Model Specs",
        technical: { yamlPath: "modelSpecs.prioritize", configFile: "librechat.yaml" }
      },
      "interface.parameters": { type: "boolean", description: "Show parameters panel", label: "Parameters Panel", technical: { yamlPath: "interface.parameters", configFile: "librechat.yaml" } },
      "interface.sidePanel": { type: "boolean", description: "Show side panel", label: "Side Panel", technical: { yamlPath: "interface.sidePanel", configFile: "librechat.yaml" } },
      "interface.presets": { type: "boolean", description: "Show presets", label: "Presets", technical: { yamlPath: "interface.presets", configFile: "librechat.yaml" } },
      "interface.prompts": { type: "boolean", description: "Show prompts", label: "Prompts", technical: { yamlPath: "interface.prompts", configFile: "librechat.yaml" } },
      "interface.bookmarks": { type: "boolean", description: "Show bookmarks", label: "Bookmarks", technical: { yamlPath: "interface.bookmarks", configFile: "librechat.yaml" } },
      "interface.multiConvo": { type: "boolean", description: "Enable multiple conversations", label: "Multi Conversation", technical: { yamlPath: "interface.multiConvo", configFile: "librechat.yaml" } },
      "interface.agents": { type: "boolean", description: "Show agents", label: "Agents", technical: { yamlPath: "interface.agents", configFile: "librechat.yaml" } },
      "interface.webSearch": { 
        type: "boolean", 
        description: "Enable the web search button in the chat interface. Allows users to perform web searches during conversations.", 
        label: "Web Search", 
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface#websearch",
        docSection: "Interface Config",
        technical: { yamlPath: "interface.webSearch", configFile: "librechat.yaml" } 
      },
      "interface.temporaryChatRetention": { 
        type: "number", 
        description: "Chat retention time in hours (minimum 1, maximum 8760). Default is 720 hours (30 days) if not specified.", 
        label: "Temporary Chat Retention (hours)", 
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface",
        docSection: "Interface Config",
        technical: { yamlPath: "interface.temporaryChatRetention", configFile: "librechat.yaml" } 
      },
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
      
      // Memory Configuration
      "memory.disabled": {
        type: "boolean",
        description: "Disable conversation memory functionality. When enabled (checked), memory features are turned OFF and conversations won't be remembered. Default: ON (memory disabled).",
        label: "Disable Memory System",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory",
        technical: { yamlPath: "memory.disabled", configFile: "librechat.yaml" }
      },
      "memory.personalize": {
        type: "boolean",
        description: "Allow users to opt in/out of memory features via chat interface toggle. When OFF, memory is completely disabled regardless of user preference. Default: OFF (no personalization).",
        label: "Enable User Personalization Toggle",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory",
        technical: { yamlPath: "memory.personalize", configFile: "librechat.yaml" }
      },
      "memory.validKeys": {
        type: "array",
        description: "Specify which keys are valid for memory storage (e.g., 'user_preferences', 'conversation_context', 'personal_info'). Controls what types of information can be stored. Leave empty for no restrictions.",
        label: "Valid Memory Keys",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory",
        technical: { yamlPath: "memory.validKeys", configFile: "librechat.yaml" }
      },
      "memory.tokenLimit": {
        type: "number",
        description: "Maximum tokens for memory storage and processing. Controls memory usage and costs. Leave empty for no limit.",
        label: "Token Limit",
        placeholder: "2000",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory",
        technical: { yamlPath: "memory.tokenLimit", configFile: "librechat.yaml" }
      },
      "memory.messageWindowSize": {
        type: "number",
        description: "Number of recent messages to include in memory context window. Default: 5 messages.",
        label: "Message Window Size",
        placeholder: "5",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory",
        technical: { yamlPath: "memory.messageWindowSize", configFile: "librechat.yaml" }
      },
      "memory.agent.id": {
        type: "text",
        description: "Reference to existing agent by ID for memory processing. Alternative to configuring a custom agent below.",
        label: "Agent ID (Reference)",
        placeholder: "memory-agent-001",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent",
        technical: { yamlPath: "memory.agent.id", configFile: "librechat.yaml" }
      },
      "memory.agent.provider": {
        type: "text",
        description: "AI provider for memory agent (e.g., 'openAI', 'anthropic', 'google'). Required for custom agent configuration.",
        label: "Agent Provider",
        placeholder: "openAI",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent",
        technical: { yamlPath: "memory.agent.provider", configFile: "librechat.yaml" }
      },
      "memory.agent.model": {
        type: "text",
        description: "Model to use for memory processing (e.g., 'gpt-4', 'claude-3-sonnet'). Required for custom agent configuration.",
        label: "Agent Model",
        placeholder: "gpt-4",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent",
        technical: { yamlPath: "memory.agent.model", configFile: "librechat.yaml" }
      },
      "memory.agent.instructions": {
        type: "textarea",
        description: "Custom instructions for memory handling. Replaces default instructions. Should specify when to set/delete memory, especially with validKeys.",
        label: "Agent Instructions",
        placeholder: "Store memory using only the specified validKeys...",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent",
        technical: { yamlPath: "memory.agent.instructions", configFile: "librechat.yaml" }
      },
      "memory.agent.model_parameters.temperature": {
        type: "number",
        description: "Temperature for memory agent (0-2). Lower = more focused. Recommended: 0.2-0.3 for consistent memory handling.",
        label: "Temperature",
        placeholder: "0.2",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent Parameters",
        technical: { yamlPath: "memory.agent.model_parameters.temperature", configFile: "librechat.yaml" }
      },
      "memory.agent.model_parameters.max_tokens": {
        type: "number",
        description: "Maximum tokens for agent responses. Controls memory update verbosity.",
        label: "Max Tokens",
        placeholder: "1500",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent Parameters",
        technical: { yamlPath: "memory.agent.model_parameters.max_tokens", configFile: "librechat.yaml" }
      },
      "memory.agent.model_parameters.top_p": {
        type: "number",
        description: "Top P for nucleus sampling (0-1). Controls randomness in memory decisions.",
        label: "Top P",
        placeholder: "0.8",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent Parameters",
        technical: { yamlPath: "memory.agent.model_parameters.top_p", configFile: "librechat.yaml" }
      },
      "memory.agent.model_parameters.frequency_penalty": {
        type: "number",
        description: "Frequency penalty (-2 to 2). Reduces repetition in memory updates.",
        label: "Frequency Penalty",
        placeholder: "0.1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory",
        docSection: "Memory Agent Parameters",
        technical: { yamlPath: "memory.agent.model_parameters.frequency_penalty", configFile: "librechat.yaml" }
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
      
      // =============================================================================
      // Endpoint Configuration Fields (camelCase versions)
      // =============================================================================
      
      // Agents Endpoint Configuration
      endpointsAgentsDisableBuilder: { 
        type: "boolean", 
        description: "Disable the built-in agent builder interface. When enabled, users cannot create or modify agents - useful for enterprise deployments with pre-configured agents.", 
        label: "Disable Agent Builder",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.disableBuilder", configFile: "librechat.yaml" }
      },
      endpointsAgentsRecursionLimit: { 
        type: "number", 
        description: "Default number of steps an agent can take in a single run. Higher values allow more complex multi-step reasoning but increase costs. Range: 1-100, Default: 50", 
        label: "Recursion Limit",
        placeholder: "50",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.recursionLimit", configFile: "librechat.yaml" }
      },
      endpointsAgentsMaxRecursionLimit: { 
        type: "number", 
        description: "Maximum number of steps users can configure for agent runs. Sets the ceiling for the agent steps slider. Range: 1-200, Default: 100", 
        label: "Max Recursion Limit",
        placeholder: "100",
        min: 1,
        max: 200,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.maxRecursionLimit", configFile: "librechat.yaml" }
      },
      endpointsAgentsCapabilities: { 
        type: "array", 
        description: "Array of capabilities available to agents. Enable features like code execution, file search, web search, etc.", 
        label: "Agent Capabilities",
        options: [
          { value: "execute_code", label: "Execute Code" },
          { value: "file_search", label: "File Search" },
          { value: "actions", label: "Actions" },
          { value: "tools", label: "Tools" },
          { value: "artifacts", label: "Artifacts (Generative UI)" },
          { value: "context", label: "Context (Upload as Text)" },
          { value: "ocr", label: "OCR" },
          { value: "chain", label: "Agent Chaining" },
          { value: "web_search", label: "Web Search" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/agents",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.capabilities", configFile: "librechat.yaml" }
      },
      endpointsAgentsMaxCitations: { 
        type: "number", 
        description: "Maximum total citations an agent can use across all sources. Range: 1-100, Default: 30", 
        label: "Max Citations",
        placeholder: "30",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.maxCitations", configFile: "librechat.yaml" }
      },
      endpointsAgentsMaxCitationsPerFile: { 
        type: "number", 
        description: "Maximum citations from any single source to prevent over-reliance. Range: 1-20, Default: 7", 
        label: "Max Citations Per File",
        placeholder: "7",
        min: 1,
        max: 20,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.maxCitationsPerFile", configFile: "librechat.yaml" }
      },
      endpointsAgentsMinRelevanceScore: { 
        type: "number", 
        description: "Minimum relevance threshold for search results. Range: 0.0-1.0, Default: 0.45", 
        label: "Min Relevance Score",
        placeholder: "0.45",
        min: 0,
        max: 1,
        step: 0.01,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Agents Endpoint",
        technical: { yamlPath: "endpoints.agents.minRelevanceScore", configFile: "librechat.yaml" }
      },
      
      // OpenAI Endpoint Configuration
      endpointsOpenAITitle: { 
        type: "text", 
        description: "Custom display title for OpenAI endpoint in the UI. Default: 'OpenAI'", 
        label: "OpenAI Title",
        placeholder: "OpenAI",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.title", configFile: "librechat.yaml" }
      },
      endpointsOpenAITitleConvo: { 
        type: "boolean", 
        description: "Enable automatic conversation title generation using OpenAI. Default: true", 
        label: "Title Conversations",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.titleConvo", configFile: "librechat.yaml" }
      },
      endpointsOpenAITitleModel: { 
        type: "text", 
        description: "Model to use for generating conversation titles. Default: 'gpt-3.5-turbo'", 
        label: "Title Model",
        placeholder: "gpt-3.5-turbo",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.titleModel", configFile: "librechat.yaml" }
      },
      endpointsOpenAIApiKey: { 
        type: "password", 
        description: "OpenAI API key reference for this endpoint configuration (uses environment variable)", 
        label: "API Key (Reference)",
        placeholder: "${OPENAI_API_KEY}",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.apiKey", configFile: "librechat.yaml" }
      },
      endpointsOpenAIBaseURL: { 
        type: "text", 
        description: "Custom base URL for OpenAI-compatible endpoints (e.g., for proxies or alternative providers)", 
        label: "Base URL",
        placeholder: "https://api.openai.com/v1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.baseURL", configFile: "librechat.yaml" }
      },
      endpointsOpenAIModels: { 
        type: "object", 
        description: "OpenAI models configuration object. Contains fetch, default, and other model settings.", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.models", configFile: "librechat.yaml" }
      },
      endpointsOpenAIModelsFetch: { 
        type: "boolean", 
        description: "Automatically fetch available models from OpenAI API. Default: true", 
        label: "Fetch Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.models.fetch", configFile: "librechat.yaml" }
      },
      endpointsOpenAIModelsDefault: { 
        type: "array", 
        description: "Array of default OpenAI models to display if fetch is disabled or fails", 
        label: "Default Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.models.default", configFile: "librechat.yaml" }
      },
      endpointsOpenAIDropParams: { 
        type: "array", 
        description: "Array of parameters to exclude when making requests to OpenAI", 
        label: "Drop Parameters",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "OpenAI Endpoint",
        technical: { yamlPath: "endpoints.openAI.dropParams", configFile: "librechat.yaml" }
      },
      
      // Anthropic Endpoint Configuration
      endpointsAnthropicTitle: { 
        type: "text", 
        description: "Custom display title for Anthropic endpoint in the UI. Default: 'Anthropic'", 
        label: "Anthropic Title",
        placeholder: "Anthropic",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.title", configFile: "librechat.yaml" }
      },
      endpointsAnthropicApiKey: { 
        type: "password", 
        description: "Anthropic API key reference for this endpoint configuration", 
        label: "API Key (Reference)",
        placeholder: "${ANTHROPIC_API_KEY}",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.apiKey", configFile: "librechat.yaml" }
      },
      endpointsAnthropicModelsFetch: { 
        type: "boolean", 
        description: "Automatically fetch available models from Anthropic API. Default: true", 
        label: "Fetch Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.models.fetch", configFile: "librechat.yaml" }
      },
      endpointsAnthropicModelsDefault: { 
        type: "array", 
        description: "Array of default Anthropic models to display", 
        label: "Default Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.models.default", configFile: "librechat.yaml" }
      },
      endpointsAnthropicTitleConvo: { 
        type: "boolean", 
        description: "Enable automatic conversation title generation using Anthropic. Default: true", 
        label: "Title Conversations",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.titleConvo", configFile: "librechat.yaml" }
      },
      endpointsAnthropicBaseURL: { 
        type: "text", 
        description: "Custom base URL for Anthropic-compatible endpoints", 
        label: "Base URL",
        placeholder: "https://api.anthropic.com",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.baseURL", configFile: "librechat.yaml" }
      },
      endpointsAnthropicModels: { 
        type: "object", 
        description: "Anthropic models configuration object", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Anthropic Endpoint",
        technical: { yamlPath: "endpoints.anthropic.models", configFile: "librechat.yaml" }
      },
      
      // Google Endpoint Configuration
      endpointsGoogleTitle: { 
        type: "text", 
        description: "Custom display title for Google endpoint in the UI. Default: 'Google'", 
        label: "Google Title",
        placeholder: "Google",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.title", configFile: "librechat.yaml" }
      },
      endpointsGoogleApiKey: { 
        type: "password", 
        description: "Google AI API key reference for this endpoint configuration", 
        label: "API Key (Reference)",
        placeholder: "${GOOGLE_API_KEY}",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.apiKey", configFile: "librechat.yaml" }
      },
      endpointsGoogleModelsFetch: { 
        type: "boolean", 
        description: "Automatically fetch available models from Google AI API. Default: true", 
        label: "Fetch Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.models.fetch", configFile: "librechat.yaml" }
      },
      endpointsGoogleModelsDefault: { 
        type: "array", 
        description: "Array of default Google models to display", 
        label: "Default Models",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.models.default", configFile: "librechat.yaml" }
      },
      endpointsGoogleBaseURL: { 
        type: "text", 
        description: "Custom base URL for Google AI endpoints", 
        label: "Base URL",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.baseURL", configFile: "librechat.yaml" }
      },
      endpointsGoogleModels: { 
        type: "object", 
        description: "Google models configuration object", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Google Endpoint",
        technical: { yamlPath: "endpoints.google.models", configFile: "librechat.yaml" }
      },
      
      // Mistral Endpoint Configuration
      endpointsMistralTitle: { 
        type: "text", 
        description: "Custom display title for Mistral endpoint in the UI. Default: 'Mistral'", 
        label: "Mistral Title",
        placeholder: "Mistral",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Mistral Endpoint",
        technical: { yamlPath: "endpoints.mistral.title", configFile: "librechat.yaml" }
      },
      endpointsMistralApiKey: { 
        type: "password", 
        description: "Mistral AI API key reference for this endpoint configuration", 
        label: "API Key (Reference)",
        placeholder: "${MISTRAL_API_KEY}",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Mistral Endpoint",
        technical: { yamlPath: "endpoints.mistral.apiKey", configFile: "librechat.yaml" }
      },
      endpointsMistralBaseURL: { 
        type: "text", 
        description: "Custom base URL for Mistral endpoints", 
        label: "Base URL",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Mistral Endpoint",
        technical: { yamlPath: "endpoints.mistral.baseURL", configFile: "librechat.yaml" }
      },
      endpointsMistralModels: { 
        type: "object", 
        description: "Mistral models configuration object", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "Mistral Endpoint",
        technical: { yamlPath: "endpoints.mistral.models", configFile: "librechat.yaml" }
      },
      
      // Azure OpenAI Endpoint Configuration
      endpointsAzureOpenAITitle: { 
        type: "text", 
        description: "Custom display title for Azure OpenAI endpoint in the UI. Default: 'Azure OpenAI'", 
        label: "Azure OpenAI Title",
        placeholder: "Azure OpenAI",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.title", configFile: "librechat.yaml" }
      },
      endpointsAzureOpenAIApiKey: { 
        type: "password", 
        description: "Azure OpenAI API key reference for this endpoint configuration", 
        label: "API Key (Reference)",
        placeholder: "${AZURE_API_KEY}",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.apiKey", configFile: "librechat.yaml" }
      },
      endpointsAzureOpenAIInstanceName: { 
        type: "text", 
        description: "Azure OpenAI instance/resource name", 
        label: "Instance Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.instanceName", configFile: "librechat.yaml" }
      },
      endpointsAzureOpenAIVersion: { 
        type: "text", 
        description: "Azure OpenAI API version (e.g., '2024-02-15-preview')", 
        label: "API Version",
        placeholder: "2024-02-15-preview",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.version", configFile: "librechat.yaml" }
      },
      endpointsAzureOpenAIBaseURL: { 
        type: "text", 
        description: "Custom base URL for Azure OpenAI endpoint", 
        label: "Base URL",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.baseURL", configFile: "librechat.yaml" }
      },
      endpointsAzureOpenAIModels: { 
        type: "object", 
        description: "Azure OpenAI models configuration object with deployment mappings", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure OpenAI Endpoint",
        technical: { yamlPath: "endpoints.azureOpenAI.models", configFile: "librechat.yaml" }
      },
      
      // GPT Plugins Endpoint Configuration  
      endpointsGptPluginsTitle: { 
        type: "text", 
        description: "Custom display title for GPT Plugins endpoint. Note: GPT Plugins are deprecated in favor of Agents.", 
        label: "GPT Plugins Title",
        placeholder: "Plugins",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "GPT Plugins Endpoint (Deprecated)",
        technical: { yamlPath: "endpoints.gptPlugins.title", configFile: "librechat.yaml" }
      },
      endpointsGptPluginsModels: { 
        type: "object", 
        description: "GPT Plugins models configuration. Note: This endpoint is deprecated.", 
        label: "Models Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/endpoints",
        docSection: "GPT Plugins Endpoint (Deprecated)",
        technical: { yamlPath: "endpoints.gptPlugins.models", configFile: "librechat.yaml" }
      },
      
      // Custom Endpoints Configuration
      customEndpoints: { 
        type: "custom-endpoints", 
        description: "Configure custom OpenAI-compatible endpoints. Allows you to add any OpenAI API-compatible service (like LM Studio, Ollama, or custom proxies) as a provider in LibreChat.", 
        label: "Custom Endpoints",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/custom_endpoint",
        docSection: "Custom Endpoints",
        technical: { yamlPath: "endpoints.custom", configFile: "librechat.yaml" }
      },

      // =============================================================================
      // MongoDB Advanced Configuration
      // =============================================================================
      mongoConnectTimeoutMS: {
        type: "number",
        description: "The amount of time in milliseconds to wait before timing out the initial connection to MongoDB. Default: 30000ms (30 seconds).",
        label: "Connect Timeout (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_CONNECT_TIMEOUT_MS", configFile: ".env" }
      },
      mongoSocketTimeoutMS: {
        type: "number",
        description: "The number of milliseconds to wait before timing out a socket when no data is received. 0 disables timeout. Default: 0.",
        label: "Socket Timeout (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_SOCKET_TIMEOUT_MS", configFile: ".env" }
      },
      mongoMaxPoolSize: {
        type: "number",
        description: "The maximum number of connections in the connection pool. Adjust based on your application's concurrent operations.",
        label: "Max Pool Size",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_MAX_POOL_SIZE", configFile: ".env" }
      },
      mongoMinPoolSize: {
        type: "number",
        description: "The minimum number of connections in the connection pool. Ensures a base level of available connections.",
        label: "Min Pool Size",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_MIN_POOL_SIZE", configFile: ".env" }
      },
      mongoMaxIdleTimeMS: {
        type: "number",
        description: "The maximum number of milliseconds that a connection can remain idle in the pool before being removed and closed. 0 disables idle timeout.",
        label: "Max Idle Time (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_MAX_IDLE_TIME_MS", configFile: ".env" }
      },
      mongoWaitQueueTimeoutMS: {
        type: "number",
        description: "The maximum time in milliseconds that a thread can wait for a connection to become available from the pool.",
        label: "Wait Queue Timeout (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_WAIT_QUEUE_TIMEOUT_MS", configFile: ".env" }
      },
      mongoServerSelectionTimeoutMS: {
        type: "number",
        description: "The amount of time in milliseconds to wait for server selection to succeed before timing out. Default: 30000ms (30 seconds).",
        label: "Server Selection Timeout (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_SERVER_SELECTION_TIMEOUT_MS", configFile: ".env" }
      },
      mongoHeartbeatFrequencyMS: {
        type: "number",
        description: "The interval in milliseconds for monitoring heartbeats to MongoDB servers. Controls how often to check server health. Default: 10000ms (10 seconds).",
        label: "Heartbeat Frequency (ms)",
        docUrl: "https://www.librechat.ai/docs/configuration/mongodb",
        docSection: "MongoDB Advanced",
        technical: { envVar: "MONGO_HEARTBEAT_FREQUENCY_MS", configFile: ".env" }
      },

      // =============================================================================
      // Azure AI Search Configuration
      // =============================================================================
      azureAiSearchApiKey: {
        type: "password",
        description: "Azure AI Search API key for authenticating requests to your Azure Cognitive Search service.",
        label: "Azure AI Search API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_API_KEY", configFile: ".env" }
      },
      azureAiSearchServiceEndpoint: {
        type: "text",
        description: "The service endpoint URL for your Azure AI Search instance (e.g., https://your-service.search.windows.net).",
        label: "Service Endpoint",
        placeholder: "https://your-service.search.windows.net",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_SERVICE_ENDPOINT", configFile: ".env" }
      },
      azureAiSearchIndexName: {
        type: "text",
        description: "The name of the search index to query in your Azure AI Search service.",
        label: "Index Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_INDEX_NAME", configFile: ".env" }
      },
      azureAiSearchEmbeddingDeploymentName: {
        type: "text",
        description: "The deployment name for the embedding model used with Azure AI Search vector search.",
        label: "Embedding Deployment Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_EMBEDDING_DEPLOYMENT_NAME", configFile: ".env" }
      },
      azureAiSearchSemanticConfiguration: {
        type: "text",
        description: "The semantic configuration name for semantic search capabilities in Azure AI Search.",
        label: "Semantic Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_SEMANTIC_CONFIGURATION", configFile: ".env" }
      },
      azureAiSearchQueryType: {
        type: "select",
        description: "The query type for Azure AI Search. Options: 'semantic' (AI-powered), 'vector' (embedding-based), or 'hybrid' (combines both).",
        label: "Query Type",
        options: ["semantic", "vector", "hybrid"],
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_QUERY_TYPE", configFile: ".env" }
      },
      azureAiSearchVectorFieldName: {
        type: "text",
        description: "The field name in the index that contains vector embeddings for vector search.",
        label: "Vector Field Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_VECTOR_FIELD_NAME", configFile: ".env" }
      },
      azureAiSearchContentFieldName: {
        type: "text",
        description: "The field name in the index that contains the main content/text to be searched.",
        label: "Content Field Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_CONTENT_FIELD_NAME", configFile: ".env" }
      },
      azureAiSearchTitleFieldName: {
        type: "text",
        description: "The field name in the index that contains document titles or headers.",
        label: "Title Field Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_TITLE_FIELD_NAME", configFile: ".env" }
      },
      azureAiSearchUrlFieldName: {
        type: "text",
        description: "The field name in the index that contains URLs or document references.",
        label: "URL Field Name",
        docUrl: "https://www.librechat.ai/docs/configuration/azure",
        docSection: "Azure AI Search",
        technical: { envVar: "AZURE_AI_SEARCH_URL_FIELD_NAME", configFile: ".env" }
      },

      // =============================================================================
      // File Storage Advanced Configuration
      // =============================================================================
      awsAccessKeyIdFileStorage: {
        type: "password",
        description: "AWS Access Key ID specifically for file storage operations (alternative to general AWS_ACCESS_KEY_ID).",
        label: "AWS Access Key ID (File Storage)",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Storage",
        technical: { envVar: "AWS_ACCESS_KEY_ID_FILE_STORAGE", configFile: ".env" }
      },
      awsSecretAccessKeyFileStorage: {
        type: "password",
        description: "AWS Secret Access Key specifically for file storage operations (alternative to general AWS_SECRET_ACCESS_KEY).",
        label: "AWS Secret Key (File Storage)",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Storage",
        technical: { envVar: "AWS_SECRET_ACCESS_KEY_FILE_STORAGE", configFile: ".env" }
      },
      awsRegionFileStorage: {
        type: "text",
        description: "AWS Region specifically for file storage operations (e.g., us-east-1). Alternative to general AWS_REGION.",
        label: "AWS Region (File Storage)",
        placeholder: "us-east-1",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Storage",
        technical: { envVar: "AWS_REGION_FILE_STORAGE", configFile: ".env" }
      },
      firebaseServiceAccountKey: {
        type: "textarea",
        description: "Firebase service account key JSON for Firebase Storage authentication. Paste the entire JSON content from your Firebase service account key file.",
        label: "Firebase Service Account Key (JSON)",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Storage",
        technical: { envVar: "FIREBASE_SERVICE_ACCOUNT_KEY", configFile: ".env" }
      },

      // =============================================================================
      // Email Advanced Configuration
      // =============================================================================
      mailgunApiKey: {
        type: "password",
        description: "Mailgun API key for sending emails via Mailgun service.",
        label: "Mailgun API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - Mailgun",
        technical: { envVar: "MAILGUN_API_KEY", configFile: ".env" }
      },
      mailgunDomain: {
        type: "text",
        description: "Your verified Mailgun domain for sending emails (e.g., mail.example.com).",
        label: "Mailgun Domain",
        placeholder: "mail.example.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - Mailgun",
        technical: { envVar: "MAILGUN_DOMAIN", configFile: ".env" }
      },
      mailgunHost: {
        type: "text",
        description: "Mailgun API host URL. Use 'api.mailgun.net' for US region or 'api.eu.mailgun.net' for EU region.",
        label: "Mailgun Host",
        placeholder: "api.mailgun.net",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - Mailgun",
        technical: { envVar: "MAILGUN_HOST", configFile: ".env" }
      },
      mailgunWebhookSigningKey: {
        type: "password",
        description: "Mailgun webhook signing key for verifying webhook authenticity and securing webhook endpoints.",
        label: "Mailgun Webhook Signing Key",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - Mailgun",
        technical: { envVar: "MAILGUN_WEBHOOK_SIGNING_KEY", configFile: ".env" }
      },
      emailReplyToAddress: {
        type: "text",
        description: "Reply-to email address for outgoing emails. Users' replies will be directed to this address.",
        label: "Reply-To Address",
        placeholder: "support@example.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email Advanced",
        technical: { envVar: "EMAIL_REPLY_TO_ADDRESS", configFile: ".env" }
      },

      // =============================================================================
      // Debug Configuration
      // =============================================================================
      debugOpenai: {
        type: "boolean",
        description: "Enable debug mode for OpenAI endpoint to log detailed request/response information. Useful for troubleshooting API issues.",
        label: "Debug OpenAI",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Debug",
        technical: { envVar: "DEBUG_OPENAI", configFile: ".env" }
      },
      debugPlugins: {
        type: "boolean",
        description: "Enable debug mode for plugins to log detailed plugin execution information. Set to false to disable plugin debugging.",
        label: "Debug Plugins",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Debug",
        technical: { envVar: "DEBUG_PLUGINS", configFile: ".env" }
      },

      // =============================================================================
      // External API Integrations
      // =============================================================================
      fluxApiKey: {
        type: "password",
        description: "Flux API key for image generation services using the Flux AI model.",
        label: "Flux API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Image Generation",
        technical: { envVar: "FLUX_API_KEY", configFile: ".env" }
      },
      tavilyApiKey: {
        type: "password",
        description: "Tavily API key for enhanced web search capabilities and content extraction.",
        label: "Tavily API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Search",
        technical: { envVar: "TAVILY_API_KEY", configFile: ".env" }
      },
      wolframAppId: {
        type: "password",
        description: "Wolfram Alpha App ID for computational knowledge and mathematical problem-solving capabilities.",
        label: "Wolfram Alpha App ID",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Knowledge",
        technical: { envVar: "WOLFRAM_APP_ID", configFile: ".env" }
      },
      youtubeApiKey: {
        type: "password",
        description: "YouTube Data API key for accessing YouTube content, video information, and metadata.",
        label: "YouTube API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Media",
        technical: { envVar: "YOUTUBE_API_KEY", configFile: ".env" }
      },
      zapierNlaApiKey: {
        type: "password",
        description: "Zapier NLA (Natural Language Actions) API key for integrating with Zapier automation workflows.",
        label: "Zapier NLA API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Automation",
        technical: { envVar: "ZAPIER_NLA_API_KEY", configFile: ".env" }
      },
      sdWebuiUrl: {
        type: "text",
        description: "Stable Diffusion WebUI base URL for image generation (e.g., http://localhost:7860).",
        label: "SD WebUI URL",
        placeholder: "http://localhost:7860",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "External APIs - Image Generation",
        technical: { envVar: "SD_WEBUI_URL", configFile: ".env" }
      },
      sdWebuiImageGenUrl: {
        type: "text",
        description: "Stable Diffusion WebUI specific endpoint URL for text-to-image generation.",
        label: "SD WebUI Image Gen URL",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "External APIs - Image Generation",
        technical: { envVar: "SD_WEBUI_IMAGE_GEN_URL", configFile: ".env" }
      },
      sdWebuiImageEditUrl: {
        type: "text",
        description: "Stable Diffusion WebUI specific endpoint URL for image-to-image editing and modification.",
        label: "SD WebUI Image Edit URL",
        docUrl: "https://www.librechat.ai/docs/features/image_gen",
        docSection: "External APIs - Image Generation",
        technical: { envVar: "SD_WEBUI_IMAGE_EDIT_URL", configFile: ".env" }
      },
      travelApiKey: {
        type: "password",
        description: "Travel API key for accessing travel-related data and services.",
        label: "Travel API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Travel",
        technical: { envVar: "TRAVEL_API_KEY", configFile: ".env" }
      },
      pollinations: {
        type: "text",
        description: "Pollinations AI service configuration for image and content generation.",
        label: "Pollinations Configuration",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - AI Services",
        technical: { envVar: "POLLINATIONS", configFile: ".env" }
      },
      traversaalApiKey: {
        type: "password",
        description: "Traversaal API key for advanced web search and data extraction capabilities.",
        label: "Traversaal API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/pre_configured_ai",
        docSection: "External APIs - Search",
        technical: { envVar: "TRAVERSAAL_API_KEY", configFile: ".env" }
      },

      // =============================================================================
      // OpenAI Moderation
      // =============================================================================
      openaiModeration: {
        type: "boolean",
        description: "Enable OpenAI content moderation to automatically check user messages for harmful content before processing.",
        label: "Enable OpenAI Moderation",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "AI Providers - Moderation",
        technical: { envVar: "OPENAI_MODERATION", configFile: ".env" }
      },
      openaiModerationApiKey: {
        type: "password",
        description: "Dedicated API key for OpenAI Moderation service. If not set, falls back to OPENAI_API_KEY.",
        label: "OpenAI Moderation API Key",
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "AI Providers - Moderation",
        technical: { envVar: "OPENAI_MODERATION_API_KEY", configFile: ".env" }
      },

      // =============================================================================
      // OAuth Providers - Individual Fields
      // =============================================================================
      discordClientId: {
        type: "text",
        description: "Discord OAuth application client ID from Discord Developer Portal.",
        label: "Discord Client ID",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Discord",
        technical: { envVar: "DISCORD_CLIENT_ID", configFile: ".env" }
      },
      discordClientSecret: {
        type: "password",
        description: "Discord OAuth application client secret from Discord Developer Portal.",
        label: "Discord Client Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Discord",
        technical: { envVar: "DISCORD_CLIENT_SECRET", configFile: ".env" }
      },
      discordCallbackUrl: {
        type: "text",
        description: "Discord OAuth callback URL (e.g., https://your-domain.com/oauth/discord/callback). Must match exactly in Discord app settings.",
        label: "Discord Callback URL",
        placeholder: "https://your-domain.com/oauth/discord/callback",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Discord",
        technical: { envVar: "DISCORD_CALLBACK_URL", configFile: ".env" }
      },
      facebookClientId: {
        type: "text",
        description: "Facebook OAuth app ID from Facebook for Developers.",
        label: "Facebook Client ID",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Facebook",
        technical: { envVar: "FACEBOOK_CLIENT_ID", configFile: ".env" }
      },
      facebookClientSecret: {
        type: "password",
        description: "Facebook OAuth app secret from Facebook for Developers.",
        label: "Facebook Client Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Facebook",
        technical: { envVar: "FACEBOOK_CLIENT_SECRET", configFile: ".env" }
      },
      facebookCallbackUrl: {
        type: "text",
        description: "Facebook OAuth callback URL (e.g., https://your-domain.com/oauth/facebook/callback). Must be configured in Facebook app.",
        label: "Facebook Callback URL",
        placeholder: "https://your-domain.com/oauth/facebook/callback",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Facebook",
        technical: { envVar: "FACEBOOK_CALLBACK_URL", configFile: ".env" }
      },
      githubClientId: {
        type: "text",
        description: "GitHub OAuth app client ID from GitHub Developer Settings.",
        label: "GitHub Client ID",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - GitHub",
        technical: { envVar: "GITHUB_CLIENT_ID", configFile: ".env" }
      },
      githubClientSecret: {
        type: "password",
        description: "GitHub OAuth app client secret from GitHub Developer Settings.",
        label: "GitHub Client Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - GitHub",
        technical: { envVar: "GITHUB_CLIENT_SECRET", configFile: ".env" }
      },
      githubCallbackUrl: {
        type: "text",
        description: "GitHub OAuth callback URL (e.g., https://your-domain.com/oauth/github/callback). Must match GitHub app configuration.",
        label: "GitHub Callback URL",
        placeholder: "https://your-domain.com/oauth/github/callback",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - GitHub",
        technical: { envVar: "GITHUB_CALLBACK_URL", configFile: ".env" }
      },
      googleClientId: {
        type: "text",
        description: "Google OAuth 2.0 client ID from Google Cloud Console.",
        label: "Google Client ID",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Google",
        technical: { envVar: "GOOGLE_CLIENT_ID", configFile: ".env" }
      },
      googleClientSecret: {
        type: "password",
        description: "Google OAuth 2.0 client secret from Google Cloud Console.",
        label: "Google Client Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Google",
        technical: { envVar: "GOOGLE_CLIENT_SECRET", configFile: ".env" }
      },
      googleCallbackUrl: {
        type: "text",
        description: "Google OAuth callback URL (e.g., https://your-domain.com/oauth/google/callback). Must be added to Google Cloud Console authorized redirect URIs.",
        label: "Google Callback URL",
        placeholder: "https://your-domain.com/oauth/google/callback",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OAuth - Google",
        technical: { envVar: "GOOGLE_CALLBACK_URL", configFile: ".env" }
      },

      // =============================================================================
      // OpenID Connect Additional Fields
      // =============================================================================
      openidUrl: {
        type: "text",
        description: "OpenID Connect provider URL (base URL of your identity provider).",
        label: "OpenID Provider URL",
        placeholder: "https://accounts.example.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect",
        technical: { envVar: "OPENID_URL", configFile: ".env" }
      },
      openidSessionSecret: {
        type: "password",
        description: "OpenID Connect session secret for encrypting session data. Generate a strong random string.",
        label: "OpenID Session Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect",
        technical: { envVar: "OPENID_SESSION_SECRET", configFile: ".env" }
      },
      openidAudience: {
        type: "text",
        description: "OpenID Connect audience claim - identifies the recipients the token is intended for.",
        label: "OpenID Audience",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Advanced",
        technical: { envVar: "OPENID_AUDIENCE", configFile: ".env" }
      },
      openidAutoRedirect: {
        type: "boolean",
        description: "Automatically redirect to OpenID provider login page instead of showing login form.",
        label: "OpenID Auto Redirect",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Advanced",
        technical: { envVar: "OPENID_AUTO_REDIRECT", configFile: ".env" }
      },
      openidGraphScopes: {
        type: "text",
        description: "Additional Microsoft Graph API scopes for Azure AD (e.g., 'User.Read Mail.Read').",
        label: "OpenID Graph Scopes",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Azure AD",
        technical: { envVar: "OPENID_GRAPH_SCOPES", configFile: ".env" }
      },
      openidJwksUrlCacheEnabled: {
        type: "boolean",
        description: "Enable caching of JWKS (JSON Web Key Set) URL responses for better performance.",
        label: "JWKS URL Cache Enabled",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Performance",
        technical: { envVar: "OPENID_JWKS_URL_CACHE_ENABLED", configFile: ".env" }
      },
      openidJwksUrlCacheTime: {
        type: "number",
        description: "JWKS URL cache time in seconds (default: 600). How long to cache the JWKS before refreshing.",
        label: "JWKS URL Cache Time (seconds)",
        placeholder: "600",
        min: 60,
        max: 86400,
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Performance",
        technical: { envVar: "OPENID_JWKS_URL_CACHE_TIME", configFile: ".env" }
      },
      openidNameClaim: {
        type: "text",
        description: "JWT claim field containing the user's display name (e.g., 'name', 'displayName').",
        label: "Name Claim",
        placeholder: "name",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Claims",
        technical: { envVar: "OPENID_NAME_CLAIM", configFile: ".env" }
      },
      openidOnBehalfFlowForUserinfoRequired: {
        type: "boolean",
        description: "Use On-Behalf-Of flow when fetching user info (required for some Azure AD configurations).",
        label: "On-Behalf Flow Required",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Azure AD",
        technical: { envVar: "OPENID_ON_BEHALF_FLOW_FOR_USERINFO_REQUIRED", configFile: ".env" }
      },
      openidOnBehalfFlowUserinfoScope: {
        type: "text",
        description: "Scope to request when using On-Behalf-Of flow for user info (e.g., 'api://your-api-id/.default').",
        label: "On-Behalf Flow Scope",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Azure AD",
        technical: { envVar: "OPENID_ON_BEHALF_FLOW_USERINFO_SCOPE", configFile: ".env" }
      },
      openidRequiredRole: {
        type: "text",
        description: "Required role name users must have to access the application (enforces role-based access control).",
        label: "Required Role",
        placeholder: "LibreChat-User",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Authorization",
        technical: { envVar: "OPENID_REQUIRED_ROLE", configFile: ".env" }
      },
      openidRequiredRoleParameterPath: {
        type: "text",
        description: "JSON path in the token to find user roles (e.g., 'realm_access.roles' for Keycloak, 'roles' for Azure AD).",
        label: "Required Role Parameter Path",
        placeholder: "realm_access.roles",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Authorization",
        technical: { envVar: "OPENID_REQUIRED_ROLE_PARAMETER_PATH", configFile: ".env" }
      },
      openidRequiredRoleTokenKind: {
        type: "select",
        description: "Which token to check for roles: 'access' token or 'id' token.",
        label: "Required Role Token Kind",
        options: [
          { value: "access", label: "Access Token" },
          { value: "id", label: "ID Token" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Authorization",
        technical: { envVar: "OPENID_REQUIRED_ROLE_TOKEN_KIND", configFile: ".env" }
      },
      openidReuseTokens: {
        type: "boolean",
        description: "Reuse existing tokens instead of requesting new ones on each request (improves performance).",
        label: "Reuse Tokens",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Performance",
        technical: { envVar: "OPENID_REUSE_TOKENS", configFile: ".env" }
      },
      openidUsernameClaim: {
        type: "text",
        description: "JWT claim field containing the username (e.g., 'preferred_username', 'email', 'sub').",
        label: "Username Claim",
        placeholder: "preferred_username",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Claims",
        technical: { envVar: "OPENID_USERNAME_CLAIM", configFile: ".env" }
      },
      openidUseEndSessionEndpoint: {
        type: "boolean",
        description: "Use the provider's end_session_endpoint for logout (ensures user is logged out from identity provider).",
        label: "Use End Session Endpoint",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Logout",
        technical: { envVar: "OPENID_USE_END_SESSION_ENDPOINT", configFile: ".env" }
      },
      openidUsePkce: {
        type: "boolean",
        description: "Use PKCE (Proof Key for Code Exchange) for enhanced security in OAuth flow.",
        label: "Use PKCE",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/OAuth2-OIDC",
        docSection: "OpenID Connect - Security",
        technical: { envVar: "OPENID_USE_PKCE", configFile: ".env" }
      },

      // =============================================================================
      // Email Configuration - Individual Fields
      // =============================================================================
      emailService: {
        type: "text",
        description: "Email service provider name (e.g., 'gmail', 'smtp'). Use 'smtp' for custom SMTP configuration.",
        label: "Email Service",
        placeholder: "smtp",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_SERVICE", configFile: ".env" }
      },
      emailUsername: {
        type: "text",
        description: "SMTP username or email address for authentication.",
        label: "Email Username",
        placeholder: "your-email@example.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_USERNAME", configFile: ".env" }
      },
      emailPassword: {
        type: "password",
        description: "SMTP password or app-specific password for email authentication.",
        label: "Email Password",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_PASSWORD", configFile: ".env" }
      },
      emailFrom: {
        type: "email",
        description: "Email address to use as the sender for all outgoing emails.",
        label: "From Email Address",
        placeholder: "noreply@example.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_FROM", configFile: ".env" }
      },
      emailFromName: {
        type: "text",
        description: "Display name to use as the sender for all outgoing emails.",
        label: "From Name",
        placeholder: "LibreChat Support",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_FROM_NAME", configFile: ".env" }
      },
      emailHost: {
        type: "text",
        description: "SMTP server hostname (e.g., 'smtp.gmail.com', 'smtp.office365.com').",
        label: "SMTP Host",
        placeholder: "smtp.gmail.com",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_HOST", configFile: ".env" }
      },
      emailPort: {
        type: "number",
        description: "SMTP server port (common: 587 for TLS, 465 for SSL, 25 for unencrypted).",
        label: "SMTP Port",
        placeholder: "587",
        min: 1,
        max: 65535,
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP",
        technical: { envVar: "EMAIL_PORT", configFile: ".env" }
      },
      emailAllowSelfsigned: {
        type: "boolean",
        description: "Allow self-signed SSL certificates for SMTP connection (not recommended for production).",
        label: "Allow Self-Signed Certificates",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP Advanced",
        technical: { envVar: "EMAIL_ALLOW_SELFSIGNED", configFile: ".env" }
      },
      emailEncryption: {
        type: "select",
        description: "Email encryption method to use for SMTP connection.",
        label: "Encryption Method",
        options: [
          { value: "tls", label: "TLS/STARTTLS (Port 587)" },
          { value: "ssl", label: "SSL (Port 465)" },
          { value: "none", label: "None (Port 25)" }
        ],
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP Advanced",
        technical: { envVar: "EMAIL_ENCRYPTION", configFile: ".env" }
      },
      emailEncryptionHostname: {
        type: "text",
        description: "Hostname to use for email encryption (if different from EMAIL_HOST).",
        label: "Encryption Hostname",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/email_setup",
        docSection: "Email - SMTP Advanced",
        technical: { envVar: "EMAIL_ENCRYPTION_HOSTNAME", configFile: ".env" }
      },

      // =============================================================================
      // SAML Additional Fields
      // =============================================================================
      samlButtonLabel: {
        type: "text",
        description: "Text to display on the SAML login button (e.g., 'Login with Company SSO').",
        label: "SAML Button Label",
        placeholder: "Login with SSO",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - UI",
        technical: { envVar: "SAML_BUTTON_LABEL", configFile: ".env" }
      },
      samlEmailClaim: {
        type: "text",
        description: "SAML attribute name containing the user's email address.",
        label: "Email Claim",
        placeholder: "email",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_EMAIL_CLAIM", configFile: ".env" }
      },
      samlFamilyNameClaim: {
        type: "text",
        description: "SAML attribute name containing the user's family name (last name).",
        label: "Family Name Claim",
        placeholder: "familyName",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_FAMILY_NAME_CLAIM", configFile: ".env" }
      },
      samlGivenNameClaim: {
        type: "text",
        description: "SAML attribute name containing the user's given name (first name).",
        label: "Given Name Claim",
        placeholder: "givenName",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_GIVEN_NAME_CLAIM", configFile: ".env" }
      },
      samlImageUrl: {
        type: "url",
        description: "URL of image/logo to display on the SAML login button.",
        label: "Button Image URL",
        placeholder: "https://example.com/logo.png",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - UI",
        technical: { envVar: "SAML_IMAGE_URL", configFile: ".env" }
      },
      samlNameClaim: {
        type: "text",
        description: "SAML attribute name containing the user's full name.",
        label: "Name Claim",
        placeholder: "name",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_NAME_CLAIM", configFile: ".env" }
      },
      samlPictureClaim: {
        type: "text",
        description: "SAML attribute name containing the URL to the user's profile picture.",
        label: "Picture Claim",
        placeholder: "picture",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_PICTURE_CLAIM", configFile: ".env" }
      },
      samlSessionSecret: {
        type: "password",
        description: "Secret key for encrypting SAML session data. Generate a strong random string.",
        label: "Session Secret",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Security",
        technical: { envVar: "SAML_SESSION_SECRET", configFile: ".env" }
      },
      samlUsernameClaim: {
        type: "text",
        description: "SAML attribute name containing the user's username or unique identifier.",
        label: "Username Claim",
        placeholder: "username",
        docUrl: "https://www.librechat.ai/docs/configuration/authentication/SSO-SAML",
        docSection: "SAML - Claims",
        technical: { envVar: "SAML_USERNAME_CLAIM", configFile: ".env" }
      },

      // =============================================================================
      // Security & Rate Limits - Violation Scores & Message Limits
      // =============================================================================
      fileUploadViolationScore: {
        type: "number",
        description: "Violation score for excessive file uploads. Each violation adds to user's ban score.",
        label: "File Upload Violation Score",
        placeholder: "1",
        min: 0,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Violations",
        technical: { envVar: "FILE_UPLOAD_VIOLATION_SCORE", configFile: ".env" }
      },
      forkViolationScore: {
        type: "number",
        description: "Violation score for excessive conversation forking.",
        label: "Fork Violation Score",
        placeholder: "1",
        min: 0,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Violations",
        technical: { envVar: "FORK_VIOLATION_SCORE", configFile: ".env" }
      },
      importViolationScore: {
        type: "number",
        description: "Violation score for excessive conversation imports.",
        label: "Import Violation Score",
        placeholder: "1",
        min: 0,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Violations",
        technical: { envVar: "IMPORT_VIOLATION_SCORE", configFile: ".env" }
      },
      messageIpMax: {
        type: "number",
        description: "Maximum messages allowed per IP address within the message window.",
        label: "Message IP Max",
        placeholder: "100",
        min: 1,
        max: 10000,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Messages",
        technical: { envVar: "MESSAGE_IP_MAX", configFile: ".env" }
      },
      messageIpWindow: {
        type: "number",
        description: "Time window in minutes for message IP rate limiting.",
        label: "Message IP Window (minutes)",
        placeholder: "1",
        min: 1,
        max: 1440,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Messages",
        technical: { envVar: "MESSAGE_IP_WINDOW", configFile: ".env" }
      },
      messageUserMax: {
        type: "number",
        description: "Maximum messages allowed per user within the message window.",
        label: "Message User Max",
        placeholder: "50",
        min: 1,
        max: 10000,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Messages",
        technical: { envVar: "MESSAGE_USER_MAX", configFile: ".env" }
      },
      messageUserWindow: {
        type: "number",
        description: "Time window in minutes for message user rate limiting.",
        label: "Message User Window (minutes)",
        placeholder: "1",
        min: 1,
        max: 1440,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Messages",
        technical: { envVar: "MESSAGE_USER_WINDOW", configFile: ".env" }
      },
      registerMax: {
        type: "number",
        description: "Maximum registration attempts allowed within the registration window.",
        label: "Registration Max",
        placeholder: "5",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Registration",
        technical: { envVar: "REGISTER_MAX", configFile: ".env" }
      },
      registerWindow: {
        type: "number",
        description: "Time window in minutes for registration rate limiting.",
        label: "Registration Window (minutes)",
        placeholder: "60",
        min: 1,
        max: 1440,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Registration",
        technical: { envVar: "REGISTER_WINDOW", configFile: ".env" }
      },
      sttViolationScore: {
        type: "number",
        description: "Violation score for excessive speech-to-text requests.",
        label: "STT Violation Score",
        placeholder: "1",
        min: 0,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Violations",
        technical: { envVar: "STT_VIOLATION_SCORE", configFile: ".env" }
      },
      ttsViolationScore: {
        type: "number",
        description: "Violation score for excessive text-to-speech requests.",
        label: "TTS Violation Score",
        placeholder: "1",
        min: 0,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/dotenv",
        docSection: "Rate Limits - Violations",
        technical: { envVar: "TTS_VIOLATION_SCORE", configFile: ".env" }
      },

      // =============================================================================
      // File Config - OpenAI Endpoint Specific
      // =============================================================================
      fileConfigEndpointsOpenAIFileLimit: {
        type: "number",
        description: "Maximum number of files that can be uploaded in a single OpenAI request.",
        label: "OpenAI File Limit",
        placeholder: "10",
        min: 1,
        max: 100,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Config - OpenAI",
        technical: { yamlPath: "fileConfig.endpoints.openAI.fileLimit", configFile: "librechat.yaml" }
      },
      fileConfigEndpointsOpenAIFileSizeLimit: {
        type: "number",
        description: "Maximum file size in MB for individual OpenAI file uploads.",
        label: "OpenAI File Size Limit (MB)",
        placeholder: "20",
        min: 1,
        max: 500,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Config - OpenAI",
        technical: { yamlPath: "fileConfig.endpoints.openAI.fileSizeLimit", configFile: "librechat.yaml" }
      },
      fileConfigEndpointsOpenAITotalSizeLimit: {
        type: "number",
        description: "Maximum total size in MB for all files in a single OpenAI request.",
        label: "OpenAI Total Size Limit (MB)",
        placeholder: "50",
        min: 1,
        max: 2000,
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Config - OpenAI",
        technical: { yamlPath: "fileConfig.endpoints.openAI.totalSizeLimit", configFile: "librechat.yaml" }
      },
      fileConfigEndpointsOpenAISupportedMimeTypes: {
        type: "array",
        description: "Array of allowed MIME types for OpenAI file uploads (e.g., 'image/png', 'application/pdf').",
        label: "OpenAI Supported MIME Types",
        docUrl: "https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/file_config",
        docSection: "File Config - OpenAI",
        technical: { yamlPath: "fileConfig.endpoints.openAI.supportedMimeTypes", configFile: "librechat.yaml" }
      },
    };
    
    // Get base field info from fieldMap
    const baseFieldInfo = fieldMap[fieldName] || { type: "text", description: `Configuration for ${fieldName}`, label: fieldName };
    
    // STRICT YAML-FIRST POLICY: Check registry and override configFile for YAML-only fields
    // Try exact match first, then try without prefix (e.g., "interface.customFooter" → "customFooter")
    let registryField = FIELD_REGISTRY.find(f => f.id === fieldName);
    if (!registryField && fieldName.includes('.')) {
      const fieldNameWithoutPrefix = fieldName.split('.').pop() || fieldName;
      registryField = FIELD_REGISTRY.find(f => f.id === fieldNameWithoutPrefix);
    }
    
    if (registryField && registryField.yamlPath) {
      // This field has yamlPath → it MUST go in librechat.yaml, NEVER .env
      return {
        ...baseFieldInfo,
        technical: {
          ...baseFieldInfo.technical,
          envVar: registryField.envKey,
          yamlPath: registryField.yamlPath,
          configFile: "librechat.yaml" as const
        }
      };
    }
    
    return baseFieldInfo;
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
                  <CardContent>
                    {tab.id === "speech-default" ? (
                      <div className="col-span-full">
                        <SpeechPresetSelector
                          currentPreset={getNestedValue(configuration, "speech.preset.selected")}
                          configuration={configuration}
                          fieldInfo={{
                            "stt.language": getFieldInfo("stt.language"),
                            "speech.speechTab.speechToText.languageSTT": getFieldInfo("speech.speechTab.speechToText.languageSTT")
                          }}
                          onApplyPreset={(presetId, customValues) => {
                            // Apply preset settings
                            let presetSettings: Record<string, any> = {};
                            
                            // Map preset values to configuration
                            Object.entries(customValues).forEach(([key, value]) => {
                              presetSettings = setNestedValue(presetSettings, key, value);
                            });
                            
                            // Get preset configuration based on preset ID
                            if (presetId === "chatgpt-feel") {
                              const chatgptPreset = {
                                "stt.provider": "openai",
                                "stt.model": "whisper-1",
                                "stt.streaming": false,
                                "stt.punctuation": true,
                                "stt.profanityFilter": false,
                                "tts.provider": "openai",
                                "tts.model": "tts-1-hd",
                                "tts.quality": "hd",
                                "tts.streaming": true,
                                "speech.speechTab.conversationMode": true,
                                "speech.speechTab.advancedMode": false,
                                "speech.speechTab.speechToText.engineSTT": "external",
                                "speech.speechTab.speechToText.autoTranscribeAudio": true,
                                "speech.speechTab.speechToText.decibelValue": -45,
                                "speech.speechTab.speechToText.autoSendText": 1000,
                                "speech.speechTab.textToSpeech.engineTTS": "external",
                                "speech.speechTab.textToSpeech.automaticPlayback": true,
                                "speech.speechTab.textToSpeech.playbackRate": 1.0,
                                "speech.speechTab.textToSpeech.cacheTTS": true,
                              };
                              Object.entries(chatgptPreset).forEach(([key, value]) => {
                                presetSettings = setNestedValue(presetSettings, key, value);
                              });
                            } else if (presetId === "private-cheap") {
                              const privatePreset = {
                                "stt.provider": "local",
                                "stt.model": "",
                                "stt.streaming": false,
                                "stt.punctuation": true,
                                "stt.profanityFilter": false,
                                "tts.provider": "local",
                                "tts.model": "",
                                "tts.quality": "standard",
                                "tts.streaming": false,
                                "speech.speechTab.conversationMode": true,
                                "speech.speechTab.advancedMode": false,
                                "speech.speechTab.speechToText.engineSTT": "browser",
                                "speech.speechTab.speechToText.autoTranscribeAudio": true,
                                "speech.speechTab.speechToText.decibelValue": -45,
                                "speech.speechTab.speechToText.autoSendText": 1000,
                                "speech.speechTab.textToSpeech.engineTTS": "browser",
                                "speech.speechTab.textToSpeech.automaticPlayback": true,
                                "speech.speechTab.textToSpeech.playbackRate": 1.0,
                                "speech.speechTab.textToSpeech.cacheTTS": false,
                              };
                              Object.entries(privatePreset).forEach(([key, value]) => {
                                presetSettings = setNestedValue(presetSettings, key, value);
                              });
                            }
                            
                            // Merge with existing configuration
                            let updatedConfig = { ...configuration };
                            Object.entries(presetSettings).forEach(([key, value]) => {
                              updatedConfig = setNestedValue(updatedConfig, key, value);
                            });
                            
                            onConfigurationChange(updatedConfig);
                            
                            toast({
                              title: "Preset Applied",
                              description: `${presetId === "chatgpt-feel" ? "ChatGPT Feel" : "Private & Cheap"} preset has been applied successfully.`,
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        {tab.id === "search" && (
                          <div className="col-span-full mb-6">
                            <Alert data-testid="alert-search-result-limits">
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                <strong>💡 Limiting Search Results:</strong> To control how many search results agents use, configure the citation limits in the <strong>Agents</strong> tab: <em>Max Citations</em> (default: 30), <em>Max Citations Per File</em> (default: 7), and <em>Min Relevance Score</em> (default: 0.45). These settings determine how many results are included and their quality threshold.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        
                        {tab.id === "ui-visibility" && (
                          <div className="col-span-full mb-6">
                            {/* User Experience Mode Presets */}
                            <UserExperiencePresets
                              currentMode={getNestedValue(configuration, "ux.preset.mode")}
                              configuration={configuration}
                              onApplyPreset={(presetId, agentId) => {
                                let updatedConfig = { ...configuration };
                                
                                if (presetId === "agents-only") {
                                  // Apply agents-only settings - Complete LibreChat RC4 configuration
                                  
                                  // 1. Restrict to agents endpoint only (ENDPOINTS env variable)
                                  updatedConfig = setNestedValue(updatedConfig, "enabledEndpoints", ["agents"]);
                                  
                                  // 2. Hide UI elements (using interface.modelSelect per RC4 docs)
                                  updatedConfig = setNestedValue(updatedConfig, "interface.modelSelect", false);
                                  updatedConfig = setNestedValue(updatedConfig, "interface.presets", false);
                                  
                                  // 3. Configure agents endpoint
                                  updatedConfig = setNestedValue(updatedConfig, "endpoints.agents.disableBuilder", true);
                                  
                                  // 4. Configure modelSpecs with enforcement
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.enforce", true);
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.prioritize", true);
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.addedEndpoints", []); // Clear to allow modelSelect disable
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.list", [
                                    {
                                      name: "Agents",
                                      label: "Agents",
                                      description: "AI Agents",
                                      default: true, // Auto-select for new chats
                                      preset: {
                                        endpoint: "agents",
                                        agent_id: agentId || ""
                                      }
                                    }
                                  ]);
                                  
                                  // 5. Track preset mode
                                  updatedConfig = setNestedValue(updatedConfig, "ux.preset.mode", "agents-only");
                                } else if (presetId === "standard") {
                                  // Restore standard settings
                                  updatedConfig = setNestedValue(updatedConfig, "enabledEndpoints", ["openAI", "anthropic", "google", "azureOpenAI", "agents"]);
                                  updatedConfig = setNestedValue(updatedConfig, "interface.modelSelect", true);
                                  updatedConfig = setNestedValue(updatedConfig, "interface.presets", true);
                                  updatedConfig = setNestedValue(updatedConfig, "endpoints.agents.disableBuilder", false);
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.enforce", undefined);
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.prioritize", undefined);
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.addedEndpoints", []); // Clear addedEndpoints
                                  updatedConfig = setNestedValue(updatedConfig, "modelSpecs.list", undefined);
                                  updatedConfig = setNestedValue(updatedConfig, "ux.preset.mode", "standard");
                                }
                                
                                onConfigurationChange(updatedConfig);
                                
                                toast({
                                  title: "User Experience Applied",
                                  description: `${presetId === "agents-only" ? "Agents-Only Mode" : "Standard Mode"} has been applied successfully.`,
                                });
                              }}
                            />
                            
                            <Separator className="my-8" />
                            
                            {/* Section: Interface Visibility Settings */}
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-1">Interface Visibility</h3>
                              <p className="text-sm text-muted-foreground mb-4">Control which UI elements and features users can access</p>
                              
                              <Alert variant="warning" className="mb-4" data-testid="alert-hide-plugins-info">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  <strong>⚠️ LibreChat RC4 Bug Warning:</strong> The "Visible Endpoints (UI)" setting below has a known bug that causes interface settings to malfunction (e.g., Presets showing when disabled). <strong>Keep it empty/OFF</strong> to avoid issues. The deprecated "Plugins" menu cannot be hidden in RC4 - just ignore it and use Agents instead.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            options={fieldInfo.type === 'select' ? (fieldInfo.options || getSelectOptions(setting)) : fieldInfo.options}
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
                              options={fieldInfo.type === 'select' ? (fieldInfo.options || getSelectOptions(setting)) : fieldInfo.options}
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
                              options={fieldInfo.type === 'select' ? (fieldInfo.options || getSelectOptions(setting)) : fieldInfo.options}
                              data-testid={`input-${setting}`}
                              technical={fieldInfo.technical}
                            />
                          </div>
                        );
                      }
                      
                      // Special handling for agent capabilities - use custom guided component
                      if (setting === "endpoints.agents.capabilities") {
                        return (
                          <div key={setting} className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {fieldInfo.label}
                            </label>
                            {fieldInfo.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {fieldInfo.description}
                              </p>
                            )}
                            <AgentCapabilitiesManager
                              selectedCapabilities={getNestedValue(configuration, setting) || []}
                              configuration={configuration}
                              onCapabilitiesChange={(capabilities) => {
                                onConfigurationChange(setNestedValue(configuration, setting, capabilities.length > 0 ? capabilities : undefined));
                              }}
                              onNavigateToTab={(tabId) => {
                                setActiveTab(tabId);
                                // Scroll to top after tab change
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            />
                          </div>
                        );
                      }
                      
                      // Special handling for interface.modelSelect - must be enabled when using modelSpecs.addedEndpoints
                      if (setting === "interface.modelSelect") {
                        const addedEndpoints = getNestedValue(configuration, "modelSpecs.addedEndpoints") || [];
                        const isDisabled = addedEndpoints.length > 0;
                        
                        const isHighlighted = Boolean(searchQuery && (
                          setting.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fieldInfo.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (fieldInfo.description && fieldInfo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (fieldInfo.technical?.envVar && fieldInfo.technical.envVar.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (fieldInfo.technical?.yamlPath && fieldInfo.technical.yamlPath.toLowerCase().includes(searchQuery.toLowerCase()))
                        ));
                        
                        return (
                          <SettingInput
                            key={setting}
                            label={fieldInfo.label}
                            description={fieldInfo.description}
                            docUrl={fieldInfo.docUrl}
                            docSection={fieldInfo.docSection}
                            type={fieldInfo.type}
                            value={isDisabled ? true : getNestedValue(configuration, setting) || false}
                            onChange={(value) => onConfigurationChange(setNestedValue(configuration, setting, value))}
                            technical={fieldInfo.technical}
                            highlighted={isHighlighted}
                            disabled={isDisabled}
                            disabledMessage={
                              isDisabled 
                                ? "This setting is automatically enabled because you're using Model Specs Added Endpoints. To disable this, first remove all items from the 'Visible Endpoints (UI)' field in the Model Specs section below."
                                : undefined
                            }
                            onNavigateToRelatedSetting={
                              isDisabled 
                                ? () => {
                                    // Scroll to the modelSpecs.addedEndpoints field
                                    const element = document.querySelector('[data-testid="input-modelSpecs.addedEndpoints"]');
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      // Add a brief highlight effect
                                      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                                      setTimeout(() => {
                                        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                                      }, 2000);
                                    }
                                  }
                                : undefined
                            }
                            data-testid={`input-${setting}`}
                          />
                        );
                      }
                      
                      // Special handling for e2bProxyEnabled - auto-fill defaults when enabled
                      if (setting === "e2bProxyEnabled") {
                        const isHighlighted = Boolean(searchQuery && (
                          setting.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fieldInfo.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (fieldInfo.description && fieldInfo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (fieldInfo.technical?.envVar && fieldInfo.technical.envVar.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (fieldInfo.technical?.yamlPath && fieldInfo.technical.yamlPath.toLowerCase().includes(searchQuery.toLowerCase()))
                        ));
                        
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
                            highlighted={isHighlighted}
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
                            options={fieldInfo.type === 'select' ? (fieldInfo.options || getSelectOptions(setting)) : fieldInfo.options}
                            data-testid={`input-${setting}`}
                          />
                        );
                      }
                      
                      // Check if this setting matches the search query
                      const isHighlighted = Boolean(searchQuery && (
                        setting.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        fieldInfo.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (fieldInfo.description && fieldInfo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (fieldInfo.technical?.envVar && fieldInfo.technical.envVar.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (fieldInfo.technical?.yamlPath && fieldInfo.technical.yamlPath.toLowerCase().includes(searchQuery.toLowerCase()))
                      ));
                      
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
                          options={fieldInfo.type === 'select' ? (fieldInfo.options || getSelectOptions(setting)) : undefined}
                          data-testid={`input-${setting}`}
                          technical={fieldInfo.technical}
                          highlighted={isHighlighted}
                        />
                      );
                    })}
                        </div>
                        
                        {/* Model Specs Presets for UI/Visibility Tab */}
                        {tab.id === "ui-visibility" && (
                          <div className="col-span-full mt-6">
                            <Separator className="mb-6" />
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-1">Advanced: Model Specs Configuration</h3>
                              <p className="text-sm text-muted-foreground">Configure model presets manually (not needed if using presets above)</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Model Specs Presets Manager - Only show if not using quick presets */}
                        {tab.id === "ui-visibility" && getNestedValue(configuration, "ux.preset.mode") !== "agents-only" && (
                      <div className="col-span-full mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Model Specs Presets</CardTitle>
                            <CardDescription>
                              Configure presets to control which endpoints users see and set default agents. For agents-only mode, add a preset with endpoint "agents" and optionally specify an agent_id.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ModelSpecsPresetManager
                              presets={getNestedValue(configuration, "modelSpecs.list") || []}
                              onChange={(presets) => {
                                onConfigurationChange(setNestedValue(configuration, "modelSpecs.list", presets.length > 0 ? presets : undefined));
                              }}
                              enforce={getNestedValue(configuration, "modelSpecs.enforce")}
                              prioritize={getNestedValue(configuration, "modelSpecs.prioritize")}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
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
                      </>
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