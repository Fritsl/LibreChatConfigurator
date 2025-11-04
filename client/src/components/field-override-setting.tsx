import { SettingInput } from "./setting-input";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { useLibreChatDefault, setFieldOverride, resetToDefault } from "@/../../shared/config/field-overrides";
import type { Configuration } from "@shared/schema";
import { deepMerge } from "@/lib/merge-utils";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface FieldOverrideSettingProps {
  fieldId: string;
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
  searchQuery?: string;
  onNavigateToFieldStates?: () => void;
}

export function FieldOverrideSetting({
  fieldId,
  configuration,
  onConfigurationChange,
  searchQuery = "",
  onNavigateToFieldStates,
}: FieldOverrideSettingProps) {
  // Try to find field by id first, then by yamlPath
  let field = FIELD_REGISTRY.find(f => f.id === fieldId);
  
  if (!field) {
    // Try to find by yamlPath
    field = FIELD_REGISTRY.find(f => f.yamlPath === fieldId);
  }
  
  // Use the actual field.id for all operations, not the passed fieldId
  const actualFieldId = field?.id || fieldId;
  
  if (!field) {
    console.error(`Field not found in registry: ${fieldId}`);
    return null;
  }

  // Get current value from configuration
  const getCurrentValue = (): any => {
    // Try nested yamlPath first (if it exists)
    if (field.yamlPath) {
      const keys = field.yamlPath.split('.');
      let current: any = configuration;
      for (const key of keys) {
        if (current === undefined || current === null) break;
        current = current[key];
      }
      if (current !== undefined) return current;
    }
    
    // Fall back to flat field ID
    const flatValue = (configuration as any)[actualFieldId];
    return flatValue !== undefined ? flatValue : field.defaultValue;
  };

  const currentValue = getCurrentValue();
  const isUsingDefault = useLibreChatDefault(configuration, actualFieldId);

  // Handler to toggle between using default and explicit value
  const handleSetUseDefault = (useDefault: boolean) => {
    const updatedConfig = setFieldOverride(configuration, actualFieldId, useDefault);
    onConfigurationChange(updatedConfig);
  };

  // Handler to reset field to default value and mark as explicit
  const handleResetToDefault = () => {
    const updatedConfig = resetToDefault(configuration, actualFieldId);
    onConfigurationChange(updatedConfig);
  };

  // Handler for value changes
  const handleValueChange = (newValue: any) => {
    let updates: Partial<Configuration> = {};
    
    if (field.yamlPath) {
      const keys = field.yamlPath.split('.');
      const nested: any = {};
      let current = nested;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = newValue;
      
      updates = nested;
    } else {
      updates[actualFieldId as keyof Configuration] = newValue;
    }
    
    // When user changes a value, automatically mark it as explicit
    // Use deep merge to preserve sibling properties in nested objects
    const configWithValue = deepMerge(configuration, updates);
    const configWithOverride = setFieldOverride(configWithValue, actualFieldId, false);
    onConfigurationChange(configWithOverride);
  };

  // Determine if field should be highlighted based on search query
  const shouldHighlight = !!(searchQuery && (
    actualFieldId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.envKey?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.yamlPath?.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  // Map field descriptor type to SettingInput type
  const getInputType = (): any => {
    switch (field.type) {
      case 'boolean': return 'boolean';
      case 'number': return 'number';
      case 'string': return 'text';
      case 'array': return 'array';
      case 'object': return 'object';
      case 'enum': return 'select';
      // Pass through custom component types directly
      case 'custom-endpoints': return 'custom-endpoints';
      case 'mcp-servers': return 'mcp-servers';
      case 'web-search': return 'web-search';
      case 'oauth-providers': return 'oauth-providers';
      case 'meilisearch-integration': return 'meilisearch-integration';
      case 'caching-integration': return 'caching-integration';
      case 'file-storage': return 'file-storage';
      case 'email-composite': return 'email-composite';
      case 'endpoint-file-limits': return 'endpoint-file-limits';
      case 'file-types': return 'file-types';
      default: return 'text';
    }
  };

  // Build technical info for the info popover
  const technical = field.envKey || field.yamlPath ? {
    envVar: field.envKey,
    yamlPath: field.yamlPath,
    configFile: (field.exportToEnv && field.exportToYaml 
      ? ".env & librechat.yaml" 
      : field.exportToEnv 
        ? ".env" 
        : "librechat.yaml") as ".env" | "librechat.yaml" | ".env & librechat.yaml",
  } : undefined;

  return (
    <div className="space-y-2" data-field-id={actualFieldId}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <SettingInput
            label={actualFieldId}
            description={field.description}
            type={getInputType()}
            value={currentValue}
            onChange={handleValueChange}
            options={field.enumValues as any}
            min={field.min}
            max={field.max}
            fieldName={actualFieldId}
            data-testid={`setting-${actualFieldId}`}
            technical={technical}
            highlighted={shouldHighlight}
          />
        </div>
        {onNavigateToFieldStates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToFieldStates}
            className="mt-1 flex-shrink-0"
            title="View in Field States Manager"
            data-testid={`navigate-to-field-states-${actualFieldId}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
