import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Users, Maximize2, Info, Zap } from "lucide-react";
import { useState } from "react";

interface UXPreset {
  id: "agents-only" | "standard";
  name: string;
  description: string;
  icon: any;
  color: string;
  settings: {
    "interface.endpointsMenu": boolean;
    "interface.modelSelect": boolean;
    "modelSpecs.list"?: any[];
  };
  requiresAgentId: boolean;
}

const PRESETS: UXPreset[] = [
  {
    id: "agents-only",
    name: "Agents-Only Mode",
    description: "Users can only interact with AI agents - no manual model or endpoint selection",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    requiresAgentId: false,
    settings: {
      "interface.endpointsMenu": false,
      "interface.modelSelect": false,
      "modelSpecs.list": [
        {
          name: "Agents",
          label: "Agents",
          preset: {
            endpoint: "agents",
            agent_id: ""
          }
        }
      ]
    }
  },
  {
    id: "standard",
    name: "Standard Mode",
    description: "Full-featured interface with all menus, model selection, and endpoint options",
    icon: Maximize2,
    color: "from-purple-500 to-pink-500",
    requiresAgentId: false,
    settings: {
      "interface.endpointsMenu": true,
      "interface.modelSelect": true,
      "modelSpecs.list": undefined
    }
  }
];

interface UserExperiencePresetsProps {
  currentMode?: string;
  configuration: any;
  onApplyPreset: (presetId: string, agentId?: string) => void;
}

export function UserExperiencePresets({ currentMode, configuration, onApplyPreset }: UserExperiencePresetsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentMode || "");
  const [agentId, setAgentId] = useState<string>("");

  const preset = PRESETS.find(p => p.id === selectedPreset);
  const isApplied = currentMode === selectedPreset;

  const handleApply = () => {
    if (!selectedPreset || !preset) return;

    onApplyPreset(selectedPreset, agentId);
  };

  const canApply = selectedPreset && (!preset?.requiresAgentId || agentId);

  return (
    <div className="space-y-6">
      <Alert data-testid="alert-ux-preset-info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Setup:</strong> Choose how users experience your LibreChat instance. Agents-Only restricts users to pre-configured agents, while Standard provides full control.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Choose User Experience Mode
          </CardTitle>
          <CardDescription>
            Select a configuration that matches your use case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset}>
            <div className="grid gap-4">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                
                return (
                  <div 
                    key={p.id} 
                    className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPreset(p.id)}
                    data-testid={`ux-preset-option-${p.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={p.id} id={p.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-5 w-5 bg-gradient-to-r ${p.color} text-transparent bg-clip-text`} />
                          <Label htmlFor={p.id} className="font-semibold text-base cursor-pointer">
                            {p.name}
                          </Label>
                          {isApplied && p.id === currentMode && (
                            <Badge variant="secondary" className="ml-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {p.id === "agents-only" && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                Endpoints Menu: Hidden
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Model Select: Hidden
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Agents Only
                              </Badge>
                            </>
                          )}
                          {p.id === "standard" && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                All Menus Visible
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Full Control
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {preset && preset.id === "agents-only" && (
        <Card>
          <CardHeader>
            <CardTitle>Optional: Default Agent</CardTitle>
            <CardDescription>
              Set a specific agent as the default for users (leave blank for user choice)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent ID (optional)</Label>
              <Input
                id="agentId"
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="agent_xyz123..."
                data-testid="input-preset-agentid"
              />
              <p className="text-xs text-muted-foreground">
                Get agent IDs from your LibreChat MongoDB <code className="bg-muted px-1 rounded">agents</code> collection. If left blank, users can choose from all available agents.
              </p>
            </div>

            <Button 
              onClick={handleApply} 
              disabled={!canApply}
              className="w-full"
              data-testid="button-apply-ux-preset"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply {preset.name}
            </Button>
          </CardContent>
        </Card>
      )}

      {preset && preset.id === "standard" && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Apply</CardTitle>
            <CardDescription>
              This will restore the standard LibreChat interface with all features enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleApply} 
              disabled={!canApply}
              className="w-full"
              data-testid="button-apply-ux-preset"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply {preset.name}
            </Button>
          </CardContent>
        </Card>
      )}

      {isApplied && (
        <Alert variant="default" className="bg-green-50 border-green-200" data-testid="alert-ux-preset-applied">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{preset?.name} is active!</strong> The interface has been configured. You can still customize individual settings below if needed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
