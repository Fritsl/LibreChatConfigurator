import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from "lucide-react";
import type { Configuration } from "@shared/schema";

interface AgentEnforcementWarningProps {
  configuration: Configuration;
  onToggleEnforce: (value: boolean) => void;
}

export function AgentEnforcementWarning({ configuration, onToggleEnforce }: AgentEnforcementWarningProps) {
  const isEnforced = configuration.modelSpecs?.enforce ?? false;
  
  return (
    <div className="max-w-full mx-auto px-6 py-4">
      <Alert 
        variant={isEnforced ? "destructive" : "default"}
        className="border-2"
        data-testid="alert-agent-enforcement"
      >
        <div className="flex items-start gap-4">
          {isEnforced ? (
            <AlertTriangle className="h-5 w-5 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 mt-0.5" />
          )}
          
          <div className="flex-1 space-y-2">
            <AlertTitle className="text-base font-semibold">
              {isEnforced ? "⚠️ Agent Enforcement Active" : "ℹ️ Agents-Only Mode"}
            </AlertTitle>
            
            <AlertDescription className="text-sm space-y-2">
              {isEnforced ? (
                <p>
                  <strong>Users can ONLY access agents you've created.</strong> They cannot select
                  regular AI models. If you haven't configured valid agents with IDs in the Model Specs
                  section below, users will be locked out and unable to chat.
                </p>
              ) : (
                <p>
                  You're in Agents-Only Mode, but enforcement is disabled. Users can still select 
                  regular AI models while you set up your agents. Enable enforcement once you've 
                  configured at least one valid agent with an agent ID.
                </p>
              )}
              
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="enforce-toggle"
                  checked={isEnforced}
                  onCheckedChange={onToggleEnforce}
                  data-testid="switch-enforce-agents"
                />
                <Label 
                  htmlFor="enforce-toggle" 
                  className="text-sm font-medium cursor-pointer"
                >
                  {isEnforced ? "Disable" : "Enable"} agent enforcement
                </Label>
              </div>
              
              {!isEnforced && (
                <p className="text-xs opacity-75 mt-2">
                  <strong>Tip:</strong> Create and test your agents first, then enable enforcement
                  to restrict users to agents-only access.
                </p>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
