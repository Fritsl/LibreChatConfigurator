import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Bot, Cloud, Sparkles, Settings, Plus, Zap } from "lucide-react";

interface EndpointSelectorEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  "data-testid"?: string;
}

interface EndpointOption {
  id: string;
  label: string;
  description?: string;
}

interface EndpointCategory {
  label: string;
  icon: any;
  endpoints: EndpointOption[];
}

const ENDPOINT_CATEGORIES: EndpointCategory[] = [
  {
    label: "Primary AI Providers",
    icon: Bot,
    endpoints: [
      {
        id: "openAI",
        label: "OpenAI",
        description: "ChatGPT, GPT-4, GPT-3.5"
      },
      {
        id: "anthropic",
        label: "Anthropic",
        description: "Claude, Claude Sonnet"
      },
      {
        id: "google",
        label: "Google",
        description: "Gemini, PaLM"
      }
    ]
  },
  {
    label: "Cloud AI Services",
    icon: Cloud,
    endpoints: [
      {
        id: "azureOpenAI",
        label: "Azure OpenAI",
        description: "Microsoft Azure hosted OpenAI"
      },
      {
        id: "bedrock",
        label: "AWS Bedrock",
        description: "Amazon Bedrock AI models"
      },
      {
        id: "vertexAI",
        label: "Vertex AI",
        description: "Google Cloud AI Platform"
      }
    ]
  },
  {
    label: "Advanced Features",
    icon: Sparkles,
    endpoints: [
      {
        id: "agents",
        label: "Agents",
        description: "AI agents with tools and actions"
      },
      {
        id: "assistants",
        label: "OpenAI Assistants",
        description: "OpenAI Assistants API"
      },
      {
        id: "gptPlugins",
        label: "ChatGPT Plugins",
        description: "ChatGPT plugin ecosystem"
      }
    ]
  },
  {
    label: "Custom & Open Source",
    icon: Settings,
    endpoints: [
      {
        id: "custom",
        label: "Custom Endpoints",
        description: "User-defined OpenAI-compatible APIs"
      }
    ]
  }
];

export function EndpointSelectorEditor({ value, onChange, "data-testid": testId }: EndpointSelectorEditorProps) {
  const [customEndpoint, setCustomEndpoint] = useState("");

  const currentEndpoints = value || [];

  const isEndpointSelected = (endpoint: EndpointOption): boolean => {
    return currentEndpoints.includes(endpoint.id);
  };

  const handleEndpointToggle = (endpoint: EndpointOption, checked: boolean) => {
    let newEndpoints: string[];
    
    if (checked) {
      newEndpoints = [...new Set([...currentEndpoints, endpoint.id])];
    } else {
      newEndpoints = currentEndpoints.filter(ep => ep !== endpoint.id);
    }
    
    onChange(newEndpoints);
  };

  const handleAddCustomEndpoint = () => {
    if (customEndpoint.trim() && !currentEndpoints.includes(customEndpoint.trim())) {
      onChange([...currentEndpoints, customEndpoint.trim()]);
      setCustomEndpoint("");
    }
  };

  const handleRemoveCustomEndpoint = (endpoint: string) => {
    const allKnownEndpoints = ENDPOINT_CATEGORIES.flatMap(cat => 
      cat.endpoints.map(ep => ep.id)
    );
    
    if (!allKnownEndpoints.includes(endpoint)) {
      onChange(currentEndpoints.filter(ep => ep !== endpoint));
    }
  };

  const customEndpoints = currentEndpoints.filter(endpoint => {
    const allKnownEndpoints = ENDPOINT_CATEGORIES.flatMap(cat => 
      cat.endpoints.map(ep => ep.id)
    );
    return !allKnownEndpoints.includes(endpoint);
  });

  const handleSelectAll = () => {
    const allEndpoints = ENDPOINT_CATEGORIES.flatMap(cat => 
      cat.endpoints.map(ep => ep.id)
    );
    onChange([...new Set([...currentEndpoints, ...allEndpoints])]);
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Choose which AI endpoints users can access
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          data-testid="button-select-all-endpoints"
        >
          <Zap className="h-4 w-4 mr-2" />
          Enable All Endpoints
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ENDPOINT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {category.label}
              </div>
              <div className="space-y-2 pl-6">
                {category.endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`${testId}-${endpoint.id}`}
                      checked={isEndpointSelected(endpoint)}
                      onCheckedChange={(checked) => handleEndpointToggle(endpoint, checked as boolean)}
                      data-testid={`checkbox-endpoint-${endpoint.id}`}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor={`${testId}-${endpoint.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {endpoint.label}
                      </Label>
                      {endpoint.description && (
                        <p className="text-xs text-muted-foreground">
                          {endpoint.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {customEndpoints.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Endpoints</Label>
          <div className="flex flex-wrap gap-2">
            {customEndpoints.map((endpoint) => (
              <div
                key={endpoint}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                data-testid={`custom-endpoint-${endpoint}`}
              >
                {endpoint}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomEndpoint(endpoint)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-custom-endpoint-${endpoint}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Add Custom Endpoint ID</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., myCustomEndpoint"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomEndpoint();
              }
            }}
            data-testid="input-custom-endpoint"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomEndpoint}
            disabled={!customEndpoint.trim()}
            data-testid="button-add-custom-endpoint"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For advanced users: Add custom endpoint IDs defined in your configuration
        </p>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <strong>Currently enabled:</strong> {currentEndpoints.length} endpoint{currentEndpoints.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
