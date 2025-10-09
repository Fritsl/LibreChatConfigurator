import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Configuration, CONFIG_VERSION } from "@shared/schema";
import { Download, X, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PreviewModalProps {
  configuration: Configuration;
  onClose: () => void;
  onGenerate: () => void;
}

export function PreviewModal({ configuration, onClose, onGenerate }: PreviewModalProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiRequest("POST", "/api/package/generate", {
          configuration,
          includeFiles: ["env", "yaml", "json"],
        });

        const data = await response.json() as { files: Record<string, string> };
        setFiles(data.files);
      } catch (err) {
        console.error("Error fetching preview:", err);
        setError("Failed to generate preview. Please try again.");
        toast({
          title: "Preview Error",
          description: "Could not generate configuration preview",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [configuration, toast]);

  const copyToClipboard = async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to Clipboard",
        description: `${filename} has been copied to your clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed", 
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Downloaded",
      description: `${filename} has been downloaded`,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Configuration Preview</DialogTitle>
              <DialogDescription>
                Preview your LibreChat configuration files before generating the deployment package
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={onGenerate} className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white">
                <Download className="h-4 w-4 mr-2" />
                Generate Package
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="env" className="h-full flex flex-col">
              <div className="px-6 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="env">Environment (.env)</TabsTrigger>
                  <TabsTrigger value="yaml">Configuration (librechat.yaml)</TabsTrigger>
                  <TabsTrigger value="json">LibreChat Configuration Settings (JSON)</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 min-h-0 px-6 pb-6">
                <TabsContent value="env" className="h-full mt-4" style={{ height: 'calc(100% - 1rem)' }}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Environment Configuration File</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(files[".env"] || "", ".env file")}
                          data-testid="button-copy-env"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(files[".env"] || "", "librechat.env", "text/plain")}
                          data-testid="button-download-env"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 rounded-md border">
                      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                        {files[".env"] || ""}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="yaml" className="h-full mt-4" style={{ height: 'calc(100% - 1rem)' }}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">YAML Configuration File</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(files["librechat.yaml"] || "", "librechat.yaml file")}
                          data-testid="button-copy-yaml"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(files["librechat.yaml"] || "", "librechat.yaml", "text/yaml")}
                          data-testid="button-download-yaml"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 rounded-md border">
                      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                        {files["librechat.yaml"] || ""}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="json" className="h-full mt-4" style={{ height: 'calc(100% - 1rem)' }}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">JSON Configuration Export</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(files["LibreChatConfigSettings.json"] || "", "LibreChat Configuration Settings (JSON)")}
                          data-testid="button-copy-json"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(files["LibreChatConfigSettings.json"] || "", `librechat-config-v${CONFIG_VERSION}.json`, "application/json")}
                          data-testid="button-download-json"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 rounded-md border">
                      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                        {files["LibreChatConfigSettings.json"] || ""}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
