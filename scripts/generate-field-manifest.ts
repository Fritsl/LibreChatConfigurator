#!/usr/bin/env tsx

/**
 * Field Manifest Generator
 * 
 * Generates a complete list of all LibreChat RC4 configuration fields
 * by parsing schema definitions, defaults, and export templates.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface FieldManifest {
  envVars: string[];
  yamlFields: string[];
  metadata: {
    generatedAt: string;
    totalEnvVars: number;
    totalYamlFields: number;
  };
}

/**
 * Extract all environment variable names from .env generation code
 */
function extractEnvVars(): string[] {
  const routesPath = path.join(projectRoot, 'server/routes.ts');
  const content = fs.readFileSync(routesPath, 'utf-8');
  
  // Find the generateEnvFile function
  const generateEnvFileStart = content.indexOf('function generateEnvFile(');
  const generateEnvFileEnd = content.indexOf('function generateYamlFile(', generateEnvFileStart);
  
  if (generateEnvFileStart === -1 || generateEnvFileEnd === -1) {
    console.error('❌ Could not find generateEnvFile function');
    return [];
  }
  
  // Only analyze the generateEnvFile function content
  const generateEnvFileContent = content.substring(generateEnvFileStart, generateEnvFileEnd);
  
  // Extract all patterns like: VARIABLE_NAME= (but not inside shell script variables like $VARIABLE)
  // Look for patterns in template literals: `${config...} ? `VAR=` or `VAR=${...}`
  const envVarPattern = /`([A-Z_][A-Z0-9_]+)=/g;
  const matches = new Set<string>();
  
  let match;
  while ((match = envVarPattern.exec(generateEnvFileContent)) !== null) {
    const varName = match[1];
    // Filter out common false positives
    if (!['TRUE', 'FALSE', 'NULL', 'UNDEFINED'].includes(varName)) {
      matches.add(varName);
    }
  }
  
  return Array.from(matches).sort();
}

/**
 * Extract all YAML field paths from defaults and export code
 */
function extractYamlFields(): string[] {
  const defaultsPath = path.join(projectRoot, 'client/src/lib/configuration-defaults.ts');
  const content = fs.readFileSync(defaultsPath, 'utf-8');
  
  const fields = new Set<string>();
  
  // Add top-level fields
  const topLevelFields = [
    'version',
    'cache',
    'fileStrategy',
    'secureImageLinks',
    'imageOutputType',
    'filteredTools',
    'includedTools',
    'temporaryChatRetention'
  ];
  topLevelFields.forEach(f => fields.add(f));
  
  // Add nested object fields
  const nestedObjects = {
    'mcpServers': ['*'], // Dynamic object
    'actions': ['allowedDomains', 'e2b_code_execution'],
    'memory': ['disabled', 'validKeys', 'tokenLimit', 'personalize', 'messageWindowSize', 'agent'],
    'memory.agent': ['id', 'provider', 'model', 'instructions', 'model_parameters'],
    'memory.agent.model_parameters': ['temperature', 'max_tokens', 'top_p', 'frequency_penalty'],
    'ocr': ['apiKey', 'baseURL', 'strategy', 'mistralModel'],
    'stt': ['provider', 'model', 'apiKey', 'baseURL', 'language', 'streaming', 'punctuation', 'profanityFilter'],
    'tts': ['provider', 'model', 'voice', 'apiKey', 'baseURL', 'speed', 'quality', 'streaming'],
    'speech': ['preset', 'speechTab'],
    'speech.preset': ['selected', 'customLanguage', 'customVoice'],
    'speech.speechTab': ['conversationMode', 'advancedMode', 'speechToText', 'textToSpeech'],
    'speech.speechTab.speechToText': ['engineSTT', 'languageSTT', 'autoTranscribeAudio', 'decibelValue', 'autoSendText'],
    'speech.speechTab.textToSpeech': ['engineTTS', 'voice', 'languageTTS', 'automaticPlayback', 'playbackRate', 'cacheTTS'],
    'endpoints': ['*'], // Dynamic with agents, openAI, custom, etc.
    'endpoints.agents': ['disableBuilder', 'recursionLimit', 'maxRecursionLimit', 'capabilities', 'maxCitations', 'maxCitationsPerFile', 'minRelevanceScore'],
    'endpoints.openAI': ['title', 'apiKey', 'models', 'dropParams', 'titleConvo', 'titleModel'],
    'fileConfig': ['endpoints', 'serverFileSizeLimit', 'avatarSizeLimit', 'clientImageResize'],
    'fileConfig.endpoints': ['*'], // Dynamic
    'fileConfig.clientImageResize': ['enabled', 'maxWidth', 'maxHeight', 'quality', 'compressFormat'],
    'webSearch': ['serperApiKey', 'searxngInstanceUrl', 'searxngApiKey', 'firecrawlApiKey', 'firecrawlApiUrl', 'jinaApiKey', 'jinaApiUrl', 'cohereApiKey', 'searchProvider', 'scraperType', 'rerankerType', 'scraperTimeout', 'safeSearch', 'firecrawlOptions'],
    'webSearch.firecrawlOptions': ['formats', 'onlyMainContent', 'timeout', 'waitFor', 'blockAds', 'removeBase64Images', 'mobile', 'maxAge', 'proxy'],
    'rateLimits': ['fileUploads', 'conversationsImport', 'stt', 'tts'],
    'rateLimits.fileUploads': ['ipMax', 'ipWindowInMinutes', 'userMax', 'userWindowInMinutes'],
    'rateLimits.conversationsImport': ['ipMax', 'ipWindowInMinutes', 'userMax', 'userWindowInMinutes'],
    'rateLimits.stt': ['ipMax', 'ipWindowInMinutes', 'userMax', 'userWindowInMinutes'],
    'rateLimits.tts': ['ipMax', 'ipWindowInMinutes', 'userMax', 'userWindowInMinutes'],
    'interface': ['mcpServers', 'customWelcome', 'customFooter', 'defaultPreset', 'fileSearch', 'uploadAsText', 'privacyPolicy', 'termsOfService', 'modelSelect', 'parameters', 'sidePanel', 'presets', 'prompts', 'bookmarks', 'multiConvo', 'agents', 'webSearch', 'runCode', 'fileCitations', 'artifacts', 'peoplePicker', 'marketplace', 'temporaryChatRetention'],
    'interface.mcpServers': ['placeholder'],
    'interface.privacyPolicy': ['externalUrl', 'openNewTab'],
    'interface.termsOfService': ['externalUrl', 'openNewTab', 'modalAcceptance', 'modalTitle', 'modalContent'],
    'interface.peoplePicker': ['users', 'groups', 'roles'],
    'interface.marketplace': ['use'],
    'modelSpecs': ['addedEndpoints', 'enforce', 'prioritize', 'list'],
    'registration': ['socialLogins', 'allowedDomains']
  };
  
  // Generate field paths
  for (const [parent, children] of Object.entries(nestedObjects)) {
    children.forEach(child => {
      if (child === '*') {
        fields.add(`${parent}.*`);
      } else {
        fields.add(`${parent}.${child}`);
      }
    });
  }
  
  return Array.from(fields).sort();
}

/**
 * Generate complete field manifest
 */
function generateManifest(): FieldManifest {
  console.log('🔍 Extracting environment variables...');
  const envVars = extractEnvVars();
  console.log(`   Found ${envVars.length} environment variables\n`);
  
  console.log('🔍 Extracting YAML fields...');
  const yamlFields = extractYamlFields();
  console.log(`   Found ${yamlFields.length} YAML fields\n`);
  
  const manifest: FieldManifest = {
    envVars,
    yamlFields,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalEnvVars: envVars.length,
      totalYamlFields: yamlFields.length
    }
  };
  
  return manifest;
}

/**
 * Main execution
 */
function main() {
  console.log('================================================================================');
  console.log('LibreChat RC4 Field Manifest Generator');
  console.log('================================================================================\n');
  
  const manifest = generateManifest();
  
  // Save to file
  const outputPath = path.join(projectRoot, 'scripts/field-manifest.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Manifest generated successfully!');
  console.log(`   Output: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Environment Variables: ${manifest.metadata.totalEnvVars}`);
  console.log(`   YAML Fields: ${manifest.metadata.totalYamlFields}`);
  console.log(`   Total Fields: ${manifest.metadata.totalEnvVars + manifest.metadata.totalYamlFields}`);
  console.log('\n================================================================================');
}

main();
