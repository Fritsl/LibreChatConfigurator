/**
 * DYNAMIC SCHEMA DEFAULTS GENERATOR
 * 
 * Automatically generates configuration defaults from Zod schema definitions.
 * This replaces hardcoded defaults and ensures new schema fields are automatically included.
 */

import { z } from "zod";
import { configurationSchema, type Configuration } from "./schema";

/**
 * Generate defaults from a Zod schema recursively
 * Handles objects, arrays, optionals, defaults, enums, etc.
 */
export function generateSchemaDefaults(schema: z.ZodTypeAny, path: string = ""): any {
  // Unwrap optional and nullable
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return generateSchemaDefaults(schema.unwrap(), path);
  }

  // Use explicit defaults if defined
  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  }

  // Handle objects recursively
  if (schema instanceof z.ZodObject) {
    const result: any = {};
    const shape = schema.shape;
    for (const key in shape) {
      result[key] = generateSchemaDefaults(shape[key], `${path}.${key}`);
    }
    return result;
  }

  // Handle arrays
  if (schema instanceof z.ZodArray) {
    return []; // Empty array by default
  }

  // Handle records (dictionaries)
  if (schema instanceof z.ZodRecord) {
    return {}; // Empty object by default
  }

  // Handle unions - try to pick the first option
  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options;
    if (options && options.length > 0) {
      return generateSchemaDefaults(options[0], path);
    }
    return undefined;
  }

  // Handle enums - pick first value
  if (schema instanceof z.ZodEnum) {
    const values = schema._def.values;
    return values && values.length > 0 ? values[0] : undefined;
  }

  // Handle literals
  if (schema instanceof z.ZodLiteral) {
    return schema._def.value;
  }

  // Primitives - return type-appropriate defaults
  if (schema instanceof z.ZodString) {
    return "";
  }

  if (schema instanceof z.ZodNumber) {
    return 0;
  }

  if (schema instanceof z.ZodBoolean) {
    return false;
  }

  if (schema instanceof z.ZodDate) {
    return new Date();
  }

  // For anything else, return undefined (will be omitted from exports if optional)
  return undefined;
}

/**
 * Generate complete configuration defaults from schema
 * This is the dynamic replacement for hardcoded configuration-defaults.ts
 */
export function generateConfigurationDefaults(): Configuration {
  const generated = generateSchemaDefaults(configurationSchema) as Configuration;
  
  // Apply explicit overrides for better user experience
  const overrides: Partial<Configuration> = {
    // Version info (required)
    version: "0.8.0-rc4",
    
    // Cache enabled by default
    cache: true,
    
    // File strategy defaults
    fileStrategy: "local",
    
    // Registration defaults
    registration: {
      socialLogins: [],
      allowedDomains: []
    },
    
    // File config with sensible defaults
    fileConfig: {
      endpoints: {},
      serverFileSizeLimit: 20,
      avatarSizeLimit: 5,
      clientImageResize: {
        enabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.7,
        compressFormat: "webp" as const
      }
    },
    
    // Rate limiting defaults
    rateLimits: {
      fileUploads: {
        ipMax: 100,
        ipWindowInMinutes: 60,
        userMax: 50,
        userWindowInMinutes: 60
      }
    },
    
    // Model specs disabled by default (LibreChat RC4 bug workaround)
    modelSpecs: {
      addedEndpoints: []
    },
    
    // Web search defaults
    webSearch: {
      searchProvider: "none" as const,
      scraperType: "none" as const,
      rerankerType: "none" as const,
      scraperTimeout: 20000,
      safeSearch: false
    },
    
    // Memory defaults
    memory: {
      disabled: true,
      personalize: false,
      messageWindowSize: 5
    },
    
    // OCR defaults
    ocr: {
      strategy: "mistral_ocr",
      mistralModel: "pixtral-12b-2409"
    },
    
    // STT defaults
    stt: {
      provider: "openai",
      model: "whisper-1",
      streaming: false,
      punctuation: true,
      profanityFilter: false
    },
    
    // TTS defaults
    tts: {
      provider: "openai",
      model: "tts-1",
      voice: "alloy",
      speed: 1.0,
      quality: "standard",
      streaming: false
    },
    
    // Speech UI defaults
    speech: {
      speechTab: {
        conversationMode: false,
        advancedMode: false,
        speechToText: {
          engineSTT: "browser",
          languageSTT: "en-US",
          autoTranscribeAudio: false,
          decibelValue: -45,
          autoSendText: 0
        },
        textToSpeech: {
          engineTTS: "browser",
          voice: "alloy",
          languageTTS: "en",
          automaticPlayback: false,
          playbackRate: 1.0,
          cacheTTS: false
        }
      }
    },
    
    // Empty nested objects
    actions: {
      allowedDomains: []
    },
    mcpServers: {},
    endpoints: {}
  };
  
  // Deep merge generated defaults with overrides
  return deepMerge(generated, overrides);
}

/**
 * Deep merge utility for combining defaults
 */
export function deepMerge<T>(target: any, source: any): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (sourceValue === undefined) {
      continue;
    }
    
    if (
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  
  return result as T;
}

/**
 * Get current configuration defaults (cached)
 * Use this instead of importing configuration-defaults.ts
 */
let cachedDefaults: Configuration | null = null;

export function getConfigurationDefaults(): Configuration {
  if (!cachedDefaults) {
    cachedDefaults = generateConfigurationDefaults();
  }
  return { ...cachedDefaults }; // Return a copy to prevent mutations
}
