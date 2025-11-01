/**
 * Field Overrides Management
 * 
 * This module provides utilities for managing which configuration fields should use
 * LibreChat's built-in defaults vs be explicitly set by the user.
 * 
 * **The 4-State Problem:**
 * Each field can be in one of these states:
 * 1. Explicitly ON (value=true, useDefault=false)
 * 2. Explicitly OFF (value=false, useDefault=false)
 * 3. Use LibreChat Default (useDefault=true, exports commented out)
 * 4. Reset to Default (function that sets value to known default + useDefault=false)
 */

import type { Configuration } from "@shared/schema";
import { FIELD_REGISTRY } from "./field-registry";

/**
 * Check if a field should use LibreChat's default (export commented)
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @returns true if field should use LibreChat default (export commented)
 */
export function useLibreChatDefault(config: Configuration, fieldId: string): boolean {
  // If fieldOverrides doesn't exist or field not in it, use default
  if (!config.fieldOverrides) return true;
  if (!(fieldId in config.fieldOverrides)) return true;
  
  // If explicitly marked: true = use default, false = use our value
  return config.fieldOverrides[fieldId] === true;
}

/**
 * Check if a field is explicitly set by the user (export uncommented)
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @returns true if field is explicitly set (should export uncommented)
 */
export function isExplicitlySet(config: Configuration, fieldId: string): boolean {
  // Field is explicit only if override exists and is false
  if (!config.fieldOverrides) return false;
  return config.fieldOverrides[fieldId] === false;
}

/**
 * Mark a field as explicitly set or using LibreChat default
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @param useDefault - true to use LibreChat default (comment out), false to use explicit value
 * @returns Updated configuration
 */
export function setFieldOverride(
  config: Configuration,
  fieldId: string,
  useDefault: boolean
): Configuration {
  return {
    ...config,
    fieldOverrides: {
      ...(config.fieldOverrides || {}),
      [fieldId]: useDefault,
    },
  };
}

/**
 * Get the effective value for a field, considering override settings
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @returns The value to use (either from config or LibreChat default)
 */
export function getEffectiveValue(config: Configuration, fieldId: string): any {
  // If using LibreChat default, return undefined (or registry default if known)
  if (useLibreChatDefault(config, fieldId)) {
    const field = FIELD_REGISTRY.find(f => f.id === fieldId);
    return field?.defaultValue;
  }
  
  // Otherwise return the config value
  const field = FIELD_REGISTRY.find(f => f.id === fieldId);
  if (!field) return undefined;
  
  // Handle nested values via yamlPath
  if (field.yamlPath) {
    return getNestedValue(config, field.yamlPath);
  }
  
  // Handle direct field access
  return (config as any)[fieldId];
}

/**
 * Reset a field to its LibreChat default value and mark as explicitly set
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @returns Updated configuration with field set to default and marked as explicit
 */
export function resetToDefault(config: Configuration, fieldId: string): Configuration {
  const field = FIELD_REGISTRY.find(f => f.id === fieldId);
  if (!field) return config;
  
  // Set value to known default
  let updatedConfig = { ...config };
  
  if (field.yamlPath) {
    updatedConfig = setNestedValue(updatedConfig, field.yamlPath, field.defaultValue);
  } else {
    (updatedConfig as any)[fieldId] = field.defaultValue;
  }
  
  // Mark as explicitly set (not using LibreChat default)
  // setFieldOverride handles undefined fieldOverrides internally
  return setFieldOverride(updatedConfig, fieldId, false);
}

/**
 * Mark all fields as using LibreChat defaults (for "Clear All" functionality)
 * @param config - The configuration object
 * @returns Updated configuration with all fields marked as using defaults
 */
export function clearAllOverrides(config: Configuration): Configuration {
  const allOverrides: Record<string, boolean> = {};
  
  // Mark all registry fields as using LibreChat default
  for (const field of FIELD_REGISTRY) {
    allOverrides[field.id] = true;
  }
  
  return {
    ...config,
    fieldOverrides: allOverrides,
  };
}

/**
 * Get list of fields that are explicitly set (not using LibreChat default)
 * @param config - The configuration object
 * @returns Array of field IDs that are explicitly set
 */
export function getExplicitlySetFields(config: Configuration): string[] {
  if (!config.fieldOverrides) return [];
  
  // Return fields where override exists and is false (explicitly set)
  return Object.entries(config.fieldOverrides)
    .filter(([_, useDefault]) => useDefault === false)
    .map(([fieldId, _]) => fieldId);
}

/**
 * Check if a field's current value differs from its LibreChat default
 * @param config - The configuration object
 * @param fieldId - The field identifier from registry
 * @returns true if current value differs from default
 */
export function valuesDiffer(config: Configuration, fieldId: string): boolean {
  const field = FIELD_REGISTRY.find(f => f.id === fieldId);
  if (!field) return false;
  
  const currentValue = field.yamlPath 
    ? getNestedValue(config, field.yamlPath)
    : (config as any)[fieldId];
  
  const defaultValue = field.defaultValue;
  
  // Deep equality check for objects/arrays
  if (typeof currentValue === 'object' && typeof defaultValue === 'object') {
    return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
  }
  
  return currentValue !== defaultValue;
}

// Helper functions for nested value access

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  
  return current;
}

function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current: any = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...current[key] };
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}
