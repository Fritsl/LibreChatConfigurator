import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { configurationSchema, insertConfigurationProfileSchema, packageGenerationSchema, insertDeploymentSchema, updateDeploymentSchema, deploymentRequestSchema, type Configuration } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import JSZip from "jszip";
import * as e2bGenerators from "./e2b-generators";
import crypto from "crypto";
import { TOOL_VERSION, createExportMetadata, getVersionInfo } from "@shared/version";
import { getConfigurationDefaults, deepMerge } from "@shared/schema-defaults";
import { generateEnvFile, generateYamlFile, getCachedSecrets, canonicalizeConfiguration } from "@shared/config/registry-helpers";
import { FIELD_REGISTRY } from "@shared/config/field-registry";

// ⚠️ REMINDER: When adding new API endpoints or changing route functionality,
// update version number in shared/version.ts!

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get default configuration (or latest saved configuration)
  app.get("/api/configuration/default", async (req, res) => {
    try {
      // First try to get the latest saved configuration
      const latestConfig = await storage.getLatestConfiguration();
      if (latestConfig) {
        res.json(latestConfig);
      } else {
        // Fall back to default if no saved configuration exists
        const defaultConfig = await storage.getDefaultConfiguration();
        res.json(defaultConfig);
      }
    } catch (error) {
      console.error("Error getting configuration:", error);
      res.status(500).json({ error: "Failed to get configuration" });
    }
  });
  
  // Save current working configuration
  app.post("/api/configuration/save", async (req, res) => {
    try {
      const config = req.body;
      await storage.saveConfigurationToHistory(config, config.configurationName || "Auto-saved");
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving configuration:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // Validate configuration
  app.post("/api/configuration/validate", async (req, res) => {
    try {
      const result = configurationSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Invalid configuration", 
          details: validationError.message 
        });
      }

      const validationStatus = await storage.validateConfiguration(result.data);
      res.json(validationStatus);
    } catch (error) {
      console.error("Error validating configuration:", error);
      res.status(500).json({ error: "Failed to validate configuration" });
    }
  });

  // Get all configuration profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error getting profiles:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // Get specific profile
  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Create new profile
  app.post("/api/profiles", async (req, res) => {
    try {
      const result = insertConfigurationProfileSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: validationError.message 
        });
      }

      // Normalize configuration before saving
      const normalizedData = { ...result.data };
      
      // Auto-set search based on webSearch configuration
      if (normalizedData.configuration?.webSearch?.searchProvider) {
        if (normalizedData.configuration.webSearch.searchProvider !== 'none') {
          normalizedData.configuration.search = true;
        } else {
          // Explicitly set search: false when provider is 'none'
          normalizedData.configuration.search = false;
        }
      }

      const profile = await storage.createProfile(normalizedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update profile
  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const updates = { ...req.body };
      
      // Normalize configuration before updating (same as create)
      if (updates.configuration?.webSearch?.searchProvider) {
        if (updates.configuration.webSearch.searchProvider !== 'none') {
          updates.configuration.search = true;
        } else {
          // Explicitly set search: false when provider is 'none'
          updates.configuration.search = false;
        }
      }
      
      const profile = await storage.updateProfile(req.params.id, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: "Profile not found" });
      } else {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  });

  // Delete profile
  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProfile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Generate installation package
  app.post("/api/package/generate", async (req, res) => {
    try {
      // SINGLE SOURCE OF TRUTH: Use raw frontend configuration directly (same as preview)
      // This bypasses validation issues and ensures preview and ZIP are identical
      const rawConfiguration = req.body?.configuration;
      const includeFiles = req.body?.includeFiles || ["env", "yaml", "docker-compose", "install-script", "readme"];
      const packageName = req.body?.packageName;
      
      console.log("🎯 [SINGLE SOURCE] Using raw frontend data:");
      console.log("  - customFooter (top-level):", JSON.stringify(rawConfiguration?.customFooter));
      console.log("  - customFooter (interface):", JSON.stringify(rawConfiguration?.interface?.customFooter));
      console.log("🔍 [DEBUG] webSearch structure:", JSON.stringify(rawConfiguration?.webSearch, null, 2));
      
      if (!rawConfiguration) {
        return res.status(400).json({ 
          error: "Configuration is required" 
        });
      }
      
      // Save configuration to history for future reference
      await storage.saveConfigurationToHistory(rawConfiguration, packageName);
      
      // Use raw configuration directly - DO NOT merge with defaults
      // The file generation functions use ?? operators to handle missing fields
      // Merging defaults here causes round-trip issues (defaults appear as "new" fields on re-import)
      const configuration = rawConfiguration;
      
      const packageFiles: { [key: string]: string } = {};

      // Generate .env file
      if (includeFiles.includes("env")) {
        packageFiles[".env"] = generateEnvFile(configuration);
      }

      // Generate librechat.yaml file
      if (includeFiles.includes("yaml")) {
        packageFiles["librechat.yaml"] = generateYamlFile(configuration);
      }

      // Generate docker-compose.yml file
      if (includeFiles.includes("docker-compose")) {
        packageFiles["docker-compose.yml"] = generateDockerComposeFile(configuration);
      }

      // Generate installation scripts (both Linux/macOS and Windows)
      if (includeFiles.includes("install-script")) {
        packageFiles["install_dockerimage.sh"] = generateDockerInstallScript(configuration);
        packageFiles["install_dockerimage.bat"] = generateDockerInstallScriptWindows(configuration);
        packageFiles["00-README-INSTALLATION.txt"] = generateInstallationReadme(configuration);
      }

      // Generate MongoDB backup/restore scripts (both Linux/macOS and Windows)
      if (includeFiles.includes("mongo-backup")) {
        packageFiles["backup_mongodb.sh"] = generateMongoBackupScript(configuration);
        packageFiles["backup_mongodb.bat"] = generateMongoBackupScriptWindows(configuration);
        packageFiles["restore_mongodb.sh"] = generateMongoRestoreScript(configuration);
        packageFiles["restore_mongodb.bat"] = generateMongoRestoreScriptWindows(configuration);
      }

      // Generate README.md
      if (includeFiles.includes("readme")) {
        packageFiles["README.md"] = generateReadmeFile(configuration);
      }

      // Generate E2B proxy files if enabled
      if (configuration.e2bProxyEnabled) {
        packageFiles["e2b-code-execution-openapi.yaml"] = e2bGenerators.generateE2BOpenAPISchema(configuration);
        
        // Add proxy-service source files
        packageFiles["proxy-service/package.json"] = await e2bGenerators.generateE2BProxyPackageJson();
        packageFiles["proxy-service/tsconfig.json"] = await e2bGenerators.generateE2BProxyTsConfig();
        packageFiles["proxy-service/Dockerfile"] = await e2bGenerators.generateE2BProxyDockerfile();
        packageFiles["proxy-service/.dockerignore"] = e2bGenerators.generateE2BProxyDockerIgnore();
        packageFiles["proxy-service/README.md"] = await e2bGenerators.generateE2BProxyReadme(configuration);
        packageFiles["proxy-service/src/index.ts"] = await e2bGenerators.generateE2BProxyIndex();
        packageFiles["proxy-service/src/file-storage.ts"] = await e2bGenerators.generateE2BProxyFileStorage();
        packageFiles["proxy-service/src/sandbox-manager.ts"] = await e2bGenerators.generateE2BProxySandboxManager();
        packageFiles["proxy-service/src/metrics.ts"] = await e2bGenerators.generateE2BProxyMetrics();
      }

      // Always include a configuration settings file for easy re-import
      packageFiles["LibreChatConfigSettings.json"] = generateProfileFile(configuration);

      res.json({ files: packageFiles });
    } catch (error) {
      console.error("Error generating package:", error);
      res.status(500).json({ error: "Failed to generate package" });
    }
  });

  // =============================================================================
  // DEPLOYMENT ROUTES
  // =============================================================================

  // Get all deployments
  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getAllDeployments();
      res.json(deployments);
    } catch (error) {
      console.error("Error getting deployments:", error);
      res.status(500).json({ error: "Failed to get deployments" });
    }
  });

  // Get specific deployment
  app.get("/api/deployments/:id", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      console.error("Error getting deployment:", error);
      res.status(500).json({ error: "Failed to get deployment" });
    }
  });

  // Get deployments by profile
  app.get("/api/deployments/profile/:profileId", async (req, res) => {
    try {
      const deployments = await storage.getDeploymentsByProfile(req.params.profileId);
      res.json(deployments);
    } catch (error) {
      console.error("Error getting deployments by profile:", error);
      res.status(500).json({ error: "Failed to get deployments by profile" });
    }
  });

  // Create new deployment (initiate deployment to cloud platform)
  app.post("/api/deployments", async (req, res) => {
    try {
      const result = deploymentRequestSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Invalid deployment request", 
          details: validationError.message 
        });
      }

      const { configurationProfileId, environmentOverrides, ...deploymentData } = result.data;

      // Get the configuration profile
      const profile = await storage.getProfile(configurationProfileId);
      if (!profile) {
        return res.status(404).json({ error: "Configuration profile not found" });
      }

      // Create deployment record
      const deployment = await storage.createDeployment({
        ...deploymentData,
        configurationProfileId,
        configuration: {
          ...profile.configuration,
          // Apply any environment overrides
          ...(environmentOverrides || {})
        }
      });

      // Start the actual deployment process (non-blocking)
      initiateCloudDeployment(deployment.id).catch(error => {
        console.error(`Deployment ${deployment.id} failed:`, error);
        storage.updateDeployment(deployment.id, { 
          status: "failed",
          deploymentLogs: [...(deployment.deploymentLogs || []), `Deployment failed: ${error.message}`]
        });
      });

      res.status(201).json(deployment);
    } catch (error) {
      console.error("Error creating deployment:", error);
      res.status(500).json({ error: "Failed to create deployment" });
    }
  });

  // Update deployment
  app.put("/api/deployments/:id", async (req, res) => {
    try {
      const result = updateDeploymentSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Invalid deployment update", 
          details: validationError.message 
        });
      }

      const deployment = await storage.updateDeployment(req.params.id, result.data);
      res.json(deployment);
    } catch (error) {
      console.error("Error updating deployment:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: "Deployment not found" });
      } else {
        res.status(500).json({ error: "Failed to update deployment" });
      }
    }
  });

  // Delete deployment (also cleanup cloud resources)
  app.delete("/api/deployments/:id", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }

      // Cleanup cloud resources if deployment is running
      if (deployment.status === "running" && deployment.platformProjectId) {
        try {
          await cleanupCloudDeployment(deployment);
        } catch (cleanupError) {
          console.error("Error cleaning up cloud resources:", cleanupError);
          // Continue with deletion even if cleanup fails
        }
      }

      const deleted = await storage.deleteDeployment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting deployment:", error);
      res.status(500).json({ error: "Failed to delete deployment" });
    }
  });

  // Get deployment logs
  app.get("/api/deployments/:id/logs", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json({ logs: deployment.deploymentLogs });
    } catch (error) {
      console.error("Error getting deployment logs:", error);
      res.status(500).json({ error: "Failed to get deployment logs" });
    }
  });

  // Health check endpoint for deployed instances
  app.post("/api/deployments/:id/health-check", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }

      if (deployment.publicUrl) {
        try {
          const healthCheck = await performHealthCheck(deployment.publicUrl);
          await storage.updateDeployment(req.params.id, {
            lastHealthCheck: new Date(),
            uptime: healthCheck.uptime || deployment.uptime
          });
          res.json(healthCheck);
        } catch (healthError) {
          res.status(503).json({ 
            healthy: false, 
            error: healthError instanceof Error ? healthError.message : 'Health check failed' 
          });
        }
      } else {
        res.status(400).json({ error: "No public URL available for health check" });
      }
    } catch (error) {
      console.error("Error performing health check:", error);
      res.status(500).json({ error: "Failed to perform health check" });
    }
  });

  // Configuration History API Routes
  app.get("/api/configuration/history", async (req, res) => {
    try {
      const history = await storage.getConfigurationHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching configuration history:", error);
      res.status(500).json({ error: "Failed to fetch configuration history" });
    }
  });

  app.post("/api/configuration/load/:id", async (req, res) => {
    try {
      const configuration = await storage.loadConfigurationFromHistory(req.params.id);
      if (!configuration) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error loading configuration from history:", error);
      res.status(500).json({ error: "Failed to load configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for file generation
// NOTE: generateEnvFile now uses the centralized registry-based implementation
// from shared/config/registry-helpers.ts for consistent ENV generation across the system

// CRITICAL: This function generates YAML files with real configuration data.
// Preserve all user data exactly as entered - DO NOT modify or redact anything.

// Helper function to escape single quotes in YAML strings
// NOTE: These are kept for backward compatibility and local usage
// The main implementation is now in shared/config/registry-helpers.ts
function escapeYamlString(str: string): string {
  if (!str) return '';
  // In YAML, single quotes are escaped by doubling them
  return str.replace(/'/g, "''");
}

// Helper function to escape double-quoted YAML strings
function escapeYamlDoubleQuoted(str: string): string {
  if (!str) return '';
  // In YAML double-quoted strings, escape special characters to prevent injection:
  // 1. Backslashes first (\ → \\) to avoid double-escaping
  // 2. Newlines (\n → \\n) to prevent multiline injection
  // 3. Carriage returns (\r → \\r)
  // 4. Tabs (\t → \\t)
  // 5. Double quotes (" → \")
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

// YAML file generation is now handled by the registry-based implementation
// in shared/config/registry-helpers.ts. This provides a single source of truth
// for YAML generation with proper security, conditional logic, and complex structure handling.
// The old 430-line manual template literal implementation has been migrated.

// NOTE: Docker-compose uses a curated subset of commonly-used environment variables.
// The complete list of all 400+ fields is exported to the .env file (generated by registry-helpers.ts).
// This approach balances readability (docker-compose.yml remains manageable) with completeness
// (.env file contains every field). All fields reference ${VAR:-default} syntax so values come from .env.
function generateDockerComposeFile(config: any): string {
  // Normalize config to migrate legacy dual-placement fields (modifies config in-place)
  if (config.interface?.customWelcome && !config.customWelcome) {
    config.customWelcome = config.interface.customWelcome;
  }
  if (config.interface?.customFooter && !config.customFooter) {
    config.customFooter = config.interface.customFooter;
  }
  if (config.interface?.temporaryChatRetention && !config.temporaryChatRetention) {
    config.temporaryChatRetention = config.interface.temporaryChatRetention;
  }
  
  // Extract web search configuration (supports both nested and flat structures for compatibility)
  const webSearchProvider = config.webSearch?.searchProvider ?? config.webSearchProvider;
  const webSearchScraperType = config.webSearch?.scraperType ?? config.webSearchScraperType;
  const webSearchRerankerType = config.webSearch?.rerankerType ?? config.webSearchRerankerType;
  
  // Determine which web search features are active
  const hasSerperSearch = webSearchProvider === 'serper';
  const hasSearxngSearch = webSearchProvider === 'searxng';
  const hasFirecrawlScraper = webSearchScraperType === 'firecrawl';
  const hasJinaReranker = webSearchRerankerType === 'jina';
  const hasCohereReranker = webSearchRerankerType === 'cohere';
  
  console.log("🔍 [DOCKER-COMPOSE] Web Search Detection:");
  console.log("  - webSearchProvider:", webSearchProvider);
  console.log("  - webSearchScraperType:", webSearchScraperType);
  console.log("  - webSearchRerankerType:", webSearchRerankerType);
  console.log("  - hasSearxngSearch:", hasSearxngSearch);
  console.log("  - hasFirecrawlScraper:", hasFirecrawlScraper);
  console.log("  - hasJinaReranker:", hasJinaReranker);
  
  return `version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_ROOT_USERNAME:-${config.mongoRootUsername || 'librechat_admin'}}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_ROOT_PASSWORD:-${config.mongoRootPassword || 'librechat_password_change_this'}}
      MONGO_INITDB_DATABASE: \${MONGO_DB_NAME:-${config.mongoDbName || 'librechat'}}
    networks:
      - librechat-network
    ports:
      - "27017:27017"

  # Redis Cache
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - librechat-network
    command: redis-server --appendonly yes
${config.e2bProxyEnabled ? `
  # E2B Code Execution Proxy
  e2b-proxy:
    build:
      context: ./proxy-service
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "\${E2B_PROXY_PORT:-3001}:3001"
    environment:
      E2B_API_KEY: \${E2B_API_KEY}
      E2B_PROXY_PORT: 3001
      PUBLIC_BASE_URL: \${E2B_PUBLIC_BASE_URL:-http://localhost:3001}
      E2B_FILE_TTL_DAYS: \${E2B_FILE_TTL_DAYS:-30}
      E2B_MAX_FILE_SIZE: \${E2B_MAX_FILE_SIZE:-50}
      E2B_PER_USER_SANDBOX: \${E2B_PER_USER_SANDBOX:-false}
      DOMAIN_CLIENT: \${DOMAIN_CLIENT:-http://localhost:3080}
    volumes:
      - e2b_files:/tmp/e2b-files
    networks:
      - librechat-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
` : ''}
  # LibreChat Application${config.interface?.artifacts ? `
  # ⚠️  ARTIFACTS ENABLED - Content Security Policy (CSP) Requirements:
  # When artifacts are enabled (interface.artifacts: true), LibreChat loads the Sandpack bundler
  # to render interactive React/HTML/Mermaid components. The CSP must allow:
  # - frame-src: https://*.codesandbox.io (for public bundler) OR your SANDPACK_BUNDLER_URL
  # - script-src: 'unsafe-eval' 'unsafe-inline' (required for code execution in sandboxed iframe)
  # - connect-src: https://*.codesandbox.io (for bundler API calls) OR your bundler domain
  # 
  # If using a reverse proxy (nginx/traefik), ensure CSP headers allow these domains.
  # Self-hosted bundler (SANDPACK_BUNDLER_URL) keeps all code within your infrastructure.` : ''}
  librechat:
    image: ghcr.io/danny-avila/librechat-dev:latest
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_started
      redis:
        condition: service_started${config.e2bProxyEnabled ? '\n      e2b-proxy:\n        condition: service_started' : ''}
    ports:
      - "\${LIBRECHAT_PORT:-${config.port}}:3080"
    environment:
      # =============================================================================
      # Database Configuration
      # =============================================================================
      MONGO_URI: mongodb://\${MONGO_ROOT_USERNAME:-${config.mongoRootUsername || 'librechat_admin'}}:\${MONGO_ROOT_PASSWORD:-${config.mongoRootPassword || 'librechat_password_change_this'}}@mongodb:27017/\${MONGO_DB_NAME:-${config.mongoDbName || 'librechat'}}?authSource=admin
      REDIS_URI: redis://redis:6379
${config.redisUsername ? `      REDIS_USERNAME: \${REDIS_USERNAME}` : '      # REDIS_USERNAME: ${REDIS_USERNAME}'}
${config.redisPassword ? `      REDIS_PASSWORD: \${REDIS_PASSWORD}` : '      # REDIS_PASSWORD: ${REDIS_PASSWORD}'}
${config.redisKeyPrefix ? `      REDIS_KEY_PREFIX: \${REDIS_KEY_PREFIX}` : '      # REDIS_KEY_PREFIX: ${REDIS_KEY_PREFIX}'}
${config.redisKeyPrefixVar ? `      REDIS_KEY_PREFIX_VAR: \${REDIS_KEY_PREFIX_VAR}` : '      # REDIS_KEY_PREFIX_VAR: ${REDIS_KEY_PREFIX_VAR}'}
${config.redisMaxListeners ? `      REDIS_MAX_LISTENERS: \${REDIS_MAX_LISTENERS}` : '      # REDIS_MAX_LISTENERS: ${REDIS_MAX_LISTENERS}'}
${config.redisPingInterval ? `      REDIS_PING_INTERVAL: \${REDIS_PING_INTERVAL}` : '      # REDIS_PING_INTERVAL: ${REDIS_PING_INTERVAL}'}
${config.redisUseAlternativeDNSLookup !== undefined ? `      REDIS_USE_ALTERNATIVE_DNS_LOOKUP: \${REDIS_USE_ALTERNATIVE_DNS_LOOKUP}` : '      # REDIS_USE_ALTERNATIVE_DNS_LOOKUP: ${REDIS_USE_ALTERNATIVE_DNS_LOOKUP}'}
      
      # =============================================================================
      # Application Configuration
      # =============================================================================
      HOST: \${HOST:-0.0.0.0}
      PORT: \${PORT:-3080}
      NODE_ENV: \${NODE_ENV:-production}
${config.domainClient ? `      DOMAIN_CLIENT: \${DOMAIN_CLIENT}` : '      # DOMAIN_CLIENT: ${DOMAIN_CLIENT}'}
${config.domainServer ? `      DOMAIN_SERVER: \${DOMAIN_SERVER}` : '      # DOMAIN_SERVER: ${DOMAIN_SERVER}'}
${config.appTitle ? `      APP_TITLE: \${APP_TITLE}` : '      # APP_TITLE: ${APP_TITLE}'}
${config.customWelcome ? `      CUSTOM_WELCOME: \${CUSTOM_WELCOME}` : '      # CUSTOM_WELCOME: ${CUSTOM_WELCOME}'}
${config.customFooter ? `      CUSTOM_FOOTER: \${CUSTOM_FOOTER}` : '      # CUSTOM_FOOTER: ${CUSTOM_FOOTER}'}
${config.showBirthdayIcon !== undefined ? `      SHOW_BIRTHDAY_ICON: \${SHOW_BIRTHDAY_ICON}` : '      # SHOW_BIRTHDAY_ICON: ${SHOW_BIRTHDAY_ICON}'}
${config.helpAndFaqUrl ? `      HELP_AND_FAQ_URL: \${HELP_AND_FAQ_URL}` : '      # HELP_AND_FAQ_URL: ${HELP_AND_FAQ_URL}'}
${config.noIndex !== undefined ? `      NO_INDEX: \${NO_INDEX}` : '      # NO_INDEX: ${NO_INDEX}'}
      
      # =============================================================================
      # Security Configuration
      # =============================================================================
      JWT_SECRET: \${JWT_SECRET}
      JWT_REFRESH_SECRET: \${JWT_REFRESH_SECRET}
      CREDS_KEY: \${CREDS_KEY}
      CREDS_IV: \${CREDS_IV}
${config.minPasswordLength ? `      MIN_PASSWORD_LENGTH: \${MIN_PASSWORD_LENGTH}` : '      # MIN_PASSWORD_LENGTH: ${MIN_PASSWORD_LENGTH}'}
${config.emailVerificationRequired !== undefined ? `      EMAIL_VERIFICATION_REQUIRED: \${EMAIL_VERIFICATION_REQUIRED}` : `      EMAIL_VERIFICATION_REQUIRED: \${EMAIL_VERIFICATION_REQUIRED:-false}`}
${config.allowUnverifiedEmailLogin !== undefined ? `      ALLOW_UNVERIFIED_EMAIL_LOGIN: \${ALLOW_UNVERIFIED_EMAIL_LOGIN}` : `      ALLOW_UNVERIFIED_EMAIL_LOGIN: \${ALLOW_UNVERIFIED_EMAIL_LOGIN:-true}`}
      SESSION_EXPIRY: \${SESSION_EXPIRY:-${config.sessionExpiry || '1000 * 60 * 15'}}
      REFRESH_TOKEN_EXPIRY: \${REFRESH_TOKEN_EXPIRY:-${config.refreshTokenExpiry || '1000 * 60 * 60 * 24 * 7'}}
      
      # =============================================================================
      # Authentication Configuration
      # =============================================================================
      ALLOW_REGISTRATION: \${ALLOW_REGISTRATION:-${config.enableRegistration !== undefined ? config.enableRegistration : true}}
${config.allowEmailLogin !== undefined ? `      ALLOW_EMAIL_LOGIN: \${ALLOW_EMAIL_LOGIN}` : '      # ALLOW_EMAIL_LOGIN: ${ALLOW_EMAIL_LOGIN}'}
${config.allowSocialLogin !== undefined ? `      ALLOW_SOCIAL_LOGIN: \${ALLOW_SOCIAL_LOGIN}` : '      # ALLOW_SOCIAL_LOGIN: ${ALLOW_SOCIAL_LOGIN}'}
${config.allowSocialRegistration !== undefined ? `      ALLOW_SOCIAL_REGISTRATION: \${ALLOW_SOCIAL_REGISTRATION}` : '      # ALLOW_SOCIAL_REGISTRATION: ${ALLOW_SOCIAL_REGISTRATION}'}
${config.allowPasswordReset !== undefined ? `      ALLOW_PASSWORD_RESET: \${ALLOW_PASSWORD_RESET}` : '      # ALLOW_PASSWORD_RESET: ${ALLOW_PASSWORD_RESET}'}
      
      # =============================================================================
      # Core AI Provider API Keys
      # =============================================================================
      # Note: API keys are always emitted as ACTIVE when agents/endpoints are configured.
      # The .env file controls actual values. Commented keys indicate no agents configured.
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      OPENAI_API_KEY: \${OPENAI_API_KEY}` : '      # OPENAI_API_KEY: ${OPENAI_API_KEY}'}
${config.openaiApiBase || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      OPENAI_API_BASE: \${OPENAI_API_BASE}` : '      # OPENAI_API_BASE: ${OPENAI_API_BASE}'}
${config.openaiReverseProxy || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      OPENAI_REVERSE_PROXY: \${OPENAI_REVERSE_PROXY}` : '      # OPENAI_REVERSE_PROXY: ${OPENAI_REVERSE_PROXY}'}
${config.openaiModerationReverseProxy || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      OPENAI_MODERATION_REVERSE_PROXY: \${OPENAI_MODERATION_REVERSE_PROXY}` : '      # OPENAI_MODERATION_REVERSE_PROXY: ${OPENAI_MODERATION_REVERSE_PROXY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY}` : '      # ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      GOOGLE_API_KEY: \${GOOGLE_API_KEY}` : '      # GOOGLE_API_KEY: ${GOOGLE_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      GROQ_API_KEY: \${GROQ_API_KEY}` : '      # GROQ_API_KEY: ${GROQ_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      MISTRAL_API_KEY: \${MISTRAL_API_KEY}` : '      # MISTRAL_API_KEY: ${MISTRAL_API_KEY}'}
      
      # =============================================================================
      # Extended AI Provider API Keys
      # =============================================================================
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      DEEPSEEK_API_KEY: \${DEEPSEEK_API_KEY}` : '      # DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      PERPLEXITY_API_KEY: \${PERPLEXITY_API_KEY}` : '      # PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      FIREWORKS_API_KEY: \${FIREWORKS_API_KEY}` : '      # FIREWORKS_API_KEY: ${FIREWORKS_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      TOGETHERAI_API_KEY: \${TOGETHERAI_API_KEY}` : '      # TOGETHERAI_API_KEY: ${TOGETHERAI_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      HUGGINGFACE_TOKEN: \${HUGGINGFACE_TOKEN}` : '      # HUGGINGFACE_TOKEN: ${HUGGINGFACE_TOKEN}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      XAI_API_KEY: \${XAI_API_KEY}` : '      # XAI_API_KEY: ${XAI_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      NVIDIA_API_KEY: \${NVIDIA_API_KEY}` : '      # NVIDIA_API_KEY: ${NVIDIA_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      SAMBANOVA_API_KEY: \${SAMBANOVA_API_KEY}` : '      # SAMBANOVA_API_KEY: ${SAMBANOVA_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      HYPERBOLIC_API_KEY: \${HYPERBOLIC_API_KEY}` : '      # HYPERBOLIC_API_KEY: ${HYPERBOLIC_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      KLUSTER_API_KEY: \${KLUSTER_API_KEY}` : '      # KLUSTER_API_KEY: ${KLUSTER_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      NANOGPT_API_KEY: \${NANOGPT_API_KEY}` : '      # NANOGPT_API_KEY: ${NANOGPT_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      GLHF_API_KEY: \${GLHF_API_KEY}` : '      # GLHF_API_KEY: ${GLHF_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      APIPIE_API_KEY: \${APIPIE_API_KEY}` : '      # APIPIE_API_KEY: ${APIPIE_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      UNIFY_API_KEY: \${UNIFY_API_KEY}` : '      # UNIFY_API_KEY: ${UNIFY_API_KEY}'}
${(config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      OPENROUTER_KEY: \${OPENROUTER_KEY}` : '      # OPENROUTER_KEY: ${OPENROUTER_KEY}'}
      
      # =============================================================================
      # Azure OpenAI Configuration
      # =============================================================================
${config.azureOpenAIApiInstanceName || config.azureOpenAIApiDeploymentName || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AZURE_API_KEY: \${AZURE_API_KEY}` : '      # AZURE_API_KEY: ${AZURE_API_KEY}'}
${config.azureOpenAIApiInstanceName || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AZURE_OPENAI_API_INSTANCE_NAME: \${AZURE_OPENAI_API_INSTANCE_NAME}` : '      # AZURE_OPENAI_API_INSTANCE_NAME: ${AZURE_OPENAI_API_INSTANCE_NAME}'}
${config.azureOpenAIApiDeploymentName || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AZURE_OPENAI_API_DEPLOYMENT_NAME: \${AZURE_OPENAI_API_DEPLOYMENT_NAME}` : '      # AZURE_OPENAI_API_DEPLOYMENT_NAME: ${AZURE_OPENAI_API_DEPLOYMENT_NAME}'}
${config.azureOpenAIApiVersion || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AZURE_OPENAI_API_VERSION: \${AZURE_OPENAI_API_VERSION}` : '      # AZURE_OPENAI_API_VERSION: ${AZURE_OPENAI_API_VERSION}'}
${config.azureOpenAIModels || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AZURE_OPENAI_MODELS: \${AZURE_OPENAI_MODELS}` : '      # AZURE_OPENAI_MODELS: ${AZURE_OPENAI_MODELS}'}
      
      # =============================================================================
      # AWS Bedrock Configuration
      # =============================================================================
${config.awsRegion || config.awsBedrockRegion || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AWS_ACCESS_KEY_ID: \${AWS_ACCESS_KEY_ID}` : '      # AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}'}
${config.awsRegion || config.awsBedrockRegion || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AWS_SECRET_ACCESS_KEY: \${AWS_SECRET_ACCESS_KEY}` : '      # AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}'}
${config.awsRegion || config.awsBedrockRegion || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AWS_REGION: \${AWS_REGION}` : '      # AWS_REGION: ${AWS_REGION}'}
${config.awsBedrockRegion || (config.agents && config.agents.length > 0) || (Array.isArray(config.endpoints) && config.endpoints.length > 0) ? `      AWS_BEDROCK_REGION: \${AWS_BEDROCK_REGION}` : '      # AWS_BEDROCK_REGION: ${AWS_BEDROCK_REGION}'}
${config.awsEndpointUrl ? `      AWS_ENDPOINT_URL: \${AWS_ENDPOINT_URL}` : '      # AWS_ENDPOINT_URL: ${AWS_ENDPOINT_URL}'}
${config.awsBucketName ? `      AWS_BUCKET_NAME: \${AWS_BUCKET_NAME}` : '      # AWS_BUCKET_NAME: ${AWS_BUCKET_NAME}'}
      
      # =============================================================================
      # OAuth Providers Configuration
      # =============================================================================
${config.googleClientId || config.googleCallbackUrl ? `      GOOGLE_CLIENT_ID: \${GOOGLE_CLIENT_ID}` : '      # GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}'}
${config.googleClientId || config.googleCallbackUrl ? `      GOOGLE_CLIENT_SECRET: \${GOOGLE_CLIENT_SECRET}` : '      # GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}'}
${config.googleCallbackUrl || config.googleClientId ? `      GOOGLE_CALLBACK_URL: \${GOOGLE_CALLBACK_URL}` : '      # GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}'}
${config.githubClientId || config.githubCallbackUrl ? `      GITHUB_CLIENT_ID: \${GITHUB_CLIENT_ID}` : '      # GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}'}
${config.githubClientId || config.githubCallbackUrl ? `      GITHUB_CLIENT_SECRET: \${GITHUB_CLIENT_SECRET}` : '      # GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}'}
${config.githubCallbackUrl || config.githubClientId ? `      GITHUB_CALLBACK_URL: \${GITHUB_CALLBACK_URL}` : '      # GITHUB_CALLBACK_URL: ${GITHUB_CALLBACK_URL}'}
${config.discordClientId || config.discordCallbackUrl ? `      DISCORD_CLIENT_ID: \${DISCORD_CLIENT_ID}` : '      # DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}'}
${config.discordClientId || config.discordCallbackUrl ? `      DISCORD_CLIENT_SECRET: \${DISCORD_CLIENT_SECRET}` : '      # DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET}'}
${config.discordCallbackUrl || config.discordClientId ? `      DISCORD_CALLBACK_URL: \${DISCORD_CALLBACK_URL}` : '      # DISCORD_CALLBACK_URL: ${DISCORD_CALLBACK_URL}'}
${config.facebookClientId || config.facebookCallbackUrl ? `      FACEBOOK_CLIENT_ID: \${FACEBOOK_CLIENT_ID}` : '      # FACEBOOK_CLIENT_ID: ${FACEBOOK_CLIENT_ID}'}
${config.facebookClientId || config.facebookCallbackUrl ? `      FACEBOOK_CLIENT_SECRET: \${FACEBOOK_CLIENT_SECRET}` : '      # FACEBOOK_CLIENT_SECRET: ${FACEBOOK_CLIENT_SECRET}'}
${config.facebookCallbackUrl || config.facebookClientId ? `      FACEBOOK_CALLBACK_URL: \${FACEBOOK_CALLBACK_URL}` : '      # FACEBOOK_CALLBACK_URL: ${FACEBOOK_CALLBACK_URL}'}
${config.appleClientId || config.appleCallbackUrl ? `      APPLE_CLIENT_ID: \${APPLE_CLIENT_ID}` : '      # APPLE_CLIENT_ID: ${APPLE_CLIENT_ID}'}
${config.appleClientId || config.appleCallbackUrl ? `      APPLE_PRIVATE_KEY: \${APPLE_PRIVATE_KEY}` : '      # APPLE_PRIVATE_KEY: ${APPLE_PRIVATE_KEY}'}
${config.appleKeyId || config.appleClientId ? `      APPLE_KEY_ID: \${APPLE_KEY_ID}` : '      # APPLE_KEY_ID: ${APPLE_KEY_ID}'}
${config.appleTeamId || config.appleClientId ? `      APPLE_TEAM_ID: \${APPLE_TEAM_ID}` : '      # APPLE_TEAM_ID: ${APPLE_TEAM_ID}'}
${config.appleCallbackUrl || config.appleClientId ? `      APPLE_CALLBACK_URL: \${APPLE_CALLBACK_URL}` : '      # APPLE_CALLBACK_URL: ${APPLE_CALLBACK_URL}'}
${config.openidUrl || config.openidClientId || config.openidIssuer ? `      OPENID_URL: \${OPENID_URL}` : '      # OPENID_URL: ${OPENID_URL}'}
${config.openidClientId || config.openidIssuer ? `      OPENID_CLIENT_ID: \${OPENID_CLIENT_ID}` : '      # OPENID_CLIENT_ID: ${OPENID_CLIENT_ID}'}
${config.openidClientId || config.openidIssuer ? `      OPENID_CLIENT_SECRET: \${OPENID_CLIENT_SECRET}` : '      # OPENID_CLIENT_SECRET: ${OPENID_CLIENT_SECRET}'}
${config.openidCallbackUrl || config.openidClientId || config.openidIssuer ? `      OPENID_CALLBACK_URL: \${OPENID_CALLBACK_URL}` : '      # OPENID_CALLBACK_URL: ${OPENID_CALLBACK_URL}'}
${config.openidScope || config.openidClientId ? `      OPENID_SCOPE: \${OPENID_SCOPE}` : '      # OPENID_SCOPE: ${OPENID_SCOPE}'}
${config.openidClientId || config.openidIssuer ? `      OPENID_SESSION_SECRET: \${OPENID_SESSION_SECRET}` : '      # OPENID_SESSION_SECRET: ${OPENID_SESSION_SECRET}'}
${config.openidIssuer || config.openidClientId ? `      OPENID_ISSUER: \${OPENID_ISSUER}` : '      # OPENID_ISSUER: ${OPENID_ISSUER}'}
${config.openidButtonLabel ? `      OPENID_BUTTON_LABEL: \${OPENID_BUTTON_LABEL}` : '      # OPENID_BUTTON_LABEL: ${OPENID_BUTTON_LABEL}'}
${config.openidImageUrl ? `      OPENID_IMAGE_URL: \${OPENID_IMAGE_URL}` : '      # OPENID_IMAGE_URL: ${OPENID_IMAGE_URL}'}
      
      # =============================================================================
      # Email Configuration
      # =============================================================================
${config.emailService ? `      EMAIL_SERVICE: \${EMAIL_SERVICE}` : '      # EMAIL_SERVICE: ${EMAIL_SERVICE}'}
${config.emailService ? `      EMAIL_USERNAME: \${EMAIL_USERNAME}` : '      # EMAIL_USERNAME: ${EMAIL_USERNAME}'}
${config.emailService ? `      EMAIL_PASSWORD: \${EMAIL_PASSWORD}` : '      # EMAIL_PASSWORD: ${EMAIL_PASSWORD}'}
${config.emailService || config.emailFrom ? `      EMAIL_FROM: \${EMAIL_FROM}` : '      # EMAIL_FROM: ${EMAIL_FROM}'}
${config.emailFromName ? `      EMAIL_FROM_NAME: \${EMAIL_FROM_NAME}` : '      # EMAIL_FROM_NAME: ${EMAIL_FROM_NAME}'}
${config.emailService === 'mailgun' || config.mailgunDomain ? `      MAILGUN_API_KEY: \${MAILGUN_API_KEY}` : '      # MAILGUN_API_KEY: ${MAILGUN_API_KEY}'}
${config.mailgunDomain || config.emailService === 'mailgun' ? `      MAILGUN_DOMAIN: \${MAILGUN_DOMAIN}` : '      # MAILGUN_DOMAIN: ${MAILGUN_DOMAIN}'}
${config.mailgunHost ? `      MAILGUN_HOST: \${MAILGUN_HOST}` : '      # MAILGUN_HOST: ${MAILGUN_HOST}'}
      
      # =============================================================================
      # File Storage Configuration
      # =============================================================================
${config.fileUploadPath ? `      FILE_UPLOAD_PATH: \${FILE_UPLOAD_PATH}` : '      # FILE_UPLOAD_PATH: ${FILE_UPLOAD_PATH}'}
${config.cdnProvider ? `      CDN_PROVIDER: \${CDN_PROVIDER}` : '      # CDN_PROVIDER: ${CDN_PROVIDER}'}
${config.firebaseApiKey ? `      FIREBASE_API_KEY: \${FIREBASE_API_KEY}` : '      # FIREBASE_API_KEY: ${FIREBASE_API_KEY}'}
${config.firebaseAuthDomain ? `      FIREBASE_AUTH_DOMAIN: \${FIREBASE_AUTH_DOMAIN}` : '      # FIREBASE_AUTH_DOMAIN: ${FIREBASE_AUTH_DOMAIN}'}
${config.firebaseProjectId ? `      FIREBASE_PROJECT_ID: \${FIREBASE_PROJECT_ID}` : '      # FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}'}
${config.firebaseStorageBucket ? `      FIREBASE_STORAGE_BUCKET: \${FIREBASE_STORAGE_BUCKET}` : '      # FIREBASE_STORAGE_BUCKET: ${FIREBASE_STORAGE_BUCKET}'}
${config.firebaseMessagingSenderId ? `      FIREBASE_MESSAGING_SENDER_ID: \${FIREBASE_MESSAGING_SENDER_ID}` : '      # FIREBASE_MESSAGING_SENDER_ID: ${FIREBASE_MESSAGING_SENDER_ID}'}
${config.firebaseAppId ? `      FIREBASE_APP_ID: \${FIREBASE_APP_ID}` : '      # FIREBASE_APP_ID: ${FIREBASE_APP_ID}'}
${config.azureStorageConnectionString ? `      AZURE_STORAGE_CONNECTION_STRING: \${AZURE_STORAGE_CONNECTION_STRING}` : '      # AZURE_STORAGE_CONNECTION_STRING: ${AZURE_STORAGE_CONNECTION_STRING}'}
${config.azureStoragePublicAccess !== undefined ? `      AZURE_STORAGE_PUBLIC_ACCESS: \${AZURE_STORAGE_PUBLIC_ACCESS}` : '      # AZURE_STORAGE_PUBLIC_ACCESS: ${AZURE_STORAGE_PUBLIC_ACCESS}'}
${config.azureContainerName ? `      AZURE_CONTAINER_NAME: \${AZURE_CONTAINER_NAME}` : '      # AZURE_CONTAINER_NAME: ${AZURE_CONTAINER_NAME}'}
      
      # =============================================================================
      # Search & External APIs Configuration
      # =============================================================================
${config.googleSearchApiKey ? `      GOOGLE_SEARCH_API_KEY: \${GOOGLE_SEARCH_API_KEY}` : '      # GOOGLE_SEARCH_API_KEY: ${GOOGLE_SEARCH_API_KEY}'}
${config.googleCSEId ? `      GOOGLE_CSE_ID: \${GOOGLE_CSE_ID}` : '      # GOOGLE_CSE_ID: ${GOOGLE_CSE_ID}'}
${config.bingSearchApiKey ? `      BING_SEARCH_API_KEY: \${BING_SEARCH_API_KEY}` : '      # BING_SEARCH_API_KEY: ${BING_SEARCH_API_KEY}'}
${config.openweatherApiKey ? `      OPENWEATHER_API_KEY: \${OPENWEATHER_API_KEY}` : '      # OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY}'}
      
      # =============================================================================
      # Image Generation (DALL-E) Configuration
      # =============================================================================
${config.dalleApiKey ? `      DALLE_API_KEY: \${DALLE_API_KEY}` : '      # DALLE_API_KEY: ${DALLE_API_KEY}'}
${config.dalle3ApiKey ? `      DALLE3_API_KEY: \${DALLE3_API_KEY}` : '      # DALLE3_API_KEY: ${DALLE3_API_KEY}'}
${config.dalle2ApiKey ? `      DALLE2_API_KEY: \${DALLE2_API_KEY}` : '      # DALLE2_API_KEY: ${DALLE2_API_KEY}'}
${config.dalleReverseProxy ? `      DALLE_REVERSE_PROXY: \${DALLE_REVERSE_PROXY}` : '      # DALLE_REVERSE_PROXY: ${DALLE_REVERSE_PROXY}'}
${config.dalle3BaseUrl ? `      DALLE3_BASEURL: \${DALLE3_BASEURL}` : '      # DALLE3_BASEURL: ${DALLE3_BASEURL}'}
${config.dalle2BaseUrl ? `      DALLE2_BASEURL: \${DALLE2_BASEURL}` : '      # DALLE2_BASEURL: ${DALLE2_BASEURL}'}
${config.dalle3SystemPrompt ? `      DALLE3_SYSTEM_PROMPT: \${DALLE3_SYSTEM_PROMPT}` : '      # DALLE3_SYSTEM_PROMPT: ${DALLE3_SYSTEM_PROMPT}'}
${config.dalle2SystemPrompt ? `      DALLE2_SYSTEM_PROMPT: \${DALLE2_SYSTEM_PROMPT}` : '      # DALLE2_SYSTEM_PROMPT: ${DALLE2_SYSTEM_PROMPT}'}
      
      # =============================================================================
      # RAG API Configuration
      # =============================================================================
${config.ragApiUrl ? `      RAG_API_URL: \${RAG_API_URL}` : '      # RAG_API_URL: ${RAG_API_URL}'}
${config.ragOpenaiApiKey ? `      RAG_OPENAI_API_KEY: \${RAG_OPENAI_API_KEY}` : '      # RAG_OPENAI_API_KEY: ${RAG_OPENAI_API_KEY}'}
${config.ragPort ? `      RAG_PORT: \${RAG_PORT}` : '      # RAG_PORT: ${RAG_PORT}'}
${config.ragHost ? `      RAG_HOST: \${RAG_HOST}` : '      # RAG_HOST: ${RAG_HOST}'}
${config.collectionName ? `      COLLECTION_NAME: \${COLLECTION_NAME}` : '      # COLLECTION_NAME: ${COLLECTION_NAME}'}
${config.chunkSize ? `      CHUNK_SIZE: \${CHUNK_SIZE}` : '      # CHUNK_SIZE: ${CHUNK_SIZE}'}
${config.chunkOverlap ? `      CHUNK_OVERLAP: \${CHUNK_OVERLAP}` : '      # CHUNK_OVERLAP: ${CHUNK_OVERLAP}'}
${config.embeddingsProvider ? `      EMBEDDINGS_PROVIDER: \${EMBEDDINGS_PROVIDER}` : '      # EMBEDDINGS_PROVIDER: ${EMBEDDINGS_PROVIDER}'}
      
      # =============================================================================
      # Web Search Configuration
      # =============================================================================
${hasSerperSearch ? `      SERPER_API_KEY: \${SERPER_API_KEY}` : '      # SERPER_API_KEY: ${SERPER_API_KEY}'}
${hasSearxngSearch ? `      SEARXNG_INSTANCE_URL: \${SEARXNG_INSTANCE_URL}` : '      # SEARXNG_INSTANCE_URL: ${SEARXNG_INSTANCE_URL}'}
${hasSearxngSearch ? `      SEARXNG_API_KEY: \${SEARXNG_API_KEY}` : '      # SEARXNG_API_KEY: ${SEARXNG_API_KEY}'}
${hasFirecrawlScraper ? `      FIRECRAWL_API_KEY: \${FIRECRAWL_API_KEY}` : '      # FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY}'}
${hasFirecrawlScraper ? `      FIRECRAWL_API_URL: \${FIRECRAWL_API_URL}` : '      # FIRECRAWL_API_URL: ${FIRECRAWL_API_URL}'}
${hasJinaReranker ? `      JINA_API_KEY: \${JINA_API_KEY}` : '      # JINA_API_KEY: ${JINA_API_KEY}'}
${hasJinaReranker ? `      JINA_API_URL: \${JINA_API_URL}` : '      # JINA_API_URL: ${JINA_API_URL}'}
${hasCohereReranker ? `      COHERE_API_KEY: \${COHERE_API_KEY}` : '      # COHERE_API_KEY: ${COHERE_API_KEY}'}
      
      # =============================================================================
      # MeiliSearch Configuration
      # =============================================================================
${config.meilisearchUrl ? `      MEILISEARCH_URL: \${MEILISEARCH_URL}` : '      # MEILISEARCH_URL: ${MEILISEARCH_URL}'}
${config.meilisearchMasterKey ? `      MEILISEARCH_MASTER_KEY: \${MEILISEARCH_MASTER_KEY}` : '      # MEILISEARCH_MASTER_KEY: ${MEILISEARCH_MASTER_KEY}'}
${config.meiliNoAnalytics !== undefined ? `      MEILI_NO_ANALYTICS: \${MEILI_NO_ANALYTICS}` : '      # MEILI_NO_ANALYTICS: ${MEILI_NO_ANALYTICS}'}
      
      # =============================================================================
      # Rate Limiting & Security Configuration
      # =============================================================================
${config.limitConcurrentMessages !== undefined ? `      LIMIT_CONCURRENT_MESSAGES: \${LIMIT_CONCURRENT_MESSAGES}` : '      # LIMIT_CONCURRENT_MESSAGES: ${LIMIT_CONCURRENT_MESSAGES}'}
${config.concurrentMessageMax ? `      CONCURRENT_MESSAGE_MAX: \${CONCURRENT_MESSAGE_MAX}` : '      # CONCURRENT_MESSAGE_MAX: ${CONCURRENT_MESSAGE_MAX}'}
${config.banViolations !== undefined ? `      BAN_VIOLATIONS: \${BAN_VIOLATIONS}` : '      # BAN_VIOLATIONS: ${BAN_VIOLATIONS}'}
${config.banDuration ? `      BAN_DURATION: \${BAN_DURATION}` : '      # BAN_DURATION: ${BAN_DURATION}'}
${config.banInterval ? `      BAN_INTERVAL: \${BAN_INTERVAL}` : '      # BAN_INTERVAL: ${BAN_INTERVAL}'}
${config.loginViolationScore ? `      LOGIN_VIOLATION_SCORE: \${LOGIN_VIOLATION_SCORE}` : '      # LOGIN_VIOLATION_SCORE: ${LOGIN_VIOLATION_SCORE}'}
${config.registrationViolationScore ? `      REGISTRATION_VIOLATION_SCORE: \${REGISTRATION_VIOLATION_SCORE}` : '      # REGISTRATION_VIOLATION_SCORE: ${REGISTRATION_VIOLATION_SCORE}'}
${config.concurrentViolationScore ? `      CONCURRENT_VIOLATION_SCORE: \${CONCURRENT_VIOLATION_SCORE}` : '      # CONCURRENT_VIOLATION_SCORE: ${CONCURRENT_VIOLATION_SCORE}'}
${config.messageViolationScore ? `      MESSAGE_VIOLATION_SCORE: \${MESSAGE_VIOLATION_SCORE}` : '      # MESSAGE_VIOLATION_SCORE: ${MESSAGE_VIOLATION_SCORE}'}
${config.nonBrowserViolationScore ? `      NON_BROWSER_VIOLATION_SCORE: \${NON_BROWSER_VIOLATION_SCORE}` : '      # NON_BROWSER_VIOLATION_SCORE: ${NON_BROWSER_VIOLATION_SCORE}'}
${config.loginMax ? `      LOGIN_MAX: \${LOGIN_MAX}` : '      # LOGIN_MAX: ${LOGIN_MAX}'}
${config.loginWindow ? `      LOGIN_WINDOW: \${LOGIN_WINDOW}` : '      # LOGIN_WINDOW: ${LOGIN_WINDOW}'}
      
      # =============================================================================
      # LDAP Configuration
      # =============================================================================
${config.ldapUrl ? `      LDAP_URL: \${LDAP_URL}` : '      # LDAP_URL: ${LDAP_URL}'}
${config.ldapBindDN ? `      LDAP_BIND_DN: \${LDAP_BIND_DN}` : '      # LDAP_BIND_DN: ${LDAP_BIND_DN}'}
${config.ldapBindCredentials ? `      LDAP_BIND_CREDENTIALS: \${LDAP_BIND_CREDENTIALS}` : '      # LDAP_BIND_CREDENTIALS: ${LDAP_BIND_CREDENTIALS}'}
${config.ldapSearchBase ? `      LDAP_SEARCH_BASE: \${LDAP_SEARCH_BASE}` : '      # LDAP_SEARCH_BASE: ${LDAP_SEARCH_BASE}'}
${config.ldapSearchFilter ? `      LDAP_SEARCH_FILTER: \${LDAP_SEARCH_FILTER}` : '      # LDAP_SEARCH_FILTER: ${LDAP_SEARCH_FILTER}'}
      
      # =============================================================================
      # Turnstile Configuration
      # =============================================================================
${config.turnstileSiteKey ? `      TURNSTILE_SITE_KEY: \${TURNSTILE_SITE_KEY}` : '      # TURNSTILE_SITE_KEY: ${TURNSTILE_SITE_KEY}'}
${config.turnstileSecretKey ? `      TURNSTILE_SECRET_KEY: \${TURNSTILE_SECRET_KEY}` : '      # TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY}'}
      
      # =============================================================================
      # Features Configuration
      # =============================================================================
${config.allowSharedLinks !== undefined ? `      ALLOW_SHARED_LINKS: \${ALLOW_SHARED_LINKS}` : '      # ALLOW_SHARED_LINKS: ${ALLOW_SHARED_LINKS}'}
${config.allowSharedLinksPublic !== undefined ? `      ALLOW_SHARED_LINKS_PUBLIC: \${ALLOW_SHARED_LINKS_PUBLIC}` : '      # ALLOW_SHARED_LINKS_PUBLIC: ${ALLOW_SHARED_LINKS_PUBLIC}'}
${config.titleConvo !== undefined ? `      TITLE_CONVO: \${TITLE_CONVO}` : '      # TITLE_CONVO: ${TITLE_CONVO}'}
${config.summaryConvo !== undefined ? `      SUMMARY_CONVO: \${SUMMARY_CONVO}` : '      # SUMMARY_CONVO: ${SUMMARY_CONVO}'}
      
      # =============================================================================
      # Caching Configuration
      # =============================================================================
${config.staticCacheMaxAge !== undefined ? `      STATIC_CACHE_MAX_AGE: \${STATIC_CACHE_MAX_AGE}` : '      # STATIC_CACHE_MAX_AGE: ${STATIC_CACHE_MAX_AGE}'}
${config.staticCacheSMaxAge !== undefined ? `      STATIC_CACHE_S_MAX_AGE: \${STATIC_CACHE_S_MAX_AGE}` : '      # STATIC_CACHE_S_MAX_AGE: ${STATIC_CACHE_S_MAX_AGE}'}
${config.indexCacheControl ? `      INDEX_CACHE_CONTROL: \${INDEX_CACHE_CONTROL}` : '      # INDEX_CACHE_CONTROL: ${INDEX_CACHE_CONTROL}'}
${config.indexPragma ? `      INDEX_PRAGMA: \${INDEX_PRAGMA}` : '      # INDEX_PRAGMA: ${INDEX_PRAGMA}'}
${config.indexExpires ? `      INDEX_EXPIRES: \${INDEX_EXPIRES}` : '      # INDEX_EXPIRES: ${INDEX_EXPIRES}'}
      
      # =============================================================================
      # MCP Configuration
      # =============================================================================
      MCP_ENABLED: "true"
${config.mcpOAuthOnAuthError ? `      MCP_OAUTH_ON_AUTH_ERROR: \${MCP_OAUTH_ON_AUTH_ERROR}` : '      # MCP_OAUTH_ON_AUTH_ERROR: ${MCP_OAUTH_ON_AUTH_ERROR}'}
${config.mcpOAuthDetectionTimeout ? `      MCP_OAUTH_DETECTION_TIMEOUT: \${MCP_OAUTH_DETECTION_TIMEOUT}` : '      # MCP_OAUTH_DETECTION_TIMEOUT: ${MCP_OAUTH_DETECTION_TIMEOUT}'}
      
      # =============================================================================
      # Code Execution Configuration
      # =============================================================================
${config.librechatCodeApiKey ? `      LIBRECHAT_CODE_API_KEY: \${LIBRECHAT_CODE_API_KEY}` : '      # LIBRECHAT_CODE_API_KEY: ${LIBRECHAT_CODE_API_KEY}'}
${config.librechatCodeBaseUrl ? `      LIBRECHAT_CODE_BASEURL: \${LIBRECHAT_CODE_BASEURL}` : '      # LIBRECHAT_CODE_BASEURL: ${LIBRECHAT_CODE_BASEURL}'}
${config.e2bApiKey ? `      E2B_API_KEY: \${E2B_API_KEY}` : '      # E2B_API_KEY: ${E2B_API_KEY}'}
${config.e2bProxyEnabled !== undefined ? `      E2B_PROXY_ENABLED: \${E2B_PROXY_ENABLED}` : '      # E2B_PROXY_ENABLED: ${E2B_PROXY_ENABLED}'}
${config.e2bProxyPort ? `      E2B_PROXY_PORT: \${E2B_PROXY_PORT}` : '      # E2B_PROXY_PORT: ${E2B_PROXY_PORT}'}
${config.e2bPublicBaseUrl ? `      E2B_PUBLIC_BASE_URL: \${E2B_PUBLIC_BASE_URL}` : '      # E2B_PUBLIC_BASE_URL: ${E2B_PUBLIC_BASE_URL}'}
${config.e2bFileTTLDays ? `      E2B_FILE_TTL_DAYS: \${E2B_FILE_TTL_DAYS}` : '      # E2B_FILE_TTL_DAYS: ${E2B_FILE_TTL_DAYS}'}
${config.e2bMaxFileSize ? `      E2B_MAX_FILE_SIZE: \${E2B_MAX_FILE_SIZE}` : '      # E2B_MAX_FILE_SIZE: ${E2B_MAX_FILE_SIZE}'}
${config.e2bPerUserSandbox !== undefined ? `      E2B_PER_USER_SANDBOX: \${E2B_PER_USER_SANDBOX}` : '      # E2B_PER_USER_SANDBOX: ${E2B_PER_USER_SANDBOX}'}
      
      # =============================================================================
      # Artifacts Configuration (Generative UI)
      # =============================================================================
${config.sandpackBundlerUrl ? `      SANDPACK_BUNDLER_URL: \${SANDPACK_BUNDLER_URL}` : '      # SANDPACK_BUNDLER_URL: ${SANDPACK_BUNDLER_URL}'}
      
      # =============================================================================
      # User Management Configuration
      # =============================================================================
${config.uid ? `      UID: \${UID}` : '      # UID: ${UID}'}
${config.gid ? `      GID: \${GID}` : '      # GID: ${GID}'}
      
      # =============================================================================
      # Debug Configuration
      # =============================================================================
      DEBUG_LOGGING: \${DEBUG_LOGGING:-${config.debugLogging}}
${config.debugConsole !== undefined ? `      DEBUG_CONSOLE: \${DEBUG_CONSOLE}` : '      # DEBUG_CONSOLE: ${DEBUG_CONSOLE}'}
${config.consoleJson !== undefined ? `      CONSOLE_JSON: \${CONSOLE_JSON}` : '      # CONSOLE_JSON: ${CONSOLE_JSON}'}
      
      # =============================================================================
      # OCR Configuration
      # =============================================================================
${config.ocrProvider ? `      OCR_API_KEY: \${OCR_API_KEY}` : '      # OCR_API_KEY: ${OCR_API_KEY}'}
${config.ocrProvider ? `      OCR_BASEURL: \${OCR_BASEURL}` : '      # OCR_BASEURL: ${OCR_BASEURL}'}
      
      # =============================================================================
      # Speech-to-Text (STT) Configuration
      # =============================================================================
${config.stt?.apiKey ? `      STT_API_KEY: \${STT_API_KEY}` : '      # STT_API_KEY: ${STT_API_KEY}'}
      
      # =============================================================================
      # Text-to-Speech (TTS) Configuration
      # =============================================================================
${config.tts?.apiKey ? `      TTS_API_KEY: \${TTS_API_KEY}` : '      # TTS_API_KEY: ${TTS_API_KEY}'}
      
      # =============================================================================
      # RC4 Subdirectory Hosting
      # =============================================================================
${config.basePath ? `      BASE_PATH: \${BASE_PATH}` : '      # BASE_PATH: ${BASE_PATH}'}
${config.appUrl ? `      APP_URL: \${APP_URL}` : '      # APP_URL: ${APP_URL}'}
${config.publicSubPath ? `      PUBLIC_SUB_PATH: \${PUBLIC_SUB_PATH}` : '      # PUBLIC_SUB_PATH: ${PUBLIC_SUB_PATH}'}
      
    volumes:
      - ./librechat.yaml:/app/librechat.yaml:ro
      - librechat_uploads:/app/client/public/images
      - librechat_logs:/app/api/logs
    networks:
      - librechat-network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
  librechat_uploads:
    driver: local
  librechat_logs:
    driver: local${config.e2bProxyEnabled ? '\n  e2b_files:\n    driver: local' : ''}

networks:
  librechat-network:
    driver: bridge
`;
}

function generateDockerInstallScript(config: any): string {
  return `#!/bin/bash

# =============================================================================
# LibreChat Docker Installation Script
# Generated Configuration for v0.8.0-RC4
# =============================================================================

set -e

# Extract project name from configuration JSON file
if [ ! -f "LibreChatConfigSettings.json" ]; then
    echo "[ERROR] LibreChatConfigSettings.json not found in current directory"
    echo "This file is required to identify the deployment project name."
    echo "Please ensure you're running this script from the extracted deployment folder."
    exit 1
fi

# Extract configuration name from JSON (project identifier)
PROJECT_NAME=\$(grep -o '"configurationName"[[:space:]]*:[[:space:]]*"[^"]*"' LibreChatConfigSettings.json | sed 's/"configurationName"[[:space:]]*:[[:space:]]*"\\(.*\\)"/\\1/' | head -1)

if [ -z "\$PROJECT_NAME" ]; then
    echo "[ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json"
    echo "The configuration file must contain a valid 'configurationName' field."
    echo "This field is used as the deployment identifier to prevent data loss during updates."
    exit 1
fi

# Sanitize project name for Docker Compose (replace spaces and special chars with hyphens)
PROJECT_NAME=\$(echo "\$PROJECT_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | tr '[:upper:]' '[:lower:]')
export COMPOSE_PROJECT_NAME="\${PROJECT_NAME}"

echo ">> Starting LibreChat installation for project: \${PROJECT_NAME}"
echo ">> Docker Compose project name: \${COMPOSE_PROJECT_NAME}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "[OK] Docker and Docker Compose are installed"
echo ""

# Check for --fresh flag
FRESH_INSTALL=false
UPDATE_MODE=false
if [ "\$1" = "--fresh" ]; then
    FRESH_INSTALL=true
fi

# Check if containers exist (matches both hyphen and underscore naming)
EXISTING_CONTAINERS=\$(docker ps -a --format '{{.Names}}' | grep -E "^(\${COMPOSE_PROJECT_NAME}-|\${COMPOSE_PROJECT_NAME}_)" || true)

if [ -n "\$EXISTING_CONTAINERS" ]; then
    if [ "\$FRESH_INSTALL" = true ]; then
        echo "[FRESH INSTALL] Wiping all existing data..."
        echo "[WARNING] This will DELETE all MongoDB data including Agents!"
        echo ""
        docker-compose -p "\${COMPOSE_PROJECT_NAME}" down -v
        echo "[OK] Existing containers and volumes removed"
        echo ""
    else
        UPDATE_MODE=true
        echo "[UPDATE MODE] Existing deployment detected"
        echo ">> Preserving: MongoDB data (including Agents) and LibreChat application"
        echo ">> Updating: Configuration files (.env, librechat.yaml, docker-compose.yml)"
        echo ""
        echo "TIP: To perform a fresh install and wipe all data, run: ./install_dockerimage.sh --fresh"
        echo ""
        echo ">> Stopping existing containers..."
        docker-compose -p "\${COMPOSE_PROJECT_NAME}" down
        echo "[OK] Containers stopped (volumes preserved)"
        echo ""
    fi
else
    echo "[FRESH INSTALLATION] No existing deployment found"
    echo ""
fi

# Create necessary directories
echo ">> Creating directories..."
mkdir -p logs uploads

# Set permissions
chmod 755 logs uploads

# Pull Docker images only on fresh installations (update mode uses existing images)
if [ "\$UPDATE_MODE" = false ]; then
    echo ">> Pulling Docker images..."
    docker-compose -p "\${COMPOSE_PROJECT_NAME}" pull
fi

# Start services
echo ">> Starting LibreChat services..."
docker-compose -p "\${COMPOSE_PROJECT_NAME}" up -d

# Wait for services only on fresh installations (MongoDB needs time to initialize)
if [ "\$UPDATE_MODE" = false ]; then
    echo ">> Waiting for services to start..."
    sleep 30
fi

# In update mode, restart containers to apply new configuration
if [ "\$UPDATE_MODE" = true ]; then
    echo ">> Restarting containers with updated configuration..."
    docker-compose -p "\${COMPOSE_PROJECT_NAME}" restart
    echo "[OK] Containers restarted successfully"
    echo ""
fi

# Check if services are running
echo ">> Checking service health..."
if docker-compose -p "\${COMPOSE_PROJECT_NAME}" ps | grep -q "Up"; then
    echo "[OK] LibreChat is running successfully!"
    echo ""
    echo "Access your LibreChat instance at:"
    echo "   http://localhost:${config.port}"
    echo ""
    echo "Service status:"
    docker-compose -p "\${COMPOSE_PROJECT_NAME}" ps
    echo ""
    
    if [ "\$UPDATE_MODE" = true ]; then
        echo "[OK] Docker has been restarted with updated configuration!"
        echo ""
        echo "Commands:"
        echo "  To view logs: docker-compose -p \${COMPOSE_PROJECT_NAME} logs -f"
        echo "  To stop: docker-compose -p \${COMPOSE_PROJECT_NAME} down"
    else
        echo "Commands:"
        echo "  To view logs: docker-compose -p \${COMPOSE_PROJECT_NAME} logs -f"
        echo "  To stop: docker-compose -p \${COMPOSE_PROJECT_NAME} down"
        echo "  To restart: docker-compose -p \${COMPOSE_PROJECT_NAME} restart"
    fi
else
    echo "[ERROR] Some services failed to start. Check logs:"
    docker-compose -p "\${COMPOSE_PROJECT_NAME}" logs
    exit 1
fi

echo ""
echo "Installation complete! Enjoy using LibreChat!"
`;
}

function generateDockerInstallScriptWindows(config: any): string {
  return `@echo off
REM =============================================================================
REM LibreChat Docker Installation Script
REM Generated Configuration for v0.8.0-RC4
REM =============================================================================

REM Check if configuration JSON exists
if not exist "LibreChatConfigSettings.json" (
    echo [ERROR] LibreChatConfigSettings.json not found in current directory
    echo This file is required to identify the deployment project name.
    echo Please ensure you're running this script from the extracted deployment folder.
    pause
    exit /b 1
)

REM Extract and sanitize project name from JSON configuration (matches Linux: replace non-alphanum, collapse hyphens, lowercase)
powershell -Command "try { $ErrorActionPreference='Stop'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $json = Get-Content 'LibreChatConfigSettings.json' -Raw -Encoding UTF8 | ConvertFrom-Json; if ($json.configuration.configurationName) { $name = $json.configuration.configurationName -replace '[^a-zA-Z0-9-]', '-' -replace '--+', '-'; $name.ToLower() } else { '' } } catch { Write-Error $_.Exception.Message; '' }" > temp_project_name.txt 2>&1
set /p PROJECT_NAME=<temp_project_name.txt

REM Check for PowerShell errors
findstr /C:"Exception" temp_project_name.txt >nul
if not errorlevel 1 (
    echo [ERROR] Failed to parse LibreChatConfigSettings.json
    echo PowerShell error:
    type temp_project_name.txt
    del temp_project_name.txt
    pause
    exit /b 1
)

del temp_project_name.txt

if "%PROJECT_NAME%"=="" (
    echo [ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json
    echo The configuration file must contain a valid 'configurationName' field.
    echo This field is used as the deployment identifier to prevent data loss during updates.
    pause
    exit /b 1
)

REM Set COMPOSE_PROJECT_NAME for Docker Compose
set COMPOSE_PROJECT_NAME=%PROJECT_NAME%

echo ^>^> Starting LibreChat installation for project: %PROJECT_NAME%
echo ^>^> Docker Compose project name: %COMPOSE_PROJECT_NAME%
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check for --fresh flag
set FRESH_INSTALL=false
set UPDATE_MODE=false
if "%1"=="--fresh" set FRESH_INSTALL=true

REM Check if containers exist (matches both hyphen and underscore naming)
set CONTAINER_FOUND=false
docker ps -a --format "{{.Names}}" | findstr /R "^%COMPOSE_PROJECT_NAME%-" >nul 2>&1
if not errorlevel 1 set CONTAINER_FOUND=true
docker ps -a --format "{{.Names}}" | findstr /R "^%COMPOSE_PROJECT_NAME%_" >nul 2>&1
if not errorlevel 1 set CONTAINER_FOUND=true

if "%CONTAINER_FOUND%"=="true" (
    if "%FRESH_INSTALL%"=="true" (
        echo [FRESH INSTALL] Wiping all existing data...
        echo [WARNING] This will DELETE all MongoDB data including Agents!
        echo.
        docker-compose -p %COMPOSE_PROJECT_NAME% down -v
        echo [OK] Existing containers and volumes removed
        echo.
    ) else (
        set UPDATE_MODE=true
        echo [UPDATE MODE] Existing deployment detected
        echo ^>^> Preserving: MongoDB data (including Agents^) and LibreChat application
        echo ^>^> Updating: Configuration files (.env, librechat.yaml, docker-compose.yml^)
        echo.
        echo TIP: To perform a fresh install and wipe all data, run: install_dockerimage.bat --fresh
        echo.
        echo ^>^> Stopping existing containers...
        docker-compose -p %COMPOSE_PROJECT_NAME% down
        echo [OK] Containers stopped (volumes preserved^)
        echo.
    )
) else (
    echo [FRESH INSTALLATION] No existing deployment found
    echo.
)

REM Create necessary directories
echo ^>^> Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
echo.

REM Pull Docker images only on fresh installations (update mode uses existing images)
if "%UPDATE_MODE%"=="false" (
    echo ^>^> Pulling Docker images...
    docker-compose -p %COMPOSE_PROJECT_NAME% pull
    echo.
)

REM Start services
echo ^>^> Starting LibreChat services...
docker-compose -p %COMPOSE_PROJECT_NAME% up -d
echo.

REM Wait for services only on fresh installations (MongoDB needs time to initialize)
if "%UPDATE_MODE%"=="false" (
    echo ^>^> Waiting for services to start...
    timeout /t 30 /nobreak >nul
    echo.
)

REM In update mode, restart containers to apply new configuration
if "%UPDATE_MODE%"=="true" (
    echo ^>^> Restarting containers with updated configuration...
    docker-compose -p %COMPOSE_PROJECT_NAME% restart
    echo [OK] Containers restarted successfully
    echo.
)

REM Check if services are running
echo ^>^> Checking service health...
docker-compose -p %COMPOSE_PROJECT_NAME% ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Some services failed to start. Check logs:
    docker-compose -p %COMPOSE_PROJECT_NAME% logs
    pause
    exit /b 1
)

echo [OK] LibreChat is running successfully!
echo.
echo Access your LibreChat instance at:
echo    http://localhost:${config.port}
echo.
echo Service status:
docker-compose -p %COMPOSE_PROJECT_NAME% ps
echo.

if "%UPDATE_MODE%"=="true" (
    echo [OK] Docker has been restarted with updated configuration!
    echo.
    echo Commands:
    echo   To view logs: docker-compose -p %COMPOSE_PROJECT_NAME% logs -f
    echo   To stop: docker-compose -p %COMPOSE_PROJECT_NAME% down
) else (
    echo Commands:
    echo   To view logs: docker-compose -p %COMPOSE_PROJECT_NAME% logs -f
    echo   To stop: docker-compose -p %COMPOSE_PROJECT_NAME% down
    echo   To restart: docker-compose -p %COMPOSE_PROJECT_NAME% restart
)

echo.
echo Installation complete! Enjoy using LibreChat!
echo.
pause
`;
}

function generateMongoBackupScript(config: any): string {
  return `#!/bin/bash

# =============================================================================
# LibreChat MongoDB Backup Script
# Generated Configuration for v0.8.0-RC4
# =============================================================================

set -e

# Extract project name from configuration JSON file
if [ ! -f "LibreChatConfigSettings.json" ]; then
    echo "[ERROR] LibreChatConfigSettings.json not found in current directory"
    echo "This file is required to identify the deployment project name."
    exit 1
fi

PROJECT_NAME=\$(grep -o '"configurationName"[[:space:]]*:[[:space:]]*"[^"]*"' LibreChatConfigSettings.json | sed 's/"configurationName"[[:space:]]*:[[:space:]]*"\\(.*\\)"/\\1/' | head -1)

if [ -z "\$PROJECT_NAME" ]; then
    echo "[ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json"
    exit 1
fi

# Sanitize project name for Docker Compose
PROJECT_NAME=\$(echo "\$PROJECT_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | tr '[:upper:]' '[:lower:]')
export COMPOSE_PROJECT_NAME="\${PROJECT_NAME}"

echo "=============================================="
echo "LibreChat MongoDB Backup"
echo "=============================================="
echo "Project: \$COMPOSE_PROJECT_NAME"
echo ""

# Create backup directory
BACKUP_DIR="mongodb_backup_\$(date +%Y%m%d_%H%M%S)"
mkdir -p "\$BACKUP_DIR"

echo "[INFO] Creating MongoDB backup..."
echo "[INFO] Backup location: ./$BACKUP_DIR"
echo ""

# Run mongodump using docker-compose exec with safe credential handling
# Single quotes prevent host expansion, container bash expands the variables
docker-compose -p \$COMPOSE_PROJECT_NAME exec -T mongodb bash -c 'mongodump --host=localhost --port=27017 --username="\$MONGO_INITDB_ROOT_USERNAME" --password="\$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase=admin --db="\$MONGO_INITDB_DATABASE" --out=/dump'

# Copy dump from container to host using docker-compose cp
docker-compose -p \$COMPOSE_PROJECT_NAME cp mongodb:/dump "\$BACKUP_DIR/"

echo ""
echo "[OK] MongoDB backup completed successfully!"
echo "[INFO] Backup saved to: ./$BACKUP_DIR"
echo ""
echo "To share this backup:"
echo "1. Copy the entire '$BACKUP_DIR' folder"
echo "2. Share it along with this configuration package"
echo "3. The recipient can use the restore script to import the data"
echo ""
`;
}

function generateMongoBackupScriptWindows(config: any): string {
  return `@echo off
REM =============================================================================
REM LibreChat MongoDB Backup Script
REM Generated Configuration for v0.8.0-RC4
REM =============================================================================

REM Check if configuration JSON exists
if not exist "LibreChatConfigSettings.json" (
    echo [ERROR] LibreChatConfigSettings.json not found in current directory
    pause
    exit /b 1
)

REM Extract and sanitize project name from JSON configuration
powershell -Command "try { $ErrorActionPreference='Stop'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $json = Get-Content 'LibreChatConfigSettings.json' -Raw -Encoding UTF8 | ConvertFrom-Json; if ($json.configuration.configurationName) { $name = $json.configuration.configurationName -replace '[^a-zA-Z0-9-]', '-' -replace '--+', '-'; $name.ToLower() } else { '' } } catch { Write-Error $_.Exception.Message; '' }" > temp_project_name.txt 2>&1
set /p PROJECT_NAME=<temp_project_name.txt

REM Check for PowerShell errors
findstr /C:"Exception" temp_project_name.txt >nul
if not errorlevel 1 (
    echo [ERROR] Failed to parse LibreChatConfigSettings.json
    echo PowerShell error:
    type temp_project_name.txt
    del temp_project_name.txt
    pause
    exit /b 1
)

del temp_project_name.txt

if "%PROJECT_NAME%"=="" (
    echo [ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json
    pause
    exit /b 1
)

set COMPOSE_PROJECT_NAME=%PROJECT_NAME%

echo ==============================================
echo LibreChat MongoDB Backup
echo ==============================================
echo Project: %COMPOSE_PROJECT_NAME%
echo.

REM Create backup directory with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_DIR=mongodb_backup_%mydate%_%mytime%
mkdir "%BACKUP_DIR%"

echo [INFO] Creating MongoDB backup...
echo [INFO] Backup location: ./%BACKUP_DIR%
echo.

REM Run mongodump using docker-compose exec with safe credential handling
REM $ variables don't expand in cmd.exe, so they pass safely to bash inside container
docker-compose -p %COMPOSE_PROJECT_NAME% exec -T mongodb bash -c "mongodump --host=localhost --port=27017 --username=\"$MONGO_INITDB_ROOT_USERNAME\" --password=\"$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase=admin --db=\"$MONGO_INITDB_DATABASE\" --out=/dump"

REM Copy dump from container to host using docker-compose cp
docker-compose -p %COMPOSE_PROJECT_NAME% cp mongodb:/dump "%BACKUP_DIR%/"

echo.
echo [OK] MongoDB backup completed successfully!
echo [INFO] Backup saved to: ./%BACKUP_DIR%
echo.
echo To share this backup:
echo 1. Copy the entire '%BACKUP_DIR%' folder
echo 2. Share it along with this configuration package
echo 3. The recipient can use the restore script to import the data
echo.
pause
`;
}

function generateMongoRestoreScript(config: any): string {
  return `#!/bin/bash

# =============================================================================
# LibreChat MongoDB Restore Script
# Generated Configuration for v0.8.0-RC4
# =============================================================================

set -e

# Extract project name from configuration JSON file
if [ ! -f "LibreChatConfigSettings.json" ]; then
    echo "[ERROR] LibreChatConfigSettings.json not found in current directory"
    echo "This file is required to identify the deployment project name."
    exit 1
fi

PROJECT_NAME=\$(grep -o '"configurationName"[[:space:]]*:[[:space:]]*"[^"]*"' LibreChatConfigSettings.json | sed 's/"configurationName"[[:space:]]*:[[:space:]]*"\\(.*\\)"/\\1/' | head -1)

if [ -z "\$PROJECT_NAME" ]; then
    echo "[ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json"
    exit 1
fi

# Sanitize project name for Docker Compose
PROJECT_NAME=\$(echo "\$PROJECT_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | tr '[:upper:]' '[:lower:]')
export COMPOSE_PROJECT_NAME="\${PROJECT_NAME}"

echo "=============================================="
echo "LibreChat MongoDB Restore"
echo "=============================================="
echo "Project: \$COMPOSE_PROJECT_NAME"
echo ""

# Find backup directory
BACKUP_DIR=\$(ls -d mongodb_backup_* 2>/dev/null | head -1)

if [ -z "\$BACKUP_DIR" ]; then
    echo "[ERROR] No backup directory found (looking for mongodb_backup_*)"
    echo "Please ensure the backup folder is in the current directory"
    exit 1
fi

echo "[INFO] Found backup: \$BACKUP_DIR"
echo ""

# WARNING: This will replace existing data
echo "=============================================="
echo "WARNING: This will REPLACE all existing data!"
echo "=============================================="
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! \$REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "[CANCELLED] Restore cancelled by user"
    exit 0
fi

# Ensure MongoDB container is running
echo "[INFO] Ensuring MongoDB container is running..."
docker-compose -p \$COMPOSE_PROJECT_NAME up -d mongodb
sleep 5

# Copy backup to container using docker-compose cp
echo "[INFO] Copying backup to MongoDB container..."
docker-compose -p \$COMPOSE_PROJECT_NAME cp "\$BACKUP_DIR/dump" mongodb:/

# Run mongorestore using docker-compose exec with safe credential handling
# Single quotes prevent host expansion, container bash expands the variables
echo "[INFO] Restoring MongoDB data..."
docker-compose -p \$COMPOSE_PROJECT_NAME exec -T mongodb bash -c 'mongorestore --host=localhost --port=27017 --username="\$MONGO_INITDB_ROOT_USERNAME" --password="\$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase=admin --db="\$MONGO_INITDB_DATABASE" --drop /dump'

# Clean up
docker-compose -p \$COMPOSE_PROJECT_NAME exec -T mongodb rm -rf /dump

echo ""
echo "[OK] MongoDB restore completed successfully!"
echo "[INFO] All data has been restored from: \$BACKUP_DIR"
echo ""
echo "You can now start LibreChat with all the imported data (Agents, conversations, etc.)"
echo ""
`;
}

function generateMongoRestoreScriptWindows(config: any): string {
  return `@echo off
REM =============================================================================
REM LibreChat MongoDB Restore Script
REM Generated Configuration for v0.8.0-RC4
REM =============================================================================

REM Check if configuration JSON exists
if not exist "LibreChatConfigSettings.json" (
    echo [ERROR] LibreChatConfigSettings.json not found in current directory
    pause
    exit /b 1
)

REM Extract and sanitize project name from JSON configuration
powershell -Command "try { $ErrorActionPreference='Stop'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $json = Get-Content 'LibreChatConfigSettings.json' -Raw -Encoding UTF8 | ConvertFrom-Json; if ($json.configuration.configurationName) { $name = $json.configuration.configurationName -replace '[^a-zA-Z0-9-]', '-' -replace '--+', '-'; $name.ToLower() } else { '' } } catch { Write-Error $_.Exception.Message; '' }" > temp_project_name.txt 2>&1
set /p PROJECT_NAME=<temp_project_name.txt

REM Check for PowerShell errors
findstr /C:"Exception" temp_project_name.txt >nul
if not errorlevel 1 (
    echo [ERROR] Failed to parse LibreChatConfigSettings.json
    echo PowerShell error:
    type temp_project_name.txt
    del temp_project_name.txt
    pause
    exit /b 1
)

del temp_project_name.txt

if "%PROJECT_NAME%"=="" (
    echo [ERROR] Could not extract 'configurationName' from LibreChatConfigSettings.json
    pause
    exit /b 1
)

set COMPOSE_PROJECT_NAME=%PROJECT_NAME%

echo ==============================================
echo LibreChat MongoDB Restore
echo ==============================================
echo Project: %COMPOSE_PROJECT_NAME%
echo.

REM Find backup directory
for /d %%i in (mongodb_backup_*) do set BACKUP_DIR=%%i

if "%BACKUP_DIR%"=="" (
    echo [ERROR] No backup directory found (looking for mongodb_backup_*)
    echo Please ensure the backup folder is in the current directory
    pause
    exit /b 1
)

echo [INFO] Found backup: %BACKUP_DIR%
echo.

REM WARNING: This will replace existing data
echo ==============================================
echo WARNING: This will REPLACE all existing data!
echo ==============================================
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo [CANCELLED] Restore cancelled by user
    pause
    exit /b 0
)

REM Ensure MongoDB container is running
echo [INFO] Ensuring MongoDB container is running...
docker-compose -p %COMPOSE_PROJECT_NAME% up -d mongodb
timeout /t 5 /nobreak > nul

REM Copy backup to container using docker-compose cp
echo [INFO] Copying backup to MongoDB container...
docker-compose -p %COMPOSE_PROJECT_NAME% cp "%BACKUP_DIR%/dump" mongodb:/

REM Run mongorestore using docker-compose exec with safe credential handling
REM $ variables don't expand in cmd.exe, so they pass safely to bash inside container
echo [INFO] Restoring MongoDB data...
docker-compose -p %COMPOSE_PROJECT_NAME% exec -T mongodb bash -c "mongorestore --host=localhost --port=27017 --username=\"$MONGO_INITDB_ROOT_USERNAME\" --password=\"$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase=admin --db=\"$MONGO_INITDB_DATABASE\" --drop /dump"

REM Clean up
docker-compose -p %COMPOSE_PROJECT_NAME% exec -T mongodb rm -rf /dump

echo.
echo [OK] MongoDB restore completed successfully!
echo [INFO] All data has been restored from: %BACKUP_DIR%
echo.
echo You can now start LibreChat with all the imported data (Agents, conversations, etc.)
echo.
pause
`;
}

function generateInstallationReadme(config: any): string {
  return `LIBRECHAT INSTALLATION INSTRUCTIONS
====================================

PROJECT IDENTIFICATION SYSTEM
------------------------------
IMPORTANT: This installation package uses the CONFIGURATION NAME from 
LibreChatConfigSettings.json as the project identifier, NOT the folder name.

Current Configuration Name: "${config.configurationName}"

This means:
- Folder can be renamed without breaking updates
- Windows re-downloads (with "(1)" suffix) work correctly  
- Same configuration always updates the same deployment
- Project identity persists across file operations

Multiple LibreChat instances can coexist on the same machine with different 
configuration names.

SMART INSTALLATION BEHAVIOR
----------------------------

The installation scripts automatically detect existing deployments by reading
the configuration name from LibreChatConfigSettings.json:

1. IF NO EXISTING DEPLOYMENT IS FOUND:
   - Fresh installation with new MongoDB and LibreChat
   - All containers created from scratch

2. IF EXISTING DEPLOYMENT WITH SAME NAME EXISTS:
   - UPDATE MODE (default behavior)
   - Preserves: MongoDB data (including AI Agents), LibreChat application
   - Updates: Configuration files (.env, librechat.yaml, docker-compose.yml)
   - Stops containers, applies changes, restarts automatically (no waiting)
   - Shows message: "[UPDATE MODE] Only appending/merging configuration"

3. TO FORCE FRESH INSTALLATION (WIPE ALL DATA):
   - Run with --fresh flag
   - Deletes: All containers, volumes, and MongoDB data (including Agents)
   - Shows warning before proceeding

CRITICAL: LibreChatConfigSettings.json must exist in the same directory 
as the install script, and must contain a valid 'configurationName' field.

INSTALLATION COMMANDS
---------------------

Linux/macOS:
  chmod +x install_dockerimage.sh
  ./install_dockerimage.sh              # Update mode (preserves data)
  ./install_dockerimage.sh --fresh      # Fresh install (wipes data)

Windows:
  install_dockerimage.bat               # Update mode (preserves data)
  install_dockerimage.bat --fresh       # Fresh install (wipes data)

PRESERVING AI AGENTS
---------------------
LibreChat stores AI Agents in MongoDB but doesn't yet support export/import.
The UPDATE MODE feature allows you to:

1. Develop Agents in a running LibreChat instance (stored in MongoDB)
2. Update configuration settings using this configurator tool
3. Re-run installation script to apply new configs WITHOUT losing Agents
4. Continue Agent development while iterating on configuration

This enables parallel workflows:
- Agent Development: Build and test Agents in LibreChat
- Configuration Evolution: Refine settings through this configurator
- Seamless Updates: Deploy config changes without data loss

CONTAINER NAMING
-----------------
All containers are prefixed with your sanitized configuration name:
- Config: "Client ACME Corp" becomes: client-acme-corp-librechat-1, client-acme-corp-mongodb-1
- Config: "Testing Environment" becomes: testing-environment-librechat-1, testing-environment-mongodb-1

The configuration name is sanitized: lowercase, special chars replaced with hyphens

ACCESS YOUR INSTANCE
--------------------
After installation completes:
- URL: http://localhost:${config.port}
- Registration: ${config.allowRegistration ? 'Enabled' : 'Disabled'}
- Default Model: ${config.interface?.defaultModel || 'Not configured'}

PREREQUISITES
-------------
- Docker and Docker Compose installed
- At least 4GB RAM available
- At least 10GB disk space
- Open ports: ${config.port} (LibreChat), 27017 (MongoDB)

SUPPORT & DOCUMENTATION
-----------------------
- Full configuration details: See README.md
- LibreChat documentation: https://docs.librechat.ai
- Configuration tool: LibreChat Configuration Manager v${config.version}

Generated: ${new Date().toISOString()}
`;
}

function generateReadmeFile(config: any): string {
  return `# LibreChat Configuration

This package contains a complete LibreChat v0.8.0-RC4 installation with your custom configuration (using configuration schema v${config.version}).

## Package Contents

- \`.env\` - Environment variables configuration
- \`librechat.yaml\` - Main LibreChat configuration file
- \`docker-compose.yml\` - Docker services orchestration
- \`install_dockerimage.sh\` - Installation script for Linux/macOS
- \`install_dockerimage.bat\` - Installation script for Windows
- \`backup_mongodb.sh\` - MongoDB backup script for Linux/macOS
- \`backup_mongodb.bat\` - MongoDB backup script for Windows
- \`restore_mongodb.sh\` - MongoDB restore script for Linux/macOS
- \`restore_mongodb.bat\` - MongoDB restore script for Windows
- \`LibreChatConfigSettings.json\` - Configuration profile for easy re-import
- \`README.md\` - This documentation file

## Quick Start

1. **Prerequisites**
   - Docker and Docker Compose installed
   - At least 4GB RAM and 10GB disk space
   - Open ports: ${config.port}, 27017 (MongoDB)

2. **Installation**

   **Linux/macOS:**
   \`\`\`bash
   chmod +x install_dockerimage.sh
   ./install_dockerimage.sh
   \`\`\`
   
   **Windows:**
   \`\`\`cmd
   install_dockerimage.bat
   \`\`\`

3. **Access**
   - Open your browser to: http://localhost:${config.port}
   - Register an account (${config.allowRegistration ? 'enabled' : 'disabled'})

## Configuration Summary

### Core Settings
- **LibreChat Version**: v0.8.0-RC4
- **Configuration Schema**: v${config.version}
- **Host**: ${config.host}:${config.port}
- **Registration**: ${config.allowRegistration ? 'Enabled' : 'Disabled'}
- **Debug Logging**: ${config.debugLogging || config.debug ? 'Enabled' : 'Disabled'}

### AI Models
- **Default Model**: ${config.interface?.defaultModel || 'Not configured'}
- **Model Selection UI**: ${config.interface?.modelSelect !== false ? 'Visible' : 'Hidden'}
- **Parameters UI**: ${config.interface?.parameters !== false ? 'Visible' : 'Hidden'}

### Features Enabled
${config.interface?.agents !== false ? '- [ENABLED] AI Agents' : '- [DISABLED] AI Agents'}
${config.interface?.webSearch !== false ? '- [ENABLED] Web Search' : '- [DISABLED] Web Search'}
${config.interface?.fileSearch !== false ? '- [ENABLED] File Search' : '- [DISABLED] File Search'}
${config.interface?.presets !== false ? '- [ENABLED] Presets' : '- [DISABLED] Presets'}
${config.interface?.prompts !== false ? '- [ENABLED] Custom Prompts' : '- [DISABLED] Custom Prompts'}
${config.interface?.bookmarks !== false ? '- [ENABLED] Bookmarks' : '- [DISABLED] Bookmarks'}
${config.memoryEnabled !== false ? '- [ENABLED] Memory System' : '- [DISABLED] Memory System'}
${config.interface?.artifacts !== false ? '- [ENABLED] Artifacts (Generative UI)' : '- [DISABLED] Artifacts'}
${config.interface?.runCode !== false ? '- [ENABLED] Code Interpreter UI' : '- [DISABLED] Code Interpreter UI'}
${config.interface?.artifacts !== false ? `

### Artifacts Configuration (Generative UI)

Artifacts are **ENABLED** in your configuration. This feature allows AI to generate interactive:
- **React Components**: Dynamic UI elements with state and interactivity
- **HTML/CSS/JS Apps**: Complete web applications rendered in a side panel
- **Mermaid Diagrams**: Flowcharts, sequence diagrams, and data visualizations

#### Agent Capabilities
The following artifact-related capabilities are configured:
${(config.endpoints?.agents?.capabilities ?? ["execute_code", "file_search", "actions", "tools", "artifacts", "context", "ocr", "chain", "web_search"]).filter((cap: string) => ["artifacts", "execute_code", "tools"].includes(cap)).map((cap: string) => {
  const labels: Record<string, string> = {
    "artifacts": "Artifacts (Generative UI)",
    "execute_code": "Execute Code",
    "tools": "Tools"
  };
  return `- [ENABLED] ${labels[cap] || cap}`;
}).join('\n')}

#### Sandpack Bundler
${config.sandpackBundlerUrl ? `- **Mode**: Self-Hosted (Privacy/Compliance)
- **Bundler URL**: \`${config.sandpackBundlerUrl}\`
- **Security**: All code execution stays within your infrastructure` : `- **Mode**: Public Bundler (Default)
- **Provider**: CodeSandbox (https://*.codesandbox.io)
- **Note**: Code is bundled via CodeSandbox's public CDN`}

#### Content Security Policy (CSP) Requirements

If you're using a **reverse proxy** (nginx, Traefik, Caddy) or have **strict CSP headers**, you MUST allow:

\`\`\`nginx
# For artifacts with public bundler:
Content-Security-Policy: "
  frame-src https://*.codesandbox.io;
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  connect-src https://*.codesandbox.io;
"

# For artifacts with self-hosted bundler:
Content-Security-Policy: "
  frame-src ${config.sandpackBundlerUrl || 'YOUR_BUNDLER_URL'};
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  connect-src ${config.sandpackBundlerUrl || 'YOUR_BUNDLER_URL'};
"
\`\`\`

**Why these directives are needed:**
- \`frame-src\`: Allows embedding the Sandpack bundler iframe for code execution
- \`script-src 'unsafe-eval'\`: Required for dynamic code compilation in the bundler
- \`connect-src\`: Allows API calls to the bundler service

**Note**: If artifacts don't render or show CSP errors, check your reverse proxy CSP headers.
` : ''}

### File Upload Settings
- **Max File Size**: ${config.filesMaxSizeMB}MB
- **Max Files per Request**: ${config.filesMaxFilesPerRequest}
- **Allowed Types**: ${config.filesAllowedMimeTypes && config.filesAllowedMimeTypes.length > 0 ? config.filesAllowedMimeTypes.join(', ') : 'Not configured'}

### Rate Limits
- **Per User**: ${config.rateLimitsPerUser} requests
- **Per IP**: ${config.rateLimitsPerIP} requests
- **Uploads**: ${config.rateLimitsUploads} per window
- **TTS**: ${config.rateLimitsTTS} per window
- **STT**: ${config.rateLimitsSTT} per window

### MCP Servers
${(() => {
  if (!config.mcpServers) return 'No MCP servers configured';
  
  let serversToList: [string, any][] = [];
  if (Array.isArray(config.mcpServers)) {
    if (config.mcpServers.length === 0) return 'No MCP servers configured';
    serversToList = config.mcpServers.map((s: any) => [s.name || 'unnamed', s]);
  } else if (typeof config.mcpServers === 'object') {
    if (Object.keys(config.mcpServers).length === 0) return 'No MCP servers configured';
    serversToList = Object.entries(config.mcpServers);
  } else {
    return 'No MCP servers configured';
  }
  
  return serversToList.map(([name, server]: [string, any]) => 
    `- **${name}**: ${server.type || 'streamable-http'} (${server.url || server.command || 'stdio'})`
  ).join('\n');
})()}

## 🔧 Manual Configuration

### Environment Variables (.env)
Key security and application settings are stored in the \`.env\` file:
- JWT secrets for authentication
- Database credentials
- API keys
- Session timeouts

### LibreChat YAML (librechat.yaml)
The main configuration file controls:
- AI model endpoints
- UI feature visibility
- Agent capabilities
- File handling rules
- Rate limiting policies

### Profile File (profile.json)
A complete configuration profile that can be re-imported into the LibreChat Configuration Interface:
- Full configuration backup
- Easy re-loading for future modifications
- Compatible with the Profile > Import Profile feature

## Docker Commands

### Basic Operations
\`\`\`bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f librechat
\`\`\`

### Maintenance
\`\`\`bash
# Update images
docker-compose pull
docker-compose up -d

# Clean up unused images
docker system prune -f
\`\`\`

## 📦 MongoDB Backup & Restore

This package includes scripts to backup and restore your MongoDB database, including all your custom **Agents**, conversations, and user data.

### Creating a Backup

**Linux/macOS:**
\`\`\`bash
chmod +x backup_mongodb.sh
./backup_mongodb.sh
\`\`\`

**Windows:**
\`\`\`cmd
backup_mongodb.bat
\`\`\`

This will create a folder named \`mongodb_backup_YYYYMMDD_HHMMSS\` containing your complete database dump.

### Restoring from Backup

⚠️ **WARNING**: Restore will REPLACE all existing data!

**Linux/macOS:**
\`\`\`bash
chmod +x restore_mongodb.sh
./restore_mongodb.sh
\`\`\`

**Windows:**
\`\`\`cmd
restore_mongodb.bat
\`\`\`

The script will:
1. Find the backup folder automatically
2. Ask for confirmation before proceeding
3. Restore all data including Agents, conversations, and users
4. Clean up temporary files

### Sharing Your Setup

To share your complete LibreChat configuration with someone else:

1. **Create a backup**:
   \`\`\`bash
   ./backup_mongodb.sh  # or backup_mongodb.bat on Windows
   \`\`\`

2. **Package everything**:
   - Copy the backup folder (e.g., \`mongodb_backup_20231210_143022\`)
   - Include all configuration files from this package
   - Share the complete folder

3. **Recipient setup**:
   - Extract all files to a folder
   - Run \`install_dockerimage.sh\` (or \`.bat\` on Windows)
   - Run \`restore_mongodb.sh\` (or \`.bat\` on Windows)
   - Access LibreChat with all your Agents and settings!

### What Gets Backed Up

The backup includes:
- ✅ All custom Agents (configurations, prompts, tools)
- ✅ User accounts and authentication data
- ✅ Conversation history
- ✅ Presets and custom prompts
- ✅ Bookmarks
- ✅ File uploads and attachments
- ✅ All settings and preferences

### Backup Best Practices

1. **Regular Backups**: Create backups before major changes
2. **Version Control**: Keep multiple backup versions
3. **Secure Storage**: Store backups in a safe location
4. **Test Restores**: Verify backups work before you need them
5. **Document Changes**: Note what changed between backups

## 🔐 Security Notes

1. **Change Default Passwords**: Update MongoDB credentials in \`.env\`
2. **Secure API Keys**: Protect your OpenAI and other API keys
3. **JWT Secrets**: Use strong, unique JWT secrets (provided in config)
4. **Network Access**: Configure firewall rules for production use
5. **HTTPS**: Use a reverse proxy with SSL/TLS in production

## Production Deployment

For production use, consider:

1. **Reverse Proxy**: Use Nginx or Caddy for HTTPS termination
2. **Domain Setup**: Configure proper domain name and SSL certificates
3. **Monitoring**: Set up log aggregation and monitoring
4. **Backups**: Regular database and configuration backups
5. **Updates**: Keep LibreChat and dependencies updated

## 📚 Additional Resources

- **LibreChat Documentation**: https://docs.librechat.ai
- **GitHub Repository**: https://github.com/danny-avila/LibreChat
- **Community Support**: https://discord.gg/uDyZ5Tzhct
- **Configuration Guide**: https://docs.librechat.ai/install/configuration

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**
   \`\`\`bash
   # Change port in .env file
   PORT=3081
   \`\`\`

2. **Database Connection Issues**
   \`\`\`bash
   # Check MongoDB logs
   docker-compose logs mongodb
   \`\`\`

3. **Permission Errors**
   \`\`\`bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   \`\`\`

### Getting Help

If you encounter issues:
1. Check the logs: \`docker-compose logs\`
2. Verify your configuration files
3. Check the LibreChat documentation
4. Ask for help in the community Discord

---

**Generated on**: ${new Date().toISOString().split('T')[0]}
**LibreChat Version**: v0.8.0-RC4
**Configuration Schema**: v${config.configVer}
**Support**: https://docs.librechat.ai
`;
}

// NOTE: removeDuplicateEnvKeyFields removed - now using canonicalizeConfiguration from registry-helpers
// which is properly integrated into the storage pipeline for systemic deduplication

// Helper function to remove empty, null, or undefined values from configuration
// This ensures round-trip parity: only export fields that have actual values
function stripEmptyValues(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const filtered = obj.filter(item => item !== null && item !== undefined && item !== '');
    return filtered.length > 0 ? filtered.map(stripEmptyValues) : undefined;
  }
  
  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    
    // Skip empty strings, null, undefined
    if (value === '' || value === null || value === undefined) continue;
    
    // Recursively process objects and arrays
    if (typeof value === 'object') {
      const stripped = stripEmptyValues(value);
      if (stripped !== undefined && Object.keys(stripped).length > 0) {
        result[key] = stripped;
      }
    } else {
      result[key] = value;
    }
  }
  
  return Object.keys(result).length > 0 ? result : undefined;
}

function generateProfileFile(config: any): string {
  const configName = config.configurationName || 'LibreChat Configuration';
  
  // Create structured version metadata (same as client-side export)
  const metadata = createExportMetadata(configName);
  const versionInfo = getVersionInfo();
  
  // CRITICAL ROOT CAUSE FIX: Canonicalize FIRST to remove duplicate envKey fields
  // Package generation bypasses storage pipeline, so we must dedupe here
  console.log('🔍 [DEDUPE DEBUG] Before canonicalization:', Object.keys(config).filter(k => k.toLowerCase().includes('endpoint')));
  const canonicalizedConfig = canonicalizeConfiguration(config);
  console.log('🔍 [DEDUPE DEBUG] After canonicalization:', Object.keys(canonicalizedConfig).filter(k => k.toLowerCase().includes('endpoint')));
  
  // Strip empty/null/undefined values to ensure round-trip parity
  // Only export fields that have actual meaningful values
  const cleanedConfig = stripEmptyValues(canonicalizedConfig) || {};
  console.log('🔍 [DEDUPE DEBUG] After stripEmptyValues:', Object.keys(cleanedConfig).filter(k => k.toLowerCase().includes('endpoint')));
  
  // CRITICAL: Ensure configurationName is ALWAYS present in the configuration object
  // The .bat file requires it at $json.configuration.configurationName
  // This must be preserved even if stripEmptyValues removed it
  cleanedConfig.configurationName = configName;
  
  // Match client-side export structure exactly for 1:1 parity
  const profile = {
    name: configName, // ✅ Same as client: use configurationName directly
    description: `Configuration profile created on ${new Date().toLocaleDateString()}`,
    configuration: cleanedConfig, // ✅ Cleaned configuration (no empty values) + configurationName
    metadata: metadata, // ✨ Structured version metadata for migration support
    // Legacy fields for backward compatibility
    toolVersion: versionInfo.toolVersion,
    librechatTarget: versionInfo.librechatTarget,
    createdAt: new Date().toISOString(),
    exportedFrom: `LibreChat Configuration Manager v${versionInfo.toolVersion}`,
    lastUpdated: versionInfo.lastUpdated,
    changelog: versionInfo.changelog
  };
  
  return JSON.stringify(profile, null, 2);
}

// =============================================================================
// RAILWAY INTEGRATION FUNCTIONS
// =============================================================================

interface HealthCheckResult {
  healthy: boolean;
  uptime?: number;
  response?: string;
  error?: string;
}

// Initiate deployment to Railway platform
async function initiateCloudDeployment(deploymentId: string): Promise<void> {
  try {
    // Update status to building
    await storage.updateDeployment(deploymentId, { 
      status: "building",
      deploymentLogs: ["Starting deployment process..."]
    });

    const deployment = await storage.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Generate Railway deployment configuration
    const railwayConfig = generateRailwayConfig(deployment);
    
    // For now, simulate the deployment process
    // In a real implementation, this would:
    // 1. Create a Railway project
    // 2. Upload the LibreChat Docker configuration
    // 3. Set environment variables
    // 4. Deploy the service
    // 5. Get the public URL
    
    await simulateRailwayDeployment(deployment);
    
  } catch (error: any) {
    console.error(`Deployment ${deploymentId} failed:`, error);
    await storage.updateDeployment(deploymentId, { 
      status: "failed",
      deploymentLogs: [`Deployment failed: ${error.message}`]
    });
    throw error;
  }
}

// Simulate Railway deployment for demo purposes
async function simulateRailwayDeployment(deployment: any): Promise<void> {
  // Simulate building phase
  await storage.updateDeployment(deployment.id, { 
    status: "building",
    deploymentLogs: [
      "Starting deployment process...",
      "Building Docker image...",
      "Configuring environment variables..."
    ]
  });

  // Simulate delay for building
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Simulate deploying phase
  await storage.updateDeployment(deployment.id, { 
    status: "deploying",
    deploymentLogs: [
      "Starting deployment process...",
      "Building Docker image...",
      "Configuring environment variables...",
      "Deploying to Railway...",
      "Allocating resources..."
    ]
  });

  // Simulate delay for deployment
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Generate mock Railway URLs
  const projectId = `librechat-${deployment.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  const publicUrl = `https://${projectId}.railway.app`;
  
  // Mark as successfully deployed
  await storage.updateDeployment(deployment.id, { 
    status: "running",
    platformProjectId: projectId,
    platformServiceId: `service-${projectId}`,
    platformDeploymentId: `deploy-${projectId}`,
    publicUrl: publicUrl,
    adminUrl: `${publicUrl}/admin`,
    deployedAt: new Date(),
    deploymentLogs: [
      "Starting deployment process...",
      "Building Docker image...",
      "Configuring environment variables...",
      "Deploying to Railway...",
      "Allocating resources...",
      "[OK] Deployment successful!",
      `Public URL: ${publicUrl}`,
      `Admin access: ${publicUrl}/admin`
    ]
  });
}

// Generate Railway-specific configuration
function generateRailwayConfig(deployment: any): any {
  return {
    name: deployment.name,
    image: "ghcr.io/danny-avila/librechat-dev:latest",
    environment: {
      // Database
      MONGO_URI: "mongodb://mongo:27017/LibreChat",
      REDIS_URI: "redis://redis:6379",
      
      // Application
      HOST: deployment.configuration.host,
      PORT: "3080",
      NODE_ENV: "production",
      
      // Security (would be generated securely in real implementation)
      JWT_SECRET: deployment.configuration.jwtSecret || generateSecureSecret(32),
      JWT_REFRESH_SECRET: deployment.configuration.jwtRefreshSecret || generateSecureSecret(32),
      CREDS_KEY: deployment.configuration.credsKey || generateHexSecret(32),
      CREDS_IV: deployment.configuration.credsIV || generateHexSecret(16),
      
      // API Keys
      OPENAI_API_KEY: deployment.configuration.openaiApiKey || "",
      
      // Features
      ALLOW_REGISTRATION: deployment.configuration.enableRegistration.toString(),
      DEBUG_LOGGING: deployment.configuration.debugLogging.toString(),
    },
    services: [
      {
        name: "mongodb",
        image: "mongo:7.0",
        environment: {
          MONGO_INITDB_ROOT_USERNAME: deployment.configuration.mongoRootUsername,
          MONGO_INITDB_ROOT_PASSWORD: deployment.configuration.mongoRootPassword,
          MONGO_INITDB_DATABASE: deployment.configuration.mongoDbName
        }
      },
      {
        name: "redis",
        image: "redis:7-alpine"
      }
    ]
  };
}

// Generate secure random secrets (alphanumeric)
function generateSecureSecret(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate secure random hex strings for encryption keys
// LibreChat requires: CREDS_KEY = 32 bytes (64 hex chars), CREDS_IV = 16 bytes (32 hex chars)
function generateHexSecret(byteLength: number): string {
  const hexChars = '0123456789abcdef';
  let result = '';
  // Each byte = 2 hex characters
  for (let i = 0; i < byteLength * 2; i++) {
    result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return result;
}

// Cleanup cloud deployment resources
async function cleanupCloudDeployment(deployment: any): Promise<void> {
  try {
    console.log(`Cleaning up Railway deployment: ${deployment.platformProjectId}`);
    
    // In a real implementation, this would:
    // 1. Delete the Railway project
    // 2. Clean up associated resources
    // 3. Remove any DNS records
    
    // For simulation, just update the status
    await storage.updateDeployment(deployment.id, { 
      status: "stopped",
      deploymentLogs: [
        ...deployment.deploymentLogs,
        "[STOPPED] Deployment stopped",
        "Cleaning up resources..."
      ]
    });
    
  } catch (error: any) {
    console.error(`Failed to cleanup deployment ${deployment.id}:`, error);
    throw error;
  }
}

// Perform health check on deployed instance
async function performHealthCheck(url: string): Promise<HealthCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        healthy: true,
        response: `HTTP ${response.status} ${response.statusText}`,
        uptime: Date.now() // Simplified uptime calculation
      };
    } else {
      return {
        healthy: false,
        error: `HTTP ${response.status} ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Failed to reach deployment'
    };
  }
}
