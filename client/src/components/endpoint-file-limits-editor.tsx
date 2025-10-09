import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Trash2, Settings } from "lucide-react";
import { useState, useEffect } from "react";

interface EndpointFileLimits {
  fileLimit?: number;
  fileSizeLimit?: number;
  totalSizeLimit?: number;
  supportedMimeTypes?: string[];
}

interface EndpointFileLimitsConfig {
  endpoints?: Record<string, EndpointFileLimits>;
}

interface EndpointFileLimitsEditorProps {
  value: EndpointFileLimitsConfig | null;
  onChange: (value: EndpointFileLimitsConfig) => void;
  "data-testid"?: string;
}

// Common AI endpoints that support file uploads
const AVAILABLE_ENDPOINTS = [
  { value: "openAI", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
  { value: "azureOpenAI", label: "Azure OpenAI" },
  { value: "gptPlugins", label: "GPT Plugins" },
  { value: "assistants", label: "Assistants API" },
  { value: "agents", label: "Agents" },
];

// Common MIME types for file uploads
const COMMON_MIME_TYPES = [
  { value: "text/plain", label: "Text (.txt)" },
  { value: "application/pdf", label: "PDF (.pdf)" },
  { value: "image/jpeg", label: "JPEG Image" },
  { value: "image/png", label: "PNG Image" },
  { value: "image/webp", label: "WebP Image" },
  { value: "image/gif", label: "GIF Image" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (.docx)" },
  { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel (.xlsx)" },
  { value: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "PowerPoint (.pptx)" },
  { value: "text/csv", label: "CSV (.csv)" },
  { value: "text/markdown", label: "Markdown (.md)" },
  { value: "application/json", label: "JSON (.json)" },
  { value: "text/html", label: "HTML (.html)" },
  { value: "text/xml", label: "XML (.xml)" },
  { value: "application/zip", label: "ZIP Archive" },
];

export function EndpointFileLimitsEditor({ value, onChange, "data-testid": testId }: EndpointFileLimitsEditorProps) {
  const [config, setConfig] = useState<EndpointFileLimitsConfig>({
    endpoints: {},
    ...value
  });

  const [customMimeType, setCustomMimeType] = useState<Record<string, string>>({});

  useEffect(() => {
    if (value) {
      setConfig({
        endpoints: {},
        ...value
      });
    }
  }, [value]);

  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  const addEndpoint = (endpointName: string) => {
    if (!endpointName || config.endpoints?.[endpointName]) return;
    
    setConfig(prev => ({
      ...prev,
      endpoints: {
        ...prev.endpoints,
        [endpointName]: {
          fileLimit: 5,
          fileSizeLimit: 10,
          totalSizeLimit: 50,
          supportedMimeTypes: ["text/plain", "application/pdf"],
        }
      }
    }));
  };

  const removeEndpoint = (endpointName: string) => {
    setConfig(prev => {
      const { [endpointName]: removed, ...rest } = prev.endpoints || {};
      return {
        ...prev,
        endpoints: rest
      };
    });
  };

  const updateEndpoint = (endpointName: string, updates: Partial<EndpointFileLimits>) => {
    setConfig(prev => ({
      ...prev,
      endpoints: {
        ...prev.endpoints,
        [endpointName]: {
          ...prev.endpoints?.[endpointName],
          ...updates
        }
      }
    }));
  };

  const addMimeType = (endpointName: string, mimeType: string) => {
    const endpoint = config.endpoints?.[endpointName];
    if (!endpoint || !mimeType) return;

    const currentTypes = endpoint.supportedMimeTypes || [];
    if (currentTypes.includes(mimeType)) return;

    updateEndpoint(endpointName, {
      supportedMimeTypes: [...currentTypes, mimeType]
    });

    // Clear custom input
    setCustomMimeType(prev => ({ ...prev, [endpointName]: "" }));
  };

  const removeMimeType = (endpointName: string, mimeType: string) => {
    const endpoint = config.endpoints?.[endpointName];
    if (!endpoint) return;

    const currentTypes = endpoint.supportedMimeTypes || [];
    updateEndpoint(endpointName, {
      supportedMimeTypes: currentTypes.filter(t => t !== mimeType)
    });
  };

  const configuredEndpoints = Object.keys(config.endpoints || {});
  const availableToAdd = AVAILABLE_ENDPOINTS.filter(
    endpoint => !configuredEndpoints.includes(endpoint.value)
  );

  return (
    <div className="space-y-6" data-testid={testId}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Per-Endpoint File Upload Limits</span>
        </div>
        <Badge variant="secondary">{configuredEndpoints.length} Endpoint(s) Configured</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure file upload limits and allowed MIME types for each AI endpoint. These settings override global limits for specific providers.
      </p>

      {/* Add Endpoint Section */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Add Endpoint Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select onValueChange={addEndpoint} value="">
              <SelectTrigger className="flex-1" data-testid="select-add-endpoint">
                <SelectValue placeholder="Select an endpoint to configure..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.length === 0 ? (
                  <SelectItem value="none" disabled>All endpoints configured</SelectItem>
                ) : (
                  availableToAdd.map(endpoint => (
                    <SelectItem key={endpoint.value} value={endpoint.value}>
                      {endpoint.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select an endpoint to configure its file upload limits and supported file types
          </p>
        </CardContent>
      </Card>

      {/* Configured Endpoints */}
      {configuredEndpoints.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No endpoints configured</p>
              <p className="text-xs text-muted-foreground">Add an endpoint above to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configuredEndpoints.map(endpointName => {
            const endpoint = config.endpoints![endpointName];
            const endpointLabel = AVAILABLE_ENDPOINTS.find(e => e.value === endpointName)?.label || endpointName;

            return (
              <Card key={endpointName} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      {endpointLabel}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEndpoint(endpointName)}
                      data-testid={`button-remove-endpoint-${endpointName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Limits */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`${endpointName}-file-limit`}>Max Files</Label>
                      <Input
                        id={`${endpointName}-file-limit`}
                        type="number"
                        value={endpoint.fileLimit || 5}
                        onChange={(e) => updateEndpoint(endpointName, { fileLimit: parseInt(e.target.value) || 5 })}
                        min="1"
                        max="100"
                        data-testid={`input-file-limit-${endpointName}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${endpointName}-file-size`}>File Size (MB)</Label>
                      <Input
                        id={`${endpointName}-file-size`}
                        type="number"
                        value={endpoint.fileSizeLimit || 10}
                        onChange={(e) => updateEndpoint(endpointName, { fileSizeLimit: parseInt(e.target.value) || 10 })}
                        min="1"
                        max="1000"
                        data-testid={`input-file-size-${endpointName}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${endpointName}-total-size`}>Total Size (MB)</Label>
                      <Input
                        id={`${endpointName}-total-size`}
                        type="number"
                        value={endpoint.totalSizeLimit || 50}
                        onChange={(e) => updateEndpoint(endpointName, { totalSizeLimit: parseInt(e.target.value) || 50 })}
                        min="1"
                        max="10000"
                        data-testid={`input-total-size-${endpointName}`}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* MIME Types */}
                  <div>
                    <Label className="mb-2 block">Supported File Types (MIME)</Label>
                    
                    {/* Current MIME Types */}
                    {endpoint.supportedMimeTypes && endpoint.supportedMimeTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {endpoint.supportedMimeTypes.map(mimeType => {
                          const commonType = COMMON_MIME_TYPES.find(t => t.value === mimeType);
                          return (
                            <Badge
                              key={mimeType}
                              variant="secondary"
                              className="flex items-center gap-1"
                              data-testid={`badge-mime-${endpointName}-${mimeType}`}
                            >
                              <span className="text-xs">{commonType?.label || mimeType}</span>
                              <button
                                onClick={() => removeMimeType(endpointName, mimeType)}
                                className="ml-1 hover:text-destructive"
                                data-testid={`button-remove-mime-${endpointName}-${mimeType}`}
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Add MIME Type */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => addMimeType(endpointName, value)}
                          value=""
                        >
                          <SelectTrigger className="flex-1" data-testid={`select-mime-type-${endpointName}`}>
                            <SelectValue placeholder="Add common file type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_MIME_TYPES.filter(
                              type => !endpoint.supportedMimeTypes?.includes(type.value)
                            ).map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Custom MIME Type */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Or enter custom MIME type..."
                          value={customMimeType[endpointName] || ""}
                          onChange={(e) => setCustomMimeType(prev => ({ ...prev, [endpointName]: e.target.value }))}
                          data-testid={`input-custom-mime-${endpointName}`}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const custom = customMimeType[endpointName];
                            if (custom) addMimeType(endpointName, custom);
                          }}
                          data-testid={`button-add-custom-mime-${endpointName}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Example: application/x-custom-format
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
