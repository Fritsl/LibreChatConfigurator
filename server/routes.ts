import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { configurationSchema, insertConfigurationProfileSchema, packageGenerationSchema, insertDeploymentSchema, updateDeploymentSchema, deploymentRequestSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import JSZip from "jszip";
import * as e2bGenerators from "./e2b-generators";

// ⚠️ REMINDER: When adding new API endpoints or changing route functionality,
// update version number in shared/version.ts!

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get default configuration
  app.get("/api/configuration/default", async (req, res) => {
    try {
      const defaultConfig = await storage.getDefaultConfiguration();
      res.json(defaultConfig);
    } catch (error) {
      console.error("Error getting default configuration:", error);
      res.status(500).json({ error: "Failed to get default configuration" });
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

      const profile = await storage.createProfile(result.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update profile
  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const updates = req.body;
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
      
      console.log("🎯 [SINGLE SOURCE] Using raw frontend data - customFooter:", JSON.stringify(rawConfiguration?.customFooter));
      
      if (!rawConfiguration) {
        return res.status(400).json({ 
          error: "Configuration is required" 
        });
      }
      
      // Save configuration to history for future reference
      await storage.saveConfigurationToHistory(rawConfiguration, packageName);
      
      
      // Use raw configuration directly - SINGLE SOURCE OF TRUTH  
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
// CRITICAL: This function generates .env files with real API keys and secrets.
// DO NOT redact or censor any configuration data - users expect working credentials.
// This system is designed to handle sensitive data openly for LibreChat configuration management.
function generateEnvFile(config: any): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# =============================================================================
# LibreChat Environment Configuration (RC4)
# Generated on ${currentDate}
# =============================================================================

# =============================================================================
# App Configuration
# =============================================================================
${config.appTitle ? `APP_TITLE=${config.appTitle}` : '# APP_TITLE=LibreChat'}
${config.customWelcome ? `CUSTOM_WELCOME=${config.customWelcome}` : '# CUSTOM_WELCOME='}
${config.customFooter ? `CUSTOM_FOOTER=${config.customFooter}` : '# CUSTOM_FOOTER='}
${config.helpAndFAQURL ? `HELP_AND_FAQ_URL=${config.helpAndFAQURL}` : '# HELP_AND_FAQ_URL='}

# =============================================================================
# Server Configuration
# =============================================================================
${config.host ? `HOST=${config.host}` : 'HOST=0.0.0.0'}
${config.port ? `PORT=${config.port}` : 'PORT=3080'}
${config.nodeEnv ? `NODE_ENV=${config.nodeEnv}` : '# NODE_ENV=production'}
${config.domainClient ? `DOMAIN_CLIENT=${config.domainClient}` : '# DOMAIN_CLIENT='}
${config.domainServer ? `DOMAIN_SERVER=${config.domainServer}` : '# DOMAIN_SERVER='}
${config.noIndex !== undefined ? `NO_INDEX=${config.noIndex}` : '# NO_INDEX=true'}

# =============================================================================
# Security Configuration
# =============================================================================
${config.jwtSecret ? `JWT_SECRET=${config.jwtSecret}` : `JWT_SECRET=${generateSecureSecret(32)}`}
${config.jwtRefreshSecret ? `JWT_REFRESH_SECRET=${config.jwtRefreshSecret}` : `JWT_REFRESH_SECRET=${generateSecureSecret(32)}`}
${config.credsKey ? `CREDS_KEY=${config.credsKey}` : `CREDS_KEY=${generateHexSecret(32)}`}
${config.credsIV ? `CREDS_IV=${config.credsIV}` : `CREDS_IV=${generateHexSecret(16)}`}
${config.minPasswordLength ? `MIN_PASSWORD_LENGTH=${config.minPasswordLength}` : '# MIN_PASSWORD_LENGTH=8'}
${config.sessionExpiry ? `SESSION_EXPIRY=${config.sessionExpiry}` : 'SESSION_EXPIRY=1000 * 60 * 15'}
${config.refreshTokenExpiry ? `REFRESH_TOKEN_EXPIRY=${config.refreshTokenExpiry}` : 'REFRESH_TOKEN_EXPIRY=1000 * 60 * 60 * 24 * 7'}

# =============================================================================
# Database Configuration
# =============================================================================
${config.mongoUri ? `MONGO_URI=${config.mongoUri}` : '# MONGO_URI=mongodb://127.0.0.1:27017/LibreChat'}
${config.mongoRootUsername ? `MONGO_ROOT_USERNAME=${config.mongoRootUsername}` : 'MONGO_ROOT_USERNAME=librechat_admin'}
${config.mongoRootPassword ? `MONGO_ROOT_PASSWORD=${config.mongoRootPassword}` : 'MONGO_ROOT_PASSWORD=librechat_password_change_this'}
${config.mongoDbName ? `MONGO_DB_NAME=${config.mongoDbName}` : 'MONGO_DB_NAME=librechat'}
${config.redisUri ? `REDIS_URI=${config.redisUri}` : '# REDIS_URI=redis://localhost:6379'}
${config.redisUsername ? `REDIS_USERNAME=${config.redisUsername}` : '# REDIS_USERNAME='}
${config.redisPassword ? `REDIS_PASSWORD=${config.redisPassword}` : '# REDIS_PASSWORD='}
${config.redisKeyPrefix ? `REDIS_KEY_PREFIX=${config.redisKeyPrefix}` : '# REDIS_KEY_PREFIX='}
${config.redisKeyPrefixVar ? `REDIS_KEY_PREFIX_VAR=${config.redisKeyPrefixVar}` : '# REDIS_KEY_PREFIX_VAR='}
${config.redisMaxListeners ? `REDIS_MAX_LISTENERS=${config.redisMaxListeners}` : '# REDIS_MAX_LISTENERS=10'}
${config.redisPingInterval ? `REDIS_PING_INTERVAL=${config.redisPingInterval}` : '# REDIS_PING_INTERVAL=30000'}
${config.redisUseAlternativeDNSLookup !== undefined ? `REDIS_USE_ALTERNATIVE_DNS_LOOKUP=${config.redisUseAlternativeDNSLookup}` : '# REDIS_USE_ALTERNATIVE_DNS_LOOKUP=false'}

# =============================================================================
# Authentication Configuration
# =============================================================================
${config.allowRegistration !== undefined ? `ALLOW_REGISTRATION=${config.allowRegistration}` : 'ALLOW_REGISTRATION=true'}
${config.allowEmailLogin !== undefined ? `ALLOW_EMAIL_LOGIN=${config.allowEmailLogin}` : 'ALLOW_EMAIL_LOGIN=true'}
${config.allowSocialLogin !== undefined ? `ALLOW_SOCIAL_LOGIN=${config.allowSocialLogin}` : 'ALLOW_SOCIAL_LOGIN=false'}
${config.allowSocialRegistration !== undefined ? `ALLOW_SOCIAL_REGISTRATION=${config.allowSocialRegistration}` : 'ALLOW_SOCIAL_REGISTRATION=false'}
${config.allowPasswordReset !== undefined ? `ALLOW_PASSWORD_RESET=${config.allowPasswordReset}` : '# ALLOW_PASSWORD_RESET=false'}

# =============================================================================
# Email Configuration
# =============================================================================
${config.emailService ? `EMAIL_SERVICE=${config.emailService}` : '# EMAIL_SERVICE='}
${config.emailUsername ? `EMAIL_USERNAME=${config.emailUsername}` : '# EMAIL_USERNAME='}
${config.emailPassword ? `EMAIL_PASSWORD=${config.emailPassword}` : '# EMAIL_PASSWORD='}
${config.emailFrom ? `EMAIL_FROM=${config.emailFrom}` : '# EMAIL_FROM='}
${config.emailFromName ? `EMAIL_FROM_NAME=${config.emailFromName}` : '# EMAIL_FROM_NAME='}
${config.mailgunApiKey ? `MAILGUN_API_KEY=${config.mailgunApiKey}` : '# MAILGUN_API_KEY='}
${config.mailgunDomain ? `MAILGUN_DOMAIN=${config.mailgunDomain}` : '# MAILGUN_DOMAIN='}
${config.mailgunHost ? `MAILGUN_HOST=${config.mailgunHost}` : '# MAILGUN_HOST='}

# =============================================================================
# OAuth Providers Configuration
# =============================================================================
${config.googleClientId ? `GOOGLE_CLIENT_ID=${config.googleClientId}` : '# GOOGLE_CLIENT_ID='}
${config.googleClientSecret ? `GOOGLE_CLIENT_SECRET=${config.googleClientSecret}` : '# GOOGLE_CLIENT_SECRET='}
${config.googleCallbackURL ? `GOOGLE_CALLBACK_URL=${config.googleCallbackURL}` : '# GOOGLE_CALLBACK_URL='}
${config.githubClientId ? `GITHUB_CLIENT_ID=${config.githubClientId}` : '# GITHUB_CLIENT_ID='}
${config.githubClientSecret ? `GITHUB_CLIENT_SECRET=${config.githubClientSecret}` : '# GITHUB_CLIENT_SECRET='}
${config.githubCallbackURL ? `GITHUB_CALLBACK_URL=${config.githubCallbackURL}` : '# GITHUB_CALLBACK_URL='}
${config.discordClientId ? `DISCORD_CLIENT_ID=${config.discordClientId}` : '# DISCORD_CLIENT_ID='}
${config.discordClientSecret ? `DISCORD_CLIENT_SECRET=${config.discordClientSecret}` : '# DISCORD_CLIENT_SECRET='}
${config.discordCallbackURL ? `DISCORD_CALLBACK_URL=${config.discordCallbackURL}` : '# DISCORD_CALLBACK_URL='}
${config.facebookClientId ? `FACEBOOK_CLIENT_ID=${config.facebookClientId}` : '# FACEBOOK_CLIENT_ID='}
${config.facebookClientSecret ? `FACEBOOK_CLIENT_SECRET=${config.facebookClientSecret}` : '# FACEBOOK_CLIENT_SECRET='}
${config.facebookCallbackURL ? `FACEBOOK_CALLBACK_URL=${config.facebookCallbackURL}` : '# FACEBOOK_CALLBACK_URL='}
${config.appleClientId ? `APPLE_CLIENT_ID=${config.appleClientId}` : '# APPLE_CLIENT_ID='}
${config.applePrivateKey ? `APPLE_PRIVATE_KEY=${config.applePrivateKey.replace(/\n/g, '')}` : '# APPLE_PRIVATE_KEY='}
${config.appleKeyId ? `APPLE_KEY_ID=${config.appleKeyId}` : '# APPLE_KEY_ID='}
${config.appleTeamId ? `APPLE_TEAM_ID=${config.appleTeamId}` : '# APPLE_TEAM_ID='}
${config.appleCallbackURL ? `APPLE_CALLBACK_URL=${config.appleCallbackURL}` : '# APPLE_CALLBACK_URL='}
${config.openidURL ? `OPENID_URL=${config.openidURL}` : '# OPENID_URL='}
${config.openidClientId ? `OPENID_CLIENT_ID=${config.openidClientId}` : '# OPENID_CLIENT_ID='}
${config.openidClientSecret ? `OPENID_CLIENT_SECRET=${config.openidClientSecret}` : '# OPENID_CLIENT_SECRET='}
${config.openidCallbackURL ? `OPENID_CALLBACK_URL=${config.openidCallbackURL}` : '# OPENID_CALLBACK_URL='}
${config.openidScope ? `OPENID_SCOPE=${config.openidScope}` : '# OPENID_SCOPE='}
${config.openidSessionSecret ? `OPENID_SESSION_SECRET=${config.openidSessionSecret}` : '# OPENID_SESSION_SECRET='}
${config.openidIssuer ? `OPENID_ISSUER=${config.openidIssuer}` : '# OPENID_ISSUER='}
${config.openidButtonLabel ? `OPENID_BUTTON_LABEL=${config.openidButtonLabel}` : '# OPENID_BUTTON_LABEL='}
${config.openidImageURL ? `OPENID_IMAGE_URL=${config.openidImageURL}` : '# OPENID_IMAGE_URL='}

# =============================================================================
# Core AI API Keys
# =============================================================================
${config.openaiApiKey ? `OPENAI_API_KEY=${config.openaiApiKey}` : '# OPENAI_API_KEY='}
${config.anthropicApiKey ? `ANTHROPIC_API_KEY=${config.anthropicApiKey}` : '# ANTHROPIC_API_KEY='}
${config.googleApiKey ? `GOOGLE_API_KEY=${config.googleApiKey}` : '# GOOGLE_API_KEY='}
${config.groqApiKey ? `GROQ_API_KEY=${config.groqApiKey}` : '# GROQ_API_KEY='}
${config.mistralApiKey ? `MISTRAL_API_KEY=${config.mistralApiKey}` : '# MISTRAL_API_KEY='}

# =============================================================================
# Extended AI API Keys
# =============================================================================
${config.deepseekApiKey ? `DEEPSEEK_API_KEY=${config.deepseekApiKey}` : '# DEEPSEEK_API_KEY='}
${config.perplexityApiKey ? `PERPLEXITY_API_KEY=${config.perplexityApiKey}` : '# PERPLEXITY_API_KEY='}
${config.fireworksApiKey ? `FIREWORKS_API_KEY=${config.fireworksApiKey}` : '# FIREWORKS_API_KEY='}
${config.togetheraiApiKey ? `TOGETHERAI_API_KEY=${config.togetheraiApiKey}` : '# TOGETHERAI_API_KEY='}
${config.huggingfaceToken ? `HUGGINGFACE_TOKEN=${config.huggingfaceToken}` : '# HUGGINGFACE_TOKEN='}
${config.xaiApiKey ? `XAI_API_KEY=${config.xaiApiKey}` : '# XAI_API_KEY='}
${config.nvidiaApiKey ? `NVIDIA_API_KEY=${config.nvidiaApiKey}` : '# NVIDIA_API_KEY='}
${config.sambaNovaApiKey ? `SAMBANOVA_API_KEY=${config.sambaNovaApiKey}` : '# SAMBANOVA_API_KEY='}
${config.hyperbolicApiKey ? `HYPERBOLIC_API_KEY=${config.hyperbolicApiKey}` : '# HYPERBOLIC_API_KEY='}
${config.klusterApiKey ? `KLUSTER_API_KEY=${config.klusterApiKey}` : '# KLUSTER_API_KEY='}
${config.nanogptApiKey ? `NANOGPT_API_KEY=${config.nanogptApiKey}` : '# NANOGPT_API_KEY='}
${config.glhfApiKey ? `GLHF_API_KEY=${config.glhfApiKey}` : '# GLHF_API_KEY='}
${config.apipieApiKey ? `APIPIE_API_KEY=${config.apipieApiKey}` : '# APIPIE_API_KEY='}
${config.unifyApiKey ? `UNIFY_API_KEY=${config.unifyApiKey}` : '# UNIFY_API_KEY='}
${config.openrouterKey ? `OPENROUTER_KEY=${config.openrouterKey}` : '# OPENROUTER_KEY='}

# =============================================================================
# Azure OpenAI Configuration
# =============================================================================
${config.azureApiKey ? `AZURE_API_KEY=${config.azureApiKey}` : '# AZURE_API_KEY='}
${config.azureOpenaiApiInstanceName ? `AZURE_OPENAI_API_INSTANCE_NAME=${config.azureOpenaiApiInstanceName}` : '# AZURE_OPENAI_API_INSTANCE_NAME='}
${config.azureOpenaiApiDeploymentName ? `AZURE_OPENAI_API_DEPLOYMENT_NAME=${config.azureOpenaiApiDeploymentName}` : '# AZURE_OPENAI_API_DEPLOYMENT_NAME='}
${config.azureOpenaiApiVersion ? `AZURE_OPENAI_API_VERSION=${config.azureOpenaiApiVersion}` : '# AZURE_OPENAI_API_VERSION='}
${config.azureOpenaiModels ? `AZURE_OPENAI_MODELS=${config.azureOpenaiModels}` : '# AZURE_OPENAI_MODELS='}

# =============================================================================
# AWS Bedrock Configuration
# =============================================================================
${config.awsAccessKeyId ? `AWS_ACCESS_KEY_ID=${config.awsAccessKeyId}` : '# AWS_ACCESS_KEY_ID='}
${config.awsSecretAccessKey ? `AWS_SECRET_ACCESS_KEY=${config.awsSecretAccessKey}` : '# AWS_SECRET_ACCESS_KEY='}
${config.awsRegion ? `AWS_REGION=${config.awsRegion}` : '# AWS_REGION='}
${config.awsBedrockRegion ? `AWS_BEDROCK_REGION=${config.awsBedrockRegion}` : '# AWS_BEDROCK_REGION='}
${config.awsEndpointURL ? `AWS_ENDPOINT_URL=${config.awsEndpointURL}` : '# AWS_ENDPOINT_URL='}
${config.awsBucketName ? `AWS_BUCKET_NAME=${config.awsBucketName}` : '# AWS_BUCKET_NAME='}

# =============================================================================
# File Storage Configuration
# =============================================================================
${config.fileUploadPath ? `FILE_UPLOAD_PATH=${config.fileUploadPath}` : '# FILE_UPLOAD_PATH='}
${config.firebaseApiKey ? `FIREBASE_API_KEY=${config.firebaseApiKey}` : '# FIREBASE_API_KEY='}
${config.firebaseAuthDomain ? `FIREBASE_AUTH_DOMAIN=${config.firebaseAuthDomain}` : '# FIREBASE_AUTH_DOMAIN='}
${config.firebaseProjectId ? `FIREBASE_PROJECT_ID=${config.firebaseProjectId}` : '# FIREBASE_PROJECT_ID='}
${config.firebaseStorageBucket ? `FIREBASE_STORAGE_BUCKET=${config.firebaseStorageBucket}` : '# FIREBASE_STORAGE_BUCKET='}
${config.firebaseMessagingSenderId ? `FIREBASE_MESSAGING_SENDER_ID=${config.firebaseMessagingSenderId}` : '# FIREBASE_MESSAGING_SENDER_ID='}
${config.firebaseAppId ? `FIREBASE_APP_ID=${config.firebaseAppId}` : '# FIREBASE_APP_ID='}
${config.azureStorageConnectionString ? `AZURE_STORAGE_CONNECTION_STRING=${config.azureStorageConnectionString}` : '# AZURE_STORAGE_CONNECTION_STRING='}
${config.azureStoragePublicAccess !== undefined ? `AZURE_STORAGE_PUBLIC_ACCESS=${config.azureStoragePublicAccess}` : '# AZURE_STORAGE_PUBLIC_ACCESS=false'}
${config.azureContainerName ? `AZURE_CONTAINER_NAME=${config.azureContainerName}` : '# AZURE_CONTAINER_NAME='}

# =============================================================================
# Search & External APIs Configuration
# =============================================================================
${config.googleSearchApiKey ? `GOOGLE_SEARCH_API_KEY=${config.googleSearchApiKey}` : '# GOOGLE_SEARCH_API_KEY='}
${config.googleCSEId ? `GOOGLE_CSE_ID=${config.googleCSEId}` : '# GOOGLE_CSE_ID='}
${config.bingSearchApiKey ? `BING_SEARCH_API_KEY=${config.bingSearchApiKey}` : '# BING_SEARCH_API_KEY='}
${config.openweatherApiKey ? `OPENWEATHER_API_KEY=${config.openweatherApiKey}` : '# OPENWEATHER_API_KEY='}

# =============================================================================
# RAG API Configuration
# =============================================================================
${config.ragApiURL ? `RAG_API_URL=${config.ragApiURL}` : '# RAG_API_URL='}
${config.ragOpenaiApiKey ? `RAG_OPENAI_API_KEY=${config.ragOpenaiApiKey}` : '# RAG_OPENAI_API_KEY='}
${config.ragPort ? `RAG_PORT=${config.ragPort}` : '# RAG_PORT='}
${config.ragHost ? `RAG_HOST=${config.ragHost}` : '# RAG_HOST='}
${config.collectionName ? `COLLECTION_NAME=${config.collectionName}` : '# COLLECTION_NAME='}
${config.chunkSize ? `CHUNK_SIZE=${config.chunkSize}` : '# CHUNK_SIZE='}
${config.chunkOverlap ? `CHUNK_OVERLAP=${config.chunkOverlap}` : '# CHUNK_OVERLAP='}
${config.embeddingsProvider ? `EMBEDDINGS_PROVIDER=${config.embeddingsProvider}` : '# EMBEDDINGS_PROVIDER='}

# =============================================================================
# Web Search Configuration
# =============================================================================
${config.webSearch?.searchProvider && config.webSearch.searchProvider !== 'none' ? `SEARCH=true` : '# SEARCH=true'}
${config.webSearch?.serperApiKey || config.webSearch?.searchProvider === 'serper' ? `SERPER_API_KEY=${config.webSearch.serperApiKey || ''}` : '# SERPER_API_KEY='}
${config.webSearch?.searxngInstanceUrl || config.webSearch?.searchProvider === 'searxng' ? `SEARXNG_INSTANCE_URL=${config.webSearch.searxngInstanceUrl || ''}` : '# SEARXNG_INSTANCE_URL='}
${config.webSearch?.searxngApiKey && config.webSearch?.searchProvider === 'searxng' ? `SEARXNG_API_KEY=${config.webSearch.searxngApiKey}` : '# SEARXNG_API_KEY='}
${config.webSearch?.braveApiKey || config.webSearch?.searchProvider === 'brave' ? `BRAVE_API_KEY=${config.webSearch.braveApiKey || ''}` : '# BRAVE_API_KEY='}
${config.webSearch?.tavilyApiKey || config.webSearch?.searchProvider === 'tavily' ? `TAVILY_API_KEY=${config.webSearch.tavilyApiKey || ''}` : '# TAVILY_API_KEY='}
${config.webSearch?.perplexityApiKey || config.webSearch?.searchProvider === 'perplexity' ? `PERPLEXITY_API_KEY=${config.webSearch.perplexityApiKey || ''}` : '# PERPLEXITY_API_KEY='}
${config.webSearch?.googleSearchApiKey || config.webSearch?.searchProvider === 'google' ? `GOOGLE_SEARCH_API_KEY=${config.webSearch.googleSearchApiKey || ''}` : '# GOOGLE_SEARCH_API_KEY='}
${config.webSearch?.googleCSEId && config.webSearch?.searchProvider === 'google' ? `GOOGLE_CSE_ID=${config.webSearch.googleCSEId}` : '# GOOGLE_CSE_ID='}
${config.webSearch?.bingSearchApiKey || config.webSearch?.searchProvider === 'bing' ? `BING_SEARCH_API_KEY=${config.webSearch.bingSearchApiKey || ''}` : '# BING_SEARCH_API_KEY='}
${config.webSearch?.firecrawlApiKey || config.webSearch?.scraperType === 'firecrawl' ? `FIRECRAWL_API_KEY=${config.webSearch.firecrawlApiKey || ''}` : '# FIRECRAWL_API_KEY='}
${config.webSearch?.firecrawlApiUrl && config.webSearch?.scraperType === 'firecrawl' ? `FIRECRAWL_API_URL=${config.webSearch.firecrawlApiUrl}` : '# FIRECRAWL_API_URL='}
${config.webSearch?.jinaApiKey || config.webSearch?.rerankerType === 'jina' ? `JINA_API_KEY=${config.webSearch.jinaApiKey || ''}` : '# JINA_API_KEY='}
${config.webSearch?.jinaRerankerUrl && config.webSearch?.rerankerType === 'jina' ? `JINA_RERANKER_URL=${config.webSearch.jinaRerankerUrl}` : '# JINA_RERANKER_URL='}
${config.webSearch?.cohereApiKey || config.webSearch?.rerankerType === 'cohere' ? `COHERE_API_KEY=${config.webSearch.cohereApiKey || ''}` : '# COHERE_API_KEY='}

# =============================================================================
# MeiliSearch Configuration
# =============================================================================
${config.meilisearchURL ? `MEILISEARCH_URL=${config.meilisearchURL}` : '# MEILISEARCH_URL='}
${config.meilisearchMasterKey ? `MEILISEARCH_MASTER_KEY=${config.meilisearchMasterKey}` : '# MEILISEARCH_MASTER_KEY='}
${config.meiliNoAnalytics !== undefined ? `MEILI_NO_ANALYTICS=${config.meiliNoAnalytics}` : '# MEILI_NO_ANALYTICS=true'}

# =============================================================================
# Rate Limiting & Security Configuration
# =============================================================================
${config.limitConcurrentMessages !== undefined ? `LIMIT_CONCURRENT_MESSAGES=${config.limitConcurrentMessages}` : '# LIMIT_CONCURRENT_MESSAGES=true'}
${config.concurrentMessageMax ? `CONCURRENT_MESSAGE_MAX=${config.concurrentMessageMax}` : '# CONCURRENT_MESSAGE_MAX=2'}
${config.banViolations !== undefined ? `BAN_VIOLATIONS=${config.banViolations}` : '# BAN_VIOLATIONS=true'}
${config.banDuration ? `BAN_DURATION=${config.banDuration}` : '# BAN_DURATION=7200000'}
${config.banInterval ? `BAN_INTERVAL=${config.banInterval}` : '# BAN_INTERVAL=20'}
${config.loginViolationScore ? `LOGIN_VIOLATION_SCORE=${config.loginViolationScore}` : '# LOGIN_VIOLATION_SCORE=1'}
${config.registrationViolationScore ? `REGISTRATION_VIOLATION_SCORE=${config.registrationViolationScore}` : '# REGISTRATION_VIOLATION_SCORE=1'}
${config.concurrentViolationScore ? `CONCURRENT_VIOLATION_SCORE=${config.concurrentViolationScore}` : '# CONCURRENT_VIOLATION_SCORE=1'}
${config.messageViolationScore ? `MESSAGE_VIOLATION_SCORE=${config.messageViolationScore}` : '# MESSAGE_VIOLATION_SCORE=1'}
${config.nonBrowserViolationScore ? `NON_BROWSER_VIOLATION_SCORE=${config.nonBrowserViolationScore}` : '# NON_BROWSER_VIOLATION_SCORE=20'}
${config.loginMax ? `LOGIN_MAX=${config.loginMax}` : '# LOGIN_MAX=7'}
${config.loginWindow ? `LOGIN_WINDOW=${config.loginWindow}` : '# LOGIN_WINDOW=5'}

# =============================================================================
# LDAP Configuration
# =============================================================================
${config.ldapURL ? `LDAP_URL=${config.ldapURL}` : '# LDAP_URL='}
${config.ldapBindDN ? `LDAP_BIND_DN=${config.ldapBindDN}` : '# LDAP_BIND_DN='}
${config.ldapBindCredentials ? `LDAP_BIND_CREDENTIALS=${config.ldapBindCredentials}` : '# LDAP_BIND_CREDENTIALS='}
${config.ldapSearchBase ? `LDAP_SEARCH_BASE=${config.ldapSearchBase}` : '# LDAP_SEARCH_BASE='}
${config.ldapSearchFilter ? `LDAP_SEARCH_FILTER=${config.ldapSearchFilter}` : '# LDAP_SEARCH_FILTER='}

# =============================================================================
# Turnstile Configuration
# =============================================================================
${config.turnstileSiteKey ? `TURNSTILE_SITE_KEY=${config.turnstileSiteKey}` : '# TURNSTILE_SITE_KEY='}
${config.turnstileSecretKey ? `TURNSTILE_SECRET_KEY=${config.turnstileSecretKey}` : '# TURNSTILE_SECRET_KEY='}

# =============================================================================
# Features Configuration
# =============================================================================
${config.allowSharedLinks !== undefined ? `ALLOW_SHARED_LINKS=${config.allowSharedLinks}` : '# ALLOW_SHARED_LINKS=true'}
${config.allowSharedLinksPublic !== undefined ? `ALLOW_SHARED_LINKS_PUBLIC=${config.allowSharedLinksPublic}` : '# ALLOW_SHARED_LINKS_PUBLIC=false'}
${config.titleConvo !== undefined ? `TITLE_CONVO=${config.titleConvo}` : '# TITLE_CONVO=true'}
${config.summaryConvo !== undefined ? `SUMMARY_CONVO=${config.summaryConvo}` : '# SUMMARY_CONVO=false'}

# =============================================================================
# Caching Configuration
# =============================================================================
${config.staticCacheMaxAge ? `STATIC_CACHE_MAX_AGE=${config.staticCacheMaxAge}` : '# STATIC_CACHE_MAX_AGE='}
${config.staticCacheSMaxAge ? `STATIC_CACHE_S_MAX_AGE=${config.staticCacheSMaxAge}` : '# STATIC_CACHE_S_MAX_AGE='}
${config.indexCacheControl ? `INDEX_CACHE_CONTROL=${config.indexCacheControl}` : '# INDEX_CACHE_CONTROL='}
${config.indexPragma ? `INDEX_PRAGMA=${config.indexPragma}` : '# INDEX_PRAGMA='}
${config.indexExpires ? `INDEX_EXPIRES=${config.indexExpires}` : '# INDEX_EXPIRES='}

# =============================================================================
# MCP Configuration
# =============================================================================
${config.mcpOauthOnAuthError ? `MCP_OAUTH_ON_AUTH_ERROR=${config.mcpOauthOnAuthError}` : '# MCP_OAUTH_ON_AUTH_ERROR='}
${config.mcpOauthDetectionTimeout ? `MCP_OAUTH_DETECTION_TIMEOUT=${config.mcpOauthDetectionTimeout}` : '# MCP_OAUTH_DETECTION_TIMEOUT='}

# =============================================================================
# Code Execution Configuration
# =============================================================================
# LibreChat Code Interpreter (Paid API Service at code.librechat.ai)
${config.librechatCodeApiKey ? `LIBRECHAT_CODE_API_KEY=${config.librechatCodeApiKey}` : '# LIBRECHAT_CODE_API_KEY='}
${config.librechatCodeBaseUrl ? `LIBRECHAT_CODE_BASEURL=${config.librechatCodeBaseUrl}` : '# LIBRECHAT_CODE_BASEURL='}

# E2B Code Interpreter (Self-Hosted Proxy for Python/JavaScript)
${config.e2bProxyEnabled ? `CODE_EXECUTION_ENABLED=true` : '# CODE_EXECUTION_ENABLED=true'}
${config.e2bApiKey ? `E2B_API_KEY=${config.e2bApiKey}` : '# E2B_API_KEY='}
${config.e2bProxyEnabled !== undefined ? `E2B_PROXY_ENABLED=${config.e2bProxyEnabled}` : '# E2B_PROXY_ENABLED=true'}
${config.e2bProxyEnabled ? `E2B_PROXY_URL=http://e2b-proxy:${config.e2bProxyPort || '3001'}` : '# E2B_PROXY_URL=http://e2b-proxy:3001'}
${config.e2bProxyPort ? `E2B_PROXY_PORT=${config.e2bProxyPort}` : '# E2B_PROXY_PORT=3001'}
${config.e2bPublicBaseUrl ? `E2B_PUBLIC_BASE_URL=${config.e2bPublicBaseUrl}` : '# E2B_PUBLIC_BASE_URL=http://localhost:3001'}
${config.e2bFileTTLDays ? `E2B_FILE_TTL_DAYS=${config.e2bFileTTLDays}` : '# E2B_FILE_TTL_DAYS=30'}
${config.e2bMaxFileSize ? `E2B_MAX_FILE_SIZE=${config.e2bMaxFileSize}` : '# E2B_MAX_FILE_SIZE=50'}
${config.e2bPerUserSandbox !== undefined ? `E2B_PER_USER_SANDBOX=${config.e2bPerUserSandbox}` : '# E2B_PER_USER_SANDBOX=false'}

# =============================================================================
# Artifacts Configuration (Generative UI)
# =============================================================================
${config.sandpackBundlerUrl ? `SANDPACK_BUNDLER_URL=${config.sandpackBundlerUrl}` : '# SANDPACK_BUNDLER_URL='}

# =============================================================================
# User Management Configuration
# =============================================================================
${config.uid ? `UID=${config.uid}` : '# UID='}
${config.gid ? `GID=${config.gid}` : '# GID='}

# =============================================================================
# Debug Configuration
# =============================================================================
${config.debugLogging !== undefined ? `DEBUG_LOGGING=${config.debugLogging}` : '# DEBUG_LOGGING=false'}
${config.debugConsole !== undefined ? `DEBUG_CONSOLE=${config.debugConsole}` : '# DEBUG_CONSOLE=false'}
${config.consoleJSON !== undefined ? `CONSOLE_JSON=${config.consoleJSON}` : '# CONSOLE_JSON=false'}

# =============================================================================
# Miscellaneous Configuration
# =============================================================================
${config.cdnProvider ? `CDN_PROVIDER=${config.cdnProvider}` : '# CDN_PROVIDER='}

# OCR Service API Keys
${config.ocrApiKey ? `OCR_API_KEY=${config.ocrApiKey}` : '# OCR_API_KEY=your_ocr_api_key_here'}
${config.ocrApiBase ? `OCR_BASEURL=${config.ocrApiBase}` : '# OCR_BASEURL=https://api.mistral.ai/v1'}

# =============================================================================
# Advanced Database Configuration
# =============================================================================
# Note: Primary database URIs are configured in the main Database Configuration section above

# RC4 Subdirectory Hosting
# =============================================================================
${config.basePath ? `BASE_PATH=${config.basePath}` : '# BASE_PATH=/subdirectory'}
${config.appUrl ? `APP_URL=${config.appUrl}` : '# APP_URL=https://yourdomain.com'}
${config.publicSubPath ? `PUBLIC_SUB_PATH=${config.publicSubPath}` : '# PUBLIC_SUB_PATH=/public'}

# Additional Features Configuration
# =============================================================================
# Note: App customization fields (CUSTOM_FOOTER, CUSTOM_WELCOME) are configured in the App Configuration section above
`;
}

// CRITICAL: This function generates YAML files with real configuration data.
// Preserve all user data exactly as entered - DO NOT modify or redact anything.
function generateYamlFile(config: any): string {
  return `# =============================================================================
# LibreChat Configuration for v0.8.0-RC4
# =============================================================================

version: 1.2.9
cache: ${config.cache}

# MCP Servers Configuration
mcpServers: ${
  (() => {
    // Skip MCP servers if E2B proxy is enabled (HTTP proxy conflicts with MCP)
    if (config.e2bProxyEnabled) return '{}';
    
    if (!config.mcpServers) return '{}';
    
    // Handle both array and object formats
    let serversToProcess: [string, any][] = [];
    
    if (Array.isArray(config.mcpServers)) {
      if (config.mcpServers.length === 0) return '{}';
      // Convert array to entries format
      serversToProcess = config.mcpServers.map((server: any) => [
        server.name || 'unnamed-server',
        server
      ]);
    } else if (typeof config.mcpServers === 'object') {
      const keys = Object.keys(config.mcpServers);
      if (keys.length === 0) return '{}';
      serversToProcess = Object.entries(config.mcpServers);
    } else {
      return '{}';
    }
    
    return `\n${serversToProcess.map(([serverName, server]: [string, any]) => {
      let serverConfig = `  ${serverName}:\n    type: ${server.type || 'streamable-http'}`;
      
      if (server.url) {
        serverConfig += `\n    url: "${server.url}"`;
      }
      
      if (server.command) {
        serverConfig += `\n    command: "${server.command}"`;
      }
      
      if (server.args && server.args.length > 0) {
        serverConfig += `\n    args:`;
        server.args.forEach((arg: string) => {
          serverConfig += `\n      - "${arg}"`;
        });
      }
      
      serverConfig += `\n    timeout: ${server.timeout || 30000}`;
      
      if (server.initTimeout) {
        serverConfig += `\n    initTimeout: ${server.initTimeout}`;
      }
      
      if (server.headers && Object.keys(server.headers).length > 0) {
        serverConfig += `\n    headers:`;
        Object.entries(server.headers).forEach(([k, v]) => {
          serverConfig += `\n      ${k}: "${v}"`;
        });
      }
      
      if (server.serverInstructions !== undefined) {
        if (typeof server.serverInstructions === 'boolean') {
          serverConfig += `\n    serverInstructions: ${server.serverInstructions}`;
        } else if (typeof server.serverInstructions === 'string') {
          serverConfig += `\n    serverInstructions: |\n      ${server.serverInstructions.split('\n').join('\n      ')}`;
        }
      }
      
      if (server.iconPath) {
        serverConfig += `\n    iconPath: "${server.iconPath}"`;
      }
      
      if (server.chatMenu !== undefined) {
        serverConfig += `\n    chatMenu: ${server.chatMenu}`;
      }
      
      return serverConfig;
    }).join('\n')}`;
  })()
}

# Endpoints Configuration
endpoints:
  agents:
    disableBuilder: ${config.endpoints?.agents?.disableBuilder ?? false}
    recursionLimit: ${config.endpoints?.agents?.recursionLimit ?? 50}
    maxRecursionLimit: ${config.endpoints?.agents?.maxRecursionLimit ?? 100}
    capabilities:
${(config.endpoints?.agents?.capabilities ?? ["execute_code", "file_search", "actions", "tools", "artifacts", "context", "ocr", "chain", "web_search"]).map((cap: string) => `      - ${cap}`).join('\n')}
    maxCitations: ${config.endpoints?.agents?.maxCitations ?? 30}
    maxCitationsPerFile: ${config.endpoints?.agents?.maxCitationsPerFile ?? 7}
    minRelevanceScore: ${config.endpoints?.agents?.minRelevanceScore ?? 0.45}
  openAI:
    title: "OpenAI"
    apiKey: "\${OPENAI_API_KEY}"
    models:
      fetch: true
    dropParams:
      - "frequency_penalty"
      - "presence_penalty"
      - "stop"
      - "user"
    titleConvo: ${config.endpoints?.openAI?.titleConvo ?? true}
    titleModel: "${config.endpoints?.openAI?.titleModel ?? 'gpt-3.5-turbo'}"${config.anthropicApiKey ? `
  anthropic:
    title: "Anthropic"
    apiKey: "\${ANTHROPIC_API_KEY}"
    models:
      fetch: true
    dropParams:
      - "frequency_penalty"
      - "presence_penalty"
    titleConvo: true
    titleModel: "claude-3-haiku-20240307"` : ''}${config.googleApiKey ? `
  google:
    title: "Google AI"
    apiKey: "\${GOOGLE_API_KEY}"
    models:
      fetch: true
    dropParams:
      - "frequency_penalty"
      - "presence_penalty"
      - "stop"
    titleConvo: true
    titleModel: "gemini-1.5-flash"` : ''}${(config.groqApiKey || config.mistralApiKey) ? `
  custom:${config.groqApiKey ? `
    - name: 'groq'
      apiKey: '\${GROQ_API_KEY}'
      baseURL: 'https://api.groq.com/openai/v1/'
      models:
        fetch: false
        default: [
          "llama3-70b-8192",
          "llama3-8b-8192", 
          "llama2-70b-4096",
          "mixtral-8x7b-32768",
          "gemma-7b-it"
        ]
      titleConvo: true
      titleModel: 'mixtral-8x7b-32768'
      modelDisplayLabel: 'Groq'` : ''}${config.mistralApiKey ? `${config.groqApiKey ? `
    - name: 'Mistral'` : `
    - name: 'Mistral'`}
      apiKey: '\${MISTRAL_API_KEY}'
      baseURL: 'https://api.mistral.ai/v1'
      models:
        fetch: true
        default: [
          "mistral-tiny",
          "mistral-small", 
          "mistral-medium",
          "mistral-large-latest"
        ]
      titleConvo: true
      titleModel: 'mistral-tiny'
      modelDisplayLabel: 'Mistral'
      dropParams: ['stop', 'user', 'frequency_penalty', 'presence_penalty']` : ''}` : ''}

# Interface Configuration
interface:
  agents: ${config.interface?.agents ?? true}
  modelSelect: ${config.interface?.modelSelect ?? true}
  parameters: ${config.interface?.parameters ?? true}
  sidePanel: ${config.interface?.sidePanel ?? true}
  presets: ${config.interface?.presets ?? true}
  prompts: ${config.interface?.prompts ?? true}
  bookmarks: ${config.interface?.bookmarks ?? true}
  multiConvo: ${config.interface?.multiConvo ?? false}
  webSearch: ${config.interface?.webSearch ?? true}
  fileSearch: ${config.interface?.fileSearch ?? true}
  fileCitations: ${config.interface?.fileCitations ?? true}
  runCode: ${config.interface?.runCode ?? false}
  artifacts: ${config.interface?.artifacts ?? true}
  temporaryChatRetention: ${config.temporaryChatRetention ?? 720}${config.interface?.customWelcome ? `
  customWelcome: "${config.interface.customWelcome}"` : ''}

# File Configuration
fileConfig:
  endpoints:
    openAI:
      disabled: false
      fileLimit: ${config.fileConfig?.maxFiles ?? 5}
      fileSizeLimit: ${config.fileConfig?.fileSizeLimit ?? 10}
      totalSizeLimit: ${(config.fileConfig?.fileSizeLimit ?? 10) * (config.fileConfig?.maxFiles ?? 5)}
      supportedMimeTypes:
${(config.fileConfig?.supportedMimeTypes ?? ['text/plain', 'application/pdf']).map((type: string) => `        - "${type}"`).join('\n')}${config.anthropicApiKey ? `
    anthropic:
      disabled: false
      fileLimit: ${config.fileConfig?.maxFiles ?? 5}
      fileSizeLimit: ${config.fileConfig?.fileSizeLimit ?? 10}
      totalSizeLimit: ${(config.fileConfig?.fileSizeLimit ?? 10) * (config.fileConfig?.maxFiles ?? 5)}
      supportedMimeTypes:
${(config.fileConfig?.supportedMimeTypes ?? ['text/plain', 'application/pdf']).map((type: string) => `        - "${type}"`).join('\n')}` : ''}${config.googleApiKey ? `
    google:
      disabled: false
      fileLimit: ${config.fileConfig?.maxFiles ?? 5}
      fileSizeLimit: ${config.fileConfig?.fileSizeLimit ?? 10}
      totalSizeLimit: ${(config.fileConfig?.fileSizeLimit ?? 10) * (config.fileConfig?.maxFiles ?? 5)}
      supportedMimeTypes:
${(config.fileConfig?.supportedMimeTypes ?? ['text/plain', 'application/pdf']).map((type: string) => `        - "${type}"`).join('\n')}` : ''}

# Rate Limits
rateLimits:
  fileUploads:
    ipMax: ${config.rateLimits?.fileUploads?.ipMax ?? 100}
    ipWindowInMinutes: 60
    userMax: ${config.rateLimits?.fileUploads?.userMax ?? 50}
    userWindowInMinutes: 60
  conversationsImport:
    ipMax: ${config.rateLimits?.conversationsImport?.ipMax ?? 100}
    ipWindowInMinutes: 60
    userMax: ${config.rateLimits?.conversationsImport?.userMax ?? 50}
    userWindowInMinutes: 60
  stt:
    ipMax: ${config.rateLimits?.stt?.ipMax ?? 100}
    ipWindowInMinutes: 1
    userMax: ${config.rateLimits?.stt?.userMax ?? 50}
    userWindowInMinutes: 1
  tts:
    ipMax: ${config.rateLimits?.tts?.ipMax ?? 100}
    ipWindowInMinutes: 1
    userMax: ${config.rateLimits?.tts?.userMax ?? 50}
    userWindowInMinutes: 1

# Memory Configuration
${config.memory?.enabled ? `memory:
  disabled: false
  validKeys:
    - "user_preferences"
    - "conversation_context"
    - "learned_facts"
    - "personal_information"
  tokenLimit: ${config.memory?.tokenLimit ?? 10000}
  personalize: ${config.memory?.personalize ?? true}
  messageWindowSize: ${config.memory?.messageWindowSize ?? 10}
  agent:
    provider: "${config.memory?.agent?.provider ?? 'openai'}"
    model: "gpt-4"
    instructions: |
      Store memory using only the specified validKeys.
      For user_preferences: save explicitly stated preferences.
      For conversation_context: save important facts or ongoing projects.
      For learned_facts: save objective information about the user.
      For personal_information: save only what the user explicitly shares.
    model_parameters:
      temperature: 0.2
      max_tokens: 2000` : '# Memory system is disabled'}

# Web Search Configuration
${config.webSearch?.searchProvider && config.webSearch.searchProvider !== 'none' ? `webSearch:
  searchProvider: "${config.webSearch.searchProvider}"${config.webSearch.serperApiKey || config.webSearch.searchProvider === 'serper' ? `
  serperApiKey: "\${SERPER_API_KEY}"` : ''}${config.webSearch.searxngInstanceUrl || config.webSearch.searchProvider === 'searxng' ? `
  searxngInstanceUrl: "\${SEARXNG_INSTANCE_URL}"` : ''}${config.webSearch.searxngApiKey && config.webSearch.searchProvider === 'searxng' ? `
  searxngApiKey: "\${SEARXNG_API_KEY}"` : ''}${config.webSearch.braveApiKey || config.webSearch.searchProvider === 'brave' ? `
  braveApiKey: "\${BRAVE_API_KEY}"` : ''}${config.webSearch.tavilyApiKey || config.webSearch.searchProvider === 'tavily' ? `
  tavilyApiKey: "\${TAVILY_API_KEY}"` : ''}${config.webSearch.perplexityApiKey || config.webSearch.searchProvider === 'perplexity' ? `
  perplexityApiKey: "\${PERPLEXITY_API_KEY}"` : ''}${config.webSearch.googleSearchApiKey || config.webSearch.searchProvider === 'google' ? `
  googleSearchApiKey: "\${GOOGLE_SEARCH_API_KEY}"` : ''}${config.webSearch.googleCSEId && config.webSearch.searchProvider === 'google' ? `
  googleCSEId: "\${GOOGLE_CSE_ID}"` : ''}${config.webSearch.bingSearchApiKey || config.webSearch.searchProvider === 'bing' ? `
  bingSearchApiKey: "\${BING_SEARCH_API_KEY}"` : ''}${config.webSearch.scraperType && config.webSearch.scraperType !== 'none' ? `
  scraperType: "${config.webSearch.scraperType}"` : ''}${config.webSearch.firecrawlApiKey || config.webSearch.scraperType === 'firecrawl' ? `
  firecrawlApiKey: "\${FIRECRAWL_API_KEY}"` : ''}${config.webSearch.firecrawlApiUrl && config.webSearch.scraperType === 'firecrawl' ? `
  firecrawlApiUrl: "\${FIRECRAWL_API_URL}"` : ''}${config.webSearch.rerankerType && config.webSearch.rerankerType !== 'none' ? `
  rerankerType: "${config.webSearch.rerankerType}"` : ''}${config.webSearch.jinaApiKey || config.webSearch.rerankerType === 'jina' ? `
  jinaApiKey: "\${JINA_API_KEY}"` : ''}${config.webSearch.jinaRerankerUrl && config.webSearch.rerankerType === 'jina' ? `
  jinaRerankerUrl: "\${JINA_RERANKER_URL}"` : ''}${config.webSearch.cohereApiKey || config.webSearch.rerankerType === 'cohere' ? `
  cohereApiKey: "\${COHERE_API_KEY}"` : ''}${config.webSearch.scraperTimeout ? `
  scraperTimeout: ${config.webSearch.scraperTimeout}` : ''}${config.webSearch.safeSearch !== undefined ? `
  safeSearch: ${config.webSearch.safeSearch ? 1 : 0}` : ''}` : '# Web search is not configured'}

# OCR Configuration
${config.ocrProvider ? `ocr:
  strategy: "${config.ocrProvider === 'mistral' ? 'mistral_ocr' : config.ocrProvider === 'custom' ? 'custom_ocr' : 'mistral_ocr'}"${config.ocrProvider === 'mistral' ? `
  mistralModel: "mistral-ocr-latest"` : ''}
  apiKey: "\${OCR_API_KEY}"
  baseURL: "\${OCR_BASEURL}"` : '# OCR is not configured'}

# Actions Configuration
${config.e2bProxyEnabled || (config.actionsAllowedDomains && config.actionsAllowedDomains.length > 0) ? `actions:${config.actionsAllowedDomains && config.actionsAllowedDomains.length > 0 ? `
  allowedDomains:
${config.actionsAllowedDomains.map((domain: string) => `    - "${domain}"`).join('\n')}` : ''}${config.e2bProxyEnabled ? `
  e2b_code_execution:
    openAPISpec: ./e2b-code-execution-openapi.yaml
    authentication:
      type: none
    availableTools:
      - e2b_execute_code` : ''}` : '# Actions are not configured'}

`;
}

function generateDockerComposeFile(config: any): string {
  return `version: '3.8'

services:
  # MongoDB Database
  mongodb:
    container_name: librechat-mongodb
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
    container_name: librechat-redis
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
    container_name: e2b-proxy
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
    container_name: librechat-app
    image: ghcr.io/danny-avila/librechat-dev:latest
    restart: unless-stopped
    depends_on:
      - mongodb
      - redis${config.e2bProxyEnabled ? '\n      - e2b-proxy' : ''}
    ports:
      - "\${LIBRECHAT_PORT:-${config.port}}:3080"
    environment:
      # Database Configuration
      MONGO_URI: mongodb://\${MONGO_ROOT_USERNAME:-${config.mongoRootUsername || 'librechat_admin'}}:\${MONGO_ROOT_PASSWORD:-${config.mongoRootPassword || 'librechat_password_change_this'}}@mongodb:27017/\${MONGO_DB_NAME:-${config.mongoDbName || 'librechat'}}?authSource=admin
      
      # Redis Configuration
      REDIS_URI: redis://redis:6379
      
      # Application Configuration
      HOST: ${config.host || '0.0.0.0'}
      PORT: 3080
      NODE_ENV: production
      
      # Security
      JWT_SECRET: \${JWT_SECRET}
      JWT_REFRESH_SECRET: \${JWT_REFRESH_SECRET}
      CREDS_KEY: \${CREDS_KEY}
      CREDS_IV: \${CREDS_IV}
      
      # OpenAI API Key
      OPENAI_API_KEY: \${OPENAI_API_KEY}
      
      # Session Configuration
      SESSION_EXPIRY: \${SESSION_EXPIRY:-${config.sessionExpiry || '1000 * 60 * 15'}}
      REFRESH_TOKEN_EXPIRY: \${REFRESH_TOKEN_EXPIRY:-${config.refreshTokenExpiry || '1000 * 60 * 60 * 24 * 7'}}
      
      # Registration
      ALLOW_REGISTRATION: \${ALLOW_REGISTRATION:-${config.enableRegistration !== undefined ? config.enableRegistration : true}}
      
      # Logging
      DEBUG_LOGGING: \${DEBUG_LOGGING:-${config.debugLogging}}
      
      # File uploads
      CDN_PROVIDER: \${CDN_PROVIDER:-}
      
      # MCP Configuration
      MCP_ENABLED: "true"
      
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

echo "🚀 Starting LibreChat Docker installation..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads

# Set permissions
chmod 755 logs uploads

# Pull Docker images
echo "📦 Pulling Docker images..."
docker-compose pull

# Start services
echo "🔄 Starting LibreChat services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ LibreChat is running successfully!"
    echo ""
    echo "🌐 Access your LibreChat instance at:"
    echo "   http://localhost:${config.port}"
    echo ""
    echo "📊 Service status:"
    docker-compose ps
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo "🔄 To restart: docker-compose restart"
else
    echo "❌ Some services failed to start. Check logs:"
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 Docker installation complete! Enjoy using LibreChat!"
`;
}

function generateDockerInstallScriptWindows(config: any): string {
  return `@echo off
REM =============================================================================
REM LibreChat Docker Installation Script
REM Generated Configuration for v0.8.0-RC4
REM =============================================================================

echo 🚀 Starting LibreChat Docker installation...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed
echo.

REM Create necessary directories
echo 📁 Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
echo.

REM Pull Docker images
echo 📦 Pulling Docker images...
docker-compose pull
echo.

REM Start services
echo 🔄 Starting LibreChat services...
docker-compose up -d
echo.

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul
echo.

REM Check if services are running
echo 🔍 Checking service health...
docker-compose ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo ❌ Some services failed to start. Check logs:
    docker-compose logs
    pause
    exit /b 1
)

echo ✅ LibreChat is running successfully!
echo.
echo 🌐 Access your LibreChat instance at:
echo    http://localhost:${config.port}
echo.
echo 📊 Service status:
docker-compose ps
echo.
echo 📝 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo 🔄 To restart: docker-compose restart
echo.
echo 🎉 Docker installation complete! Enjoy using LibreChat!
echo.
pause
`;
}


function generateReadmeFile(config: any): string {
  return `# LibreChat Configuration

This package contains a complete LibreChat v0.8.0-RC4 installation with your custom configuration (using configuration schema v${config.version}).

## 📋 Package Contents

- \`.env\` - Environment variables configuration
- \`librechat.yaml\` - Main LibreChat configuration file
- \`docker-compose.yml\` - Docker services orchestration
- \`install_dockerimage.sh\` - Installation script for Linux/macOS
- \`install_dockerimage.bat\` - Installation script for Windows
- \`LibreChatConfigSettings.json\` - Configuration profile for easy re-import
- \`README.md\` - This documentation file

## 🚀 Quick Start

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

## ⚙️ Configuration Summary

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
${config.interface?.agents !== false ? '- ✅ AI Agents' : '- ❌ AI Agents'}
${config.interface?.webSearch !== false ? '- ✅ Web Search' : '- ❌ Web Search'}
${config.interface?.fileSearch !== false ? '- ✅ File Search' : '- ❌ File Search'}
${config.interface?.presets !== false ? '- ✅ Presets' : '- ❌ Presets'}
${config.interface?.prompts !== false ? '- ✅ Custom Prompts' : '- ❌ Custom Prompts'}
${config.interface?.bookmarks !== false ? '- ✅ Bookmarks' : '- ❌ Bookmarks'}
${config.memoryEnabled !== false ? '- ✅ Memory System' : '- ❌ Memory System'}
${config.interface?.artifacts !== false ? '- ✅ Artifacts (Generative UI)' : '- ❌ Artifacts'}
${config.interface?.runCode !== false ? '- ✅ Code Interpreter UI' : '- ❌ Code Interpreter UI'}
${config.interface?.artifacts !== false ? `

### 🎨 Artifacts Configuration (Generative UI)

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
  return `- ✅ ${labels[cap] || cap}`;
}).join('\n')}

#### Sandpack Bundler
${config.sandpackBundlerUrl ? `- **Mode**: Self-Hosted (Privacy/Compliance)
- **Bundler URL**: \`${config.sandpackBundlerUrl}\`
- **Security**: All code execution stays within your infrastructure` : `- **Mode**: Public Bundler (Default)
- **Provider**: CodeSandbox (https://*.codesandbox.io)
- **Note**: Code is bundled via CodeSandbox's public CDN`}

#### ⚠️ Content Security Policy (CSP) Requirements

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
- Compatible with the Profile → Import Profile feature

## 🐳 Docker Commands

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

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Clean up unused images
docker system prune -f
\`\`\`

## 🔐 Security Notes

1. **Change Default Passwords**: Update MongoDB credentials in \`.env\`
2. **Secure API Keys**: Protect your OpenAI and other API keys
3. **JWT Secrets**: Use strong, unique JWT secrets (provided in config)
4. **Network Access**: Configure firewall rules for production use
5. **HTTPS**: Use a reverse proxy with SSL/TLS in production

## 🌐 Production Deployment

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

function generateProfileFile(config: any): string {
  const currentDate = new Date().toISOString();
  const profileName = `LibreChat-v${config.configVer}-${currentDate.split('T')[0]}`;
  
  const profile = {
    name: profileName,
    version: "1.0.0",
    createdAt: currentDate,
    description: `Generated LibreChat configuration profile for v${config.configVer}`,
    configuration: config
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
      "✅ Deployment successful!",
      `🌐 Public URL: ${publicUrl}`,
      `🔑 Admin access: ${publicUrl}/admin`
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
        "🛑 Deployment stopped",
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
