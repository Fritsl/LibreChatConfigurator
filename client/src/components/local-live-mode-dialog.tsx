import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Globe } from "lucide-react";
import type { Configuration } from "@shared/schema";

interface LocalLiveModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
}

export function LocalLiveModeDialog({
  open,
  onOpenChange,
  configuration,
  onConfigurationChange,
}: LocalLiveModeDialogProps) {
  const [activeMode, setActiveMode] = useState<"local" | "live">(configuration.deploymentMode || "local");
  
  const localConfig = configuration.localModeConfig || {};
  const liveConfig = configuration.liveModeConfig || {};

  const handleLocalChange = (field: string, value: string) => {
    onConfigurationChange({
      localModeConfig: {
        ...localConfig,
        [field]: value,
      },
    });
  };

  const handleLiveChange = (field: string, value: string) => {
    onConfigurationChange({
      liveModeConfig: {
        ...liveConfig,
        [field]: value,
      },
    });
  };

  const handleModeSwitch = (mode: "local" | "live") => {
    setActiveMode(mode);
    
    // Get the configuration values from the selected mode
    const modeConfig = mode === "local" ? localConfig : liveConfig;
    
    // Apply the mode's values to the main configuration fields
    onConfigurationChange({
      deploymentMode: mode,
      domainClient: modeConfig.domainClient || configuration.domainClient,
      domainServer: modeConfig.domainServer || configuration.domainServer,
      mongoUri: modeConfig.mongoUri || configuration.mongoUri,
      mongoRootUsername: modeConfig.mongoRootUsername || configuration.mongoRootUsername,
      mongoRootPassword: modeConfig.mongoRootPassword || configuration.mongoRootPassword,
      mongoDbName: modeConfig.mongoDbName || configuration.mongoDbName,
    });
  };

  const fields = [
    { key: "domainClient", label: "Domain Client", env: "DOMAIN_CLIENT" },
    { key: "domainServer", label: "Domain Server", env: "DOMAIN_SERVER" },
    { key: "mongoUri", label: "MongoDB URI", env: "MONGO_URI" },
    { key: "mongoRootUsername", label: "MongoDB Root Username", env: "MONGO_ROOT_USERNAME" },
    { key: "mongoRootPassword", label: "MongoDB Root Password", env: "MONGO_ROOT_PASSWORD", type: "password" },
    { key: "mongoDbName", label: "MongoDB Database Name", env: "MONGO_DB_NAME" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Local / Live Deployment Configuration</DialogTitle>
          <DialogDescription>
            Configure separate settings for local development and live production environments.
            Switch between modes to apply the respective configuration values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
            <Button
              variant={activeMode === "local" ? "default" : "outline"}
              onClick={() => handleModeSwitch("local")}
              className="flex-1"
              data-testid="button-local-mode"
            >
              <Server className="mr-2 h-4 w-4" />
              Local Development
              {activeMode === "local" && <Badge className="ml-2 bg-green-500">Active</Badge>}
            </Button>
            <Button
              variant={activeMode === "live" ? "default" : "outline"}
              onClick={() => handleModeSwitch("live")}
              className="flex-1"
              data-testid="button-live-mode"
            >
              <Globe className="mr-2 h-4 w-4" />
              Live Production
              {activeMode === "live" && <Badge className="ml-2 bg-blue-500">Active</Badge>}
            </Button>
          </div>

          {/* Configuration Fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* Local Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Server className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">Local Development</h3>
              </div>
              {fields.map((field) => (
                <div key={`local-${field.key}`} className="space-y-2">
                  <Label htmlFor={`local-${field.key}`}>
                    {field.label}
                    <span className="text-xs text-muted-foreground ml-2">({field.env})</span>
                  </Label>
                  <Input
                    id={`local-${field.key}`}
                    type={field.type || "text"}
                    value={(localConfig as any)[field.key] || ""}
                    onChange={(e) => handleLocalChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    data-testid={`input-local-${field.key}`}
                  />
                </div>
              ))}
            </div>

            {/* Live Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Live Production</h3>
              </div>
              {fields.map((field) => (
                <div key={`live-${field.key}`} className="space-y-2">
                  <Label htmlFor={`live-${field.key}`}>
                    {field.label}
                    <span className="text-xs text-muted-foreground ml-2">({field.env})</span>
                  </Label>
                  <Input
                    id={`live-${field.key}`}
                    type={field.type || "text"}
                    value={(liveConfig as any)[field.key] || ""}
                    onChange={(e) => handleLiveChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    data-testid={`input-live-${field.key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>How it works:</strong> Configure values for both Local and Live environments. 
              When you switch modes, the active mode's values will override the main configuration fields 
              for DOMAIN_CLIENT, DOMAIN_SERVER, MONGO_URI, MONGO_ROOT_USERNAME, MONGO_ROOT_PASSWORD, and MONGO_DB_NAME.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
