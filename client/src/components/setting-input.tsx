import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Eye, EyeOff, Plus, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MCPServersEditor } from "@/components/mcp-servers-editor";
import { WebSearchEditor } from "@/components/web-search-editor";
import { OAuthProvidersEditor } from "@/components/oauth-providers-editor";
import { MeiliSearchIntegrationEditor } from "@/components/meilisearch-integration-editor";
import { CachingIntegrationEditor } from "@/components/caching-integration-editor";

interface SettingInputProps {
  label: string;
  description?: string;
  docUrl?: string;
  docSection?: string;
  type: "text" | "number" | "password" | "boolean" | "select" | "textarea" | "array" | "object" | "mcp-servers" | "web-search" | "oauth-providers" | "meilisearch-integration" | "caching-integration";
  value: any;
  onChange: (value: any) => void;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  fieldName?: string;
  "data-testid"?: string;
}

export function SettingInput({
  label,
  description,
  docUrl,
  docSection,
  type,
  value,
  onChange,
  options = [],
  placeholder,
  min,
  max,
  step,
  fieldName,
  "data-testid": testId,
}: SettingInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [arrayItems, setArrayItems] = useState<string[]>(
    Array.isArray(value) ? value : []
  );

  const handleArrayChange = (items: string[]) => {
    setArrayItems(items);
    onChange(items);
  };

  const addArrayItem = (newItem: string) => {
    if (newItem.trim()) {
      const updatedItems = [...arrayItems, newItem.trim()];
      handleArrayChange(updatedItems);
    }
  };

  const removeArrayItem = (index: number) => {
    const updatedItems = arrayItems.filter((_, i) => i !== index);
    handleArrayChange(updatedItems);
  };

  const renderInput = () => {
    switch (type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={onChange}
              data-testid={testId}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger data-testid={testId}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            data-testid={testId}
          />
        );

      case "password":
        return (
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="pr-12 font-mono text-sm"
              data-testid={testId}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
              data-testid={`${testId}-toggle`}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        );

      case "array":
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {arrayItems.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeArrayItem(index)}
                    data-testid={`${testId}-remove-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={placeholder}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArrayItem(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                data-testid={`${testId}-add`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.querySelector(`[data-testid="${testId}-add"]`) as HTMLInputElement;
                  if (input) {
                    addArrayItem(input.value);
                    input.value = "";
                  }
                }}
                data-testid={`${testId}-add-button`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "mcp-servers":
        return (
          <MCPServersEditor
            value={value}
            onChange={onChange}
            data-testid={testId}
          />
        );

      case "web-search":
        return (
          <WebSearchEditor
            value={value}
            onChange={onChange}
            data-testid={testId}
          />
        );

      case "oauth-providers":
        return (
          <OAuthProvidersEditor
            value={value}
            onChange={onChange}
            data-testid={testId}
          />
        );

      case "meilisearch-integration":
        return (
          <MeiliSearchIntegrationEditor
            value={value}
            onChange={onChange}
            data-testid={testId}
          />
        );

      case "caching-integration":
        return (
          <CachingIntegrationEditor
            value={value}
            onChange={onChange}
            data-testid={testId}
          />
        );

      case "object":
        return (
          <div className="space-y-3">
            <Textarea
              value={typeof value === 'object' && value !== null 
                ? JSON.stringify(value, null, 2) 
                : value || "{}"}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(parsed);
                } catch {
                  // Keep the raw string if JSON is invalid
                  onChange(e.target.value);
                }
              }}
              placeholder={placeholder || '{"key": "value"}'}
              rows={6}
              className="font-mono text-sm"
              data-testid={testId}
            />
            <p className="text-xs text-muted-foreground">
              Enter valid JSON format. For fileStrategy, use: {`{"avatar": "local", "image": "s3", "document": "local"}`}
            </p>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            data-testid={testId}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            data-testid={testId}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {description && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-3">
                <p className="text-sm">{description}</p>
                {docUrl && (
                  <div className="border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-2"
                      onClick={() => window.open(docUrl, '_blank')}
                      data-testid={`${testId}-docs`}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {docSection ? `${docSection} Docs` : 'Learn More'}
                    </Button>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {renderInput()}
      {description && type !== "boolean" && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
