import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CapabilityMetadata {
  value: string;
  label: string;
  description: string;
  requiresConfig: boolean;
  settingsTab?: string;
  settingsLabel?: string;
  configFields?: string[];
}

const CAPABILITIES_METADATA: CapabilityMetadata[] = [
  {
    value: "execute_code",
    label: "Execute Code",
    description: "Allows agents to write and execute Python code for data analysis, calculations, and file processing.",
    requiresConfig: true,
    settingsTab: "code-interpreter",
    settingsLabel: "Code Interpreter",
    configFields: ["codeInterpreter.enabled"]
  },
  {
    value: "file_search",
    label: "File Search",
    description: "Enables agents to search through uploaded files using RAG (Retrieval-Augmented Generation).",
    requiresConfig: true,
    settingsTab: "rag-api",
    settingsLabel: "RAG API Configuration",
    configFields: ["ragAPI.url", "ragAPI.apiKey"]
  },
  {
    value: "actions",
    label: "Actions",
    description: "Allows agents to make HTTP requests to external APIs and services.",
    requiresConfig: true,
    settingsTab: "actions",
    settingsLabel: "Actions Configuration",
    configFields: ["actions.allowedDomains"]
  },
  {
    value: "tools",
    label: "Tools",
    description: "Enables custom tool integrations through MCP (Model Context Protocol) servers.",
    requiresConfig: true,
    settingsTab: "mcp-servers",
    settingsLabel: "MCP Servers",
    configFields: ["mcpServers"]
  },
  {
    value: "artifacts",
    label: "Artifacts (Generative UI)",
    description: "Allows agents to generate interactive UI components like charts, diagrams, and visualizations.",
    requiresConfig: true,
    settingsTab: "artifacts",
    settingsLabel: "Artifacts Configuration",
    configFields: ["artifacts.enabled"]
  },
  {
    value: "context",
    label: "Context (Upload as Text)",
    description: "Enables 'Upload as Text' feature for processing uploaded files as plain text context.",
    requiresConfig: false,
    settingsTab: "ui-visibility",
    settingsLabel: "UI/Visibility",
  },
  {
    value: "ocr",
    label: "OCR (Optical Character Recognition)",
    description: "Enables text extraction from images using Mistral OCR or custom OCR services.",
    requiresConfig: true,
    settingsTab: "ocr",
    settingsLabel: "OCR Configuration",
    configFields: ["ocr.apiKey", "ocr.strategy"]
  },
  {
    value: "chain",
    label: "Chain (Agent Chaining)",
    description: "Allows agents to call other agents, enabling complex multi-step workflows.",
    requiresConfig: false,
  },
  {
    value: "web_search",
    label: "Web Search",
    description: "Enables agents to search the web using Serper API or SearXNG for real-time information.",
    requiresConfig: true,
    settingsTab: "web-search",
    settingsLabel: "Web Search Configuration",
    configFields: ["webSearch.provider"]
  }
];

interface AgentCapabilitiesManagerProps {
  selectedCapabilities: string[];
  configuration: any;
  onCapabilitiesChange: (capabilities: string[]) => void;
  onNavigateToTab: (tabId: string) => void;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function AgentCapabilitiesManager({
  selectedCapabilities = [],
  configuration,
  onCapabilitiesChange,
  onNavigateToTab
}: AgentCapabilitiesManagerProps) {
  
  const getConfigStatus = (capability: CapabilityMetadata): "configured" | "needs-setup" | "optional" => {
    if (!capability.requiresConfig) {
      return "optional";
    }
    
    if (!capability.configFields || capability.configFields.length === 0) {
      return "optional";
    }
    
    // Check if ALL required fields are configured (use every, not some)
    const isConfigured = capability.configFields.every(field => {
      const value = getNestedValue(configuration, field);
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
    
    return isConfigured ? "configured" : "needs-setup";
  };
  
  const toggleCapability = (capabilityValue: string) => {
    const newCapabilities = selectedCapabilities.includes(capabilityValue)
      ? selectedCapabilities.filter(c => c !== capabilityValue)
      : [...selectedCapabilities, capabilityValue];
    onCapabilitiesChange(newCapabilities);
  };
  
  const handleConfigure = (capability: CapabilityMetadata) => {
    if (capability.settingsTab) {
      onNavigateToTab(capability.settingsTab);
    }
  };
  
  return (
    <div className="space-y-3" data-testid="agent-capabilities-manager">
      {CAPABILITIES_METADATA.map((capability) => {
        const isSelected = selectedCapabilities.includes(capability.value);
        const status = getConfigStatus(capability);
        
        return (
          <Card 
            key={capability.value} 
            className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-testid={`capability-card-${capability.value}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCapability(capability.value)}
                  className="mt-1"
                  data-testid={`checkbox-capability-${capability.value}`}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {capability.label}
                    </span>
                    
                    {status === "configured" && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                    
                    {status === "needs-setup" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Needs Setup
                      </Badge>
                    )}
                    
                    {status === "optional" && capability.requiresConfig && (
                      <Badge variant="secondary" className="text-xs">
                        <Info className="w-3 h-3 mr-1" />
                        Optional
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>
                </div>
                
                {capability.settingsTab && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigure(capability)}
                          className="shrink-0"
                          data-testid={`button-configure-${capability.value}`}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Jump to {capability.settingsLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
