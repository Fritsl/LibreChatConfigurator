import { useState } from "react";
import { Clock, Package, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useConfigurationHistory } from "@/hooks/use-configuration-history";
import { useToast } from "@/hooks/use-toast";

export function ConfigurationHistory({ onConfigurationLoad }: { onConfigurationLoad?: (config: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { history, isLoading, loadConfiguration, isLoadingConfiguration } = useConfigurationHistory();
  const { toast } = useToast();

  const handleLoadConfiguration = (historyItem: any) => {
    loadConfiguration(historyItem.id, {
      onSuccess: (config) => {
        if (onConfigurationLoad) {
          // Include the packageName from history item with the configuration
          onConfigurationLoad({
            ...config,
            packageName: historyItem.packageName
          });
        }
        toast({
          title: "Configuration Loaded",
          description: `Loaded configuration from ${historyItem.packageName}`,
        });
        setIsOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to Load Configuration",
          description: "Could not load the selected configuration. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          data-testid="button-configuration-history"
        >
          <Clock className="h-4 w-4" />
          Package History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Download History
          </DialogTitle>
          <DialogDescription>
            Track and reload configurations from recently downloaded packages
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading configuration history...</div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-muted-foreground">No packages downloaded yet</div>
              <div className="text-sm text-muted-foreground mt-1">
                Use "Package → Generate & Download" to create your first package
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="transition-all hover:shadow-md"
                  data-testid={`card-config-history-${index}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">
                            {item.packageName}
                          </CardTitle>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getRelativeTime(item.timestamp)}
                          </span>
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleLoadConfiguration(item)}
                        disabled={isLoadingConfiguration}
                        className="gap-2 shrink-0"
                        data-testid={`button-load-config-${index}`}
                      >
                        <Download className="h-3 w-3" />
                        Load
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <div className="font-medium">Package Contents</div>
                        <div>LibreChat deployment files</div>
                      </div>
                      <div>
                        <div className="font-medium">Generated Files</div>
                        <div>.env, librechat.yaml, Docker setup</div>
                      </div>
                      <div>
                        <div className="font-medium">Configuration Fields</div>
                        <div>{Object.keys(item.configuration || {}).length} fields configured</div>
                      </div>
                      <div>
                        <div className="font-medium">Package Type</div>
                        <div>Complete deployment package</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}