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
                <>
                  <p>
                    Users must use your configured agents. Make sure you've set a valid <strong>agent ID</strong> in the <strong>Model Specs</strong> section below (Interface tab).
                  </p>
                  <p className="text-xs opacity-75">
                    Without a valid agent ID, users will be unable to chat.
                  </p>
                </>
              ) : (
                <p>
                  Users can select any model while you configure agents. Set an <strong>agent ID</strong> in <strong>Model Specs</strong> (Interface tab), then enable enforcement.
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
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
