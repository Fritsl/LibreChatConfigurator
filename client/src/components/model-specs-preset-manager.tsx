import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Info } from "lucide-react";

interface ModelSpecPreset {
  name: string;
  label?: string;
  description?: string;
  default?: boolean;
  preset: {
    endpoint: string;
    agent_id?: string;
  };
}

interface ModelSpecsPresetManagerProps {
  presets: ModelSpecPreset[];
  onChange: (presets: ModelSpecPreset[]) => void;
}

const ENDPOINT_OPTIONS = [
  { value: "openAI", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "azureOpenAI", label: "Azure OpenAI" },
  { value: "assistants", label: "Assistants" },
  { value: "agents", label: "Agents" },
  { value: "groq", label: "Groq" },
  { value: "openRouter", label: "OpenRouter" },
  { value: "mistral", label: "Mistral" },
  { value: "xAI", label: "xAI" },
  { value: "perplexity", label: "Perplexity" },
  { value: "deepseek", label: "Deepseek" },
  { value: "bedrock", label: "Bedrock" },
  { value: "cohere", label: "Cohere" },
  { value: "ollama", label: "Ollama" },
  { value: "localAI", label: "LocalAI" },
  { value: "gptPlugins", label: "GPT Plugins" },
];

export function ModelSpecsPresetManager({ presets = [], onChange }: ModelSpecsPresetManagerProps) {
  const addPreset = () => {
    const newPreset: ModelSpecPreset = {
      name: "",
      label: "",
      description: "",
      default: false,
      preset: {
        endpoint: "agents",
        agent_id: "",
      },
    };
    onChange([...presets, newPreset]);
  };

  const removePreset = (index: number) => {
    onChange(presets.filter((_, i) => i !== index));
  };

  const updatePreset = (index: number, field: string, value: string | boolean) => {
    const updated = [...presets];
    if (field === "name") {
      updated[index].name = value as string;
    } else if (field === "label") {
      updated[index].label = value as string;
    } else if (field === "description") {
      updated[index].description = value as string;
    } else if (field === "default") {
      updated[index].default = value as boolean;
    } else if (field === "endpoint") {
      updated[index].preset.endpoint = value as string;
    } else if (field === "agent_id") {
      updated[index].preset.agent_id = value as string;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Alert data-testid="alert-modelspecs-info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Model Specs Presets:</strong> Configure preset endpoints to control what users see. 
          For agents-only mode: set <code>endpoint: "agents"</code> and optionally add an <code>agent_id</code> to make it the default. 
          Get agent IDs from your LibreChat MongoDB → agents collection.
        </AlertDescription>
      </Alert>

      {presets.map((preset, index) => (
        <Card key={index} data-testid={`card-preset-${index}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preset {index + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePreset(index)}
                data-testid={`button-remove-preset-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`preset-${index}-name`}>Name *</Label>
                <Input
                  id={`preset-${index}-name`}
                  value={preset.name}
                  onChange={(e) => updatePreset(index, "name", e.target.value)}
                  placeholder="Agents"
                  data-testid={`input-preset-name-${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`preset-${index}-label`}>Label (optional)</Label>
                <Input
                  id={`preset-${index}-label`}
                  value={preset.label || ""}
                  onChange={(e) => updatePreset(index, "label", e.target.value)}
                  placeholder="Agents"
                  data-testid={`input-preset-label-${index}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`preset-${index}-description`}>Description (optional)</Label>
              <Input
                id={`preset-${index}-description`}
                value={preset.description || ""}
                onChange={(e) => updatePreset(index, "description", e.target.value)}
                placeholder="AI Agents for complex tasks"
                data-testid={`input-preset-description-${index}`}
              />
              <p className="text-xs text-muted-foreground">
                Shown to users when selecting this model spec
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`preset-${index}-endpoint`}>Endpoint *</Label>
                <Select
                  value={preset.preset.endpoint}
                  onValueChange={(value) => updatePreset(index, "endpoint", value)}
                >
                  <SelectTrigger id={`preset-${index}-endpoint`} data-testid={`select-preset-endpoint-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`preset-${index}-agent-id`}>Agent ID (optional)</Label>
                <Input
                  id={`preset-${index}-agent-id`}
                  value={preset.preset.agent_id || ""}
                  onChange={(e) => updatePreset(index, "agent_id", e.target.value)}
                  placeholder="agent_xyz123..."
                  data-testid={`input-preset-agent-id-${index}`}
                />
                <p className="text-xs text-muted-foreground">
                  For default agent selection (agents endpoint only)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`preset-${index}-default`}
                checked={preset.default || false}
                onCheckedChange={(checked) => updatePreset(index, "default", !!checked)}
                data-testid={`checkbox-preset-default-${index}`}
              />
              <Label htmlFor={`preset-${index}-default`} className="cursor-pointer">
                Set as default (auto-select for new chats)
              </Label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={addPreset}
        className="w-full"
        data-testid="button-add-preset"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Preset
      </Button>
    </div>
  );
}
