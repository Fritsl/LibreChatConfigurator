import { useState, useEffect } from "react";
import { ConfigurationTabs } from "@/components/configuration-tabs";
import { PreviewModal } from "@/components/preview-modal";
import { useConfiguration } from "@/hooks/use-configuration";
import { useBackendAvailability } from "@/hooks/use-backend-availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { defaultConfiguration } from "@/lib/configuration-defaults";
import { createResetConfiguration } from "@/lib/librechat-defaults";
import { deepMerge } from "@/lib/merge-utils";
import { Search, Download, Save, Upload, CheckCircle, Eye, Rocket, ChevronDown, FolderOpen, FileText, Settings, TestTube, Zap, AlertTriangle, ExternalLink, Info, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; 
import { Label } from "@/components/ui/label";
import { ConfigurationHistory } from "@/components/ConfigurationHistory";
import { ConfigurationComparison } from "@/components/configuration-comparison";
import { getToolVersion, getVersionInfo } from "@shared/version";
import type { Configuration } from "@shared/schema";
import yaml from "js-yaml";
import { getAllEnvKeys, FIELD_REGISTRY } from '@/../../shared/config/field-registry';
import { mapEnvToConfiguration as registryMapEnvToConfig, mapYamlToConfiguration as registryMapYamlToConfig, validateYamlFields as registryValidateYamlFields, validateEnvVars as registryValidateEnvVars } from '@/../../shared/config/registry-helpers';
import { clearAllOverrides, setFieldOverride } from '@/../../shared/config/field-overrides';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSelfTestConfirmation, setShowSelfTestConfirmation] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showMergeResults, setShowMergeResults] = useState(false);
  const [mergeDetails, setMergeDetails] = useState<{ name: string; fields: string[] } | null>(null);
  const [showUnsupportedFieldsDialog, setShowUnsupportedFieldsDialog] = useState(false);
  const [unsupportedFieldsData, setUnsupportedFieldsData] = useState<{ 
    type: 'yaml' | 'env'; 
    fileName: string;
    unsupportedFields: string[];
    totalFields: number;
    validFields: number;
    allData: any; // The full parsed data (envVars or yamlData)
  } | null>(null);
  const [showYamlOnlyDialog, setShowYamlOnlyDialog] = useState(false);
  const [yamlOnlyFieldsData, setYamlOnlyFieldsData] = useState<Array<{ envKey: string; yamlPath: string; value: string }> | null>(null);
  const [showPartialImportChoice, setShowPartialImportChoice] = useState(false);
  const [partialImportData, setPartialImportData] = useState<{
    fileName: string;
    allEnvVars: Record<string, string>;
    yamlOnlyVars: Array<{ envKey: string; yamlPath: string }>;
    validEnvVarsCount: number;
  } | null>(null);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [importSummaryData, setImportSummaryData] = useState<{ 
    type: 'yaml' | 'env'; 
    fileName: string;
    totalFields: number;
    newFields: number;
    updatedFields: number;
    unchangedFields: number;
    fieldDetails: { name: string; status: 'new' | 'updated' | 'unchanged' }[];
    skippedYamlFields?: Array<{ envKey: string; yamlPath: string }>;
  } | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    type: 'yaml' | 'env';
    fileName: string;
    proposedChanges: Partial<Configuration>;
    skippedYamlFields?: Array<{ envKey: string; yamlPath: string }>;
  } | null>(null);
  const { configuration, updateConfiguration, saveProfile, generatePackage, loadDemoConfiguration, verifyConfiguration } = useConfiguration();
  const { isBackendAvailable, isDemo } = useBackendAvailability();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    try {
      // ⚠️ REMINDER: Always update version in shared/version.ts when making changes!
      
      // Create a complete configuration with ALL fields for 1:1 backup
      // Use createResetConfiguration which ensures all fields are present
      const completeDefaults = createResetConfiguration();
      const completeConfiguration = deepMerge(completeDefaults, configuration);
      
      // Create versioned export metadata
      const { createExportMetadata } = await import("@shared/version");
      const metadata = createExportMetadata(configuration.configurationName);
      
      // Create profile data with configuration and versioned metadata
      const versionInfo = getVersionInfo();
      const profileData = {
        name: configuration.configurationName,
        description: `Configuration profile created on ${new Date().toLocaleDateString()}`,
        configuration: completeConfiguration,
        metadata: metadata, // ✨ NEW: Structured version metadata for migration support
        // Legacy fields for backward compatibility
        toolVersion: versionInfo.toolVersion,
        librechatTarget: versionInfo.librechatTarget,
        createdAt: new Date().toISOString(),
        exportedFrom: `LibreChat Configuration Manager v${versionInfo.toolVersion}`,
        lastUpdated: versionInfo.lastUpdated,
        changelog: versionInfo.changelog
      };

      // Download as JSON file with Save As dialog
      const { downloadJSON } = await import("@/lib/download-utils");
      const filename = `${configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}-LibreChatConfigSettings.json`;
      const success = await downloadJSON(profileData, filename);

      if (success) {
        toast({
          title: "Configuration Saved",
          description: `Configuration "${configuration.configurationName}" downloaded successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save LibreChat configuration settings.",
        variant: "destructive",
      });
    }
  };

  const parseEnvFile = (envContent: string) => {
    const envVars: Record<string, string> = {};
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
    return envVars;
  };

  // Helper function to analyze configuration changes
  // IMPORTANT: Only compares fields present in newUpdates to avoid cross-contamination between .env and YAML imports
  const analyzeConfigurationChanges = (oldConfig: any, newUpdates: any) => {
    const fieldDetails: { name: string; status: 'new' | 'updated' | 'unchanged' }[] = [];
    let newFields = 0;
    let updatedFields = 0;
    let unchangedFields = 0;

    const processObject = (oldObj: any, newObj: any, prefix = '') => {
      Object.keys(newObj).forEach(key => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const newValue = newObj[key];
        const oldValue = oldObj?.[key];

        // Skip null/undefined values
        if (newValue === null || newValue === undefined) return;

        // Handle nested objects (but not arrays)
        if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue !== null) {
          processObject(oldValue || {}, newValue, fullPath);
          return;
        }

        // Compare values using deep equality
        const oldValueStr = JSON.stringify(oldValue);
        const newValueStr = JSON.stringify(newValue);

        // Determine status based on old value state
        // Only consider truly missing fields (undefined) as "new"
        // Empty strings, null, or false are valid existing values
        if (oldValue === undefined) {
          fieldDetails.push({ name: fullPath, status: 'new' });
          newFields++;
        } else if (oldValueStr !== newValueStr) {
          fieldDetails.push({ name: fullPath, status: 'updated' });
          updatedFields++;
        } else {
          fieldDetails.push({ name: fullPath, status: 'unchanged' });
          unchangedFields++;
        }
      });
    };

    processObject(oldConfig, newUpdates);

    return {
      totalFields: fieldDetails.length,
      newFields,
      updatedFields,
      unchangedFields,
      fieldDetails
    };
  };

  const mapEnvToConfiguration = (envVars: Record<string, string>) => {
    // REGISTRY-DRIVEN MAPPING
    // Use centralized field registry for automatic ENV mapping (100% coverage)
    return registryMapEnvToConfig(envVars);
  };

  const mapYamlToConfiguration = (yamlData: any) => {
    // REGISTRY-DRIVEN MAPPING
    // Use centralized registry-based YAML mapper with full support for:
    // - Env placeholder filtering (${VAR} references)
    // - Nested structure preservation (webSearch, stt, tts, memory, etc.)
    // - Alias handling (memory.disabled, rateLimits.uploads, etc.)
    // - Complex structures (mcpServers, customEndpoints, fileConfig.endpoints)
    return registryMapYamlToConfig(yamlData);
  };

  // Helper function to mark imported fields as explicitly set
  const markImportedFieldsAsExplicit = (baseConfig: Configuration, importedUpdates: Partial<Configuration>): Configuration => {
    // Deep merge to preserve untouched nested properties
    let result = deepMerge(baseConfig, importedUpdates);
    
    // Find all fields that have values in the imported updates
    const getFieldIdsFromUpdates = (obj: any, prefix = ''): string[] => {
      const fieldIds: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        
        const path = prefix ? `${prefix}.${key}` : key;
        
        // Find field in registry by yamlPath or id
        const field = FIELD_REGISTRY.find(f => 
          f.yamlPath === path || f.id === key || f.id === path
        );
        
        if (field) {
          fieldIds.push(field.id);
        }
        
        // Recursively check nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          fieldIds.push(...getFieldIdsFromUpdates(value, path));
        }
      }
      
      return fieldIds;
    };
    
    const importedFieldIds = getFieldIdsFromUpdates(importedUpdates);
    
    // Mark all imported fields as explicitly set (not using LibreChat default)
    for (const fieldId of importedFieldIds) {
      result = setFieldOverride(result, fieldId, false);
    }
    
    console.log(`🏷️ [Import] Marked ${importedFieldIds.length} fields as explicitly set`);
    
    return result;
  };

  const handleImportProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const profileData = JSON.parse(event.target?.result as string);
            
            // Validate configuration structure
            if (!profileData.configuration) {
              throw new Error("Invalid configuration format: missing configuration data");
            }

            // ✨ NEW: Check version compatibility if metadata exists
            if (profileData.metadata) {
              const { checkVersionCompatibility } = await import("@shared/version");
              const compatibility = checkVersionCompatibility(profileData.metadata);
              
              if (compatibility.warnings.length > 0) {
                console.log("⚠️ [VERSION CHECK] Import compatibility warnings:");
                compatibility.warnings.forEach(w => console.log(`   - ${w}`));
                
                // Show version warning toast
                toast({
                  title: "⚠️ Version Mismatch Detected",
                  description: compatibility.warnings[0], // Show first warning
                  variant: "default",
                });
              }
            }

            console.log("📥 [CONFIG DEBUG] Loading configuration:");
            console.log("   - Name:", profileData.name);
            console.log("   - Config keys:", profileData.configuration ? Object.keys(profileData.configuration) : 'NO CONFIG');
            console.log("   - MCP servers count:", profileData.configuration?.mcpServers?.length || 0);
            console.log("   - MCP servers:", profileData.configuration?.mcpServers);
            
            // Validate structure - check for misplaced nested fields
            const webSearchFields = ['searchProvider', 'scraperType', 'rerankerType', 'serperApiKey', 
              'searxngInstanceUrl', 'searxngApiKey', 'braveApiKey', 'tavilyApiKey', 'perplexityApiKey',
              'googleSearchApiKey', 'googleCSEId', 'bingSearchApiKey', 'firecrawlApiKey', 'firecrawlApiUrl',
              'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'scraperTimeout', 'safeSearch'];
            
            const incomingConfig = profileData.configuration;
            const topLevelWebSearchFields = webSearchFields.filter(field => field in incomingConfig);
            
            if (topLevelWebSearchFields.length > 0) {
              console.error("❌ [IMPORT VALIDATION] Structure error - webSearch fields at top level:", topLevelWebSearchFields);
              toast({
                title: "❌ Invalid Configuration Structure",
                description: `Web search fields (${topLevelWebSearchFields.slice(0, 3).join(', ')}...) should be nested under "webSearch" key. Check console for correct format.`,
                variant: "destructive",
              });
              console.log(`Correct structure:\n{\n  "configuration": {\n    "webSearch": {\n      "searchProvider": "searxng",\n      ...\n    }\n  }\n}`);
              return; // Don't proceed with import
            }
            
            // Apply the configuration and name
            const importedName = profileData.name || `Imported ${new Date().toLocaleDateString()}`;
            updateConfiguration({ ...profileData.configuration, configurationName: importedName });
            
            toast({
              title: "Configuration Imported", 
              description: `Configuration "${importedName}" loaded successfully.`,
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Failed to import configuration. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportMerge = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const profileData = JSON.parse(event.target?.result as string);
            
            // Validate configuration structure
            if (!profileData.configuration) {
              throw new Error("Invalid configuration format: missing configuration data");
            }

            // ✨ NEW: Check version compatibility if metadata exists
            if (profileData.metadata) {
              const { checkVersionCompatibility } = await import("@shared/version");
              const compatibility = checkVersionCompatibility(profileData.metadata);
              
              if (compatibility.warnings.length > 0) {
                console.log("⚠️ [VERSION CHECK] Import compatibility warnings:");
                compatibility.warnings.forEach(w => console.log(`   - ${w}`));
                
                // Show version warning toast
                toast({
                  title: "⚠️ Version Mismatch Detected",
                  description: compatibility.warnings[0], // Show first warning
                  variant: "default",
                });
              }
            }

            // Collect imported field names for display
            const importedFields = Object.keys(profileData.configuration);
            
            // Validate structure - check for misplaced nested fields
            const webSearchFields = ['searchProvider', 'scraperType', 'rerankerType', 'serperApiKey', 
              'searxngInstanceUrl', 'searxngApiKey', 'braveApiKey', 'tavilyApiKey', 'perplexityApiKey',
              'googleSearchApiKey', 'googleCSEId', 'bingSearchApiKey', 'firecrawlApiKey', 'firecrawlApiUrl',
              'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'scraperTimeout', 'safeSearch'];
            
            const structureWarnings: string[] = [];
            const incomingConfig = profileData.configuration;
            
            // Check if webSearch fields are at top level (wrong location)
            const topLevelWebSearchFields = webSearchFields.filter(field => field in incomingConfig);
            if (topLevelWebSearchFields.length > 0) {
              structureWarnings.push(
                `⚠️ Web Search fields at wrong level: ${topLevelWebSearchFields.join(', ')}.\n\n` +
                `These fields should be nested under "webSearch" key.\n\n` +
                `Correct structure:\n` +
                `{\n` +
                `  "configuration": {\n` +
                `    "webSearch": {\n` +
                `      "searchProvider": "searxng",\n` +
                `      "scraperType": "firecrawl",\n` +
                `      ...\n` +
                `    }\n` +
                `  }\n` +
                `}`
              );
            }
            
            // If there are structure warnings, show error instead of merging
            if (structureWarnings.length > 0) {
              toast({
                title: "❌ Invalid Configuration Structure",
                description: structureWarnings[0].split('\n').slice(0, 2).join(' '),
                variant: "destructive",
              });
              console.error("❌ [MERGE VALIDATION] Structure errors:", structureWarnings);
              return; // Don't proceed with merge
            }
            
            // Full import - replace entire configuration with incoming data
            // Apply the incoming configuration as complete replacement (including name)
            const configWithName = profileData.name 
              ? { ...profileData.configuration, configurationName: profileData.name }
              : profileData.configuration;
            updateConfiguration(configWithName, true);
            
            // Show detailed merge results
            setMergeDetails({
              name: profileData.name || file.name,
              fields: importedFields
            });
            setShowMergeResults(true);
            
          } catch (error) {
            toast({
              title: "Merge Failed",
              description: "Failed to merge configuration. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // REGISTRY-DRIVEN YAML VALIDATION
  // Uses centralized field registry for automatic validation (100% coverage)
  const validateYamlFields = (yamlData: any): { valid: boolean; unmappedFields: string[] } => {
    return registryValidateYamlFields(yamlData);
  };

  const handleImportYaml = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".yaml,.yml";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("📥 [YAML IMPORT] Parsing YAML file:", file.name);
            const yamlContent = event.target?.result as string;
            const yamlData = yaml.load(yamlContent) as any;
            
            console.log("   - Parsed YAML data:", yamlData);
            
            // VALIDATION: Check for unmapped fields BEFORE importing
            const validation = validateYamlFields(yamlData);
            if (!validation.valid) {
              console.error("❌ [YAML IMPORT] Unmapped fields detected:", validation.unmappedFields);
              
              // Show detailed list in console
              console.log("\n🚫 IMPORT REJECTED - Unsupported YAML Fields:");
              console.log("================================================");
              validation.unmappedFields.forEach((field, index) => {
                console.log(`${index + 1}. ${field}`);
              });
              console.log("\n💡 Next Steps:");
              console.log("   1. Report these fields so they can be added to the tool");
              console.log("   2. OR remove unsupported fields from your YAML file");
              console.log("   3. Then retry the import\n");
              
              // Try mapping to see how many fields are actually valid
              const mappedConfig = registryMapYamlToConfig(yamlData);
              const mappedFieldCount = Object.keys(mappedConfig).reduce((count, key) => {
                const value = mappedConfig[key as keyof typeof mappedConfig];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  return count + Object.keys(value).length;
                }
                return count + 1;
              }, 0);
              
              const unsupportedCount = validation.unmappedFields.length;
              const totalFields = mappedFieldCount + unsupportedCount;
              
              // Show dialog with option for partial import
              setUnsupportedFieldsData({
                type: 'yaml',
                fileName: file.name,
                unsupportedFields: validation.unmappedFields,
                totalFields,
                validFields: mappedFieldCount,
                allData: yamlData
              });
              setShowUnsupportedFieldsDialog(true);
              
              return; // Wait for user choice
            }
            
            const configUpdates = mapYamlToConfiguration(yamlData);
            console.log("   - Mapped configuration:", configUpdates);
            console.log("   - MCP servers found:", configUpdates.mcpServers?.length || 0);
            
            // Analyze what changed BEFORE import (compare existing config vs YAML)
            const analysis = analyzeConfigurationChanges(configuration, configUpdates);
            
            // MERGE configuration with YAML data AND mark all imported fields as explicitly set
            // This ensures YAML fields are updated while ENV-only fields remain intact
            // AND the Field States Panel correctly shows imported fields as "explicit"
            const configWithOverrides = markImportedFieldsAsExplicit(configuration, configUpdates);
            // Use replace mode since markImportedFieldsAsExplicit already deep-merged everything
            updateConfiguration(configWithOverrides, true);
            
            // Show detailed import summary
            setImportSummaryData({
              type: 'yaml',
              fileName: file.name,
              ...analysis
            });
            setShowImportSummary(true);
          } catch (error) {
            console.error("YAML import error:", error);
            toast({
              title: "Import Failed",
              description: "Failed to parse YAML file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportEnv = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".env";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("📥 [ENV IMPORT] Parsing ENV file:", file.name);
            const envContent = event.target?.result as string;
            const envVars = parseEnvFile(envContent);
            
            console.log("   - Parsed ENV vars:", Object.keys(envVars));
            
            // VALIDATION: Check for unmapped environment variables AND YAML-only violations BEFORE importing
            const validation = registryValidateEnvVars(envVars);
            if (!validation.valid) {
              // Handle YAML-only field violations - offer partial import
              if (validation.yamlOnlyVars && validation.yamlOnlyVars.length > 0) {
                console.log("⚠️ [ENV IMPORT] YAML-only fields detected in .env file:", validation.yamlOnlyVars);
                
                // Calculate how many valid fields can be imported
                const totalEnvVars = Object.keys(envVars).length;
                const yamlOnlyCount = validation.yamlOnlyVars.length;
                const validEnvVarsCount = totalEnvVars - yamlOnlyCount;
                
                console.log("📊 [ENV IMPORT] Import analysis:");
                console.log(`   - Total env vars: ${totalEnvVars}`);
                console.log(`   - Valid for .env: ${validEnvVarsCount}`);
                console.log(`   - YAML-only (skipped): ${yamlOnlyCount}`);
                
                // Show partial import choice dialog
                setPartialImportData({
                  fileName: file.name,
                  allEnvVars: envVars,
                  yamlOnlyVars: validation.yamlOnlyVars,
                  validEnvVarsCount
                });
                setShowPartialImportChoice(true);
                
                return; // Wait for user choice
              }
              
              // Handle unmapped variables
              if (validation.unmappedVars && validation.unmappedVars.length > 0) {
                console.error("❌ [ENV IMPORT] Unmapped environment variables detected:", validation.unmappedVars);
                
                // Show detailed list in console
                console.log("\n🚫 IMPORT REJECTED - Unsupported Environment Variables:");
                console.log("=========================================================");
                validation.unmappedVars.forEach((varName, index) => {
                  console.log(`${index + 1}. ${varName}`);
                });
                console.log("\n💡 Next Steps:");
                console.log("   1. Report these variables so they can be added to the tool");
                console.log("   2. OR remove unsupported variables from your .env file");
                console.log("   3. Then retry the import\n");
                
                // Calculate valid vs unsupported fields
                const totalFields = Object.keys(envVars).length;
                const unsupportedCount = validation.unmappedVars.length;
                const validCount = totalFields - unsupportedCount;
                
                // Show dialog with option for partial import
                setUnsupportedFieldsData({
                  type: 'env',
                  fileName: file.name,
                  unsupportedFields: validation.unmappedVars,
                  totalFields,
                  validFields: validCount,
                  allData: envVars
                });
                setShowUnsupportedFieldsDialog(true);
                
                return; // Wait for user choice
              }
            }
            
            const configUpdates = mapEnvToConfiguration(envVars);
            console.log("   - Mapped configuration:", configUpdates);
            
            // Analyze what changed BEFORE import (compare existing config vs .env)
            const analysis = analyzeConfigurationChanges(configuration, configUpdates);
            
            // MERGE configuration with .env data AND mark all imported fields as explicitly set
            // This ensures ENV fields are updated while YAML-only fields remain intact
            // AND the Field States Panel correctly shows imported fields as "explicit"
            const configWithOverrides = markImportedFieldsAsExplicit(configuration, configUpdates);
            // Use replace mode since markImportedFieldsAsExplicit already deep-merged everything
            updateConfiguration(configWithOverrides, true);
            
            // Show detailed import summary
            setImportSummaryData({
              type: 'env',
              fileName: file.name,
              ...analysis
            });
            setShowImportSummary(true);
          } catch (error) {
            console.error("ENV import error:", error);
            toast({
              title: "Import Failed",
              description: "Failed to parse environment file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetToDefaults = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetToDefaults = () => {
    // Create reset configuration that preserves user secrets but resets settings to LibreChat defaults
    const resetConfig = createResetConfiguration(configuration);
    
    // Update configuration with LibreChat defaults
    updateConfiguration(resetConfig);
    
    toast({
      title: "Reset Complete", 
      description: "Configuration reset to LibreChat RC4 defaults while preserving your API keys and secrets.",
    });
    
    setShowResetConfirmation(false);
  };

  const handlePartialImport = () => {
    if (!partialImportData) return;
    
    // Filter out YAML-only fields from env vars
    const yamlOnlyKeys = new Set(partialImportData.yamlOnlyVars.map(v => v.envKey));
    const validEnvVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(partialImportData.allEnvVars)) {
      if (!yamlOnlyKeys.has(key)) {
        validEnvVars[key] = value;
      }
    }
    
    console.log("✅ [PARTIAL IMPORT] Importing valid .env fields:", Object.keys(validEnvVars));
    console.log("⏭️ [PARTIAL IMPORT] Skipping YAML-only fields:", Array.from(yamlOnlyKeys));
    
    // Import the valid env vars
    const configUpdates = registryMapEnvToConfig(validEnvVars);
    console.log("🔍 [DEBUG] configUpdates from registry:", configUpdates);
    console.log("🔍 [DEBUG] Sample field - CUSTOM_WELCOME:", validEnvVars.CUSTOM_WELCOME, "→", configUpdates.customWelcome);
    
    const analysis = analyzeConfigurationChanges(configuration, configUpdates);
    const configWithOverrides = markImportedFieldsAsExplicit(configuration, configUpdates);
    console.log("🔍 [DEBUG] configWithOverrides:", configWithOverrides);
    console.log("🔍 [DEBUG] customWelcome in merged config:", configWithOverrides.customWelcome);
    
    updateConfiguration(configWithOverrides, true);
    console.log("✅ [PARTIAL IMPORT] Configuration updated");
    
    // Show summary with skipped fields info
    setImportSummaryData({
      type: 'env',
      fileName: partialImportData.fileName,
      ...analysis,
      skippedYamlFields: partialImportData.yamlOnlyVars,
    });
    
    toast({
      title: "Partial Import Complete",
      description: `Imported ${partialImportData.validEnvVarsCount} valid fields. ${partialImportData.yamlOnlyVars.length} YAML-only fields were skipped (they must be in librechat.yaml).`,
    });
    
    setShowPartialImportChoice(false);
    setPartialImportData(null);
    setShowImportSummary(true);
  };

  const handleLoadDemoConfiguration = () => {
    const demoConfig = loadDemoConfiguration();
    const verification = verifyConfiguration(demoConfig);
    
    toast({
      title: "Demo Configuration Loaded",
      description: `Loaded ${verification.current.populatedFields}/${verification.current.totalFields} fields (${verification.current.completionPercentage}% complete) with ALL toggles enabled for comprehensive testing.`,
    });
  };

  const handleResetAllFieldStates = () => {
    // Create a fresh configuration with all fields set to their default values
    let resetConfig: any = { ...configuration };
    
    // Reset all field values to their defaults
    Object.values(FIELD_REGISTRY).forEach(field => {
      const configPath = field.configPath || field.id;
      const keys = configPath.split('.');
      let current: any = resetConfig;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      // Set the default value
      current[keys[keys.length - 1]] = field.defaultValue;
    });
    
    // Clear all override flags
    const clearedConfig = clearAllOverrides(resetConfig);
    updateConfiguration(clearedConfig);
    
    toast({
      title: "All Fields Reset to Defaults",
      description: "All configuration fields have been reset to their default values and will use LibreChat's defaults (commented out in exports).",
    });
  };

  const handleRunSelfTest = () => {
    setShowSelfTestConfirmation(true);
  };

  const handleCompareYaml = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".yaml,.yml";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("🔍 [YAML COMPARE] Parsing YAML file for comparison:", file.name);
            const yamlContent = event.target?.result as string;
            const yamlData = yaml.load(yamlContent) as any;
            
            // Validate YAML fields first
            const validation = registryValidateYamlFields(yamlData);
            if (!validation.valid && validation.unmappedFields && validation.unmappedFields.length > 0) {
              console.log("⚠️ [YAML COMPARE] Unmapped YAML fields detected:", validation.unmappedFields);
              
              // Try mapping to see how many fields are actually valid
              const mappedConfig = registryMapYamlToConfig(yamlData);
              const mappedFieldCount = Object.keys(mappedConfig).reduce((count, key) => {
                const value = mappedConfig[key as keyof typeof mappedConfig];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  return count + Object.keys(value).length;
                }
                return count + 1;
              }, 0);
              
              const unsupportedCount = validation.unmappedFields.length;
              const totalFields = mappedFieldCount + unsupportedCount;
              
              setUnsupportedFieldsData({
                type: 'yaml',
                fileName: file.name,
                unsupportedFields: validation.unmappedFields,
                totalFields,
                validFields: mappedFieldCount,
                allData: yamlData
              });
              setShowUnsupportedFieldsDialog(true);
              
              return;
            }
            
            // Map YAML to configuration format
            const proposedChanges = registryMapYamlToConfig(yamlData);
            console.log("   - Proposed changes mapped from YAML");
            
            // Open comparison dialog
            setComparisonData({
              type: 'yaml',
              fileName: file.name,
              proposedChanges
            });
            setShowComparisonDialog(true);
          } catch (error) {
            console.error("YAML comparison error:", error);
            toast({
              title: "Comparison Failed",
              description: "Failed to parse YAML file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCompareEnv = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".env";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            console.log("🔍 [ENV COMPARE] Parsing ENV file for comparison:", file.name);
            const envContent = event.target?.result as string;
            const envVars = parseEnvFile(envContent);
            
            // Validate env vars first
            const validation = registryValidateEnvVars(envVars);
            if (!validation.valid) {
              // Handle YAML-only field violations - allow partial comparison
              if (validation.yamlOnlyVars && validation.yamlOnlyVars.length > 0) {
                console.log("⚠️ [ENV COMPARE] YAML-only fields detected - will be excluded from comparison:", validation.yamlOnlyVars);
                
                // Filter out YAML-only fields from envVars for comparison
                const yamlOnlyKeys = new Set(validation.yamlOnlyVars.map(v => v.envKey));
                const filteredEnvVars: Record<string, string> = {};
                Object.entries(envVars).forEach(([key, value]) => {
                  if (!yamlOnlyKeys.has(key)) {
                    filteredEnvVars[key] = value;
                  }
                });
                
                console.log(`✅ [ENV COMPARE] Proceeding with ${Object.keys(filteredEnvVars).length} valid fields (${validation.yamlOnlyVars.length} YAML-only fields excluded)`);
                
                // Continue with comparison using filtered env vars
                const configUpdates = registryMapEnvToConfig(filteredEnvVars);
                setComparisonData({
                  type: 'env',
                  fileName: file.name,
                  proposedChanges: configUpdates,
                  skippedYamlFields: validation.yamlOnlyVars // Pass skipped fields to comparison UI
                });
                setShowComparisonDialog(true);
                
                return;
              }
              
              // Handle unmapped variables - offer partial import
              if (validation.unmappedVars && validation.unmappedVars.length > 0) {
                console.log("⚠️ [ENV COMPARE] Unmapped environment variables detected:", validation.unmappedVars);
                
                const totalFields = Object.keys(envVars).length;
                const unsupportedCount = validation.unmappedVars.length;
                const validCount = totalFields - unsupportedCount;
                
                setUnsupportedFieldsData({
                  type: 'env',
                  fileName: file.name,
                  unsupportedFields: validation.unmappedVars,
                  totalFields,
                  validFields: validCount,
                  allData: envVars
                });
                setShowUnsupportedFieldsDialog(true);
                
                return;
              }
            }
            
            // Map ENV to configuration format
            const proposedChanges = mapEnvToConfiguration(envVars);
            console.log("   - Proposed changes mapped from ENV");
            
            // Open comparison dialog
            setComparisonData({
              type: 'env',
              fileName: file.name,
              proposedChanges
            });
            setShowComparisonDialog(true);
          } catch (error) {
            console.error("ENV comparison error:", error);
            toast({
              title: "Comparison Failed",
              description: "Failed to parse environment file. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleApplyComparison = (selectedFieldIds: string[]) => {
    if (!comparisonData) return;
    
    try {
      console.log(`📥 [${comparisonData.type.toUpperCase()} IMPORT] Applying ${selectedFieldIds.length} selected changes from comparison`);
      
      // Filter proposed changes to only include selected fields
      const filteredProposedChanges: Partial<Configuration> = {};
      
      for (const fieldId of selectedFieldIds) {
        const field = FIELD_REGISTRY.find(f => f.id === fieldId);
        if (!field) continue;
        
        const path = field.yamlPath || field.id;
        const pathParts = path.split('.');
        
        // Get value from proposedChanges
        let value: any = comparisonData.proposedChanges;
        for (const part of pathParts) {
          if (value === undefined) break;
          value = value[part];
        }
        
        // Set value in filteredProposedChanges
        if (value !== undefined) {
          let current: any = filteredProposedChanges;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) current[part] = {};
            current = current[part];
          }
          current[pathParts[pathParts.length - 1]] = value;
        }
      }
      
      console.log(`   - Filtered to ${selectedFieldIds.length} selected fields`);
      
      // Use the same import logic as the regular import handlers
      if (comparisonData.type === 'yaml') {
        const analysis = analyzeConfigurationChanges(configuration, filteredProposedChanges);
        const configWithOverrides = markImportedFieldsAsExplicit(configuration, filteredProposedChanges);
        updateConfiguration(configWithOverrides, true);
        
        setImportSummaryData({
          type: 'yaml',
          fileName: comparisonData.fileName,
          ...analysis
        });
        setShowImportSummary(true);
      } else {
        const analysis = analyzeConfigurationChanges(configuration, filteredProposedChanges);
        const configWithOverrides = markImportedFieldsAsExplicit(configuration, filteredProposedChanges);
        updateConfiguration(configWithOverrides, true);
        
        setImportSummaryData({
          type: 'env',
          fileName: comparisonData.fileName,
          ...analysis
        });
        setShowImportSummary(true);
      }
      
      toast({
        title: "Changes Applied",
        description: `${selectedFieldIds.length} selected ${selectedFieldIds.length === 1 ? 'field' : 'fields'} imported from ${comparisonData.fileName}`,
      });
    } catch (error) {
      console.error("Apply comparison error:", error);
      toast({
        title: "Apply Failed",
        description: "Failed to apply configuration changes.",
        variant: "destructive",
      });
    }
  };

  const handleRoundTripTest = async () => {
    console.log("🔄 [ROUND-TRIP TEST] Starting REAL WORKFLOW import/export parity test...");
    console.log("   This test simulates the exact user workflow: Export → Import → Compare");
    
    const errors: string[] = [];
    let testsPassed = 0;
    let totalTests = 2; // .yaml, .json (.env intentionally excluded as it's partial)
    
    // Save EXACT baseline configuration (this is what we'll try to recover)
    const baselineConfig = JSON.parse(JSON.stringify(configuration));
    console.log("📸 [BASELINE] Saved current configuration with", Object.keys(baselineConfig).length, "top-level fields");
    
    try {
      // Generate package (EXACTLY as user does)
      console.log("📦 [EXPORT] Generating package...");
      const packageResult = await generatePackage({
        packageName: "ROUND_TRIP_TEST",
        includeFiles: ["env", "yaml"]
      });
      
      // Test 1: YAML round-trip (SIMULATE REAL USER WORKFLOW)
      console.log("\n=== TEST 1: YAML Round-Trip (Real User Workflow) ===");
      try {
        const yamlContent = packageResult.files["librechat.yaml"];
        if (!yamlContent) {
          errors.push("YAML file not generated");
        } else {
          console.log("   1. User exports YAML");
          console.log("   2. User imports YAML through UI");
          
          // Parse YAML (what the import handler does)
          const yamlData = yaml.load(yamlContent) as any;
          console.log("   3. YAML parsed successfully");
          
          // Map YAML to configuration (WITH placeholder stripping - this is the key!)
          const configFromYaml = mapYamlToConfiguration(yamlData);
          console.log("   4. YAML mapped to configuration (placeholders stripped)");
          
          // THIS IS THE CRITICAL COMPARISON:
          // We're comparing the ORIGINAL config (baseline) against the RE-IMPORTED config
          // If placeholders were exported but stripped on import, this will show differences
          const analysis = analyzeConfigurationChanges(baselineConfig, configFromYaml);
          
          console.log(`📊 YAML Results: ${analysis.newFields} new, ${analysis.updatedFields} updated, ${analysis.unchangedFields} unchanged`);
          
          if (analysis.newFields === 0 && analysis.updatedFields === 0) {
            testsPassed++;
            console.log("✅ YAML round-trip PASSED - Perfect parity!");
          } else {
            errors.push(`YAML: ${analysis.newFields} new, ${analysis.updatedFields} updated`);
            console.log("❌ YAML round-trip FAILED - Field differences detected!");
            
            // Show detailed breakdown
            const newFields = analysis.fieldDetails.filter(f => f.status === 'new');
            const updatedFields = analysis.fieldDetails.filter(f => f.status === 'updated');
            
            if (newFields.length > 0) {
              console.log("\n🆕 NEW FIELDS (present in import but missing in baseline):");
              newFields.slice(0, 20).forEach(f => {
                console.log(`   - ${f.name}`);
              });
              if (newFields.length > 20) console.log(`   ... and ${newFields.length - 20} more`);
            }
            
            if (updatedFields.length > 0) {
              console.log("\n🔄 UPDATED FIELDS (value changed during round-trip):");
              updatedFields.slice(0, 20).forEach(f => {
                console.log(`   - ${f.name}`);
              });
              if (updatedFields.length > 20) console.log(`   ... and ${updatedFields.length - 20} more`);
            }
          }
        }
      } catch (error) {
        errors.push(`.yaml test error: ${error}`);
        console.error("YAML test error:", error);
      }
      
      // Test 2: JSON round-trip
      console.log("\n=== TEST 2: JSON Round-Trip (Real User Workflow) ===");
      try {
        const jsonContent = packageResult.files["LibreChatConfigSettings.json"];
        if (!jsonContent) {
          errors.push("JSON file not generated");
        } else {
          console.log("   1. User exports JSON");
          console.log("   2. User imports JSON through UI");
          
          const jsonData = JSON.parse(jsonContent);
          const configFromJson = jsonData.configuration;
          console.log("   3. JSON parsed and configuration extracted");
          
          const analysis = analyzeConfigurationChanges(baselineConfig, configFromJson);
          
          console.log(`📊 JSON Results: ${analysis.newFields} new, ${analysis.updatedFields} updated, ${analysis.unchangedFields} unchanged`);
          
          if (analysis.newFields === 0 && analysis.updatedFields === 0) {
            testsPassed++;
            console.log("✅ JSON round-trip PASSED - Perfect parity!");
          } else {
            errors.push(`JSON: ${analysis.newFields} new, ${analysis.updatedFields} updated`);
            console.log("❌ JSON round-trip FAILED - Field differences detected!");
            
            const newFields = analysis.fieldDetails.filter(f => f.status === 'new');
            const updatedFields = analysis.fieldDetails.filter(f => f.status === 'updated');
            
            if (newFields.length > 0) {
              console.log("\n🆕 NEW FIELDS:");
              newFields.slice(0, 20).forEach(f => {
                console.log(`   - ${f.name}`);
              });
            }
            
            if (updatedFields.length > 0) {
              console.log("\n🔄 UPDATED FIELDS:");
              updatedFields.slice(0, 20).forEach(f => {
                console.log(`   - ${f.name}`);
              });
            }
          }
        }
      } catch (error) {
        errors.push(`JSON test error: ${error}`);
        console.error("JSON test error:", error);
      }
      
      console.log(`\n🎯 ROUND-TRIP TEST RESULTS: ${testsPassed}/${totalTests} passed`);
      console.log("================================================\n");
      
      if (testsPassed === totalTests) {
        toast({
          title: "✅ Round-Trip Test PASSED",
          description: `All ${totalTests} formats maintain perfect bidirectional parity!`,
        });
      } else {
        toast({
          title: "❌ Round-Trip Test FAILED",
          description: `${testsPassed}/${totalTests} passed. Check console for detailed field differences.`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Round-trip test critical error:", error);
      toast({
        title: "Test Error",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  const confirmRunSelfTest = async () => {
    setShowSelfTestConfirmation(false);
    try {
      // Verify current configuration first
      const verification = verifyConfiguration();
      console.log("🔍 [SELF-TEST] Configuration verification:", verification);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      let testsPassed = 0;
      let totalTests = 0;
      
      // Test 1: JSON Export Validation
      totalTests++;
      try {
        const profileData = {
          name: "SELF_TEST_PROFILE",
          configuration: configuration,
          version: "0.8.0-rc4",
          createdAt: new Date().toISOString()
        };
        const jsonString = JSON.stringify(profileData, null, 2);
        const parsedProfile = JSON.parse(jsonString);
        
        // Deep equality check between original and parsed configuration
        const configKeys = Object.keys(configuration);
        const parsedKeys = Object.keys(parsedProfile.configuration);
        
        if (configKeys.length !== parsedKeys.length) {
          errors.push(`JSON Export: Field count mismatch (${configKeys.length} vs ${parsedKeys.length})`);
        } else {
          let fieldMismatches = 0;
          for (const key of configKeys) {
            const original = configuration[key as keyof typeof configuration];
            const parsed = parsedProfile.configuration[key];
            if (JSON.stringify(original) !== JSON.stringify(parsed)) {
              fieldMismatches++;
              if (fieldMismatches <= 3) { // Log first 3 mismatches
                errors.push(`JSON Export: Field ${key} mismatch: ${JSON.stringify(original)} !== ${JSON.stringify(parsed)}`);
              }
            }
          }
          if (fieldMismatches === 0) {
            testsPassed++;
            console.log("✅ [SELF-TEST] JSON export validation passed");
          } else if (fieldMismatches > 3) {
            errors.push(`JSON Export: ${fieldMismatches - 3} additional field mismatches...`);
          }
        }
      } catch (error) {
        errors.push(`JSON Export: Parse error - ${error}`);
      }
      
      // Test 2: Package Generation and ENV File Validation
      totalTests++;
      try {
        const packageResult = await generatePackage({
          packageName: "SELF_TEST_PACKAGE",
          includeFiles: ["env", "yaml", "docker-compose", "install-script", "mongo-backup", "readme"]
        });
        
        const envContent = packageResult.files[".env"];
        if (!envContent) {
          errors.push("ENV Export: .env file not generated");
        } else {
          // Parse .env file back to object
          const envVars: Record<string, string> = {};
          const envLines = envContent.split('\n').filter((line: string) => 
            line.trim() && !line.trim().startsWith('#') && line.includes('=')
          );
          
          for (const line of envLines) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').trim();
            }
          }
          
          // Validate critical fields that should be present
          const criticalFields = [
            { configKey: 'appTitle', envKey: 'APP_TITLE' },
            { configKey: 'host', envKey: 'HOST' },
            { configKey: 'port', envKey: 'PORT' },
            { configKey: 'openaiApiKey', envKey: 'OPENAI_API_KEY' },
            { configKey: 'anthropicApiKey', envKey: 'ANTHROPIC_API_KEY' }
          ];
          
          let envMismatches = 0;
          for (const { configKey, envKey } of criticalFields) {
            const configValue = configuration[configKey as keyof typeof configuration];
            const envValue = envVars[envKey];
            
            if (configValue && !envValue) {
              envMismatches++;
              errors.push(`ENV Export: Missing ${envKey} for configured ${configKey}`);
            } else if (configValue && envValue && String(configValue) !== envValue) {
              envMismatches++;
              warnings.push(`ENV Export: Value mismatch for ${envKey}: config="${configValue}" env="${envValue}"`);
            }
          }
          
          if (envMismatches === 0) {
            testsPassed++;
            console.log("✅ [SELF-TEST] ENV export validation passed");
          }
          
          console.log(`📝 [SELF-TEST] ENV file: ${envLines.length} variables, ${envContent.length} chars`);
        }
      } catch (error) {
        errors.push(`ENV Export: Generation error - ${error}`);
      }
      
      // Test 3: YAML Export Validation  
      totalTests++;
      try {
        const packageResult = await generatePackage({
          packageName: "SELF_TEST_PACKAGE_YAML",
          includeFiles: ["yaml"]
        });
        
        const yamlContent = packageResult.files["librechat.yaml"];
        if (!yamlContent) {
          errors.push("YAML Export: librechat.yaml file not generated");
        } else {
          // Try to parse YAML content
          try {
            const parsedYaml = yaml.load(yamlContent) as any;
            if (parsedYaml && typeof parsedYaml === 'object') {
              testsPassed++;
              console.log("✅ [SELF-TEST] YAML export validation passed");
              console.log(`📄 [SELF-TEST] YAML file: ${yamlContent.split('\n').length} lines, ${yamlContent.length} chars`);
            } else {
              errors.push("YAML Export: Parsed YAML is not an object");
            }
          } catch (yamlError) {
            errors.push(`YAML Export: Parse error - ${yamlError}`);
          }
        }
      } catch (error) {
        errors.push(`YAML Export: Generation error - ${error}`);
      }
      
      // Compile results
      const selfTestResults = {
        summary: {
          testsPassed,
          totalTests,
          successRate: Math.round((testsPassed / totalTests) * 100),
          configurationFields: verification.current.populatedFields,
          totalFields: verification.current.totalFields,
          completionPercentage: verification.current.completionPercentage
        },
        errors,
        warnings,
        singleSourceOfTruth: testsPassed === totalTests,
        details: {
          configurationSize: JSON.stringify(configuration).length,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log("🎯 [COMPREHENSIVE SELF-TEST RESULTS]", selfTestResults);
      
      if (errors.length === 0) {
        toast({
          title: "✅ Export Functions Verified",
          description: `File generation working correctly! Current config: ${verification.current.populatedFields}/${verification.current.totalFields} fields (${verification.current.completionPercentage}%). All export formats (JSON, ENV, YAML) validated successfully.`,
        });
      } else {
        toast({
          title: `❌ Self-Test Failed (${testsPassed}/${totalTests})`,
          description: `${errors.length} errors, ${warnings.length} warnings. Check console for details. Single source of truth validation failed.`,
          variant: "destructive",
        });
      }
      
      return selfTestResults;
    } catch (error) {
      console.error("❌ [SELF-TEST] Critical failure:", error);
      toast({
        title: "Self-Test Critical Failure",
        description: "Test execution failed completely. Check console for detailed error information.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePackage = async () => {
    try {
      // Generate package name from configuration name (without .zip extension)
      const packageName = configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-').replace(/\s+/g, '-');
      
      const result = await generatePackage({
        includeFiles: ["env", "yaml", "docker-compose", "install-script", "mongo-backup", "readme"],
        packageName: packageName,
      });
      
      
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add each file to the ZIP (dynamically include all files from backend)
      Object.entries(result.files).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      
      // Generate ZIP file and download with Save As dialog
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const { downloadZIP } = await import("@/lib/download-utils");
      const filename = `${configuration.configurationName.replace(/[^a-zA-Z0-9-_\s]/g, '-')}.zip`;
      const success = await downloadZIP(zipBlob, filename);

      if (success) {
        toast({
          title: "Package Generated",
          description: "LibreChat installation package downloaded as ZIP file.",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate installation package.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cog text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    LibreChat Configuration Tool 
                    <span className="text-sm font-normal text-muted-foreground ml-2">v{getToolVersion()}</span>
                    <span className="text-sm font-normal text-muted-foreground mx-2">•</span>
                    <button 
                      onClick={() => setShowAboutDialog(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-about"
                    >
                      About
                    </button>
                    <span className="text-sm font-normal text-muted-foreground mx-2">•</span>
                    <a 
                      href="https://youtu.be/7NOCdZaukuM?si=lRFjX0mcHJpOT5Ey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-video-demo"
                    >
                      Video Demo
                    </a>
                  </h1>
                  <p className="text-sm text-muted-foreground">Currently supporting: LibreChat v{getVersionInfo().librechatTarget}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Configuration Name Input */}
              <div className="flex items-center space-x-3">
                <Label htmlFor="profile-name" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Configuration name:
                </Label>
                <Input
                  id="profile-name"
                  value={configuration.configurationName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateConfiguration({ configurationName: newName });
                  }}
                  className="text-lg font-medium w-72 border-border"
                  placeholder="Enter configuration name..."
                  data-testid="input-config-name"
                />
              </div>
              
              {/* Configuration Management Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" data-testid="button-profile-menu">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Configuration
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={handleSaveProfile} data-testid="menu-save">
                    <Save className="h-4 w-4 mr-2" />
                    Export LibreChat Configuration Settings (json)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleResetToDefaults} data-testid="menu-reset">
                    <Settings className="h-4 w-4 mr-2" />
                    Reset to LibreChat Defaults
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetAllFieldStates} data-testid="menu-reset-field-states">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All Field States to "Not Set"
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLoadDemoConfiguration} data-testid="menu-load-demo">
                    <Zap className="h-4 w-4 mr-2" />
                    Load Demo Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRunSelfTest} data-testid="menu-self-test">
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Comprehensive Self-Test
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRoundTripTest} data-testid="menu-roundtrip-test">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Round-Trip Parity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleImportProfile} data-testid="menu-import-profile">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Full JSON (Replace All)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportMerge} data-testid="menu-import-merge">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Merge JSON (Preserve Existing)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportYaml} data-testid="menu-import-yaml">
                    <FileText className="h-4 w-4 mr-2" />
                    Import librechat.yaml
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportEnv} data-testid="menu-import-env">
                    <Settings className="h-4 w-4 mr-2" />
                    Import Environment File (.env)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCompareYaml} data-testid="menu-compare-yaml">
                    <FileText className="h-4 w-4 mr-2" />
                    Compare librechat.yaml
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCompareEnv} data-testid="menu-compare-env">
                    <Settings className="h-4 w-4 mr-2" />
                    Compare Environment File (.env)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="h-6 border-l border-border mx-2"></div>
              
              {/* Configuration History */}
              <ConfigurationHistory onConfigurationLoad={(loadedData) => {
                // Full replacement of configuration and name
                const configToLoad = loadedData.configuration || loadedData;
                if (loadedData.packageName) {
                  updateConfiguration({ ...configToLoad, configurationName: loadedData.packageName }, true);
                } else {
                  updateConfiguration(configToLoad, true);
                }
              }} />
              
              {/* Package Generation Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" data-testid="button-package-menu">
                    <Rocket className="h-4 w-4 mr-2" />
                    Package
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {isDemo && (
                    <>
                      <div className="px-3 py-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-l-4 border-amber-400 mx-2 my-2 rounded-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Online Hosted Demo</span>
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                          Go to GitHub to self-host securely for full functionality:
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" />
                          <a 
                            href="https://github.com/Fritsl/LibreChatConfigurator" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            github.com/Fritsl/LibreChatConfigurator
                          </a>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowPreview(true)} data-testid="menu-preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Individual files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGeneratePackage} data-testid="menu-generate">
                    <Download className="h-4 w-4 mr-2" />
                    Generate & Download ZIP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-full mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200">
                This is in Demo mode, running without backend, go to{" "}
                <a 
                  href="https://github.com/Fritsl/LibreChatConfigurator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-700 dark:text-red-300 underline hover:text-red-900 dark:hover:text-red-100 font-medium"
                  data-testid="link-demo-banner-github"
                >
                  github repository
                </a>
                {" "}to be able to create full one-click LibreChat installations
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1">
          <ConfigurationTabs 
            configuration={configuration}
            onConfigurationChange={updateConfiguration}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </main>
      </div>


      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          configuration={configuration}
          onClose={() => setShowPreview(false)}
          onGenerate={handleGeneratePackage}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <AlertDialogContent data-testid="dialog-reset-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to LibreChat Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset your configuration to LibreChat RC4 defaults?
              <br /><br />
              <strong>This will:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Reset all settings to official LibreChat defaults</li>
                <li>• <span className="text-green-600 font-medium">Preserve your API keys and secrets</span></li>
                <li>• Clear custom configurations, integrations, and preferences</li>
              </ul>
              <br />
              This action cannot be undone without re-importing your configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetToDefaults}
              data-testid="button-confirm-reset"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reset Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Self-Test Confirmation Dialog */}
      <AlertDialog open={showSelfTestConfirmation} onOpenChange={setShowSelfTestConfirmation}>
        <AlertDialogContent data-testid="dialog-selftest-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Run Comprehensive Self-Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to run the comprehensive self-test?
              <br /><br />
              <strong>This will:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <span className="text-red-600 font-medium">Overwrite all current content and configuration</span></li>
                <li>• Test JSON export validation with test data</li>
                <li>• Generate and validate ENV and YAML files</li>
                <li>• Run extensive package generation tests</li>
                <li>• <span className="text-amber-600 font-medium">Potentially generate large test files</span></li>
              </ul>
              <br />
              <strong className="text-red-600">WARNING:</strong> Your current configuration will be replaced with test data. Save your configuration first if you want to keep your current settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-selftest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRunSelfTest}
              data-testid="button-confirm-selftest"
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Yes, Run Self-Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-about">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About LibreChat Configuration Tool
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Purpose */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Purpose</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This tool simplifies LibreChat setup by providing an intuitive interface for configuring all LibreChat settings. 
                  Instead of manually editing complex configuration files, you can configure everything through a user-friendly interface 
                  and generate complete installation packages with one click.
                </p>
                <p>
                  The <strong>Package</strong> dropdown allows you to generate ready-to-deploy installation packages containing 
                  all necessary configuration files, Docker setup, and installation scripts - making LibreChat deployment as simple as 
                  downloading and running.
                </p>
              </div>
            </div>

            {/* Author Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Created by</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Frits Lyneborg</strong>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://fritslyneborg.dk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    data-testid="link-author-website"
                  >
                    fritslyneborg.dk
                  </a>
                </div>
              </div>
            </div>

            {/* Repository Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Official Repository</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://github.com/Fritsl/LibreChatConfigurator" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    data-testid="link-github-repository"
                  >
                    github.com/Fritsl/LibreChatConfigurator
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://github.com/Fritsl/LibreChatConfigurator/blob/main/README.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    data-testid="link-github-readme"
                  >
                    View detailed documentation (README.md)
                  </a>
                </div>
              </div>
            </div>

            {/* Usage Guidance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Recommended Usage</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Security Notice
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        To avoid exposing API keys and sensitive configuration data, it's strongly recommended to build and run this tool locally rather than using the hosted version.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p><strong>Recommended:</strong> Local deployment</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Full functionality including ZIP package generation</li>
                    <li>Secure handling of API keys and credentials</li>
                    <li>No data sent to external servers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p><strong>Alternative:</strong> Hosted version (Netlify)</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Great for testing and exploring features</li>
                    <li>Limited functionality (no ZIP package generation)</li>
                    <li>Should not be used with real API keys</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Getting Started
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        For local setup instructions, please see the Quick Start guide in the README file of the GitHub repository.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Configuration Tool v{getToolVersion()}</span>
                <span>Supporting LibreChat v{getVersionInfo().librechatTarget}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Results Dialog */}
      <Dialog open={showMergeResults} onOpenChange={setShowMergeResults}>
        <DialogContent className="max-w-2xl" data-testid="dialog-merge-results">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Configuration Merged Successfully
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-testid="merge-success-message">
              <p className="text-sm text-green-800 dark:text-green-200" data-testid="text-merge-source">
                Settings from <span className="font-semibold">{mergeDetails?.name}</span> have been merged into your configuration.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2" data-testid="text-merge-preserved">
                All other existing settings have been preserved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2" data-testid="text-imported-fields-count">Imported Fields ({mergeDetails?.fields.length || 0}):</h3>
              <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="list-imported-fields">
                <ul className="space-y-1">
                  {mergeDetails?.fields.map((field) => (
                    <li key={field} className="text-sm font-mono text-muted-foreground flex items-center gap-2" data-testid={`field-${field}`}>
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowMergeResults(false)} data-testid="button-close-merge-results">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* YAML-Only Fields Dialog */}
      <Dialog open={showYamlOnlyDialog} onOpenChange={setShowYamlOnlyDialog}>
        <DialogContent className="max-w-4xl" data-testid="dialog-yaml-only-fields">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Import Blocked: YAML-Only Fields in .env File
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4" data-testid="yaml-only-warning">
              <p className="text-sm text-destructive font-semibold" data-testid="text-yaml-only-count">
                Your .env file contains <span className="font-bold">{yamlOnlyFieldsData?.length || 0}</span> field{(yamlOnlyFieldsData?.length || 0) > 1 ? 's' : ''} that can ONLY be configured in librechat.yaml
              </p>
              <p className="text-sm text-destructive/80 mt-2">
                <strong>LibreChat Requirement:</strong> These fields are not recognized by LibreChat when placed in .env files. They must be in librechat.yaml to work properly.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm" data-testid="text-yaml-only-title">
                  Fields That Must Move to librechat.yaml ({yamlOnlyFieldsData?.length || 0}):
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const mapping = yamlOnlyFieldsData?.map(({ envKey, yamlPath }) => 
                        `${envKey} → ${yamlPath}`
                      ).join('\n') || '';
                      navigator.clipboard.writeText(mapping);
                      toast({
                        title: "Copied to Clipboard",
                        description: `${yamlOnlyFieldsData?.length} field mappings copied.`,
                      });
                    }}
                    data-testid="button-copy-yaml-mapping"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Copy Mapping
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (!yamlOnlyFieldsData || yamlOnlyFieldsData.length === 0) return;
                      
                      const updates: any = {};
                      let successCount = 0;
                      
                      yamlOnlyFieldsData.forEach(({ yamlPath, value }) => {
                        const pathParts = yamlPath.split('.');
                        let current = updates;
                        
                        for (let i = 0; i < pathParts.length - 1; i++) {
                          const part = pathParts[i];
                          if (!current[part]) {
                            current[part] = {};
                          }
                          current = current[part];
                        }
                        
                        const lastPart = pathParts[pathParts.length - 1];
                        current[lastPart] = value;
                        successCount++;
                      });
                      
                      updateConfiguration(updates, false);
                      
                      toast({
                        title: "✅ Migration Complete",
                        description: `Successfully migrated ${successCount} field${successCount > 1 ? 's' : ''} to librechat.yaml configuration.`,
                      });
                      
                      setShowYamlOnlyDialog(false);
                    }}
                    data-testid="button-auto-migrate-yaml"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Migrate to YAML
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto" data-testid="list-yaml-only-fields">
                <div className="space-y-2">
                  {yamlOnlyFieldsData?.map(({ envKey, yamlPath }, index) => (
                    <div key={envKey} className="text-sm font-mono border-l-2 border-yellow-500 pl-3 py-1" data-testid={`yaml-field-${envKey}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-8">{index + 1}.</span>
                        <span className="text-destructive font-semibold">{envKey}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-primary">{yamlPath}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    How to Fix
                  </p>
                  <div className="space-y-3">
                    <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded p-2 border border-blue-300 dark:border-blue-700">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">✨ Option 1: Auto-Migrate (Recommended)</p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">
                        Click the <strong>"Auto-Migrate to YAML"</strong> button above to automatically transfer all values to the correct librechat.yaml paths. Fast and error-free!
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">🔧 Option 2: Manual Fix</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 ml-2 text-xs">
                        <li>Remove these fields from your .env file</li>
                        <li>Add them to your librechat.yaml file using the paths shown above (e.g., <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">interface.customFooter</code>)</li>
                        <li>Retry the import</li>
                      </ol>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                    <strong>Why?</strong> LibreChat doesn't support these specific fields in .env files. They must be in librechat.yaml or they won't work.
                  </p>
                  <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> API keys and other sensitive settings CAN be in .env safely - this tool routes them there for security while LibreChat is in beta.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowYamlOnlyDialog(false)}
                data-testid="button-close-yaml-only-dialog"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Partial Import Choice Dialog */}
      <AlertDialog open={showPartialImportChoice} onOpenChange={setShowPartialImportChoice}>
        <AlertDialogContent className="max-w-3xl" data-testid="dialog-partial-import-choice">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              YAML-Only Fields Detected in .env File
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold" data-testid="text-partial-import-summary">
                  Your .env file contains {partialImportData?.yamlOnlyVars.length || 0} field{(partialImportData?.yamlOnlyVars.length || 0) > 1 ? 's' : ''} that can only work in librechat.yaml
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {partialImportData?.validEnvVarsCount || 0} valid .env field{(partialImportData?.validEnvVarsCount || 0) !== 1 ? 's' : ''} can be imported
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                      {partialImportData?.yamlOnlyVars.length || 0} YAML-only field{(partialImportData?.yamlOnlyVars.length || 0) !== 1 ? 's' : ''} will be skipped
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valid fields that WILL be imported */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">
                    ✅ Valid .env Fields ({partialImportData?.validEnvVarsCount || 0} will be imported):
                  </h4>
                  <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-1">
                      {partialImportData && Object.keys(partialImportData.allEnvVars)
                        .filter(key => !partialImportData.yamlOnlyVars.some(v => v.envKey === key))
                        .map((envKey, index) => (
                          <div key={envKey} className="text-xs font-mono border-l-2 border-green-500 pl-2 py-0.5">
                            <span className="text-muted-foreground mr-2">{index + 1}.</span>
                            <span className="text-green-700 dark:text-green-400">{envKey}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* YAML-only fields that will be skipped */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-yellow-700 dark:text-yellow-300">
                    ⏭️ YAML-Only Fields ({partialImportData?.yamlOnlyVars.length || 0} will be skipped):
                  </h4>
                  <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-1">
                      {partialImportData?.yamlOnlyVars.map(({ envKey, yamlPath }, index) => (
                        <div key={envKey} className="text-xs font-mono border-l-2 border-yellow-500 pl-2 py-0.5">
                          <span className="text-muted-foreground mr-2">{index + 1}.</span>
                          <span className="text-yellow-700 dark:text-yellow-400">{envKey}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="text-primary text-xs">{yamlPath}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What would you like to do?</strong>
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4 list-disc">
                  <li><strong>Import valid fields only:</strong> Import the {partialImportData?.validEnvVarsCount || 0} .env-compatible field{(partialImportData?.validEnvVarsCount || 0) !== 1 ? 's' : ''} (API keys will be safely exported to .env)</li>
                  <li><strong>Cancel:</strong> Don't import anything</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  <em>Note:</em> API keys and sensitive data can safely be in .env - this tool routes them there for security while LibreChat is in beta.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-partial-import">
              Cancel Import
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePartialImport}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-partial-import"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Import {partialImportData?.validEnvVarsCount || 0} Valid Field{(partialImportData?.validEnvVarsCount || 0) !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsupported Fields Dialog - Now with Partial Import Option */}
      <AlertDialog open={showUnsupportedFieldsDialog} onOpenChange={setShowUnsupportedFieldsDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-unsupported-fields">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Unsupported Fields Detected in {unsupportedFieldsData?.fileName}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold" data-testid="text-unsupported-summary">
                  Your {unsupportedFieldsData?.type === 'yaml' ? 'YAML' : '.env'} file contains {unsupportedFieldsData?.unsupportedFields.length || 0} field{(unsupportedFieldsData?.unsupportedFields.length || 0) !== 1 ? 's' : ''} not yet supported by this tool
                </p>
                {unsupportedFieldsData && unsupportedFieldsData.validFields > 0 ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        {unsupportedFieldsData.validFields} valid field{unsupportedFieldsData.validFields !== 1 ? 's' : ''} can be imported
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                        {unsupportedFieldsData.unsupportedFields.length} unsupported field{unsupportedFieldsData.unsupportedFields.length !== 1 ? 's' : ''} will be skipped
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    All fields in this file are unsupported. Nothing can be imported.
                  </p>
                )}
              </div>

              {/* Valid Fields Section */}
              {unsupportedFieldsData && unsupportedFieldsData.validFields > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-green-700 dark:text-green-300" data-testid="text-valid-fields-title">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Valid {unsupportedFieldsData.type === 'yaml' ? 'YAML Fields' : 'Environment Variables'} ({unsupportedFieldsData.validFields}):
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const unsupportedSet = new Set(unsupportedFieldsData.unsupportedFields);
                        const validFields = unsupportedFieldsData.type === 'env'
                          ? Object.keys(unsupportedFieldsData.allData as Record<string, string>).filter(key => !unsupportedSet.has(key))
                          : ['(Complex YAML structure - will be mapped on import)'];
                        const fieldsList = validFields.join('\n');
                        navigator.clipboard.writeText(fieldsList);
                        toast({
                          title: "Copied to Clipboard",
                          description: `${validFields.length} valid field names copied.`,
                        });
                      }}
                      data-testid="button-copy-valid-fields"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Copy List
                    </Button>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-h-48 overflow-y-auto" data-testid="list-valid-fields">
                    <pre className="text-xs font-mono text-green-700 dark:text-green-300 whitespace-pre-wrap select-all">
                      {unsupportedFieldsData.type === 'env' ? (
                        (() => {
                          const unsupportedSet = new Set(unsupportedFieldsData.unsupportedFields);
                          const validFields = Object.keys(unsupportedFieldsData.allData as Record<string, string>)
                            .filter(key => !unsupportedSet.has(key))
                            .sort();
                          return validFields.map((field, index) => `${index + 1}. ${field}`).join('\n');
                        })()
                      ) : (
                        '(YAML fields will be mapped to configuration on import - structure varies)'
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Unsupported Fields Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300" data-testid="text-unsupported-fields-title">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Unsupported {unsupportedFieldsData?.type === 'yaml' ? 'YAML Fields' : 'Environment Variables'} ({unsupportedFieldsData?.unsupportedFields.length || 0}):
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fieldsList = unsupportedFieldsData?.unsupportedFields.join('\n') || '';
                      navigator.clipboard.writeText(fieldsList);
                      toast({
                        title: "Copied to Clipboard",
                        description: `${unsupportedFieldsData?.unsupportedFields.length} field names copied.`,
                      });
                    }}
                    data-testid="button-copy-unsupported-fields"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Copy List
                  </Button>
                </div>
                
                <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto" data-testid="list-unsupported-fields">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap select-all">
                    {unsupportedFieldsData?.unsupportedFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What would you like to do?</strong>
                </p>
                {unsupportedFieldsData && unsupportedFieldsData.validFields > 0 ? (
                  <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4 list-disc">
                    <li><strong>Import valid fields only:</strong> Import the {unsupportedFieldsData.validFields} supported field{unsupportedFieldsData.validFields !== 1 ? 's' : ''} and skip unsupported ones</li>
                    <li><strong>Cancel:</strong> Don't import anything (report unsupported fields or remove them first)</li>
                  </ul>
                ) : (
                  <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4 list-disc">
                    <li>Report these fields so they can be added to the tool</li>
                    <li>OR remove unsupported fields from your file and retry</li>
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unsupported-import">
              Cancel
            </AlertDialogCancel>
            {unsupportedFieldsData && unsupportedFieldsData.validFields > 0 && (
              <AlertDialogAction
                onClick={() => {
                  // Handle partial import of valid fields
                  if (!unsupportedFieldsData) return;
                  
                  const unsupportedSet = new Set(unsupportedFieldsData.unsupportedFields);
                  
                  if (unsupportedFieldsData.type === 'env') {
                    // Filter out unsupported env vars
                    const validEnvVars: Record<string, string> = {};
                    Object.entries(unsupportedFieldsData.allData as Record<string, string>).forEach(([key, value]) => {
                      if (!unsupportedSet.has(key)) {
                        validEnvVars[key] = value;
                      }
                    });
                    
                    // Import valid fields
                    const configUpdates = registryMapEnvToConfig(validEnvVars);
                    updateConfiguration(configUpdates, false);
                    
                    toast({
                      title: "Partial Import Complete",
                      description: `Imported ${unsupportedFieldsData.validFields} valid fields. ${unsupportedFieldsData.unsupportedFields.length} unsupported fields were skipped.`,
                    });
                  } else {
                    // For YAML, we need to filter the data structure (complex)
                    // For now, import what we can
                    const configUpdates = registryMapYamlToConfig(unsupportedFieldsData.allData);
                    updateConfiguration(configUpdates, false);
                    
                    toast({
                      title: "Partial Import Complete",
                      description: `Imported valid YAML fields. ${unsupportedFieldsData.unsupportedFields.length} unsupported paths were skipped.`,
                    });
                  }
                  
                  setShowUnsupportedFieldsDialog(false);
                }}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-partial-unsupported-import"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Import {unsupportedFieldsData?.validFields || 0} Valid Field{(unsupportedFieldsData?.validFields || 0) !== 1 ? 's' : ''}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Summary Dialog */}
      <Dialog open={showImportSummary} onOpenChange={setShowImportSummary}>
        <DialogContent className="max-w-2xl" data-testid="dialog-import-summary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Successful
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary Header */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-testid="import-summary-header">
              <p className="text-sm text-green-800 dark:text-green-200">
                Successfully imported <span className="font-semibold">{importSummaryData?.fileName}</span>
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {importSummaryData?.type === 'yaml' ? 'LibreChat YAML Configuration' : 'Environment Variables'} • {importSummaryData?.totalFields} fields processed
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3" data-testid="card-new-fields">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importSummaryData?.newFields || 0}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  New Fields
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3" data-testid="card-updated-fields">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {importSummaryData?.updatedFields || 0}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Updated Fields
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-3" data-testid="card-unchanged-fields">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {importSummaryData?.unchangedFields || 0}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Unchanged
                </div>
              </div>
            </div>

            {/* Field Details */}
            {(importSummaryData?.newFields || 0) > 0 || (importSummaryData?.updatedFields || 0) > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm" data-testid="text-changes-title">
                  Changes Made:
                </h3>
                
                <div className="bg-muted rounded-lg p-4 max-h-80 overflow-y-auto" data-testid="list-field-changes">
                  <div className="space-y-1">
                    {importSummaryData?.fieldDetails
                      .filter(field => field.status !== 'unchanged')
                      .map((field, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 text-xs font-mono py-1"
                          data-testid={`field-change-${index}`}
                        >
                          {field.status === 'new' ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">NEW</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">UPD</span>
                          )}
                          <span className="text-muted-foreground">{field.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-center" data-testid="no-changes-message">
                <p className="text-sm text-muted-foreground">
                  All {importSummaryData?.totalFields} fields match your current configuration.
                </p>
              </div>
            )}

            {/* Skipped YAML-Only Fields (for partial imports) */}
            {importSummaryData?.skippedYamlFields && importSummaryData.skippedYamlFields.length > 0 && (
              <div className="space-y-2">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" data-testid="skipped-yaml-warning">
                  <h3 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    ⏭️ {importSummaryData.skippedYamlFields.length} YAML-Only Field{importSummaryData.skippedYamlFields.length !== 1 ? 's' : ''} Skipped
                  </h3>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    These fields can only work in librechat.yaml (LibreChat doesn't support them in .env). They were skipped during import.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    <em>Note:</em> API keys and other sensitive settings CAN be in .env - this tool routes them there for security while LibreChat is in beta.
                  </p>
                </div>
                
                <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto" data-testid="list-skipped-yaml-fields">
                  <div className="space-y-1">
                    {importSummaryData.skippedYamlFields.map(({ envKey, yamlPath }, index) => (
                      <div 
                        key={envKey} 
                        className="text-xs font-mono border-l-2 border-yellow-500 pl-3 py-1"
                        data-testid={`skipped-field-${envKey}`}
                      >
                        <span className="text-muted-foreground mr-2">{index + 1}.</span>
                        <span className="text-yellow-700 dark:text-yellow-400 font-semibold">{envKey}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="text-primary text-xs">{yamlPath}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowImportSummary(false)}
                data-testid="button-close-import-summary"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Comparison Dialog */}
      {comparisonData && (
        <ConfigurationComparison
          open={showComparisonDialog}
          onOpenChange={setShowComparisonDialog}
          type={comparisonData.type}
          fileName={comparisonData.fileName}
          currentConfig={configuration}
          proposedChanges={comparisonData.proposedChanges}
          skippedYamlFields={comparisonData.skippedYamlFields}
          onApply={handleApplyComparison}
        />
      )}
      
    </div>
  );
}
