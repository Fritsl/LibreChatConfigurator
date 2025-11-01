import { SettingInput } from "./setting-input";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { useLibreChatDefault, setFieldOverride, resetToDefault } from "@/../../shared/config/field-overrides";
import type { Configuration } from "@shared/schema";

interface FieldOverrideSettingProps {
  fieldId: string;
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
  searchQuery?: string;
}

export function FieldOverrideSetting({
  fieldId,
  configuration,
  onConfigurationChange,
  searchQuery = "",
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
    if (field.yamlPath) {
      const keys = field.yamlPath.split('.');
      let current: any = configuration;
      for (const key of keys) {
        if (current === undefined || current === null) return field.defaultValue;
        current = current[key];
      }
      return current !== undefined ? current : field.defaultValue;
    }
    return (configuration as any)[actualFieldId] !== undefined 
      ? (configuration as any)[actualFieldId] 
      : field.defaultValue;
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
    const configWithValue = { ...configuration, ...updates };
    const configWithOverride = setFieldOverride(configWithValue, actualFieldId, false);
    onConfigurationChange(configWithOverride);
  };

  // Determine if field should be highlighted based on search query
  const shouldHighlight = searchQuery && (
    actualFieldId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.envKey?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.yamlPath?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map field descriptor type to SettingInput type
  const getInputType = (): any => {
    switch (field.type) {
      case 'boolean': return 'boolean';
      case 'number': return 'number';
      case 'string': return 'text';
      case 'array': return 'array';
      case 'object': return 'object';
      case 'enum': return 'select';
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
  );
}
