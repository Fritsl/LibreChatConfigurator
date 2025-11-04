import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Capability {
  id: string;
  label: string;
  description: string;
  category: 'core' | 'advanced' | 'experimental';
}

const CAPABILITIES: Capability[] = [
  {
    id: 'execute_code',
    label: 'Code Execution',
    description: 'Run Python code in a sandbox environment for analysis and computation',
    category: 'core'
  },
  {
    id: 'file_search',
    label: 'File Search (RAG)',
    description: 'Search uploaded files using vector embeddings and semantic search',
    category: 'core'
  },
  {
    id: 'context',
    label: 'Upload as Text',
    description: 'Parse document content (.docx, .pdf, .txt) directly into conversation',
    category: 'core'
  },
  {
    id: 'web_search',
    label: 'Web Search',
    description: 'Search the internet for real-time information',
    category: 'core'
  },
  {
    id: 'tools',
    label: 'Function Calling',
    description: 'Enable AI to call custom functions and tools',
    category: 'advanced'
  },
  {
    id: 'actions',
    label: 'Custom Actions',
    description: 'Use plugins and custom action integrations',
    category: 'advanced'
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    description: 'Create and render interactive artifacts (code, documents, visualizations)',
    category: 'advanced'
  },
  {
    id: 'ocr',
    label: 'OCR (Image Text)',
    description: 'Extract text from images using optical character recognition',
    category: 'advanced'
  },
  {
    id: 'chain',
    label: 'Chain of Thought',
    description: 'Enable step-by-step reasoning and multi-step workflows',
    category: 'experimental'
  }
];

interface CapabilitiesCheckboxEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function CapabilitiesCheckboxEditor({ 
  value = [], 
  onChange,
  disabled = false 
}: CapabilitiesCheckboxEditorProps) {
  const handleToggle = (capabilityId: string) => {
    if (disabled) return;
    
    const newValue = value.includes(capabilityId)
      ? value.filter(id => id !== capabilityId)
      : [...value, capabilityId];
    
    onChange(newValue);
  };

  const coreCapabilities = CAPABILITIES.filter(c => c.category === 'core');
  const advancedCapabilities = CAPABILITIES.filter(c => c.category === 'advanced');
  const experimentalCapabilities = CAPABILITIES.filter(c => c.category === 'experimental');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Core Capabilities */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-foreground">Core Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coreCapabilities.map(capability => (
              <div
                key={capability.id}
                className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`capability-${capability.id}`}
                  checked={value.includes(capability.id)}
                  onCheckedChange={() => handleToggle(capability.id)}
                  disabled={disabled}
                  data-testid={`checkbox-capability-${capability.id}`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`capability-${capability.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {capability.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{capability.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Capabilities */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-foreground">Advanced Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advancedCapabilities.map(capability => (
              <div
                key={capability.id}
                className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`capability-${capability.id}`}
                  checked={value.includes(capability.id)}
                  onCheckedChange={() => handleToggle(capability.id)}
                  disabled={disabled}
                  data-testid={`checkbox-capability-${capability.id}`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`capability-${capability.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {capability.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{capability.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experimental Capabilities */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-foreground flex items-center gap-2">
            Experimental Features
            <span className="text-xs font-normal text-muted-foreground">(May change in future versions)</span>
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {experimentalCapabilities.map(capability => (
              <div
                key={capability.id}
                className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`capability-${capability.id}`}
                  checked={value.includes(capability.id)}
                  onCheckedChange={() => handleToggle(capability.id)}
                  disabled={disabled}
                  data-testid={`checkbox-capability-${capability.id}`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`capability-${capability.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {capability.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{capability.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Helper text */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
          <p className="font-medium mb-1">💡 Tip:</p>
          <p>
            These capabilities control what features are available in the Agents endpoint. 
            Enable only the capabilities you need for your use case. Most users will want 
            at least <strong>Code Execution</strong>, <strong>File Search</strong>, and <strong>Upload as Text</strong>.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
