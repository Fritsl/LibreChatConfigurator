import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Trash2, Network, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomEndpoint {
  name?: string;
  apiKey?: string;
  baseURL?: string;
  models?: {
    default?: string[];
    fetch?: boolean;
  };
  titleConvo?: boolean;
  titleModel?: string;
  titleMethod?: "completion" | "functions";
  summarize?: boolean;
  summaryModel?: string;
  forcePrompt?: boolean;
  modelDisplayLabel?: string;
  headers?: Record<string, string>;
}

interface CustomEndpointsEditorProps {
  value?: CustomEndpoint[];
  onChange: (value: CustomEndpoint[]) => void;
  "data-testid"?: string;
}

export function CustomEndpointsEditor({ value, onChange, "data-testid": testId }: CustomEndpointsEditorProps) {
  const [endpoints, setEndpoints] = useState<CustomEndpoint[]>([]);

  useEffect(() => {
    if (!value) {
      setEndpoints([]);
      return;
    }
    setEndpoints(Array.isArray(value) ? value : []);
  }, [value]);

  const updateEndpoints = (updatedEndpoints: CustomEndpoint[]) => {
    setEndpoints(updatedEndpoints);
    onChange(updatedEndpoints);
  };

  const addEndpoint = (template: "openai" | "ollama" | "custom" = "custom") => {
    let newEndpoint: CustomEndpoint;
    
    switch (template) {
      case "ollama":
        newEndpoint = {
          name: "Ollama",
          apiKey: "ollama",
          baseURL: "http://localhost:11434/v1/",
          models: {
            default: ["llama3:latest", "mistral:latest"],
            fetch: true
          },
          titleConvo: true,
          titleModel: "current_model",
          titleMethod: "completion",
          summarize: false,
          summaryModel: "current_model",
          forcePrompt: false,
          modelDisplayLabel: "Ollama",
          headers: {}
        };
        break;
      
      case "openai":
        newEndpoint = {
          name: "OpenAI",
          baseURL: "https://api.openai.com/v1",
          models: {
            default: ["gpt-4", "gpt-3.5-turbo"],
            fetch: false
          },
          titleConvo: true,
          titleMethod: "completion",
          summarize: false,
          forcePrompt: false,
          headers: {}
        };
        break;
      
      default:
        newEndpoint = {
          name: `Endpoint ${endpoints.length + 1}`,
          baseURL: "https://api.example.com/v1",
          models: {
            default: ["model-name"],
            fetch: false
          },
          titleConvo: true,
          titleMethod: "completion",
          summarize: false,
          forcePrompt: false,
          headers: {}
        };
    }
    
    updateEndpoints([...endpoints, newEndpoint]);
  };

  const removeEndpoint = (index: number) => {
    updateEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const updateEndpoint = (index: number, updates: Partial<CustomEndpoint>) => {
    const updatedEndpoints = endpoints.map((endpoint, i) => 
      i === index ? { ...endpoint, ...updates } : endpoint
    );
    updateEndpoints(updatedEndpoints);
  };

  const addModel = (endpointIndex: number) => {
    const endpoint = endpoints[endpointIndex];
    const models = endpoint.models?.default || [];
    updateEndpoint(endpointIndex, {
      models: {
        ...endpoint.models,
        default: [...models, `model-${models.length}`],
        fetch: endpoint.models?.fetch || false
      }
    });
  };

  const removeModel = (endpointIndex: number, modelIndex: number) => {
    const endpoint = endpoints[endpointIndex];
    const models = endpoint.models?.default || [];
    updateEndpoint(endpointIndex, {
      models: {
        ...endpoint.models,
        default: models.filter((_, i) => i !== modelIndex),
        fetch: endpoint.models?.fetch || false
      }
    });
  };

  const updateModel = (endpointIndex: number, modelIndex: number, value: string) => {
    const endpoint = endpoints[endpointIndex];
    const models = endpoint.models?.default || [];
    const updatedModels = models.map((m, i) => i === modelIndex ? value : m);
    updateEndpoint(endpointIndex, {
      models: {
        ...endpoint.models,
        default: updatedModels,
        fetch: endpoint.models?.fetch || false
      }
    });
  };

  const addHeader = (endpointIndex: number) => {
    const endpoint = endpoints[endpointIndex];
    const headers = endpoint.headers || {};
    const newKey = `header-${Object.keys(headers).length}`;
    updateEndpoint(endpointIndex, {
      headers: { ...headers, [newKey]: "" }
    });
  };

  const removeHeader = (endpointIndex: number, headerKey: string) => {
    const endpoint = endpoints[endpointIndex];
    const headers = { ...endpoint.headers };
    delete headers[headerKey];
    updateEndpoint(endpointIndex, { headers });
  };

  const updateHeader = (endpointIndex: number, oldKey: string, newKey: string, value: string) => {
    const endpoint = endpoints[endpointIndex];
    const headers = { ...endpoint.headers };
    
    if (oldKey !== newKey && headers.hasOwnProperty(oldKey)) {
      delete headers[oldKey];
    }
    headers[newKey] = value;
    
    updateEndpoint(endpointIndex, { headers });
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Create OpenAI-compatible endpoints - supports Ollama, custom APIs, and more
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              data-testid="button-add-custom-endpoint"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Endpoint
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => addEndpoint("ollama")} data-testid="menu-add-ollama">
              <Network className="h-4 w-4 mr-2" />
              Ollama (Local LLM)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addEndpoint("openai")} data-testid="menu-add-openai">
              <Network className="h-4 w-4 mr-2" />
              OpenAI Compatible
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addEndpoint("custom")} data-testid="menu-add-custom">
              <Network className="h-4 w-4 mr-2" />
              Custom Endpoint
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {endpoints.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Network className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No custom endpoints configured</p>
              <p className="text-xs text-muted-foreground">Click "Add Endpoint" to get started</p>
            </div>
          </CardContent>
        </Card>
      )}

      {endpoints.map((endpoint, endpointIndex) => (
        <Card key={endpointIndex}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {endpoint.name || `Endpoint ${endpointIndex + 1}`}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEndpoint(endpointIndex)}
                data-testid={`button-remove-endpoint-${endpointIndex}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor={`endpoint-name-${endpointIndex}`}>Endpoint Name *</Label>
              <Input
                id={`endpoint-name-${endpointIndex}`}
                value={endpoint.name || ""}
                onChange={(e) => updateEndpoint(endpointIndex, { name: e.target.value })}
                placeholder="e.g., OpenAI - Work, OpenAI - Personal"
                data-testid={`input-endpoint-name-${endpointIndex}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Friendly name to identify this endpoint (e.g., "OpenAI - Work")
              </p>
            </div>

            <Separator />

            {/* Base URL */}
            <div>
              <Label htmlFor={`endpoint-baseurl-${endpointIndex}`}>Base URL *</Label>
              <Input
                id={`endpoint-baseurl-${endpointIndex}`}
                value={endpoint.baseURL || ""}
                onChange={(e) => updateEndpoint(endpointIndex, { baseURL: e.target.value })}
                placeholder="https://api.openai.com/v1 or http://localhost:11434/v1/"
                data-testid={`input-endpoint-baseurl-${endpointIndex}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                OpenAI-compatible API endpoint URL (e.g., Ollama: http://localhost:11434/v1/)
              </p>
            </div>

            <Separator />

            {/* API Key */}
            <div>
              <Label htmlFor={`endpoint-apikey-${endpointIndex}`}>API Key</Label>
              <Input
                id={`endpoint-apikey-${endpointIndex}`}
                type="password"
                value={endpoint.apiKey || ""}
                onChange={(e) => updateEndpoint(endpointIndex, { apiKey: e.target.value })}
                placeholder="sk-... (use 'ollama' for Ollama endpoints)"
                data-testid={`input-endpoint-apikey-${endpointIndex}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                API key for authentication (Ollama accepts any value like "ollama")
              </p>
            </div>

            <Separator />

            {/* Models */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Default Models *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addModel(endpointIndex)}
                  data-testid={`button-add-model-${endpointIndex}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Model
                </Button>
              </div>
              
              <div className="space-y-2">
                {(endpoint.models?.default || []).map((model, modelIndex) => (
                  <div key={modelIndex} className="flex gap-2 items-center">
                    <Input
                      value={model}
                      onChange={(e) => updateModel(endpointIndex, modelIndex, e.target.value)}
                      placeholder="gpt-4, llama3:latest, mistral, etc."
                      data-testid={`input-model-${endpointIndex}-${modelIndex}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModel(endpointIndex, modelIndex)}
                      data-testid={`button-remove-model-${endpointIndex}-${modelIndex}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {(endpoint.models?.default || []).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No models configured</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <Switch
                  id={`fetch-models-${endpointIndex}`}
                  checked={endpoint.models?.fetch || false}
                  onCheckedChange={(checked) => updateEndpoint(endpointIndex, {
                    models: { ...endpoint.models, default: endpoint.models?.default || [], fetch: checked }
                  })}
                  data-testid={`switch-fetch-models-${endpointIndex}`}
                />
                <Label htmlFor={`fetch-models-${endpointIndex}`} className="text-sm font-normal">
                  Fetch models dynamically from endpoint
                </Label>
              </div>
            </div>

            <Separator />

            {/* HTTP Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Custom HTTP Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addHeader(endpointIndex)}
                  data-testid={`button-add-header-${endpointIndex}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Header
                </Button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(endpoint.headers || {}).map(([key, value], headerIndex) => (
                  <div key={`${key}-${headerIndex}`} className="flex gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => updateHeader(endpointIndex, key, e.target.value, value)}
                      placeholder="Header-Name"
                      className="flex-1"
                      data-testid={`input-header-key-${endpointIndex}-${headerIndex}`}
                    />
                    <Input
                      value={value}
                      onChange={(e) => updateHeader(endpointIndex, key, key, e.target.value)}
                      placeholder="header value"
                      className="flex-1"
                      data-testid={`input-header-value-${endpointIndex}-${headerIndex}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(endpointIndex, key)}
                      data-testid={`button-remove-header-${endpointIndex}-${headerIndex}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {Object.keys(endpoint.headers || {}).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No custom headers configured</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`title-convo-${endpointIndex}`}
                  checked={endpoint.titleConvo !== false}
                  onCheckedChange={(checked) => updateEndpoint(endpointIndex, { titleConvo: checked })}
                  data-testid={`switch-title-convo-${endpointIndex}`}
                />
                <Label htmlFor={`title-convo-${endpointIndex}`} className="text-sm font-normal">
                  Auto-title conversations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`summarize-${endpointIndex}`}
                  checked={endpoint.summarize || false}
                  onCheckedChange={(checked) => updateEndpoint(endpointIndex, { summarize: checked })}
                  data-testid={`switch-summarize-${endpointIndex}`}
                />
                <Label htmlFor={`summarize-${endpointIndex}`} className="text-sm font-normal">
                  Enable summarization
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`force-prompt-${endpointIndex}`}
                  checked={endpoint.forcePrompt || false}
                  onCheckedChange={(checked) => updateEndpoint(endpointIndex, { forcePrompt: checked })}
                  data-testid={`switch-force-prompt-${endpointIndex}`}
                />
                <Label htmlFor={`force-prompt-${endpointIndex}`} className="text-sm font-normal">
                  Force prompt usage
                </Label>
              </div>

              <div>
                <Label htmlFor={`title-method-${endpointIndex}`} className="text-sm">Title Method</Label>
                <Select
                  value={endpoint.titleMethod || "completion"}
                  onValueChange={(value: "completion" | "functions") => updateEndpoint(endpointIndex, { titleMethod: value })}
                >
                  <SelectTrigger id={`title-method-${endpointIndex}`} data-testid={`select-title-method-${endpointIndex}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="functions">Functions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`title-model-${endpointIndex}`}>Title Model</Label>
                <Input
                  id={`title-model-${endpointIndex}`}
                  value={endpoint.titleModel || ""}
                  onChange={(e) => updateEndpoint(endpointIndex, { titleModel: e.target.value })}
                  placeholder="gpt-3.5-turbo"
                  data-testid={`input-title-model-${endpointIndex}`}
                />
              </div>

              <div>
                <Label htmlFor={`summary-model-${endpointIndex}`}>Summary Model</Label>
                <Input
                  id={`summary-model-${endpointIndex}`}
                  value={endpoint.summaryModel || ""}
                  onChange={(e) => updateEndpoint(endpointIndex, { summaryModel: e.target.value })}
                  placeholder="gpt-3.5-turbo"
                  data-testid={`input-summary-model-${endpointIndex}`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`model-display-${endpointIndex}`}>Model Display Label</Label>
              <Input
                id={`model-display-${endpointIndex}`}
                value={endpoint.modelDisplayLabel || ""}
                onChange={(e) => updateEndpoint(endpointIndex, { modelDisplayLabel: e.target.value })}
                placeholder="Custom display name for models"
                data-testid={`input-model-display-${endpointIndex}`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
